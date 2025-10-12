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
      </p>

      <form [formGroup]="workSettingsForm" class="settings-form">
        <div class="form-section">
          <h4>Daily Hours</h4>
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

          <mat-form-field appearance="outline">
            <mat-label>Hours per Week</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="weeklyHours"
              min="1"
              max="168"
            />
            <mat-icon matSuffix>date_range</mat-icon>
            <mat-hint>Typically 40 hours for full-time</mat-hint>
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

        <div class="form-section">
          <h4>Break Settings</h4>
          <mat-slide-toggle formControlName="includeBreaks">
            Include breaks in calculation
          </mat-slide-toggle>

          <mat-form-field appearance="outline" *ngIf="workSettingsForm.get('includeBreaks')?.value">
            <mat-label>Break Duration (minutes)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="breakDuration"
              min="0"
              max="240"
            />
            <mat-icon matSuffix>free_breakfast</mat-icon>
            <mat-hint>Typically 30-60 minutes</mat-hint>
          </mat-form-field>
        </div>

        <div class="summary-card" *ngIf="workSettingsForm.valid">
          <mat-icon>info</mat-icon>
          <div class="summary-content">
            <strong>Summary:</strong> You work {{workSettingsForm.get('dailyHours')?.value}} hours per day,
            {{ getSelectedDaysCount() }} days per week.
            <span *ngIf="workSettingsForm.get('includeBreaks')?.value">
              Breaks of {{workSettingsForm.get('breakDuration')?.value}} minutes are included.
            </span>
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

    mat-slide-toggle {
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
      weeklyHours: [40, [Validators.required, Validators.min(1), Validators.max(168)]],
      monday: [true],
      tuesday: [true],
      wednesday: [true],
      thursday: [true],
      friday: [true],
      saturday: [false],
      sunday: [false],
      includeBreaks: [true],
      breakDuration: [30, [Validators.min(0), Validators.max(240)]],
    });

    // Emit changes
    this.workSettingsForm.valueChanges.subscribe(() => {
      if (this.workSettingsForm.valid) {
        this.settingsUpdated.emit(this.getWorkSettings());
      }
    });
  }

  ngOnInit(): void {
    // Pre-fill from existing config if available
    const config = this.configService.getCurrentConfig();
    if (config.work_settings) {
      const settings = config.work_settings;
      this.workSettingsForm.patchValue({
        dailyHours: settings.daily_hours,
        weeklyHours: settings.weekly_hours,
        monday: settings.working_days.includes('monday'),
        tuesday: settings.working_days.includes('tuesday'),
        wednesday: settings.working_days.includes('wednesday'),
        thursday: settings.working_days.includes('thursday'),
        friday: settings.working_days.includes('friday'),
        saturday: settings.working_days.includes('saturday'),
        sunday: settings.working_days.includes('sunday'),
        includeBreaks: settings.include_breaks,
        breakDuration: settings.break_duration_minutes,
      });
    }
  }

  getWorkSettings(): WorkSettings {
    const formValue = this.workSettingsForm.value;
    const working_days: string[] = [];

    if (formValue.monday) working_days.push('monday');
    if (formValue.tuesday) working_days.push('tuesday');
    if (formValue.wednesday) working_days.push('wednesday');
    if (formValue.thursday) working_days.push('thursday');
    if (formValue.friday) working_days.push('friday');
    if (formValue.saturday) working_days.push('saturday');
    if (formValue.sunday) working_days.push('sunday');

    return {
      daily_hours: formValue.dailyHours,
      weekly_hours: formValue.weeklyHours,
      working_days,
      include_breaks: formValue.includeBreaks,
      break_duration_minutes: formValue.breakDuration,
    };
  }

  getSelectedDaysCount(): number {
    const formValue = this.workSettingsForm.value;
    return [
      formValue.monday,
      formValue.tuesday,
      formValue.wednesday,
      formValue.thursday,
      formValue.friday,
      formValue.saturday,
      formValue.sunday,
    ].filter(Boolean).length;
  }

  get isValid(): boolean {
    return this.workSettingsForm.valid && this.getSelectedDaysCount() > 0;
  }
}
