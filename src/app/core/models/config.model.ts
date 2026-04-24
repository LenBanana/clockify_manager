// TypeScript models matching Rust config structures

/** One day's contribution to a payoff (FIFO allocation). */
export interface OvertimePayoffAllocation {
  /** Date of the contributing day (YYYY-MM-DD) */
  date: string;
  /** English day name, e.g. "Monday" */
  dayOfWeek: string;
  /** Total overtime hours that day accumulated */
  availableOvertime: number;
  /** Hours from this day assigned to the payoff */
  allocatedHours: number;
}

export interface OvertimePayoff {
  id: string;
  date: string;        // YYYY-MM-DD — when the company paid it off
  hours: number;       // positive number of hours deducted
  description: string; // optional label, e.g. "Q1 Settlement"
  /** FIFO day-by-day breakdown of where these hours came from */
  allocations?: OvertimePayoffAllocation[];
}

export interface WorkHoursPeriod {
  id: string;
  start_date: string;       // YYYY-MM-DD, inclusive
  end_date: string | null;  // YYYY-MM-DD, inclusive; null = open-ended
  daily_hours: number;
}

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
  daily_hours: number;            // kept as fallback for migration
  working_days: string[];
  include_breaks: boolean;
  break_duration_minutes: number;
  entry_date?: string | null;     // Format: YYYY-MM-DD
  work_hours_schedule: WorkHoursPeriod[];
  overtime_payoffs: OvertimePayoff[];
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
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    include_breaks: true,
    break_duration_minutes: 30,
    entry_date: null,
    work_hours_schedule: [],
    overtime_payoffs: []
  },
  location: {
    bundesland_code: '',
    bundesland_name: ''
  },
  ui_settings: {
    theme: 'light'
  }
};
