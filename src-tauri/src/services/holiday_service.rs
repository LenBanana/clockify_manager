use crate::error::{AppError, AppResult};
use crate::models::holiday::{
    FerienApiResponse, GermanState, HolidayCache, OpenHolidaysResponse, PublicHoliday,
    SchoolHoliday, VacationDay, VacationRange,
};
use chrono::{NaiveDate, Utc};
use reqwest::Client;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

/// Service for managing German holidays and vacation days
pub struct HolidayService {
    client: Client,
    cache_dir: PathBuf,
    vacation_file: PathBuf,
}

impl HolidayService {
    /// Create a new HolidayService
    pub fn new(app_data_dir: PathBuf) -> AppResult<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| AppError::IoError(format!("Failed to create HTTP client: {}", e)))?;

        let cache_dir = app_data_dir.join("cache").join("holidays");
        let vacation_file = app_data_dir.join("vacation_days.json");

        // Create cache directory if it doesn't exist
        fs::create_dir_all(&cache_dir)
            .map_err(|e| AppError::IoError(format!("Failed to create cache directory: {}", e)))?;

        Ok(Self {
            client,
            cache_dir,
            vacation_file,
        })
    }

    /// Fetch public holidays from OpenHolidaysAPI
    pub async fn fetch_public_holidays(
        &self,
        state: GermanState,
        year: i32,
    ) -> AppResult<Vec<PublicHoliday>> {
        // Check cache first
        if let Some(cached) = self.get_cached_holidays(state, year)? {
            return Ok(cached.public_holidays);
        }

        // Fetch from API
        let state_code = format!("DE-{}", state.code());
        let url = format!(
            "https://openholidaysapi.org/PublicHolidays?countryIsoCode=DE&subdivisionCode={}&validFrom={}-01-01&validTo={}-12-31",
            state_code, year, year
        );

        let response = self.client.get(&url).send().await.map_err(|e| {
            if e.is_timeout() {
                AppError::HolidayApi("Request timeout. Please try again.".to_string())
            } else if e.is_connect() {
                AppError::HolidayApi(
                    "Connection failed. Please check your internet connection.".to_string(),
                )
            } else {
                AppError::HolidayApi(format!("Failed to fetch public holidays: {}", e))
            }
        })?;

        if !response.status().is_success() {
            return Err(AppError::HolidayApi(format!(
                "OpenHolidaysAPI returned status: {}",
                response.status()
            )));
        }

        let api_holidays: Vec<OpenHolidaysResponse> = response.json().await.map_err(|e| {
            AppError::HolidayApi(format!("Failed to parse OpenHolidaysAPI response: {}", e))
        })?;

        // Convert to our PublicHoliday model
        let holidays: Vec<PublicHoliday> = api_holidays
            .into_iter()
            .filter_map(|h| {
                let date = NaiveDate::parse_from_str(&h.start_date, "%Y-%m-%d").ok()?;

                // Get German name (prefer 'de' language, fallback to first available)
                let local_name = h
                    .name
                    .iter()
                    .find(|n| n.language == "de")
                    .or_else(|| h.name.first())
                    .map(|n| n.text.clone())?;

                let name = h
                    .name
                    .iter()
                    .find(|n| n.language == "en")
                    .map(|n| n.text.clone())
                    .unwrap_or_else(|| local_name.clone());

                let subdivisions = h
                    .subdivisions
                    .map(|subs| subs.into_iter().map(|s| s.code).collect());

                Some(PublicHoliday {
                    date,
                    name,
                    local_name,
                    subdivisions,
                })
            })
            .collect();

        Ok(holidays)
    }

    /// Fetch school holidays from Ferien-API
    pub async fn fetch_school_holidays(
        &self,
        state: GermanState,
        year: i32,
    ) -> AppResult<Vec<SchoolHoliday>> {
        // Check cache first
        if let Some(cached) = self.get_cached_holidays(state, year)? {
            return Ok(cached.school_holidays);
        }

        // Fetch from API
        let url = format!(
            "https://ferien-api.de/api/v1/holidays/{}/{}",
            state.code(),
            year
        );

        let response = self.client.get(&url).send().await.map_err(|e| {
            if e.is_timeout() {
                AppError::HolidayApi("Request timeout. Please try again.".to_string())
            } else if e.is_connect() {
                AppError::HolidayApi(
                    "Connection failed. Please check your internet connection.".to_string(),
                )
            } else {
                AppError::HolidayApi(format!("Failed to fetch school holidays: {}", e))
            }
        })?;

        if !response.status().is_success() {
            return Err(AppError::HolidayApi(format!(
                "Ferien-API returned status: {}",
                response.status()
            )));
        }

        let api_holidays: Vec<FerienApiResponse> = response.json().await.map_err(|e| {
            AppError::HolidayApi(format!("Failed to parse Ferien-API response: {}", e))
        })?;

        // Convert to our SchoolHoliday model
        let holidays: Vec<SchoolHoliday> = api_holidays
            .into_iter()
            .filter_map(|h| {
                // Parse ISO 8601 datetime and extract date
                let start_date = h.start.split('T').next()?.to_string();
                let end_date = h.end.split('T').next()?.to_string();

                let start = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d").ok()?;
                let end = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d").ok()?;

                Some(SchoolHoliday {
                    start,
                    end,
                    year: h.year,
                    state_code: h.state_code,
                    name: h.name,
                    slug: h.slug,
                })
            })
            .collect();

        Ok(holidays)
    }

    /// Fetch and cache both public and school holidays
    pub async fn fetch_and_cache_holidays(
        &self,
        state: GermanState,
        year: i32,
    ) -> AppResult<HolidayCache> {
        // Fetch both holiday types concurrently
        let public_holidays = self.fetch_public_holidays(state, year).await?;
        let school_holidays = self.fetch_school_holidays(state, year).await?;

        let cache = HolidayCache {
            state,
            year,
            public_holidays,
            school_holidays,
            cached_at: Utc::now(),
        };

        // Save to cache
        self.save_cache(&cache)?;

        Ok(cache)
    }

    /// Get cached holidays if available and not expired (1 year cache)
    fn get_cached_holidays(
        &self,
        state: GermanState,
        year: i32,
    ) -> AppResult<Option<HolidayCache>> {
        let cache_file = self
            .cache_dir
            .join(format!("{}_{}.json", state.code(), year));

        if !cache_file.exists() {
            return Ok(None);
        }

        let contents = fs::read_to_string(&cache_file)
            .map_err(|e| AppError::IoError(format!("Failed to read cache file: {}", e)))?;

        let cache: HolidayCache = serde_json::from_str(&contents)
            .map_err(|e| AppError::ParseError(format!("Failed to parse cache file: {}", e)))?;

        // Check if cache is expired (older than 30 days)
        let cache_age = Utc::now().signed_duration_since(cache.cached_at);
        if cache_age.num_days() > 30 {
            // Cache expired, remove it
            let _ = fs::remove_file(&cache_file);
            return Ok(None);
        }

        Ok(Some(cache))
    }

    /// Save holidays to cache
    fn save_cache(&self, cache: &HolidayCache) -> AppResult<()> {
        let cache_file = self
            .cache_dir
            .join(format!("{}_{}.json", cache.state.code(), cache.year));

        let json = serde_json::to_string_pretty(cache)
            .map_err(|e| AppError::ParseError(format!("Failed to serialize cache: {}", e)))?;

        fs::write(&cache_file, json)
            .map_err(|e| AppError::IoError(format!("Failed to write cache file: {}", e)))?;

        Ok(())
    }

    /// Add a vacation day
    pub fn add_vacation_day(&self, vacation_day: VacationDay) -> AppResult<()> {
        let mut vacation_days = self.get_vacation_days()?;

        // Remove any existing entry for the same date
        vacation_days.retain(|v| v.date != vacation_day.date);

        // Add the new entry
        vacation_days.push(vacation_day);

        // Sort by date
        vacation_days.sort_by_key(|v| v.date);

        self.save_vacation_days(&vacation_days)
    }

    /// Add multiple vacation days at once (batch operation)
    pub fn add_vacation_days_batch(&self, new_days: Vec<VacationDay>) -> AppResult<()> {
        let mut vacation_days = self.get_vacation_days()?;

        for vacation_day in new_days {
            // Remove any existing entry for the same date
            vacation_days.retain(|v| v.date != vacation_day.date);

            // Add the new entry
            vacation_days.push(vacation_day);
        }

        // Sort by date
        vacation_days.sort_by_key(|v| v.date);

        self.save_vacation_days(&vacation_days)
    }

    /// Get all vacation days
    pub fn get_vacation_days(&self) -> AppResult<Vec<VacationDay>> {
        if !self.vacation_file.exists() {
            return Ok(Vec::new());
        }

        let contents = fs::read_to_string(&self.vacation_file)
            .map_err(|e| AppError::IoError(format!("Failed to read vacation days file: {}", e)))?;

        let vacation_days: Vec<VacationDay> = serde_json::from_str(&contents)
            .map_err(|e| AppError::ParseError(format!("Failed to parse vacation days: {}", e)))?;

        Ok(vacation_days)
    }

    /// Get vacation days for a specific date range
    pub fn get_vacation_days_in_range(
        &self,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> AppResult<Vec<VacationDay>> {
        let all_vacation_days = self.get_vacation_days()?;

        let filtered: Vec<VacationDay> = all_vacation_days
            .into_iter()
            .filter(|v| v.date >= start_date && v.date <= end_date)
            .collect();

        Ok(filtered)
    }

    /// Delete a vacation day
    pub fn delete_vacation_day(&self, date: NaiveDate) -> AppResult<()> {
        let mut vacation_days = self.get_vacation_days()?;
        vacation_days.retain(|v| v.date != date);
        self.save_vacation_days(&vacation_days)
    }

    /// Delete multiple vacation days in a date range
    pub fn delete_vacation_days_in_range(
        &self,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> AppResult<()> {
        let mut vacation_days = self.get_vacation_days()?;
        vacation_days.retain(|v| v.date < start_date || v.date > end_date);
        self.save_vacation_days(&vacation_days)
    }

    /// Save vacation days to file
    fn save_vacation_days(&self, vacation_days: &[VacationDay]) -> AppResult<()> {
        let json = serde_json::to_string_pretty(vacation_days).map_err(|e| {
            AppError::ParseError(format!("Failed to serialize vacation days: {}", e))
        })?;

        fs::write(&self.vacation_file, json)
            .map_err(|e| AppError::IoError(format!("Failed to write vacation days file: {}", e)))?;

        Ok(())
    }

    /// Clear all cached holidays
    pub fn clear_cache(&self) -> AppResult<()> {
        if self.cache_dir.exists() {
            fs::remove_dir_all(&self.cache_dir)
                .map_err(|e| AppError::IoError(format!("Failed to clear cache: {}", e)))?;

            // Recreate the directory
            fs::create_dir_all(&self.cache_dir).map_err(|e| {
                AppError::IoError(format!("Failed to recreate cache directory: {}", e))
            })?;
        }
        Ok(())
    }

    /// Get all vacation ranges (grouped by range_id)
    pub fn get_vacation_ranges(&self) -> AppResult<Vec<VacationRange>> {
        let all_days = self.get_vacation_days()?;

        // Group days by range_id
        let mut range_map: HashMap<String, Vec<VacationDay>> = HashMap::new();
        let mut single_days: Vec<VacationDay> = Vec::new();

        for day in all_days {
            if let Some(range_id) = &day.range_id {
                range_map
                    .entry(range_id.clone())
                    .or_insert_with(Vec::new)
                    .push(day);
            } else {
                single_days.push(day);
            }
        }

        let mut ranges: Vec<VacationRange> = Vec::new();

        // Convert grouped days to VacationRange
        for (range_id, days) in range_map {
            if !days.is_empty() {
                ranges.push(VacationRange::from_days(range_id, days));
            }
        }

        // Add single days as individual ranges (for backwards compatibility)
        for day in single_days {
            let single_day_range = VacationRange {
                range_id: format!("single_{}", day.date.format("%Y%m%d")),
                start_date: day.date,
                end_date: day.date,
                day_type: day.day_type,
                description: day.description.clone(),
                worked_hours: day.worked_hours,
                billable: day.billable,
                days: vec![day],
                day_count: 1,
            };
            ranges.push(single_day_range);
        }

        // Sort by start date
        ranges.sort_by_key(|r| r.start_date);

        Ok(ranges)
    }

    /// Delete an entire vacation range by range_id
    pub fn delete_vacation_range(&self, range_id: &str) -> AppResult<()> {
        let mut vacation_days = self.get_vacation_days()?;

        // Handle single day ranges (format: "single_YYYYMMDD")
        if range_id.starts_with("single_") {
            let date_str = &range_id[7..]; // Skip "single_" prefix
            if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y%m%d") {
                vacation_days.retain(|v| v.date != date);
            }
        } else {
            // Remove all days with this range_id
            vacation_days.retain(|v| v.range_id.as_ref() != Some(&range_id.to_string()));
        }

        self.save_vacation_days(&vacation_days)
    }

    /// Update an entire vacation range (modifies all days in the range)
    pub fn update_vacation_range(
        &self,
        range_id: &str,
        day_type: Option<crate::models::holiday::VacationDayType>,
        description: Option<String>,
        worked_hours: Option<f64>,
        billable: Option<bool>,
    ) -> AppResult<()> {
        let mut vacation_days = self.get_vacation_days()?;

        // Handle single day ranges
        if range_id.starts_with("single_") {
            let date_str = &range_id[7..];
            if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y%m%d") {
                for day in vacation_days.iter_mut() {
                    if day.date == date {
                        if let Some(dt) = day_type {
                            day.day_type = dt;
                        }
                        if description.is_some() {
                            day.description = description.clone();
                        }
                        if worked_hours.is_some() {
                            day.worked_hours = worked_hours;
                        }
                        if billable.is_some() {
                            day.billable = billable;
                        }
                        break;
                    }
                }
            }
        } else {
            // Update all days with this range_id
            for day in vacation_days.iter_mut() {
                if day.range_id.as_ref() == Some(&range_id.to_string()) {
                    if let Some(dt) = day_type {
                        day.day_type = dt;
                    }
                    if description.is_some() {
                        day.description = description.clone();
                    }
                    if worked_hours.is_some() {
                        day.worked_hours = worked_hours;
                    }
                    if billable.is_some() {
                        day.billable = billable;
                    }
                }
            }
        }

        self.save_vacation_days(&vacation_days)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::holiday::VacationDayType;
    use std::env;

    #[test]
    fn test_holiday_service_creation() {
        let temp_dir = env::temp_dir().join("test_holiday_service");
        let service = HolidayService::new(temp_dir.clone());
        assert!(service.is_ok());

        // Cleanup
        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_vacation_day_crud() {
        let temp_dir = env::temp_dir().join("test_vacation_days");
        let service = HolidayService::new(temp_dir.clone()).unwrap();

        // Add vacation day
        let vacation = VacationDay {
            date: NaiveDate::from_ymd_opt(2025, 12, 24).unwrap(),
            day_type: VacationDayType::Vacation,
            description: Some("Christmas Eve".to_string()),
        };
        assert!(service.add_vacation_day(vacation.clone()).is_ok());

        // Get vacation days
        let days = service.get_vacation_days().unwrap();
        assert_eq!(days.len(), 1);
        assert_eq!(days[0].date, vacation.date);

        // Delete vacation day
        assert!(service.delete_vacation_day(vacation.date).is_ok());
        let days = service.get_vacation_days().unwrap();
        assert_eq!(days.len(), 0);

        // Cleanup
        let _ = fs::remove_dir_all(temp_dir);
    }
}
