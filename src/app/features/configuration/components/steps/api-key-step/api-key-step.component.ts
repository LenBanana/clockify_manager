import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ClockifyService } from '../../../../../core/services/clockify.service';
import { ConfigService } from '../../../../../core/services/config.service';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-api-key-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  template: `
    <div class="api-key-container">
      <h3>Enter Your Clockify API Key</h3>
      <p class="step-description">
        You can find your API key in Clockify under: Profile Settings → API
      </p>
      
      <form [formGroup]="apiKeyForm" class="api-key-form">
        <mat-form-field appearance="outline">
          <mat-label>API Key</mat-label>
          <input 
            matInput 
            type="password" 
            formControlName="apiKey"
            placeholder="Enter your Clockify API key"
            autocomplete="off"
          />
          <mat-icon matSuffix>key</mat-icon>
          <mat-error *ngIf="apiKeyForm.get('apiKey')?.hasError('required')">
            API key is required
          </mat-error>
          <mat-error *ngIf="apiKeyForm.get('apiKey')?.hasError('minlength')">
            API key seems too short
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Base URL (optional)</mat-label>
          <input 
            matInput 
            type="text" 
            formControlName="baseUrl"
            placeholder="https://api.clockify.me/api/v1"
          />
          <mat-icon matSuffix>link</mat-icon>
          <mat-hint>Use eu1.clockify.me for EU region, or leave default</mat-hint>
          <mat-error *ngIf="apiKeyForm.get('baseUrl')?.hasError('pattern')">
            Must be a valid URL
          </mat-error>
        </mat-form-field>

        <button 
          mat-raised-button 
          color="primary" 
          type="button"
          (click)="validateApiKey()"
          [disabled]="!apiKeyForm.valid || validating"
          class="validate-button"
        >
          <mat-icon>check_circle</mat-icon>
          {{ validating ? 'Validating...' : 'Validate API Key' }}
        </button>
      </form>

      <app-loading-spinner 
        *ngIf="validating" 
        message="Validating API key..."
      ></app-loading-spinner>

      <app-error-message 
        *ngIf="error" 
        [error]="error"
        title="Validation Failed"
        [retryable]="true"
        [onRetry]="validateApiKey.bind(this)"
      ></app-error-message>

      <div class="success-message" *ngIf="validated">
        <mat-icon>check_circle</mat-icon>
        <span>API key validated successfully!</span>
      </div>

      <div class="help-section">
        <h4>How to get your API key:</h4>
        <ol>
          <li>Log in to <a href="https://app.clockify.me" target="_blank">Clockify</a></li>
          <li>Click on your profile picture in the top right</li>
          <li>Select "Profile settings"</li>
          <li>Scroll down to "API" section</li>
          <li>Click "Generate" or copy existing key</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .api-key-container {
      max-width: 600px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    h3 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    .step-description {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: var(--spacing-lg);
    }

    .api-key-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .validate-button {
      align-self: flex-start;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: #e8f5e9;
      border-left: 4px solid var(--success-color);
      border-radius: var(--border-radius-sm);
      margin: var(--spacing-md) 0;
    }

    .success-message mat-icon {
      color: var(--success-color);
    }

    .help-section {
      margin-top: var(--spacing-xl);
      padding: var(--spacing-md);
      background-color: #f5f5f5;
      border-radius: var(--border-radius-sm);
    }

    .help-section h4 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    .help-section ol {
      margin: 0;
      padding-left: var(--spacing-lg);
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.8;
    }

    .help-section a {
      color: var(--primary-color);
      text-decoration: none;
    }

    .help-section a:hover {
      text-decoration: underline;
    }

    :host-context(.dark-theme) h3,
    :host-context(.dark-theme) .help-section h4 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .step-description,
    :host-context(.dark-theme) .help-section ol {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .help-section {
      background-color: #424242;
    }

    :host-context(.dark-theme) .success-message {
      background-color: #2d4a2f;
    }
  `]
})
export class ApiKeyStepComponent implements OnInit {
  @Output() apiKeyValidated = new EventEmitter<{ apiKey: string; baseUrl: string }>();

  apiKeyForm: FormGroup;
  validating = false;
  validated = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private clockifyService: ClockifyService,
    private configService: ConfigService
  ) {
    this.apiKeyForm = this.fb.group({
      apiKey: ['', [Validators.required, Validators.minLength(20)]],
      baseUrl: [
        'https://api.clockify.me/api/v1',
        [Validators.pattern(/^https?:\/\/.+/)]
      ]
    });
  }

  ngOnInit(): void {
    // Pre-fill from existing config if available
    const config = this.configService.getCurrentConfig();
    if (config.clockify.api_key) {
      this.apiKeyForm.patchValue({
        apiKey: config.clockify.api_key,
        baseUrl: config.clockify.base_url
      });
    }
  }

  async validateApiKey(): Promise<void> {
    if (!this.apiKeyForm.valid) {
      return;
    }

    this.validating = true;
    this.validated = false;
    this.error = null;

    const apiKey = this.apiKeyForm.value.apiKey;
    const baseUrl = this.apiKeyForm.value.baseUrl;

    try {
      // Try to validate the API key by fetching workspaces
      await firstValueFrom(this.clockifyService.validateApiKey(apiKey));
      
      // Update config with new API key and base URL
      const config = this.configService.getCurrentConfig();
      config.clockify.api_key = apiKey;
      config.clockify.base_url = baseUrl;
      
      // Save to config service (in memory, not persisted yet)
      // This ensures the workspace step can access it
      this.configService['configSubject'].next(config);
      
      this.validated = true;
      this.validating = false;
      
      // Emit validation success
      this.apiKeyValidated.emit({ apiKey, baseUrl });
    } catch (err: any) {
      this.validated = false;
      this.validating = false;
      this.error = err.message || 'Failed to validate API key. Please check and try again.';
    }
  }

  get isValid(): boolean {
    return this.validated && this.apiKeyForm.valid;
  }
}
