import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../../core/services/config.service';
import { AppConfig } from '../../../../core/models/config.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../../core/services/dialog.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    PageHeaderComponent
  ],
  template: `
    <div class="settings-container">
      <!-- Header -->
      <app-page-header 
        title="Settings"
        subtitle="Manage your Clockify Overtime Tracker configuration"
      >
      </app-page-header>

      <mat-tab-group animationDuration="300ms" class="settings-tabs">
        <!-- Clockify Settings Tab -->
        <mat-tab label="Clockify">
          <div class="tab-content">
            <h3>Clockify Integration</h3>
            <p>Configure your Clockify API connection and workspace.</p>
            
            <div class="setting-section">
              <h4>API Configuration</h4>
              <p class="section-description">Your Clockify API key is stored locally and never shared.</p>
              
              <mat-form-field appearance="outline">
                <mat-label>API Key</mat-label>
                <input 
                  matInput 
                  type="password" 
                  [(ngModel)]="config.clockify.api_key"
                  placeholder="Your Clockify API key"
                />
                <mat-icon matSuffix>key</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Base URL</mat-label>
                <input 
                  matInput 
                  type="text" 
                  [(ngModel)]="config.clockify.base_url"
                  placeholder="https://api.clockify.me/api/v1"
                />
                <mat-icon matSuffix>link</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Workspace ID</mat-label>
                <input 
                  matInput 
                  type="text" 
                  [(ngModel)]="config.clockify.workspace_id"
                  [disabled]="true"
                />
                <mat-icon matSuffix>business</mat-icon>
                <mat-hint>Use the setup wizard to change workspace</mat-hint>
              </mat-form-field>
            </div>
          </div>
        </mat-tab>

        <!-- Location Settings Tab -->
        <mat-tab label="Location">
          <div class="tab-content">
            <h3>Location Settings</h3>
            <p>Set your federal state for accurate holiday calculations.</p>
            
            <div class="setting-section">
              <h4>Bundesland</h4>
              <p class="section-description">This determines which public holidays apply to you.</p>
              
              <mat-form-field appearance="outline">
                <mat-label>Bundesland</mat-label>
                <mat-select [(ngModel)]="config.location.bundesland_code">
                  <mat-option *ngFor="let bl of bundeslaender" [value]="bl.code">
                    {{ bl.name }}
                  </mat-option>
                </mat-select>
                <mat-icon matSuffix>location_on</mat-icon>
              </mat-form-field>
            </div>
          </div>
        </mat-tab>

        <!-- Work Settings Tab -->
        <mat-tab label="Work Settings">
          <div class="tab-content">
            <h3>Work Schedule</h3>
            <p>Define your working hours and days.</p>
            
            <div class="setting-section">
              <h4>Working Hours</h4>
              
              <mat-form-field appearance="outline">
                <mat-label>Daily Hours</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="config.work_settings.daily_hours"
                  min="1"
                  max="24"
                  step="0.5"
                />
                <mat-icon matSuffix>schedule</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Weekly Hours</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="config.work_settings.weekly_hours"
                  min="1"
                  max="168"
                />
                <mat-icon matSuffix>date_range</mat-icon>
              </mat-form-field>
            </div>

            <div class="setting-section">
              <h4>Working Days</h4>
              <div class="checkbox-group">
                <mat-checkbox [(ngModel)]="workingDays.monday">Monday</mat-checkbox>
                <mat-checkbox [(ngModel)]="workingDays.tuesday">Tuesday</mat-checkbox>
                <mat-checkbox [(ngModel)]="workingDays.wednesday">Wednesday</mat-checkbox>
                <mat-checkbox [(ngModel)]="workingDays.thursday">Thursday</mat-checkbox>
                <mat-checkbox [(ngModel)]="workingDays.friday">Friday</mat-checkbox>
                <mat-checkbox [(ngModel)]="workingDays.saturday">Saturday</mat-checkbox>
                <mat-checkbox [(ngModel)]="workingDays.sunday">Sunday</mat-checkbox>
              </div>
            </div>

            <div class="setting-section">
              <h4>Entry Date</h4>
              <p class="section-description">
                Set your company entry date. Only time entries from this date onwards will be included in calculations.
              </p>
              
              <mat-slide-toggle [(ngModel)]="hasEntryDate" (change)="onEntryDateToggle()">
                Set a specific entry date
              </mat-slide-toggle>

              <mat-form-field appearance="outline" *ngIf="hasEntryDate" class="entry-date-field">
                <mat-label>Entry Date</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="entryPicker"
                  [(ngModel)]="entryDateObj"
                  (ngModelChange)="onEntryDateChange()"
                  [max]="maxEntryDate"
                />
                <mat-datepicker-toggle matSuffix [for]="entryPicker"></mat-datepicker-toggle>
                <mat-datepicker #entryPicker></mat-datepicker>
                <mat-icon matPrefix>event</mat-icon>
                <mat-hint>Select the date you started at the company</mat-hint>
              </mat-form-field>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Action Buttons -->
      <div class="actions-footer">
        <button mat-button (click)="resetToDefaults()">Reset to Defaults</button>
        <div class="spacer"></div>
        <button mat-raised-button color="primary" (click)="saveSettings()" [disabled]="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    app-page-header {
      margin-bottom: var(--spacing-lg);
    }

    .settings-tabs {
      margin-bottom: var(--spacing-xl);
    }

    .tab-content {
      padding: var(--spacing-lg) 0;
    }

    .tab-content h3 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    .tab-content > p {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: var(--spacing-xl);
    }

    .setting-section {
      margin-bottom: var(--spacing-xl);
      padding: var(--spacing-lg);
      background-color: #f5f5f5;
      border-radius: var(--border-radius-md);
    }

    .setting-section h4 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
    }

    .section-description {
      color: rgba(0, 0, 0, 0.6);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-md);
    }

    mat-form-field {
      width: 100%;
      margin-bottom: var(--spacing-md);
    }

    mat-slide-toggle {
      display: block;
      margin-bottom: var(--spacing-lg);
    }

    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--spacing-sm);
      margin-top: var(--spacing-md);
    }

    .about-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .about-card {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background-color: #f5f5f5;
      border-radius: var(--border-radius-md);
      align-items: flex-start;
    }

    .about-card mat-icon {
      color: var(--primary-color);
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .about-card h4 {
      margin: 0 0 var(--spacing-xs) 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .about-card p {
      margin: var(--spacing-xs) 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: var(--font-size-sm);
    }

    .about-card code {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.85em;
      word-break: break-all;
    }

    .actions-footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) 0;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .spacer {
      flex: 1;
    }

    :host-context(.dark-theme) .tab-content h3,
    :host-context(.dark-theme) .setting-section h4,
    :host-context(.dark-theme) .about-card h4 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .tab-content > p,
    :host-context(.dark-theme) .section-description,
    :host-context(.dark-theme) .about-card p {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .setting-section,
    :host-context(.dark-theme) .about-card {
      background-color: #424242;
    }

    :host-context(.dark-theme) .about-card code {
      background-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .actions-footer {
      border-top-color: rgba(255, 255, 255, 0.12);
    }
  `]
})
export class SettingsComponent implements OnInit {
  config: AppConfig;
  workingDays: any = {};
  saving = false;
  configPath: string = '';
  
  // Entry date properties
  hasEntryDate = false;
  entryDateObj: Date | null = null;
  maxEntryDate = new Date(); // Can't set entry date in future

  bundeslaender = [
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

  constructor(
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialogService: DialogService
  ) {
    this.config = this.configService.getCurrentConfig();
  }

  async ngOnInit(): Promise<void> {
    // Load config
    try {
      await firstValueFrom(this.configService.loadConfig());
      this.config = this.configService.getCurrentConfig();
      this.updateWorkingDaysFromConfig();
      this.updateEntryDateFromConfig();
      
      // Get config path
      this.configPath = await firstValueFrom(this.configService.getConfigPath()) || '';
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }

  updateWorkingDaysFromConfig(): void {
    const days = this.config.work_settings.working_days;
    this.workingDays = {
      monday: days.includes('monday'),
      tuesday: days.includes('tuesday'),
      wednesday: days.includes('wednesday'),
      thursday: days.includes('thursday'),
      friday: days.includes('friday'),
      saturday: days.includes('saturday'),
      sunday: days.includes('sunday'),
    };
  }

  updateConfigFromWorkingDays(): void {
    const days: string[] = [];
    if (this.workingDays.monday) days.push('monday');
    if (this.workingDays.tuesday) days.push('tuesday');
    if (this.workingDays.wednesday) days.push('wednesday');
    if (this.workingDays.thursday) days.push('thursday');
    if (this.workingDays.friday) days.push('friday');
    if (this.workingDays.saturday) days.push('saturday');
    if (this.workingDays.sunday) days.push('sunday');
    this.config.work_settings.working_days = days;
  }

  async saveSettings(): Promise<void> {
    this.saving = true;

    try {
      this.updateConfigFromWorkingDays();
      await firstValueFrom(this.configService.saveConfig(this.config));
      
      this.snackBar.open('Settings saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      
      this.saving = false;
    } catch (error: any) {
      this.snackBar.open(
        `Failed to save settings: ${error.message}`,
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

  async resetToDefaults(): Promise<void> {
    const confirmed = await firstValueFrom(this.dialogService.confirmWarning(
      'Are you sure you want to reset all settings to defaults?\n\n' +
      'This will:\n' +
      '• Clear your API key and workspace\n' +
      '• Reset work hours and schedule\n' +
      '• Clear your location settings\n' +
      '• Redirect you to the setup wizard\n\n' +
      'Your vacation days will NOT be deleted.\n\n' +
      'This action cannot be undone.',
      'Reset All Settings'
    ));
    
    if (confirmed) {
      try {
        await firstValueFrom(this.configService.resetToDefaults());
        
        this.snackBar.open('Settings reset! Redirecting to setup wizard...', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        
        // Redirect to setup wizard after a brief delay
        setTimeout(() => {
          this.router.navigate(['/setup']);
        }, 2000);
      } catch (error: any) {
        this.snackBar.open(
          `Failed to reset settings: ${error.message}`,
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          }
        );
      }
    }
  }

  updateEntryDateFromConfig(): void {
    if (this.config.work_settings.entry_date) {
      this.hasEntryDate = true;
      this.entryDateObj = new Date(this.config.work_settings.entry_date);
    } else {
      this.hasEntryDate = false;
      this.entryDateObj = null;
    }
  }

  onEntryDateToggle(): void {
    if (!this.hasEntryDate) {
      this.entryDateObj = null;
      this.config.work_settings.entry_date = null;
    }
  }

  onEntryDateChange(): void {
    if (this.entryDateObj) {
      // Format as YYYY-MM-DD
      const year = this.entryDateObj.getFullYear();
      const month = String(this.entryDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(this.entryDateObj.getDate()).padStart(2, '0');
      this.config.work_settings.entry_date = `${year}-${month}-${day}`;
    } else {
      this.config.work_settings.entry_date = null;
    }
  }
}
