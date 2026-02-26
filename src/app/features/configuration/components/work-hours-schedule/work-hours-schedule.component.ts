import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { WorkHoursPeriod } from '../../../../core/models/config.model';
import {
  WorkHoursPeriodDialogComponent,
  WorkHoursPeriodDialogData,
} from '../work-hours-period-dialog/work-hours-period-dialog.component';

@Component({
  selector: 'app-work-hours-schedule',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="schedule-root">

      <!-- Header row -->
      <div class="schedule-header">
        <span class="schedule-label">
          {{ schedule.length }} {{ schedule.length === 1 ? 'period' : 'periods' }} defined
        </span>
        <button mat-stroked-button color="primary" (click)="addPeriod()">
          <mat-icon>add</mat-icon>
          Add Period
        </button>
      </div>

      <!-- Period list -->
      <div class="period-list">

        <!-- Empty state -->
        <div class="empty-state" *ngIf="sortedSchedule.length === 0">
          <mat-icon>schedule</mat-icon>
          <p>No working hours periods defined.</p>
          <p class="empty-hint">Add a period to specify your contracted hours per day.</p>
        </div>

        <ng-container *ngFor="let period of sortedSchedule; let i = index">

          <!-- Gap warning between consecutive periods -->
          <div class="gap-warning" *ngIf="hasGapBefore(i)">
            <mat-icon>warning_amber</mat-icon>
            <span>
              Gap detected: no hours defined between
              <strong>{{ formatDate(sortedSchedule[i - 1].end_date) }}</strong> and
              <strong>{{ formatDate(period.start_date) }}</strong>.
              Days in this gap will use the fallback of 0h.
            </span>
          </div>

          <!-- Period row -->
          <div class="period-row">
            <div class="period-timeline-dot"></div>

            <div class="period-body">
              <div class="period-range">
                <span class="period-date">{{ formatDate(period.start_date) }}</span>
                <mat-icon class="range-arrow">arrow_forward</mat-icon>
                <span
                  class="period-date"
                  [class.open-ended-label]="!period.end_date">
                  {{ period.end_date ? formatDate(period.end_date) : 'open-ended' }}
                </span>
                <mat-icon *ngIf="!period.end_date" class="infinity-icon" matTooltip="No end date — continues indefinitely">all_inclusive</mat-icon>
              </div>

              <div class="period-hours">
                <span class="hours-per-day">{{ period.daily_hours }}h&thinsp;/&thinsp;day</span>
                <span class="hours-divider">·</span>
                <span class="hours-per-week" *ngIf="workingDaysCount > 0">
                  {{ roundHalf(period.daily_hours * workingDaysCount) }}h&thinsp;/&thinsp;week
                </span>
              </div>
            </div>

            <div class="period-actions">
              <button
                mat-icon-button
                (click)="editPeriod(period)"
                matTooltip="Edit period"
                class="action-btn">
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                (click)="deletePeriod(period)"
                [disabled]="schedule.length <= 1"
                [matTooltip]="schedule.length <= 1 ? 'At least one period is required' : 'Delete period'"
                class="action-btn delete-btn">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </div>

        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .schedule-root {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .schedule-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .schedule-label {
      font-size: var(--font-size-sm, 0.8rem);
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }

    /* ── Period list ─────────────────────────────────────────── */
    .period-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      overflow: hidden;
    }

    /* ── Empty state ─────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      gap: 6px;
      color: rgba(0, 0, 0, 0.38);
    }

    .empty-state mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      margin-bottom: 4px;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.95rem;
    }

    .empty-hint {
      font-size: 0.8rem !important;
      color: rgba(0, 0, 0, 0.28) !important;
    }

    /* ── Gap warning ─────────────────────────────────────────── */
    .gap-warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 152, 0, 0.1);
      border-bottom: 1px solid rgba(255, 152, 0, 0.25);
      font-size: 0.8rem;
      color: #e65100;
      line-height: 1.4;
    }

    .gap-warning mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ── Period row ──────────────────────────────────────────── */
    .period-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: transparent;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      transition: background 150ms ease;
    }

    .period-row:last-child {
      border-bottom: none;
    }

    .period-row:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    /* Timeline dot */
    .period-timeline-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color, #3f51b5);
      flex-shrink: 0;
    }

    /* Body */
    .period-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .period-range {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .period-date {
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .open-ended-label {
      color: var(--primary-color, #3f51b5);
    }

    .range-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(0, 0, 0, 0.38);
    }

    .infinity-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary-color, #3f51b5);
    }

    .period-hours {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .hours-per-day {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.75);
    }

    .hours-divider {
      color: rgba(0, 0, 0, 0.25);
    }

    /* Actions */
    .period-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .action-btn {
      color: rgba(0, 0, 0, 0.38);
    }

    .action-btn:hover:not([disabled]) {
      color: rgba(0, 0, 0, 0.7);
    }

    .delete-btn:hover:not([disabled]) {
      color: #d32f2f;
    }

    /* ── Dark theme ──────────────────────────────────────────── */
    :host-context(.dark-theme) .schedule-label {
      color: rgba(255, 255, 255, 0.4);
    }

    :host-context(.dark-theme) .period-list {
      border-color: rgba(255, 255, 255, 0.12);
    }

    :host-context(.dark-theme) .empty-state {
      color: rgba(255, 255, 255, 0.3);
    }

    :host-context(.dark-theme) .empty-hint {
      color: rgba(255, 255, 255, 0.2) !important;
    }

    :host-context(.dark-theme) .gap-warning {
      background: rgba(255, 152, 0, 0.12);
      border-bottom-color: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }

    :host-context(.dark-theme) .period-row {
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    :host-context(.dark-theme) .period-row:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    :host-context(.dark-theme) .period-date {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .range-arrow {
      color: rgba(255, 255, 255, 0.3);
    }

    :host-context(.dark-theme) .period-hours {
      color: rgba(255, 255, 255, 0.5);
    }

    :host-context(.dark-theme) .hours-per-day {
      color: rgba(255, 255, 255, 0.75);
    }

    :host-context(.dark-theme) .hours-divider {
      color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .action-btn {
      color: rgba(255, 255, 255, 0.3);
    }

    :host-context(.dark-theme) .action-btn:hover:not([disabled]) {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .delete-btn:hover:not([disabled]) {
      color: #ef5350;
    }
  `],
})
export class WorkHoursScheduleComponent {
  @Input() schedule: WorkHoursPeriod[] = [];
  /** Number of checked working days — used to compute the weekly hours summary. */
  @Input() workingDaysCount = 5;
  @Output() scheduleChange = new EventEmitter<WorkHoursPeriod[]>();

  constructor(private dialog: MatDialog) {}

  get sortedSchedule(): WorkHoursPeriod[] {
    return [...this.schedule].sort((a, b) => a.start_date.localeCompare(b.start_date));
  }

  /** Round to one decimal place to avoid floating-point display noise. */
  roundHalf(value: number): number {
    return Math.round(value * 10) / 10;
  }

  /** Format a YYYY-MM-DD string as a human-readable date (e.g. "01. Jan 2024"). */
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Returns true when there is a calendar gap between the previous period's
   * end date and this period's start date.
   */
  hasGapBefore(index: number): boolean {
    if (index === 0) return false;
    const prev = this.sortedSchedule[index - 1];
    if (!prev.end_date) return false; // open-ended covers everything after

    const prevEnd = new Date(prev.end_date + 'T00:00:00');
    const currStart = new Date(this.sortedSchedule[index].start_date + 'T00:00:00');

    // A gap exists when the day after prevEnd is still before currStart
    const dayAfterPrevEnd = new Date(prevEnd);
    dayAfterPrevEnd.setDate(dayAfterPrevEnd.getDate() + 1);
    return dayAfterPrevEnd < currStart;
  }

  addPeriod(): void {
    const data: WorkHoursPeriodDialogData = {
      period: null,
      existingPeriods: this.schedule,
      workingDaysCount: this.workingDaysCount,
    };

    this.dialog
      .open(WorkHoursPeriodDialogComponent, { width: '520px', data })
      .afterClosed()
      .subscribe((result: WorkHoursPeriod | null) => {
        if (result) {
          this.scheduleChange.emit([...this.schedule, result]);
        }
      });
  }

  editPeriod(period: WorkHoursPeriod): void {
    const data: WorkHoursPeriodDialogData = {
      period,
      existingPeriods: this.schedule,
      workingDaysCount: this.workingDaysCount,
    };

    this.dialog
      .open(WorkHoursPeriodDialogComponent, { width: '520px', data })
      .afterClosed()
      .subscribe((result: WorkHoursPeriod | null) => {
        if (result) {
          this.scheduleChange.emit(
            this.schedule.map(p => (p.id === result.id ? result : p)),
          );
        }
      });
  }

  deletePeriod(period: WorkHoursPeriod): void {
    if (this.schedule.length <= 1) return;
    this.scheduleChange.emit(this.schedule.filter(p => p.id !== period.id));
  }
}
