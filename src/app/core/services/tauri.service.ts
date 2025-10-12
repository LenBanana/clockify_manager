import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { from, Observable } from 'rxjs';
import { AppConfig } from '../models/config.model';

/**
 * Service to interact with Tauri backend commands
 * Wraps all Tauri invoke calls with proper typing and RxJS observables
 */
@Injectable({
  providedIn: 'root'
})
export class TauriService {

  constructor() { }

  /**
   * Test command to verify communication with Rust backend
   */
  greet(name: string): Observable<string> {
    return from(invoke<string>('greet', { name }));
  }

  /**
   * Get system information
   */
  getSystemInfo(): Observable<string> {
    return from(invoke<string>('get_system_info'));
  }

  /**
   * Get current application configuration
   */
  getConfig(): Observable<AppConfig> {
    return from(invoke<AppConfig>('get_config'));
  }

  /**
   * Save application configuration
   */
  saveConfig(config: AppConfig): Observable<void> {
    return from(invoke<void>('save_config', { config }));
  }

  /**
   * Get the path to the config file (for debugging)
   */
  getConfigPath(): Observable<string> {
    return from(invoke<string>('get_config_path'));
  }

  /**
   * Check if running in Tauri environment
   */
  isTauri(): boolean {
    return '__TAURI__' in window;
  }

  /**
   * Wait for Tauri to be ready (with timeout)
   * Returns a promise that resolves when Tauri is available or rejects after timeout
   */
  waitForTauri(timeoutMs: number = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      // Check immediately
      if ('__TAURI__' in window) {
        resolve(true);
        return;
      }

      // Poll for Tauri availability
      const checkInterval = 50; // Check every 50ms
      const maxAttempts = timeoutMs / checkInterval;
      let attempts = 0;

      const intervalId = setInterval(() => {
        attempts++;
        
        if ('__TAURI__' in window) {
          clearInterval(intervalId);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          resolve(false); // Not in Tauri environment
        }
      }, checkInterval);
    });
  }
}
