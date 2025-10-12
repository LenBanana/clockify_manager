import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';
import { 
  OvertimeReport, 
  DayBreakdown, 
  ProjectBreakdown 
} from '../models/overtime.model';
import { WorkSettings } from '../models/config.model';
import { PublicHoliday, VacationDay } from '../models/holiday.model';
import { Project, TimeEntry } from '../models/clockify.model';

/**
 * Service for calculating overtime and generating reports
 * Wraps Tauri commands from Rust backend
 */
@Injectable({
  providedIn: 'root'
})
export class OvertimeService {

  constructor() { }

  /**
   * Calculate overtime report for a date range
   * 
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @param workSettings Work configuration (daily hours, working days, etc.)
   * @param publicHolidays List of public holidays in the period
   * @param vacationDays List of user vacation days in the period
   * @param timeEntries Clockify time entries for the period
   * @param projects List of projects for name resolution
   * @returns Observable<OvertimeReport>
   */
  calculateOvertime(
    startDate: string,
    endDate: string,
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<OvertimeReport> {
    return from(
      invoke<OvertimeReport>('calculate_overtime', {
        startDate,
        endDate,
        workSettings,
        publicHolidays,
        vacationDays,
        timeEntries,
        projects,
      })
    );
  }

  /**
   * Get project breakdown aggregated over a period
   * 
   * @param timeEntries Clockify time entries for the period
   * @param projects List of projects for name resolution
   * @returns Observable<ProjectBreakdown[]>
   */
  getProjectBreakdown(
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<ProjectBreakdown[]> {
    return from(
      invoke<ProjectBreakdown[]>('get_project_breakdown', {
        timeEntries,
        projects,
      })
    );
  }

  /**
   * Get daily breakdown for a date range
   * 
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @param workSettings Work configuration (daily hours, working days, etc.)
   * @param publicHolidays List of public holidays in the period
   * @param vacationDays List of user vacation days in the period
   * @param timeEntries Clockify time entries for the period
   * @param projects List of projects for name resolution
   * @returns Observable<DayBreakdown[]>
   */
  getDailyBreakdown(
    startDate: string,
    endDate: string,
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<DayBreakdown[]> {
    return from(
      invoke<DayBreakdown[]>('get_daily_breakdown', {
        startDate,
        endDate,
        workSettings,
        publicHolidays,
        vacationDays,
        timeEntries,
        projects,
      })
    );
  }

  /**
   * Convenience method: Calculate overtime for current week
   */
  calculateOvertimeForCurrentWeek(
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<OvertimeReport> {
    const { start, end } = this.getCurrentWeekDates();
    return this.calculateOvertime(
      start,
      end,
      workSettings,
      publicHolidays,
      vacationDays,
      timeEntries,
      projects
    );
  }

  /**
   * Convenience method: Calculate overtime for current month
   */
  calculateOvertimeForCurrentMonth(
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<OvertimeReport> {
    const { start, end } = this.getCurrentMonthDates();
    return this.calculateOvertime(
      start,
      end,
      workSettings,
      publicHolidays,
      vacationDays,
      timeEntries,
      projects
    );
  }

  /**
   * Convenience method: Calculate overtime for last month
   */
  calculateOvertimeForLastMonth(
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<OvertimeReport> {
    const { start, end } = this.getLastMonthDates();
    return this.calculateOvertime(
      start,
      end,
      workSettings,
      publicHolidays,
      vacationDays,
      timeEntries,
      projects
    );
  }

  /**
   * Convenience method: Calculate overtime for current year
   */
  calculateOvertimeForCurrentYear(
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<OvertimeReport> {
    const { start, end } = this.getCurrentYearDates();
    return this.calculateOvertime(
      start,
      end,
      workSettings,
      publicHolidays,
      vacationDays,
      timeEntries,
      projects
    );
  }

  /**
   * Convenience method: Calculate overtime for custom date range (Date objects)
   */
  calculateOvertimeForDateRange(
    startDate: Date,
    endDate: Date,
    workSettings: WorkSettings,
    publicHolidays: PublicHoliday[],
    vacationDays: VacationDay[],
    timeEntries: TimeEntry[],
    projects: Project[]
  ): Observable<OvertimeReport> {
    return this.calculateOvertime(
      this.formatDateToYYYYMMDD(startDate),
      this.formatDateToYYYYMMDD(endDate),
      workSettings,
      publicHolidays,
      vacationDays,
      timeEntries,
      projects
    );
  }

  // ============ Date Helper Methods ============

  /**
   * Get start and end dates for current week (Monday to Sunday)
   */
  private getCurrentWeekDates(): { start: string; end: string } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: this.formatDateToYYYYMMDD(monday),
      end: this.formatDateToYYYYMMDD(sunday),
    };
  }

  /**
   * Get start and end dates for current month
   */
  private getCurrentMonthDates(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start: this.formatDateToYYYYMMDD(start),
      end: this.formatDateToYYYYMMDD(end),
    };
  }

  /**
   * Get start and end dates for last month
   */
  private getLastMonthDates(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      start: this.formatDateToYYYYMMDD(start),
      end: this.formatDateToYYYYMMDD(end),
    };
  }

  /**
   * Get start and end dates for current year
   */
  private getCurrentYearDates(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);

    return {
      start: this.formatDateToYYYYMMDD(start),
      end: this.formatDateToYYYYMMDD(end),
    };
  }

  /**
   * Format Date object to YYYY-MM-DD string
   */
  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse YYYY-MM-DD string to Date object
   */
  parseDateFromYYYYMMDD(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get date range string for display (e.g., "Oct 1 - Oct 7, 2025")
   */
  getDateRangeDisplay(startDate: string, endDate: string): string {
    const start = this.parseDateFromYYYYMMDD(startDate);
    const end = this.parseDateFromYYYYMMDD(endDate);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    const year = end.getFullYear();
    
    return `${startStr} - ${endStr}, ${year}`;
  }

  /**
   * Get preset date ranges
   */
  getPresetDateRanges(): { label: string; value: { start: string; end: string } }[] {
    return [
      { label: 'This Week', value: this.getCurrentWeekDates() },
      { label: 'This Month', value: this.getCurrentMonthDates() },
      { label: 'Last Month', value: this.getLastMonthDates() },
      { label: 'This Year', value: this.getCurrentYearDates() },
    ];
  }
}
