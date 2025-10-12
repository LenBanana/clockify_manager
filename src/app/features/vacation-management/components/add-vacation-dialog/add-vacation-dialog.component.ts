import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HolidayService } from '../../../../core/services/holiday.service';
import { VacationDayType, getVacationDayTypeDescription } from '../../../../core/models/holiday.model';

export interface AddVacationDialogData {
  mode: 'add' | 'edit' | 'edit-range';
  date?: Date;
  endDate?: Date;
  dayType?: VacationDayType;
  description?: string;
  workedHours?: number;
  billable?: boolean;
  rangeId?: string;
}

/**
 * Dialog component for adding or editing vacation days
 * Supports single dates and date ranges
 */
@Component({
  selector: 'app-add-vacation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>event</mat-icon>
      {{ data.mode === 'add' ? 'Add Vacation Day' : (data.mode === 'edit-range' ? 'Edit Vacation Range' : 'Edit Vacation Day') }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="vacation-form">
        <!-- Date Selection -->
        <mat-form-field class="full-width">
          <mat-label>{{ data.mode === 'edit-range' ? 'Start Date' : 'Date' }}</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" required>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="form.get('date')?.hasError('required')">
            Date is required
          </mat-error>
        </mat-form-field>

        <!-- Date Range (Optional) - Only for Add mode -->
        <div class="date-range-toggle" *ngIf="data.mode === 'add'">
          <mat-checkbox [(ngModel)]="useRange" [ngModelOptions]="{standalone: true}">
            Add date range
          </mat-checkbox>
        </div>

        <mat-form-field *ngIf="(useRange && data.mode === 'add') || data.mode === 'edit-range'" class="full-width">
          <mat-label>End Date</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate">
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
          <mat-hint *ngIf="data.mode === 'add'">Leave empty for single day</mat-hint>
          <mat-hint *ngIf="data.mode === 'edit-range'">Change to extend or shrink the range</mat-hint>
        </mat-form-field>

        <!-- Vacation Type -->
        <mat-form-field class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="dayType" required>
            <mat-option value="Vacation">
              <mat-icon>beach_access</mat-icon>
              Vacation
            </mat-option>
            <mat-option value="SickDay">
              <mat-icon>medication</mat-icon>
              Sick Day
            </mat-option>
            <mat-option value="PersonalDay">
              <mat-icon>person</mat-icon>
              Personal Day
            </mat-option>
            <mat-option value="Training">
              <mat-icon>school</mat-icon>
              Training
            </mat-option>
            <mat-option value="BusinessTrip">
              <mat-icon>flight</mat-icon>
              Business Trip
            </mat-option>
            <mat-option value="Saldo">
              <mat-icon>account_balance</mat-icon>
              Saldo
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('dayType')?.hasError('required')">
            Type is required
          </mat-error>
          <mat-hint *ngIf="form.get('dayType')?.value" class="type-description">
            {{ getTypeDescription(form.get('dayType')?.value) }}
          </mat-hint>
        </mat-form-field>

        <!-- Worked Hours (Only for BusinessTrip) -->
        <mat-form-field *ngIf="form.get('dayType')?.value === 'BusinessTrip'" class="full-width worked-hours-field">
          <mat-label>Hours Worked</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="workedHours" 
            placeholder="e.g., 9.5"
            step="0.5"
            min="0"
            max="24">
          <mat-hint>Enter the number of hours worked on this business trip day</mat-hint>
          <mat-error *ngIf="form.get('workedHours')?.hasError('required')">
            Hours worked is required for business trips
          </mat-error>
          <mat-error *ngIf="form.get('workedHours')?.hasError('min')">
            Hours must be at least 0
          </mat-error>
          <mat-error *ngIf="form.get('workedHours')?.hasError('max')">
            Hours cannot exceed 24
          </mat-error>
        </mat-form-field>

        <!-- Billable (Only for BusinessTrip) -->
        <div *ngIf="form.get('dayType')?.value === 'BusinessTrip'" class="billable-checkbox">
          <mat-checkbox formControlName="billable">
            Billable to customer
          </mat-checkbox>
          <mat-hint class="billable-hint">Check if this business trip was billable to a customer</mat-hint>
        </div>

        <!-- Description -->
        <mat-form-field class="full-width description-field">
          <mat-label>Description (Optional)</mat-label>
          <textarea 
            matInput 
            formControlName="description" 
            rows="3"
            placeholder="Add a note about this day off..."></textarea>
          <mat-hint>E.g., "Annual family vacation", "Doctor appointment"</mat-hint>
        </mat-form-field>

        <!-- Quick Presets - Only for Add mode -->
        <div class="quick-presets" *ngIf="data.mode === 'add'">
          <p class="preset-label">Quick Presets:</p>
          <div class="preset-buttons">
            <button mat-button type="button" (click)="setPreset('tomorrow')">Tomorrow</button>
            <button mat-button type="button" (click)="setPreset('nextWeek')">Next Week</button>
            <button mat-button type="button" (click)="setPreset('nextMonth')">Next Month</button>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSave()" 
        [disabled]="!form.valid || saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-md);
    }

    mat-dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .vacation-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .full-width {
      width: 100%;
    }

    .date-range-toggle {
      margin: calc(var(--spacing-sm) * -1) 0 var(--spacing-sm) 0;
    }

    mat-option {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    mat-option mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .type-description {
      font-size: 0.75rem;
      line-height: 1.4;
      color: var(--text-secondary, rgba(0,0,0,0.6));
      font-style: italic;
      display: block;
    }

    .worked-hours-field {
      margin-top: var(--spacing-md) !important;
    }

    .billable-checkbox {
      margin-top: var(--spacing-sm);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .billable-hint {
      font-size: 0.75rem;
      color: var(--text-secondary, rgba(0,0,0,0.6));
      margin-left: 32px; /* Align with checkbox label */
    }

    .description-field {
      margin-top: var(--spacing-md) !important;
    }

    .quick-presets {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    }

    .preset-label {
      font-size: 0.875rem;
      margin: 0 0 var(--spacing-xs) 0;
    }

    .preset-buttons {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }

    @media (max-width: 500px) {
      mat-dialog-content {
        min-width: 300px;
      }
    }
  `]
})
export class AddVacationDialogComponent implements OnInit {
  form: FormGroup;
  useRange = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddVacationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddVacationDialogData,
    private holidayService: HolidayService,
    private snackBar: MatSnackBar
  ) {
    // Set useRange based on mode and data
    if (this.data.mode === 'edit-range' && this.data.endDate) {
      this.useRange = true;
    }

    this.form = this.fb.group({
      date: [data.date || new Date(), Validators.required],
      endDate: [data.endDate || null],
      dayType: [data.dayType || 'Vacation' as VacationDayType, Validators.required],
      description: [data.description || ''],
      workedHours: [data.workedHours || null, [Validators.min(0), Validators.max(24)]],
      billable: [data.billable || false]
    });

    // Add conditional validation for workedHours when BusinessTrip is selected
    this.form.get('dayType')?.valueChanges.subscribe(dayType => {
      const workedHoursControl = this.form.get('workedHours');
      if (dayType === 'BusinessTrip') {
        workedHoursControl?.setValidators([Validators.required, Validators.min(0), Validators.max(24)]);
      } else {
        workedHoursControl?.setValidators([Validators.min(0), Validators.max(24)]);
      }
      workedHoursControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    // useRange is already set in constructor for edit-range mode
    // Form is already initialized with data in constructor
    // Nothing additional needed here
  }

  setPreset(preset: 'tomorrow' | 'nextWeek' | 'nextMonth'): void {
    const today = new Date();
    let date: Date;

    switch (preset) {
      case 'tomorrow':
        date = new Date(today);
        date.setDate(date.getDate() + 1);
        this.form.patchValue({ date });
        break;

      case 'nextWeek':
        date = new Date(today);
        // Find next Monday
        const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
        date.setDate(date.getDate() + daysUntilMonday);
        const friday = new Date(date);
        friday.setDate(friday.getDate() + 4);
        this.useRange = true;
        this.form.patchValue({ 
          date,
          endDate: friday
        });
        break;

      case 'nextMonth':
        date = new Date(today);
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        this.form.patchValue({ date });
        break;
    }
  }

  onSave(): void {
    if (!this.form.valid) return;

    this.saving = true;
    const formValue = this.form.value;

    if (this.data.mode === 'edit') {
      // For edit mode: delete old and add new (only single date)
      const oldDate = this.data.date!;
      const newDate = formValue.date;
      const oldDateStr = oldDate.toISOString().split('T')[0];
      const newDateStr = newDate.toISOString().split('T')[0];

      // If date hasn't changed, just update type/description
      if (oldDateStr === newDateStr) {
        // Delete and re-add with new data
        this.holidayService.deleteVacationDay(oldDateStr).subscribe({
          next: () => {
            this.holidayService.addVacationDay(
              newDateStr,
              formValue.dayType,
              formValue.description || undefined,
              formValue.workedHours || undefined,
              formValue.billable || undefined
            ).subscribe({
              next: () => {
                this.saving = false;
                this.snackBar.open('Vacation day updated successfully', 'Close', { duration: 3000 });
                this.dialogRef.close(true);
              },
              error: (error) => {
                console.error('Error updating vacation day:', error);
                this.saving = false;
                this.snackBar.open('Failed to update vacation day', 'Close', { duration: 3000 });
              }
            });
          },
          error: (error) => {
            console.error('Error deleting old vacation day:', error);
            this.saving = false;
            this.snackBar.open('Failed to update vacation day', 'Close', { duration: 3000 });
          }
        });
      } else {
        // Date changed: delete old and add new
        this.holidayService.deleteVacationDay(oldDateStr).subscribe({
          next: () => {
            this.holidayService.addVacationDay(
              newDateStr,
              formValue.dayType,
              formValue.description || undefined,
              formValue.workedHours || undefined,
              formValue.billable || undefined
            ).subscribe({
              next: () => {
                this.saving = false;
                this.snackBar.open('Vacation day moved successfully', 'Close', { duration: 3000 });
                this.dialogRef.close(true);
              },
              error: (error) => {
                console.error('Error adding new vacation day:', error);
                this.saving = false;
                this.snackBar.open('Failed to move vacation day', 'Close', { duration: 3000 });
              }
            });
          },
          error: (error) => {
            console.error('Error deleting old vacation day:', error);
            this.saving = false;
            this.snackBar.open('Failed to move vacation day', 'Close', { duration: 3000 });
          }
        });
      }
    } else if (this.data.mode === 'edit-range') {
      // Edit-range mode: delete old range and create new one
      const rangeId = this.data.rangeId!;
      const startDate = formValue.date;
      const endDate = formValue.endDate ? formValue.endDate : startDate;

      // Generate array of dates to add
      const dates: Date[] = [];
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // Delete old range then add new one
      this.holidayService.deleteVacationRange(rangeId).subscribe({
        next: () => {
          const vacationDays = dates.map(date => ({
            date,
            dayType: formValue.dayType,
            description: formValue.description || undefined,
            workedHours: formValue.workedHours || undefined,
            billable: formValue.billable || undefined
          }));

          this.holidayService.addVacationDays(vacationDays).subscribe({
            next: () => {
              this.saving = false;
              this.snackBar.open('Vacation range updated successfully', 'Close', { duration: 3000 });
              this.dialogRef.close(true);
            },
            error: (error) => {
              console.error('Error updating vacation range:', error);
              this.saving = false;
              this.snackBar.open('Failed to update vacation range', 'Close', { duration: 3000 });
            }
          });
        },
        error: (error) => {
          console.error('Error deleting old vacation range:', error);
          this.saving = false;
          this.snackBar.open('Failed to update vacation range', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Add mode: original logic
      const startDate = formValue.date;
      const endDate = this.useRange && formValue.endDate ? formValue.endDate : startDate;

      // Generate array of dates to add
      const dates: Date[] = [];
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // Add vacation days
      const vacationDays = dates.map(date => ({
        date,
        dayType: formValue.dayType,
        description: formValue.description || undefined,
        workedHours: formValue.workedHours || undefined,
        billable: formValue.billable || undefined
      }));

      this.holidayService.addVacationDays(vacationDays).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open(
            `Added ${dates.length} vacation ${dates.length === 1 ? 'day' : 'days'}`,
            'Close',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error adding vacation days:', error);
          this.saving = false;
          this.snackBar.open('Failed to add vacation days', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getTypeDescription(dayType: VacationDayType): string {
    return getVacationDayTypeDescription(dayType);
  }
}
