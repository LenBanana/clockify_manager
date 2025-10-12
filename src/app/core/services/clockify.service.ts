import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { from, Observable } from 'rxjs';
import { Project, TimeEntry, User, Workspace } from '../models/clockify.model';

/**
 * Service to interact with Clockify API via Tauri backend
 */
@Injectable({
  providedIn: 'root'
})
export class ClockifyService {

  constructor() { }

  /**
   * Validate a Clockify API key
   */
  validateApiKey(apiKey: string): Observable<boolean> {
    return from(invoke<boolean>('validate_clockify_api_key', { apiKey }));
  }

  /**
   * Fetch all workspaces for the user
   */
  fetchWorkspaces(apiKey: string, baseUrl?: string): Observable<Workspace[]> {
    return from(invoke<Workspace[]>('fetch_clockify_workspaces', { 
      apiKey, 
      baseUrl 
    }));
  }

  /**
   * Fetch all projects in a workspace
   */
  fetchProjects(
    apiKey: string, 
    workspaceId: string, 
    baseUrl?: string
  ): Observable<Project[]> {
    return from(invoke<Project[]>('fetch_clockify_projects', { 
      apiKey, 
      workspaceId, 
      baseUrl 
    }));
  }

  /**
   * Fetch current user information
   */
  fetchUser(apiKey: string, baseUrl?: string): Observable<User> {
    return from(invoke<User>('fetch_clockify_user', { 
      apiKey, 
      baseUrl 
    }));
  }

  /**
   * Fetch time entries for a date range
   * @param apiKey - Clockify API key
   * @param workspaceId - Workspace ID
   * @param startDate - Start date in ISO 8601 format (e.g., "2024-01-01T00:00:00Z")
   * @param endDate - End date in ISO 8601 format (e.g., "2024-01-31T23:59:59Z")
   * @param baseUrl - Optional base URL for Clockify API
   */
  fetchTimeEntries(
    apiKey: string,
    workspaceId: string,
    startDate: string,
    endDate: string,
    baseUrl?: string
  ): Observable<TimeEntry[]> {
    return from(invoke<TimeEntry[]>('fetch_clockify_time_entries', {
      apiKey,
      workspaceId,
      startDate,
      endDate,
      baseUrl
    }));
  }

  /**
   * Convenience method to fetch time entries using Date objects
   */
  fetchTimeEntriesForDateRange(
    apiKey: string,
    workspaceId: string,
    start: Date,
    end: Date,
    baseUrl?: string
  ): Observable<TimeEntry[]> {
    const startDate = start.toISOString();
    const endDate = end.toISOString();
    return this.fetchTimeEntries(apiKey, workspaceId, startDate, endDate, baseUrl);
  }
}
