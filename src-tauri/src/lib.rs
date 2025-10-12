// Module declarations
mod commands;
mod error;
mod models;
mod services;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::test::greet,
      commands::test::get_system_info,
      commands::config::get_config,
      commands::config::save_config,
      commands::config::get_config_path,
      commands::clockify::validate_clockify_api_key,
      commands::clockify::fetch_clockify_workspaces,
      commands::clockify::fetch_clockify_projects,
      commands::clockify::fetch_clockify_user,
      commands::clockify::fetch_clockify_time_entries,
      commands::holidays::get_german_states,
      commands::holidays::fetch_public_holidays,
      commands::holidays::fetch_school_holidays,
      commands::holidays::fetch_and_cache_holidays,
      commands::holidays::add_vacation_day,
      commands::holidays::add_vacation_days_batch,
      commands::holidays::get_vacation_days,
      commands::holidays::get_vacation_days_in_range,
      commands::holidays::delete_vacation_day,
      commands::holidays::delete_vacation_days_in_range,
      commands::holidays::clear_holiday_cache,
      commands::holidays::get_vacation_ranges,
      commands::holidays::delete_vacation_range,
      commands::holidays::update_vacation_range,
      commands::overtime::calculate_overtime,
      commands::overtime::get_project_breakdown,
      commands::overtime::get_daily_breakdown,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
