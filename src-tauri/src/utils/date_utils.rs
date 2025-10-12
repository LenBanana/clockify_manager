use chrono::{Datelike, NaiveDate, Weekday};
use crate::models::holiday::{PublicHoliday, VacationDay, VacationDayType};
use crate::models::overtime::DayType;

/// Get the day of week as a string
pub fn get_day_of_week_name(date: &NaiveDate) -> String {
    match date.weekday() {
        Weekday::Mon => "Monday",
        Weekday::Tue => "Tuesday",
        Weekday::Wed => "Wednesday",
        Weekday::Thu => "Thursday",
        Weekday::Fri => "Friday",
        Weekday::Sat => "Saturday",
        Weekday::Sun => "Sunday",
    }
    .to_string()
}

/// Check if a date is a weekend (Saturday or Sunday)
pub fn is_weekend(date: &NaiveDate) -> bool {
    matches!(date.weekday(), Weekday::Sat | Weekday::Sun)
}

/// Check if a date is a working day according to the configured working days
pub fn is_working_day(date: &NaiveDate, working_days: &[String]) -> bool {
    let day_name = get_day_of_week_name(date).to_lowercase();
    working_days.iter().any(|d| d.to_lowercase() == day_name)
}

/// Check if a date is a public holiday
pub fn is_public_holiday(date: &NaiveDate, public_holidays: &[PublicHoliday]) -> bool {
    public_holidays.iter().any(|h| h.date == *date)
}

/// Get public holiday info for a specific date
pub fn get_public_holiday<'a>(
    date: &NaiveDate,
    public_holidays: &'a [PublicHoliday],
) -> Option<&'a PublicHoliday> {
    public_holidays.iter().find(|h| h.date == *date)
}

/// Check if a date is a vacation day
pub fn is_vacation_day(date: &NaiveDate, vacation_days: &[VacationDay]) -> bool {
    vacation_days.iter().any(|v| v.date == *date)
}

/// Get vacation day info for a specific date
pub fn get_vacation_day<'a>(
    date: &NaiveDate,
    vacation_days: &'a [VacationDay],
) -> Option<&'a VacationDay> {
    vacation_days.iter().find(|v| v.date == *date)
}

/// Classify a day based on holidays, vacation days, and work settings
/// Priority order:
/// 1. Vacation days (Vacation, SickDay, PersonalDay, Training)
/// 2. Public holidays
/// 3. Weekend
/// 4. Working day
pub fn classify_day(
    date: &NaiveDate,
    working_days: &[String],
    public_holidays: &[PublicHoliday],
    vacation_days: &[VacationDay],
) -> DayType {
    // Check vacation days first (highest priority)
    if let Some(vacation_day) = get_vacation_day(date, vacation_days) {
        return match vacation_day.day_type {
            VacationDayType::Vacation => DayType::Vacation,
            VacationDayType::SickDay => DayType::SickDay,
            VacationDayType::PersonalDay => DayType::PersonalDay,
            VacationDayType::Training => DayType::Training,
            VacationDayType::BusinessTrip => DayType::BusinessTrip,
            VacationDayType::Saldo => DayType::Saldo,
        };
    }

    // Check public holidays
    if is_public_holiday(date, public_holidays) {
        return DayType::PublicHoliday;
    }

    // Check if weekend
    if is_weekend(date) {
        return DayType::Weekend;
    }

    // Check if configured working day
    if is_working_day(date, working_days) {
        return DayType::WorkDay;
    }

    // Default to weekend if not in working days list
    DayType::Weekend
}

/// Generate a list of all dates between start and end (inclusive)
pub fn date_range(start: NaiveDate, end: NaiveDate) -> Vec<NaiveDate> {
    let mut dates = Vec::new();
    let mut current = start;
    
    while current <= end {
        dates.push(current);
        current = current.succ_opt().expect("Date overflow");
    }
    
    dates
}

/// Parse a date string in YYYY-MM-DD format
pub fn parse_date(date_str: &str) -> Result<NaiveDate, String> {
    NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
        .map_err(|e| format!("Failed to parse date '{}': {}", date_str, e))
}

/// Format a date to YYYY-MM-DD string
pub fn format_date(date: &NaiveDate) -> String {
    date.format("%Y-%m-%d").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::holiday::PublicHoliday;

    #[test]
    fn test_get_day_of_week_name() {
        let date = NaiveDate::from_ymd_opt(2025, 10, 6).unwrap(); // Monday
        assert_eq!(get_day_of_week_name(&date), "Monday");

        let date = NaiveDate::from_ymd_opt(2025, 10, 11).unwrap(); // Saturday
        assert_eq!(get_day_of_week_name(&date), "Saturday");
    }

    #[test]
    fn test_is_weekend() {
        let monday = NaiveDate::from_ymd_opt(2025, 10, 6).unwrap();
        assert!(!is_weekend(&monday));

        let saturday = NaiveDate::from_ymd_opt(2025, 10, 11).unwrap();
        assert!(is_weekend(&saturday));

        let sunday = NaiveDate::from_ymd_opt(2025, 10, 12).unwrap();
        assert!(is_weekend(&sunday));
    }

    #[test]
    fn test_is_working_day() {
        let working_days = vec![
            "monday".to_string(),
            "tuesday".to_string(),
            "wednesday".to_string(),
            "thursday".to_string(),
            "friday".to_string(),
        ];

        let monday = NaiveDate::from_ymd_opt(2025, 10, 6).unwrap();
        assert!(is_working_day(&monday, &working_days));

        let saturday = NaiveDate::from_ymd_opt(2025, 10, 11).unwrap();
        assert!(!is_working_day(&saturday, &working_days));
    }

    #[test]
    fn test_is_public_holiday() {
        let holidays = vec![PublicHoliday {
            date: NaiveDate::from_ymd_opt(2025, 10, 3).unwrap(),
            name: "German Unity Day".to_string(),
            local_name: "Tag der Deutschen Einheit".to_string(),
            subdivisions: None,
        }];

        let holiday_date = NaiveDate::from_ymd_opt(2025, 10, 3).unwrap();
        assert!(is_public_holiday(&holiday_date, &holidays));

        let non_holiday = NaiveDate::from_ymd_opt(2025, 10, 6).unwrap();
        assert!(!is_public_holiday(&non_holiday, &holidays));
    }

    #[test]
    fn test_classify_day() {
        let working_days = vec![
            "monday".to_string(),
            "tuesday".to_string(),
            "wednesday".to_string(),
            "thursday".to_string(),
            "friday".to_string(),
        ];

        let public_holidays = vec![PublicHoliday {
            date: NaiveDate::from_ymd_opt(2025, 10, 3).unwrap(),
            name: "German Unity Day".to_string(),
            local_name: "Tag der Deutschen Einheit".to_string(),
            subdivisions: None,
        }];

        let vacation_days = vec![VacationDay {
            date: NaiveDate::from_ymd_opt(2025, 10, 7).unwrap(),
            day_type: VacationDayType::Vacation,
            description: Some("Personal vacation".to_string()),
        }];

        // Test work day
        let monday = NaiveDate::from_ymd_opt(2025, 10, 6).unwrap();
        assert_eq!(
            classify_day(&monday, &working_days, &public_holidays, &vacation_days),
            DayType::WorkDay
        );

        // Test weekend
        let saturday = NaiveDate::from_ymd_opt(2025, 10, 11).unwrap();
        assert_eq!(
            classify_day(&saturday, &working_days, &public_holidays, &vacation_days),
            DayType::Weekend
        );

        // Test public holiday
        let holiday = NaiveDate::from_ymd_opt(2025, 10, 3).unwrap();
        assert_eq!(
            classify_day(&holiday, &working_days, &public_holidays, &vacation_days),
            DayType::PublicHoliday
        );

        // Test vacation day
        let vacation = NaiveDate::from_ymd_opt(2025, 10, 7).unwrap();
        assert_eq!(
            classify_day(&vacation, &working_days, &public_holidays, &vacation_days),
            DayType::Vacation
        );
    }

    #[test]
    fn test_date_range() {
        let start = NaiveDate::from_ymd_opt(2025, 10, 1).unwrap();
        let end = NaiveDate::from_ymd_opt(2025, 10, 5).unwrap();
        let dates = date_range(start, end);

        assert_eq!(dates.len(), 5);
        assert_eq!(dates[0], start);
        assert_eq!(dates[4], end);
    }

    #[test]
    fn test_parse_and_format_date() {
        let date_str = "2025-10-08";
        let date = parse_date(date_str).unwrap();
        assert_eq!(date.year(), 2025);
        assert_eq!(date.month(), 10);
        assert_eq!(date.day(), 8);

        let formatted = format_date(&date);
        assert_eq!(formatted, date_str);
    }
}
