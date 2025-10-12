import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { from, Observable } from 'rxjs';
import {
  GermanStateInfo,
  HolidayCache,
  PublicHoliday,
  SchoolHoliday,
  VacationDay,
  VacationDayType,
  VacationRange,
  formatDateToYYYYMMDD
} from '../models/holiday.model';

/**
 * Service to interact with German Holiday APIs and manage vacation days via Tauri backend
 */
@Injectable({
  providedIn: 'root'
})
export class HolidayService {

  constructor() { }

  /**
   * Get all available German states (Bundesländer)
   */
  getGermanStates(): Observable<GermanStateInfo[]> {
    return from(
      invoke<Array<[string, string]>>('get_german_states').then(states => 
        states.map(([code, name]) => ({ code, name }))
      )
    );
  }

  /**
   * Fetch public holidays for a specific state and year
   */
  fetchPublicHolidays(stateCode: string, year: number): Observable<PublicHoliday[]> {
    return from(invoke<PublicHoliday[]>('fetch_public_holidays', {
      stateCode,
      year
    }));
  }

  /**
   * Fetch school holidays for a specific state and year
   */
  fetchSchoolHolidays(stateCode: string, year: number): Observable<SchoolHoliday[]> {
    return from(invoke<SchoolHoliday[]>('fetch_school_holidays', {
      stateCode,
      year
    }));
  }

  /**
   * Fetch and cache all holidays (public + school) for a state and year
   */
  fetchAndCacheHolidays(stateCode: string, year: number): Observable<HolidayCache> {
    return from(invoke<HolidayCache>('fetch_and_cache_holidays', {
      stateCode,
      year
    }));
  }

  /**
   * Add a vacation day
   */
  addVacationDay(
    date: Date | string,
    dayType: VacationDayType,
    description?: string,
    workedHours?: number,
    billable?: boolean
  ): Observable<void> {
    const dateStr = typeof date === 'string' ? date : formatDateToYYYYMMDD(date);
    
    return from(invoke<void>('add_vacation_day', {
      date: dateStr,
      dayType: dayType,
      description,
      workedHours,
      billable
    }));
  }

  /**
   * Get all vacation days
   */
  getVacationDays(): Observable<VacationDay[]> {
    return from(invoke<VacationDay[]>('get_vacation_days'));
  }

  /**
   * Get vacation days in a specific date range
   */
  getVacationDaysInRange(startDate: Date | string, endDate: Date | string): Observable<VacationDay[]> {
    const startStr = typeof startDate === 'string' ? startDate : formatDateToYYYYMMDD(startDate);
    const endStr = typeof endDate === 'string' ? endDate : formatDateToYYYYMMDD(endDate);
    
    return from(invoke<VacationDay[]>('get_vacation_days_in_range', {
      startDate: startStr,
      endDate: endStr
    }));
  }

  /**
   * Delete a vacation day
   */
  deleteVacationDay(date: Date | string): Observable<void> {
    const dateStr = typeof date === 'string' ? date : formatDateToYYYYMMDD(date);
    
    return from(invoke<void>('delete_vacation_day', {
      date: dateStr
    }));
  }

  /**
   * Delete vacation days in a date range
   */
  deleteVacationDaysInRange(startDate: Date | string, endDate: Date | string): Observable<void> {
    const startStr = typeof startDate === 'string' ? startDate : formatDateToYYYYMMDD(startDate);
    const endStr = typeof endDate === 'string' ? endDate : formatDateToYYYYMMDD(endDate);
    
    return from(invoke<void>('delete_vacation_days_in_range', {
      startDate: startStr,
      endDate: endStr
    }));
  }

  /**
   * Clear all cached holiday data
   */
  clearHolidayCache(): Observable<void> {
    return from(invoke<void>('clear_holiday_cache'));
  }

  /**
   * Convenience method: Fetch holidays for multiple years
   */
  fetchHolidaysForYears(stateCode: string, years: number[]): Observable<HolidayCache[]> {
    return from(
      Promise.all(
        years.map(year => 
          invoke<HolidayCache>('fetch_and_cache_holidays', {
            stateCode,
            year
          })
        )
      )
    );
  }

  /**
   * Convenience method: Add multiple vacation days at once (batch operation)
   */
  addVacationDays(vacationDays: Array<{
    date: Date | string;
    dayType: VacationDayType;
    description?: string;
    workedHours?: number;
    billable?: boolean;
  }>): Observable<void> {
    const formattedDays = vacationDays.map(v => ({
      date: typeof v.date === 'string' ? v.date : formatDateToYYYYMMDD(v.date),
      dayType: v.dayType,
      description: v.description,
      workedHours: v.workedHours,
      billable: v.billable
    }));
    
    return from(invoke<void>('add_vacation_days_batch', {
      vacationDays: formattedDays
    }));
  }

  /**
   * Get all vacation ranges (grouped by range_id)
   */
  getVacationRanges(): Observable<VacationRange[]> {
    return from(invoke<VacationRange[]>('get_vacation_ranges'));
  }

  /**
   * Delete an entire vacation range by range_id
   */
  deleteVacationRange(rangeId: string): Observable<void> {
    return from(invoke<void>('delete_vacation_range', {
      rangeId
    }));
  }

  /**
   * Update an entire vacation range (modifies all days in the range)
   */
  updateVacationRange(
    rangeId: string,
    dayType?: VacationDayType,
    description?: string,
    workedHours?: number,
    billable?: boolean
  ): Observable<void> {
    return from(invoke<void>('update_vacation_range', {
      rangeId,
      dayType,
      description,
      workedHours,
      billable
    }));
  }
}
