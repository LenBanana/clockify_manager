import { Component } from '@angular/core';

@Component({
  selector: 'app-welcome-step',
  template: `
    <div class="welcome-container">
      <div class="welcome-icon">🎯</div>
      <h2>Welcome to Clockify Overtime Tracker</h2>
      <p class="welcome-description">
        Track your overtime hours accurately with German labor law compliance.
        This tool integrates with your Clockify account to provide detailed
        overtime calculations, holiday management, and project breakdowns.
      </p>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Overtime Tracking</h3>
          <p>Accurate calculation of work hours vs. expected hours</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🏖️</div>
          <h3>Holiday Management</h3>
          <p>German public holidays and vacation day tracking</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📈</div>
          <h3>Project Insights</h3>
          <p>Detailed breakdown of time per project and client</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Local Storage</h3>
          <p>All data stored locally on your machine</p>
        </div>
      </div>
      
      <p class="next-step-hint">
        Click <strong>Next</strong> to begin the setup process.
      </p>
    </div>
  `,
  styles: [`
    .welcome-container {
      text-align: center;
      padding: var(--spacing-xl);
      max-width: 800px;
      margin: 0 auto;
    }

    .welcome-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-lg);
    }

    h2 {
      font-size: var(--font-size-xxl);
      margin-bottom: var(--spacing-lg);
      color: rgba(0, 0, 0, 0.87);
    }

    .welcome-description {
      font-size: var(--font-size-md);
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: var(--spacing-xl);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .feature-card {
      padding: var(--spacing-md);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: var(--border-radius-md);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: var(--spacing-sm);
    }

    .feature-card h3 {
      font-size: var(--font-size-md);
      margin: var(--spacing-sm) 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .feature-card p {
      font-size: var(--font-size-sm);
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
      line-height: 1.4;
    }

    .next-step-hint {
      font-size: var(--font-size-sm);
      color: rgba(0, 0, 0, 0.6);
      font-style: italic;
    }

    :host-context(.dark-theme) h2,
    :host-context(.dark-theme) .feature-card h3 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .welcome-description,
    :host-context(.dark-theme) .feature-card p,
    :host-context(.dark-theme) .next-step-hint {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .feature-card {
      border-color: rgba(255, 255, 255, 0.12);
    }
  `]
})
export class WelcomeStepComponent {}
