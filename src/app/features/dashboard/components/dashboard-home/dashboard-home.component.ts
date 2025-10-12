import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PeriodOverviewComponent } from '../period-overview/period-overview.component';
import { DateRangeSelectorComponent } from '../date-range-selector/date-range-selector.component';
import { DailyBreakdownTableComponent } from '../daily-breakdown-table/daily-breakdown-table.component';
import { ProjectBreakdownTableComponent } from '../project-breakdown-table/project-breakdown-table.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { ConfigService } from '../../../../core/services/config.service';
import { ClockifyService } from '../../../../core/services/clockify.service';
import { HolidayService } from '../../../../core/services/holiday.service';
import { OvertimeService } from '../../../../core/services/overtime.service';
import { OvertimeReport } from '../../../../core/models/overtime.model';
import { firstValueFrom } from 'rxjs';

/**
 * Main dashboard view showing overtime summary and breakdowns
 */
@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PeriodOverviewComponent,
    DateRangeSelectorComponent,
    DailyBreakdownTableComponent,
    ProjectBreakdownTableComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
  ],
  template: `
    <div class="dashboard-home">
      <div class="dashboard-header">
        <h1>Overtime Dashboard</h1>
        <p class="subtitle">Track your work hours and overtime</p>
      </div>

      <!-- Date Range Selector -->
      <app-date-range-selector
        (dateRangeChanged)="onDateRangeChanged($event)"
      ></app-date-range-selector>

      <!-- Loading State -->
      <app-loading-spinner
        *ngIf="loading"
        message="Loading dashboard data..."
      ></app-loading-spinner>

      <!-- Error State -->
      <app-error-message
        *ngIf="error && !loading"
        [error]="error"
        title="Failed to Load Dashboard"
        [retryable]="true"
        [onRetry]="loadDashboardData.bind(this)"
      ></app-error-message>

      <!-- Dashboard Content -->
      <div *ngIf="!loading && !error" class="dashboard-content">
        <!-- Period Overview Component -->
        <app-period-overview
          [report]="currentMonthReport"
          [startDate]="selectedStartDate"
          [endDate]="selectedEndDate"
        ></app-period-overview>

        <!-- Daily Breakdown -->
        <div class="breakdown-section">
          <app-daily-breakdown-table
            [dailyBreakdown]="dailyBreakdown"
            [loading]="loading"
          ></app-daily-breakdown-table>
        </div>

        <!-- Project Breakdown -->
        <div class="breakdown-section">
          <app-project-breakdown-table
            [projectBreakdown]="projectBreakdown"
            [loading]="loading"
          ></app-project-breakdown-table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home {
      width: 100%;
    }

    .dashboard-header {
      margin-bottom: 24px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 400;
      color: var(--on-surface, #1c1b1f);
    }

    .dark-theme .dashboard-header h1 {
      color: var(--on-surface, #e6e1e5);
    }

    .dashboard-header .subtitle {
      margin: 8px 0 0 0;
      font-size: 16px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .dashboard-header .subtitle {
      color: var(--on-surface-variant, #cac4d0);
    }

    .dashboard-content {
      margin-top: 24px;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .breakdown-section {
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .summary-row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardHomeComponent implements OnInit {
  loading = false;
  error: string | null = null;
  
  currentMonthReport: OvertimeReport | null = null;
  dailyBreakdown: any[] = [];
  projectBreakdown: any[] = [];

  selectedStartDate = '';
  selectedEndDate = '';

  constructor(
    private configService: ConfigService,
    private clockifyService: ClockifyService,
    private holidayService: HolidayService,
    private overtimeService: OvertimeService
  ) {}

  ngOnInit(): void {
    // Don't load data here, wait for date range selector to emit
  }

  onDateRangeChanged(event: { startDate: string; endDate: string }): void {
    this.selectedStartDate = event.startDate;
    this.selectedEndDate = event.endDate;
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Get configuration
      const config = this.configService.getCurrentConfig();
      
      if (!config.clockify.api_key || !config.clockify.workspace_id) {
        throw new Error('Please configure your Clockify API key and workspace in Settings');
      }

      console.log('Loading dashboard data for:', this.selectedStartDate, 'to', this.selectedEndDate);
      
      // Convert dates from YYYY-MM-DD to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
      const startDateISO = `${this.selectedStartDate}T00:00:00Z`;
      const endDateISO = `${this.selectedEndDate}T23:59:59Z`;
      
      console.log('ISO format:', startDateISO, 'to', endDateISO);
      
      // Fetch time entries from Clockify
      const timeEntries = await firstValueFrom(
        this.clockifyService.fetchTimeEntries(
          config.clockify.api_key,
          config.clockify.workspace_id,
          startDateISO,
          endDateISO,
          config.clockify.base_url
        )
      );

      console.log(`Fetched ${timeEntries.length} time entries`);

      // Fetch projects for name resolution
      const projects = await firstValueFrom(
        this.clockifyService.fetchProjects(
          config.clockify.api_key,
          config.clockify.workspace_id,
          config.clockify.base_url
        )
      );

      console.log(`Fetched ${projects.length} projects`);

      // Fetch holidays for ALL years in the period (handles date ranges spanning multiple years)
      const years = this.getYearsInRange(new Date(this.selectedStartDate), new Date(this.selectedEndDate));
      console.log(`Fetching holidays for years: ${years.join(', ')}`);
      
      const holidayCaches = await firstValueFrom(
        this.holidayService.fetchHolidaysForYears(config.location.bundesland_code, years)
      );
      
      // Flatten all public holidays from all years
      const publicHolidays = holidayCaches.flatMap(cache => cache.publicHolidays);

      console.log(`Fetched ${publicHolidays.length} public holidays across ${years.length} year(s)`);

      // Fetch vacation days
      const vacationDays = await firstValueFrom(
        this.holidayService.getVacationDays()
      );

      // Filter vacation days to period
      const periodVacationDays = vacationDays.filter(v => {
        const date = v.date;
        return date >= this.selectedStartDate && date <= this.selectedEndDate;
      });

      console.log(`${periodVacationDays.length} vacation days in period`);

      // Calculate overtime
      const overtimeReport = await firstValueFrom(
        this.overtimeService.calculateOvertime(
          this.selectedStartDate,
          this.selectedEndDate,
          config.work_settings,
          publicHolidays,
          periodVacationDays,
          timeEntries,
          projects
        )
      );

      console.log('Overtime report calculated:', overtimeReport);

      // Update UI with data
      this.currentMonthReport = overtimeReport;
      this.dailyBreakdown = overtimeReport.dailyBreakdown || [];
      this.projectBreakdown = overtimeReport.projectBreakdown || [];
      
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      this.error = err.message || 'An error occurred while loading dashboard data';
    } finally {
      this.loading = false;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get all years in a date range
   * E.g., Dec 2025 to Feb 2026 returns [2025, 2026]
   */
  private getYearsInRange(startDate: Date, endDate: Date): number[] {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const years: number[] = [];
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    
    return years;
  }
}
