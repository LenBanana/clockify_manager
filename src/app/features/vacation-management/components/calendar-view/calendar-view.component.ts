import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { HolidayService } from '../../../../core/services/holiday.service';
import { ClockifyService } from '../../../../core/services/clockify.service';
import { ConfigService } from '../../../../core/services/config.service';
import { VacationDay, PublicHoliday, formatDateToYYYYMMDD, getVacationDay, getPublicHoliday } from '../../../../core/models/holiday.model';
import { TimeEntry } from '../../../../core/models/clockify.model';
import { forkJoin, of, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isPublicHoliday: boolean;
  isVacation: boolean;
  vacationDay?: VacationDay;
  publicHoliday?: PublicHoliday;
  timeEntriesCount: number;
  totalHours: number;
  rangeId?: string;
  isBeforeEntryDate?: boolean; // New property for entry date visualization
}

/**
 * Calendar view component with enhanced day visualization
 * Shows color-coded days for work/weekends/holidays/vacation
 * Displays time entry indicators and allows day selection
 */
@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatInputModule,
  ],
  template: `
    <div class="calendar-view">
      <mat-card class="calendar-card">
        <!-- Calendar Header with Navigation -->
        <div class="calendar-header">
          <div class="month-navigation">
            <button mat-icon-button (click)="previousMonth()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div class="month-picker-wrapper">
              <h2 class="month-year-label" (click)="openMonthPicker()" matTooltip="Click to select month">
                {{ getMonthYearLabel() }}
              </h2>
              <input 
                #monthPickerInput
                matInput 
                [matDatepicker]="monthPicker" 
                [(ngModel)]="currentDate"
                (dateChange)="onMonthSelected($event)"
                class="hidden-input"
              />
              <mat-datepicker 
                #monthPicker 
                startView="year"
                (monthSelected)="onMonthSelected($event, monthPicker)"
                panelClass="month-picker">
              </mat-datepicker>
            </div>
            <button mat-icon-button (click)="nextMonth()">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
          <div class="calendar-actions">
            <button mat-button (click)="goToToday()">
              <mat-icon>today</mat-icon>
              Today
            </button>
          </div>
        </div>

        <!-- Legend -->
        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-color work-day"></span>
            <span>Work Day</span>
          </div>
          <div class="legend-item">
            <span class="legend-color weekend"></span>
            <span>Weekend</span>
          </div>
          <div class="legend-item">
            <span class="legend-color holiday"></span>
            <span>Public Holiday</span>
          </div>
          <div class="legend-item">
            <span class="legend-color vacation"></span>
            <span>Vacation</span>
          </div>
          <div class="legend-item">
            <span class="legend-color sick-day"></span>
            <span>Sick Day</span>
          </div>
          <div class="legend-item">
            <span class="legend-color personal-day"></span>
            <span>Personal</span>
          </div>
          <div class="legend-item">
            <span class="legend-color training"></span>
            <span>Training</span>
          </div>
          <div class="legend-item">
            <span class="legend-color business-trip"></span>
            <span>Business Trip</span>
          </div>
          <div class="legend-item">
            <span class="legend-color saldo"></span>
            <span>Saldo</span>
          </div>
          <div class="legend-item">
            <span class="legend-color before-entry-date"></span>
            <span>Before Entry Date</span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading calendar data...</p>
        </div>

        <!-- Calendar Grid -->
        <div *ngIf="!loading" class="calendar-grid">
          <!-- Day Headers -->
          <div class="calendar-header-row">
            <div class="calendar-day-header" *ngFor="let day of weekDays">
              {{ day }}
            </div>
          </div>

          <!-- Calendar Days -->
          <div class="calendar-days">
            <div
              *ngFor="let day of calendarDays"
              class="calendar-day"
              [class.other-month]="!day.isCurrentMonth"
              [class.today]="day.isToday"
              [class.weekend]="day.isWeekend"
              [class.holiday]="day.isPublicHoliday"
              [class.vacation]="day.isVacation && day.vacationDay?.dayType === 'Vacation'"
              [class.sick-day]="day.isVacation && day.vacationDay?.dayType === 'SickDay'"
              [class.personal-day]="day.isVacation && day.vacationDay?.dayType === 'PersonalDay'"
              [class.training]="day.isVacation && day.vacationDay?.dayType === 'Training'"
              [class.business-trip]="day.isVacation && day.vacationDay?.dayType === 'BusinessTrip'"
              [class.saldo]="day.isVacation && day.vacationDay?.dayType === 'Saldo'"
              [class.before-entry-date]="day.isBeforeEntryDate"
              [class.has-entries]="day.timeEntriesCount > 0"
              [matTooltip]="getDayTooltip(day)"
              (click)="selectDay(day)"
            >
              <div class="day-number">{{ day.date.getDate() }}</div>
              
              <!-- Time Entries Indicator -->
              <div *ngIf="day.timeEntriesCount > 0" class="time-indicator">
                <mat-icon class="small-icon">schedule</mat-icon>
                <span class="hours-text">{{ day.totalHours.toFixed(1) }}h</span>
              </div>

              <!-- Holiday/Vacation Label -->
              <div *ngIf="day.isPublicHoliday || day.isVacation" class="day-label">
                <span *ngIf="day.isPublicHoliday" class="holiday-label">
                  {{ day.publicHoliday?.localName || 'Holiday' }}
                </span>
                <span *ngIf="day.isVacation" class="vacation-label">
                  {{ getVacationTypeLabel(day.vacationDay?.dayType) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .calendar-view {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .calendar-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .calendar-header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid rgba(0,0,0,0.12);
    }

    :host-context(.dark-theme) .calendar-header {
      border-bottom-color: #424242;
    }

    .month-navigation {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .month-picker-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .hidden-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
      top: 50%;
      left: 50%;
    }

    .month-navigation h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      min-width: 200px;
      text-align: center;
      color: #1c1b1f;
    }

    .month-year-label {
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 8px;
      transition: background-color 0.2s ease;
    }

    .month-year-label:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    :host-context(.dark-theme) .month-year-label:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    :host-context(.dark-theme) .month-navigation h2 {
      color: #e6e1e5;
    }

    .calendar-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .calendar-legend {
      flex: 0 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: rgba(0,0,0,0.02);
      border-bottom: 1px solid rgba(0,0,0,0.12);
    }

    :host-context(.dark-theme) .calendar-legend {
      background: #211f26;
      border-bottom-color: #424242;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.875rem;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .legend-item {
      color: #e6e1e5;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.12);
    }

    .legend-color.work-day {
      background: white;
    }

    .legend-color.weekend {
      background: var(--weekend-color, #e3f2fd);
    }

    .legend-color.holiday {
      background: var(--holiday-color, #fff3e0);
    }

    .legend-color.vacation {
      background: var(--vacation-color, #e8f5e9);
    }

    .legend-color.sick-day {
      background: var(--sick-day-color, #ffebee);
    }

    .legend-color.personal-day {
      background: var(--personal-day-color, #f3e5f5);
    }

    .legend-color.training {
      background: var(--training-color, #e0f7fa);
    }

    .legend-color.business-trip {
      background: var(--business-trip-color, #e0f2f1);
    }

    .legend-color.saldo {
      background: var(--saldo-color, #ffe0b2);
    }

    .legend-color.before-entry-date {
      background: repeating-linear-gradient(
        45deg,
        #f5f5f5,
        #f5f5f5 4px,
        #eeeeee 4px,
        #eeeeee 8px
      );
      border: 1px solid #ddd;
    }

    :host-context(.dark-theme) .legend-color.before-entry-date {
      background: repeating-linear-gradient(
        45deg,
        #2a2a2a,
        #2a2a2a 4px,
        #333333 4px,
        #333333 8px
      );
      border-color: #555;
    }

    .loading-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      gap: var(--spacing-md);
    }

    .calendar-grid {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    .calendar-header-row {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: rgba(0,0,0,0.12);
      border: 1px solid rgba(0,0,0,0.12);
    }

    :host-context(.dark-theme) .calendar-header-row {
      background: #424242;
      border-color: #424242;
    }

    .calendar-day-header {
      background: rgba(0,0,0,0.02);
      padding: var(--spacing-sm);
      text-align: center;
      font-weight: 500;
      font-size: 0.875rem;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .calendar-day-header {
      background: #2e2e2e;
      color: #cac4d0;
    }

    .calendar-days {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: rgba(0,0,0,0.12);
      border: 1px solid rgba(0,0,0,0.12);
      border-top: none;
      overflow: hidden;
      min-height: 0;
    }

    :host-context(.dark-theme) .calendar-days {
      background: #424242;
      border-color: #424242;
    }

    .calendar-day {
      background: white;
      padding: var(--spacing-xs);
      min-height: 100px;
      position: relative;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .calendar-day {
      background: #1d1b20;
      color: #e6e1e5;
    }

    .calendar-day:hover {
      background: rgba(0,0,0,0.04);
      transform: scale(1.02);
      box-shadow: var(--shadow-sm);
      z-index: 1;
    }

    :host-context(.dark-theme) .calendar-day:hover {
      background: #2e2e2e;
    }

    .calendar-day.other-month {
      opacity: 0.4;
    }

    .calendar-day.today {
      border: 2px solid #7c4dff;
    }

    :host-context(.dark-theme) .calendar-day.today {
      border-color: #d0bcff;
    }

    .calendar-day.weekend {
      background: #e3f2fd;
    }

    :host-context(.dark-theme) .calendar-day.weekend {
      background: #1a2631;
    }

    .calendar-day.holiday {
      background: #fff3e0;
    }

    :host-context(.dark-theme) .calendar-day.holiday {
      background: #332b1e;
    }

    .calendar-day.vacation {
      background: #e8f5e9;
    }

    :host-context(.dark-theme) .calendar-day.vacation {
      background: #1e2f21;
    }

    .calendar-day.sick-day {
      background: #ffebee;
    }

    :host-context(.dark-theme) .calendar-day.sick-day {
      background: #331e1f;
    }

    .calendar-day.personal-day {
      background: #f3e5f5;
    }

    :host-context(.dark-theme) .calendar-day.personal-day {
      background: #2b1f2f;
    }

    .calendar-day.training {
      background: #e0f7fa;
    }

    :host-context(.dark-theme) .calendar-day.training {
      background: #1e2b2f;
    }

    .calendar-day.business-trip {
      background: #e0f2f1;
    }

    :host-context(.dark-theme) .calendar-day.business-trip {
      background: #1e2b2a;
    }

    .calendar-day.saldo {
      background: #ffe0b2;
    }

    :host-context(.dark-theme) .calendar-day.saldo {
      background: #332a1e;
    }

    .calendar-day.before-entry-date {
      background: repeating-linear-gradient(
        45deg,
        #f5f5f5,
        #f5f5f5 10px,
        #eeeeee 10px,
        #eeeeee 20px
      );
      opacity: 0.6;
      position: relative;
    }

    .calendar-day.before-entry-date::after {
      content: '🚫';
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.75rem;
      opacity: 0.5;
    }

    :host-context(.dark-theme) .calendar-day.before-entry-date {
      background: repeating-linear-gradient(
        45deg,
        #2a2a2a,
        #2a2a2a 10px,
        #333333 10px,
        #333333 20px
      );
    }

    .calendar-day.before-entry-date .day-number,
    .calendar-day.before-entry-date .time-indicator,
    .calendar-day.before-entry-date .day-label {
      opacity: 0.5;
    }

    .day-number {
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: var(--spacing-xs);
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .day-number {
      color: #e6e1e5;
    }

    .calendar-day.today .day-number {
      color: #7c4dff;
      font-weight: 700;
    }

    :host-context(.dark-theme) .calendar-day.today .day-number {
      color: #d0bcff;
    }

    .time-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: rgba(0,0,0,0.6);
      margin-top: auto;
    }

    :host-context(.dark-theme) .time-indicator {
      color: #cac4d0;
    }

    .small-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .hours-text {
      font-weight: 500;
    }

    .day-label {
      font-size: 0.625rem;
      margin-top: var(--spacing-xs);
      padding: 2px 4px;
      border-radius: 4px;
      background: rgba(0,0,0,0.08);
      text-align: center;
      line-height: 1.2;
      word-break: break-word;
    }

    .holiday-label {
      font-weight: 500;
      color: var(--holiday-text, #e65100);
    }

    .vacation-label {
      font-weight: 500;
      color: var(--vacation-text, #2e7d32);
    }

    @media (max-width: 768px) {
      .calendar-day {
        min-height: 80px;
        font-size: 0.875rem;
      }

      .day-number {
        font-size: 1rem;
      }

      .calendar-legend {
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .month-navigation h2 {
        font-size: 1.25rem;
        min-width: 150px;
      }
    }
  `]
})
export class CalendarViewComponent implements OnInit, OnChanges {
  @Input() vacationDays: VacationDay[] = [];
  @Output() daySelected = new EventEmitter<{date: Date, rangeId?: string}>();
  @Output() vacationAdded = new EventEmitter<void>();
  @ViewChild('monthPicker') monthPicker!: MatDatepicker<Date>;

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  calendarDays: CalendarDay[] = [];
  currentDate = new Date();
  publicHolidays: PublicHoliday[] = [];
  timeEntries: TimeEntry[] = [];
  loading = false;

  constructor(
    private holidayService: HolidayService,
    private clockifyService: ClockifyService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.loadCalendarData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When vacationDays input changes, regenerate the calendar
    if (changes['vacationDays'] && !changes['vacationDays'].firstChange) {
      this.generateCalendarDays();
    }
  }

  loadCalendarData(): void {
    this.loading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate potential years to fetch (handles December showing January of next year, etc.)
    const prevMonthDate = new Date(year, month - 1, 1);
    const nextMonthDate = new Date(year, month + 1, 1);
    const yearsToFetch = new Set([
      prevMonthDate.getFullYear(),
      year,
      nextMonthDate.getFullYear()
    ]);
    const years = Array.from(yearsToFetch);
    
    const config = this.configService.getCurrentConfig();
    
    forkJoin({
      holidays: config?.location?.bundesland_code 
        ? this.holidayService.fetchHolidaysForYears(config.location.bundesland_code, years).pipe(
            map(caches => caches.flatMap(cache => cache.publicHolidays)),
            catchError(() => of([]))
          )
        : of([]),
      timeEntries: config?.clockify?.workspace_id && config?.clockify?.api_key
        ? this.clockifyService.fetchTimeEntries(
            config.clockify.api_key,
            config.clockify.workspace_id,
            `${formatDateToYYYYMMDD(firstDay)}T00:00:00Z`,
            `${formatDateToYYYYMMDD(lastDay)}T23:59:59Z`,
            config.clockify.base_url
          ).pipe(catchError(() => of([])))
        : of([])
    }).subscribe({
      next: (data) => {
        this.publicHolidays = data.holidays;
        this.timeEntries = data.timeEntries;
        this.generateCalendarDays();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendar data:', error);
        this.generateCalendarDays();
        this.loading = false;
      }
    });
  }

  generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    // Adjust so Monday is 0
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;
    
    // Calculate days to show from previous month
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate days to show from next month (to complete the grid)
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((daysFromPrevMonth + totalDays) / 7) * 7;
    const daysFromNextMonth = totalCells - daysFromPrevMonth - totalDays;
    
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push(this.createCalendarDay(date, false, today));
    }
    
    // Add days from current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push(this.createCalendarDay(date, true, today));
    }
    
    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push(this.createCalendarDay(date, false, today));
    }
  }

  createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateStr = formatDateToYYYYMMDD(date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const vacationDay = getVacationDay(date, this.vacationDays);
    const publicHoliday = getPublicHoliday(date, this.publicHolidays);
    
    // Check if date is before entry date
    const config = this.configService.getCurrentConfig();
    let isBeforeEntryDate = false;
    if (config?.work_settings?.entry_date) {
      const entryDate = new Date(config.work_settings.entry_date);
      entryDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      isBeforeEntryDate = checkDate < entryDate;
    }
    
    // Calculate time entries for this day
    const dayEntries = this.timeEntries.filter(entry => {
      if (!entry.timeInterval.start) return false;
      const entryDate = new Date(entry.timeInterval.start);
      return formatDateToYYYYMMDD(entryDate) === dateStr;
    });
    
    const totalHours = dayEntries.reduce((sum, entry) => {
      if (entry.timeInterval.duration) {
        return sum + this.parseDuration(entry.timeInterval.duration);
      }
      return sum;
    }, 0);
    
    return {
      date,
      dateStr,
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isWeekend,
      isPublicHoliday: !!publicHoliday,
      isVacation: !!vacationDay,
      vacationDay,
      publicHoliday,
      timeEntriesCount: dayEntries.length,
      totalHours,
      rangeId: vacationDay?.rangeId,
      isBeforeEntryDate
    };
  }

  parseDuration(duration: string): number {
    // Parse ISO 8601 duration format (PT8H30M15S)
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);
    
    return hours + (minutes / 60) + (seconds / 3600);
  }

  getDayTooltip(day: CalendarDay): string {
    const parts: string[] = [];
    
    if (day.isBeforeEntryDate) {
      parts.push('⚠️ Before entry date - excluded from calculations');
    }
    if (day.isToday) parts.push('Today');
    if (day.isPublicHoliday) parts.push(`Holiday: ${day.publicHoliday?.localName}`);
    if (day.isVacation) {
      parts.push(`${this.getVacationTypeLabel(day.vacationDay?.dayType)}`);
      if (day.vacationDay?.description) {
        parts.push(day.vacationDay.description);
      }
    }
    if (day.timeEntriesCount > 0) {
      parts.push(`${day.timeEntriesCount} time ${day.timeEntriesCount === 1 ? 'entry' : 'entries'}`);
      parts.push(`${day.totalHours.toFixed(2)} hours worked`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Click to view details';
  }

  getVacationTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      'Vacation': '🌴 Vacation',
      'SickDay': '🤒 Sick Day',
      'PersonalDay': '📅 Personal Day',
      'Training': '📚 Training'
    };
    return type ? labels[type] || type : '';
  }

  selectDay(day: CalendarDay): void {
    this.daySelected.emit({ date: day.date, rangeId: day.rangeId });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.loadCalendarData();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.loadCalendarData();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.loadCalendarData();
  }

  getMonthYearLabel(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  openMonthPicker(): void {
    this.monthPicker.open();
  }

  onMonthSelected(event: any, datepickerRef?: MatDatepicker<Date>): void {
    const selectedDate = event instanceof Date ? event : event.value;
    
    if (selectedDate) {
      // Update currentDate to the selected month/year while keeping the day as 1st
      this.currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      this.loadCalendarData();
      
      // Close the datepicker if reference is provided
      if (datepickerRef) {
        datepickerRef.close();
      }
    }
  }
}
