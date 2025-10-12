import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { VacationListComponent } from '../vacation-list/vacation-list.component';
import { VacationStatisticsComponent } from '../vacation-statistics/vacation-statistics.component';
import { VacationTimelineComponent } from '../vacation-timeline/vacation-timeline.component';
import { DayDetailSidebarComponent } from '../day-detail-sidebar/day-detail-sidebar.component';
import { AddVacationDialogComponent } from '../add-vacation-dialog/add-vacation-dialog.component';
import { HolidayService } from '../../../../core/services/holiday.service';
import { VacationDay } from '../../../../core/models/holiday.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Main vacation management component
 * Provides tabbed interface for calendar view, list view, and statistics
 */
@Component({
  selector: 'app-vacation-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSidenavModule,
    CalendarViewComponent,
    VacationListComponent,
    VacationStatisticsComponent,
    VacationTimelineComponent,
    DayDetailSidebarComponent,
  ],
  template: `
    <div class="vacation-manager">
      <mat-sidenav-container class="vacation-container">
        <!-- Main Content -->
        <mat-sidenav-content>
          <div class="header">
            <div class="title-section">
              <h1>
                <mat-icon>event</mat-icon>
                Vacation Management
              </h1>
              <p class="subtitle">Manage your vacation days, sick leave, and time off</p>
            </div>
            <button mat-raised-button color="primary" (click)="openAddVacationDialog()">
              <mat-icon>add</mat-icon>
              Add Vacation Day
            </button>
          </div>

          <mat-tab-group class="vacation-tabs" (selectedIndexChange)="onTabChange($event)">
            <!-- Calendar View Tab -->
            <mat-tab label="Calendar View">
              <ng-template matTabContent>
                <div class="tab-content">
                  <app-calendar-view
                    [vacationDays]="vacationDays"
                    (daySelected)="onDaySelected($event)"
                    (vacationAdded)="onVacationAdded()"
                  ></app-calendar-view>
                </div>
              </ng-template>
            </mat-tab>

            <!-- List View Tab -->
            <mat-tab label="List View">
              <ng-template matTabContent>
                <div class="tab-content">
                  <app-vacation-list
                    [vacationDays]="vacationDays"
                    (vacationDeleted)="onVacationDeleted()"
                    (vacationEdited)="onVacationEdited()"
                  ></app-vacation-list>
                </div>
              </ng-template>
            </mat-tab>

            <!-- Statistics Tab -->
            <mat-tab label="Statistics">
              <ng-template matTabContent>
                <div class="tab-content">
                  <app-vacation-statistics
                    [vacationDays]="vacationDays"
                  ></app-vacation-statistics>
                </div>
              </ng-template>
            </mat-tab>

            <!-- Timeline Tab -->
            <mat-tab label="Timeline">
              <ng-template matTabContent>
                <div class="tab-content">
                  <app-vacation-timeline
                    [vacationDays]="vacationDays"
                  ></app-vacation-timeline>
                </div>
              </ng-template>
            </mat-tab>
          </mat-tab-group>
        </mat-sidenav-content>

        <!-- Day Detail Sidebar -->
        <mat-sidenav
          #detailSidebar
          position="end"
          mode="over"
          class="detail-sidebar"
          [opened]="sidebarOpened"
        >
          <app-day-detail-sidebar
            [selectedDate]="selectedDate"
            [selectedRangeId]="selectedRangeId"
            (close)="closeSidebar()"
            (vacationAdded)="onVacationAdded()"
          ></app-day-detail-sidebar>
        </mat-sidenav>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .vacation-manager {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .vacation-container {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    mat-sidenav-content {
      display: flex;
      flex-direction: column;
    }

    .header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      background: white;
      border-bottom: 1px solid rgba(0,0,0,0.12);
    }

    :host-context(.dark-theme) .header {
      background: #1d1b20;
      border-bottom-color: #424242;
    }

    .title-section h1 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0 0 var(--spacing-xs) 0;
      font-size: 1.75rem;
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .title-section h1 {
      color: #e6e1e5;
    }

    .title-section .subtitle {
      margin: 0;
      color: rgba(0,0,0,0.6);
      font-size: 0.875rem;
    }

    :host-context(.dark-theme) .title-section .subtitle {
      color: #cac4d0;
    }

    .vacation-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .vacation-tabs ::ng-deep .mat-mdc-tab-body-wrapper {
      flex: 1;
      overflow: hidden;
    }

    .vacation-tabs ::ng-deep .mat-mdc-tab-body {
      overflow: hidden;
    }

    .vacation-tabs ::ng-deep .mat-mdc-tab-body-content {
      height: 100%;
      overflow: hidden;
    }

    .tab-content {
      padding: var(--spacing-lg);
      height: 100%;
      overflow-y: auto;
    }

    .detail-sidebar {
      width: 400px;
      max-width: 90vw;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .header button {
        width: 100%;
      }
    }
  `]
})
export class VacationManagerComponent implements OnInit {
  vacationDays: VacationDay[] = [];
  selectedDate: Date | null = null;
  selectedRangeId: string | undefined = undefined;
  sidebarOpened = false;
  activeTabIndex = 0;

  constructor(
    private holidayService: HolidayService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVacationDays();
  }

  loadVacationDays(): void {
    this.holidayService.getVacationDays().subscribe({
      next: (days) => {
        this.vacationDays = days;
        console.log('Loaded vacation days:', days.length);
      },
      error: (error) => {
        console.error('Error loading vacation days:', error);
        this.snackBar.open('Failed to load vacation days', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  openAddVacationDialog(): void {
    const dialogRef = this.dialog.open(AddVacationDialogComponent, {
      width: '500px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onVacationAdded();
      }
    });
  }

  onDaySelected(event: {date: Date, rangeId?: string}): void {
    // Force sidebar to close first if already open, then reopen with new data
    // This ensures ngOnChanges fires even when selecting the same day
    if (this.sidebarOpened) {
      this.sidebarOpened = false;
      // Use setTimeout to ensure the sidebar closes before reopening
      setTimeout(() => {
        this.selectedDate = event.date;
        this.selectedRangeId = event.rangeId;
        this.sidebarOpened = true;
      }, 0);
    } else {
      this.selectedDate = event.date;
      this.selectedRangeId = event.rangeId;
      this.sidebarOpened = true;
    }
  }

  closeSidebar(): void {
    this.sidebarOpened = false;
    this.selectedDate = null;
    this.selectedRangeId = undefined;
  }

  onVacationAdded(): void {
    this.loadVacationDays();
    this.snackBar.open('Vacation day added successfully', 'Close', {
      duration: 3000,
    });
  }

  onVacationDeleted(): void {
    this.loadVacationDays();
    this.snackBar.open('Vacation day deleted successfully', 'Close', {
      duration: 3000,
    });
  }

  onVacationEdited(): void {
    this.loadVacationDays();
    this.snackBar.open('Vacation day updated successfully', 'Close', {
      duration: 3000,
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    // Close sidebar when switching tabs
    if (this.sidebarOpened) {
      this.closeSidebar();
    }
  }
}
