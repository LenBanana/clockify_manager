use crate::error::AppResult;
use crate::models::clockify::{Project, TimeEntry};
use crate::models::config::WorkSettings;
use crate::models::holiday::{PublicHoliday, VacationDay};
use crate::models::overtime::{DayBreakdown, OvertimeReport, ProjectBreakdown};
use crate::services::overtime_service::OvertimeService;

/// Calculate overtime report for a date range
/// 
/// # Arguments
/// * `start_date` - Start date in YYYY-MM-DD format
/// * `end_date` - End date in YYYY-MM-DD format
/// * `work_settings` - Work configuration (daily hours, working days, etc.)
/// * `public_holidays` - List of public holidays in the period
/// * `vacation_days` - List of user vacation days in the period
/// * `time_entries` - Clockify time entries for the period
/// * `projects` - List of projects for name resolution
#[tauri::command]
pub fn calculate_overtime(
    start_date: String,
    end_date: String,
    work_settings: WorkSettings,
    public_holidays: Vec<PublicHoliday>,
    vacation_days: Vec<VacationDay>,
    time_entries: Vec<TimeEntry>,
    projects: Vec<Project>,
) -> AppResult<OvertimeReport> {
    OvertimeService::calculate_overtime(
        &start_date,
        &end_date,
        &work_settings,
        &public_holidays,
        &vacation_days,
        &time_entries,
        &projects,
    )
}

/// Get project breakdown aggregated over a period
/// 
/// # Arguments
/// * `time_entries` - Clockify time entries for the period
/// * `projects` - List of projects for name resolution
#[tauri::command]
pub fn get_project_breakdown(
    time_entries: Vec<TimeEntry>,
    projects: Vec<Project>,
) -> AppResult<Vec<ProjectBreakdown>> {
    Ok(OvertimeService::generate_project_breakdown(&time_entries, &projects))
}

/// Get daily breakdown for a date range
/// 
/// # Arguments
/// * `start_date` - Start date in YYYY-MM-DD format
/// * `end_date` - End date in YYYY-MM-DD format
/// * `work_settings` - Work configuration (daily hours, working days, etc.)
/// * `public_holidays` - List of public holidays in the period
/// * `vacation_days` - List of user vacation days in the period
/// * `time_entries` - Clockify time entries for the period
/// * `projects` - List of projects for name resolution
#[tauri::command]
pub fn get_daily_breakdown(
    start_date: String,
    end_date: String,
    work_settings: WorkSettings,
    public_holidays: Vec<PublicHoliday>,
    vacation_days: Vec<VacationDay>,
    time_entries: Vec<TimeEntry>,
    projects: Vec<Project>,
) -> AppResult<Vec<DayBreakdown>> {
    use crate::utils::date_utils::parse_date;

    let start = parse_date(&start_date)
        .map_err(|e| crate::error::AppError::ValidationError(format!("Invalid start date: {}", e)))?;
    let end = parse_date(&end_date)
        .map_err(|e| crate::error::AppError::ValidationError(format!("Invalid end date: {}", e)))?;

    if start > end {
        return Err(crate::error::AppError::ValidationError(
            "Start date must be before or equal to end date".to_string(),
        ));
    }

    Ok(OvertimeService::generate_daily_breakdown(
        start,
        end,
        &work_settings,
        &public_holidays,
        &vacation_days,
        &time_entries,
        &projects,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::config::WorkSettings;

    fn create_test_work_settings() -> WorkSettings {
        WorkSettings {
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
            work_hours_schedule: vec![],
        }
    }

    #[test]
    fn test_calculate_overtime_command() {
        let work_settings = create_test_work_settings();
        let result = calculate_overtime(
            "2025-10-01".to_string(),
            "2025-10-07".to_string(),
            work_settings,
            vec![],
            vec![],
            vec![],
            vec![],
        );

        assert!(result.is_ok());
        let report = result.unwrap();
        assert_eq!(report.period_start, "2025-10-01");
        assert_eq!(report.period_end, "2025-10-07");
    }

    #[test]
    fn test_get_daily_breakdown_command() {
        let work_settings = create_test_work_settings();
        let result = get_daily_breakdown(
            "2025-10-01".to_string(),
            "2025-10-07".to_string(),
            work_settings,
            vec![],
            vec![],
            vec![],
            vec![],
        );

        assert!(result.is_ok());
        let breakdown = result.unwrap();
        assert_eq!(breakdown.len(), 7); // 7 days
    }

    #[test]
    fn test_invalid_date_range() {
        let work_settings = create_test_work_settings();
        let result = calculate_overtime(
            "2025-10-07".to_string(),
            "2025-10-01".to_string(), // End before start
            work_settings,
            vec![],
            vec![],
            vec![],
            vec![],
        );

        assert!(result.is_err());
    }
}
