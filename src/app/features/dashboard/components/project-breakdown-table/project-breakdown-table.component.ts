import { Component, Input, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProjectBreakdown } from '../../../../core/models/overtime.model';

/**
 * Project breakdown table showing aggregated time per project
 */
@Component({
  selector: 'app-project-breakdown-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card class="breakdown-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>work_outline</mat-icon>
        <mat-card-title>Project Breakdown</mat-card-title>
        <mat-card-subtitle>Time distribution across projects</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="projectBreakdown && projectBreakdown.length > 0" class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="project-table">
            
            <!-- Project Name Column -->
            <ng-container matColumnDef="projectName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Project</th>
              <td mat-cell *matCellDef="let project">
                <div class="project-cell">
                  <div class="project-name">{{ project.projectName || 'No Project' }}</div>
                  <div *ngIf="project.clientName" class="client-name">{{ project.clientName }}</div>
                </div>
              </td>
            </ng-container>

            <!-- Total Hours Column -->
            <ng-container matColumnDef="totalHours">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Total Hours</th>
              <td mat-cell *matCellDef="let project">
                <span class="hours-value">{{ project.totalHours.toFixed(2) }}h</span>
              </td>
            </ng-container>

            <!-- Billable Hours Column -->
            <ng-container matColumnDef="billableHours">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Billable</th>
              <td mat-cell *matCellDef="let project">
                <span class="hours-value billable">{{ project.billableHours.toFixed(2) }}h</span>
              </td>
            </ng-container>

            <!-- Non-Billable Hours Column -->
            <ng-container matColumnDef="nonBillableHours">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Non-Billable</th>
              <td mat-cell *matCellDef="let project">
                <span class="hours-value non-billable">{{ project.nonBillableHours.toFixed(2) }}h</span>
              </td>
            </ng-container>

            <!-- Percentage Column -->
            <ng-container matColumnDef="percentage">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>% of Total</th>
              <td mat-cell *matCellDef="let project">
                <div class="percentage-cell">
                  <span class="percentage-value">{{ project.percentageOfTotal.toFixed(1) }}%</span>
                  <mat-progress-bar 
                    mode="determinate" 
                    [value]="project.percentageOfTotal"
                    class="percentage-bar"
                  ></mat-progress-bar>
                </div>
              </td>
            </ng-container>

            <!-- Entry Count Column -->
            <ng-container matColumnDef="entryCount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Entries</th>
              <td mat-cell *matCellDef="let project">
                <span class="entries-badge">{{ project.entryCount }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          <mat-paginator 
            [pageSizeOptions]="[10, 25, 50]"
            [pageSize]="25"
            showFirstLastButtons
          ></mat-paginator>
        </div>

        <!-- No Data State -->
        <div *ngIf="!projectBreakdown || projectBreakdown.length === 0" class="no-data">
          <mat-icon>folder_off</mat-icon>
          <p>No project breakdown data available for the selected period</p>
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
      color: var(--tertiary, #7d5260);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .project-table {
      width: 100%;
      background: var(--surface, #fffbfe);
    }

    .dark-theme .project-table {
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

    .project-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .project-name {
      font-weight: 500;
      color: var(--on-surface, #1c1b1f);
    }

    .dark-theme .project-name {
      color: var(--on-surface, #e6e1e5);
    }

    .client-name {
      font-size: 12px;
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .client-name {
      color: var(--on-surface-variant, #cac4d0);
    }

    .hours-value {
      font-weight: 500;
      color: var(--on-surface, #1c1b1f);
    }

    .dark-theme .hours-value {
      color: var(--on-surface, #e6e1e5);
    }

    .hours-value.billable {
      color: var(--success, #2e7d32);
      font-weight: 600;
    }

    .hours-value.non-billable {
      color: var(--on-surface-variant, #49454f);
    }

    .dark-theme .hours-value.non-billable {
      color: var(--on-surface-variant, #cac4d0);
    }

    .percentage-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 100px;
    }

    .percentage-value {
      font-weight: 600;
      color: var(--primary, #6750a4);
    }

    .percentage-bar {
      height: 4px;
      border-radius: 2px;
    }

    .entries-badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--tertiary-container, #ffd8e4);
      color: var(--on-tertiary-container, #31111d);
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .dark-theme .entries-badge {
      background: var(--tertiary-container, #633b48);
      color: var(--on-tertiary-container, #ffd8e4);
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
export class ProjectBreakdownTableComponent implements AfterViewInit, OnChanges {
  @Input() projectBreakdown: ProjectBreakdown[] | null = null;
  @Input() loading = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<ProjectBreakdown>([]);
  displayedColumns: string[] = ['projectName', 'totalHours', 'billableHours', 'nonBillableHours', 'percentage', 'entryCount'];

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectBreakdown'] && this.projectBreakdown) {
      this.dataSource.data = this.projectBreakdown;
    }
  }
}
