use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub clockify: ClockifyConfig,
    pub work_settings: WorkSettings,
    pub location: LocationSettings,
    #[serde(default)]
    pub ui_settings: UiSettings,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            clockify: ClockifyConfig::default(),
            work_settings: WorkSettings::default(),
            location: LocationSettings::default(),
            ui_settings: UiSettings::default(),
        }
    }
}

/// Clockify API configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClockifyConfig {
    pub api_key: String,
    pub workspace_id: String,
    pub base_url: String,
}

impl Default for ClockifyConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            workspace_id: String::new(),
            base_url: "https://api.clockify.me/api/v1".to_string(),
        }
    }
}

/// Work schedule settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkSettings {
    pub daily_hours: f64,
    pub weekly_hours: f64,
    pub working_days: Vec<String>,
    pub include_breaks: bool,
    pub break_duration_minutes: u32,
    /// Optional entry date - calculations only include data from this date onwards
    /// Format: YYYY-MM-DD
    #[serde(default)]
    pub entry_date: Option<String>,
}

impl Default for WorkSettings {
    fn default() -> Self {
        Self {
            daily_hours: 8.0,
            weekly_hours: 40.0,
            working_days: vec![
                "monday".to_string(),
                "tuesday".to_string(),
                "wednesday".to_string(),
                "thursday".to_string(),
                "friday".to_string(),
            ],
            include_breaks: true,
            break_duration_minutes: 30,
            entry_date: None,
        }
    }
}

/// Location settings for holiday calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationSettings {
    pub bundesland_code: String,
    pub bundesland_name: String,
}

impl Default for LocationSettings {
    fn default() -> Self {
        Self {
            bundesland_code: String::new(),
            bundesland_name: String::new(),
        }
    }
}

/// UI/Theme settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiSettings {
    pub theme: String,
}

impl Default for UiSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
        }
    }
}
