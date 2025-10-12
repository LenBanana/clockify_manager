import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatStepperModule, MatStepperIntl } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { ConfigService } from '../../../../core/services/config.service';
import { AppConfig } from '../../../../core/models/config.model';
import { WelcomeStepComponent } from '../steps/welcome-step/welcome-step.component';
import { ApiKeyStepComponent } from '../steps/api-key-step/api-key-step.component';
import { WorkspaceStepComponent } from '../steps/workspace-step/workspace-step.component';
import { BundeslandStepComponent } from '../steps/bundesland-step/bundesland-step.component';
import { WorkSettingsStepComponent } from '../steps/work-settings-step/work-settings-step.component';
import { EntryDateStepComponent } from '../steps/entry-date-step/entry-date-step.component';

@Component({
  selector: 'app-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule,
    WelcomeStepComponent,
    ApiKeyStepComponent,
    WorkspaceStepComponent,
    BundeslandStepComponent,
    WorkSettingsStepComponent,
    EntryDateStepComponent
  ],
  template: `
    <div class="wizard-container">
      <div class="wizard-header">
        <h1>Initial Setup</h1>
        <p>Let's configure your Clockify Overtime Tracker</p>
      </div>

      <mat-stepper 
        #stepper 
        [linear]="true" 
        class="setup-stepper"
        (selectionChange)="onStepChange($event)"
      >
        <!-- Welcome Step -->
        <mat-step [completed]="true">
          <ng-template matStepLabel>Welcome</ng-template>
          <app-welcome-step></app-welcome-step>
          <div class="step-actions">
            <button mat-raised-button color="primary" matStepperNext>
              Next
            </button>
          </div>
        </mat-step>

        <!-- API Key Step -->
        <mat-step [completed]="apiKeyValid" [editable]="true">
          <ng-template matStepLabel>API Key</ng-template>
          <app-api-key-step 
            (apiKeyValidated)="onApiKeyValidated($event)"
          ></app-api-key-step>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button 
              mat-raised-button 
              color="primary" 
              matStepperNext
              [disabled]="!apiKeyValid"
            >
              Next
            </button>
          </div>
        </mat-step>

        <!-- Workspace Step -->
        <mat-step [completed]="workspaceSelected" [editable]="true">
          <ng-template matStepLabel>Workspace</ng-template>
          <app-workspace-step
            #workspaceStep
            (workspaceSelected)="onWorkspaceSelected($event)"
          ></app-workspace-step>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button 
              mat-raised-button 
              color="primary" 
              matStepperNext
              [disabled]="!workspaceSelected"
            >
              Next
            </button>
          </div>
        </mat-step>

        <!-- Bundesland Step -->
        <mat-step [completed]="bundeslandSelected" [editable]="true">
          <ng-template matStepLabel>Location</ng-template>
          <app-bundesland-step
            (bundeslandSelected)="onBundeslandSelected($event)"
          ></app-bundesland-step>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button 
              mat-raised-button 
              color="primary" 
              matStepperNext
              [disabled]="!bundeslandSelected"
            >
              Next
            </button>
          </div>
        </mat-step>

        <!-- Work Settings Step -->
        <mat-step [completed]="workSettingsValid" [editable]="true">
          <ng-template matStepLabel>Work Settings</ng-template>
          <app-work-settings-step
            (settingsUpdated)="onWorkSettingsUpdated($event)"
          ></app-work-settings-step>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button 
              mat-raised-button 
              color="primary" 
              matStepperNext
              [disabled]="!workSettingsValid"
            >
              Next
            </button>
          </div>
        </mat-step>

        <!-- Entry Date Step -->
        <mat-step [completed]="entryDateConfigured" [editable]="true">
          <ng-template matStepLabel>Entry Date</ng-template>
          <app-entry-date-step
            (entryDateSelected)="onEntryDateSelected($event)"
          ></app-entry-date-step>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button 
              mat-raised-button 
              color="primary" 
              (click)="completeSetup()"
              [disabled]="!canComplete() || saving"
            >
              {{ saving ? 'Saving...' : 'Complete Setup' }}
            </button>
          </div>
        </mat-step>

        <!-- Completion Step -->
        <mat-step>
          <ng-template matStepLabel>Complete</ng-template>
          <div class="completion-container">
            <div class="completion-icon">✅</div>
            <h2>Setup Complete!</h2>
            <p>Your Clockify Overtime Tracker is now configured and ready to use.</p>
            <button mat-raised-button color="primary" (click)="goToDashboard()">
              Go to Dashboard
            </button>
          </div>
        </mat-step>
      </mat-stepper>

      <div class="progress-footer">
        <mat-progress-bar 
          *ngIf="saving" 
          mode="indeterminate"
        ></mat-progress-bar>
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--spacing-lg);
      min-height: 100vh;
    }

    .wizard-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
      padding: var(--spacing-lg);
    }

    .wizard-header h1 {
      font-size: var(--font-size-xxl);
      margin: 0 0 var(--spacing-sm) 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .wizard-header p {
      font-size: var(--font-size-lg);
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    .setup-stepper {
      background: transparent;
    }

    .step-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .completion-container {
      text-align: center;
      padding: var(--spacing-xxl) var(--spacing-lg);
    }

    .completion-icon {
      font-size: 5rem;
      margin-bottom: var(--spacing-xl);
      line-height: 1.2;
    }

    .completion-container h2 {
      font-size: var(--font-size-xxl);
      margin-top: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      color: rgba(0, 0, 0, 0.87);
    }

    .completion-container p {
      font-size: var(--font-size-lg);
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: var(--spacing-xl);
    }

    .progress-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
    }

    :host-context(.dark-theme) .wizard-header h1,
    :host-context(.dark-theme) .completion-container h2 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .wizard-header p,
    :host-context(.dark-theme) .completion-container p {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .step-actions {
      border-top-color: rgba(255, 255, 255, 0.12);
    }
  `]
})
export class SetupWizardComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('workspaceStep') workspaceStepComponent!: WorkspaceStepComponent;

  config: AppConfig;
  
  apiKeyValid = false;
  workspaceSelected = false;
  bundeslandSelected = false;
  workSettingsValid = false;
  entryDateConfigured = true; // Optional step, always valid
  saving = false;

  constructor(
    private configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.config = this.configService.getCurrentConfig();
  }

  ngOnInit(): void {
    // Don't pre-check configuration - wizard should start fresh
    // If user is here, they either haven't configured or want to reconfigure
  }

  onStepChange(event: StepperSelectionEvent): void {
    // When entering the workspace step (index 2), reload workspaces
    if (event.selectedIndex === 2 && this.workspaceStepComponent) {
      setTimeout(() => {
        this.workspaceStepComponent.loadWorkspaces();
      }, 100);
    }
  }

  onApiKeyValidated(data: { apiKey: string; baseUrl: string }): void {
    this.config.clockify.api_key = data.apiKey;
    this.config.clockify.base_url = data.baseUrl;
    this.apiKeyValid = true;
  }

  onWorkspaceSelected(workspaceId: string): void {
    this.config.clockify.workspace_id = workspaceId;
    this.workspaceSelected = true;
  }

  onBundeslandSelected(data: { code: string; name: string }): void {
    this.config.location.bundesland_code = data.code;
    this.config.location.bundesland_name = data.name;
    this.bundeslandSelected = true;
  }

  onWorkSettingsUpdated(workSettings: any): void {
    this.config.work_settings = workSettings;
    this.workSettingsValid = true;
  }

  onEntryDateSelected(entryDate: string | null): void {
    this.config.work_settings.entry_date = entryDate;
    this.entryDateConfigured = true;
  }

  canComplete(): boolean {
    return this.apiKeyValid && 
           this.workspaceSelected && 
           this.bundeslandSelected && 
           this.workSettingsValid &&
           this.entryDateConfigured;
  }

  async completeSetup(): Promise<void> {
    if (!this.canComplete()) {
      return;
    }

    this.saving = true;

    try {
      await this.configService.saveConfig(this.config).toPromise();
      
      this.snackBar.open('Configuration saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      // Move to completion step
      this.stepper.next();
      this.saving = false;
    } catch (error: any) {
      this.snackBar.open(
        `Failed to save configuration: ${error.message}`,
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        }
      );
      this.saving = false;
    }
  }

  goToDashboard(): void {
    // Navigate to root path which loads the dashboard
    this.router.navigate(['/']);
  }
}
