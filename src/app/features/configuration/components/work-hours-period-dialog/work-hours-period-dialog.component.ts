import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WorkHoursPeriod } from '../../../../core/models/config.model';

export interface WorkHoursPeriodDialogData {
  period: WorkHoursPeriod | null;       // null = add mode
  existingPeriods: WorkHoursPeriod[];   // for overlap validation
  workingDaysCount: number;             // for weekly hours preview
}

@Component({
  selector: 'app-work-hours-period-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>{{ isEditMode ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditMode ? 'Edit Period' : 'Add Working Hours Period' }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <!-- Date row -->
        <div class="date-row">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>From</mat-label>
            <input
              matInput
              [matDatepicker]="startPicker"
              [(ngModel)]="startDateObj"
              (ngModelChange)="validate()"
              placeholder="Start date"
            />
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <div class="date-separator">
            <mat-icon>arrow_forward</mat-icon>
          </div>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>To</mat-label>
            <input
              matInput
              [matDatepicker]="endPicker"
              [(ngModel)]="endDateObj"
              (ngModelChange)="validate()"
              [disabled]="openEnded"
              [min]="startDateObj ?? undefined"
              placeholder="End date"
            />
            <mat-datepicker-toggle matSuffix [for]="endPicker" [disabled]="openEnded"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <!-- Open-ended toggle -->
        <div class="open-ended-toggle">
          <mat-slide-toggle
            [(ngModel)]="openEnded"
            (change)="onOpenEndedChange()"
            color="primary">
            Open-ended (no end date)
          </mat-slide-toggle>
        </div>

        <!-- Hours input -->
        <mat-form-field appearance="outline" class="hours-field">
          <mat-label>Hours per working day</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="dailyHours"
            (ngModelChange)="validate()"
            min="0.5"
            max="24"
            step="0.5"
          />
          <mat-icon matSuffix>schedule</mat-icon>
          <mat-hint>Between 0.5 and 24 hours</mat-hint>
        </mat-form-field>

        <!-- Weekly summary chip -->
        <div class="weekly-summary" *ngIf="data.workingDaysCount > 0">
          <mat-icon>info_outline</mat-icon>
          <span>
            {{ dailyHours }}h &times; {{ data.workingDaysCount }}
            {{ data.workingDaysCount === 1 ? 'working day' : 'working days' }}
            = <strong>{{ weeklyHours }}h / week</strong>
          </span>
        </div>

        <!-- Validation error -->
        <div class="validation-error" *ngIf="validationError">
          <mat-icon>error_outline</mat-icon>
          <span>{{ validationError }}</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="cancel()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          (click)="save()"
          [disabled]="!isValid">
          {{ isEditMode ? 'Save Changes' : 'Add Period' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      min-width: 480px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      padding: 20px 24px 8px;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .dialog-title mat-icon {
      color: var(--primary-color);
    }

    .dialog-content {
      padding: 8px 24px 16px !important;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .date-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-field {
      flex: 1;
    }

    .date-separator {
      display: flex;
      align-items: center;
      padding-bottom: 20px;
      color: rgba(0, 0, 0, 0.38);
    }

    .open-ended-toggle {
      margin: -4px 0 4px;
    }

    .hours-field {
      width: 100%;
    }

    .weekly-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(var(--primary-rgb, 63, 81, 181), 0.08);
      border-radius: 8px;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.7);
    }

    .weekly-summary mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .weekly-summary strong {
      color: rgba(0, 0, 0, 0.87);
    }

    .validation-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(211, 47, 47, 0.08);
      border-radius: 8px;
      font-size: 0.875rem;
      color: #d32f2f;
    }

    .validation-error mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .dialog-actions {
      padding: 8px 24px 20px !important;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Dark theme */
    :host-context(.dark-theme) .date-separator {
      color: rgba(255, 255, 255, 0.38);
    }

    :host-context(.dark-theme) .weekly-summary {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .weekly-summary strong {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .validation-error {
      background: rgba(239, 83, 80, 0.12);
      color: #ef5350;
    }
  `],
})
export class WorkHoursPeriodDialogComponent implements OnInit {
  isEditMode: boolean;

  startDateObj: Date | null = null;
  endDateObj: Date | null = null;
  openEnded = false;
  dailyHours = 8;

  validationError: string | null = null;

  get weeklyHours(): number {
    return Math.round(this.dailyHours * this.data.workingDaysCount * 10) / 10;
  }

  get isValid(): boolean {
    if (!this.startDateObj) return false;
    if (!this.openEnded && !this.endDateObj) return false;
    if (this.dailyHours < 0.5 || this.dailyHours > 24) return false;
    return !this.validationError;
  }

  constructor(
    public dialogRef: MatDialogRef<WorkHoursPeriodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkHoursPeriodDialogData,
  ) {
    this.isEditMode = !!data.period;
  }

  ngOnInit(): void {
    if (this.data.period) {
      // Edit mode — pre-fill from existing period
      this.startDateObj = new Date(this.data.period.start_date + 'T00:00:00');
      this.openEnded = !this.data.period.end_date;
      this.endDateObj = this.data.period.end_date
        ? new Date(this.data.period.end_date + 'T00:00:00')
        : null;
      this.dailyHours = this.data.period.daily_hours;
    } else {
      // Add mode — default open-ended only when no other open-ended period exists
      const hasOpenEnded = this.data.existingPeriods.some(p => !p.end_date);
      this.openEnded = !hasOpenEnded;
    }
  }

  onOpenEndedChange(): void {
    if (this.openEnded) {
      this.endDateObj = null;
    }
    this.validate();
  }

  validate(): void {
    this.validationError = null;

    if (!this.startDateObj) return;

    const start = this.startDateObj;
    const end = this.openEnded ? null : this.endDateObj;

    // Start must be before end (for bounded periods)
    if (!this.openEnded && end && start >= end) {
      this.validationError = 'End date must be after start date.';
      return;
    }

    // Only one open-ended period may exist
    if (this.openEnded) {
      const selfId = this.data.period?.id;
      const others = this.data.existingPeriods.filter(p => p.id !== selfId);
      if (others.some(p => !p.end_date)) {
        this.validationError = 'Only one open-ended period is allowed.';
        return;
      }
    }

    // Check for overlap with all other periods
    const selfId = this.data.period?.id;
    const others = this.data.existingPeriods.filter(p => p.id !== selfId);

    for (const other of others) {
      const otherStart = new Date(other.start_date + 'T00:00:00');
      const otherEnd = other.end_date ? new Date(other.end_date + 'T00:00:00') : null;

      if (this.periodsOverlap(start, end, otherStart, otherEnd)) {
        this.validationError = 'This period overlaps with an existing period.';
        return;
      }
    }
  }

  /**
   * Inclusive-end overlap check.
   * Two periods [aStart, aEnd] and [bStart, bEnd] overlap when aStart ≤ bEnd and bStart ≤ aEnd.
   * null end = open (treated as +Infinity).
   */
  private periodsOverlap(
    aStart: Date, aEnd: Date | null,
    bStart: Date, bEnd: Date | null,
  ): boolean {
    const aStartMs = aStart.getTime();
    const aEndMs = aEnd ? aEnd.getTime() : Infinity;
    const bStartMs = bStart.getTime();
    const bEndMs = bEnd ? bEnd.getTime() : Infinity;
    return aStartMs <= bEndMs && bStartMs <= aEndMs;
  }

  private dateToString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  save(): void {
    this.validate();
    if (!this.isValid || !this.startDateObj) return;

    const period: WorkHoursPeriod = {
      id: this.data.period?.id ?? crypto.randomUUID(),
      start_date: this.dateToString(this.startDateObj),
      end_date: (!this.openEnded && this.endDateObj)
        ? this.dateToString(this.endDateObj)
        : null,
      daily_hours: this.dailyHours,
    };

    this.dialogRef.close(period);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
