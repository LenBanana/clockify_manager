import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OvertimeReport } from '../../../../core/models/overtime.model';

/**
 * Card showing selected period overview with KPIs
 * Displays total working days, days worked, and overtime balance
 * Adapts title based on the date range provided
 */
@Component({
  selector: 'app-current-month-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card class="overview-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>calendar_today</mat-icon>
        <mat-card-title>{{ getPeriodTitle() }}</mat-card-title>
        <mat-card-subtitle>{{ getPeriodSubtitle() }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="overtimeReport" class="metrics">
          <!-- Total Overtime -->
          <div class="metric-item primary">
            <div class="metric-icon-wrapper" [class.positive]="overtimeReport.overtimeHours >= 0" [class.negative]="overtimeReport.overtimeHours < 0">
              <mat-icon>{{ overtimeReport.overtimeHours >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">Total Overtime</div>
              <div class="metric-value" [class.positive]="overtimeReport.overtimeHours >= 0" [class.negative]="overtimeReport.overtimeHours < 0">
                {{ formatHours(overtimeReport.overtimeHours) }}
              </div>
            </div>
          </div>

          <!-- Working Days -->
          <div class="metric-row">
            <div class="metric-item">
              <div class="metric-label">
                <mat-icon class="small-icon">work</mat-icon>
                <span>Working Days</span>
              </div>
              <div class="metric-value small">{{ overtimeReport.workDaysCount }}</div>
            </div>

            <div class="metric-item">
              <div class="metric-label">
                <mat-icon class="small-icon">event_available</mat-icon>
                <span>Weekends Worked</span>
              </div>
              <div class="metric-value small">{{ overtimeReport.weekendDaysWorked }}</div>
            </div>
          </div>

          <!-- Expected vs Actual Hours -->
          <div class="metric-row">
            <div class="metric-item">
              <div class="metric-label">
                <mat-icon class="small-icon">schedule</mat-icon>
                <span>Expected Hours</span>
              </div>
              <div class="metric-value small">{{ formatHours(overtimeReport.expectedWorkHours) }}</div>
            </div>

            <div class="metric-item">
              <div class="metric-label">
                <mat-icon class="small-icon">timer</mat-icon>
                <span>Worked Hours</span>
              </div>
              <div class="metric-value small">{{ formatHours(overtimeReport.totalWorkedHours) }}</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-section">
            <div class="progress-label">
              <span>Progress</span>
              <span>{{ getProgressPercentage() }}%</span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="getProgressPercentage()"
              [color]="getProgressColor()"
            ></mat-progress-bar>
          </div>

          <!-- Holidays and Vacation -->
          <div class="info-row">
            <div class="info-item">
              <mat-icon class="small-icon">beach_access</mat-icon>
              <span>{{ overtimeReport.vacationDaysTaken }} vacation days</span>
            </div>
            <div class="info-item">
              <mat-icon class="small-icon">celebration</mat-icon>
              <span>{{ overtimeReport.publicHolidaysCount }} public holidays</span>
            </div>
          </div>
        </div>

        <!-- No Data State -->
        <div *ngIf="!overtimeReport" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No overtime data available for this period</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .overview-card {
      height: 100%;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-header mat-icon {
      color: var(--primary, #6750a4);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .metrics {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .metric-item.primary {
      padding: 16px;
      background: linear-gradient(135deg, var(--primary-container, #eaddff) 0%, var(--surface-container, #f3edf7) 100%);
      border-radius: 12px;
    }

    .dark-theme .metric-item.primary {
      background: linear-gradient(135deg, var(--primary-container, #4a4458) 0%, var(--surface-container, #211f26) 100%);
    }

    .metric-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface, #fffbfe);
    }

    .dark-theme .metric-icon-wrapper {
      background: var(--surface, #1c1b1f);
    }

    .metric-icon-wrapper.positive {
      color: var(--success, #4caf50);
    }

    .metric-icon-wrapper.negative {
      color: var(--error, #f44336);
    }

    .metric-content {
      flex: 1;
    }

    .metric-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);
      margin-bottom: 4px;
    }

    .dark-theme .metric-label {
      color: var(--on-surface-variant, #cac4d0);
    }

    .metric-value {
      font-size: 32px;
      font-weight: 600;
      color: var(--on-surface, #1c1b1f);
    }

    .dark-theme .metric-value {
      color: var(--on-surface, #e6e1e5);
    }

    .metric-value.small {
      font-size: 20px;
    }

    .metric-value.positive {
      color: var(--success, #4caf50);
    }

    .metric-value.negative {
      color: var(--error, #f44336);
    }

    .metric-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .small-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .small-icon {
      color: var(--on-surface-variant, #cac4d0);
    }

    .progress-section {
      margin-top: 4px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);
      margin-bottom: 8px;
    }

    .dark-theme .progress-label {
      color: var(--on-surface-variant, #cac4d0);
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--surface-container, #f3edf7);
      border-radius: 8px;
    }

    .dark-theme .info-row {
      background: var(--surface-container, #211f26);
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .info-item {
      color: var(--on-surface-variant, #cac4d0);
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .no-data {
      color: var(--on-surface-variant, #cac4d0);
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  `],
})
export class CurrentMonthOverviewComponent {
  @Input() overtimeReport: OvertimeReport | null = null;
  @Input() startDate: string = ''; // YYYY-MM-DD format
  @Input() endDate: string = ''; // YYYY-MM-DD format

  getPeriodTitle(): string {
    if (!this.startDate || !this.endDate) {
      return 'Selected Period';
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    // Check if it's current month
    const now = new Date();
    const isCurrentMonth = 
      start.getMonth() === now.getMonth() && 
      start.getFullYear() === now.getFullYear() &&
      end.getMonth() === now.getMonth() && 
      end.getFullYear() === now.getFullYear();
    
    if (isCurrentMonth) {
      return 'Current Month';
    }
    
    // Check if it's a single month
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return 'Selected Month';
    }
    
    // Multi-month or custom range
    return 'Selected Period';
  }

  getPeriodSubtitle(): string {
    if (!this.startDate || !this.endDate) {
      return 'Select a date range';
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    // Check if it's current month
    const now = new Date();
    const isCurrentMonth = 
      start.getMonth() === now.getMonth() && 
      start.getFullYear() === now.getFullYear() &&
      end.getMonth() === now.getMonth() && 
      end.getFullYear() === now.getFullYear();
    
    if (isCurrentMonth) {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    // Check if it's a single month
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    // Format date range
    const startFormatted = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined 
    });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startFormatted} - ${endFormatted}`;
  }

  getCurrentMonth(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatHours(hours: number): string {
    const sign = hours >= 0 ? '+' : '';
    return `${sign}${hours.toFixed(2)}h`;
  }

  getProgressPercentage(): number {
    if (!this.overtimeReport || this.overtimeReport.expectedWorkHours === 0) {
      return 0;
    }
    const percentage = (this.overtimeReport.totalWorkedHours / this.overtimeReport.expectedWorkHours) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  getProgressColor(): 'primary' | 'accent' | 'warn' {
    const percentage = this.getProgressPercentage();
    if (percentage >= 100) return 'accent';
    if (percentage >= 80) return 'primary';
    return 'warn';
  }
}
