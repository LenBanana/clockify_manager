import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { VacationDay, VacationRange } from '../../../../core/models/holiday.model';
import { HolidayService } from '../../../../core/services/holiday.service';
import { AddVacationDialogComponent } from '../add-vacation-dialog/add-vacation-dialog.component';

/**
 * Component displaying vacation days grouped by ranges in an expandable list
 * Allows editing and deleting entire ranges or individual days
 */
@Component({
  selector: 'app-vacation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  template: `
    <div class="vacation-list">
      <!-- Filters -->
      <div class="filters">
        <mat-form-field class="search-field">
          <mat-label>Search</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Search by description">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field class="type-filter">
          <mat-label>Type</mat-label>
          <mat-select [(value)]="selectedType" (selectionChange)="applyTypeFilter()">
            <mat-option value="all">All Types</mat-option>
            <mat-option value="Vacation">Vacation</mat-option>
            <mat-option value="SickDay">Sick Day</mat-option>
            <mat-option value="PersonalDay">Personal Day</mat-option>
            <mat-option value="Training">Training</mat-option>
            <mat-option value="BusinessTrip">Business Trip</mat-option>
            <mat-option value="Saldo">Saldo</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Ranges List -->
      <div class="ranges-container" *ngIf="filteredRanges.length > 0">
        <mat-accordion>
          <mat-expansion-panel *ngFor="let range of filteredRanges" class="range-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <div class="range-header">
                  <mat-chip [class]="getChipClass(range.dayType)">
                    {{ getTypeLabel(range.dayType) }}
                  </mat-chip>
                  <div class="range-info">
                    <span class="range-date">
                      {{ formatDate(range.startDate) }}
                      <span *ngIf="range.dayCount > 1">- {{ formatDate(range.endDate) }}</span>
                    </span>
                    <span class="range-count">({{ range.dayCount }} day{{ range.dayCount > 1 ? 's' : '' }})</span>
                  </div>
                  <div class="range-description" *ngIf="range.description">
                    {{ range.description }}
                  </div>
                </div>
              </mat-panel-title>
              <mat-panel-description>
                <div class="range-actions" (click)="$event.stopPropagation()">
                  <button 
                    mat-icon-button 
                    color="primary"
                    (click)="editRange(range)"
                    matTooltip="Edit range">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="warn"
                    (click)="deleteRange(range)"
                    matTooltip="Delete entire range">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <!-- Individual Days in Range -->
            <div class="days-table">
              <table mat-table [dataSource]="range.days" class="days-detail-table">
                <!-- Date Column -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let day">
                    <div class="date-cell">
                      <div class="date-display">{{ formatDate(day.date) }}</div>
                      <div class="day-of-week">{{ getDayOfWeek(day.date) }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Hours Column (for BusinessTrip) -->
                <ng-container matColumnDef="workedHours">
                  <th mat-header-cell *matHeaderCellDef>Hours</th>
                  <td mat-cell *matCellDef="let day">
                    <span *ngIf="day.dayType === 'BusinessTrip'">
                      {{ day.workedHours || 0 }}h
                    </span>
                    <span *ngIf="day.dayType !== 'BusinessTrip'">—</span>
                  </td>
                </ng-container>

                <!-- Individual Day Actions -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let day">
                    <button 
                      mat-icon-button 
                      color="primary"
                      (click)="editSingleDay(day)"
                      matTooltip="Edit this day only"
                      [disabled]="range.dayCount === 1">
                      <mat-icon>edit_note</mat-icon>
                    </button>
                    <button 
                      mat-icon-button 
                      color="warn"
                      (click)="deleteSingleDay(day, range)"
                      matTooltip="Delete this day only"
                      [disabled]="range.dayCount === 1">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="dayColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: dayColumns;"></tr>
              </table>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredRanges.length === 0">
        <mat-icon>event_busy</mat-icon>
        <p>No vacation days found</p>
        <p class="hint">{{ selectedType !== 'all' ? 'Try a different filter' : 'Add your first vacation day to get started' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .vacation-list {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .filters {
      flex: 0 0 auto;
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .type-filter {
      min-width: 150px;
    }

    .ranges-container {
      flex: 1;
      overflow: auto;
    }

    .range-panel {
      margin-bottom: var(--spacing-sm);
    }

    .range-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex: 1;
    }

    .range-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .range-date {
      font-weight: 500;
    }

    .range-count {
      font-size: 0.875rem;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .range-count {
      color: #cac4d0;
    }

    .range-description {
      font-style: italic;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .range-description {
      color: #cac4d0;
    }

    .range-actions {
      display: flex;
      gap: var(--spacing-xs);
    }

    .days-table {
      margin-top: var(--spacing-md);
    }

    .days-detail-table {
      width: 100%;
    }

    .date-cell {
      display: flex;
      flex-direction: column;
    }

    .date-display {
      font-weight: 500;
    }

    .day-of-week {
      font-size: 0.75rem;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .day-of-week {
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

    .business-trip-chip {
      background: var(--business-trip-color, #e0f2f1) !important;
    }

    .saldo-chip {
      background: var(--saldo-color, #ffe0b2) !important;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--text-secondary, rgba(0,0,0,0.6));
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.3;
      margin-bottom: var(--spacing-md);
    }

    .hint {
      font-size: 0.875rem;
      margin-top: var(--spacing-xs);
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
      }

      .search-field,
      .type-filter {
        width: 100%;
      }

      .range-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class VacationListComponent implements OnInit, OnChanges {
  @Input() vacationDays: VacationDay[] = [];
  @Output() vacationDeleted = new EventEmitter<void>();
  @Output() vacationEdited = new EventEmitter<void>();

  ranges: VacationRange[] = [];
  filteredRanges: VacationRange[] = [];
  selectedType = 'all';
  filterText = '';
  dayColumns: string[] = ['date', 'workedHours', 'actions'];

  constructor(
    private holidayService: HolidayService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vacationDays']) {
      this.loadRanges();
    }
  }

  loadRanges(): void {
    this.holidayService.getVacationRanges().subscribe({
      next: (ranges) => {
        this.ranges = ranges;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading vacation ranges:', error);
        this.snackBar.open('Failed to load vacation ranges', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  applyTypeFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.ranges];

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(r => r.dayType === this.selectedType);
    }

    // Filter by text
    if (this.filterText) {
      filtered = filtered.filter(r => 
        r.description?.toLowerCase().includes(this.filterText) ||
        r.startDate.includes(this.filterText) ||
        r.endDate.includes(this.filterText)
      );
    }

    this.filteredRanges = filtered;
  }

  editRange(range: VacationRange): void {
    // For editing a range, pass both start and end dates
    const dialogRef = this.dialog.open(AddVacationDialogComponent, {
      width: '500px',
      data: {
        mode: 'edit-range',
        date: new Date(range.startDate),
        endDate: range.dayCount > 1 ? new Date(range.endDate) : undefined,
        dayType: range.dayType,
        description: range.description,
        workedHours: range.workedHours,
        billable: range.billable,
        rangeId: range.rangeId
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // Reload ranges after edit
        this.loadRanges();
        this.vacationEdited.emit();
      }
    });
  }

  deleteRange(range: VacationRange): void {
    const message = range.dayCount === 1
      ? `Delete vacation day on ${this.formatDate(range.startDate)}?`
      : `Delete ${range.dayCount} vacation days from ${this.formatDate(range.startDate)} to ${this.formatDate(range.endDate)}?`;

    if (confirm(message)) {
      this.holidayService.deleteVacationRange(range.rangeId).subscribe({
        next: () => {
          this.snackBar.open('Vacation range deleted successfully', 'Close', { duration: 3000 });
          this.loadRanges();
          this.vacationDeleted.emit();
        },
        error: (error) => {
          console.error('Error deleting vacation range:', error);
          this.snackBar.open('Failed to delete vacation range', 'Close', { duration: 3000 });
        }
      });
    }
  }

  editSingleDay(day: VacationDay): void {
    const dialogRef = this.dialog.open(AddVacationDialogComponent, {
      width: '500px',
      data: {
        mode: 'edit',
        date: new Date(day.date),
        dayType: day.dayType,
        description: day.description,
        workedHours: day.workedHours,
        billable: day.billable
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loadRanges();
        this.vacationEdited.emit();
      }
    });
  }

  deleteSingleDay(day: VacationDay, range: VacationRange): void {
    if (confirm(`Delete vacation day on ${this.formatDate(day.date)}?`)) {
      this.holidayService.deleteVacationDay(day.date).subscribe({
        next: () => {
          this.snackBar.open('Vacation day deleted successfully', 'Close', { duration: 3000 });
          this.loadRanges();
          this.vacationDeleted.emit();
        },
        error: (error) => {
          console.error('Error deleting vacation day:', error);
          this.snackBar.open('Failed to delete vacation day', 'Close', { duration: 3000 });
        }
      });
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  getDayOfWeek(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Vacation': 'Vacation',
      'SickDay': 'Sick Day',
      'PersonalDay': 'Personal',
      'Training': 'Training',
      'BusinessTrip': 'Business Trip',
      'Saldo': 'Saldo'
    };
    return labels[type] || type;
  }

  getChipClass(type: string): string {
    const classes: Record<string, string> = {
      'Vacation': 'vacation-chip',
      'SickDay': 'sick-chip',
      'PersonalDay': 'personal-chip',
      'Training': 'training-chip',
      'BusinessTrip': 'business-trip-chip',
      'Saldo': 'saldo-chip'
    };
    return classes[type] || '';
  }
}
