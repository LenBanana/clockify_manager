use crate::error::AppResult;
use crate::models::holiday::{
    GermanState, HolidayCache, PublicHoliday, SchoolHoliday, VacationDay, VacationDayType, VacationRange,
};
use crate::services::holiday_service::HolidayService;
use chrono::NaiveDate;
use tauri::{AppHandle, Manager};
use std::str::FromStr;

/// Helper to get or create holiday service
fn get_holiday_service(app: &AppHandle) -> AppResult<HolidayService> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::error::AppError::Tauri(format!("Failed to get app data dir: {}", e)))?;
    
    HolidayService::new(app_data_dir)
}

/// Get all available German states
#[tauri::command]
pub async fn get_german_states(_app: AppHandle) -> AppResult<Vec<(String, String)>> {
    let states: Vec<(String, String)> = GermanState::all()
        .into_iter()
        .map(|s| (s.code().to_string(), s.name().to_string()))
        .collect();
    
    Ok(states)
}

/// Fetch public holidays for a specific state and year
#[tauri::command]
pub async fn fetch_public_holidays(
    app: AppHandle,
    state_code: String,
    year: i32,
) -> AppResult<Vec<PublicHoliday>> {
    let state = GermanState::from_code(&state_code)
        .ok_or_else(|| crate::error::AppError::Config(format!("Invalid state code: {}", state_code)))?;
    
    let service = get_holiday_service(&app)?;
    service.fetch_public_holidays(state, year).await
}

/// Fetch school holidays for a specific state and year
#[tauri::command]
pub async fn fetch_school_holidays(
    app: AppHandle,
    state_code: String,
    year: i32,
) -> AppResult<Vec<SchoolHoliday>> {
    let state = GermanState::from_code(&state_code)
        .ok_or_else(|| crate::error::AppError::Config(format!("Invalid state code: {}", state_code)))?;
    
    let service = get_holiday_service(&app)?;
    service.fetch_school_holidays(state, year).await
}

/// Fetch and cache all holidays (public + school) for a state and year
#[tauri::command]
pub async fn fetch_and_cache_holidays(
    app: AppHandle,
    state_code: String,
    year: i32,
) -> AppResult<HolidayCache> {
    let state = GermanState::from_code(&state_code)
        .ok_or_else(|| crate::error::AppError::Config(format!("Invalid state code: {}", state_code)))?;
    
    let service = get_holiday_service(&app)?;
    service.fetch_and_cache_holidays(state, year).await
}

/// Add a vacation day
#[tauri::command]
pub async fn add_vacation_day(
    app: AppHandle,
    date: String,
    day_type: String,
    description: Option<String>,
    worked_hours: Option<f64>,
    billable: Option<bool>,
    range_id: Option<String>,
) -> AppResult<()> {
    let date = NaiveDate::from_str(&date)
        .map_err(|e| crate::error::AppError::DateParse(format!("Invalid date format: {}", e)))?;
    
    let day_type = match day_type.as_str() {
        "Vacation" => VacationDayType::Vacation,
        "SickDay" => VacationDayType::SickDay,
        "PersonalDay" => VacationDayType::PersonalDay,
        "Training" => VacationDayType::Training,
        "BusinessTrip" => VacationDayType::BusinessTrip,
        "Saldo" => VacationDayType::Saldo,
        _ => return Err(crate::error::AppError::Config(format!("Invalid day type: {}", day_type))),
    };

    let vacation_day = VacationDay {
        date,
        day_type,
        description,
        worked_hours,
        billable,
        range_id,
    };

    let service = get_holiday_service(&app)?;
    service.add_vacation_day(vacation_day)
}

/// Add multiple vacation days at once (batch operation)
#[tauri::command]
pub async fn add_vacation_days_batch(
    app: AppHandle,
    vacation_days: Vec<serde_json::Value>,
) -> AppResult<()> {
    let service = get_holiday_service(&app)?;
    
    let mut parsed_days = Vec::new();
    
    // Generate a range_id if we're adding multiple days
    let range_id = if vacation_days.len() > 1 {
        Some(uuid::Uuid::new_v4().to_string())
    } else {
        None
    };
    
    for day_json in vacation_days {
        let date_str = day_json["date"]
            .as_str()
            .ok_or_else(|| crate::error::AppError::Config("Missing date field".to_string()))?;
        
        let day_type_str = day_json["dayType"]
            .as_str()
            .ok_or_else(|| crate::error::AppError::Config("Missing dayType field".to_string()))?;
        
        let description = day_json["description"].as_str().map(|s| s.to_string());
        let worked_hours = day_json["workedHours"].as_f64();
        let billable = day_json["billable"].as_bool();
        
        let date = NaiveDate::from_str(date_str)
            .map_err(|e| crate::error::AppError::DateParse(format!("Invalid date format: {}", e)))?;
        
        let day_type = match day_type_str {
            "Vacation" => VacationDayType::Vacation,
            "SickDay" => VacationDayType::SickDay,
            "PersonalDay" => VacationDayType::PersonalDay,
            "Training" => VacationDayType::Training,
            "BusinessTrip" => VacationDayType::BusinessTrip,
            "Saldo" => VacationDayType::Saldo,
            _ => return Err(crate::error::AppError::Config(format!("Invalid day type: {}", day_type_str))),
        };
        
        parsed_days.push(VacationDay {
            date,
            day_type,
            description,
            worked_hours,
            billable,
            range_id: range_id.clone(),
        });
    }
    
    service.add_vacation_days_batch(parsed_days)
}

/// Get all vacation days
#[tauri::command]
pub async fn get_vacation_days(app: AppHandle) -> AppResult<Vec<VacationDay>> {
    let service = get_holiday_service(&app)?;
    service.get_vacation_days()
}

/// Get vacation days in a specific date range
#[tauri::command]
pub async fn get_vacation_days_in_range(
    app: AppHandle,
    start_date: String,
    end_date: String,
) -> AppResult<Vec<VacationDay>> {
    let start = NaiveDate::from_str(&start_date)
        .map_err(|e| crate::error::AppError::DateParse(format!("Invalid start_date format: {}", e)))?;
    
    let end = NaiveDate::from_str(&end_date)
        .map_err(|e| crate::error::AppError::DateParse(format!("Invalid end_date format: {}", e)))?;

    let service = get_holiday_service(&app)?;
    service.get_vacation_days_in_range(start, end)
}

/// Delete a vacation day
#[tauri::command]
pub async fn delete_vacation_day(app: AppHandle, date: String) -> AppResult<()> {
    let date = NaiveDate::from_str(&date)
        .map_err(|e| crate::error::AppError::DateParse(format!("Invalid date format: {}", e)))?;

    let service = get_holiday_service(&app)?;
    service.delete_vacation_day(date)
}

/// Delete vacation days in a date range
#[tauri::command]
pub async fn delete_vacation_days_in_range(
    app: AppHandle,
    start_date: String,
    end_date: String,
) -> AppResult<()> {
    let start = NaiveDate::from_str(&start_date)
        .map_err(|e| crate::error::AppError::DateParse(format!("Invalid start_date format: {}", e)))?;
    
    let end = NaiveDate::from_str(&end_date)
        .map_err(|e| crate::error::AppError::DateParse(format!("Invalid end_date format: {}", e)))?;

    let service = get_holiday_service(&app)?;
    service.delete_vacation_days_in_range(start, end)
}

/// Clear all cached holiday data
#[tauri::command]
pub async fn clear_holiday_cache(app: AppHandle) -> AppResult<()> {
    let service = get_holiday_service(&app)?;
    service.clear_cache()
}

/// Get all vacation ranges (grouped by range_id)
#[tauri::command]
pub async fn get_vacation_ranges(app: AppHandle) -> AppResult<Vec<VacationRange>> {
    let service = get_holiday_service(&app)?;
    service.get_vacation_ranges()
}

/// Delete an entire vacation range by range_id
#[tauri::command]
pub async fn delete_vacation_range(
    app: AppHandle,
    range_id: String,
) -> AppResult<()> {
    let service = get_holiday_service(&app)?;
    service.delete_vacation_range(&range_id)
}

/// Update an entire vacation range (modifies all days in the range)
#[tauri::command]
pub async fn update_vacation_range(
    app: AppHandle,
    range_id: String,
    day_type: Option<String>,
    description: Option<String>,
    worked_hours: Option<f64>,
    billable: Option<bool>,
) -> AppResult<()> {
    let parsed_day_type = if let Some(dt) = day_type {
        Some(match dt.as_str() {
            "Vacation" => VacationDayType::Vacation,
            "SickDay" => VacationDayType::SickDay,
            "PersonalDay" => VacationDayType::PersonalDay,
            "Training" => VacationDayType::Training,
            "BusinessTrip" => VacationDayType::BusinessTrip,
            "Saldo" => VacationDayType::Saldo,
            _ => return Err(crate::error::AppError::Config(format!("Invalid day type: {}", dt))),
        })
    } else {
        None
    };

    let service = get_holiday_service(&app)?;
    service.update_vacation_range(&range_id, parsed_day_type, description, worked_hours, billable)
}
