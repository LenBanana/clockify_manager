import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { OvertimeReport, DayBreakdown, ProjectBreakdown } from '../../../../core/models/overtime.model';
import { OvertimePayoff } from '../../../../core/models/config.model';
import { OvertimePayoffsDialogComponent } from '../overtime-payoffs-dialog/overtime-payoffs-dialog.component';

interface DayWithImpact extends DayBreakdown {
  impact: number; // Absolute impact on overtime
}

interface QuickStat {
  icon: string;
  label: string;
  value: string;
  tooltip?: string;
}

/**
 * Comprehensive period overview component
 * Shows overtime summary, key metrics, and actionable insights
 * Serves as the design reference for the entire application
 */
@Component({
  selector: 'app-period-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './period-overview.component.html',
  styleUrls: ['./period-overview.component.scss']
})
export class PeriodOverviewComponent implements OnChanges {
  @Input() report: OvertimeReport | null = null;
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() payoffs: OvertimePayoff[] = [];
  @Output() payoffsChanged = new EventEmitter<OvertimePayoff[]>();

  // Computed values
  periodTitle: string = '';
  quickStats: QuickStat[] = [];
  topDeficitDays: DayWithImpact[] = [];
  topSurplusDays: DayWithImpact[] = [];
  topProjects: ProjectBreakdown[] = [];
  incompleteDays: DayBreakdown[] = [];
  
  // UI state
  showAllDeficitDays = false;
  showAllSurplusDays = false;
  showAllProjects = false;

  // Constants
  readonly PREVIEW_LIMIT = 5;
  readonly INCOMPLETE_THRESHOLD = 2; // Hours threshold for incomplete days

  constructor(private dialog: MatDialog) {}

  get totalPayoffHours(): number {
    return this.payoffs.reduce((sum, p) => sum + p.hours, 0);
  }

  get adjustedOvertimeHours(): number {
    return (this.report?.overtimeHours ?? 0) - this.totalPayoffHours;
  }

  get hasPayoffs(): boolean {
    return this.payoffs.length > 0;
  }

  openPayoffsDialog(): void {
    const ref = this.dialog.open(OvertimePayoffsDialogComponent, {
      data: { payoffs: this.payoffs },
      autoFocus: false,
      panelClass: 'payoffs-dialog-panel',
    });
    ref.afterClosed().subscribe((result: OvertimePayoff[] | undefined) => {
      if (result !== undefined) {
        this.payoffsChanged.emit(result);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['report'] || changes['startDate'] || changes['endDate']) {
      this.calculateMetrics();
    }
  }

  private calculateMetrics(): void {
    if (!this.report) return;

    this.periodTitle = this.formatPeriodTitle();
    this.quickStats = this.buildQuickStats();
    this.analyzeProblematicDays();
    this.analyzeTopProjects();
    this.findIncompleteDays();
  }

  private formatPeriodTitle(): string {
    if (!this.startDate || !this.endDate) {
      return 'Selected Period';
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    // Format based on date range
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const sameYear = start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: sameYear ? undefined : 'numeric'
    });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  }

  private buildQuickStats(): QuickStat[] {
    if (!this.report) return [];

    const stats: QuickStat[] = [];
    const avgHoursPerDay = this.report.workDaysCount > 0 
      ? this.report.totalWorkedHours / this.report.workDaysCount 
      : 0;

    // Work days with average
    stats.push({
      icon: 'work',
      label: 'Work days',
      value: `${this.report.workDaysCount} (avg ${avgHoursPerDay.toFixed(1)}h/day)`,
      tooltip: 'Number of work days and average hours per work day'
    });

    // Weekend work (if any)
    if (this.report.weekendDaysWorked > 0) {
      stats.push({
        icon: 'weekend',
        label: 'Weekends worked',
        value: `${this.report.weekendDaysWorked}`,
        tooltip: 'Days worked on weekends'
      });
    }

    // Days off
    const totalDaysOff = 
      this.report.vacationDaysTaken + 
      this.report.sickDaysTaken + 
      this.report.personalDaysTaken +
      this.report.publicHolidaysCount;

    if (totalDaysOff > 0) {
      const parts: string[] = [];
      if (this.report.vacationDaysTaken > 0) parts.push(`${this.report.vacationDaysTaken} vacation`);
      if (this.report.publicHolidaysCount > 0) parts.push(`${this.report.publicHolidaysCount} holidays`);
      if (this.report.sickDaysTaken > 0) parts.push(`${this.report.sickDaysTaken} sick`);
      if (this.report.personalDaysTaken > 0) parts.push(`${this.report.personalDaysTaken} personal`);

      stats.push({
        icon: 'beach_access',
        label: 'Days off',
        value: parts.join(' + '),
        tooltip: 'Vacation, holidays, sick days, and personal days'
      });
    }

    // Billable vs non-billable
    const billableHours = this.calculateTotalBillableHours();
    const nonBillableHours = this.report.totalWorkedHours - billableHours;
    
    if (billableHours > 0 || nonBillableHours > 0) {
      const billablePercent = this.report.totalWorkedHours > 0 
        ? (billableHours / this.report.totalWorkedHours * 100).toFixed(0)
        : 0;
      
      stats.push({
        icon: 'monetization_on',
        label: 'Billable time',
        value: `${billableHours.toFixed(0)}h (${billablePercent}%) / ${nonBillableHours.toFixed(0)}h non-billable`,
        tooltip: 'Billable hours vs non-billable hours'
      });
    }

    return stats;
  }

  private calculateTotalBillableHours(): number {
    if (!this.report?.projectBreakdown) return 0;
    return this.report.projectBreakdown.reduce((sum, project) => sum + project.billableHours, 0);
  }

  private analyzeProblematicDays(): void {
    if (!this.report?.dailyBreakdown) return;

    // Separate into deficit and surplus days (only work days)
    const workDaysWithImpact: DayWithImpact[] = this.report.dailyBreakdown
      .filter(day => day.dayType === 'WorkDay' && day.overtimeHours !== 0)
      .map(day => ({
        ...day,
        impact: Math.abs(day.overtimeHours)
      }));

    // Sort by impact (highest impact first)
    const sortedByImpact = workDaysWithImpact.sort((a, b) => b.impact - a.impact);

    // Separate deficit and surplus
    this.topDeficitDays = sortedByImpact
      .filter(day => day.overtimeHours < 0)
      .slice(0, this.showAllDeficitDays ? undefined : this.PREVIEW_LIMIT);

    this.topSurplusDays = sortedByImpact
      .filter(day => day.overtimeHours > 0)
      .slice(0, this.showAllSurplusDays ? undefined : this.PREVIEW_LIMIT);
  }

  private analyzeTopProjects(): void {
    if (!this.report?.projectBreakdown) return;

    // Sort by total hours (descending)
    const sorted = [...this.report.projectBreakdown].sort((a, b) => b.totalHours - a.totalHours);
    
    this.topProjects = this.showAllProjects 
      ? sorted 
      : sorted.slice(0, this.PREVIEW_LIMIT);
  }

  private findIncompleteDays(): void {
    if (!this.report?.dailyBreakdown) return;

    // Find work days with very few hours or no entries
    this.incompleteDays = this.report.dailyBreakdown.filter(day => 
      day.dayType === 'WorkDay' && 
      (day.actualHours < this.INCOMPLETE_THRESHOLD || day.timeEntriesCount === 0)
    );
  }

  // Formatting helpers
  formatHours(hours: number): string {
    const sign = hours >= 0 ? '+' : '';
    return `${sign}${hours.toFixed(1)}h`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getOvertimeStatus(): string {
    if (!this.report) return '';
    const hours = this.hasPayoffs ? this.adjustedOvertimeHours : this.report.overtimeHours;
    if (hours > 5) return 'Well ahead';
    if (hours > 0) return 'Ahead';
    if (hours === 0) return 'On track';
    if (hours > -5) return 'Slightly behind';
    return 'Behind';
  }

  getOvertimeIcon(): string {
    if (!this.report) return 'schedule';
    const hours = this.hasPayoffs ? this.adjustedOvertimeHours : this.report.overtimeHours;
    if (hours > 0) return 'trending_up';
    if (hours === 0) return 'trending_flat';
    return 'trending_down';
  }

  getProjectBarWidth(project: ProjectBreakdown): string {
    if (!this.report || this.report.totalWorkedHours === 0) return '0%';
    return `${project.percentageOfTotal}%`;
  }

  toggleDeficitDays(): void {
    this.showAllDeficitDays = !this.showAllDeficitDays;
    this.analyzeProblematicDays();
  }

  toggleSurplusDays(): void {
    this.showAllSurplusDays = !this.showAllSurplusDays;
    this.analyzeProblematicDays();
  }

  toggleProjects(): void {
    this.showAllProjects = !this.showAllProjects;
    this.analyzeTopProjects();
  }

  getTotalDeficitDays(): number {
    if (!this.report?.dailyBreakdown) return 0;
    return this.report.dailyBreakdown.filter(day => 
      day.dayType === 'WorkDay' && day.overtimeHours < 0
    ).length;
  }

  getTotalSurplusDays(): number {
    if (!this.report?.dailyBreakdown) return 0;
    return this.report.dailyBreakdown.filter(day => 
      day.dayType === 'WorkDay' && day.overtimeHours > 0
    ).length;
  }

  getTotalProjects(): number {
    return this.report?.projectBreakdown?.length || 0;
  }
}
