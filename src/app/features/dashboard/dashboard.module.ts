import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';

// Components
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home.component';
import { CurrentMonthOverviewComponent } from './components/current-month-overview/current-month-overview.component';
import { YearSummaryComponent } from './components/year-summary/year-summary.component';
import { DateRangeSelectorComponent } from './components/date-range-selector/date-range-selector.component';
import { DailyBreakdownTableComponent } from './components/daily-breakdown-table/daily-breakdown-table.component';
import { ProjectBreakdownTableComponent } from './components/project-breakdown-table/project-breakdown-table.component';

// Shared components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@NgModule({
  imports: [
    SharedModule,
    DashboardRoutingModule,
    DashboardLayoutComponent,
    DashboardHomeComponent,
    CurrentMonthOverviewComponent,
    YearSummaryComponent,
    DateRangeSelectorComponent,
    DailyBreakdownTableComponent,
    ProjectBreakdownTableComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    PageHeaderComponent,
  ],
})
export class DashboardModule {}
