// TypeScript models matching Rust config structures

export interface AppConfig {
  clockify: ClockifyConfig;
  work_settings: WorkSettings;
  location: LocationSettings;
  ui_settings?: UiSettings;
}

export interface ClockifyConfig {
  api_key: string;
  workspace_id: string;
  base_url: string;
}

export interface WorkSettings {
  daily_hours: number;
  weekly_hours: number;
  working_days: string[];
  include_breaks: boolean;
  break_duration_minutes: number;
  entry_date?: string | null; // Format: YYYY-MM-DD
}

export interface LocationSettings {
  bundesland_code: string;
  bundesland_name: string;
}

export interface UiSettings {
  theme: 'light' | 'dark';
}

export const DEFAULT_CONFIG: AppConfig = {
  clockify: {
    api_key: '',
    workspace_id: '',
    base_url: 'https://api.clockify.me/api/v1'
  },
  work_settings: {
    daily_hours: 8,
    weekly_hours: 40,
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    include_breaks: true,
    break_duration_minutes: 30,
    entry_date: null
  },
  location: {
    bundesland_code: '',
    bundesland_name: ''
  },
  ui_settings: {
    theme: 'light'
  }
};
