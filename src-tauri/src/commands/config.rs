use crate::error::AppResult;
use crate::models::config::AppConfig;
use crate::services::config_service::ConfigService;
use tauri::{AppHandle, Manager};

/// Get the current configuration
#[tauri::command]
pub async fn get_config(app: AppHandle) -> AppResult<AppConfig> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::error::AppError::Config(format!("Failed to get app data dir: {}", e)))?;
    
    let config_service = ConfigService::new(app_data_dir)?;
    config_service.read_config()
}

/// Save configuration
#[tauri::command]
pub async fn save_config(app: AppHandle, config: AppConfig) -> AppResult<()> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::error::AppError::Config(format!("Failed to get app data dir: {}", e)))?;
    
    let config_service = ConfigService::new(app_data_dir)?;
    config_service.write_config(&config)
}

/// Get the path to the config file (for debugging)
#[tauri::command]
pub async fn get_config_path(app: AppHandle) -> AppResult<String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::error::AppError::Config(format!("Failed to get app data dir: {}", e)))?;
    
    let config_service = ConfigService::new(app_data_dir)?;
    Ok(config_service.config_path().to_string_lossy().to_string())
}
