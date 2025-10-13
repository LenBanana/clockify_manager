import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ConfigService } from '../../../../core/services/config.service';

export interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

type DateRangePreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'sinceEntry' | 'custom';

interface PresetOption {
  value: DateRangePreset;
  label: string;
  durationDays: number;
}

/**
 * Date range selector with preset options and custom date picker
 */
@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <div class="date-range-selector">
      <div class="selector-header">
        <mat-icon>date_range</mat-icon>
        <span class="selector-label">Select Period:</span>
      </div>

      <!-- Preset Buttons -->
      <mat-button-toggle-group
        [value]="selectedPreset"
        (change)="onPresetChange($event.value)"
        class="preset-buttons"
      >
        <mat-button-toggle 
          *ngFor="let option of availablePresets" 
          [value]="option.value"
        >
          {{ option.label }}
        </mat-button-toggle>
      </mat-button-toggle-group>

      <!-- Custom Date Range Picker -->
      <div *ngIf="selectedPreset === 'custom'" class="custom-range">
        <mat-form-field appearance="outline">
          <mat-label>Start Date</mat-label>
          <input
            matInput
            [matDatepicker]="startPicker"
            [(ngModel)]="customStartDate"
            (dateChange)="onCustomDateChange()"
            placeholder="Select start date"
          />
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>End Date</mat-label>
          <input
            matInput
            [matDatepicker]="endPicker"
            [(ngModel)]="customEndDate"
            (dateChange)="onCustomDateChange()"
            placeholder="Select end date"
          />
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>
      </div>

      <!-- Selected Range Display -->
      <div class="selected-range">
        <span class="range-label">Selected Period:</span>
        <strong>{{ getDisplayRange() }}</strong>
      </div>
    </div>
  `,
  styles: [`
    .date-range-selector {
      background: #f7f2fa;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #e0e0e0;
    }

    :host-context(.dark-theme) .date-range-selector {
      background: #1d1b20;
      border-color: #424242;
    }

    .selector-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .selector-header mat-icon {
      color: #6750a4;
    }

    :host-context(.dark-theme) .selector-header mat-icon {
      color: #d0bcff;
    }

    .selector-label {
      font-size: 16px;
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .selector-label {
      color: #e6e1e5;
    }

    .preset-buttons {
      width: 100%;
      margin-bottom: 16px;
      display: flex;
      box-shadow: none;
      border: 1px solid #cac4d0;
      border-radius: 8px;
      overflow: hidden;
    }

    :host-context(.dark-theme) .preset-buttons {
      border-color: #5f5f5f;
    }

    ::ng-deep .preset-buttons .mat-button-toggle {
      flex: 1;
      border: none;
      background-color: transparent;
      color: #1c1b1f;
    }

    ::ng-deep :host-context(.dark-theme) .preset-buttons .mat-button-toggle {
      color: #e6e1e5;
      background-color: transparent;
    }

    ::ng-deep .preset-buttons .mat-button-toggle-checked {
      background-color: #e8def8;
      color: #21005d;
    }

    ::ng-deep :host-context(.dark-theme) .preset-buttons .mat-button-toggle-checked {
      background-color: #4a4458;
      color: #e8def8;
    }

    ::ng-deep .preset-buttons .mat-button-toggle:hover:not(.mat-button-toggle-checked) {
      background-color: rgba(103, 80, 164, 0.08);
    }

    ::ng-deep :host-context(.dark-theme) .preset-buttons .mat-button-toggle:hover:not(.mat-button-toggle-checked) {
      background-color: rgba(208, 188, 255, 0.08);
    }

    ::ng-deep .preset-buttons .mat-button-toggle-button {
      padding: 12px 16px;
      font-size: 14px;
    }

    .custom-range {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .custom-range mat-form-field {
      flex: 1;
    }

    ::ng-deep :host-context(.dark-theme) .custom-range .mat-mdc-form-field {
      background-color: transparent;
    }

    ::ng-deep :host-context(.dark-theme) .custom-range .mat-mdc-text-field-wrapper {
      background-color: #2e2e2e;
    }

    ::ng-deep :host-context(.dark-theme) .custom-range .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    ::ng-deep :host-context(.dark-theme) .custom-range .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    ::ng-deep :host-context(.dark-theme) .custom-range .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: #5f5f5f;
    }

    ::ng-deep :host-context(.dark-theme) .custom-range .mat-mdc-form-field-focus-overlay {
      background-color: transparent;
    }

    .selected-range {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f3edf7;
      border-radius: 8px;
      margin-top: 16px;
      border: 1px solid #e0e0e0;
    }

    :host-context(.dark-theme) .selected-range {
      background: #211f26;
      border-color: #424242;
    }

    .range-label {
      color: #49454f;
      font-size: 14px;
    }

    :host-context(.dark-theme) .range-label {
      color: #cac4d0;
    }

    .selected-range strong {
      color: #6750a4;
      font-size: 14px;
    }

    :host-context(.dark-theme) .selected-range strong {
      color: #d0bcff;
    }

    @media (max-width: 768px) {
      .preset-buttons {
        flex-direction: column;
      }

      .custom-range {
        flex-direction: column;
      }
    }
  `],
})
export class DateRangeSelectorComponent implements OnInit {
  @Output() dateRangeChanged = new EventEmitter<DateRange>();

  selectedPreset: DateRangePreset = 'thisMonth';
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;

  currentStartDate: string = '';
  currentEndDate: string = '';
  
  availablePresets: PresetOption[] = [];

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // Build available presets based on configuration
    this.buildAvailablePresets();
    
    // Initialize with first preset (shortest period)
    if (this.availablePresets.length > 0) {
      this.onPresetChange(this.availablePresets[0].value);
    }
  }

  /**
   * Build and sort available preset options by duration
   */
  private buildAvailablePresets(): void {
    const today = new Date();
    const config = this.configService.getCurrentConfig();
    const entryDate = config.work_settings.entry_date;
    
    const presets: PresetOption[] = [];
    
    // This Month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthDays = this.calculateDaysBetween(thisMonthStart, today);
    presets.push({
      value: 'thisMonth',
      label: 'This Month',
      durationDays: thisMonthDays
    });
    
    // Last Month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastMonthDays = this.calculateDaysBetween(lastMonthStart, lastMonthEnd);
    presets.push({
      value: 'lastMonth',
      label: 'Last Month',
      durationDays: lastMonthDays
    });
    
    // This Year
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    const thisYearDays = this.calculateDaysBetween(thisYearStart, today);
    presets.push({
      value: 'thisYear',
      label: 'This Year',
      durationDays: thisYearDays
    });
    
    // Since Entry (only if entry date is configured)
    if (entryDate) {
      const entryDateObj = new Date(entryDate);
      const sinceEntryDays = this.calculateDaysBetween(entryDateObj, today);
      presets.push({
        value: 'sinceEntry',
        label: 'Since Entry',
        durationDays: sinceEntryDays
      });
    }
    
    // Sort by duration (shortest to longest)
    presets.sort((a, b) => a.durationDays - b.durationDays);
    
    // Always add Custom last
    presets.push({
      value: 'custom',
      label: 'Custom',
      durationDays: Infinity // Always last
    });
    
    this.availablePresets = presets;
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(start: Date, end: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / msPerDay);
  }

  onPresetChange(preset: DateRangePreset): void {
    this.selectedPreset = preset;

    const today = new Date();
    const currentHour = today.getHours();
    const config = this.configService.getCurrentConfig();
    
    // If it's before 6 PM (18:00), use yesterday as the end date for "current" periods
    // This prevents showing negative hours when viewing early in the day
    const shouldUseYesterday = currentHour < 18;
    const effectiveEndDate = shouldUseYesterday ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
    
    let startDate: Date;
    let endDate: Date;

    switch (preset) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = effectiveEndDate;
        break;

      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = effectiveEndDate;
        break;

      case 'sinceEntry':
        const entryDate = config.work_settings.entry_date;
        if (entryDate) {
          startDate = new Date(entryDate);
          endDate = effectiveEndDate;
        } else {
          // Fallback to this month if entry date not set
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = effectiveEndDate;
        }
        break;

      case 'custom':
        // Don't emit until user selects dates
        return;

      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = effectiveEndDate;
    }

    this.currentStartDate = this.formatDate(startDate);
    this.currentEndDate = this.formatDate(endDate);
    this.emitDateRange();
  }

  onCustomDateChange(): void {
    if (this.customStartDate && this.customEndDate) {
      this.currentStartDate = this.formatDate(this.customStartDate);
      this.currentEndDate = this.formatDate(this.customEndDate);
      this.emitDateRange();
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDisplayRange(): string {
    if (!this.currentStartDate || !this.currentEndDate) {
      return 'Please select a date range';
    }

    const start = new Date(this.currentStartDate);
    const end = new Date(this.currentEndDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };

    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
  }

  private emitDateRange(): void {
    this.dateRangeChanged.emit({
      startDate: this.currentStartDate,
      endDate: this.currentEndDate,
    });
  }
}
