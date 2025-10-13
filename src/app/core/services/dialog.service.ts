import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Opens a confirmation dialog
   * @param message The message to display
   * @param title Optional title (defaults to "Confirm Action")
   * @param confirmText Optional confirm button text (defaults to "Confirm")
   * @param cancelText Optional cancel button text (defaults to "Cancel")
   * @param type Optional dialog type: 'info' | 'warning' | 'danger' (defaults to 'info')
   * @returns Observable<boolean> - true if confirmed, false if cancelled
   */
  confirm(
    message: string,
    title?: string,
    confirmText?: string,
    cancelText?: string,
    type?: 'info' | 'warning' | 'danger'
  ): Observable<boolean> {
    const data: ConfirmDialogData = {
      message,
      title,
      confirmText,
      cancelText,
      type: type || 'info'
    };

    const config: MatDialogConfig = {
      data,
      width: '400px',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      panelClass: 'custom-dialog-container'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, config);
    return dialogRef.afterClosed();
  }

  /**
   * Opens a delete confirmation dialog with danger styling
   * @param message The message to display
   * @param title Optional title (defaults to "Confirm Delete")
   * @returns Observable<boolean> - true if confirmed, false if cancelled
   */
  confirmDelete(message: string, title?: string): Observable<boolean> {
    return this.confirm(
      message,
      title || 'Confirm Delete',
      'Delete',
      'Cancel',
      'danger'
    );
  }

  /**
   * Opens a warning confirmation dialog
   * @param message The message to display
   * @param title Optional title (defaults to "Warning")
   * @returns Observable<boolean> - true if confirmed, false if cancelled
   */
  confirmWarning(message: string, title?: string): Observable<boolean> {
    return this.confirm(
      message,
      title || 'Warning',
      'Continue',
      'Cancel',
      'warning'
    );
  }
}
