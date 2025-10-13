import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon [class]="'icon-' + data.type">
          @switch (data.type) {
            @case ('warning') { warning }
            @case ('danger') { error }
            @default { info }
          }
        </mat-icon>
        {{ data.title || 'Confirm Action' }}
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <p [innerHTML]="formatMessage(data.message)"></p>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button 
          [color]="data.type === 'danger' ? 'warn' : 'primary'"
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .confirm-dialog {
      min-width: 300px;
      max-width: 500px;
      background-color: var(--surface-container-high, #fff);
      border-radius: 28px;
      overflow: hidden;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px 16px;
      font-size: 20px;
      font-weight: 500;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        
        &.icon-info {
          color: var(--primary-color, #2196F3);
        }
        
        &.icon-warning {
          color: #FF9800;
        }
        
        &.icon-danger {
          color: #F44336;
        }
      }
    }

    .dialog-content {
      padding: 0 24px 20px;
      
      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-color, rgba(0, 0, 0, 0.87));
        white-space: pre-line;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      margin: 0;
      border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
    }

    /* Dark theme support */
    :host-context(.dark-theme) {
      .confirm-dialog {
        background-color: var(--surface-container-high, #2b2930);
      }

      .dialog-content p {
        color: rgba(255, 255, 255, 0.87);
      }
      
      .dialog-actions {
        border-top-color: rgba(255, 255, 255, 0.12);
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default type if not provided
    if (!this.data.type) {
      this.data.type = 'info';
    }
  }

  formatMessage(message: string): string {
    // Convert \n to <br> tags for HTML display
    return message.replace(/\n/g, '<br>');
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
