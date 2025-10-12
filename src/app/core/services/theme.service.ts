import { Injectable, Renderer2, RendererFactory2, signal } from '@angular/core';
import { ConfigService } from './config.service';
import { filter, take } from 'rxjs/operators';

/**
 * Service to manage application theme (light/dark mode)
 * Persists theme preference in config and applies CSS classes
 * Automatically detects system theme preference on first startup
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  
  // Signal for reactive theme state
  isDarkMode = signal<boolean>(false);
  private initialized = false;

  constructor(
    private rendererFactory: RendererFactory2,
    private configService: ConfigService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    
    // Wait for config to load before initializing theme
    this.configService.config$.pipe(
      filter(config => !!config),
      take(1)
    ).subscribe(() => {
      if (!this.initialized) {
        this.initializeTheme();
        this.initialized = true;
      }
    });
    
    // Apply system preference immediately to avoid flash
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark);
  }

  /**
   * Initialize theme from config or system preference
   */
  private initializeTheme(): void {
    const config = this.configService.getCurrentConfig();
    
    // Check if theme preference exists in config
    if (config?.ui_settings?.theme) {
      const isDark = config.ui_settings.theme === 'dark';
      this.isDarkMode.set(isDark);
      this.applyTheme(isDark);
      console.log(`Theme loaded from config: ${config.ui_settings.theme}`);
    } else {
      // Fall back to system preference on first startup
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
      this.applyTheme(prefersDark);
      this.saveThemePreference(prefersDark ? 'dark' : 'light');
      console.log(`Theme set from system preference: ${prefersDark ? 'dark' : 'light'}`);
    }

    // Listen for system theme changes (only when user hasn't set explicit preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.hasExplicitThemePreference()) {
        const isDark = e.matches;
        this.isDarkMode.set(isDark);
        this.applyTheme(isDark);
        console.log(`Theme changed from system: ${isDark ? 'dark' : 'light'}`);
      }
    });
  }

  /**
   * Check if user has explicitly set theme preference
   */
  private hasExplicitThemePreference(): boolean {
    const config = this.configService.getCurrentConfig();
    return !!config?.ui_settings?.theme;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newIsDark = !this.isDarkMode();
    this.isDarkMode.set(newIsDark);
    this.applyTheme(newIsDark);
    this.saveThemePreference(newIsDark ? 'dark' : 'light');
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: 'light' | 'dark'): void {
    const isDark = theme === 'dark';
    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
    this.saveThemePreference(theme);
  }

  /**
   * Apply theme by adding/removing CSS class on body
   */
  private applyTheme(isDark: boolean): void {
    const body = document.body;
    
    if (isDark) {
      this.renderer.addClass(body, 'dark-theme');
      this.renderer.removeClass(body, 'light-theme');
    } else {
      this.renderer.addClass(body, 'light-theme');
      this.renderer.removeClass(body, 'dark-theme');
    }
  }

  /**
   * Save theme preference to config
   */
  private saveThemePreference(theme: 'light' | 'dark'): void {
    const config = this.configService.getCurrentConfig();
    
    const updatedConfig = {
      ...config,
      ui_settings: {
        ...config?.ui_settings,
        theme: theme
      }
    };

    this.configService.saveConfig(updatedConfig).subscribe({
      next: () => {
        console.log(`Theme preference saved: ${theme}`);
      },
      error: (error: any) => {
        console.error('Failed to save theme preference:', error);
      }
    });
  }

  /**
   * Get current theme as string
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.isDarkMode() ? 'dark' : 'light';
  }
}
