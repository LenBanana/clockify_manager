use thiserror::Error;

/// Custom error types for the application
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("IO error: {0}")]
    IoError(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("HTTP request error: {0}")]
    Request(#[from] reqwest::Error),

    #[error("Clockify API error: {0}")]
    ClockifyApi(String),

    #[error("Holiday API error: {0}")]
    HolidayApi(String),

    #[error("Calculation error: {0}")]
    Calculation(String),

    #[error("Invalid date format: {0}")]
    DateParse(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Tauri error: {0}")]
    Tauri(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}

/// Result type alias for the application
pub type AppResult<T> = Result<T, AppError>;

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
