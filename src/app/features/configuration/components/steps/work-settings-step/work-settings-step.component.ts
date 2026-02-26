import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { ConfigService } from '../../../../../core/services/config.service';
import { WorkSettings } from '../../../../../core/models/config.model';

@Component({
  selector: 'app-work-settings-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  template: `
    <div class="work-settings-container">
      <h3>Configure Work Settings</h3>
      <p class="step-description">
        Set your daily work hours and working days for accurate overtime calculation.
        You can add more periods with different hours later in Settings.
      </p>

      <form [formGroup]="workSettingsForm" class="settings-form">
        <div class="form-section">
          <h4>Hours per Day</h4>
          <mat-form-field appearance="outline">
            <mat-label>Hours per Day</mat-label>
            <input
              matInput
              type="number"
              formControlName="dailyHours"
              min="1"
              max="24"
              step="0.5"
            />
            <mat-icon matSuffix>schedule</mat-icon>
            <mat-hint>Typically 8 hours for full-time employees</mat-hint>
            <mat-error *ngIf="workSettingsForm.get('dailyHours')?.hasError('required')">
              Daily hours is required
            </mat-error>
            <mat-error *ngIf="workSettingsForm.get('dailyHours')?.hasError('min')">
              Must be at least 1 hour
            </mat-error>
            <mat-error *ngIf="workSettingsForm.get('dailyHours')?.hasError('max')">
              Cannot exceed 24 hours
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-section">
          <h4>Working Days</h4>
          <p class="section-hint">Select the days you normally work</p>
          <div class="checkbox-group">
            <mat-checkbox formControlName="monday">Monday</mat-checkbox>
            <mat-checkbox formControlName="tuesday">Tuesday</mat-checkbox>
            <mat-checkbox formControlName="wednesday">Wednesday</mat-checkbox>
            <mat-checkbox formControlName="thursday">Thursday</mat-checkbox>
            <mat-checkbox formControlName="friday">Friday</mat-checkbox>
            <mat-checkbox formControlName="saturday">Saturday</mat-checkbox>
            <mat-checkbox formControlName="sunday">Sunday</mat-checkbox>
          </div>
        </div>

        <div class="summary-card" *ngIf="workSettingsForm.valid && getSelectedDaysCount() > 0">
          <mat-icon>info</mat-icon>
          <div class="summary-content">
            <strong>Summary:</strong>
            {{ workSettingsForm.get('dailyHours')?.value }}h/day &times;
            {{ getSelectedDaysCount() }} {{ getSelectedDaysCount() === 1 ? 'day' : 'days' }}/week
            = <strong>{{ weeklyTotal }}h/week</strong>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .work-settings-container {
      max-width: 700px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    h3 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    .step-description {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: var(--spacing-lg);
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .form-section {
      padding: var(--spacing-md);
      background-color: #f5f5f5;
      border-radius: var(--border-radius-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .form-section h4 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    mat-form-field {
      margin-bottom: var(--spacing-md);
    }

    .section-hint {
      margin: 0 0 var(--spacing-sm) 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: var(--font-size-sm);
    }

    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--spacing-sm);
    }

    .summary-card {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: #e3f2fd;
      border-left: 4px solid var(--info-color);
      border-radius: var(--border-radius-sm);
      align-items: flex-start;
    }

    .summary-card mat-icon {
      color: var(--info-color);
      flex-shrink: 0;
    }

    .summary-content {
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.8);
    }

    :host-context(.dark-theme) h3,
    :host-context(.dark-theme) .form-section h4 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .step-description,
    :host-context(.dark-theme) .section-hint {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .form-section {
      background-color: #424242;
    }

    :host-context(.dark-theme) .summary-card {
      background-color: #1e3a5f;
    }

    :host-context(.dark-theme) .summary-content {
      color: rgba(255, 255, 255, 0.8);
    }
  `]
})
export class WorkSettingsStepComponent implements OnInit {
  @Output() settingsUpdated = new EventEmitter<WorkSettings>();

  workSettingsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService
  ) {
    this.workSettingsForm = this.fb.group({
      dailyHours: [8, [Validators.required, Validators.min(1), Validators.max(24)]],
      monday:    [true],
      tuesday:   [true],
      wednesday: [true],
      thursday:  [true],
      friday:    [true],
      saturday:  [false],
      sunday:    [false],
      includeBreaks:  [true],
      breakDuration:  [30, [Validators.min(0), Validators.max(240)]],
    });

    this.workSettingsForm.valueChanges.subscribe(() => {
      if (this.workSettingsForm.valid) {
        this.settingsUpdated.emit(this.getWorkSettings());
      }
    });
  }

  ngOnInit(): void {
    const config = this.configService.getCurrentConfig();
    if (config.work_settings) {
      const s = config.work_settings;
      // Use the first period's daily_hours if a schedule exists, otherwise fall back
      const dailyHours = s.work_hours_schedule?.length
        ? s.work_hours_schedule[0].daily_hours
        : s.daily_hours;

      this.workSettingsForm.patchValue({
        dailyHours,
        monday:    s.working_days.includes('monday'),
        tuesday:   s.working_days.includes('tuesday'),
        wednesday: s.working_days.includes('wednesday'),
        thursday:  s.working_days.includes('thursday'),
        friday:    s.working_days.includes('friday'),
        saturday:  s.working_days.includes('saturday'),
        sunday:    s.working_days.includes('sunday'),
        includeBreaks: s.include_breaks,
        breakDuration: s.break_duration_minutes,
      });
    }
  }

  getWorkSettings(): WorkSettings {
    const v = this.workSettingsForm.value;
    const working_days: string[] = [];
    if (v.monday)    working_days.push('monday');
    if (v.tuesday)   working_days.push('tuesday');
    if (v.wednesday) working_days.push('wednesday');
    if (v.thursday)  working_days.push('thursday');
    if (v.friday)    working_days.push('friday');
    if (v.saturday)  working_days.push('saturday');
    if (v.sunday)    working_days.push('sunday');

    return {
      daily_hours: v.dailyHours,
      working_days,
      include_breaks: v.includeBreaks,
      break_duration_minutes: v.breakDuration,
      // Create the initial open-ended period from the wizard value.
      // The user can refine their schedule later in Settings.
      work_hours_schedule: [{
        id: crypto.randomUUID(),
        start_date: '2020-01-01',
        end_date: null,
        daily_hours: v.dailyHours,
      }],
      overtime_payoffs: [],
    };
  }

  getSelectedDaysCount(): number {
    const v = this.workSettingsForm.value;
    return [v.monday, v.tuesday, v.wednesday, v.thursday, v.friday, v.saturday, v.sunday]
      .filter(Boolean).length;
  }

  get weeklyTotal(): number {
    const daily = this.workSettingsForm.get('dailyHours')?.value ?? 0;
    return Math.round(daily * this.getSelectedDaysCount() * 10) / 10;
  }

  get isValid(): boolean {
    return this.workSettingsForm.valid && this.getSelectedDaysCount() > 0;
  }
}
