use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProviderConfig {
    pub provider_type: String,
    pub base_url: String,
    pub model: String,
    pub enabled: bool,
    // Note: API keys are now stored in secure OS keychain, not in this struct
    // For Ollama bearer tokens, we still use keychain for consistency
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub preferred_provider: String,
    pub openai: AIProviderConfig,
    pub anthropic: AIProviderConfig,
    pub gemini: AIProviderConfig,
    pub ollama: AIProviderConfig,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            preferred_provider: "ollama".to_string(),
            openai: AIProviderConfig {
                provider_type: "openai".to_string(),
                base_url: "https://api.openai.com/v1".to_string(),
                model: "gpt-4".to_string(),
                enabled: false,
            },
            anthropic: AIProviderConfig {
                provider_type: "anthropic".to_string(),
                base_url: "https://api.anthropic.com".to_string(),
                model: "claude-3-sonnet-20240229".to_string(),
                enabled: false,
            },
            gemini: AIProviderConfig {
                provider_type: "gemini".to_string(),
                base_url: "https://generativelanguage.googleapis.com/v1beta".to_string(),
                model: "gemini-pro".to_string(),
                enabled: false,
            },
            ollama: AIProviderConfig {
                provider_type: "ollama".to_string(),
                base_url: "http://localhost:11434".to_string(),
                model: "llama3.1".to_string(),
                enabled: true,
            },
        }
    }
}

impl AppSettings {
    pub fn get_active_provider(&self) -> &AIProviderConfig {
        match self.preferred_provider.as_str() {
            "openai" => &self.openai,
            "anthropic" => &self.anthropic,
            "gemini" => &self.gemini,
            "ollama" => &self.ollama,
            _ => &self.ollama, // Default fallback
        }
    }

    pub fn get_provider_mut(&mut self, provider_type: &str) -> Option<&mut AIProviderConfig> {
        match provider_type {
            "openai" => Some(&mut self.openai),
            "anthropic" => Some(&mut self.anthropic),
            "gemini" => Some(&mut self.gemini),
            "ollama" => Some(&mut self.ollama),
            _ => None,
        }
    }

    pub fn get_provider(&self, provider_type: &str) -> Option<&AIProviderConfig> {
        match provider_type {
            "openai" => Some(&self.openai),
            "anthropic" => Some(&self.anthropic),
            "gemini" => Some(&self.gemini),
            "ollama" => Some(&self.ollama),
            _ => None,
        }
    }
}

pub fn get_settings_path(app_handle: &tauri::AppHandle) -> tauri::Result<PathBuf> {
    let app_data_dir = app_handle.path().app_data_dir()?;
    std::fs::create_dir_all(&app_data_dir)?;
    Ok(app_data_dir.join("settings.json"))
}

pub async fn load_settings(app_handle: &tauri::AppHandle) -> tauri::Result<AppSettings> {
    let settings_path = get_settings_path(app_handle)?;
    
    if settings_path.exists() {
        let contents = std::fs::read_to_string(&settings_path)?;
        let settings: AppSettings = serde_json::from_str(&contents)
            .map_err(|e| tauri::Error::Io(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("Failed to parse settings: {}", e)
            )))?;
        Ok(settings)
    } else {
        let default_settings = AppSettings::default();
        save_settings(app_handle, &default_settings).await?;
        Ok(default_settings)
    }
}

pub async fn save_settings(app_handle: &tauri::AppHandle, settings: &AppSettings) -> tauri::Result<()> {
    let settings_path = get_settings_path(app_handle)?;
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("Failed to serialize settings: {}", e)
        )))?;
    
    std::fs::write(&settings_path, json)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = AppSettings::default();
        assert_eq!(settings.preferred_provider, "ollama");
        assert_eq!(settings.ollama.enabled, true);
        assert_eq!(settings.openai.enabled, false);
    }

    #[test]
    fn test_get_active_provider() {
        let settings = AppSettings::default();
        let active = settings.get_active_provider();
        assert_eq!(active.provider_type, "ollama");
        assert_eq!(active.base_url, "http://localhost:11434");
    }

    #[test]
    fn test_get_provider() {
        let settings = AppSettings::default();
        let openai = settings.get_provider("openai").unwrap();
        assert_eq!(openai.provider_type, "openai");
        assert_eq!(openai.base_url, "https://api.openai.com/v1");
        
        let invalid = settings.get_provider("invalid");
        assert!(invalid.is_none());
    }

    #[test]
    fn test_serialization() {
        let settings = AppSettings::default();
        let json = serde_json::to_string(&settings).unwrap();
        let deserialized: AppSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(settings.preferred_provider, deserialized.preferred_provider);
    }
}