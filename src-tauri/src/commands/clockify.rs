use crate::error::AppResult;
use crate::models::clockify::{Project, TimeEntry, Workspace, User};
use crate::services::clockify_service::ClockifyService;
use chrono::{DateTime, Utc};
use tauri::AppHandle;

/// Validate Clockify API key
#[tauri::command]
pub async fn validate_clockify_api_key(
    _app: AppHandle,
    api_key: String,
) -> AppResult<bool> {
    let service = ClockifyService::new(api_key, None)?;
    service.validate_api_key().await
}

/// Fetch all workspaces
#[tauri::command]
pub async fn fetch_clockify_workspaces(
    _app: AppHandle,
    api_key: String,
    base_url: Option<String>,
) -> AppResult<Vec<Workspace>> {
    let service = ClockifyService::new(api_key, base_url)?;
    service.fetch_workspaces().await
}

/// Fetch all projects in a workspace
#[tauri::command]
pub async fn fetch_clockify_projects(
    _app: AppHandle,
    api_key: String,
    workspace_id: String,
    base_url: Option<String>,
) -> AppResult<Vec<Project>> {
    let service = ClockifyService::new(api_key, base_url)?;
    service.fetch_projects(&workspace_id).await
}

/// Fetch current user info
#[tauri::command]
pub async fn fetch_clockify_user(
    _app: AppHandle,
    api_key: String,
    base_url: Option<String>,
) -> AppResult<User> {
    let service = ClockifyService::new(api_key, base_url)?;
    service.fetch_user().await
}

/// Fetch time entries for a date range
#[tauri::command]
pub async fn fetch_clockify_time_entries(
    _app: AppHandle,
    api_key: String,
    workspace_id: String,
    start_date: String,
    end_date: String,
    base_url: Option<String>,
) -> AppResult<Vec<TimeEntry>> {
    // Parse ISO 8601 date strings
    let start: DateTime<Utc> = start_date.parse().map_err(|e| {
        crate::error::AppError::DateParse(format!("Invalid start_date format: {}", e))
    })?;

    let end: DateTime<Utc> = end_date.parse().map_err(|e| {
        crate::error::AppError::DateParse(format!("Invalid end_date format: {}", e))
    })?;

    let service = ClockifyService::new(api_key, base_url)?;
    service.fetch_time_entries(&workspace_id, start, end).await
}
