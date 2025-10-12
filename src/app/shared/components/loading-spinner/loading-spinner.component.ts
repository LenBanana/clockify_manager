import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-spinner-container">
      <div class="spinner"></div>
      <p *ngIf="message" class="loading-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(63, 81, 181, 0.2);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-message {
      margin-top: var(--spacing-md);
      color: rgba(0, 0, 0, 0.6);
      font-size: var(--font-size-sm);
    }

    :host-context(.dark-theme) .loading-message {
      color: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message: string = 'Loading...';
}
