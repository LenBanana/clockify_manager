use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Clockify workspace information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hourly_rate: Option<HourlyRate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_rate: Option<HourlyRate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memberships: Option<Vec<Membership>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workspace_settings: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feature_subscription_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub features: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currencies: Option<Vec<Currency>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subdomain: Option<Subdomain>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cake_organization_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HourlyRate {
    pub amount: i32,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Membership {
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hourly_rate: Option<HourlyRate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_rate: Option<HourlyRate>,
    pub target_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub membership_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub membership_status: Option<String>,
    // Backwards compatibility - some responses use member_status
    #[serde(skip_serializing_if = "Option::is_none")]
    pub member_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Currency {
    pub id: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subdomain {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub enabled: bool,
}

/// Clockify project information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub billable: bool,
    pub archived: bool,
}

/// Clockify user information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile_picture: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

/// Clockify tag information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub workspace_id: String,
}

/// Clockify time entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntry {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub user_id: String,
    pub workspace_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(rename = "timeInterval")]
    pub time_interval: TimeInterval,
    pub billable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tag_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_field_values: Option<Vec<serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kiosk_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hourly_rate: Option<HourlyRate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_rate: Option<HourlyRate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_locked: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeInterval {
    pub start: DateTime<Utc>,
    /// End can be null for running timers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<DateTime<Utc>>,
    /// ISO 8601 duration format (e.g., "PT8H30M15S")
    /// Can be null for running timers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
}

/// Request structure for detailed report
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetailedReportRequest {
    pub date_range_start: DateTime<Utc>,
    pub date_range_end: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detailed_filter: Option<DetailedFilter>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetailedFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub users: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projects: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

/// Response from detailed report endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetailedReportResponse {
    pub time_entries: Vec<TimeEntry>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_count: Option<i32>,
}

/// Helper function to parse ISO 8601 duration to decimal hours
/// Handles formats like: PT8H30M15S, PT8H, PT45M, PT0S
pub fn parse_duration_to_hours(duration: &str) -> Result<f64, String> {
    if duration.is_empty() {
        return Ok(0.0);
    }

    // Remove PT prefix
    let duration = duration.strip_prefix("PT")
        .ok_or_else(|| format!("Invalid duration format: {}", duration))?;

    let mut hours = 0.0;
    let mut minutes = 0.0;
    let mut seconds = 0.0;

    let mut current_number = String::new();

    for ch in duration.chars() {
        if ch.is_ascii_digit() || ch == '.' {
            current_number.push(ch);
        } else {
            let value: f64 = current_number.parse()
                .map_err(|_| format!("Invalid number in duration: {}", current_number))?;
            
            match ch {
                'H' => hours = value,
                'M' => minutes = value,
                'S' => seconds = value,
                _ => return Err(format!("Unknown duration unit: {}", ch)),
            }
            
            current_number.clear();
        }
    }

    Ok(hours + (minutes / 60.0) + (seconds / 3600.0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_duration_full() {
        let result = parse_duration_to_hours("PT8H30M15S").unwrap();
        assert!((result - 8.504166).abs() < 0.0001);
    }

    #[test]
    fn test_parse_duration_hours_only() {
        let result = parse_duration_to_hours("PT8H").unwrap();
        assert_eq!(result, 8.0);
    }

    #[test]
    fn test_parse_duration_minutes_only() {
        let result = parse_duration_to_hours("PT45M").unwrap();
        assert_eq!(result, 0.75);
    }

    #[test]
    fn test_parse_duration_zero() {
        let result = parse_duration_to_hours("PT0S").unwrap();
        assert_eq!(result, 0.0);
    }

    #[test]
    fn test_parse_duration_invalid() {
        assert!(parse_duration_to_hours("8H30M").is_err());
    }
}
