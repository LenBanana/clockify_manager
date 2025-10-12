import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HolidayService } from '../../../../core/services/holiday.service';
import { ClockifyService } from '../../../../core/services/clockify.service';
import { ConfigService } from '../../../../core/services/config.service';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { VacationDay, PublicHoliday, formatDateToYYYYMMDD, getVacationDay, getPublicHoliday } from '../../../../core/models/holiday.model';
import { TimeEntry } from '../../../../core/models/clockify.model';
import { AddVacationDialogComponent } from '../add-vacation-dialog/add-vacation-dialog.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Sidebar component showing detailed information for a selected calendar day
 * Displays time entries, vacation/holiday info, overtime, and quick actions
 */
@Component({
  selector: 'app-day-detail-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DateFormatPipe,
  ],
  template: `
    <div class="day-detail-sidebar" *ngIf="selectedDate">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="header-content">
          <h2>{{ selectedDate | appDate:'long' }}</h2>
          <p class="day-of-week">{{ getDayOfWeek() }}</p>
        </div>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading day details...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading" class="sidebar-content">
        <!-- Day Type Indicators -->
        <div class="day-type-section">
          <mat-chip-set>
            <mat-chip *ngIf="isToday">
              <mat-icon>today</mat-icon>
              Today
            </mat-chip>
            <mat-chip *ngIf="isWeekend" class="weekend-chip">
              <mat-icon>weekend</mat-icon>
              Weekend
            </mat-chip>
            <mat-chip *ngIf="publicHoliday" class="holiday-chip">
              <mat-icon>event</mat-icon>
              {{ publicHoliday.localName }}
            </mat-chip>
            <mat-chip *ngIf="vacationDay" [class]="getVacationChipClass()">
              <mat-icon>{{ getVacationIcon() }}</mat-icon>
              {{ getVacationTypeLabel() }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <mat-divider></mat-divider>

        <!-- Time Entries -->
        <div class="time-entries-section">
          <div class="section-header">
            <h3>Time Entries</h3>
            <span class="entry-count">{{ timeEntries.length }}</span>
          </div>

          <div *ngIf="timeEntries.length === 0" class="empty-state">
            <mat-icon>schedule</mat-icon>
            <p>No time entries for this day</p>
          </div>

          <mat-list *ngIf="timeEntries.length > 0">
            <mat-list-item *ngFor="let entry of timeEntries" class="time-entry-item">
              <div matListItemTitle class="entry-title">
                {{ entry.description || 'No description' }}
              </div>
              <div matListItemLine class="entry-meta">
                <span class="project-name">{{ entry.projectId || 'No Project' }}</span>
                <span class="entry-duration">{{ formatEntryDuration(entry) }}</span>
              </div>
              <div matListItemLine class="entry-time">
                {{ formatEntryTime(entry.timeInterval.start) }} - 
                {{ entry.timeInterval.end ? formatEntryTime(entry.timeInterval.end) : 'Running' }}
              </div>
            </mat-list-item>
          </mat-list>
        </div>

        <mat-divider></mat-divider>

        <!-- Vacation Day Info -->
        <div *ngIf="vacationDay" class="vacation-info-section">
          <h3>Vacation Day Details</h3>
          <div class="vacation-details">
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{{ getVacationTypeLabel() }}</span>
            </div>
            <div *ngIf="vacationDay.description" class="detail-row">
              <span class="detail-label">Note:</span>
              <span class="detail-value">{{ vacationDay.description }}</span>
            </div>
            
            <!-- Range Information -->
            <div *ngIf="rangeDays.length > 1" class="range-info">
              <mat-divider style="margin: 16px 0;"></mat-divider>
              <div class="detail-row">
                <span class="detail-label">Part of Range:</span>
                <span class="detail-value">{{ rangeDays.length }} days</span>
              </div>
              <div class="range-dates">
                <div class="range-date-list">
                  <div *ngFor="let day of rangeDays" class="range-date-item" 
                       [class.selected]="isSelectedDate(day.date)">
                    <mat-icon class="date-icon">{{ isSelectedDate(day.date) ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
                    <span>{{ formatRangeDate(day.date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="vacation-actions">
            <button *ngIf="rangeDays.length > 1" mat-raised-button color="primary" (click)="editRange()">
              <mat-icon>edit</mat-icon>
              Edit Range ({{ rangeDays.length }} days)
            </button>
            <button mat-stroked-button color="warn" (click)="deleteVacationOrRange()">
              <mat-icon>delete</mat-icon>
              {{ rangeDays.length > 1 ? 'Delete Range (' + rangeDays.length + ' days)' : 'Remove Vacation Day' }}
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="action-buttons">
            <button *ngIf="!vacationDay" mat-raised-button color="primary" (click)="addVacation()">
              <mat-icon>add</mat-icon>
              Add Vacation Day
            </button>
            <button mat-button (click)="openInClockify()" *ngIf="timeEntries.length > 0">
              <mat-icon>open_in_new</mat-icon>
              Open in Clockify
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .day-detail-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .day-detail-sidebar {
      background: #1d1b20;
      color: #e6e1e5;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-lg);
      border-bottom: 1px solid rgba(0,0,0,0.12);
      background: #7c4dff;
      color: white;
    }

    :host-context(.dark-theme) .sidebar-header {
      background: #6750a4;
      border-bottom-color: #424242;
    }

    .header-content h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .day-of-week {
      margin: var(--spacing-xs) 0 0 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .sidebar-header button {
      color: white;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      gap: var(--spacing-md);
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .loading-container {
      color: #e6e1e5;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-lg);
      background: #fafafa;
    }

    :host-context(.dark-theme) .sidebar-content {
      background: #1d1b20;
    }

    .day-type-section {
      margin-bottom: var(--spacing-md);
    }

    mat-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: #1c1b1f;
    }

    :host-context(.dark-theme) mat-chip {
      color: #e6e1e5;
    }

    .weekend-chip {
      background: #e3f2fd !important;
      color: #0d47a1 !important;
    }

    :host-context(.dark-theme) .weekend-chip {
      background: #1a2631 !important;
      color: #90caf9 !important;
    }

    :host-context(.dark-theme) .weekend-chip ::ng-deep .mdc-evolution-chip__text-label,
    :host-context(.dark-theme) .weekend-chip ::ng-deep mat-icon {
      color: #90caf9 !important;
    }

    .holiday-chip {
      background: #fff3e0 !important;
      color: #e65100 !important;
    }

    :host-context(.dark-theme) .holiday-chip {
      background: #332b1e !important;
      color: #ffb74d !important;
    }

    :host-context(.dark-theme) .holiday-chip ::ng-deep .mdc-evolution-chip__text-label,
    :host-context(.dark-theme) .holiday-chip ::ng-deep mat-icon {
      color: #ffb74d !important;
    }

    .vacation-chip {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    :host-context(.dark-theme) .vacation-chip {
      background: #2d4a30 !important;
      color: #a5d6a7 !important;
    }

    :host-context(.dark-theme) .vacation-chip ::ng-deep .mdc-evolution-chip__text-label,
    :host-context(.dark-theme) .vacation-chip ::ng-deep mat-icon {
      color: #a5d6a7 !important;
    }

    .sick-chip {
      background: #ffebee !important;
      color: #c62828 !important;
    }

    :host-context(.dark-theme) .sick-chip {
      background: #331e1f !important;
      color: #e57373 !important;
    }

    :host-context(.dark-theme) .sick-chip ::ng-deep .mdc-evolution-chip__text-label,
    :host-context(.dark-theme) .sick-chip ::ng-deep mat-icon {
      color: #e57373 !important;
    }

    .personal-chip {
      background: #f3e5f5 !important;
      color: #6a1b9a !important;
    }

    :host-context(.dark-theme) .personal-chip {
      background: #2b1f2f !important;
      color: #ba68c8 !important;
    }

    :host-context(.dark-theme) .personal-chip ::ng-deep .mdc-evolution-chip__text-label,
    :host-context(.dark-theme) .personal-chip ::ng-deep mat-icon {
      color: #ba68c8 !important;
    }

    .training-chip {
      background: #e0f7fa !important;
      color: #00838f !important;
    }

    :host-context(.dark-theme) .training-chip {
      background: #1e2b2f !important;
      color: #4dd0e1 !important;
    }

    :host-context(.dark-theme) .training-chip ::ng-deep .mdc-evolution-chip__text-label,
    :host-context(.dark-theme) .training-chip ::ng-deep mat-icon {
      color: #4dd0e1 !important;
    }

    mat-divider {
      margin: var(--spacing-lg) 0;
    }

    h3 {
      margin: 0 0 var(--spacing-md) 0;
      font-size: 1rem;
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) h3 {
      color: #e6e1e5;
    }

    .overtime-section,
    .time-entries-section,
    .vacation-info-section,
    .quick-actions {
      margin-bottom: var(--spacing-lg);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-md);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md);
      background: rgba(0,0,0,0.02);
      border-radius: var(--border-radius-md);
    }

    :host-context(.dark-theme) .stat-item {
      background: #2e2e2e;
    }

    .stat-label {
      font-size: 0.75rem;
      color: rgba(0,0,0,0.6);
      margin-bottom: var(--spacing-xs);
    }

    :host-context(.dark-theme) .stat-label {
      color: #cac4d0;
    }

    .stat-value {
      font-size: 1.125rem;
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .stat-value {
      color: #e6e1e5;
    }

    .stat-value.positive {
      color: #4caf50;
    }

    :host-context(.dark-theme) .stat-value.positive {
      color: #81c784;
    }

    .stat-value.negative {
      color: #f44336;
    }

    :host-context(.dark-theme) .stat-value.negative {
      color: #e57373;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .entry-count {
      background: #7c4dff;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    :host-context(.dark-theme) .entry-count {
      background: #d0bcff;
      color: #381e72;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xl);
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .empty-state {
      color: #cac4d0;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.3;
    }

    .time-entry-item {
      border-left: 3px solid #7c4dff;
      margin-bottom: var(--spacing-sm);
      background: rgba(0,0,0,0.02);
      border-radius: var(--border-radius-sm);
    }

    :host-context(.dark-theme) .time-entry-item {
      border-left-color: #d0bcff;
      background: #2e2e2e;
    }

    .entry-title {
      font-weight: 500;
      font-size: 0.9375rem;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .entry-title {
      color: #e6e1e5;
    }

    .entry-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      margin-top: var(--spacing-xs);
    }

    .project-name {
      color: #7c4dff;
    }

    :host-context(.dark-theme) .project-name {
      color: #d0bcff;
    }

    .entry-duration {
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .entry-duration {
      color: #e6e1e5;
    }

    .entry-time {
      font-size: 0.75rem;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .entry-time {
      color: #cac4d0;
    }

    .vacation-details {
      background: rgba(0,0,0,0.02);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-md);
    }

    :host-context(.dark-theme) .vacation-details {
      background: #2e2e2e;
    }

    .detail-row {
      display: flex;
      margin-bottom: var(--spacing-sm);
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      font-weight: 500;
      margin-right: var(--spacing-sm);
      min-width: 60px;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .detail-label {
      color: #e6e1e5;
    }

    .detail-value {
      flex: 1;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .detail-value {
      color: #cac4d0;
    }

    .delete-button {
      width: 100%;
    }

    .vacation-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .vacation-actions button {
      width: 100%;
    }

    .range-info {
      margin-top: var(--spacing-md);
    }

    .range-date-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-sm);
    }

    .range-date-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      transition: background-color 0.2s ease;
    }

    .range-date-item.selected {
      background: rgba(124, 77, 255, 0.1);
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .range-date-item.selected {
      background: rgba(208, 188, 255, 0.15);
      color: #e6e1e5;
    }

    .range-date-item .date-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #7c4dff;
    }

    :host-context(.dark-theme) .range-date-item .date-icon {
      color: #d0bcff;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .action-buttons button {
      width: 100%;
    }
  `]
})
export class DayDetailSidebarComponent implements OnChanges {
  @Input() selectedDate: Date | null = null;
  @Input() selectedRangeId: string | undefined = undefined;
  @Output() close = new EventEmitter<void>();
  @Output() vacationAdded = new EventEmitter<void>();

  loading = false;
  isToday = false;
  isWeekend = false;
  vacationDay: VacationDay | undefined;
  rangeDays: VacationDay[] = [];
  publicHoliday: PublicHoliday | undefined;
  timeEntries: TimeEntry[] = [];

  constructor(
    private holidayService: HolidayService,
    private clockifyService: ClockifyService,
    private configService: ConfigService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Load details whenever selectedDate changes and has a value
    if (changes['selectedDate']) {
      if (this.selectedDate) {
        this.loadDayDetails();
      }
    } else if (changes['selectedRangeId'] && this.selectedDate) {
      // If only rangeId changed but we have a date, reload
      this.loadDayDetails();
    }
  }

  loadDayDetails(): void {
    if (!this.selectedDate) return;

    this.loading = true;
    const config = this.configService.getCurrentConfig();
    const dateStr = formatDateToYYYYMMDD(this.selectedDate);
    const year = this.selectedDate.getFullYear();

    // Check day properties
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.isToday = this.selectedDate.getTime() === today.getTime();
    this.isWeekend = this.selectedDate.getDay() === 0 || this.selectedDate.getDay() === 6;

    // Load all data in parallel
    forkJoin({
      vacationDays: this.holidayService.getVacationDays().pipe(catchError(() => of([]))),
      publicHolidays: config?.location?.bundesland_code
        ? this.holidayService.fetchPublicHolidays(config.location.bundesland_code, year).pipe(catchError(() => of([])))
        : of([]),
      timeEntries: config?.clockify?.api_key && config?.clockify?.workspace_id
        ? this.clockifyService.fetchTimeEntries(
            config.clockify.api_key,
            config.clockify.workspace_id,
            `${dateStr}T00:00:00Z`,
            `${dateStr}T23:59:59Z`,
            config.clockify.base_url
          ).pipe(catchError(() => of([])))
        : of([])
    }).subscribe({
      next: (data) => {
        this.vacationDay = getVacationDay(this.selectedDate!, data.vacationDays);
        this.publicHoliday = getPublicHoliday(this.selectedDate!, data.publicHolidays);
        this.timeEntries = data.timeEntries;
        
        // Load all days in the range if rangeId is provided
        if (this.selectedRangeId) {
          this.rangeDays = data.vacationDays.filter(day => day.rangeId === this.selectedRangeId);
        } else {
          this.rangeDays = [];
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading day details:', error);
        this.loading = false;
        this.snackBar.open('Failed to load day details', 'Close', { duration: 3000 });
      }
    });
  }

  getDayOfWeek(): string {
    if (!this.selectedDate) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.selectedDate.getDay()];
  }

  getVacationTypeLabel(): string {
    if (!this.vacationDay) return '';
    const labels: Record<string, string> = {
      'Vacation': 'Vacation',
      'SickDay': 'Sick Day',
      'PersonalDay': 'Personal Day',
      'Training': 'Training'
    };
    return labels[this.vacationDay.dayType] || this.vacationDay.dayType;
  }

  getVacationIcon(): string {
    if (!this.vacationDay) return 'event';
    const icons: Record<string, string> = {
      'Vacation': 'beach_access',
      'SickDay': 'medication',
      'PersonalDay': 'person',
      'Training': 'school'
    };
    return icons[this.vacationDay.dayType] || 'event';
  }

  getVacationChipClass(): string {
    if (!this.vacationDay) return '';
    const classes: Record<string, string> = {
      'Vacation': 'vacation-chip',
      'SickDay': 'sick-chip',
      'PersonalDay': 'personal-chip',
      'Training': 'training-chip'
    };
    return classes[this.vacationDay.dayType] || '';
  }

  formatEntryDuration(entry: TimeEntry): string {
    if (!entry.timeInterval.duration) return 'Running...';
    
    // Parse ISO 8601 duration
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = entry.timeInterval.duration.match(regex);
    
    if (!matches) return entry.timeInterval.duration;
    
    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatEntryTime(isoString: string | undefined): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  addVacation(): void {
    const dialogRef = this.dialog.open(AddVacationDialogComponent, {
      width: '500px',
      data: { 
        mode: 'add',
        date: this.selectedDate 
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.vacationAdded.emit();
        this.loadDayDetails();
      }
    });
  }

  deleteVacationDay(): void {
    if (!this.selectedDate) return;

    if (confirm('Are you sure you want to delete this vacation day?')) {
      this.holidayService.deleteVacationDay(this.selectedDate).subscribe({
        next: () => {
          this.snackBar.open('Vacation day deleted', 'Close', { duration: 3000 });
          this.vacationAdded.emit();
          this.loadDayDetails();
        },
        error: (error) => {
          console.error('Error deleting vacation day:', error);
          this.snackBar.open('Failed to delete vacation day', 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteVacationOrRange(): void {
    if (!this.selectedRangeId || this.rangeDays.length <= 1) {
      this.deleteVacationDay();
      return;
    }

    const message = `Delete ${this.rangeDays.length} vacation days in this range?`;
    if (confirm(message)) {
      this.holidayService.deleteVacationRange(this.selectedRangeId).subscribe({
        next: () => {
          this.snackBar.open('Vacation range deleted', 'Close', { duration: 3000 });
          this.vacationAdded.emit();
          this.close.emit();
        },
        error: (error) => {
          console.error('Error deleting vacation range:', error);
          this.snackBar.open('Failed to delete vacation range', 'Close', { duration: 3000 });
        }
      });
    }
  }

  editRange(): void {
    if (!this.selectedRangeId || this.rangeDays.length === 0) return;

    const sortedDays = [...this.rangeDays].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const dialogRef = this.dialog.open(AddVacationDialogComponent, {
      width: '500px',
      data: {
        mode: 'edit-range',
        date: new Date(sortedDays[0].date),
        endDate: new Date(sortedDays[sortedDays.length - 1].date),
        dayType: this.vacationDay!.dayType,
        description: this.vacationDay!.description,
        workedHours: this.vacationDay!.workedHours,
        billable: this.vacationDay!.billable,
        rangeId: this.selectedRangeId
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.vacationAdded.emit();
        this.loadDayDetails();
      }
    });
  }

  isSelectedDate(dateStr: string): boolean {
    if (!this.selectedDate) return false;
    return formatDateToYYYYMMDD(this.selectedDate) === dateStr;
  }

  formatRangeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayOfWeek}, ${dateFormatted}`;
  }

  openInClockify(): void {
    // Open Clockify in browser
    const config = this.configService.getCurrentConfig();
    const baseUrl = config.clockify?.base_url || 'https://app.clockify.me';
    const workspaceId = config.clockify?.workspace_id;
    
    if (workspaceId && this.selectedDate) {
      const dateStr = formatDateToYYYYMMDD(this.selectedDate);
      const url = `${baseUrl}/tracker?date=${dateStr}`;
      window.open(url, '_blank');
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
