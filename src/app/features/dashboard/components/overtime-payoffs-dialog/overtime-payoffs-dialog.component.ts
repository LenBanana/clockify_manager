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
import { OvertimePayoff, OvertimePayoffAllocation } from '../../../../core/models/config.model';
import { DayBreakdown } from '../../../../core/models/overtime.model';
import { OvertimeExportService, AllocationResult } from '../../../../core/services/overtime-export.service';

export interface OvertimePayoffsDialogData {
  payoffs: OvertimePayoff[];
  /** Full daily breakdown for the selected period â€” used for FIFO allocation. */
  dailyBreakdown?: DayBreakdown[];
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
        <div class="payoff-wrapper" *ngFor="let payoff of payoffs">

          <!--  View mode  -->
          <ng-container *ngIf="editingId !== payoff.id">
            <div class="payoff-row">
              <div class="payoff-info">
                <span class="payoff-date">{{ formatDate(payoff.date) }}</span>
                <span class="payoff-description" *ngIf="payoff.description">{{ payoff.description }}</span>
                <span class="allocation-info" *ngIf="payoff.allocations?.length">
                  <mat-icon class="alloc-icon">event_note</mat-icon>
                  {{ payoff.allocations!.length }} Tag{{ payoff.allocations!.length === 1 ? '' : 'e' }}
                  &middot; {{ getAllocationRange(payoff.allocations!) }}
                </span>
              </div>
              <div class="payoff-right">
                <span class="payoff-hours">-{{ payoff.hours.toFixed(1) }}h</span>
                <button
                  mat-icon-button
                  class="action-btn export-btn"
                  [matTooltip]="payoff.allocations?.length ? 'Aufstellung als Excel exportieren' : 'Keine Aufstellung verfügbar - Eintrag bearbeiten um Daten zu generieren'"
                  (click)="exportPayoff(payoff)"
                  [disabled]="!payoff.allocations?.length || exporting"
                >
                  <mat-icon>download</mat-icon>
                </button>
                <button mat-icon-button class="action-btn" matTooltip="Bearbeiten" (click)="startEdit(payoff)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn delete-btn" matTooltip="Entfernen" (click)="deletePayoff(payoff.id)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>

            <!-- Post-add export offer banner -->
            <div class="export-offer" *ngIf="lastAddedPayoffId === payoff.id">
              <mat-icon class="offer-icon">table_view</mat-icon>
              <span class="offer-text">Aufstellung bereit &mdash; jetzt exportieren?</span>
              <button mat-stroked-button color="primary" class="offer-btn" (click)="exportPayoff(payoff)" [disabled]="exporting">
                <mat-icon>download</mat-icon>
                Excel
              </button>
              <button mat-icon-button class="offer-close" matTooltip="SchlieÃŸen" (click)="lastAddedPayoffId = null">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </ng-container>

          <!--  Edit mode  -->
          <ng-container *ngIf="editingId === payoff.id">
            <div class="inline-form">
              <mat-form-field appearance="outline" class="field-date">
                <mat-label>Datum</mat-label>
                <input matInput type="date" [(ngModel)]="form.date" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-hours">
                <mat-label>Stunden</mat-label>
                <input matInput type="number" min="0.1" step="0.5" [(ngModel)]="form.hours" (ngModelChange)="updatePreview()" />
                <mat-icon matSuffix>schedule</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-description">
                <mat-label>Beschreibung (optional)</mat-label>
                <input matInput [(ngModel)]="form.description" placeholder="z.B. Q1 Abrechnung" />
              </mat-form-field>
              <div class="inline-actions">
                <button mat-icon-button color="primary" matTooltip="Speichern" (click)="saveEdit(payoff.id)" [disabled]="!isFormValid()">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Abbrechen" (click)="cancelEdit()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="allocationPreviewTpl"></ng-container>
          </ng-container>

        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-state" *ngIf="!isAdding">
          <mat-icon class="empty-icon">payments</mat-icon>
          <p>Keine Auszahlungen erfasst</p>
        </div>
      </ng-template>

      <mat-divider *ngIf="payoffs.length > 0 || isAdding" class="divider"></mat-divider>

      <!--  Add new payoff form  -->
      <div class="add-form" *ngIf="isAdding">
        <div class="add-form-title">Neue Auszahlung</div>
        <div class="inline-form">
          <mat-form-field appearance="outline" class="field-date">
            <mat-label>Datum</mat-label>
            <input matInput type="date" [(ngModel)]="form.date" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="field-hours">
            <mat-label>Stunden</mat-label>
            <input matInput type="number" min="0.1" step="0.5" [(ngModel)]="form.hours" (ngModelChange)="updatePreview()" />
            <mat-icon matSuffix>schedule</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="field-description">
            <mat-label>Beschreibung (optional)</mat-label>
            <input matInput [(ngModel)]="form.description" placeholder="z.B. Q1 Abrechnung" />
          </mat-form-field>
          <div class="inline-actions">
            <button mat-icon-button color="primary" matTooltip="Hinzufügen" (click)="confirmAdd()" [disabled]="!isFormValid()">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Abbrechen" (click)="cancelAdd()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        <ng-container *ngTemplateOutlet="allocationPreviewTpl"></ng-container>
      </div>

      <!--  Allocation preview (shared template)  -->
      <ng-template #allocationPreviewTpl>
        <div class="allocation-preview" *ngIf="preview">
          <div class="preview-ok" *ngIf="preview.allocations.length > 0 && preview.unallocated === 0">
            <mat-icon class="preview-icon ok">check_circle</mat-icon>
            <span>
              {{ preview.allocations.length }} Tag{{ preview.allocations.length === 1 ? '' : 'e' }}
              zugeordnet ({{ getAllocationRange(preview.allocations) }})
            </span>
          </div>
          <div class="preview-partial" *ngIf="preview.allocations.length > 0 && preview.unallocated > 0">
            <mat-icon class="preview-icon partial">info</mat-icon>
            <span>
              {{ preview.allocations.length }} Tag{{ preview.allocations.length === 1 ? '' : 'e' }}
              gefunden &mdash; <strong>{{ preview.unallocated.toFixed(2) }}h</strong>
              kÃ¶nnen im gewÃ¤hlten Zeitraum nicht zugeordnet werden
            </span>
          </div>
          <div class="preview-empty" *ngIf="preview.allocations.length === 0">
            <mat-icon class="preview-icon warn">warning</mat-icon>
            <span>Keine Ãœberstunden im gewÃ¤hlten Zeitraum gefunden. Zeitraum im Dashboard erweitern.</span>
          </div>
        </div>
      </ng-template>

      <!-- Add button -->
      <button
        mat-stroked-button
        class="add-btn"
        *ngIf="!isAdding && editingId === null"
        (click)="startAdd()"
      >
        <mat-icon>add</mat-icon>
        Auszahlung hinzufügen
      </button>

      <!-- Export error -->
      <div class="export-error" *ngIf="exportError">
        <mat-icon>error_outline</mat-icon>
        <span>Export fehlgeschlagen: {{ exportError }}</span>
        <button mat-icon-button (click)="exportError = null"><mat-icon>close</mat-icon></button>
      </div>
    </mat-dialog-content>

    <mat-divider></mat-divider>

    <mat-dialog-actions class="dialog-actions">
      <div class="total-summary" *ngIf="totalPayoffs > 0">
        <mat-icon>remove_circle_outline</mat-icon>
        <span>Gesamt abgezogen: <strong>{{ totalPayoffs.toFixed(1) }}h</strong></span>
      </div>
      <span class="spacer"></span>
      <button mat-flat-button color="primary" [mat-dialog-close]="payoffs">Fertig</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 500;

      .title-icon { color: var(--primary, #6750a4); }
    }

    .dialog-content {
      min-width: 520px;
      max-width: 640px;
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
      gap: 6px;
    }

    .payoff-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .payoff-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--surface-container-low, #f7f2fa);
      transition: background 0.15s;

      &:hover { background: var(--surface-container, #f3edf7); }
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

    .allocation-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--primary, #6750a4);
      opacity: 0.85;

      .alloc-icon { font-size: 13px; width: 13px; height: 13px; }
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

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .export-btn:not([disabled]) {
      color: #1565c0;
      &:hover { color: #0d47a1; }
    }

    .delete-btn:hover { color: #c62828; }

    /* Post-add export offer */
    .export-offer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-top: 2px;
      border-radius: 8px;
      background: #e3f2fd;
      border-left: 3px solid #1565c0;
      font-size: 13px;
      color: #0d47a1;

      .offer-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; flex-shrink: 0; }
      .offer-text { flex: 1; }
      .offer-btn {
        font-size: 12px;
        height: 30px;
        line-height: 30px;
        padding: 0 10px;
        border-color: #1565c0;
        color: #1565c0;
        mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
      }
      .offer-close {
        width: 28px;
        height: 28px;
        color: #1565c0;
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    /* Allocation preview */
    .allocation-preview { margin: 6px 0 2px; font-size: 12px; }

    .preview-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      vertical-align: middle;
      margin-right: 6px;
      flex-shrink: 0;
      &.ok      { color: #2e7d32; }
      &.partial { color: #e65100; }
      &.warn    { color: #b71c1c; }
    }

    .preview-ok, .preview-partial, .preview-empty {
      display: flex;
      align-items: center;
      border-radius: 6px;
      padding: 6px 10px;
    }
    .preview-ok      { color: #1b5e20; background: #e8f5e9; }
    .preview-partial { color: #bf360c; background: #fff3e0; }
    .preview-empty   { color: #b71c1c; background: #ffebee; }

    /* Inline form */
    .inline-form {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 0 4px;
      width: 100%;
    }

    .field-date { width: 150px; }
    .field-hours { width: 120px; }
    .field-description { flex: 1; min-width: 140px; }

    .inline-actions { display: flex; align-items: center; padding-top: 4px; }

    mat-form-field { font-size: 14px; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 8px;
      color: var(--on-surface-variant, #49454f);

      .empty-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.4; margin-bottom: 8px; }
      p { margin: 0; font-size: 14px; }
    }

    .divider { margin: 16px 0 12px; }

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

    /* Export error */
    .export-error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: #ffebee;
      border-radius: 6px;
      font-size: 13px;
      color: #b71c1c;

      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      span { flex: 1; }
    }

    /* Dialog footer */
    .dialog-actions { display: flex; align-items: center; padding: 12px 24px; }

    .total-summary {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--on-surface-variant, #49454f);

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #c62828; }
      strong { color: #c62828; }
    }

    .spacer { flex: 1; }
  `],
})
export class OvertimePayoffsDialogComponent implements OnInit {
  payoffs: OvertimePayoff[] = [];
  isAdding = false;
  editingId: string | null = null;
  lastAddedPayoffId: string | null = null;
  exporting = false;
  exportError: string | null = null;

  /** Live allocation preview shown beneath the add/edit form */
  preview: AllocationResult | null = null;

  form: { date: string; hours: number | null; description: string } = {
    date: '',
    hours: null,
    description: '',
  };

  constructor(
    public dialogRef: MatDialogRef<OvertimePayoffsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OvertimePayoffsDialogData,
    private exportService: OvertimeExportService,
  ) {}

  ngOnInit(): void {
    // Deep copy including allocations array so we don't mutate the original
    this.payoffs = this.data.payoffs.map(p => ({
      ...p,
      allocations: [...(p.allocations ?? [])],
    }));
  }

  get totalPayoffs(): number {
    return this.payoffs.reduce((sum, p) => sum + p.hours, 0);
  }

  //  Add flow 

  startAdd(): void {
    this.editingId = null;
    this.lastAddedPayoffId = null;
    this.exportError = null;
    this.resetForm();
    this.form.date = new Date().toISOString().slice(0, 10);
    this.isAdding = true;
    this.updatePreview();
  }

  cancelAdd(): void {
    this.isAdding = false;
    this.preview = null;
    this.resetForm();
  }

  confirmAdd(): void {
    if (!this.isFormValid()) return;
    const allocationResult = this.exportService.computeAllocations(
      Number(this.form.hours),
      this.data.dailyBreakdown ?? [],
      this.payoffs,
    );
    const newPayoff: OvertimePayoff = {
      id: crypto.randomUUID(),
      date: this.form.date,
      hours: Number(this.form.hours),
      description: this.form.description.trim(),
      allocations: allocationResult.allocations,
    };
    this.payoffs = [...this.payoffs, newPayoff].sort((a, b) => a.date.localeCompare(b.date));
    this.lastAddedPayoffId = newPayoff.id;
    this.isAdding = false;
    this.preview = null;
    this.resetForm();
  }

  //  Edit flow 

  startEdit(payoff: OvertimePayoff): void {
    this.isAdding = false;
    this.lastAddedPayoffId = null;
    this.exportError = null;
    this.editingId = payoff.id;
    this.form = { date: payoff.date, hours: payoff.hours, description: payoff.description };
    this.updatePreview();
  }

  saveEdit(id: string): void {
    if (!this.isFormValid()) return;
    // Recompute allocations excluding the payoff being edited (replaced)
    const allocationResult = this.exportService.computeAllocations(
      Number(this.form.hours),
      this.data.dailyBreakdown ?? [],
      this.payoffs,
      id,
    );
    this.payoffs = this.payoffs
      .map(p => p.id === id
        ? {
            ...p,
            date: this.form.date,
            hours: Number(this.form.hours),
            description: this.form.description.trim(),
            allocations: allocationResult.allocations,
          }
        : p,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    this.editingId = null;
    this.preview = null;
    this.resetForm();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.preview = null;
    this.resetForm();
  }

  deletePayoff(id: string): void {
    this.payoffs = this.payoffs.filter(p => p.id !== id);
    if (this.lastAddedPayoffId === id) this.lastAddedPayoffId = null;
  }

  //  Allocation preview 

  updatePreview(): void {
    if (!this.form.hours || Number(this.form.hours) <= 0) {
      this.preview = null;
      return;
    }
    const excludeId = this.editingId ?? undefined;
    this.preview = this.exportService.computeAllocations(
      Number(this.form.hours),
      this.data.dailyBreakdown ?? [],
      this.payoffs,
      excludeId,
    );
  }

  //  Excel export 

  async exportPayoff(payoff: OvertimePayoff): Promise<void> {
    if (!payoff.allocations?.length) return;
    this.exporting = true;
    this.exportError = null;
    try {
      await this.exportService.exportAufstellung(payoff);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.exportError = msg;
    } finally {
      this.exporting = false;
    }
  }

  //  Helpers 

  isFormValid(): boolean {
    return !!(this.form.date && this.form.hours && Number(this.form.hours) > 0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getAllocationRange(allocations: OvertimePayoffAllocation[]): string {
    if (!allocations.length) return '';
    const sorted = [...allocations].sort((a, b) => a.date.localeCompare(b.date));
    const first = this.formatDateShort(sorted[0].date);
    const last  = this.formatDateShort(sorted[sorted.length - 1].date);
    return first === last ? first : `${first} - ${last}`;
  }

  private formatDateShort(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  private resetForm(): void {
    this.form = { date: '', hours: null, description: '' };
  }
}

