import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container" *ngIf="error">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h3 class="error-title">{{ title }}</h3>
        <p class="error-message">{{ error }}</p>
        <button *ngIf="retryable" class="retry-button" (click)="onRetry()">
          Try Again
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: #ffebee;
      border-left: 4px solid var(--warn-color);
      border-radius: var(--border-radius-sm);
      margin: var(--spacing-md) 0;
    }

    .error-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-md);
      font-weight: 500;
      color: #c62828;
    }

    .error-message {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-sm);
      color: #d32f2f;
      line-height: 1.5;
    }

    .retry-button {
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--warn-color);
      color: white;
      border: none;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      font-size: var(--font-size-sm);
      font-weight: 500;
      transition: background-color var(--transition-fast);
    }

    .retry-button:hover {
      background-color: #d32f2f;
    }

    :host-context(.dark-theme) .error-container {
      background-color: #4a2626;
      border-left-color: #ef5350;
    }

    :host-context(.dark-theme) .error-title,
    :host-context(.dark-theme) .error-message {
      color: #ffcdd2;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() error: string | null = null;
  @Input() title: string = 'Error';
  @Input() retryable: boolean = false;
  @Input() onRetry: () => void = () => {};
}
