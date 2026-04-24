use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

/// German states (Bundesländer) with their official codes
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum GermanState {
    #[serde(rename = "BW")]
    BadenWuerttemberg,
    #[serde(rename = "BY")]
    Bayern,
    #[serde(rename = "BE")]
    Berlin,
    #[serde(rename = "BB")]
    Brandenburg,
    #[serde(rename = "HB")]
    Bremen,
    #[serde(rename = "HH")]
    Hamburg,
    #[serde(rename = "HE")]
    Hessen,
    #[serde(rename = "MV")]
    MecklenburgVorpommern,
    #[serde(rename = "NI")]
    Niedersachsen,
    #[serde(rename = "NW")]
    NordrheinWestfalen,
    #[serde(rename = "RP")]
    RheinlandPfalz,
    #[serde(rename = "SL")]
    Saarland,
    #[serde(rename = "SN")]
    Sachsen,
    #[serde(rename = "ST")]
    SachsenAnhalt,
    #[serde(rename = "SH")]
    SchleswigHolstein,
    #[serde(rename = "TH")]
    Thueringen,
}

impl GermanState {
    /// Get the two-letter code for the state
    pub fn code(&self) -> &'static str {
        match self {
            GermanState::BadenWuerttemberg => "BW",
            GermanState::Bayern => "BY",
            GermanState::Berlin => "BE",
            GermanState::Brandenburg => "BB",
            GermanState::Bremen => "HB",
            GermanState::Hamburg => "HH",
            GermanState::Hessen => "HE",
            GermanState::MecklenburgVorpommern => "MV",
            GermanState::Niedersachsen => "NI",
            GermanState::NordrheinWestfalen => "NW",
            GermanState::RheinlandPfalz => "RP",
            GermanState::Saarland => "SL",
            GermanState::Sachsen => "SN",
            GermanState::SachsenAnhalt => "ST",
            GermanState::SchleswigHolstein => "SH",
            GermanState::Thueringen => "TH",
        }
    }

    /// Get the full name of the state in German
    pub fn name(&self) -> &'static str {
        match self {
            GermanState::BadenWuerttemberg => "Baden-Württemberg",
            GermanState::Bayern => "Bayern",
            GermanState::Berlin => "Berlin",
            GermanState::Brandenburg => "Brandenburg",
            GermanState::Bremen => "Bremen",
            GermanState::Hamburg => "Hamburg",
            GermanState::Hessen => "Hessen",
            GermanState::MecklenburgVorpommern => "Mecklenburg-Vorpommern",
            GermanState::Niedersachsen => "Niedersachsen",
            GermanState::NordrheinWestfalen => "Nordrhein-Westfalen",
            GermanState::RheinlandPfalz => "Rheinland-Pfalz",
            GermanState::Saarland => "Saarland",
            GermanState::Sachsen => "Sachsen",
            GermanState::SachsenAnhalt => "Sachsen-Anhalt",
            GermanState::SchleswigHolstein => "Schleswig-Holstein",
            GermanState::Thueringen => "Thüringen",
        }
    }

    /// Parse a state from its two-letter code
    pub fn from_code(code: &str) -> Option<Self> {
        match code.to_uppercase().as_str() {
            "BW" => Some(GermanState::BadenWuerttemberg),
            "BY" => Some(GermanState::Bayern),
            "BE" => Some(GermanState::Berlin),
            "BB" => Some(GermanState::Brandenburg),
            "HB" => Some(GermanState::Bremen),
            "HH" => Some(GermanState::Hamburg),
            "HE" => Some(GermanState::Hessen),
            "MV" => Some(GermanState::MecklenburgVorpommern),
            "NI" => Some(GermanState::Niedersachsen),
            "NW" => Some(GermanState::NordrheinWestfalen),
            "RP" => Some(GermanState::RheinlandPfalz),
            "SL" => Some(GermanState::Saarland),
            "SN" => Some(GermanState::Sachsen),
            "ST" => Some(GermanState::SachsenAnhalt),
            "SH" => Some(GermanState::SchleswigHolstein),
            "TH" => Some(GermanState::Thueringen),
            _ => None,
        }
    }

    /// Get all German states
    pub fn all() -> Vec<Self> {
        vec![
            GermanState::BadenWuerttemberg,
            GermanState::Bayern,
            GermanState::Berlin,
            GermanState::Brandenburg,
            GermanState::Bremen,
            GermanState::Hamburg,
            GermanState::Hessen,
            GermanState::MecklenburgVorpommern,
            GermanState::Niedersachsen,
            GermanState::NordrheinWestfalen,
            GermanState::RheinlandPfalz,
            GermanState::Saarland,
            GermanState::Sachsen,
            GermanState::SachsenAnhalt,
            GermanState::SchleswigHolstein,
            GermanState::Thueringen,
        ]
    }
}

/// Public holiday information from OpenHolidaysAPI
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicHoliday {
    pub date: NaiveDate,
    pub name: String,
    pub local_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subdivisions: Option<Vec<String>>,
}

/// School holiday information from Ferien-API
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchoolHoliday {
    pub start: NaiveDate,
    pub end: NaiveDate,
    pub year: i32,
    pub state_code: String,
    pub name: String,
    pub slug: String,
}

/// Type of vacation/absence day
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum VacationDayType {
    Vacation,     // Regular vacation day
    SickDay,      // Sick leave
    PersonalDay,  // Personal day off
    Training,     // Training/education day
    BusinessTrip, // Business trip (with manual hours tracking)
    Saldo,        // Using overtime credit as vacation (creates deficit)
}

/// User-entered vacation or absence day
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VacationDay {
    pub date: NaiveDate,
    pub day_type: VacationDayType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Manual hours worked (only used for BusinessTrip type)
    /// This allows tracking work hours when no Clockify entries exist
    /// (e.g., travel time, client meetings without project tracking)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worked_hours: Option<f64>,
    /// Whether the day is billable (only used for BusinessTrip type)
    /// Indicates if the trip was paid by customer (true) or company (false)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub billable: Option<bool>,
    /// Optional range ID to group multiple vacation days together
    /// If multiple days share the same range_id, they were added as a single range
    /// This allows editing/deleting the entire range at once
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range_id: Option<String>,
}

/// Represents a grouped vacation range for easier management
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VacationRange {
    pub range_id: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub day_type: VacationDayType,
    pub description: Option<String>,
    pub worked_hours: Option<f64>,
    pub billable: Option<bool>,
    pub days: Vec<VacationDay>,
    pub day_count: usize,
}

impl VacationRange {
    /// Create a vacation range from a group of vacation days
    pub fn from_days(range_id: String, mut days: Vec<VacationDay>) -> Self {
        if days.is_empty() {
            panic!("Cannot create VacationRange from empty days");
        }

        // Sort by date to ensure correct start/end
        days.sort_by_key(|d| d.date);

        let start_date = days.first().unwrap().date;
        let end_date = days.last().unwrap().date;
        let day_type = days.first().unwrap().day_type;
        let description = days.first().unwrap().description.clone();
        let worked_hours = days.first().unwrap().worked_hours;
        let billable = days.first().unwrap().billable;
        let day_count = days.len();

        Self {
            range_id,
            start_date,
            end_date,
            day_type,
            description,
            worked_hours,
            billable,
            days,
            day_count,
        }
    }
}

/// Combined holiday cache structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HolidayCache {
    pub state: GermanState,
    pub year: i32,
    pub public_holidays: Vec<PublicHoliday>,
    pub school_holidays: Vec<SchoolHoliday>,
    pub cached_at: chrono::DateTime<chrono::Utc>,
}

/// Response from OpenHolidaysAPI
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenHolidaysResponse {
    #[allow(dead_code)]
    pub id: String,
    pub start_date: String, // YYYY-MM-DD format
    #[serde(skip_serializing_if = "Option::is_none")]
    #[allow(dead_code)]
    pub end_date: Option<String>,
    pub name: Vec<OpenHolidaysName>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subdivisions: Option<Vec<OpenHolidaysSubdivision>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenHolidaysName {
    pub language: String,
    pub text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenHolidaysSubdivision {
    pub code: String,
}

/// Response from Ferien-API
#[derive(Debug, Deserialize)]
pub struct FerienApiResponse {
    pub start: String, // ISO 8601 date-time
    pub end: String,   // ISO 8601 date-time
    #[serde(rename = "stateCode")]
    pub state_code: String,
    pub name: String,
    pub slug: String,
    pub year: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_german_state_code() {
        assert_eq!(GermanState::Bayern.code(), "BY");
        assert_eq!(GermanState::Berlin.code(), "BE");
        assert_eq!(GermanState::NordrheinWestfalen.code(), "NW");
    }

    #[test]
    fn test_german_state_from_code() {
        assert_eq!(GermanState::from_code("BY"), Some(GermanState::Bayern));
        assert_eq!(GermanState::from_code("by"), Some(GermanState::Bayern));
        assert_eq!(GermanState::from_code("BE"), Some(GermanState::Berlin));
        assert_eq!(GermanState::from_code("XX"), None);
    }

    #[test]
    fn test_german_state_all() {
        let all_states = GermanState::all();
        assert_eq!(all_states.len(), 16);
        assert!(all_states.contains(&GermanState::Bayern));
        assert!(all_states.contains(&GermanState::Berlin));
    }

    #[test]
    fn test_german_state_name() {
        assert_eq!(GermanState::Bayern.name(), "Bayern");
        assert_eq!(GermanState::BadenWuerttemberg.name(), "Baden-Württemberg");
        assert_eq!(
            GermanState::NordrheinWestfalen.name(),
            "Nordrhein-Westfalen"
        );
    }
}
