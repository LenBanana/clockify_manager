import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, catchError, map, tap } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';
import { AppConfig, DEFAULT_CONFIG, ClockifyConfig, WorkSettings, LocationSettings } from '../models/config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configSubject = new BehaviorSubject<AppConfig>(DEFAULT_CONFIG);
  public config$ = this.configSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {
    this.loadConfig();
  }

  /**
   * Load configuration from backend
   */
  loadConfig(): Observable<AppConfig> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return from(invoke<AppConfig>('get_config')).pipe(
      tap(config => {
        this.configSubject.next(config);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = error.message || 'Failed to load configuration';
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        // Return default config on error
        this.configSubject.next(DEFAULT_CONFIG);
        throw error;
      })
    );
  }

  /**
   * Save configuration to backend
   */
  saveConfig(config: AppConfig): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return from(invoke<void>('save_config', { config })).pipe(
      tap(() => {
        this.configSubject.next(config);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = error.message || 'Failed to save configuration';
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Get current configuration (synchronous)
   */
  getCurrentConfig(): AppConfig {
    return this.configSubject.getValue();
  }

  /**
   * Check if application is configured
   * Returns true if API key and workspace ID are set
   */
  isConfigured(): boolean {
    const config = this.getCurrentConfig();
    return !!(config.clockify.api_key && config.clockify.workspace_id);
  }

  /**
   * Check if API key is set
   */
  hasApiKey(): boolean {
    const config = this.getCurrentConfig();
    return !!config.clockify.api_key && config.clockify.api_key.length > 0;
  }

  /**
   * Check if workspace is selected
   */
  hasWorkspace(): boolean {
    const config = this.getCurrentConfig();
    return !!config.clockify.workspace_id && config.clockify.workspace_id.length > 0;
  }

  /**
   * Check if Bundesland is set
   */
  hasBundesland(): boolean {
    const config = this.getCurrentConfig();
    return !!config.location.bundesland_code && config.location.bundesland_code.length > 0;
  }

  /**
   * Update Clockify configuration
   */
  updateClockifyConfig(clockifyConfig: ClockifyConfig): Observable<void> {
    const config = this.getCurrentConfig();
    const updatedConfig: AppConfig = {
      ...config,
      clockify: clockifyConfig
    };
    return this.saveConfig(updatedConfig);
  }

  /**
   * Update work settings
   */
  updateWorkSettings(workSettings: WorkSettings): Observable<void> {
    const config = this.getCurrentConfig();
    const updatedConfig: AppConfig = {
      ...config,
      work_settings: workSettings
    };
    return this.saveConfig(updatedConfig);
  }

  /**
   * Update location settings
   */
  updateLocationSettings(locationSettings: LocationSettings): Observable<void> {
    const config = this.getCurrentConfig();
    const updatedConfig: AppConfig = {
      ...config,
      location: locationSettings
    };
    return this.saveConfig(updatedConfig);
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): Observable<void> {
    return this.saveConfig(DEFAULT_CONFIG);
  }

  /**
   * Get config file path (for debugging)
   */
  getConfigPath(): Observable<string> {
    return from(invoke<string>('get_config_path'));
  }

  /**
   * Clear current error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }
}
