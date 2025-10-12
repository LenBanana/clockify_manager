import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { OvertimeReport } from '../../../../core/models/overtime.model';

/**
 * Year-to-date summary card showing YTD overtime and key stats
 * Always shows current year data for comparison against selected period
 */
@Component({
  selector: 'app-year-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <mat-card class="year-summary-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>insights</mat-icon>
        <mat-card-title>Year to Date</mat-card-title>
        <mat-card-subtitle>{{ getCurrentYear() }} (for comparison)</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="yearToDateReport" class="year-metrics">
          <!-- Total Overtime Display -->
          <div class="main-metric">
            <div class="metric-label">Total Overtime (YTD)</div>
            <div 
              class="metric-value large" 
              [class.positive]="yearToDateReport.overtimeHours >= 0" 
              [class.negative]="yearToDateReport.overtimeHours < 0"
            >
              {{ formatHours(yearToDateReport.overtimeHours) }}
            </div>
            <div class="trend-indicator" [class.positive]="yearToDateReport.overtimeHours >= 0" [class.negative]="yearToDateReport.overtimeHours < 0">
              <mat-icon>{{ yearToDateReport.overtimeHours >= 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              <span>{{ getOvertimeStatus() }}</span>
            </div>
          </div>

          <!-- Statistics Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <mat-icon class="stat-icon">schedule</mat-icon>
              <div class="stat-content">
                <div class="stat-value">{{ formatHours(yearToDateReport.totalWorkedHours) }}</div>
                <div class="stat-label">Total Worked</div>
              </div>
            </div>

            <div class="stat-card">
              <mat-icon class="stat-icon">work</mat-icon>
              <div class="stat-content">
                <div class="stat-value">{{ yearToDateReport.workDaysCount }}</div>
                <div class="stat-label">Work Days</div>
              </div>
            </div>

            <div class="stat-card">
              <mat-icon class="stat-icon">weekend</mat-icon>
              <div class="stat-content">
                <div class="stat-value">{{ yearToDateReport.weekendDaysWorked }}</div>
                <div class="stat-label">Weekend Days</div>
              </div>
            </div>

            <div class="stat-card">
              <mat-icon class="stat-icon">beach_access</mat-icon>
              <div class="stat-content">
                <div class="stat-value">{{ getTotalDaysOff() }}</div>
                <div class="stat-label">Days Off</div>
              </div>
            </div>
          </div>

          <!-- Time Off Breakdown -->
          <div class="time-off-section">
            <div class="section-label">Time Off Breakdown</div>
            <div class="chips-container">
              <mat-chip-set>
                <mat-chip *ngIf="yearToDateReport.vacationDaysTaken > 0">
                  <mat-icon>beach_access</mat-icon>
                  Vacation: {{ yearToDateReport.vacationDaysTaken }}
                </mat-chip>
                <mat-chip *ngIf="yearToDateReport.sickDaysTaken > 0">
                  <mat-icon>medical_services</mat-icon>
                  Sick: {{ yearToDateReport.sickDaysTaken }}
                </mat-chip>
                <mat-chip *ngIf="yearToDateReport.personalDaysTaken > 0">
                  <mat-icon>event</mat-icon>
                  Personal: {{ yearToDateReport.personalDaysTaken }}
                </mat-chip>
                <mat-chip *ngIf="yearToDateReport.trainingDaysCount > 0">
                  <mat-icon>school</mat-icon>
                  Training: {{ yearToDateReport.trainingDaysCount }}
                </mat-chip>
                <mat-chip *ngIf="yearToDateReport.publicHolidaysCount > 0">
                  <mat-icon>celebration</mat-icon>
                  Holidays: {{ yearToDateReport.publicHolidaysCount }}
                </mat-chip>
              </mat-chip-set>
            </div>
          </div>

          <!-- Average per day -->
          <div class="average-section">
            <div class="average-item">
              <span class="average-label">Average hours per work day:</span>
              <strong class="average-value">{{ getAverageHoursPerDay() }}h</strong>
            </div>
          </div>
        </div>

        <!-- No Data State -->
        <div *ngIf="!yearToDateReport" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No year-to-date data available</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .year-summary-card {
      height: 100%;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-header mat-icon {
      color: var(--tertiary, #7d5260);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .year-metrics {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .main-metric {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, var(--tertiary-container, #ffd8e4) 0%, var(--surface-container, #f3edf7) 100%);
      border-radius: 16px;
    }

    .dark-theme .main-metric {
      background: linear-gradient(135deg, var(--tertiary-container, #633b48) 0%, var(--surface-container, #211f26) 100%);
    }

    .main-metric .metric-label {
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);
      margin-bottom: 8px;
      font-weight: 500;
    }

    .dark-theme .main-metric .metric-label {
      color: var(--on-surface-variant, #cac4d0);
    }

    .main-metric .metric-value {
      font-size: 48px;
      font-weight: 700;
      color: var(--on-surface, #1c1b1f);
      line-height: 1;
    }

    .dark-theme .main-metric .metric-value {
      color: var(--on-surface, #e6e1e5);
    }

    .metric-value.positive {
      color: var(--success, #4caf50);
    }

    .metric-value.negative {
      color: var(--error, #f44336);
    }

    .trend-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .trend-indicator.positive {
      color: var(--success, #4caf50);
    }

    .trend-indicator.negative {
      color: var(--error, #f44336);
    }

    .trend-indicator mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--surface-container, #f3edf7);
      border-radius: 12px;
    }

    .dark-theme .stat-card {
      background: var(--surface-container, #211f26);
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--tertiary, #7d5260);
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--on-surface, #1c1b1f);
      line-height: 1;
    }

    .dark-theme .stat-value {
      color: var(--on-surface, #e6e1e5);
    }

    .stat-label {
      font-size: 12px;
      color: var(--on-surface-variant, #49454f);
      margin-top: 4px;
    }

    .dark-theme .stat-label {
      color: var(--on-surface-variant, #cac4d0);
    }

    .time-off-section {
      padding: 16px;
      background: var(--surface-container-lowest, #ffffff);
      border-radius: 12px;
    }

    .dark-theme .time-off-section {
      background: var(--surface-container-lowest, #0f0d13);
    }

    .section-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--on-surface-variant, #49454f);
      margin-bottom: 12px;
    }

    .dark-theme .section-label {
      color: var(--on-surface-variant, #cac4d0);
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    mat-chip {
      font-size: 13px;
    }

    mat-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    .average-section {
      padding: 16px;
      background: var(--primary-container, #eaddff);
      border-radius: 12px;
    }

    .dark-theme .average-section {
      background: var(--primary-container, #4a4458);
    }

    .average-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .average-label {
      font-size: 14px;
      color: var(--on-primary-container, #21005d);
    }

    .dark-theme .average-label {
      color: var(--on-primary-container, #eaddff);
    }

    .average-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--on-primary-container, #21005d);
    }

    .dark-theme .average-value {
      color: var(--on-primary-container, #eaddff);
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

    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class YearSummaryComponent {
  @Input() yearToDateReport: OvertimeReport | null = null;

  getCurrentYear(): string {
    return new Date().getFullYear().toString();
  }

  formatHours(hours: number): string {
    const sign = hours >= 0 ? '+' : '';
    return `${sign}${hours.toFixed(2)}h`;
  }

  getOvertimeStatus(): string {
    if (!this.yearToDateReport) return '';
    const hours = this.yearToDateReport.overtimeHours;
    if (hours > 0) return `${Math.abs(hours).toFixed(1)} hours ahead`;
    if (hours < 0) return `${Math.abs(hours).toFixed(1)} hours behind`;
    return 'On track';
  }

  getTotalDaysOff(): number {
    if (!this.yearToDateReport) return 0;
    return (
      this.yearToDateReport.vacationDaysTaken +
      this.yearToDateReport.sickDaysTaken +
      this.yearToDateReport.personalDaysTaken +
      this.yearToDateReport.publicHolidaysCount
    );
  }

  getAverageHoursPerDay(): string {
    if (!this.yearToDateReport || this.yearToDateReport.workDaysCount === 0) {
      return '0.00';
    }
    const average = this.yearToDateReport.totalWorkedHours / this.yearToDateReport.workDaysCount;
    return average.toFixed(2);
  }
}
