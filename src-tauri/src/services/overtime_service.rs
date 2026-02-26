use crate::error::{AppError, AppResult};
use crate::models::clockify::{parse_duration_to_hours, Project, TimeEntry};
use crate::models::config::WorkSettings;
use crate::models::holiday::{PublicHoliday, VacationDay};
use crate::models::overtime::{DayBreakdown, DayType, OvertimeReport, ProjectBreakdown, ProjectTime};
use crate::utils::date_utils::{
    classify_day, date_range, format_date, get_day_of_week_name, get_vacation_day, parse_date,
};
use chrono::NaiveDate;
use std::collections::HashMap;

/// Service for calculating overtime and generating reports
pub struct OvertimeService;

impl OvertimeService {
    /// Return the contracted daily hours for a specific calendar date.
    ///
    /// Walks `work_settings.work_hours_schedule` (sorted by `start_date` ascending)
    /// and returns the `daily_hours` of the first period whose inclusive date range
    /// covers `date`.  Falls back to `work_settings.daily_hours` when the schedule
    /// is empty or no period matches.
    pub fn get_daily_hours_for_date(date: &NaiveDate, work_settings: &WorkSettings) -> f64 {
        // Sort a local copy so callers don't need to pre-sort.
        let mut periods = work_settings.work_hours_schedule.clone();
        periods.sort_by(|a, b| a.start_date.cmp(&b.start_date));

        for period in &periods {
            let start = match parse_date(&period.start_date) {
                Ok(d) => d,
                Err(_) => continue,
            };

            if *date < start {
                continue;
            }

            if let Some(ref end_str) = period.end_date {
                match parse_date(end_str) {
                    // end_date is inclusive — skip if date is strictly after it
                    Ok(end) => {
                        if *date > end {
                            continue;
                        }
                    }
                    Err(_) => continue,
                }
            }

            return period.daily_hours;
        }

        // Fallback: use the flat daily_hours value (supports old configs / empty schedule)
        work_settings.daily_hours
    }

    /// Calculate expected work hours for a specific day based on its type and date.
    pub fn calculate_expected_hours(
        day_type: DayType,
        work_settings: &WorkSettings,
        date: &NaiveDate,
    ) -> f64 {
        match day_type {
            DayType::WorkDay => Self::get_daily_hours_for_date(date, work_settings),
            DayType::Training => Self::get_daily_hours_for_date(date, work_settings),
            DayType::BusinessTrip => Self::get_daily_hours_for_date(date, work_settings),
            DayType::Saldo => Self::get_daily_hours_for_date(date, work_settings),
            // Weekend, public holidays, vacation, sick days — no expected work
            _ => 0.0,
        }
    }

    /// Sum actual hours worked on a specific date from time entries.
    /// Skips running timers (entries with null end time or null duration).
    /// Groups entries by start date (midnight-spanning entries counted on start date).
    pub fn sum_time_entries_for_day(date: &NaiveDate, time_entries: &[TimeEntry]) -> f64 {
        time_entries
            .iter()
            .filter(|entry| {
                // Skip running timers (no end time or no duration)
                if entry.time_interval.end.is_none() || entry.time_interval.duration.is_none() {
                    return false;
                }

                // Check if entry starts on this date (use UTC date portion)
                let entry_date = entry.time_interval.start.date_naive();
                entry_date == *date
            })
            .filter_map(|entry| {
                // Parse duration safely
                entry
                    .time_interval
                    .duration
                    .as_ref()
                    .and_then(|d| parse_duration_to_hours(d).ok())
            })
            .sum()
    }

    /// Get project time breakdown for a specific day
    pub fn get_project_times_for_day(
        date: &NaiveDate,
        time_entries: &[TimeEntry],
        projects: &[Project],
    ) -> Vec<ProjectTime> {
        let mut project_map: HashMap<Option<String>, ProjectTime> = HashMap::new();

        for entry in time_entries {
            // Skip running timers
            if entry.time_interval.end.is_none() || entry.time_interval.duration.is_none() {
                continue;
            }

            // Check if entry is for this date
            let entry_date = entry.time_interval.start.date_naive();
            if entry_date != *date {
                continue;
            }

            // Parse duration
            let hours = match entry.time_interval.duration.as_ref().and_then(|d| parse_duration_to_hours(d).ok()) {
                Some(h) => h,
                None => continue,
            };

            // Get project info
            let project_id = entry.project_id.clone();
            let project = projects.iter().find(|p| Some(&p.id) == project_id.as_ref());

            let project_name = project
                .map(|p| p.name.clone())
                .unwrap_or_else(|| "No Project".to_string());

            let client_name = project.and_then(|p| p.client_name.clone());

            // Add or update project time
            project_map
                .entry(project_id.clone())
                .and_modify(|pt| pt.hours += hours)
                .or_insert(ProjectTime {
                    project_id: project_id.clone(),
                    project_name,
                    client_name,
                    hours,
                    billable: entry.billable,
                });
        }

        project_map.into_values().collect()
    }

    /// Count time entries for a specific day
    pub fn count_time_entries_for_day(date: &NaiveDate, time_entries: &[TimeEntry]) -> i32 {
        time_entries
            .iter()
            .filter(|entry| {
                // Skip running timers
                if entry.time_interval.end.is_none() {
                    return false;
                }

                let entry_date = entry.time_interval.start.date_naive();
                entry_date == *date
            })
            .count() as i32
    }

    /// Generate daily breakdown for a date range
    pub fn generate_daily_breakdown(
        start_date: NaiveDate,
        end_date: NaiveDate,
        work_settings: &WorkSettings,
        public_holidays: &[PublicHoliday],
        vacation_days: &[VacationDay],
        time_entries: &[TimeEntry],
        projects: &[Project],
    ) -> Vec<DayBreakdown> {
        let dates = date_range(start_date, end_date);
        let mut breakdown = Vec::new();

        for date in dates {
            let day_type = classify_day(&date, &work_settings.working_days, public_holidays, vacation_days);
            let expected_hours = Self::calculate_expected_hours(day_type, work_settings, &date);

            // For BusinessTrip days, use the worked_hours field instead of summing time entries
            let actual_hours = if day_type == DayType::BusinessTrip {
                get_vacation_day(&date, vacation_days)
                    .and_then(|v| v.worked_hours)
                    .unwrap_or(0.0)
            } else {
                Self::sum_time_entries_for_day(&date, time_entries)
            };

            let overtime_hours = actual_hours - expected_hours;
            let projects_worked = Self::get_project_times_for_day(&date, time_entries, projects);
            let time_entries_count = Self::count_time_entries_for_day(&date, time_entries);

            breakdown.push(DayBreakdown {
                date: format_date(&date),
                day_of_week: get_day_of_week_name(&date),
                day_type,
                expected_hours,
                actual_hours,
                overtime_hours,
                projects_worked,
                time_entries_count,
            });
        }

        breakdown
    }

    /// Generate project breakdown aggregated over the entire period
    pub fn generate_project_breakdown(
        time_entries: &[TimeEntry],
        projects: &[Project],
    ) -> Vec<ProjectBreakdown> {
        let mut project_map: HashMap<Option<String>, ProjectBreakdown> = HashMap::new();
        let mut total_hours_all_projects = 0.0;

        for entry in time_entries {
            // Skip running timers
            if entry.time_interval.end.is_none() || entry.time_interval.duration.is_none() {
                continue;
            }

            // Parse duration
            let hours = match entry.time_interval.duration.as_ref().and_then(|d| parse_duration_to_hours(d).ok()) {
                Some(h) => h,
                None => continue,
            };

            total_hours_all_projects += hours;

            let project_id = entry.project_id.clone();
            let project = projects.iter().find(|p| Some(&p.id) == project_id.as_ref());

            let project_name = project
                .map(|p| p.name.clone())
                .unwrap_or_else(|| "No Project".to_string());

            let client_name = project.and_then(|p| p.client_name.clone());

            let billable_hours = if entry.billable { hours } else { 0.0 };
            let non_billable_hours = if entry.billable { 0.0 } else { hours };

            project_map
                .entry(project_id.clone())
                .and_modify(|pb| {
                    pb.total_hours += hours;
                    pb.billable_hours += billable_hours;
                    pb.non_billable_hours += non_billable_hours;
                    pb.entry_count += 1;
                })
                .or_insert(ProjectBreakdown {
                    project_id: project_id.clone(),
                    project_name,
                    client_name,
                    total_hours: hours,
                    billable_hours,
                    non_billable_hours,
                    percentage_of_total: 0.0, // Will be calculated below
                    entry_count: 1,
                });
        }

        // Calculate percentages
        let mut breakdown: Vec<ProjectBreakdown> = project_map.into_values().collect();
        for project in &mut breakdown {
            if total_hours_all_projects > 0.0 {
                project.percentage_of_total = (project.total_hours / total_hours_all_projects) * 100.0;
            }
        }

        // Sort by total hours descending
        breakdown.sort_by(|a, b| b.total_hours.partial_cmp(&a.total_hours).unwrap());

        breakdown
    }

    /// Generate complete overtime report for a date range
    pub fn calculate_overtime(
        start_date_str: &str,
        end_date_str: &str,
        work_settings: &WorkSettings,
        public_holidays: &[PublicHoliday],
        vacation_days: &[VacationDay],
        time_entries: &[TimeEntry],
        projects: &[Project],
    ) -> AppResult<OvertimeReport> {
        // Parse dates
        let start_date = parse_date(start_date_str)
            .map_err(|e| AppError::ValidationError(format!("Invalid start date: {}", e)))?;
        let end_date = parse_date(end_date_str)
            .map_err(|e| AppError::ValidationError(format!("Invalid end date: {}", e)))?;

        if start_date > end_date {
            return Err(AppError::ValidationError(
                "Start date must be before or equal to end date".to_string(),
            ));
        }

        // Parse entry date if configured
        let entry_date = if let Some(ref entry_date_str) = work_settings.entry_date {
            if !entry_date_str.is_empty() {
                Some(parse_date(entry_date_str)
                    .map_err(|e| AppError::ValidationError(format!("Invalid entry date: {}", e)))?)
            } else {
                None
            }
        } else {
            None
        };

        // Adjust start_date if entry_date is later
        let effective_start_date = if let Some(entry_dt) = entry_date {
            if entry_dt > start_date {
                entry_dt
            } else {
                start_date
            }
        } else {
            start_date
        };

        // Filter time entries to only include those on or after the entry date
        let filtered_time_entries: Vec<TimeEntry> = if let Some(entry_dt) = entry_date {
            time_entries
                .iter()
                .filter(|entry| {
                    let entry_date = entry.time_interval.start.date_naive();
                    entry_date >= entry_dt
                })
                .cloned()
                .collect()
        } else {
            time_entries.to_vec()
        };

        // Generate daily breakdown (using effective start date)
        let daily_breakdown = Self::generate_daily_breakdown(
            effective_start_date,
            end_date,
            work_settings,
            public_holidays,
            vacation_days,
            &filtered_time_entries,
            projects,
        );

        // Generate project breakdown (using filtered entries)
        let project_breakdown = Self::generate_project_breakdown(&filtered_time_entries, projects);

        // Create report
        let mut report = OvertimeReport {
            period_start: format_date(&start_date),
            period_end: format_date(&end_date),
            total_worked_hours: 0.0,
            expected_work_hours: 0.0,
            overtime_hours: 0.0,
            work_days_count: 0,
            weekend_days_worked: 0,
            vacation_days_taken: 0,
            sick_days_taken: 0,
            personal_days_taken: 0,
            training_days_count: 0,
            public_holidays_count: 0,
            daily_breakdown,
            project_breakdown,
        };

        // Calculate aggregates
        report.calculate_aggregates();

        Ok(report)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{DateTime, Utc};
    use crate::models::clockify::TimeInterval;

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

    fn create_test_time_entry(start: &str, duration: &str) -> TimeEntry {
        let start_dt: DateTime<Utc> = start.parse().unwrap();
        let end_dt: DateTime<Utc> = start_dt + chrono::Duration::hours(8);

        TimeEntry {
            id: "test-id".to_string(),
            description: Some("Test entry".to_string()),
            user_id: "user-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            project_id: Some("project-1".to_string()),
            task_id: None,
            time_interval: TimeInterval {
                start: start_dt,
                end: Some(end_dt),
                duration: Some(duration.to_string()),
            },
            billable: true,
            tag_ids: None,
            custom_field_values: None,
            r#type: Some("REGULAR".to_string()),
            kiosk_id: None,
            hourly_rate: None,
            cost_rate: None,
            is_locked: None,
        }
    }

    #[test]
    fn test_calculate_expected_hours_uses_schedule() {
        use crate::models::config::WorkHoursPeriod;

        let mut work_settings = create_test_work_settings();
        work_settings.work_hours_schedule = vec![
            WorkHoursPeriod {
                id: "p1".to_string(),
                start_date: "2024-01-01".to_string(),
                end_date: Some("2024-02-29".to_string()),
                daily_hours: 6.0,
            },
            WorkHoursPeriod {
                id: "p2".to_string(),
                start_date: "2024-03-01".to_string(),
                end_date: None,
                daily_hours: 8.0,
            },
        ];

        let jan_date = NaiveDate::from_ymd_opt(2024, 1, 15).unwrap();
        let mar_date = NaiveDate::from_ymd_opt(2024, 3, 15).unwrap();

        assert_eq!(
            OvertimeService::calculate_expected_hours(DayType::WorkDay, &work_settings, &jan_date),
            6.0
        );
        assert_eq!(
            OvertimeService::calculate_expected_hours(DayType::WorkDay, &work_settings, &mar_date),
            8.0
        );
        assert_eq!(
            OvertimeService::calculate_expected_hours(DayType::Weekend, &work_settings, &jan_date),
            0.0
        );
        assert_eq!(
            OvertimeService::calculate_expected_hours(DayType::Vacation, &work_settings, &jan_date),
            0.0
        );
    }

    #[test]
    fn test_calculate_expected_hours_fallback() {
        // Empty schedule → falls back to work_settings.daily_hours
        let work_settings = create_test_work_settings(); // daily_hours = 8, schedule = []
        let date = NaiveDate::from_ymd_opt(2025, 10, 8).unwrap();
        assert_eq!(
            OvertimeService::calculate_expected_hours(DayType::WorkDay, &work_settings, &date),
            8.0
        );
    }

    #[test]
    fn test_sum_time_entries_for_day() {
        let date = NaiveDate::from_ymd_opt(2025, 10, 8).unwrap();

        let entries = vec![
            create_test_time_entry("2025-10-08T09:00:00Z", "PT8H"),
            create_test_time_entry("2025-10-08T17:00:00Z", "PT2H"),
            create_test_time_entry("2025-10-09T09:00:00Z", "PT8H"), // Different day
        ];

        let total = OvertimeService::sum_time_entries_for_day(&date, &entries);
        assert_eq!(total, 10.0); // Only first two entries
    }

    #[test]
    fn test_sum_time_entries_skips_running_timers() {
        let date = NaiveDate::from_ymd_opt(2025, 10, 8).unwrap();

        let start_dt: DateTime<Utc> = "2025-10-08T09:00:00Z".parse().unwrap();

        let running_entry = TimeEntry {
            id: "test-id".to_string(),
            description: Some("Running timer".to_string()),
            user_id: "user-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            project_id: Some("project-1".to_string()),
            task_id: None,
            time_interval: TimeInterval {
                start: start_dt,
                end: None, // Running timer
                duration: None,
            },
            billable: true,
            tag_ids: None,
            custom_field_values: None,
            r#type: Some("REGULAR".to_string()),
            kiosk_id: None,
            hourly_rate: None,
            cost_rate: None,
            is_locked: None,
        };

        let entries = vec![
            create_test_time_entry("2025-10-08T09:00:00Z", "PT8H"),
            running_entry,
        ];

        let total = OvertimeService::sum_time_entries_for_day(&date, &entries);
        assert_eq!(total, 8.0); // Only completed entry
    }

    #[test]
    fn test_calculate_overtime() {
        let work_settings = create_test_work_settings();
        let public_holidays = vec![];
        let vacation_days = vec![];
        let projects = vec![crate::models::clockify::Project {
            id: "project-1".to_string(),
            name: "Test Project".to_string(),
            client_id: None,
            client_name: None,
            color: None,
            billable: true,
            archived: false,
        }];

        let entries = vec![
            create_test_time_entry("2025-10-06T09:00:00Z", "PT8H"), // Monday
            create_test_time_entry("2025-10-07T09:00:00Z", "PT9H"), // Tuesday
        ];

        let report = OvertimeService::calculate_overtime(
            "2025-10-06",
            "2025-10-07",
            &work_settings,
            &public_holidays,
            &vacation_days,
            &entries,
            &projects,
        )
        .unwrap();

        assert_eq!(report.period_start, "2025-10-06");
        assert_eq!(report.period_end, "2025-10-07");
        assert_eq!(report.total_worked_hours, 17.0);
        assert_eq!(report.expected_work_hours, 16.0);
        assert_eq!(report.overtime_hours, 1.0);
        assert_eq!(report.work_days_count, 2);
        assert_eq!(report.daily_breakdown.len(), 2);
    }
}
