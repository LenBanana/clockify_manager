/**
 * Clockify data models matching Rust backend structures
 */

export interface Workspace {
  id: string;
  name: string;
  hourlyRate?: HourlyRate;
  costRate?: HourlyRate;
  memberships?: Membership[];
  workspaceSettings?: any;
  imageUrl?: string;
  featureSubscriptionType?: string;
  features?: string[];
  currencies?: Currency[];
  subdomain?: Subdomain;
  cakeOrganizationId?: string;
}

export interface HourlyRate {
  amount: number;
  currency: string;
}

export interface Membership {
  userId: string;
  hourlyRate?: HourlyRate;
  costRate?: HourlyRate;
  targetId: string;
  membershipType?: string;
  membershipStatus?: string;
  memberStatus?: string; // Backwards compatibility
}

export interface Currency {
  id: string;
  code: string;
  isDefault?: boolean;
}

export interface Subdomain {
  name?: string;
  enabled: boolean;
}

export interface Project {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  color?: string;
  billable: boolean;
  archived: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  status?: string;
}

export interface Tag {
  id: string;
  name: string;
  workspaceId: string;
}

export interface TimeEntry {
  id: string;
  description?: string;
  userId: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  timeInterval: TimeInterval;
  billable: boolean;
  tagIds?: string[];
  customFieldValues?: any[];
  type?: string;
  kioskId?: string;
  hourlyRate?: HourlyRate;
  costRate?: HourlyRate;
  isLocked?: boolean;
}

export interface TimeInterval {
  start: string; // ISO 8601 datetime
  end?: string; // ISO 8601 datetime - can be null for running timers
  /**
   * ISO 8601 duration format (e.g., "PT8H30M15S")
   * Can be null for running timers
   */
  duration?: string;
}

/**
 * Helper function to parse ISO 8601 duration to decimal hours
 * Handles formats like: PT8H30M15S, PT8H, PT45M, PT0S
 */
export function parseDurationToHours(duration: string | null | undefined): number {
  if (!duration) {
    return 0;
  }

  // Remove PT prefix
  if (!duration.startsWith('PT')) {
    console.warn('Invalid duration format:', duration);
    return 0;
  }

  const durationStr = duration.substring(2);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  let currentNumber = '';

  for (const ch of durationStr) {
    if (ch >= '0' && ch <= '9' || ch === '.') {
      currentNumber += ch;
    } else {
      const value = parseFloat(currentNumber);
      if (isNaN(value)) {
        console.warn('Invalid number in duration:', currentNumber);
        return 0;
      }

      switch (ch) {
        case 'H':
          hours = value;
          break;
        case 'M':
          minutes = value;
          break;
        case 'S':
          seconds = value;
          break;
        default:
          console.warn('Unknown duration unit:', ch);
      }

      currentNumber = '';
    }
  }

  return hours + (minutes / 60) + (seconds / 3600);
}

/**
 * Calculate total hours from an array of time entries
 */
export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + parseDurationToHours(entry.timeInterval.duration);
  }, 0);
}

/**
 * Group time entries by project
 */
export interface ProjectTimeBreakdown {
  projectId: string | null;
  projectName: string;
  entries: TimeEntry[];
  totalHours: number;
  billableHours: number;
}

export function groupByProject(
  entries: TimeEntry[],
  projects: Project[]
): ProjectTimeBreakdown[] {
  const projectMap = new Map<string | null, TimeEntry[]>();

  // Group entries by project
  for (const entry of entries) {
    const projectId = entry.projectId ?? null;
    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, []);
    }
    projectMap.get(projectId)!.push(entry);
  }

  // Create breakdown
  const breakdown: ProjectTimeBreakdown[] = [];

  for (const [projectId, projectEntries] of projectMap.entries()) {
    const project = projectId ? projects.find(p => p.id === projectId) : null;
    const totalHours = calculateTotalHours(projectEntries);
    const billableHours = calculateTotalHours(
      projectEntries.filter(e => e.billable)
    );

    breakdown.push({
      projectId,
      projectName: project?.name ?? '(No Project)',
      entries: projectEntries,
      totalHours,
      billableHours,
    });
  }

  // Sort by total hours descending
  breakdown.sort((a, b) => b.totalHours - a.totalHours);

  return breakdown;
}
