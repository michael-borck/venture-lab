use tauri::{command, Manager};
use serde::{Deserialize, Serialize};
use reqwest;
use tokio;

mod settings;
mod ai_providers;
mod secure_storage;
mod prompts;
mod usage_tracking;
mod error_handling;
mod key_validation;

use settings::{AppSettings, AIProviderConfig};
use ai_providers::{AIRequest, AIResponse, create_provider, AIProvider};
use secure_storage::{ApiKeyInfo};
use prompts::{PromptCollection, ToolPrompt};

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub temperature: f32,
    pub tool_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub content: String,
    pub provider: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaOptions {
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaResponse {
    response: String,
}

#[command]
async fn save_settings(settings: AppSettings, app_handle: tauri::AppHandle) -> Result<(), String> {
    settings::save_settings(&app_handle, &settings)
        .await
        .map_err(|e| format!("Failed to save settings: {}", e))
}

#[command]
async fn load_settings(app_handle: tauri::AppHandle) -> Result<AppSettings, String> {
    let settings = settings::load_settings(&app_handle)
        .await
        .map_err(|e| format!("Failed to load settings: {}", e))?;

    // Check for migration from old format
    let settings_path = settings::get_settings_path(&app_handle)
        .map_err(|e| format!("Failed to get settings path: {}", e))?;
    
    if settings_path.exists() {
        let contents = std::fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;
        
        if let Ok(old_settings) = serde_json::from_str::<serde_json::Value>(&contents) {
            if let Ok(migrated) = secure_storage::migrate_api_keys_from_settings(&old_settings) {
                if !migrated.is_empty() {
                    println!("Migrated API keys for providers: {:?}", migrated);
                    // Optionally save settings again to remove old keys from file
                    let _ = settings::save_settings(&app_handle, &settings).await;
                }
            }
        }
    }

    Ok(settings)
}

// Secure API Key Management Commands

#[command]
async fn store_api_key(provider: String, api_key: String) -> Result<(), String> {
    secure_storage::store_api_key(&provider, &api_key)
}

#[command]
async fn retrieve_api_key(provider: String) -> Result<Option<String>, String> {
    secure_storage::retrieve_api_key(&provider)
}

#[command]
async fn delete_api_key(provider: String) -> Result<(), String> {
    secure_storage::delete_api_key(&provider)
}

#[command]
async fn check_api_key_exists(provider: String) -> Result<bool, String> {
    secure_storage::check_api_key_exists(&provider)
}

#[command]
async fn get_all_api_key_status() -> Result<std::collections::HashMap<String, ApiKeyInfo>, String> {
    secure_storage::get_all_api_key_status()
}

#[command]
async fn test_keychain_access() -> Result<(), String> {
    secure_storage::test_keychain_access()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub error: Option<String>,
    pub models: Option<Vec<String>>,
}

#[command]
async fn test_provider_connection(
    provider_type: String,
    app_handle: tauri::AppHandle,
) -> Result<ConnectionTestResult, String> {
    let settings = settings::load_settings(&app_handle)
        .await
        .map_err(|e| format!("Failed to load settings: {}", e))?;
    
    let provider = settings.get_provider(&provider_type)
        .ok_or_else(|| format!("Unknown provider: {}", provider_type))?;
    
    test_connection(provider).await
}

#[command]
async fn test_custom_provider_connection(
    provider_config: AIProviderConfig,
) -> Result<ConnectionTestResult, String> {
    test_connection(&provider_config).await
}

async fn test_connection(provider: &AIProviderConfig) -> Result<ConnectionTestResult, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    match provider.provider_type.as_str() {
        "openai" => test_openai_connection(&client, provider).await,
        "anthropic" => test_anthropic_connection(&client, provider).await,
        "gemini" => test_gemini_connection(&client, provider).await,
        "ollama" => test_ollama_connection(&client, provider).await,
        _ => Ok(ConnectionTestResult {
            success: false,
            error: Some("Unsupported provider type".to_string()),
            models: None,
        }),
    }
}

async fn test_openai_connection(
    client: &reqwest::Client,
    provider: &AIProviderConfig,
) -> Result<ConnectionTestResult, String> {
    let api_key = match secure_storage::retrieve_api_key(&provider.provider_type) {
        Ok(Some(key)) => key,
        Ok(None) => return Ok(ConnectionTestResult {
            success: false,
            error: Some("API key is required for OpenAI".to_string()),
            models: None,
        }),
        Err(e) => return Ok(ConnectionTestResult {
            success: false,
            error: Some(format!("Failed to retrieve API key: {}", e)),
            models: None,
        }),
    };

    let url = format!("{}/models", provider.base_url);
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await;

    match response {
        Ok(resp) if resp.status().is_success() => {
            let models = extract_openai_models(resp).await.unwrap_or_default();
            Ok(ConnectionTestResult {
                success: true,
                error: None,
                models: Some(models),
            })
        }
        Ok(resp) => {
            let error_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            Ok(ConnectionTestResult {
                success: false,
                error: Some(format!("API error: {}", error_text)),
                models: None,
            })
        }
        Err(e) => Ok(ConnectionTestResult {
            success: false,
            error: Some(format!("Connection failed: {}", e)),
            models: None,
        }),
    }
}

async fn test_anthropic_connection(
    client: &reqwest::Client,
    provider: &AIProviderConfig,
) -> Result<ConnectionTestResult, String> {
    let api_key = match secure_storage::retrieve_api_key(&provider.provider_type) {
        Ok(Some(key)) => key,
        Ok(None) => return Ok(ConnectionTestResult {
            success: false,
            error: Some("API key is required for Anthropic".to_string()),
            models: None,
        }),
        Err(e) => return Ok(ConnectionTestResult {
            success: false,
            error: Some(format!("Failed to retrieve API key: {}", e)),
            models: None,
        }),
    };

    // Anthropic doesn't have a models endpoint, so we test with a simple message
    let test_payload = serde_json::json!({
        "model": "claude-3-haiku-20240307",
        "max_tokens": 1,
        "messages": [{"role": "user", "content": "test"}]
    });

    let url = format!("{}/v1/messages", provider.base_url);
    let response = client
        .post(&url)
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&test_payload)
        .send()
        .await;

    match response {
        Ok(resp) if resp.status().is_success() => Ok(ConnectionTestResult {
            success: true,
            error: None,
            models: Some(vec![
                "claude-3-opus-20240229".to_string(),
                "claude-3-sonnet-20240229".to_string(),
                "claude-3-haiku-20240307".to_string(),
            ]),
        }),
        Ok(resp) => {
            let error_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            Ok(ConnectionTestResult {
                success: false,
                error: Some(format!("API error: {}", error_text)),
                models: None,
            })
        }
        Err(e) => Ok(ConnectionTestResult {
            success: false,
            error: Some(format!("Connection failed: {}", e)),
            models: None,
        }),
    }
}

async fn test_gemini_connection(
    client: &reqwest::Client,
    provider: &AIProviderConfig,
) -> Result<ConnectionTestResult, String> {
    let api_key = match secure_storage::retrieve_api_key(&provider.provider_type) {
        Ok(Some(key)) => key,
        Ok(None) => return Ok(ConnectionTestResult {
            success: false,
            error: Some("API key is required for Gemini".to_string()),
            models: None,
        }),
        Err(e) => return Ok(ConnectionTestResult {
            success: false,
            error: Some(format!("Failed to retrieve API key: {}", e)),
            models: None,
        }),
    };

    let url = format!("{}/models?key={}", provider.base_url, api_key);
    let response = client.get(&url).send().await;

    match response {
        Ok(resp) if resp.status().is_success() => {
            let models = extract_gemini_models(resp).await.unwrap_or_default();
            Ok(ConnectionTestResult {
                success: true,
                error: None,
                models: Some(models),
            })
        }
        Ok(resp) => {
            let error_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            Ok(ConnectionTestResult {
                success: false,
                error: Some(format!("API error: {}", error_text)),
                models: None,
            })
        }
        Err(e) => Ok(ConnectionTestResult {
            success: false,
            error: Some(format!("Connection failed: {}", e)),
            models: None,
        }),
    }
}

async fn test_ollama_connection(
    client: &reqwest::Client,
    provider: &AIProviderConfig,
) -> Result<ConnectionTestResult, String> {
    let url = format!("{}/api/tags", provider.base_url);
    println!("Testing Ollama connection to: {}", url); // Debug log
    
    // Check for optional bearer token (for proxied Ollama servers)
    let mut request = client.get(&url);
    if let Ok(Some(bearer_token)) = secure_storage::retrieve_api_key(&provider.provider_type) {
        println!("Using bearer token for Ollama authentication");
        request = request.header("Authorization", format!("Bearer {}", bearer_token));
    }
    
    let response = request.send().await;

    match response {
        Ok(resp) if resp.status().is_success() => {
            println!("Ollama connection successful, status: {}", resp.status()); // Debug log
            let models = extract_ollama_models(resp).await.unwrap_or_default();
            Ok(ConnectionTestResult {
                success: true,
                error: None,
                models: Some(models),
            })
        }
        Ok(resp) => {
            let status = resp.status();
            let error_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            println!("Ollama connection failed, status: {}, error: {}", status, error_text); // Debug log
            Ok(ConnectionTestResult {
                success: false,
                error: Some(format!("Server responded with status {}: {}", status, error_text)),
                models: None,
            })
        }
        Err(e) => {
            println!("Ollama connection error: {}", e); // Debug log
            Ok(ConnectionTestResult {
                success: false,
                error: Some(format!("Connection failed: {}", e)),
                models: None,
            })
        }
    }
}

async fn extract_openai_models(response: reqwest::Response) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let json: serde_json::Value = response.json().await?;
    let models = json["data"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|model| model["id"].as_str())
        .map(|s| s.to_string())
        .collect();
    Ok(models)
}

async fn extract_gemini_models(response: reqwest::Response) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let json: serde_json::Value = response.json().await?;
    let models = json["models"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|model| model["name"].as_str())
        .map(|s| s.to_string())
        .collect();
    Ok(models)
}

async fn extract_ollama_models(response: reqwest::Response) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let json: serde_json::Value = response.json().await?;
    let models = json["models"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|model| model["name"].as_str())
        .map(|s| s.to_string())
        .collect();
    Ok(models)
}

#[command]
async fn generate_ai_response_v2(
    request: AIRequest,
    app_handle: tauri::AppHandle,
) -> Result<AIResponse, String> {
    let start_time = std::time::Instant::now();
    
    let settings = settings::load_settings(&app_handle)
        .await
        .map_err(|e| format!("Failed to load settings: {}", e))?;
    
    let provider_config = settings.get_active_provider().clone();
    let provider_type = provider_config.provider_type.clone();
    let model = provider_config.model.clone();
    let provider = create_provider(provider_config.clone());
    
    // Get the tool type from the request context
    let tool_type = request.context.as_ref()
        .and_then(|ctx| ctx.get("tool"))
        .cloned()
        .unwrap_or_else(|| "unknown".to_string());
    
    // Attempt to generate response with retry logic
    let mut attempt = 0;
    let max_retries = 3;
    
    let response = loop {
        match provider.generate(&request).await {
            Ok(resp) => break Ok(resp),
            Err(e) => {
                // Check if this is a retryable error
                if let Ok(api_error) = serde_json::from_str::<error_handling::APIError>(&e) {
                    if api_error.should_retry() && attempt < max_retries {
                        attempt += 1;
                        let delay = api_error.get_retry_delay();
                        eprintln!("Attempt {} failed with retryable error: {}. Retrying in {:?}...", 
                            attempt, api_error.to_user_message(), delay);
                        tokio::time::sleep(delay).await;
                        continue;
                    }
                }
                break Err(e);
            }
        }
    };
    
    let response_time_ms = start_time.elapsed().as_millis() as i64;
    
    // Convert retry error to AIResponse format if needed
    let final_response = match response {
        Ok(resp) => resp,
        Err(e) => {
            // Check if the error is an API error that we can parse
            if let Ok(api_error) = serde_json::from_str::<error_handling::APIError>(&e) {
                AIResponse {
                    content: String::new(),
                    provider: provider_type.clone(),
                    model: model.clone(),
                    success: false,
                    error: Some(api_error.to_user_message()),
                    usage: None,
                }
            } else {
                AIResponse {
                    content: String::new(),
                    provider: provider_type.clone(),
                    model: model.clone(),
                    success: false,
                    error: Some(e),
                    usage: None,
                }
            }
        }
    };
    
    // Record usage asynchronously (don't fail the request if recording fails)
    let usage_record = usage_tracking::UsageRecord {
        id: None,
        timestamp: chrono::Utc::now(),
        provider: provider_type,
        model: model,
        tool: tool_type,
        input_tokens: final_response.usage.as_ref().map(|u| u.prompt_tokens as i32).unwrap_or(0),
        output_tokens: final_response.usage.as_ref().map(|u| u.completion_tokens as i32).unwrap_or(0),
        total_tokens: final_response.usage.as_ref().map(|u| u.total_tokens as i32).unwrap_or(0),
        success: final_response.success,
        error_message: final_response.error.clone(),
        response_time_ms,
    };
    
    // Record usage in background
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        if let Err(e) = usage_tracking::record_usage(&app_handle_clone, usage_record).await {
            eprintln!("Failed to record usage: {}", e);
        }
    });
    
    Ok(final_response)
}

#[command]
async fn list_available_models(
    provider_type: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<ai_providers::ModelInfo>, String> {
    let settings = settings::load_settings(&app_handle)
        .await
        .map_err(|e| format!("Failed to load settings: {}", e))?;
    
    let provider_config = settings.get_provider(&provider_type)
        .ok_or_else(|| format!("Unknown provider: {}", provider_type))?
        .clone();
    
    let provider = create_provider(provider_config);
    provider.list_models().await
}

// Keep the old API for backward compatibility
#[command]
async fn generate_ai_response(
    request: GenerateRequest,
    app_handle: tauri::AppHandle,
) -> Result<GenerateResponse, String> {
    let settings = settings::load_settings(&app_handle)
        .await
        .map_err(|e| format!("Failed to load settings: {}", e))?;
    
    let provider = settings.get_active_provider();
    
    match provider.provider_type.as_str() {
        "openai" => generate_openai_response(request, provider).await,
        "ollama" => generate_ollama_response(request, provider).await,
        "anthropic" => generate_anthropic_response(request, provider).await,
        "gemini" => generate_gemini_response(request, provider).await,
        _ => Err("Invalid provider specified".to_string()),
    }
}

async fn generate_openai_response(
    request: GenerateRequest,
    provider: &AIProviderConfig,
) -> Result<GenerateResponse, String> {
    let api_key = match secure_storage::retrieve_api_key(&provider.provider_type) {
        Ok(Some(key)) => key,
        Ok(None) => return Ok(GenerateResponse {
            content: String::new(),
            provider: "openai".to_string(),
            success: false,
            error: Some("OpenAI API key not configured".to_string()),
        }),
        Err(e) => return Ok(GenerateResponse {
            content: String::new(),
            provider: "openai".to_string(),
            success: false,
            error: Some(format!("Failed to retrieve API key: {}", e)),
        }),
    };
    
    let client = reqwest::Client::new();
    let openai_request = OpenAIRequest {
        model: provider.model.clone(),
        messages: vec![OpenAIMessage {
            role: "user".to_string(),
            content: request.prompt,
        }],
        temperature: request.temperature,
        max_tokens: 2000,
    };
    
    let url = format!("{}/chat/completions", provider.base_url);
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&openai_request)
        .send()
        .await
        .map_err(|e| format!("OpenAI API request failed: {}", e))?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Ok(GenerateResponse {
            content: String::new(),
            provider: "openai".to_string(),
            success: false,
            error: Some(format!("OpenAI API error: {}", error_text)),
        });
    }
    
    let openai_response: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;
    
    let content = openai_response
        .choices
        .first()
        .map(|choice| choice.message.content.clone())
        .unwrap_or_default();
    
    Ok(GenerateResponse {
        content,
        provider: "openai".to_string(),
        success: true,
        error: None,
    })
}

async fn generate_ollama_response(
    request: GenerateRequest,
    provider: &AIProviderConfig,
) -> Result<GenerateResponse, String> {
    let client = reqwest::Client::new();
    let ollama_request = OllamaRequest {
        model: provider.model.clone(),
        prompt: request.prompt,
        stream: false,
        options: OllamaOptions {
            temperature: request.temperature,
        },
    };
    
    let url = format!("{}/api/generate", provider.base_url);
    let response = client
        .post(&url)
        .json(&ollama_request)
        .send()
        .await
        .map_err(|e| format!("Ollama API request failed: {}", e))?;
    
    if !response.status().is_success() {
        return Ok(GenerateResponse {
            content: String::new(),
            provider: "ollama".to_string(),
            success: false,
            error: Some(format!("Ollama not available or model not loaded")),
        });
    }
    
    let ollama_response: OllamaResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
    
    Ok(GenerateResponse {
        content: ollama_response.response,
        provider: "ollama".to_string(),
        success: true,
        error: None,
    })
}

async fn generate_anthropic_response(
    request: GenerateRequest,
    provider: &AIProviderConfig,
) -> Result<GenerateResponse, String> {
    let api_key = match secure_storage::retrieve_api_key(&provider.provider_type) {
        Ok(Some(key)) => key,
        Ok(None) => return Ok(GenerateResponse {
            content: String::new(),
            provider: "anthropic".to_string(),
            success: false,
            error: Some("Anthropic API key not configured".to_string()),
        }),
        Err(e) => return Ok(GenerateResponse {
            content: String::new(),
            provider: "anthropic".to_string(),
            success: false,
            error: Some(format!("Failed to retrieve API key: {}", e)),
        }),
    };

    let client = reqwest::Client::new();
    let anthropic_request = serde_json::json!({
        "model": provider.model,
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": request.prompt}]
    });

    let url = format!("{}/v1/messages", provider.base_url);
    let response = client
        .post(&url)
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&anthropic_request)
        .send()
        .await
        .map_err(|e| format!("Anthropic API request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Ok(GenerateResponse {
            content: String::new(),
            provider: "anthropic".to_string(),
            success: false,
            error: Some(format!("Anthropic API error: {}", error_text)),
        });
    }

    let anthropic_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

    let content = anthropic_response["content"][0]["text"]
        .as_str()
        .unwrap_or_default()
        .to_string();

    Ok(GenerateResponse {
        content,
        provider: "anthropic".to_string(),
        success: true,
        error: None,
    })
}

async fn generate_gemini_response(
    request: GenerateRequest,
    provider: &AIProviderConfig,
) -> Result<GenerateResponse, String> {
    let api_key = match secure_storage::retrieve_api_key(&provider.provider_type) {
        Ok(Some(key)) => key,
        Ok(None) => return Ok(GenerateResponse {
            content: String::new(),
            provider: "gemini".to_string(),
            success: false,
            error: Some("Gemini API key not configured".to_string()),
        }),
        Err(e) => return Ok(GenerateResponse {
            content: String::new(),
            provider: "gemini".to_string(),
            success: false,
            error: Some(format!("Failed to retrieve API key: {}", e)),
        }),
    };

    let client = reqwest::Client::new();
    let gemini_request = serde_json::json!({
        "contents": [{
            "parts": [{"text": request.prompt}]
        }],
        "generationConfig": {
            "temperature": request.temperature,
            "maxOutputTokens": 2000
        }
    });

    let url = format!("{}/models/{}:generateContent?key={}", 
        provider.base_url, 
        provider.model, 
        &api_key
    );
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&gemini_request)
        .send()
        .await
        .map_err(|e| format!("Gemini API request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Ok(GenerateResponse {
            content: String::new(),
            provider: "gemini".to_string(),
            success: false,
            error: Some(format!("Gemini API error: {}", error_text)),
        });
    }

    let gemini_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    let content = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or_default()
        .to_string();

    Ok(GenerateResponse {
        content,
        provider: "gemini".to_string(),
        success: true,
        error: None,
    })
}


#[command]
async fn save_file_to_downloads(
    filename: String,
    content: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let downloads_dir = app_handle
        .path()
        .download_dir()
        .map_err(|e| format!("Failed to get downloads directory: {}", e))?;
    
    let file_path = downloads_dir.join(filename);
    
    tokio::fs::write(&file_path, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

// Prompt Management Commands

#[command]
async fn load_prompts(app_handle: tauri::AppHandle) -> Result<PromptCollection, String> {
    prompts::load_prompts(&app_handle).await
}

#[command]
async fn save_prompt(app_handle: tauri::AppHandle, tool_id: String, prompt: ToolPrompt) -> Result<(), String> {
    prompts::save_prompt(&app_handle, &tool_id, prompt).await
}

#[command]
async fn reset_prompt(app_handle: tauri::AppHandle, tool_id: String) -> Result<(), String> {
    prompts::reset_prompt(&app_handle, &tool_id).await
}

#[command]
async fn export_prompts(app_handle: tauri::AppHandle) -> Result<String, String> {
    prompts::export_prompts(&app_handle).await
}

#[command]
async fn import_prompts(app_handle: tauri::AppHandle, import_data: String) -> Result<(), String> {
    prompts::import_prompts(&app_handle, &import_data).await
}

#[command]
async fn get_prompt(app_handle: tauri::AppHandle, tool_id: String) -> Result<Option<ToolPrompt>, String> {
    let collection = prompts::load_prompts(&app_handle).await?;
    Ok(collection.prompts.get(&tool_id).cloned())
}

// Usage Tracking Commands

#[command]
async fn get_usage_stats(app_handle: tauri::AppHandle, days: Option<i32>) -> Result<usage_tracking::UsageStats, String> {
    usage_tracking::get_usage_stats(&app_handle, days).await
}

#[command]
async fn get_usage_history(
    app_handle: tauri::AppHandle, 
    limit: Option<i32>, 
    offset: Option<i32>
) -> Result<Vec<usage_tracking::UsageRecord>, String> {
    usage_tracking::get_usage_history(&app_handle, limit, offset).await
}

#[command]
async fn clear_usage_history(app_handle: tauri::AppHandle) -> Result<(), String> {
    usage_tracking::clear_usage_history(&app_handle).await
}

#[command]
async fn export_usage_data(app_handle: tauri::AppHandle) -> Result<String, String> {
    usage_tracking::export_usage_data(&app_handle).await
}

#[command]
async fn validate_api_key(provider: String, api_key: String) -> Result<key_validation::ValidationResult, String> {
    Ok(key_validation::validate_api_key(&provider, &api_key))
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize usage tracking database
            let app_handle = app.handle().clone();
            if let Err(e) = usage_tracking::init_database(&app_handle) {
                eprintln!("Failed to initialize usage tracking database: {}", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            generate_ai_response,
            generate_ai_response_v2,
            list_available_models,
            test_provider_connection,
            test_custom_provider_connection,
            store_api_key,
            retrieve_api_key,
            delete_api_key,
            check_api_key_exists,
            get_all_api_key_status,
            test_keychain_access,
            save_file_to_downloads,
            load_prompts,
            save_prompt,
            reset_prompt,
            export_prompts,
            import_prompts,
            get_prompt,
            get_usage_stats,
            get_usage_history,
            clear_usage_history,
            export_usage_data,
            validate_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
