import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to format dates consistently across the app
 * Supports various format options
 */
@Pipe({
  name: 'appDate',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'short' | 'medium' | 'long' | 'dayMonth' = 'medium'): string {
    if (!value) {
      return '—';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return '—';
    }

    switch (format) {
      case 'short':
        // "Jan 15"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      case 'medium':
        // "Jan 15, 2025"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      case 'long':
        // "January 15, 2025"
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      case 'dayMonth':
        // "Monday, Jan 15"
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      
      default:
        return date.toLocaleDateString('en-US');
    }
  }
}
