import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VacationDay } from '../../../../core/models/holiday.model';

interface MonthData {
  month: string;
  monthNumber: number;
  days: (VacationDay | null)[];
}

/**
 * Component displaying vacation days in a timeline format
 * Shows month-by-month visualization of vacation periods
 */
@Component({
  selector: 'app-vacation-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="vacation-timeline">
      <div class="timeline-header">
        <h2>{{ currentYear }} Timeline</h2>
        <p class="subtitle">Visual representation of your time off</p>
      </div>

      <div class="timeline-container">
        <div *ngFor="let monthData of timelineData" class="month-row">
          <div class="month-label">
            <span class="month-name">{{ monthData.month }}</span>
            <span class="day-count">{{ getDayCount(monthData) }} days</span>
          </div>
          
          <div class="month-days">
            <div 
              *ngFor="let day of monthData.days; let i = index"
              class="day-dot"
              [class.has-vacation]="day !== null"
              [class.vacation]="day?.dayType === 'Vacation'"
              [class.sick]="day?.dayType === 'SickDay'"
              [class.personal]="day?.dayType === 'PersonalDay'"
              [class.training]="day?.dayType === 'Training'"
              [matTooltip]="getDayTooltip(day, i + 1)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="timeline-legend">
        <div class="legend-item">
          <span class="legend-dot vacation"></span>
          <span>Vacation</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot sick"></span>
          <span>Sick Day</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot personal"></span>
          <span>Personal</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot training"></span>
          <span>Training</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vacation-timeline {
      padding: var(--spacing-lg);
      background: white;
      border-radius: var(--border-radius-md);
      height: 100%;
      overflow: visible;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .vacation-timeline {
      background: #1d1b20;
      color: #e6e1e5;
    }

    .timeline-header {
      margin-bottom: var(--spacing-xl);
    }

    .timeline-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .timeline-header h2 {
      color: #e6e1e5;
    }

    .subtitle {
      margin: var(--spacing-xs) 0 0 0;
      color: rgba(0,0,0,0.6);
      font-size: 0.875rem;
    }

    :host-context(.dark-theme) .subtitle {
      color: #cac4d0;
    }

    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .month-row {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .month-label {
      min-width: 120px;
      display: flex;
      flex-direction: column;
    }

    .month-name {
      font-weight: 500;
      font-size: 0.9375rem;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .month-name {
      color: #e6e1e5;
    }

    .day-count {
      font-size: 0.75rem;
      color: rgba(0,0,0,0.6);
    }

    :host-context(.dark-theme) .day-count {
      color: #cac4d0;
    }

    .month-days {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      flex: 1;
    }

    .day-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(0,0,0,0.12);
      cursor: default;
      transition: all var(--transition-fast);
    }

    :host-context(.dark-theme) .day-dot {
      background: rgba(255,255,255,0.15);
    }

    .day-dot.has-vacation {
      width: 12px;
      height: 12px;
      cursor: pointer;
    }

    .day-dot.has-vacation:hover {
      transform: scale(1.3);
    }

    .day-dot.vacation {
      background: #4caf50;
    }

    :host-context(.dark-theme) .day-dot.vacation {
      background: #81c784;
    }

    .day-dot.sick {
      background: #f44336;
    }

    :host-context(.dark-theme) .day-dot.sick {
      background: #e57373;
    }

    .day-dot.personal {
      background: #9c27b0;
    }

    :host-context(.dark-theme) .day-dot.personal {
      background: #ba68c8;
    }

    .day-dot.training {
      background: #00bcd4;
    }

    :host-context(.dark-theme) .day-dot.training {
      background: #4dd0e1;
    }

    .timeline-legend {
      display: flex;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid rgba(0,0,0,0.12);
    }

    :host-context(.dark-theme) .timeline-legend {
      border-top-color: #424242;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.875rem;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .legend-item {
      color: #e6e1e5;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-dot.vacation {
      background: #4caf50;
    }

    :host-context(.dark-theme) .legend-dot.vacation {
      background: #81c784;
    }

    .legend-dot.sick {
      background: #f44336;
    }

    :host-context(.dark-theme) .legend-dot.sick {
      background: #e57373;
    }

    .legend-dot.personal {
      background: #9c27b0;
    }

    :host-context(.dark-theme) .legend-dot.personal {
      background: #ba68c8;
    }

    .legend-dot.training {
      background: #00bcd4;
    }

    :host-context(.dark-theme) .legend-dot.training {
      background: #4dd0e1;
    }

    @media (max-width: 768px) {
      .month-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .month-label {
        min-width: auto;
      }
    }
  `]
})
export class VacationTimelineComponent implements OnChanges {
  @Input() vacationDays: VacationDay[] = [];

  timelineData: MonthData[] = [];
  currentYear = new Date().getFullYear();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vacationDays']) {
      this.generateTimeline();
    }
  }

  generateTimeline(): void {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this.timelineData = months.map((month, index) => {
      const daysInMonth = new Date(this.currentYear, index + 1, 0).getDate();
      const days: (VacationDay | null)[] = Array(daysInMonth).fill(null);

      // Fill in vacation days
      this.vacationDays.forEach(vacation => {
        const date = new Date(vacation.date);
        if (date.getFullYear() === this.currentYear && date.getMonth() === index) {
          const dayIndex = date.getDate() - 1;
          days[dayIndex] = vacation;
        }
      });

      return {
        month,
        monthNumber: index,
        days
      };
    });
  }

  getDayCount(monthData: MonthData): number {
    return monthData.days.filter(d => d !== null).length;
  }

  getDayTooltip(day: VacationDay | null, dayNumber: number): string {
    if (!day) {
      return `Day ${dayNumber}`;
    }

    const typeLabels: Record<string, string> = {
      'Vacation': 'Vacation',
      'SickDay': 'Sick Day',
      'PersonalDay': 'Personal Day',
      'Training': 'Training'
    };

    const parts = [
      `Day ${dayNumber}`,
      typeLabels[day.dayType] || day.dayType
    ];

    if (day.description) {
      parts.push(day.description);
    }

    return parts.join(' • ');
  }
}
