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

/// One day's contribution to a payoff (FIFO allocation).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OvertimePayoffAllocation {
    /// Date of the day (YYYY-MM-DD)
    pub date: String,
    /// English day name, e.g. "Monday"
    pub day_of_week: String,
    /// Total overtime hours the day accumulated
    pub available_overtime: f64,
    /// How many hours from this day are assigned to the payoff
    pub allocated_hours: f64,
}

/// A single overtime payoff entry — hours paid off by the employer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvertimePayoff {
    pub id: String,
    /// Date the payoff was applied (YYYY-MM-DD)
    pub date: String,
    /// Hours deducted (positive value)
    pub hours: f64,
    /// Optional label, e.g. "Q1 Settlement"
    #[serde(default)]
    pub description: String,
    /// FIFO day-by-day breakdown of where these hours came from.
    /// Populated by the frontend when the payoff is created/edited.
    #[serde(default)]
    pub allocations: Vec<OvertimePayoffAllocation>,
}

/// A single contracted-hours period.
/// Both `start_date` and `end_date` are **inclusive** (YYYY-MM-DD).
/// `end_date = None` means the period is open-ended (no expiry).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkHoursPeriod {
    pub id: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub daily_hours: f64,
}

/// Work schedule settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkSettings {
    /// Kept as a fallback for existing configs without a schedule.
    pub daily_hours: f64,
    pub working_days: Vec<String>,
    pub include_breaks: bool,
    pub break_duration_minutes: u32,
    /// Optional entry date — calculations only include data from this date onwards.
    /// Format: YYYY-MM-DD
    #[serde(default)]
    pub entry_date: Option<String>,
    /// Time-bounded contracted hours. Supersedes `daily_hours` when non-empty.
    #[serde(default)]
    pub work_hours_schedule: Vec<WorkHoursPeriod>,
    /// Overtime hours paid off by the employer — reduces the displayed balance.
    #[serde(default)]
    pub overtime_payoffs: Vec<OvertimePayoff>,
}

impl Default for WorkSettings {
    fn default() -> Self {
        Self {
            daily_hours: 8.0,
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
            work_hours_schedule: Vec::new(),
            overtime_payoffs: Vec::new(),
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
