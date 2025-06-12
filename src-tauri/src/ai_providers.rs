use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::settings::AIProviderConfig;
use crate::secure_storage;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIRequest {
    pub prompt: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
    pub system_message: Option<String>,
    pub context: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIResponse {
    pub content: String,
    pub provider: String,
    pub model: String,
    pub success: bool,
    pub error: Option<String>,
    pub usage: Option<TokenUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub context_length: Option<u32>,
    pub provider: String,
}

pub trait AIProvider {
    async fn generate(&self, request: &AIRequest) -> Result<AIResponse, String>;
    async fn list_models(&self) -> Result<Vec<ModelInfo>, String>;
    async fn test_connection(&self) -> Result<bool, String>;
    fn get_provider_name(&self) -> &str;
    fn get_default_model(&self) -> &str;
    fn supports_system_messages(&self) -> bool;
}

pub struct OpenAIProvider {
    config: AIProviderConfig,
    client: reqwest::Client,
}

impl OpenAIProvider {
    pub fn new(config: AIProviderConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        
        Self { config, client }
    }
}

impl AIProvider for OpenAIProvider {
    async fn generate(&self, request: &AIRequest) -> Result<AIResponse, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Ok(AIResponse {
                content: String::new(),
                provider: "openai".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some("API key not configured".to_string()),
                usage: None,
            }),
            Err(e) => return Ok(AIResponse {
                content: String::new(),
                provider: "openai".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some(format!("Failed to retrieve API key: {}", e)),
                usage: None,
            }),
        };

        let mut messages = Vec::new();
        
        if let Some(system_msg) = &request.system_message {
            messages.push(serde_json::json!({
                "role": "system",
                "content": system_msg
            }));
        }
        
        messages.push(serde_json::json!({
            "role": "user",
            "content": request.prompt
        }));

        let payload = serde_json::json!({
            "model": self.config.model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens.unwrap_or(2000)
        });

        let url = format!("{}/chat/completions", self.config.base_url);
        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Ok(AIResponse {
                content: String::new(),
                provider: "openai".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some(format!("API error: {}", error_text)),
                usage: None,
            });
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or_default()
            .to_string();

        let usage = json.get("usage").and_then(|u| {
            Some(TokenUsage {
                prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
                completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
                total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
            })
        });

        Ok(AIResponse {
            content,
            provider: "openai".to_string(),
            model: self.config.model.clone(),
            success: true,
            error: None,
            usage,
        })
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Err("API key not configured".to_string()),
            Err(e) => return Err(format!("Failed to retrieve API key: {}", e)),
        };

        let url = format!("{}/models", self.config.base_url);
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch models".to_string());
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let models = json["data"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|model| {
                let id = model["id"].as_str()?;
                Some(ModelInfo {
                    id: id.to_string(),
                    name: id.to_string(),
                    description: None,
                    context_length: Some(4096), // Default for most models
                    provider: "openai".to_string(),
                })
            })
            .collect();

        Ok(models)
    }

    async fn test_connection(&self) -> Result<bool, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Ok(false),
            Err(_) => return Ok(false),
        };

        let url = format!("{}/models", self.config.base_url);
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    fn get_provider_name(&self) -> &str {
        "openai"
    }

    fn get_default_model(&self) -> &str {
        "gpt-4"
    }

    fn supports_system_messages(&self) -> bool {
        true
    }
}

pub struct AnthropicProvider {
    config: AIProviderConfig,
    client: reqwest::Client,
}

impl AnthropicProvider {
    pub fn new(config: AIProviderConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        
        Self { config, client }
    }
}

impl AIProvider for AnthropicProvider {
    async fn generate(&self, request: &AIRequest) -> Result<AIResponse, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Ok(AIResponse {
                content: String::new(),
                provider: "anthropic".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some("API key not configured".to_string()),
                usage: None,
            }),
            Err(e) => return Ok(AIResponse {
                content: String::new(),
                provider: "anthropic".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some(format!("Failed to retrieve API key: {}", e)),
                usage: None,
            }),
        };

        let mut payload = serde_json::json!({
            "model": self.config.model,
            "max_tokens": request.max_tokens.unwrap_or(2000),
            "messages": [{"role": "user", "content": request.prompt}]
        });

        if let Some(system_msg) = &request.system_message {
            payload["system"] = serde_json::Value::String(system_msg.clone());
        }

        let url = format!("{}/v1/messages", self.config.base_url);
        let response = self.client
            .post(&url)
            .header("x-api-key", &api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Ok(AIResponse {
                content: String::new(),
                provider: "anthropic".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some(format!("API error: {}", error_text)),
                usage: None,
            });
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = json["content"][0]["text"]
            .as_str()
            .unwrap_or_default()
            .to_string();

        let usage = json.get("usage").and_then(|u| {
            Some(TokenUsage {
                prompt_tokens: u["input_tokens"].as_u64().unwrap_or(0) as u32,
                completion_tokens: u["output_tokens"].as_u64().unwrap_or(0) as u32,
                total_tokens: (u["input_tokens"].as_u64().unwrap_or(0) + u["output_tokens"].as_u64().unwrap_or(0)) as u32,
            })
        });

        Ok(AIResponse {
            content,
            provider: "anthropic".to_string(),
            model: self.config.model.clone(),
            success: true,
            error: None,
            usage,
        })
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        // Anthropic doesn't provide a models endpoint, return known models
        Ok(vec![
            ModelInfo {
                id: "claude-3-opus-20240229".to_string(),
                name: "Claude 3 Opus".to_string(),
                description: Some("Most capable model for complex tasks".to_string()),
                context_length: Some(200000),
                provider: "anthropic".to_string(),
            },
            ModelInfo {
                id: "claude-3-sonnet-20240229".to_string(),
                name: "Claude 3 Sonnet".to_string(),
                description: Some("Balanced performance and speed".to_string()),
                context_length: Some(200000),
                provider: "anthropic".to_string(),
            },
            ModelInfo {
                id: "claude-3-haiku-20240307".to_string(),
                name: "Claude 3 Haiku".to_string(),
                description: Some("Fastest model for simple tasks".to_string()),
                context_length: Some(200000),
                provider: "anthropic".to_string(),
            },
        ])
    }

    async fn test_connection(&self) -> Result<bool, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Ok(false),
            Err(_) => return Ok(false),
        };

        let test_payload = serde_json::json!({
            "model": "claude-3-haiku-20240307",
            "max_tokens": 1,
            "messages": [{"role": "user", "content": "test"}]
        });

        let url = format!("{}/v1/messages", self.config.base_url);
        let response = self.client
            .post(&url)
            .header("x-api-key", &api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&test_payload)
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    fn get_provider_name(&self) -> &str {
        "anthropic"
    }

    fn get_default_model(&self) -> &str {
        "claude-3-sonnet-20240229"
    }

    fn supports_system_messages(&self) -> bool {
        true
    }
}

pub struct GeminiProvider {
    config: AIProviderConfig,
    client: reqwest::Client,
}

impl GeminiProvider {
    pub fn new(config: AIProviderConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        
        Self { config, client }
    }
}

impl AIProvider for GeminiProvider {
    async fn generate(&self, request: &AIRequest) -> Result<AIResponse, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Ok(AIResponse {
                content: String::new(),
                provider: "gemini".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some("API key not configured".to_string()),
                usage: None,
            }),
            Err(e) => return Ok(AIResponse {
                content: String::new(),
                provider: "gemini".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some(format!("Failed to retrieve API key: {}", e)),
                usage: None,
            }),
        };

        let mut content = request.prompt.clone();
        if let Some(system_msg) = &request.system_message {
            content = format!("{}\n\n{}", system_msg, content);
        }

        let payload = serde_json::json!({
            "contents": [{
                "parts": [{"text": content}]
            }],
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens.unwrap_or(2000)
            }
        });

        let url = format!("{}/models/{}:generateContent?key={}", 
            self.config.base_url, 
            self.config.model, 
            &api_key
        );
        
        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Ok(AIResponse {
                content: String::new(),
                provider: "gemini".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some(format!("API error: {}", error_text)),
                usage: None,
            });
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or_default()
            .to_string();

        // Gemini doesn't provide detailed usage stats in the same format
        let usage = json.get("usageMetadata").and_then(|u| {
            Some(TokenUsage {
                prompt_tokens: u["promptTokenCount"].as_u64().unwrap_or(0) as u32,
                completion_tokens: u["candidatesTokenCount"].as_u64().unwrap_or(0) as u32,
                total_tokens: u["totalTokenCount"].as_u64().unwrap_or(0) as u32,
            })
        });

        Ok(AIResponse {
            content,
            provider: "gemini".to_string(),
            model: self.config.model.clone(),
            success: true,
            error: None,
            usage,
        })
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Err("API key not configured".to_string()),
            Err(e) => return Err(format!("Failed to retrieve API key: {}", e)),
        };

        let url = format!("{}/models?key={}", self.config.base_url, &api_key);
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch models".to_string());
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let models = json["models"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|model| {
                let name = model["name"].as_str()?;
                let display_name = model["displayName"].as_str().unwrap_or(name);
                let description = model["description"].as_str();
                
                Some(ModelInfo {
                    id: name.to_string(),
                    name: display_name.to_string(),
                    description: description.map(|s| s.to_string()),
                    context_length: Some(32768), // Default for Gemini models
                    provider: "gemini".to_string(),
                })
            })
            .collect();

        Ok(models)
    }

    async fn test_connection(&self) -> Result<bool, String> {
        let api_key = match secure_storage::retrieve_api_key(&self.config.provider_type) {
            Ok(Some(key)) => key,
            Ok(None) => return Ok(false),
            Err(_) => return Ok(false),
        };

        let url = format!("{}/models?key={}", self.config.base_url, &api_key);
        let response = self.client
            .get(&url)
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    fn get_provider_name(&self) -> &str {
        "gemini"
    }

    fn get_default_model(&self) -> &str {
        "gemini-pro"
    }

    fn supports_system_messages(&self) -> bool {
        false // Gemini handles system messages differently
    }
}

pub struct OllamaProvider {
    config: AIProviderConfig,
    client: reqwest::Client,
}

impl OllamaProvider {
    pub fn new(config: AIProviderConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(300)) // Longer timeout for local models
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        
        Self { config, client }
    }
}

impl AIProvider for OllamaProvider {
    async fn generate(&self, request: &AIRequest) -> Result<AIResponse, String> {
        let mut prompt = request.prompt.clone();
        if let Some(system_msg) = &request.system_message {
            prompt = format!("System: {}\n\nUser: {}", system_msg, prompt);
        }

        let payload = serde_json::json!({
            "model": self.config.model,
            "prompt": prompt,
            "stream": false,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens.unwrap_or(2000)
            }
        });

        let url = format!("{}/api/generate", self.config.base_url);
        let mut request_builder = self.client.post(&url).json(&payload);
        
        // Check for optional bearer token (for proxied Ollama servers)
        if let Ok(Some(bearer_token)) = secure_storage::retrieve_api_key(&self.config.provider_type) {
            request_builder = request_builder.header("Authorization", format!("Bearer {}", bearer_token));
        }
        
        let response = request_builder
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Ok(AIResponse {
                content: String::new(),
                provider: "ollama".to_string(),
                model: self.config.model.clone(),
                success: false,
                error: Some("Ollama server not available or model not loaded".to_string()),
                usage: None,
            });
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = json["response"]
            .as_str()
            .unwrap_or_default()
            .to_string();

        // Ollama provides token usage info
        let usage = json.get("eval_count").and_then(|_| {
            Some(TokenUsage {
                prompt_tokens: json["prompt_eval_count"].as_u64().unwrap_or(0) as u32,
                completion_tokens: json["eval_count"].as_u64().unwrap_or(0) as u32,
                total_tokens: (json["prompt_eval_count"].as_u64().unwrap_or(0) + json["eval_count"].as_u64().unwrap_or(0)) as u32,
            })
        });

        Ok(AIResponse {
            content,
            provider: "ollama".to_string(),
            model: self.config.model.clone(),
            success: true,
            error: None,
            usage,
        })
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        let url = format!("{}/api/tags", self.config.base_url);
        let mut request_builder = self.client.get(&url);
        
        // Check for optional bearer token (for proxied Ollama servers)
        if let Ok(Some(bearer_token)) = secure_storage::retrieve_api_key(&self.config.provider_type) {
            request_builder = request_builder.header("Authorization", format!("Bearer {}", bearer_token));
        }
        
        let response = request_builder
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err("Ollama server not available".to_string());
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let models = json["models"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|model| {
                let name = model["name"].as_str()?;
                let size = model["size"].as_u64().unwrap_or(0);
                let family = model["details"]["family"].as_str().unwrap_or("unknown");
                let param_size = model["details"]["parameter_size"].as_str().unwrap_or("unknown");
                
                Some(ModelInfo {
                    id: name.to_string(),
                    name: name.to_string(),
                    description: Some(format!("Local Ollama model - {} family, {} parameters, {:.1}GB", 
                        family, param_size, size as f64 / 1_000_000_000.0)),
                    context_length: Some(4096), // Default assumption, could be improved
                    provider: "ollama".to_string(),
                })
            })
            .collect();

        Ok(models)
    }

    async fn test_connection(&self) -> Result<bool, String> {
        let url = format!("{}/api/tags", self.config.base_url);
        let mut request_builder = self.client.get(&url);
        
        // Check for optional bearer token (for proxied Ollama servers)
        if let Ok(Some(bearer_token)) = secure_storage::retrieve_api_key(&self.config.provider_type) {
            request_builder = request_builder.header("Authorization", format!("Bearer {}", bearer_token));
        }
        
        let response = request_builder
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    fn get_provider_name(&self) -> &str {
        "ollama"
    }

    fn get_default_model(&self) -> &str {
        "llama3.1"
    }

    fn supports_system_messages(&self) -> bool {
        true // Via prompt formatting
    }
}

pub enum ProviderEnum {
    OpenAI(OpenAIProvider),
    Anthropic(AnthropicProvider),
    Gemini(GeminiProvider),
    Ollama(OllamaProvider),
}

impl AIProvider for ProviderEnum {
    async fn generate(&self, request: &AIRequest) -> Result<AIResponse, String> {
        match self {
            ProviderEnum::OpenAI(provider) => provider.generate(request).await,
            ProviderEnum::Anthropic(provider) => provider.generate(request).await,
            ProviderEnum::Gemini(provider) => provider.generate(request).await,
            ProviderEnum::Ollama(provider) => provider.generate(request).await,
        }
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        match self {
            ProviderEnum::OpenAI(provider) => provider.list_models().await,
            ProviderEnum::Anthropic(provider) => provider.list_models().await,
            ProviderEnum::Gemini(provider) => provider.list_models().await,
            ProviderEnum::Ollama(provider) => provider.list_models().await,
        }
    }

    async fn test_connection(&self) -> Result<bool, String> {
        match self {
            ProviderEnum::OpenAI(provider) => provider.test_connection().await,
            ProviderEnum::Anthropic(provider) => provider.test_connection().await,
            ProviderEnum::Gemini(provider) => provider.test_connection().await,
            ProviderEnum::Ollama(provider) => provider.test_connection().await,
        }
    }

    fn get_provider_name(&self) -> &str {
        match self {
            ProviderEnum::OpenAI(provider) => provider.get_provider_name(),
            ProviderEnum::Anthropic(provider) => provider.get_provider_name(),
            ProviderEnum::Gemini(provider) => provider.get_provider_name(),
            ProviderEnum::Ollama(provider) => provider.get_provider_name(),
        }
    }

    fn get_default_model(&self) -> &str {
        match self {
            ProviderEnum::OpenAI(provider) => provider.get_default_model(),
            ProviderEnum::Anthropic(provider) => provider.get_default_model(),
            ProviderEnum::Gemini(provider) => provider.get_default_model(),
            ProviderEnum::Ollama(provider) => provider.get_default_model(),
        }
    }

    fn supports_system_messages(&self) -> bool {
        match self {
            ProviderEnum::OpenAI(provider) => provider.supports_system_messages(),
            ProviderEnum::Anthropic(provider) => provider.supports_system_messages(),
            ProviderEnum::Gemini(provider) => provider.supports_system_messages(),
            ProviderEnum::Ollama(provider) => provider.supports_system_messages(),
        }
    }
}

pub fn create_provider(config: AIProviderConfig) -> ProviderEnum {
    match config.provider_type.as_str() {
        "openai" => ProviderEnum::OpenAI(OpenAIProvider::new(config)),
        "anthropic" => ProviderEnum::Anthropic(AnthropicProvider::new(config)),
        "gemini" => ProviderEnum::Gemini(GeminiProvider::new(config)),
        "ollama" => ProviderEnum::Ollama(OllamaProvider::new(config)),
        _ => ProviderEnum::Ollama(OllamaProvider::new(config)), // Default fallback
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config(provider_type: &str) -> AIProviderConfig {
        AIProviderConfig {
            provider_type: provider_type.to_string(),
            base_url: "https://api.test.com".to_string(),
            model: "test-model".to_string(),
            enabled: true,
        }
    }

    #[test]
    fn test_provider_creation() {
        let config = create_test_config("openai");
        let provider = create_provider(config);
        assert_eq!(provider.get_provider_name(), "openai");
        assert_eq!(provider.get_default_model(), "gpt-4");
        assert!(provider.supports_system_messages());
    }

    #[test]
    fn test_ai_request_serialization() {
        let request = AIRequest {
            prompt: "test prompt".to_string(),
            temperature: 0.7,
            max_tokens: Some(1000),
            system_message: Some("system message".to_string()),
            context: None,
        };
        
        let json = serde_json::to_string(&request).unwrap();
        let deserialized: AIRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request.prompt, deserialized.prompt);
        assert_eq!(request.temperature, deserialized.temperature);
    }

    #[test]
    fn test_ai_response_creation() {
        let response = AIResponse {
            content: "test response".to_string(),
            provider: "test".to_string(),
            model: "test-model".to_string(),
            success: true,
            error: None,
            usage: Some(TokenUsage {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30,
            }),
        };
        
        assert_eq!(response.content, "test response");
        assert!(response.success);
        assert!(response.usage.is_some());
    }
}