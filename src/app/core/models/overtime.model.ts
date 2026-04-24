/**
 * TypeScript models for overtime calculations
 * These match the Rust models defined in src-tauri/src/models/overtime.rs
 */

/**
 * Type of day for overtime calculation purposes
 */
export type DayType =
  | 'WorkDay'
  | 'Weekend'
  | 'PublicHoliday'
  | 'Vacation'
  | 'SickDay'
  | 'PersonalDay'
  | 'Training'
  | 'BusinessTrip'
  | 'Saldo';

/**
 * Time worked on a specific project on a given day
 */
export interface ProjectTime {
  projectId: string | null;
  projectName: string;
  clientName: string | null;
  hours: number;
  billable: boolean;
}

/**
 * Breakdown of work for a single day
 */
export interface DayBreakdown {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day of week (Monday, Tuesday, etc.) */
  dayOfWeek: string;
  /** First tracked start time for the day in HH:MM format */
  startTime?: string | null;
  /** Last tracked end time for the day in HH:MM format */
  endTime?: string | null;
  /** Total pause between tracked entries in decimal hours */
  breakHours: number;
  /** Type of day (work, weekend, holiday, etc.) */
  dayType: DayType;
  /** Expected work hours for this day */
  expectedHours: number;
  /** Actual hours worked */
  actualHours: number;
  /** Overtime for this day (actual - expected) */
  overtimeHours: number;
  /** Projects worked on this day */
  projectsWorked: ProjectTime[];
  /** Number of time entries on this day */
  timeEntriesCount: number;
}

/**
 * Aggregated project breakdown for a period
 */
export interface ProjectBreakdown {
  projectId: string | null;
  projectName: string;
  clientName: string | null;
  /** Total hours on this project */
  totalHours: number;
  /** Billable hours only */
  billableHours: number;
  /** Non-billable hours */
  nonBillableHours: number;
  /** Percentage of total time */
  percentageOfTotal: number;
  /** Number of time entries */
  entryCount: number;
}

/**
 * Complete overtime report for a date range
 */
export interface OvertimeReport {
  /** Start date of the period (YYYY-MM-DD) */
  periodStart: string;
  /** End date of the period (YYYY-MM-DD) */
  periodEnd: string;
  /** Total hours worked in the period */
  totalWorkedHours: number;
  /** Expected work hours for the period */
  expectedWorkHours: number;
  /** Overtime hours (can be negative) */
  overtimeHours: number;
  /** Number of work days in period */
  workDaysCount: number;
  /** Number of weekend days worked */
  weekendDaysWorked: number;
  /** Number of vacation days taken */
  vacationDaysTaken: number;
  /** Number of sick days taken */
  sickDaysTaken: number;
  /** Number of personal days taken */
  personalDaysTaken: number;
  /** Number of training days */
  trainingDaysCount: number;
  /** Number of public holidays in period */
  publicHolidaysCount: number;
  /** Daily breakdown for each day in the period */
  dailyBreakdown: DayBreakdown[];
  /** Project breakdown aggregated for the period */
  projectBreakdown: ProjectBreakdown[];
}

/**
 * Helper functions for overtime calculations
 */

/**
 * Get display name for day type
 */
export function getDayTypeName(dayType: DayType): string {
  const names: Record<DayType, string> = {
    WorkDay: 'Work Day',
    Weekend: 'Weekend',
    PublicHoliday: 'Public Holiday',
    Vacation: 'Vacation',
    SickDay: 'Sick Day',
    PersonalDay: 'Personal Day',
    Training: 'Training',
    BusinessTrip: 'Business Trip',
    Saldo: 'Saldo',
  };
  return names[dayType];
}

/**
 * Get color for day type (for UI visualization)
 */
export function getDayTypeColor(dayType: DayType): string {
  const colors: Record<DayType, string> = {
    WorkDay: '#2196F3', // Blue
    Weekend: '#9E9E9E', // Gray
    PublicHoliday: '#FF9800', // Orange
    Vacation: '#4CAF50', // Green
    SickDay: '#F44336', // Red
    PersonalDay: '#FF9800', // Orange
    Training: '#9C27B0', // Purple
    BusinessTrip: '#00BCD4', // Cyan
    Saldo: '#FF6F00', // Deep Orange - overtime credit usage
  };
  return colors[dayType];
}

/**
 * Get icon for day type (Material Icons name)
 */
export function getDayTypeIcon(dayType: DayType): string {
  const icons: Record<DayType, string> = {
    WorkDay: 'work',
    Weekend: 'weekend',
    PublicHoliday: 'event',
    Vacation: 'beach_access',
    SickDay: 'local_hospital',
    PersonalDay: 'person',
    Training: 'school',
    BusinessTrip: 'flight',
    Saldo: 'account_balance', // Balance/credit icon
  };
  return icons[dayType];
}

/**
 * Format hours to string (e.g., 8.5 → "8h 30m")
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  
  const isNegative = hours < 0;
  const absHours = Math.abs(hours);
  const h = Math.floor(absHours);
  const m = Math.round((absHours - h) * 60);
  
  let result = '';
  if (h > 0) result += `${h}h`;
  if (m > 0) result += ` ${m}m`;
  
  return isNegative ? `-${result.trim()}` : result.trim();
}

/**
 * Format hours to decimal string (e.g., 8.5 → "8.50")
 */
export function formatHoursDecimal(hours: number): string {
  return hours.toFixed(2);
}

/**
 * Calculate average hours per day
 */
export function calculateAverageHoursPerDay(totalHours: number, days: number): number {
  if (days === 0) return 0;
  return totalHours / days;
}

/**
 * Get overtime status (positive, negative, zero)
 */
export function getOvertimeStatus(overtimeHours: number): 'positive' | 'negative' | 'zero' {
  if (overtimeHours > 0.01) return 'positive';
  if (overtimeHours < -0.01) return 'negative';
  return 'zero';
}

/**
 * Calculate overtime percentage
 */
export function calculateOvertimePercentage(
  actualHours: number,
  expectedHours: number
): number {
  if (expectedHours === 0) return 0;
  return ((actualHours - expectedHours) / expectedHours) * 100;
}

/**
 * Filter daily breakdown by day type
 */
export function filterByDayType(
  breakdown: DayBreakdown[],
  dayType: DayType
): DayBreakdown[] {
  return breakdown.filter((day) => day.dayType === dayType);
}

/**
 * Get work days only from breakdown
 */
export function getWorkDays(breakdown: DayBreakdown[]): DayBreakdown[] {
  return breakdown.filter((day) => day.dayType === 'WorkDay');
}

/**
 * Calculate total hours for specific day type
 */
export function calculateTotalHoursForDayType(
  breakdown: DayBreakdown[],
  dayType: DayType
): number {
  return breakdown
    .filter((day) => day.dayType === dayType)
    .reduce((sum, day) => sum + day.actualHours, 0);
}

/**
 * Find days with overtime above threshold
 */
export function findHighOvertimeDays(
  breakdown: DayBreakdown[],
  threshold: number
): DayBreakdown[] {
  return breakdown.filter((day) => day.overtimeHours > threshold);
}

/**
 * Find days with undertime below threshold
 */
export function findUndertimeDays(
  breakdown: DayBreakdown[],
  threshold: number
): DayBreakdown[] {
  return breakdown.filter((day) => day.overtimeHours < threshold);
}

/**
 * Group days by week
 */
export function groupDaysByWeek(breakdown: DayBreakdown[]): DayBreakdown[][] {
  const weeks: DayBreakdown[][] = [];
  let currentWeek: DayBreakdown[] = [];
  
  breakdown.forEach((day) => {
    currentWeek.push(day);
    
    // Sunday is end of week
    if (day.dayOfWeek === 'Sunday') {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add remaining days
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return weeks;
}

/**
 * Calculate weekly summaries
 */
export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalWorked: number;
  totalExpected: number;
  overtime: number;
  workDays: number;
}

export function calculateWeeklySummaries(breakdown: DayBreakdown[]): WeeklySummary[] {
  const weeks = groupDaysByWeek(breakdown);
  
  return weeks.map((week, index) => ({
    weekNumber: index + 1,
    startDate: week[0].date,
    endDate: week[week.length - 1].date,
    totalWorked: week.reduce((sum, day) => sum + day.actualHours, 0),
    totalExpected: week.reduce((sum, day) => sum + day.expectedHours, 0),
    overtime: week.reduce((sum, day) => sum + day.overtimeHours, 0),
    workDays: week.filter((day) => day.dayType === 'WorkDay').length,
  }));
}

/**
 * Sort project breakdown by different criteria
 */
export function sortProjectBreakdown(
  projects: ProjectBreakdown[],
  sortBy: 'hours' | 'billable' | 'percentage' | 'name',
  order: 'asc' | 'desc' = 'desc'
): ProjectBreakdown[] {
  const sorted = [...projects];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'hours':
        comparison = a.totalHours - b.totalHours;
        break;
      case 'billable':
        comparison = a.billableHours - b.billableHours;
        break;
      case 'percentage':
        comparison = a.percentageOfTotal - b.percentageOfTotal;
        break;
      case 'name':
        comparison = a.projectName.localeCompare(b.projectName);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}
