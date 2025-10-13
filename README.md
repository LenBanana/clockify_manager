# Clockify Overtime Tracker

A desktop app for tracking overtime hours using data from Clockify. Built specifically for German labor laws with support for all 16 Bundesländer (federal states), public holidays, school holidays, and vacation management.

## What It Does

- Syncs time entries from your Clockify workspace
- Calculates overtime based on German work regulations
- Tracks vacation days, sick days, and public holidays
- Shows daily and project-based breakdowns
- Displays everything in an easy-to-use dashboard

## Tech Stack

- **Frontend**: Angular 19 + Angular Material
- **Backend**: Rust + Tauri 2
- **Desktop**: Cross-platform (Windows/Mac/Linux)

All data is stored locally on your machine. No external server required.

## Getting Started

### Prerequisites

- Node.js 18+
- Rust toolchain (rustc + cargo)
- Angular CLI 19+
- **Windows users**: Visual Studio Build Tools 2022 with C++ support

### Installation

1. Clone the repo
2. Install dependencies:
   ```powershell
   npm install
   ```

3. Run in development mode:
   ```powershell
   npm run tauri:dev
   ```

### First-Time Setup

When you first launch the app, you'll go through a setup wizard:

1. **Clockify API Key** - Get yours from https://app.clockify.me/user/settings
2. **Workspace Selection** - Choose which workspace to track
3. **Bundesland** - Select your German state (affects holiday calculations)
4. **Work Settings** - Configure your standard work hours (default: 8h/day, 40h/week)

## Features

### Dashboard
- Current overtime balance
- Total hours worked in selected period
- Expected work hours vs actual
- Days off summary (vacation + holidays)
- Daily breakdown table
- Project time distribution

### Vacation Management
- Add/edit/delete vacation days
- Calendar view with color-coded days
- Statistics and timeline view
- Bulk operations for date ranges
- Types: Vacation, Sick Day, Personal Day, Training

### Configuration
- Manage Clockify connection
- Adjust work settings
- Change Bundesland (updates holidays automatically)
- All settings stored locally in `%APPDATA%/clockify-overtime-tracker/`

## How Overtime is Calculated

```
For each day:
  - If it's a work day (Mon-Fri, not a holiday, not vacation):
    Expected hours = your daily hours setting (usually 8h)
  - Otherwise:
    Expected hours = 0h
  
  Actual hours = sum of your Clockify time entries for that day
  
  Daily overtime = Actual - Expected
```

**Note**: Running timers (entries without an end time) are excluded from calculations.

## Project Structure

```
clockify_manager/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── core/                # Services, models, guards
│   │   ├── features/
│   │   │   ├── configuration/   # Setup wizard + settings
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   └── vacation-management/  # Vacation tracking
│   │   └── shared/              # Reusable components
│   └── theme.scss               # Material Design theme
│
└── src-tauri/                   # Rust backend
    ├── src/
    │   ├── commands/            # Tauri commands (API)
    │   ├── services/            # Business logic
    │   ├── models/              # Data structures
    │   └── utils/               # Helper functions
    └── Cargo.toml
```

## Data Storage

All data is stored locally in:
- **Windows**: `%APPDATA%\clockify-overtime-tracker\`
- **Mac**: `~/Library/Application Support/clockify-overtime-tracker/`
- **Linux**: `~/.config/clockify-overtime-tracker/`

Files:
- `config.json` - App configuration (API key, workspace, settings)
- `vacation_days.json` - Your vacation/sick days
- `cache/holidays/` - Cached public holiday data

## Building for Production

```powershell
npm run tauri:build
```

The installer will be in `src-tauri/target/release/bundle/`

For Windows NSIS installer specifically:
```powershell
npm run tauri:build:nsis
```

## Holiday Data Sources

- **Public Holidays**: OpenHolidays API (https://openholidaysapi.org)
- **School Holidays**: Ferien-API (https://ferien-api.de)

Holiday data is fetched once per year/state and cached locally.

## Troubleshooting

### "API key invalid" error
- Double-check your API key from Clockify settings
- Make sure there are no extra spaces when pasting
- Try generating a new key

### Time entries not showing up
- Check that you selected the correct workspace
- Verify the date range includes your entries
- Make sure entries have an end time (running timers are excluded)

### Build errors on Windows
- Install Visual Studio Build Tools 2022
- Ensure "Desktop development with C++" workload is installed
- Run from "x64 Native Tools Command Prompt"

### App data reset
If you need to start fresh:
```powershell
Remove-Item -Recurse "$env:APPDATA\clockify-overtime-tracker"
```

## Development Commands

- `npm run start` - Angular dev server only
- `npm run tauri:dev` - Full app with hot reload
- `npm run build` - Build Angular
- `npm run tauri:build` - Build production app
- `cd src-tauri && cargo test` - Run Rust tests

## Contributing

This is an internal tool, but if you want to add features:
1. Create a new branch
2. Make your changes
3. Test thoroughly with real data
4. Submit a pull request

## License

MIT

## Questions?

Ask in the team channel or open an issue.
