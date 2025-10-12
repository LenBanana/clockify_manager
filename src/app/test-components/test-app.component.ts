import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TauriService } from './core/services/tauri.service';
import { ClockifyService } from './core/services/clockify.service';
import { HolidayService } from './core/services/holiday.service';
import { OvertimeService } from './core/services/overtime.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OvertimeReport } from './core/models/overtime.model';
import { formatHours, getDayTypeName } from './core/models/overtime.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Clockify Overtime Tracker';
  greeting = '';
  systemInfo = '';
  configPath = '';
  isTauriEnvironment = false;

  // Clockify testing
  apiKey = '';
  clockifyStatus = '';
  workspaces: any[] = [];
  projects: any[] = [];
  timeEntries: any[] = [];
  selectedWorkspaceId = '';

  // Holiday testing
  holidayStatus = '';
  germanStates: any[] = [];
  selectedStateCode = 'BY'; // Default to Bayern
  selectedYear = 2025;
  publicHolidays: any[] = [];
  schoolHolidays: any[] = [];
  vacationDays: any[] = [];

  // Overtime testing (Session 4)
  overtimeStartDate = '2025-10-01';
  overtimeEndDate = '2025-10-07';
  overtimeStatusMessage = '';
  overtimeReport: OvertimeReport | null = null;

  constructor(
    private tauriService: TauriService,
    private clockifyService: ClockifyService,
    private holidayService: HolidayService,
    private overtimeService: OvertimeService
  ) {}

  ngOnInit() {
    this.initializeTauriEnvironment();
  }

  async initializeTauriEnvironment() {
    // Wait for Tauri to be ready (up to 2 seconds)
    this.isTauriEnvironment = await this.tauriService.waitForTauri(2000);
    
    if (this.isTauriEnvironment) {
      this.testTauriCommands();
    }
  }

  testTauriCommands() {
    // Test greet command
    this.tauriService.greet('Developer').subscribe({
      next: (message) => {
        this.greeting = message;
        console.log('Greet command successful:', message);
      },
      error: (err) => console.error('Greet command failed:', err)
    });

    // Test system info command
    this.tauriService.getSystemInfo().subscribe({
      next: (info) => {
        this.systemInfo = info;
        console.log('System info:', info);
      },
      error: (err) => console.error('System info failed:', err)
    });

    // Test config path command
    this.tauriService.getConfigPath().subscribe({
      next: (path) => {
        this.configPath = path;
        console.log('Config path:', path);
      },
      error: (err) => console.error('Config path failed:', err)
    });

    // Test get config command
    this.tauriService.getConfig().subscribe({
      next: (config) => {
        console.log('Current config:', config);
        // Pre-fill API key if available
        if (config.clockify.api_key) {
          this.apiKey = config.clockify.api_key;
        }
      },
      error: (err) => console.error('Get config failed:', err)
    });
  }

  // Clockify test methods
  testValidateApiKey() {
    if (!this.apiKey) {
      this.clockifyStatus = 'Please enter an API key';
      return;
    }

    this.clockifyStatus = 'Validating...';
    this.clockifyService.validateApiKey(this.apiKey).subscribe({
      next: (isValid) => {
        this.clockifyStatus = isValid 
          ? '✅ API key is valid!' 
          : '❌ API key is invalid';
        console.log('API key validation:', isValid);
      },
      error: (err) => {
        this.clockifyStatus = `❌ Error: ${err}`;
        console.error('Validation error:', err);
      }
    });
  }

  testFetchWorkspaces() {
    if (!this.apiKey) {
      this.clockifyStatus = 'Please enter an API key';
      return;
    }

    this.clockifyStatus = 'Fetching workspaces...';
    this.clockifyService.fetchWorkspaces(this.apiKey).subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        this.clockifyStatus = `✅ Found ${workspaces.length} workspace(s)`;
        console.log('Workspaces:', workspaces);
      },
      error: (err) => {
        this.clockifyStatus = `❌ Error: ${err}`;
        console.error('Fetch workspaces error:', err);
      }
    });
  }

  testFetchProjects() {
    if (!this.apiKey || !this.selectedWorkspaceId) {
      this.clockifyStatus = 'Please enter API key and select a workspace';
      return;
    }

    this.clockifyStatus = 'Fetching projects...';
    this.clockifyService.fetchProjects(this.apiKey, this.selectedWorkspaceId).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.clockifyStatus = `✅ Found ${projects.length} project(s)`;
        console.log('Projects:', projects);
      },
      error: (err) => {
        this.clockifyStatus = `❌ Error: ${err}`;
        console.error('Fetch projects error:', err);
      }
    });
  }

  testFetchTimeEntries() {
    if (!this.apiKey || !this.selectedWorkspaceId) {
      this.clockifyStatus = 'Please enter API key and select a workspace';
      return;
    }

    // Fetch last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.clockifyStatus = 'Fetching time entries (last 30 days)...';
    this.clockifyService.fetchTimeEntriesForDateRange(
      this.apiKey,
      this.selectedWorkspaceId,
      start,
      end
    ).subscribe({
      next: (entries) => {
        this.timeEntries = entries;
        this.clockifyStatus = `✅ Found ${entries.length} time entry(ies)`;
        console.log('Time entries:', entries);
      },
      error: (err) => {
        this.clockifyStatus = `❌ Error: ${err}`;
        console.error('Fetch time entries error:', err);
      }
    });
  }

  // Holiday test methods
  testGetGermanStates() {
    this.holidayStatus = 'Fetching German states...';
    this.holidayService.getGermanStates().subscribe({
      next: (states) => {
        this.germanStates = states;
        this.holidayStatus = `✅ Found ${states.length} states`;
        console.log('German states:', states);
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Get states error:', err);
      }
    });
  }

  testFetchPublicHolidays() {
    this.holidayStatus = `Fetching public holidays for ${this.selectedStateCode} ${this.selectedYear}...`;
    this.holidayService.fetchPublicHolidays(this.selectedStateCode, this.selectedYear).subscribe({
      next: (holidays) => {
        this.publicHolidays = holidays;
        this.holidayStatus = `✅ Found ${holidays.length} public holiday(s)`;
        console.log('Public holidays:', holidays);
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Fetch public holidays error:', err);
      }
    });
  }

  testFetchSchoolHolidays() {
    this.holidayStatus = `Fetching school holidays for ${this.selectedStateCode} ${this.selectedYear}...`;
    this.holidayService.fetchSchoolHolidays(this.selectedStateCode, this.selectedYear).subscribe({
      next: (holidays) => {
        this.schoolHolidays = holidays;
        this.holidayStatus = `✅ Found ${holidays.length} school holiday period(s)`;
        console.log('School holidays:', holidays);
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Fetch school holidays error:', err);
      }
    });
  }

  testFetchAndCacheHolidays() {
    this.holidayStatus = `Fetching and caching all holidays for ${this.selectedStateCode} ${this.selectedYear}...`;
    this.holidayService.fetchAndCacheHolidays(this.selectedStateCode, this.selectedYear).subscribe({
      next: (cache) => {
        this.publicHolidays = cache.publicHolidays;
        this.schoolHolidays = cache.schoolHolidays;
        this.holidayStatus = `✅ Cached ${cache.publicHolidays.length} public + ${cache.schoolHolidays.length} school holidays`;
        console.log('Holiday cache:', cache);
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Fetch and cache error:', err);
      }
    });
  }

  testAddVacationDay() {
    const today = new Date();
    this.holidayStatus = 'Adding vacation day...';
    this.holidayService.addVacationDay(today, 'Vacation', 'Test vacation day').subscribe({
      next: () => {
        this.holidayStatus = '✅ Vacation day added';
        this.testGetVacationDays(); // Refresh the list
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Add vacation day error:', err);
      }
    });
  }

  testGetVacationDays() {
    this.holidayStatus = 'Fetching vacation days...';
    this.holidayService.getVacationDays().subscribe({
      next: (days) => {
        this.vacationDays = days;
        this.holidayStatus = `✅ Found ${days.length} vacation day(s)`;
        console.log('Vacation days:', days);
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Get vacation days error:', err);
      }
    });
  }

  testClearHolidayCache() {
    this.holidayStatus = 'Clearing holiday cache...';
    this.holidayService.clearHolidayCache().subscribe({
      next: () => {
        this.holidayStatus = '✅ Cache cleared';
        this.publicHolidays = [];
        this.schoolHolidays = [];
      },
      error: (err) => {
        this.holidayStatus = `❌ Error: ${err}`;
        console.error('Clear cache error:', err);
      }
    });
  }

  // ============ Overtime Calculation Test Methods (Session 4) ============

  testCalculateOvertime() {
    this.overtimeStatusMessage = 'Calculating overtime report...';
    this.overtimeReport = null;

    // Get config for work settings
    this.tauriService.getConfig().subscribe({
      next: (config) => {
        const workSettings = config.work_settings;

        // Use test data if we don't have real data yet
        const testTimeEntries = this.timeEntries.length > 0 ? this.timeEntries : [];
        const testProjects = this.projects.length > 0 ? this.projects : [];
        const testPublicHolidays = this.publicHolidays.length > 0 ? this.publicHolidays : [];
        const testVacationDays = this.vacationDays.length > 0 ? this.vacationDays : [];

        this.overtimeService.calculateOvertime(
          this.overtimeStartDate,
          this.overtimeEndDate,
          workSettings,
          testPublicHolidays,
          testVacationDays,
          testTimeEntries,
          testProjects
        ).subscribe({
          next: (report) => {
            this.overtimeReport = report;
            this.overtimeStatusMessage = `✅ Overtime report calculated for ${report.dailyBreakdown.length} days`;
            console.log('Overtime report:', report);
          },
          error: (err) => {
            this.overtimeStatusMessage = `❌ Error: ${err}`;
            console.error('Calculate overtime error:', err);
          }
        });
      },
      error: (err) => {
        this.overtimeStatusMessage = `❌ Error loading config: ${err}`;
        console.error('Get config error:', err);
      }
    });
  }

  setCurrentWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    this.overtimeStartDate = this.formatDateToYYYYMMDD(monday);
    this.overtimeEndDate = this.formatDateToYYYYMMDD(sunday);
  }

  setCurrentMonthDates() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.overtimeStartDate = this.formatDateToYYYYMMDD(start);
    this.overtimeEndDate = this.formatDateToYYYYMMDD(end);
  }

  setLast7Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // 7 days including today

    this.overtimeStartDate = this.formatDateToYYYYMMDD(start);
    this.overtimeEndDate = this.formatDateToYYYYMMDD(end);
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper methods for template
  formatHours(hours: number): string {
    return formatHours(hours);
  }

  getDayTypeName(dayType: string): string {
    return getDayTypeName(dayType as any);
  }

  getDayTypeClass(dayType: string): string {
    const classMap: Record<string, string> = {
      'WorkDay': 'work-day',
      'Weekend': 'weekend',
      'PublicHoliday': 'holiday',
      'Vacation': 'vacation',
      'SickDay': 'sick',
      'PersonalDay': 'personal',
      'Training': 'training'
    };
    return classMap[dayType] || '';
  }
}
