/// Simple test command to verify Rust <-> Angular communication
#[tauri::command]
pub async fn greet(name: String) -> Result<String, String> {
    Ok(format!(
        "Hello, {}! Welcome to Clockify Overtime Tracker.",
        name
    ))
}

/// Get system information for debugging
#[tauri::command]
pub async fn get_system_info() -> Result<String, String> {
    let info = format!(
        "OS: {}\nArch: {}\nVersion: {}",
        std::env::consts::OS,
        std::env::consts::ARCH,
        env!("CARGO_PKG_VERSION")
    );
    Ok(info)
}
