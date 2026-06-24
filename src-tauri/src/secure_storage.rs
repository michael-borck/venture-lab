use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::key_validation;

const SERVICE_NAME: &str = "entrepreneurship-ai-tools";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeyInfo {
    pub exists: bool,
    pub provider: String,
    pub created_at: Option<String>,
    pub masked_key: Option<String>,
}

// Get the keyring entry for a specific provider
fn get_keyring_entry(provider: &str) -> Result<Entry, String> {
    let account = format!("{}_api_key", provider);
    Entry::new(SERVICE_NAME, &account)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))
}

// Store API key securely in OS keychain
pub fn store_api_key(provider: &str, api_key: &str) -> Result<(), String> {
    // Validate the API key format before storing
    let validation_result = key_validation::validate_api_key(provider, api_key);
    
    if !validation_result.is_valid {
        return Err(validation_result.error_message.unwrap_or_else(|| 
            format!("Invalid API key format for provider: {}", provider)
        ));
    }

    let entry = get_keyring_entry(provider)?;
    entry.set_password(api_key.trim())
        .map_err(|e| format!("Failed to store API key: {}", e))?;
    
    Ok(())
}

// Retrieve API key from OS keychain
pub fn retrieve_api_key(provider: &str) -> Result<Option<String>, String> {
    // First check environment variable override
    let env_var = get_env_var_name(provider);
    if let Ok(key) = std::env::var(&env_var) {
        if !key.trim().is_empty() {
            return Ok(Some(key));
        }
    }

    // Then check keychain
    let entry = get_keyring_entry(provider)?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to retrieve API key: {}", e)),
    }
}

// Delete API key from OS keychain
pub fn delete_api_key(provider: &str) -> Result<(), String> {
    let entry = get_keyring_entry(provider)?;
    match entry.delete_password() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already doesn't exist
        Err(e) => Err(format!("Failed to delete API key: {}", e)),
    }
}

// Check if API key exists (without retrieving it)
pub fn check_api_key_exists(provider: &str) -> Result<bool, String> {
    // Check environment variable first
    let env_var = get_env_var_name(provider);
    if let Ok(key) = std::env::var(&env_var) {
        if !key.trim().is_empty() {
            return Ok(true);
        }
    }

    // Check keychain
    let entry = get_keyring_entry(provider)?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check API key: {}", e)),
    }
}

// Get all API key statuses
pub fn get_all_api_key_status() -> Result<HashMap<String, ApiKeyInfo>, String> {
    let providers = vec!["openai", "anthropic", "gemini", "ollama"];
    let mut status_map = HashMap::new();
    
    for provider in providers {
        let exists = check_api_key_exists(provider).unwrap_or(false);
        let masked_key = if exists {
            if let Ok(Some(key)) = retrieve_api_key(provider) {
                Some(key_validation::mask_api_key(&key))
            } else {
                None
            }
        } else {
            None
        };
        
        let info = ApiKeyInfo {
            exists,
            provider: provider.to_string(),
            created_at: None, // Could be enhanced to track creation time
            masked_key,
        };
        status_map.insert(provider.to_string(), info);
    }
    
    Ok(status_map)
}

// Get environment variable name for provider
fn get_env_var_name(provider: &str) -> String {
    match provider {
        "openai" => "OPENAI_API_KEY".to_string(),
        "anthropic" => "ANTHROPIC_API_KEY".to_string(),
        "gemini" => "GEMINI_API_KEY".to_string(),
        _ => format!("{}_API_KEY", provider.to_uppercase()),
    }
}

// Migration function to move API keys from old settings to keychain
pub fn migrate_api_keys_from_settings(old_settings: &serde_json::Value) -> Result<Vec<String>, String> {
    let mut migrated = Vec::new();
    
    // Check for old format API keys
    if let Some(openai_key) = old_settings.get("openai_api_key")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty()) {
        store_api_key("openai", openai_key)?;
        migrated.push("openai".to_string());
    }
    
    if let Some(anthropic_key) = old_settings.get("anthropic_api_key")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty()) {
        store_api_key("anthropic", anthropic_key)?;
        migrated.push("anthropic".to_string());
    }
    
    // Check for new nested format
    if let Some(providers) = old_settings.as_object() {
        for (provider_name, config) in providers {
            if let Some(config_obj) = config.as_object() {
                if let Some(api_key) = config_obj.get("api_key")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty()) {
                    store_api_key(provider_name, api_key)?;
                    migrated.push(provider_name.clone());
                }
            }
        }
    }
    
    Ok(migrated)
}

// Test keychain functionality
pub fn test_keychain_access() -> Result<(), String> {
    // Use a temporary test entry that bypasses validation
    let test_provider = "keychain_test";
    let test_value = "sk-test-1234567890abcdefghijklmnopqrstuvwxyz"; // Valid format for testing
    
    // Get keyring entry directly to bypass validation
    let entry = get_keyring_entry(test_provider)?;
    
    // Try to store a test value
    entry.set_password(test_value)
        .map_err(|e| format!("Failed to store test key: {}", e))?;
    
    // Try to retrieve it
    match entry.get_password() {
        Ok(password) => {
            if password != test_value {
                // Clean up before returning error
                let _ = entry.delete_password();
                return Err("Keychain test failed: retrieved value doesn't match".to_string());
            }
        }
        Err(e) => {
            return Err(format!("Failed to retrieve test key: {}", e));
        }
    }
    
    // Clean up test entry
    entry.delete_password()
        .map_err(|e| format!("Failed to delete test key: {}", e))?;
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_env_var_names() {
        assert_eq!(get_env_var_name("openai"), "OPENAI_API_KEY");
        assert_eq!(get_env_var_name("anthropic"), "ANTHROPIC_API_KEY");
        assert_eq!(get_env_var_name("gemini"), "GEMINI_API_KEY");
        assert_eq!(get_env_var_name("custom"), "CUSTOM_API_KEY");
    }

    #[test]
    fn test_keychain_operations() {
        // Verify the real OS keychain store/get/delete round-trip.
        //
        // We exercise the keyring layer directly with a uniquely-namespaced entry so the
        // test can NEVER touch or clobber a real provider's stored credential. We do not
        // route through store_api_key() here: that function gates on key FORMAT validation
        // (the job of the key_validation module, tested separately) and writes under a real
        // provider's account name, which would risk overwriting a live key.
        let entry = match Entry::new(SERVICE_NAME, "test_keychain_crud_entry") {
            Ok(e) => e,
            Err(e) => panic!("failed to create keyring entry (keychain unavailable?): {e}"),
        };

        // Clean up any leftover from a prior run, then store.
        let _ = entry.delete_password();
        entry.set_password("test_api_key_123").expect("set_password failed");

        // Retrieval round-trips the stored value.
        assert_eq!(entry.get_password().expect("get_password failed"), "test_api_key_123");

        // After deletion, the entry reports NoEntry.
        entry.delete_password().expect("delete_password failed");
        match entry.get_password() {
            Err(keyring::Error::NoEntry) => {}
            other => panic!("expected NoEntry after delete, got {other:?}"),
        }
    }

    #[test]
    fn test_empty_key_rejection() {
        assert!(store_api_key("test", "").is_err());
        assert!(store_api_key("test", "   ").is_err());
    }
}