import { Component, Input, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DayBreakdown, getDayTypeName } from '../../../../core/models/overtime.model';

/**
 * Daily breakdown table showing day-by-day overtime calculations
 */
@Component({
  selector: 'app-daily-breakdown-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="breakdown-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>view_list</mat-icon>
        <mat-card-title>Daily Breakdown</mat-card-title>
        <mat-card-subtitle>Day-by-day work hours and overtime</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="dailyBreakdown && dailyBreakdown.length > 0" class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="daily-table">
            
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let day">
                <div class="date-cell">
                  <div class="date-main">{{ formatDate(day.date) }}</div>
                  <div class="date-sub">{{ day.dayOfWeek }}</div>
                </div>
              </td>
            </ng-container>

            <!-- Day Type Column -->
            <ng-container matColumnDef="dayType">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
              <td mat-cell *matCellDef="let day">
                <mat-chip [class]="getDayTypeClass(day.dayType)">
                  <mat-icon>{{ getDayTypeIcon(day.dayType) }}</mat-icon>
                  {{ getDayTypeName(day.dayType) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Expected Hours Column -->
            <ng-container matColumnDef="expectedHours">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Expected</th>
              <td mat-cell *matCellDef="let day">
                <span class="hours-value">{{ day.expectedHours.toFixed(2) }}h</span>
              </td>
            </ng-container>

            <!-- Actual Hours Column -->
            <ng-container matColumnDef="actualHours">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Worked</th>
              <td mat-cell *matCellDef="let day">
                <div class="hours-cell">
                  <span class="hours-value" [class.highlight]="day.actualHours > 0">
                    {{ day.actualHours.toFixed(2) }}h
                  </span>
                  <mat-icon 
                    *ngIf="isFullyBillable(day)" 
                    class="billable-icon fully-billable"
                    matTooltip="All hours are billable"
                  >
                    paid
                  </mat-icon>
                  <mat-icon 
                    *ngIf="isPartiallyBillable(day)" 
                    class="billable-icon partially-billable"
                    matTooltip="Partially billable ({{ getBillableHours(day).toFixed(2) }}h of {{ day.actualHours.toFixed(2) }}h)"
                  >
                    attach_money
                  </mat-icon>
                  <mat-icon 
                    *ngIf="hasNonBillableHours(day) && !hasBillableHours(day)" 
                    class="non-billable-icon"
                    matTooltip="All hours are non-billable"
                  >
                    money_off
                  </mat-icon>
                </div>
              </td>
            </ng-container>

            <!-- Overtime Column -->
            <ng-container matColumnDef="overtimeHours">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Overtime</th>
              <td mat-cell *matCellDef="let day">
                <span 
                  class="overtime-value" 
                  [class.positive]="day.overtimeHours > 0" 
                  [class.negative]="day.overtimeHours < 0"
                  [class.neutral]="day.overtimeHours === 0"
                >
                  {{ formatOvertime(day.overtimeHours) }}
                </span>
              </td>
            </ng-container>

            <!-- Projects Column -->
            <ng-container matColumnDef="projects">
              <th mat-header-cell *matHeaderCellDef>Projects</th>
              <td mat-cell *matCellDef="let day">
                <div class="projects-cell">
                  <span *ngIf="day.projectsWorked.length === 0" class="no-projects">—</span>
                  <div *ngIf="day.projectsWorked.length > 0" class="projects-list">
                    <button 
                      mat-button 
                      class="projects-button"
                      [matTooltip]="getProjectsTooltip(day.projectsWorked)"
                    >
                      <mat-icon>folder</mat-icon>
                      {{ day.projectsWorked.length }} project(s)
                    </button>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Time Entries Count Column -->
            <ng-container matColumnDef="entriesCount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Entries</th>
              <td mat-cell *matCellDef="let day">
                <span class="entries-badge">{{ day.timeEntriesCount }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          <mat-paginator 
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageSize]="25"
            showFirstLastButtons
          ></mat-paginator>
        </div>

        <!-- No Data State -->
        <div *ngIf="!dailyBreakdown || dailyBreakdown.length === 0" class="no-data">
          <mat-icon>event_busy</mat-icon>
          <p>No daily breakdown data available for the selected period</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .breakdown-card {
      width: 100%;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-header mat-icon {
      color: var(--primary, #6750a4);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .daily-table {
      width: 100%;
      background: var(--surface, #fffbfe);
    }

    .dark-theme .daily-table {
      background: var(--surface, #1c1b1f);
    }

    .table-row:hover {
      background: var(--surface-container-highest, #e6e0e9);
    }

    .dark-theme .table-row:hover {
      background: var(--surface-container-highest, #36343b);
    }

    th.mat-header-cell {
      font-weight: 600;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme th.mat-header-cell {
      color: var(--on-surface-variant, #cac4d0);
    }

    .date-cell {
      display: flex;
      flex-direction: column;
    }

    .date-main {
      font-weight: 500;
      color: var(--on-surface, #1c1b1f);
    }

    .dark-theme .date-main {
      color: var(--on-surface, #e6e1e5);
    }

    .date-sub {
      font-size: 12px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .date-sub {
      color: var(--on-surface-variant, #cac4d0);
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
    }

    mat-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    mat-chip.work-day {
      background: var(--primary-container, #eaddff);
      color: var(--on-primary-container, #21005d);
    }

    .dark-theme mat-chip.work-day {
      background: var(--primary-container, #4a4458);
      color: var(--on-primary-container, #eaddff);
    }

    mat-chip.weekend {
      background: var(--secondary-container, #e8def8);
      color: var(--on-secondary-container, #1d192b);
    }

    .dark-theme mat-chip.weekend {
      background: var(--secondary-container, #4a4458);
      color: var(--on-secondary-container, #e8def8);
    }

    mat-chip.public-holiday {
      background: var(--tertiary-container, #ffd8e4);
      color: var(--on-tertiary-container, #31111d);
    }

    .dark-theme mat-chip.public-holiday {
      background: var(--tertiary-container, #633b48);
      color: var(--on-tertiary-container, #ffd8e4);
    }

    mat-chip.vacation,
    mat-chip.sick-day,
    mat-chip.personal-day {
      background: var(--success-container, #c8e6c9);
      color: var(--on-success-container, #1b5e20);
    }

    mat-chip.training {
      background: var(--info-container, #bbdefb);
      color: var(--on-info-container, #0d47a1);
    }

    .hours-value {
      font-weight: 500;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .hours-value {
      color: var(--on-surface-variant, #cac4d0);
    }

    .hours-value.highlight {
      color: var(--on-surface, #1c1b1f);
      font-weight: 600;
    }

    .dark-theme .hours-value.highlight {
      color: var(--on-surface, #e6e1e5);
    }

    .hours-cell {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .billable-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .billable-icon.fully-billable {
      color: var(--success, #2e7d32);
    }

    .dark-theme .billable-icon.fully-billable {
      color: var(--success, #81c784);
    }

    .billable-icon.partially-billable {
      color: var(--warning, #f57c00);
    }

    .dark-theme .billable-icon.partially-billable {
      color: var(--warning, #ffb74d);
    }

    .non-billable-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--on-surface-variant, #49454f);
      opacity: 0.5;
    }

    .dark-theme .non-billable-icon {
      color: var(--on-surface-variant, #cac4d0);
    }

    .overtime-value {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .overtime-value.positive {
      background: var(--success-container, #c8e6c9);
      color: var(--success, #2e7d32);
    }

    .overtime-value.negative {
      background: var(--error-container, #ffcdd2);
      color: var(--error, #c62828);
    }

    .overtime-value.neutral {
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .overtime-value.neutral {
      color: var(--on-surface-variant, #cac4d0);
    }

    .projects-cell {
      min-width: 120px;
    }

    .no-projects {
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .no-projects {
      color: var(--on-surface-variant, #cac4d0);
    }

    .projects-button {
      font-size: 12px;
      padding: 0 8px;
      min-width: auto;
    }

    .projects-button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .entries-badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--primary-container, #eaddff);
      color: var(--on-primary-container, #21005d);
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .dark-theme .entries-badge {
      background: var(--primary-container, #4a4458);
      color: var(--on-primary-container, #eaddff);
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .no-data {
      color: var(--on-surface-variant, #cac4d0);
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  `],
})
export class DailyBreakdownTableComponent implements AfterViewInit, OnChanges {
  @Input() dailyBreakdown: DayBreakdown[] | null = null;
  @Input() loading = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<DayBreakdown>([]);
  displayedColumns: string[] = ['date', 'dayType', 'expectedHours', 'actualHours', 'overtimeHours', 'projects', 'entriesCount'];

  getDayTypeName = getDayTypeName;

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dailyBreakdown'] && this.dailyBreakdown) {
      this.dataSource.data = this.dailyBreakdown;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatOvertime(hours: number): string {
    const sign = hours > 0 ? '+' : '';
    return `${sign}${hours.toFixed(2)}h`;
  }

  getDayTypeClass(dayType: string): string {
    const classMap: Record<string, string> = {
      'WorkDay': 'work-day',
      'Weekend': 'weekend',
      'PublicHoliday': 'public-holiday',
      'Vacation': 'vacation',
      'SickDay': 'sick-day',
      'PersonalDay': 'personal-day',
      'Training': 'training',
    };
    return classMap[dayType] || 'work-day';
  }

  getDayTypeIcon(dayType: string): string {
    const iconMap: Record<string, string> = {
      'WorkDay': 'work',
      'Weekend': 'weekend',
      'PublicHoliday': 'celebration',
      'Vacation': 'beach_access',
      'SickDay': 'medical_services',
      'PersonalDay': 'event',
      'Training': 'school',
      'BusinessTrip': 'flight',
      'Saldo': 'account_balance',
    };
    return iconMap[dayType] || 'event';
  }

  getProjectsTooltip(projects: any[]): string {
    return projects.map(p => `${p.projectName}: ${p.hours.toFixed(2)}h`).join('\n');
  }

  hasBillableHours(day: any): boolean {
    return day.projectsWorked?.some((p: any) => p.billable && p.hours > 0) || false;
  }

  hasNonBillableHours(day: any): boolean {
    return day.actualHours > 0;
  }

  getBillableHours(day: any): number {
    if (!day.projectsWorked || day.projectsWorked.length === 0) return 0;
    return day.projectsWorked
      .filter((p: any) => p.billable)
      .reduce((sum: number, p: any) => sum + p.hours, 0);
  }

  isFullyBillable(day: any): boolean {
    if (day.actualHours === 0) return false;
    const billableHours = this.getBillableHours(day);
    // Consider fully billable if billable hours are within 0.01h of total (rounding tolerance)
    return Math.abs(billableHours - day.actualHours) < 0.01;
  }

  isPartiallyBillable(day: any): boolean {
    const billableHours = this.getBillableHours(day);
    return billableHours > 0 && !this.isFullyBillable(day);
  }
}
