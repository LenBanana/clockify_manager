/**
 * Holiday and vacation day models matching Rust backend structures
 */

export interface GermanStateInfo {
  code: string;
  name: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD format
  name: string;
  localName: string;
  subdivisions?: string[];
}

export interface SchoolHoliday {
  start: string; // YYYY-MM-DD format
  end: string;   // YYYY-MM-DD format
  year: number;
  stateCode: string;
  name: string;
  slug: string;
}

/**
 * Types of vacation/absence days
 */
export type VacationDayType = 'Vacation' | 'SickDay' | 'PersonalDay' | 'Training' | 'BusinessTrip' | 'Saldo';

export interface VacationDay {
  date: string; // YYYY-MM-DD format
  dayType: VacationDayType;
  description?: string;
  /** Manual hours worked (only used for BusinessTrip type) */
  workedHours?: number;
  /** Whether the day is billable (only used for BusinessTrip type) */
  billable?: boolean;
  /** Optional range ID to group multiple vacation days together */
  rangeId?: string;
}

/**
 * Represents a grouped vacation range for easier management
 */
export interface VacationRange {
  rangeId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  dayType: VacationDayType;
  description?: string;
  workedHours?: number;
  billable?: boolean;
  days: VacationDay[];
  dayCount: number;
}

export interface HolidayCache {
  state: string;
  year: number;
  publicHolidays: PublicHoliday[];
  schoolHolidays: SchoolHoliday[];
  cachedAt: string; // ISO 8601 timestamp
}

/**
 * Helper functions for working with holidays
 */

/**
 * Check if a date is a public holiday
 */
export function isPublicHoliday(date: Date, holidays: PublicHoliday[]): boolean {
  const dateStr = formatDateToYYYYMMDD(date);
  return holidays.some(h => h.date === dateStr);
}

/**
 * Check if a date falls within a school holiday period
 */
export function isSchoolHoliday(date: Date, holidays: SchoolHoliday[]): boolean {
  const dateStr = formatDateToYYYYMMDD(date);
  return holidays.some(h => dateStr >= h.start && dateStr <= h.end);
}

/**
 * Check if a date is a vacation day
 */
export function isVacationDay(date: Date, vacationDays: VacationDay[]): boolean {
  const dateStr = formatDateToYYYYMMDD(date);
  return vacationDays.some(v => v.date === dateStr);
}

/**
 * Get vacation day info for a specific date
 */
export function getVacationDay(date: Date, vacationDays: VacationDay[]): VacationDay | undefined {
  const dateStr = formatDateToYYYYMMDD(date);
  return vacationDays.find(v => v.date === dateStr);
}

/**
 * Get all public holidays for a specific date
 */
export function getPublicHoliday(date: Date, holidays: PublicHoliday[]): PublicHoliday | undefined {
  const dateStr = formatDateToYYYYMMDD(date);
  return holidays.find(h => h.date === dateStr);
}

/**
 * Get school holiday period for a specific date
 */
export function getSchoolHoliday(date: Date, holidays: SchoolHoliday[]): SchoolHoliday | undefined {
  const dateStr = formatDateToYYYYMMDD(date);
  return holidays.find(h => dateStr >= h.start && dateStr <= h.end);
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateFromYYYYMMDD(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Count vacation days of a specific type in a date range
 */
export function countVacationDays(
  vacationDays: VacationDay[],
  dayType?: VacationDayType,
  startDate?: Date,
  endDate?: Date
): number {
  let filtered = vacationDays;

  if (dayType) {
    filtered = filtered.filter(v => v.dayType === dayType);
  }

  if (startDate) {
    const startStr = formatDateToYYYYMMDD(startDate);
    filtered = filtered.filter(v => v.date >= startStr);
  }

  if (endDate) {
    const endStr = formatDateToYYYYMMDD(endDate);
    filtered = filtered.filter(v => v.date <= endStr);
  }

  return filtered.length;
}

/**
 * Get vacation day type display name
 */
export function getVacationDayTypeName(dayType: VacationDayType): string {
  switch (dayType) {
    case 'Vacation':
      return 'Vacation';
    case 'SickDay':
      return 'Sick Day';
    case 'PersonalDay':
      return 'Personal Day';
    case 'Training':
      return 'Training';
    case 'BusinessTrip':
      return 'Business Trip';
    case 'Saldo':
      return 'Saldo';
  }
}

/**
 * Get vacation day type color (for UI)
 */
export function getVacationDayTypeColor(dayType: VacationDayType): string {
  switch (dayType) {
    case 'Vacation':
      return '#4CAF50'; // Green
    case 'SickDay':
      return '#F44336'; // Red
    case 'PersonalDay':
      return '#FF9800'; // Orange
    case 'Training':
      return '#2196F3'; // Blue
    case 'BusinessTrip':
      return '#9C27B0'; // Purple
    case 'Saldo':
      return '#FF6F00'; // Deep Orange - distinctive for overtime credit usage
  }
}

/**
 * Get vacation day type description (for UI hints)
 */
export function getVacationDayTypeDescription(dayType: VacationDayType): string {
  switch (dayType) {
    case 'Vacation':
      return 'Regular paid time off - no hours tracked, no impact on overtime balance';
    case 'SickDay':
      return 'Sick leave - no hours tracked, no impact on overtime balance';
    case 'PersonalDay':
      return 'Personal day off for appointments or family matters - no hours tracked';
    case 'Training':
      return 'Training or education day - counts as work day (8h expected)';
    case 'BusinessTrip':
      return 'Business travel day - specify actual hours worked (meetings, travel time, etc.)';
    case 'Saldo':
      return 'Using overtime credit as vacation - creates deficit but that\'s intentional';
  }
}
