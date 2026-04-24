use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

/// Type of day for overtime calculation purposes
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "PascalCase")]
pub enum DayType {
    /// Normal working day
    WorkDay,
    /// Weekend day (Saturday/Sunday)
    Weekend,
    /// Public holiday
    PublicHoliday,
    /// User vacation day
    Vacation,
    /// Sick day
    SickDay,
    /// Personal day off
    PersonalDay,
    /// Training day
    Training,
    /// Business trip with manual hours tracking
    BusinessTrip,
    /// Using overtime credit as vacation
    Saldo,
}

/// Time worked on a specific project on a given day
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTime {
    pub project_id: Option<String>,
    pub project_name: String,
    pub client_name: Option<String>,
    pub hours: f64,
    pub billable: bool,
}

/// Breakdown of work for a single day
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayBreakdown {
    /// Date of this breakdown
    pub date: String, // Format: YYYY-MM-DD
    /// Day of week (Monday, Tuesday, etc.)
    pub day_of_week: String,
    /// Type of day (work, weekend, holiday, etc.)
    pub day_type: DayType,
    /// Expected work hours for this day
    pub expected_hours: f64,
    /// Actual hours worked
    pub actual_hours: f64,
    /// Overtime for this day (actual - expected)
    pub overtime_hours: f64,
    /// Projects worked on this day
    pub projects_worked: Vec<ProjectTime>,
    /// Number of time entries on this day
    pub time_entries_count: i32,
}

/// Aggregated project breakdown for a period
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectBreakdown {
    pub project_id: Option<String>,
    pub project_name: String,
    pub client_name: Option<String>,
    /// Total hours on this project
    pub total_hours: f64,
    /// Billable hours only
    pub billable_hours: f64,
    /// Non-billable hours
    pub non_billable_hours: f64,
    /// Percentage of total time
    pub percentage_of_total: f64,
    /// Number of time entries
    pub entry_count: i32,
}

/// Complete overtime report for a date range
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OvertimeReport {
    /// Start date of the period (YYYY-MM-DD)
    pub period_start: String,
    /// End date of the period (YYYY-MM-DD)
    pub period_end: String,
    /// Total hours worked in the period
    pub total_worked_hours: f64,
    /// Expected work hours for the period
    pub expected_work_hours: f64,
    /// Overtime hours (can be negative)
    pub overtime_hours: f64,
    /// Number of work days in period
    pub work_days_count: i32,
    /// Number of weekend days worked
    pub weekend_days_worked: i32,
    /// Number of vacation days taken
    pub vacation_days_taken: i32,
    /// Number of sick days taken
    pub sick_days_taken: i32,
    /// Number of personal days taken
    pub personal_days_taken: i32,
    /// Number of training days
    pub training_days_count: i32,
    /// Number of public holidays in period
    pub public_holidays_count: i32,
    /// Daily breakdown for each day in the period
    pub daily_breakdown: Vec<DayBreakdown>,
    /// Project breakdown aggregated for the period
    pub project_breakdown: Vec<ProjectBreakdown>,
}

impl OvertimeReport {
    /// Create a new empty overtime report
    pub fn new(period_start: NaiveDate, period_end: NaiveDate) -> Self {
        Self {
            period_start: period_start.format("%Y-%m-%d").to_string(),
            period_end: period_end.format("%Y-%m-%d").to_string(),
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
            daily_breakdown: Vec::new(),
            project_breakdown: Vec::new(),
        }
    }

    /// Calculate aggregate statistics from daily breakdown
    pub fn calculate_aggregates(&mut self) {
        self.total_worked_hours = self.daily_breakdown.iter().map(|d| d.actual_hours).sum();
        self.expected_work_hours = self.daily_breakdown.iter().map(|d| d.expected_hours).sum();
        self.overtime_hours = self.total_worked_hours - self.expected_work_hours;

        self.work_days_count = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::WorkDay)
            .count() as i32;

        self.weekend_days_worked = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::Weekend && d.actual_hours > 0.0)
            .count() as i32;

        self.vacation_days_taken = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::Vacation)
            .count() as i32;

        self.sick_days_taken = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::SickDay)
            .count() as i32;

        self.personal_days_taken = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::PersonalDay)
            .count() as i32;

        self.training_days_count = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::Training)
            .count() as i32;

        self.public_holidays_count = self
            .daily_breakdown
            .iter()
            .filter(|d| d.day_type == DayType::PublicHoliday)
            .count() as i32;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    #[test]
    fn test_overtime_report_creation() {
        let start = NaiveDate::from_ymd_opt(2025, 10, 1).unwrap();
        let end = NaiveDate::from_ymd_opt(2025, 10, 7).unwrap();
        let report = OvertimeReport::new(start, end);

        assert_eq!(report.period_start, "2025-10-01");
        assert_eq!(report.period_end, "2025-10-07");
        assert_eq!(report.total_worked_hours, 0.0);
        assert_eq!(report.overtime_hours, 0.0);
    }

    #[test]
    fn test_calculate_aggregates() {
        let start = NaiveDate::from_ymd_opt(2025, 10, 1).unwrap();
        let end = NaiveDate::from_ymd_opt(2025, 10, 5).unwrap();
        let mut report = OvertimeReport::new(start, end);

        // Add some daily breakdowns
        report.daily_breakdown.push(DayBreakdown {
            date: "2025-10-01".to_string(),
            day_of_week: "Monday".to_string(),
            day_type: DayType::WorkDay,
            expected_hours: 8.0,
            actual_hours: 9.0,
            overtime_hours: 1.0,
            projects_worked: vec![],
            time_entries_count: 1,
        });

        report.daily_breakdown.push(DayBreakdown {
            date: "2025-10-02".to_string(),
            day_of_week: "Tuesday".to_string(),
            day_type: DayType::WorkDay,
            expected_hours: 8.0,
            actual_hours: 7.5,
            overtime_hours: -0.5,
            projects_worked: vec![],
            time_entries_count: 1,
        });

        report.daily_breakdown.push(DayBreakdown {
            date: "2025-10-03".to_string(),
            day_of_week: "Wednesday".to_string(),
            day_type: DayType::PublicHoliday,
            expected_hours: 0.0,
            actual_hours: 0.0,
            overtime_hours: 0.0,
            projects_worked: vec![],
            time_entries_count: 0,
        });

        report.calculate_aggregates();

        assert_eq!(report.total_worked_hours, 16.5);
        assert_eq!(report.expected_work_hours, 16.0);
        assert_eq!(report.overtime_hours, 0.5);
        assert_eq!(report.work_days_count, 2);
        assert_eq!(report.public_holidays_count, 1);
    }

    #[test]
    fn test_day_type_serialization() {
        let day_type = DayType::WorkDay;
        let json = serde_json::to_string(&day_type).unwrap();
        assert_eq!(json, "\"WorkDay\"");

        let vacation = DayType::Vacation;
        let json = serde_json::to_string(&vacation).unwrap();
        assert_eq!(json, "\"Vacation\"");
    }
}
