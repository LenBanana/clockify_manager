import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OvertimePayoff } from '../../../../core/models/config.model';

export interface OvertimePayoffsDialogData {
  payoffs: OvertimePayoff[];
}

@Component({
  selector: 'app-overtime-payoffs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">payments</mat-icon>
      Overtime Payoffs
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="dialog-subtitle">
        Record hours paid off by your employer. These are deducted from your overtime balance.
      </p>

      <!-- Existing payoffs list -->
      <div class="payoffs-list" *ngIf="payoffs.length > 0; else emptyState">
        <div
          class="payoff-row"
          *ngFor="let payoff of payoffs; let i = index"
        >
          <!-- View mode -->
          <ng-container *ngIf="editingId !== payoff.id">
            <div class="payoff-info">
              <span class="payoff-date">{{ formatDate(payoff.date) }}</span>
              <span class="payoff-description" *ngIf="payoff.description">{{ payoff.description }}</span>
            </div>
            <div class="payoff-right">
              <span class="payoff-hours">-{{ payoff.hours.toFixed(1) }}h</span>
              <button
                mat-icon-button
                class="action-btn"
                matTooltip="Edit"
                (click)="startEdit(payoff)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                class="action-btn delete-btn"
                matTooltip="Remove"
                (click)="deletePayoff(payoff.id)"
              >
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </ng-container>

          <!-- Edit mode (inline) -->
          <ng-container *ngIf="editingId === payoff.id">
            <div class="inline-form">
              <mat-form-field appearance="outline" class="field-date">
                <mat-label>Date</mat-label>
                <input matInput type="date" [(ngModel)]="form.date" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-hours">
                <mat-label>Hours</mat-label>
                <input matInput type="number" min="0.1" step="0.5" [(ngModel)]="form.hours" />
                <mat-icon matSuffix>schedule</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-description">
                <mat-label>Note (optional)</mat-label>
                <input matInput [(ngModel)]="form.description" placeholder="e.g. Q1 Settlement" />
              </mat-form-field>
              <div class="inline-actions">
                <button mat-icon-button color="primary" matTooltip="Save" (click)="saveEdit(payoff.id)" [disabled]="!isFormValid()">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Cancel" (click)="cancelEdit()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-state" *ngIf="!isAdding">
          <mat-icon class="empty-icon">payments</mat-icon>
          <p>No payoffs recorded yet</p>
        </div>
      </ng-template>

      <mat-divider *ngIf="payoffs.length > 0 || isAdding" class="divider"></mat-divider>

      <!-- Add new payoff form -->
      <div class="add-form" *ngIf="isAdding">
        <div class="add-form-title">New payoff</div>
        <div class="inline-form">
          <mat-form-field appearance="outline" class="field-date">
            <mat-label>Date</mat-label>
            <input matInput type="date" [(ngModel)]="form.date" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="field-hours">
            <mat-label>Hours</mat-label>
            <input matInput type="number" min="0.1" step="0.5" [(ngModel)]="form.hours" />
            <mat-icon matSuffix>schedule</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="field-description">
            <mat-label>Note (optional)</mat-label>
            <input matInput [(ngModel)]="form.description" placeholder="e.g. Q1 Settlement" />
          </mat-form-field>
          <div class="inline-actions">
            <button mat-icon-button color="primary" matTooltip="Add" (click)="confirmAdd()" [disabled]="!isFormValid()">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Cancel" (click)="cancelAdd()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Add button -->
      <button
        mat-stroked-button
        class="add-btn"
        *ngIf="!isAdding && editingId === null"
        (click)="startAdd()"
      >
        <mat-icon>add</mat-icon>
        Add Payoff
      </button>
    </mat-dialog-content>

    <mat-divider></mat-divider>

    <mat-dialog-actions class="dialog-actions">
      <!-- Total summary -->
      <div class="total-summary" *ngIf="totalPayoffs > 0">
        <mat-icon>remove_circle_outline</mat-icon>
        <span>Total deducted: <strong>{{ totalPayoffs.toFixed(1) }}h</strong></span>
      </div>
      <span class="spacer"></span>
      <button mat-flat-button color="primary" [mat-dialog-close]="payoffs">Done</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 500;

      .title-icon {
        color: var(--primary, #6750a4);
      }
    }

    .dialog-content {
      min-width: 480px;
      max-width: 560px;
      padding: 8px 24px 16px;
    }

    .dialog-subtitle {
      margin: 0 0 20px;
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);
      line-height: 1.5;
    }

    .payoffs-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .payoff-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--surface-container-low, #f7f2fa);
      transition: background 0.15s;

      &:hover {
        background: var(--surface-container, #f3edf7);
      }
    }

    .payoff-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .payoff-date {
      font-size: 14px;
      font-weight: 500;
      color: var(--on-surface, #1d1b20);
    }

    .payoff-description {
      font-size: 12px;
      color: var(--on-surface-variant, #49454f);
    }

    .payoff-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .payoff-hours {
      font-size: 15px;
      font-weight: 600;
      color: #c62828;
      min-width: 52px;
      text-align: right;
    }

    .action-btn {
      color: var(--on-surface-variant, #49454f);
      width: 32px;
      height: 32px;
      padding: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .delete-btn:hover {
      color: #c62828;
    }

    .inline-form {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 0 4px;
      width: 100%;
    }

    .field-date {
      width: 140px;
    }

    .field-hours {
      width: 115px;
    }

    .field-description {
      flex: 1;
      min-width: 140px;
    }

    .inline-actions {
      display: flex;
      align-items: center;
      padding-top: 4px;
    }

    mat-form-field {
      font-size: 14px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 8px;
      color: var(--on-surface-variant, #49454f);

      .empty-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        opacity: 0.4;
        margin-bottom: 8px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .divider {
      margin: 16px 0 12px;
    }

    .add-form-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--on-surface-variant, #49454f);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .add-btn {
      margin-top: 8px;
      width: 100%;
      color: var(--primary, #6750a4);
      border-color: var(--outline-variant, #cac4d0);
    }

    .dialog-actions {
      display: flex;
      align-items: center;
      padding: 12px 24px;
    }

    .total-summary {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #c62828;
      }

      strong {
        color: #c62828;
      }
    }

    .spacer {
      flex: 1;
    }
  `]
})
export class OvertimePayoffsDialogComponent implements OnInit {
  payoffs: OvertimePayoff[] = [];
  isAdding = false;
  editingId: string | null = null;

  form: { date: string; hours: number | null; description: string } = {
    date: '',
    hours: null,
    description: '',
  };

  constructor(
    public dialogRef: MatDialogRef<OvertimePayoffsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OvertimePayoffsDialogData
  ) {}

  ngOnInit(): void {
    // Deep copy so we don't mutate the original until Done is clicked
    this.payoffs = this.data.payoffs.map(p => ({ ...p }));
  }

  get totalPayoffs(): number {
    return this.payoffs.reduce((sum, p) => sum + p.hours, 0);
  }

  startAdd(): void {
    this.editingId = null;
    this.resetForm();
    // Prefill with today's date
    const today = new Date();
    this.form.date = today.toISOString().slice(0, 10);
    this.isAdding = true;
  }

  cancelAdd(): void {
    this.isAdding = false;
    this.resetForm();
  }

  confirmAdd(): void {
    if (!this.isFormValid()) return;
    const newPayoff: OvertimePayoff = {
      id: crypto.randomUUID(),
      date: this.form.date,
      hours: Number(this.form.hours),
      description: this.form.description.trim(),
    };
    this.payoffs = [...this.payoffs, newPayoff].sort((a, b) => a.date.localeCompare(b.date));
    this.isAdding = false;
    this.resetForm();
  }

  startEdit(payoff: OvertimePayoff): void {
    this.isAdding = false;
    this.editingId = payoff.id;
    this.form = {
      date: payoff.date,
      hours: payoff.hours,
      description: payoff.description,
    };
  }

  saveEdit(id: string): void {
    if (!this.isFormValid()) return;
    this.payoffs = this.payoffs
      .map(p => p.id === id
        ? { ...p, date: this.form.date, hours: Number(this.form.hours), description: this.form.description.trim() }
        : p
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    this.editingId = null;
    this.resetForm();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  deletePayoff(id: string): void {
    this.payoffs = this.payoffs.filter(p => p.id !== id);
  }

  isFormValid(): boolean {
    return !!(this.form.date && this.form.hours && Number(this.form.hours) > 0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00'); // avoid timezone shift
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private resetForm(): void {
    this.form = { date: '', hours: null, description: '' };
  }
}
