import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ConfigService } from '../../../../../core/services/config.service';

interface BundeslandOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-bundesland-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="bundesland-container">
      <h3>Select Your Bundesland</h3>
      <p class="step-description">
        Choose your German federal state for accurate public holiday calculations.
      </p>

      <mat-form-field appearance="outline">
        <mat-label>Bundesland</mat-label>
        <mat-select [(ngModel)]="selectedBundesland" (selectionChange)="onBundeslandSelected()">
          <mat-option *ngFor="let bundesland of bundeslaender" [value]="bundesland.code">
            {{ bundesland.name }}
          </mat-option>
        </mat-select>
        <mat-icon matSuffix>location_on</mat-icon>
        <mat-hint>This determines which public holidays apply to you</mat-hint>
      </mat-form-field>

      <div *ngIf="selectedBundesland" class="selected-bundesland-info">
        <mat-icon>check_circle</mat-icon>
        <span>Selected: <strong>{{ getSelectedBundeslandName() }}</strong></span>
      </div>

      <div class="info-box">
        <h4>Why do we need this?</h4>
        <p>
          Public holidays vary by German federal state (Bundesland). Selecting your
          location ensures accurate overtime calculations by excluding the correct
          public holidays from your expected work hours.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .bundesland-container {
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

    mat-form-field {
      width: 100%;
      margin-bottom: var(--spacing-md);
    }

    .selected-bundesland-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: #e8f5e9;
      border-left: 4px solid var(--success-color);
      border-radius: var(--border-radius-sm);
      margin-bottom: var(--spacing-md);
    }

    .selected-bundesland-info mat-icon {
      color: var(--success-color);
    }

    .info-box {
      padding: var(--spacing-md);
      background-color: #e3f2fd;
      border-left: 4px solid var(--info-color);
      border-radius: var(--border-radius-sm);
      margin-top: var(--spacing-lg);
    }

    .info-box h4 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    .info-box p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.6;
    }

    :host-context(.dark-theme) h3,
    :host-context(.dark-theme) .info-box h4 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .step-description,
    :host-context(.dark-theme) .info-box p {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .selected-bundesland-info {
      background-color: #2d4a2f;
    }

    :host-context(.dark-theme) .info-box {
      background-color: #1e3a5f;
    }
  `]
})
export class BundeslandStepComponent implements OnInit {
  @Output() bundeslandSelected = new EventEmitter<{ code: string; name: string }>();

  selectedBundesland: string = '';

  bundeslaender: BundeslandOption[] = [
    { code: 'BW', name: 'Baden-Württemberg' },
    { code: 'BY', name: 'Bayern' },
    { code: 'BE', name: 'Berlin' },
    { code: 'BB', name: 'Brandenburg' },
    { code: 'HB', name: 'Bremen' },
    { code: 'HH', name: 'Hamburg' },
    { code: 'HE', name: 'Hessen' },
    { code: 'MV', name: 'Mecklenburg-Vorpommern' },
    { code: 'NI', name: 'Niedersachsen' },
    { code: 'NW', name: 'Nordrhein-Westfalen' },
    { code: 'RP', name: 'Rheinland-Pfalz' },
    { code: 'SL', name: 'Saarland' },
    { code: 'SN', name: 'Sachsen' },
    { code: 'ST', name: 'Sachsen-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thüringen' },
  ];

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // Pre-select from existing config if available
    const config = this.configService.getCurrentConfig();
    if (config.location.bundesland_code) {
      this.selectedBundesland = config.location.bundesland_code;
    }
  }

  onBundeslandSelected(): void {
    if (this.selectedBundesland) {
      const bundesland = this.bundeslaender.find(b => b.code === this.selectedBundesland);
      if (bundesland) {
        this.bundeslandSelected.emit({
          code: bundesland.code,
          name: bundesland.name
        });
      }
    }
  }

  getSelectedBundeslandName(): string {
    const bundesland = this.bundeslaender.find(b => b.code === this.selectedBundesland);
    return bundesland?.name || '';
  }

  get isValid(): boolean {
    return !!this.selectedBundesland;
  }
}
