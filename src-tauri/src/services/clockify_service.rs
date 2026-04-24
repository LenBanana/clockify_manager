use crate::error::{AppError, AppResult};
use crate::models::clockify::{Project, TimeEntry, User, Workspace};
use chrono::{DateTime, Utc};
use reqwest::{Client, StatusCode};
use std::time::Duration;

/// Service for interacting with Clockify API
pub struct ClockifyService {
    client: Client,
    base_url: String,
    api_key: String,
}

impl ClockifyService {
    /// Create a new ClockifyService
    pub fn new(api_key: String, base_url: Option<String>) -> AppResult<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| AppError::ClockifyApi(format!("Failed to create HTTP client: {}", e)))?;

        let base_url = base_url.unwrap_or_else(|| "https://api.clockify.me/api/v1".to_string());

        Ok(Self {
            client,
            base_url,
            api_key,
        })
    }

    /// Validate API key by fetching user info
    pub async fn validate_api_key(&self) -> AppResult<bool> {
        let url = format!("{}/user", self.base_url);

        let response = self
            .client
            .get(&url)
            .header("X-Api-Key", &self.api_key)
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(e) => {
                if e.is_timeout() {
                    Err(AppError::ClockifyApi("Request timeout".to_string()))
                } else if e.is_connect() {
                    Err(AppError::ClockifyApi("Connection failed".to_string()))
                } else {
                    Err(AppError::Request(e))
                }
            }
        }
    }

    /// Fetch all workspaces for the user
    pub async fn fetch_workspaces(&self) -> AppResult<Vec<Workspace>> {
        let url = format!("{}/workspaces", self.base_url);

        let response = self
            .client
            .get(&url)
            .header("X-Api-Key", &self.api_key)
            .send()
            .await
            .map_err(|e| self.handle_request_error(e))?;

        self.handle_response(response).await
    }

    /// Fetch all projects in a workspace
    pub async fn fetch_projects(&self, workspace_id: &str) -> AppResult<Vec<Project>> {
        let url = format!("{}/workspaces/{}/projects", self.base_url, workspace_id);

        let response = self
            .client
            .get(&url)
            .header("X-Api-Key", &self.api_key)
            .query(&[("archived", "false"), ("page-size", "200")])
            .send()
            .await
            .map_err(|e| self.handle_request_error(e))?;

        self.handle_response(response).await
    }

    /// Fetch current user info
    pub async fn fetch_user(&self) -> AppResult<User> {
        let url = format!("{}/user", self.base_url);

        let response = self
            .client
            .get(&url)
            .header("X-Api-Key", &self.api_key)
            .send()
            .await
            .map_err(|e| self.handle_request_error(e))?;

        self.handle_response(response).await
    }

    /// Fetch time entries using user time-entries endpoint with pagination
    /// Note: This fetches entries for the authenticated user only
    pub async fn fetch_time_entries(
        &self,
        workspace_id: &str,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
    ) -> AppResult<Vec<TimeEntry>> {
        // First, get the current user to get their user ID
        let user = self.fetch_user().await?;

        let mut all_entries = Vec::new();
        let mut page = 1;
        let page_size = 50; // Reasonable page size for user time entries

        loop {
            let url = format!(
                "{}/workspaces/{}/user/{}/time-entries",
                self.base_url, workspace_id, user.id
            );

            let response = self
                .client
                .get(&url)
                .header("X-Api-Key", &self.api_key)
                .query(&[
                    ("start", start_date.to_rfc3339()),
                    ("end", end_date.to_rfc3339()),
                    ("page", page.to_string()),
                    ("page-size", page_size.to_string()),
                ])
                .send()
                .await
                .map_err(|e| self.handle_request_error(e))?;

            let entries: Vec<TimeEntry> = self.handle_response(response).await?;

            let entries_count = entries.len();
            all_entries.extend(entries);

            // If we got fewer than page_size entries, we're done
            if entries_count < page_size {
                break;
            }

            page += 1;

            // Safety check to prevent infinite loops
            if page > 1000 {
                return Err(AppError::ClockifyApi(
                    "Exceeded maximum pagination limit".to_string(),
                ));
            }

            // Small delay to respect rate limits (50 req/sec)
            tokio::time::sleep(Duration::from_millis(25)).await;
        }

        Ok(all_entries)
    }

    /// Handle HTTP errors with proper error messages
    fn handle_request_error(&self, error: reqwest::Error) -> AppError {
        if error.is_timeout() {
            AppError::ClockifyApi("Request timeout - Clockify API may be slow".to_string())
        } else if error.is_connect() {
            AppError::ClockifyApi(
                "Cannot connect to Clockify API - check internet connection".to_string(),
            )
        } else if let Some(status) = error.status() {
            match status {
                StatusCode::UNAUTHORIZED => {
                    AppError::ClockifyApi("Invalid API key or unauthorized access".to_string())
                }
                StatusCode::FORBIDDEN => AppError::ClockifyApi(
                    "Access forbidden - check workspace permissions".to_string(),
                ),
                StatusCode::NOT_FOUND => AppError::ClockifyApi("Resource not found".to_string()),
                StatusCode::TOO_MANY_REQUESTS => AppError::ClockifyApi(
                    "Rate limit exceeded - please try again later".to_string(),
                ),
                _ => AppError::ClockifyApi(format!("HTTP error: {}", status)),
            }
        } else {
            AppError::Request(error)
        }
    }

    /// Handle HTTP response and deserialize JSON
    async fn handle_response<T: serde::de::DeserializeOwned>(
        &self,
        response: reqwest::Response,
    ) -> AppResult<T> {
        let status = response.status();

        if !status.is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            return Err(match status {
                StatusCode::UNAUTHORIZED => {
                    AppError::ClockifyApi("Invalid API key or unauthorized access".to_string())
                }
                StatusCode::FORBIDDEN => AppError::ClockifyApi(
                    "Access forbidden - check workspace permissions".to_string(),
                ),
                StatusCode::NOT_FOUND => AppError::ClockifyApi("Resource not found".to_string()),
                StatusCode::TOO_MANY_REQUESTS => AppError::ClockifyApi(
                    "Rate limit exceeded - please try again later".to_string(),
                ),
                _ => AppError::ClockifyApi(format!("HTTP {} - {}", status, error_text)),
            });
        }

        response.json::<T>().await.map_err(|e| {
            AppError::ClockifyApi(format!("Failed to parse Clockify API response: {}", e))
        })
    }
}
