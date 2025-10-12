import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ClockifyService } from '../../../../../core/services/clockify.service';
import { ConfigService } from '../../../../../core/services/config.service';
import { Workspace } from '../../../../../core/models/clockify.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-workspace-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  template: `
    <div class="workspace-container">
      <h3>Select Your Workspace</h3>
      <p class="step-description">
        Choose the Clockify workspace you want to track overtime for.
      </p>

      <app-loading-spinner 
        *ngIf="loading" 
        message="Loading workspaces..."
      ></app-loading-spinner>

      <app-error-message 
        *ngIf="error" 
        [error]="error"
        title="Failed to Load Workspaces"
        [retryable]="true"
        [onRetry]="loadWorkspaces.bind(this)"
      ></app-error-message>

      <div *ngIf="!loading && !error && workspaces.length > 0" class="workspace-selection">
        <mat-form-field appearance="outline">
          <mat-label>Workspace</mat-label>
          <mat-select [(ngModel)]="selectedWorkspaceId" (selectionChange)="onWorkspaceSelected()">
            <mat-option *ngFor="let workspace of workspaces" [value]="workspace.id">
              {{ workspace.name }}
            </mat-option>
          </mat-select>
          <mat-icon matSuffix>business</mat-icon>
          <mat-hint>{{ workspaces.length }} workspace(s) available</mat-hint>
        </mat-form-field>

        <div *ngIf="selectedWorkspaceId" class="selected-workspace-info">
          <mat-icon>check_circle</mat-icon>
          <span>Workspace selected: <strong>{{ getSelectedWorkspaceName() }}</strong></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-container {
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

    .workspace-selection {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .selected-workspace-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: #e8f5e9;
      border-left: 4px solid var(--success-color);
      border-radius: var(--border-radius-sm);
    }

    .selected-workspace-info mat-icon {
      color: var(--success-color);
    }

    :host-context(.dark-theme) h3 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .step-description {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .selected-workspace-info {
      background-color: #2d4a2f;
    }
  `]
})
export class WorkspaceStepComponent implements OnInit {
  @Output() workspaceSelected = new EventEmitter<string>();

  workspaces: Workspace[] = [];
  selectedWorkspaceId: string = '';
  loading = false;
  error: string | null = null;

  constructor(
    private clockifyService: ClockifyService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    // Pre-select from existing config if available
    const config = this.configService.getCurrentConfig();
    if (config.clockify.workspace_id) {
      this.selectedWorkspaceId = config.clockify.workspace_id;
    }

    // Load workspaces on init
    this.loadWorkspaces();
  }

  async loadWorkspaces(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const config = this.configService.getCurrentConfig();
      
      // Check if API key is available
      if (!config.clockify.api_key) {
        this.loading = false;
        this.error = 'API key not configured. Please go back and validate your API key.';
        return;
      }

      this.workspaces = await this.clockifyService
        .fetchWorkspaces(config.clockify.api_key, config.clockify.base_url)
        .toPromise() || [];
      
      this.loading = false;

      // If only one workspace, auto-select it
      if (this.workspaces.length === 1 && !this.selectedWorkspaceId) {
        this.selectedWorkspaceId = this.workspaces[0].id;
        this.onWorkspaceSelected();
      }
    } catch (err: any) {
      this.loading = false;
      this.error = err.message || 'Failed to load workspaces. Please check your API key and internet connection.';
    }
  }

  onWorkspaceSelected(): void {
    if (this.selectedWorkspaceId) {
      this.workspaceSelected.emit(this.selectedWorkspaceId);
    }
  }

  getSelectedWorkspaceName(): string {
    const workspace = this.workspaces.find(w => w.id === this.selectedWorkspaceId);
    return workspace?.name || '';
  }

  get isValid(): boolean {
    return !!this.selectedWorkspaceId;
  }
}
