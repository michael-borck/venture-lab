use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub error_message: Option<String>,
    pub masked_key: String,
}

/// Validates OpenAI API key format
/// Expected format: starts with "sk-" followed by alphanumeric characters
pub fn validate_openai_key(key: &str) -> ValidationResult {
    let trimmed_key = key.trim();
    
    if trimmed_key.is_empty() {
        return ValidationResult {
            is_valid: false,
            error_message: Some("API key cannot be empty".to_string()),
            masked_key: String::new(),
        };
    }
    
    let pattern = Regex::new(r"^sk-[a-zA-Z0-9]+$").unwrap();
    let is_valid = pattern.is_match(trimmed_key) && trimmed_key.len() >= 20;
    
    let error_message = if !is_valid {
        if !trimmed_key.starts_with("sk-") {
            Some("OpenAI API key must start with 'sk-'".to_string())
        } else if trimmed_key.len() < 20 {
            Some("OpenAI API key seems too short".to_string())
        } else {
            Some("OpenAI API key contains invalid characters".to_string())
        }
    } else {
        None
    };
    
    ValidationResult {
        is_valid,
        error_message,
        masked_key: mask_api_key(trimmed_key),
    }
}

/// Validates Anthropic API key format
/// Expected format: starts with "sk-ant-" followed by alphanumeric characters
pub fn validate_anthropic_key(key: &str) -> ValidationResult {
    let trimmed_key = key.trim();
    
    if trimmed_key.is_empty() {
        return ValidationResult {
            is_valid: false,
            error_message: Some("API key cannot be empty".to_string()),
            masked_key: String::new(),
        };
    }
    
    let pattern = Regex::new(r"^sk-ant-[a-zA-Z0-9\-_]+$").unwrap();
    let is_valid = pattern.is_match(trimmed_key) && trimmed_key.len() >= 30;
    
    let error_message = if !is_valid {
        if !trimmed_key.starts_with("sk-ant-") {
            Some("Anthropic API key must start with 'sk-ant-'".to_string())
        } else if trimmed_key.len() < 30 {
            Some("Anthropic API key seems too short".to_string())
        } else {
            Some("Anthropic API key contains invalid characters".to_string())
        }
    } else {
        None
    };
    
    ValidationResult {
        is_valid,
        error_message,
        masked_key: mask_api_key(trimmed_key),
    }
}

/// Validates Gemini API key format
/// Expected format: alphanumeric string (no specific prefix)
pub fn validate_gemini_key(key: &str) -> ValidationResult {
    let trimmed_key = key.trim();
    
    if trimmed_key.is_empty() {
        return ValidationResult {
            is_valid: false,
            error_message: Some("API key cannot be empty".to_string()),
            masked_key: String::new(),
        };
    }
    
    let pattern = Regex::new(r"^[a-zA-Z0-9\-_]+$").unwrap();
    let is_valid = pattern.is_match(trimmed_key) && trimmed_key.len() >= 20;
    
    let error_message = if !is_valid {
        if trimmed_key.len() < 20 {
            Some("Gemini API key seems too short (minimum 20 characters)".to_string())
        } else {
            Some("Gemini API key contains invalid characters (only alphanumeric, hyphens, and underscores allowed)".to_string())
        }
    } else {
        None
    };
    
    ValidationResult {
        is_valid,
        error_message,
        masked_key: mask_api_key(trimmed_key),
    }
}

/// Validates Ollama API key format
/// Expected format: optional bearer token (any format)
pub fn validate_ollama_key(key: &str) -> ValidationResult {
    let trimmed_key = key.trim();
    
    // Ollama can work without authentication or with any bearer token format
    // If provided, just ensure it's not empty after trimming
    if trimmed_key.is_empty() {
        return ValidationResult {
            is_valid: true, // Ollama can work without auth
            error_message: None,
            masked_key: "(no authentication)".to_string(),
        };
    }
    
    // Basic validation: ensure reasonable length and no obvious issues
    let is_valid = trimmed_key.len() >= 8 && !trimmed_key.contains(char::is_whitespace);
    
    let error_message = if !is_valid {
        if trimmed_key.len() < 8 {
            Some("Bearer token seems too short (minimum 8 characters)".to_string())
        } else {
            Some("Bearer token contains whitespace characters".to_string())
        }
    } else {
        None
    };
    
    ValidationResult {
        is_valid,
        error_message,
        masked_key: mask_api_key(trimmed_key),
    }
}

/// Masks an API key for secure display
/// Shows first 7 and last 4 characters, with asterisks in between
pub fn mask_api_key(key: &str) -> String {
    if key.is_empty() {
        return String::new();
    }
    
    let key_len = key.len();
    
    if key_len <= 11 {
        // For very short keys, mask the middle portion
        if key_len <= 4 {
            return "*".repeat(key_len);
        }
        let first = &key[..2];
        let last = &key[key_len - 2..];
        return format!("{}{}{}",
            first,
            "*".repeat(key_len - 4),
            last
        );
    }
    
    // Standard masking: show first 7 and last 4 characters
    let first = &key[..7];
    let last = &key[key_len - 4..];
    let masked_middle = "*".repeat(key_len - 11);
    
    format!("{}{}{}", first, masked_middle, last)
}

/// Validates API key based on provider type
pub fn validate_api_key(provider: &str, key: &str) -> ValidationResult {
    match provider.to_lowercase().as_str() {
        "openai" => validate_openai_key(key),
        "anthropic" => validate_anthropic_key(key),
        "gemini" => validate_gemini_key(key),
        "ollama" => validate_ollama_key(key),
        _ => ValidationResult {
            is_valid: false,
            error_message: Some(format!("Unknown provider: {}", provider)),
            masked_key: String::new(),
        },
    }
}

// Note: check_key_length and get_validation_feedback functions were removed as they were not being used.
// The validation is handled directly through validate_api_key function.

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_openai_validation() {
        // Valid key
        let result = validate_openai_key("sk-1234567890abcdefghijklmnop");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        
        // Invalid - wrong prefix
        let result = validate_openai_key("pk-1234567890abcdefghijklmnop");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("must start with 'sk-'"));
        
        // Invalid - too short
        let result = validate_openai_key("sk-123");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("too short"));
        
        // Invalid - special characters
        let result = validate_openai_key("sk-123@456#789abcdefghijklmnop");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("invalid characters"));
        
        // Invalid - empty
        let result = validate_openai_key("");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("cannot be empty"));
    }

    #[test]
    fn test_anthropic_validation() {
        // Valid key
        let result = validate_anthropic_key("sk-ant-1234567890abcdefghijklmnop");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        
        // Valid key with more characters
        let result = validate_anthropic_key("sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        
        // Invalid - wrong prefix
        let result = validate_anthropic_key("sk-1234567890abcdefghijklmnop");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("must start with 'sk-ant-'"));
        
        // Invalid - too short
        let result = validate_anthropic_key("sk-ant-123");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("too short"));
    }

    #[test]
    fn test_gemini_validation() {
        // Valid key
        let result = validate_gemini_key("abcdefghij1234567890");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        
        // Valid key with hyphens and underscores
        let result = validate_gemini_key("AIzaSyD-abcd1234_efgh5678");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        
        // Invalid - too short
        let result = validate_gemini_key("abc123");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("too short"));
        
        // Invalid - special characters
        let result = validate_gemini_key("abc@123#def$456%ghi789012");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("invalid characters"));
    }

    #[test]
    fn test_ollama_validation() {
        // Valid - no auth
        let result = validate_ollama_key("");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        assert_eq!(result.masked_key, "(no authentication)");
        
        // Valid - with token
        let result = validate_ollama_key("bearer1234567890");
        assert!(result.is_valid);
        assert!(result.error_message.is_none());
        
        // Invalid - too short
        let result = validate_ollama_key("abc");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("too short"));
        
        // Invalid - contains whitespace
        let result = validate_ollama_key("bearer token with spaces");
        assert!(!result.is_valid);
        assert!(result.error_message.unwrap().contains("whitespace"));
    }

    #[test]
    fn test_mask_api_key() {
        // Standard key
        let masked = mask_api_key("sk-1234567890abcdefghijklmnop");
        assert_eq!(masked.chars().take(7).collect::<String>(), "sk-1234");
        assert_eq!(masked.chars().rev().take(4).collect::<String>().chars().rev().collect::<String>(), "mnop");
        assert!(masked.contains("*"));
        
        // Short key
        assert_eq!(mask_api_key("sk-123"), "sk**23");
        
        // Very short key
        assert_eq!(mask_api_key("abc"), "***");
        
        // Empty key
        assert_eq!(mask_api_key(""), "");
    }

    #[test]
    fn test_validation_feedback() {
        let feedback = get_validation_feedback("openai", "sk-validkey123456789");
        assert!(feedback.contains("✓ Valid"));
        assert!(feedback.contains("sk-vali"));
        
        let feedback = get_validation_feedback("openai", "invalid-key");
        assert!(feedback.contains("✗ Invalid"));
        assert!(feedback.contains("must start with 'sk-'"));
    }
}