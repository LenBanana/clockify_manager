import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { VacationDay } from '../../../../core/models/holiday.model';

interface VacationStats {
  total: number;
  vacation: number;
  sickDay: number;
  personalDay: number;
  training: number;
  thisMonth: number;
  thisYear: number;
  upcoming: VacationDay[];
}

/**
 * Component displaying vacation statistics and summaries
 * Shows breakdown by type, totals, and upcoming vacation days
 */
@Component({
  selector: 'app-vacation-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="vacation-statistics">
      <!-- Summary Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>event</mat-icon>
            <mat-card-title>Total Days</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">All time</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="month-icon">calendar_month</mat-icon>
            <mat-card-title>This Month</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats.thisMonth }}</div>
            <div class="stat-label">{{ getCurrentMonthName() }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="year-icon">calendar_today</mat-icon>
            <mat-card-title>This Year</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats.thisYear }}</div>
            <div class="stat-label">{{ getCurrentYear() }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Breakdown by Type -->
      <mat-card class="breakdown-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>pie_chart</mat-icon>
          <mat-card-title>Breakdown by Type</mat-card-title>
          <mat-card-subtitle>Distribution of your time off</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-label">
                <mat-icon class="vacation-icon">beach_access</mat-icon>
                <span>Vacation</span>
              </div>
              <span class="breakdown-value">{{ stats.vacation }} days</span>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="getPercentage(stats.vacation)" 
              class="vacation-bar">
            </mat-progress-bar>
          </div>

          <div class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-label">
                <mat-icon class="sick-icon">medication</mat-icon>
                <span>Sick Days</span>
              </div>
              <span class="breakdown-value">{{ stats.sickDay }} days</span>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="getPercentage(stats.sickDay)" 
              class="sick-bar">
            </mat-progress-bar>
          </div>

          <div class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-label">
                <mat-icon class="personal-icon">person</mat-icon>
                <span>Personal Days</span>
              </div>
              <span class="breakdown-value">{{ stats.personalDay }} days</span>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="getPercentage(stats.personalDay)" 
              class="personal-bar">
            </mat-progress-bar>
          </div>

          <div class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-label">
                <mat-icon class="training-icon">school</mat-icon>
                <span>Training</span>
              </div>
              <span class="breakdown-value">{{ stats.training }} days</span>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="getPercentage(stats.training)" 
              class="training-bar">
            </mat-progress-bar>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Upcoming Vacation Days -->
      <mat-card class="upcoming-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>upcoming</mat-icon>
          <mat-card-title>Upcoming Days Off</mat-card-title>
          <mat-card-subtitle>Next {{ stats.upcoming.length }} scheduled days</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="stats.upcoming.length === 0" class="empty-state">
            <mat-icon>event_available</mat-icon>
            <p>No upcoming vacation days scheduled</p>
          </div>
          
          <div *ngIf="stats.upcoming.length > 0" class="upcoming-list">
            <div *ngFor="let day of stats.upcoming" class="upcoming-item">
              <div class="upcoming-date">
                <div class="date-day">{{ formatDay(day.date) }}</div>
                <div class="date-month">{{ formatMonth(day.date) }}</div>
              </div>
              <div class="upcoming-details">
                <div class="upcoming-type">
                  <mat-chip [class]="getChipClass(day.dayType)">
                    {{ getTypeLabel(day.dayType) }}
                  </mat-chip>
                </div>
                <div *ngIf="day.description" class="upcoming-description">
                  {{ day.description }}
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .vacation-statistics {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding-bottom: var(--spacing-xl);
      min-height: 100%;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
    }

    .stat-card mat-card-header {
      margin-bottom: var(--spacing-md);
    }

    mat-icon[mat-card-avatar] {
      background: var(--primary-color, #7c4dff);
      color: white;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .month-icon {
      background: var(--info-color, #2196f3) !important;
    }

    .year-icon {
      background: var(--success-color, #4caf50) !important;
    }

    .stat-value {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1;
      color: var(--primary-color, #7c4dff);
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(0,0,0,0.6);
      margin-top: var(--spacing-xs);
    }

    :host-context(.dark-theme) .stat-label {
      color: #cac4d0;
    }

    .breakdown-card,
    .upcoming-card {
      width: 100%;
    }

    .breakdown-item {
      margin-bottom: var(--spacing-lg);
    }

    .breakdown-item:last-child {
      margin-bottom: 0;
    }

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }

    .breakdown-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .breakdown-label {
      color: #e6e1e5;
    }

    .breakdown-label mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .vacation-icon {
      color: var(--vacation-color, #4caf50);
    }

    .sick-icon {
      color: var(--sick-day-color, #f44336);
    }

    .personal-icon {
      color: var(--personal-day-color, #9c27b0);
    }

    .training-icon {
      color: var(--training-color, #00bcd4);
    }

    .breakdown-value {
      font-weight: 600;
      color: rgba(0,0,0,0.87);
    }

    :host-context(.dark-theme) .breakdown-value {
      color: #e6e1e5;
    }

    mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .vacation-bar::ng-deep .mdc-linear-progress__bar-inner {
      border-color: var(--vacation-color, #4caf50) !important;
    }

    .sick-bar::ng-deep .mdc-linear-progress__bar-inner {
      border-color: var(--sick-day-color, #f44336) !important;
    }

    .personal-bar::ng-deep .mdc-linear-progress__bar-inner {
      border-color: var(--personal-day-color, #9c27b0) !important;
    }

    .training-bar::ng-deep .mdc-linear-progress__bar-inner {
      border-color: var(--training-color, #00bcd4) !important;
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
      margin-bottom: var(--spacing-md);
    }

    .upcoming-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding-bottom: var(--spacing-lg);
    }

    .upcoming-item {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: rgba(0,0,0,0.02);
      border-radius: var(--border-radius-md);
      border-left: 4px solid #7c4dff;
    }

    :host-context(.dark-theme) .upcoming-item {
      background: #2a2a2a;
      border-left-color: #d0bcff;
    }

    .upcoming-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 60px;
      padding: var(--spacing-sm);
      background: white;
      border-radius: var(--border-radius-sm);
      box-shadow: var(--shadow-sm);
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .upcoming-date {
      background: #1d1b20;
      color: #e6e1e5;
    }

    .date-day {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .date-month {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: rgba(0,0,0,0.6);
      margin-top: 4px;
    }

    :host-context(.dark-theme) .date-month {
      color: #cac4d0;
    }

    .upcoming-details {
      flex: 1;
    }

    .upcoming-type {
      margin-bottom: var(--spacing-xs);
    }

    .upcoming-description {
      font-size: 0.875rem;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .upcoming-description {
      color: #cac4d0;
    }

    mat-chip {
      font-size: 0.75rem;
    }

    .vacation-chip {
      background: var(--vacation-color, #e8f5e9) !important;
    }

    .sick-chip {
      background: var(--sick-day-color, #ffebee) !important;
    }

    .personal-chip {
      background: var(--personal-day-color, #f3e5f5) !important;
    }

    .training-chip {
      background: var(--training-color, #e0f7fa) !important;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-value {
        font-size: 2.5rem;
      }
    }
  `]
})
export class VacationStatisticsComponent implements OnChanges {
  @Input() vacationDays: VacationDay[] = [];

  stats: VacationStats = {
    total: 0,
    vacation: 0,
    sickDay: 0,
    personalDay: 0,
    training: 0,
    thisMonth: 0,
    thisYear: 0,
    upcoming: []
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vacationDays']) {
      this.calculateStats();
    }
  }

  calculateStats(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.stats = {
      total: this.vacationDays.length,
      vacation: this.vacationDays.filter(d => d.dayType === 'Vacation').length,
      sickDay: this.vacationDays.filter(d => d.dayType === 'SickDay').length,
      personalDay: this.vacationDays.filter(d => d.dayType === 'PersonalDay').length,
      training: this.vacationDays.filter(d => d.dayType === 'Training').length,
      thisMonth: this.vacationDays.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length,
      thisYear: this.vacationDays.filter(d => {
        const date = new Date(d.date);
        return date.getFullYear() === currentYear;
      }).length,
      upcoming: this.vacationDays
        .filter(d => new Date(d.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
    };
  }

  getPercentage(count: number): number {
    if (this.stats.total === 0) return 0;
    return (count / this.stats.total) * 100;
  }

  getCurrentMonthName(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long' });
  }

  getCurrentYear(): string {
    return new Date().getFullYear().toString();
  }

  formatDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  formatMonth(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Vacation': 'Vacation',
      'SickDay': 'Sick Day',
      'PersonalDay': 'Personal',
      'Training': 'Training'
    };
    return labels[type] || type;
  }

  getChipClass(type: string): string {
    const classes: Record<string, string> = {
      'Vacation': 'vacation-chip',
      'SickDay': 'sick-chip',
      'PersonalDay': 'personal-chip',
      'Training': 'training-chip'
    };
    return classes[type] || '';
  }
}
