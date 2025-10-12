import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../../core/services/theme.service';

/**
 * Main dashboard layout with sidebar navigation and top toolbar
 * Uses Material sidenav for responsive navigation
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dashboard-container">
      <mat-sidenav-container class="sidenav-container">
        <!-- Sidebar Navigation -->
        <mat-sidenav
          #sidenav
          mode="side"
          opened
          class="sidenav"
        >
          <div class="sidenav-header">
            <h2>Clockify Tracker</h2>
          </div>
          
          <mat-nav-list>
            <a mat-list-item routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/vacation" routerLinkActive="active">
              <mat-icon matListItemIcon>event</mat-icon>
              <span matListItemTitle>Vacation Management</span>
            </a>
            <a mat-list-item routerLink="/settings" routerLinkActive="active">
              <mat-icon matListItemIcon>settings</mat-icon>
              <span matListItemTitle>Settings</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content>
          <!-- Top Toolbar -->
          <mat-toolbar color="primary" class="top-toolbar">
            <button
              mat-icon-button
              (click)="sidenav.toggle()"
              aria-label="Toggle sidebar"
            >
              <mat-icon>menu</mat-icon>
            </button>
            
            <span class="toolbar-spacer"></span>
            
            <button
              mat-icon-button
              (click)="toggleTheme()"
              [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
              [matTooltip]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
          </mat-toolbar>

          <!-- Page Content -->
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      width: 100%;
      overflow: hidden;
    }

    .sidenav-container {
      height: 100%;
      width: 100%;
    }

    .sidenav {
      width: 250px;
      background: #f5f5f5;
      overflow-x: hidden;
      overflow-y: auto;
      border-radius: 0 !important;
    }

    ::ng-deep .sidenav .mat-drawer-inner-container {
      overflow-x: hidden;
      overflow-y: auto;
    }

    :host-context(.dark-theme) .sidenav {
      background: #2e2e2e;
    }

    .sidenav-header {
      padding: 24px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    :host-context(.dark-theme) .sidenav-header {
      border-bottom-color: #424242;
    }

    .sidenav-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) .sidenav-header h2 {
      color: #e6e1e5;
    }

    mat-nav-list {
      padding-top: 8px;
    }

    mat-nav-list a {
      margin: 4px 8px;
      border-radius: 8px;
      color: #1c1b1f;
    }

    :host-context(.dark-theme) mat-nav-list a {
      color: #e6e1e5;
    }

    mat-nav-list a:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    :host-context(.dark-theme) mat-nav-list a:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    mat-nav-list a mat-icon {
      color: rgba(0, 0, 0, 0.6);
    }

    :host-context(.dark-theme) mat-nav-list a mat-icon {
      color: #cac4d0;
    }

    mat-nav-list a:hover mat-icon {
      color: #1c1b1f;
    }

    :host-context(.dark-theme) mat-nav-list a:hover mat-icon {
      color: #e6e1e5;
    }

    mat-nav-list a.active {
      background-color: #e8def8;
      color: #1d192b;
    }

    mat-nav-list a.active mat-icon {
      color: #6750a4;
    }

    :host-context(.dark-theme) mat-nav-list a.active {
      background-color: #4a4458;
      color: #e8def8;
    }

    :host-context(.dark-theme) mat-nav-list a.active mat-icon {
      color: #d0bcff;
    }

    mat-sidenav-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .top-toolbar {
      flex: 0 0 auto;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .content-wrapper {
      flex: 1 1 auto;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 200px;
      }

      .content-wrapper {
        padding: 16px;
      }
    }
  `],
})
export class DashboardLayoutComponent {
  constructor(public themeService: ThemeService) {}

  // Getter to expose the signal value for template binding
  get isDarkMode() {
    return this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
