use crate::error::{AppError, AppResult};
use crate::models::config::AppConfig;
use std::fs;
use std::path::PathBuf;

pub struct ConfigService {
    config_path: PathBuf,
}

impl ConfigService {
    /// Create a new ConfigService with the given app data directory
    pub fn new(app_data_dir: PathBuf) -> AppResult<Self> {
        // Ensure the directory exists
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir).map_err(|e| {
                AppError::Config(format!("Failed to create app data directory: {}", e))
            })?;
        }

        let config_path = app_data_dir.join("config.json");

        Ok(Self { config_path })
    }

    /// Read configuration from file
    pub fn read_config(&self) -> AppResult<AppConfig> {
        if !self.config_path.exists() {
            // Return default config if file doesn't exist
            return Ok(AppConfig::default());
        }

        let contents = fs::read_to_string(&self.config_path)
            .map_err(|e| AppError::Config(format!("Failed to read config file: {}", e)))?;

        let config: AppConfig = serde_json::from_str(&contents)
            .map_err(|e| AppError::Config(format!("Failed to parse config file: {}", e)))?;

        Ok(config)
    }

    /// Write configuration to file
    pub fn write_config(&self, config: &AppConfig) -> AppResult<()> {
        let json = serde_json::to_string_pretty(config)
            .map_err(|e| AppError::Config(format!("Failed to serialize config: {}", e)))?;

        fs::write(&self.config_path, json)
            .map_err(|e| AppError::Config(format!("Failed to write config file: {}", e)))?;

        Ok(())
    }

    /// Get the path to the config file
    pub fn config_path(&self) -> &PathBuf {
        &self.config_path
    }
}
