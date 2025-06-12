use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct APIError {
    pub error_type: APIErrorType,
    pub message: String,
    pub provider: String,
    pub status_code: Option<u16>,
    pub retry_after: Option<u64>, // seconds
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum APIErrorType {
    RateLimit,
    QuotaExceeded,
    InvalidApiKey,
    ModelNotFound,
    NetworkError,
    ServerError,
    InvalidRequest,
    Unknown,
}

impl APIError {
    pub fn from_status_code(status: u16, provider: &str, body: Option<&str>) -> Self {
        let error_type = match status {
            429 => APIErrorType::RateLimit,
            401 => APIErrorType::InvalidApiKey,
            402 | 403 => APIErrorType::QuotaExceeded,
            404 => APIErrorType::ModelNotFound,
            400 => APIErrorType::InvalidRequest,
            500..=599 => APIErrorType::ServerError,
            _ => APIErrorType::Unknown,
        };

        let message = match error_type {
            APIErrorType::RateLimit => "Rate limit exceeded. Please wait before trying again.".to_string(),
            APIErrorType::QuotaExceeded => "API quota exceeded. Check your billing or upgrade your plan.".to_string(),
            APIErrorType::InvalidApiKey => "Invalid API key. Please check your credentials.".to_string(),
            APIErrorType::ModelNotFound => "The specified model was not found.".to_string(),
            APIErrorType::InvalidRequest => "Invalid request. Please check your input.".to_string(),
            APIErrorType::ServerError => "Server error. The AI provider is experiencing issues.".to_string(),
            _ => format!("API error (status {})", status),
        };

        // Try to extract retry-after header from response body for rate limits
        let retry_after = if error_type == APIErrorType::RateLimit {
            extract_retry_after(provider, body)
        } else {
            None
        };

        APIError {
            error_type,
            message,
            provider: provider.to_string(),
            status_code: Some(status),
            retry_after,
            details: body.map(|s| s.to_string()),
        }
    }

    pub fn network_error(provider: &str, error: &str) -> Self {
        APIError {
            error_type: APIErrorType::NetworkError,
            message: format!("Network error: Unable to connect to {}. Please check your internet connection.", provider),
            provider: provider.to_string(),
            status_code: None,
            retry_after: None,
            details: Some(error.to_string()),
        }
    }

    pub fn should_retry(&self) -> bool {
        matches!(
            self.error_type,
            APIErrorType::RateLimit | APIErrorType::ServerError | APIErrorType::NetworkError
        )
    }

    pub fn get_retry_delay(&self) -> Duration {
        if let Some(retry_after) = self.retry_after {
            Duration::from_secs(retry_after)
        } else {
            match self.error_type {
                APIErrorType::RateLimit => Duration::from_secs(60), // Default 1 minute for rate limits
                APIErrorType::ServerError => Duration::from_secs(5), // 5 seconds for server errors
                APIErrorType::NetworkError => Duration::from_secs(2), // 2 seconds for network errors
                _ => Duration::from_secs(1),
            }
        }
    }

    pub fn to_user_message(&self) -> String {
        match self.error_type {
            APIErrorType::RateLimit => {
                if let Some(retry_after) = self.retry_after {
                    format!("⏱️ Rate limit reached. Please wait {} seconds before trying again.", retry_after)
                } else {
                    "⏱️ Rate limit reached. Please wait a moment before trying again.".to_string()
                }
            },
            APIErrorType::QuotaExceeded => {
                format!("📊 {} quota exceeded. Please check your account billing or usage limits.", self.provider)
            },
            APIErrorType::InvalidApiKey => {
                format!("🔑 Invalid {} API key. Please check your settings.", self.provider)
            },
            APIErrorType::ModelNotFound => {
                "🤖 The selected AI model is not available. Please choose a different model.".to_string()
            },
            APIErrorType::NetworkError => {
                "🌐 Network connection error. Please check your internet connection and try again.".to_string()
            },
            APIErrorType::ServerError => {
                format!("⚠️ {} is experiencing issues. Please try again later.", self.provider)
            },
            APIErrorType::InvalidRequest => {
                "❌ Invalid request. Please check your input and try again.".to_string()
            },
            APIErrorType::Unknown => {
                self.message.clone()
            },
        }
    }
}

// Extract retry-after information from provider-specific error responses
fn extract_retry_after(provider: &str, body: Option<&str>) -> Option<u64> {
    if let Some(body) = body {
        match provider {
            "openai" => {
                // OpenAI includes retry_after in error response
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
                    json["error"]["retry_after"].as_u64()
                } else {
                    None
                }
            },
            "anthropic" => {
                // Anthropic uses error.retry_after_ms
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
                    json["error"]["retry_after_ms"].as_u64().map(|ms| ms / 1000)
                } else {
                    None
                }
            },
            _ => None,
        }
    } else {
        None
    }
}

// Note: RetryPolicy struct and its methods were removed as they were not being used.
// The retry logic is currently implemented directly in generate_ai_response_v2 in main.rs

// Helper function to parse error responses from different providers
pub fn parse_provider_error(provider: &str, status: u16, body: &str) -> APIError {
    let mut error = APIError::from_status_code(status, provider, Some(body));
    
    // Try to extract more specific error messages
    match provider {
        "openai" => {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
                if let Some(message) = json["error"]["message"].as_str() {
                    error.message = message.to_string();
                }
            }
        },
        "anthropic" => {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
                if let Some(message) = json["error"]["message"].as_str() {
                    error.message = message.to_string();
                }
            }
        },
        "gemini" => {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
                if let Some(message) = json["error"]["message"].as_str() {
                    error.message = message.to_string();
                }
            }
        },
        _ => {}
    }
    
    error
}