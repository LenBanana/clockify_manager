import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ConfigService } from '../../../../../core/services/config.service';

@Component({
  selector: 'app-entry-date-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <div class="entry-date-container">
      <h3>Entry Date Configuration</h3>
      <p class="step-description">
        If you started working at the company recently, set your entry date. 
        All calculations will only include data from this date onwards.
      </p>

      <form [formGroup]="entryDateForm" class="entry-date-form">
        <div class="form-section">
          <mat-checkbox formControlName="hasEntryDate" class="entry-date-toggle">
            I want to set a specific entry date
          </mat-checkbox>

          <div class="entry-date-info" *ngIf="!entryDateForm.get('hasEntryDate')?.value">
            <mat-icon>info</mat-icon>
            <p>
              Without an entry date, all historical time entries will be included in calculations.
              This is suitable if you've been with the company for a while.
            </p>
          </div>

          <mat-form-field 
            appearance="outline" 
            *ngIf="entryDateForm.get('hasEntryDate')?.value"
            class="date-field"
          >
            <mat-label>Entry Date</mat-label>
            <input 
              matInput 
              [matDatepicker]="picker"
              formControlName="entryDate"
              placeholder="Select your entry date"
              [max]="maxDate"
            />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-icon matPrefix>event</mat-icon>
            <mat-hint>Select the date you started working at the company</mat-hint>
          </mat-form-field>

          <div class="entry-date-explanation" *ngIf="entryDateForm.get('hasEntryDate')?.value && entryDateForm.get('entryDate')?.value">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <div class="explanation-text">
              <strong>Perfect!</strong>
              <p>
                Only time entries from <strong>{{ formatDate(entryDateForm.get('entryDate')?.value) }}</strong> onwards 
                will be included in overtime calculations. This ensures accurate tracking from your actual start date.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .entry-date-container {
      max-width: 600px;
      margin: 0 auto;
    }

    h3 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
      color: rgba(0, 0, 0, 0.87);
      font-size: var(--font-size-xl);
    }

    .step-description {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: var(--spacing-xl);
      line-height: 1.6;
    }

    .entry-date-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .entry-date-toggle {
      margin-bottom: var(--spacing-md);
    }

    .date-field {
      width: 100%;
    }

    .entry-date-info {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: #e3f2fd;
      border-radius: var(--border-radius-md);
      border-left: 4px solid #2196f3;
    }

    .entry-date-info mat-icon {
      color: #2196f3;
      flex-shrink: 0;
    }

    .entry-date-info p {
      margin: 0;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.5;
    }

    .entry-date-explanation {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: #e8f5e9;
      border-radius: var(--border-radius-md);
      border-left: 4px solid #4caf50;
      align-items: flex-start;
    }

    .entry-date-explanation .success-icon {
      color: #4caf50;
      flex-shrink: 0;
    }

    .explanation-text {
      flex: 1;
    }

    .explanation-text strong {
      color: rgba(0, 0, 0, 0.87);
      display: block;
      margin-bottom: var(--spacing-xs);
    }

    .explanation-text p {
      margin: 0;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.5;
    }

    :host-context(.dark-theme) h3 {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .step-description {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .entry-date-info {
      background-color: rgba(33, 150, 243, 0.15);
      border-left-color: #42a5f5;
    }

    :host-context(.dark-theme) .entry-date-info mat-icon {
      color: #42a5f5;
    }

    :host-context(.dark-theme) .entry-date-info p {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .entry-date-explanation {
      background-color: rgba(76, 175, 80, 0.15);
      border-left-color: #66bb6a;
    }

    :host-context(.dark-theme) .entry-date-explanation .success-icon {
      color: #66bb6a;
    }

    :host-context(.dark-theme) .explanation-text strong {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .explanation-text p {
      color: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class EntryDateStepComponent implements OnInit {
  @Output() entryDateSelected = new EventEmitter<string | null>();

  entryDateForm: FormGroup;
  maxDate = new Date(); // Can't set entry date in the future

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService
  ) {
    this.entryDateForm = this.fb.group({
      hasEntryDate: [false],
      entryDate: [null]
    });
  }

  ngOnInit(): void {
    // Load existing configuration
    const config = this.configService.getCurrentConfig();
    if (config.work_settings.entry_date) {
      this.entryDateForm.patchValue({
        hasEntryDate: true,
        entryDate: new Date(config.work_settings.entry_date)
      });
    }

    // Watch for changes
    this.entryDateForm.valueChanges.subscribe(() => {
      this.emitEntryDate();
    });

    // Emit initial value
    this.emitEntryDate();
  }

  private emitEntryDate(): void {
    const hasEntryDate = this.entryDateForm.get('hasEntryDate')?.value;
    const entryDate = this.entryDateForm.get('entryDate')?.value;

    if (hasEntryDate && entryDate) {
      // Format as YYYY-MM-DD
      const formatted = this.formatDateForStorage(entryDate);
      this.entryDateSelected.emit(formatted);
    } else {
      this.entryDateSelected.emit(null);
    }
  }

  private formatDateForStorage(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
