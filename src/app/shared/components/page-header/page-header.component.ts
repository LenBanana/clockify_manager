import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1 class="header-title">{{ title }}</h1>
        <p *ngIf="subtitle" class="header-subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      margin-bottom: var(--spacing-lg);
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      margin: 0;
      font-size: var(--font-size-xxl);
      font-weight: 400;
      color: rgba(0, 0, 0, 0.87);
    }

    .header-subtitle {
      margin: var(--spacing-xs) 0 0 0;
      font-size: var(--font-size-md);
      color: rgba(0, 0, 0, 0.6);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    :host-context(.dark-theme) .page-header {
      border-bottom-color: rgba(255, 255, 255, 0.12);
    }

    :host-context(.dark-theme) .header-title {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .header-subtitle {
      color: rgba(255, 255, 255, 0.6);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}
