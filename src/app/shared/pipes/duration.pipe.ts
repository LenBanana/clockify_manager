import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to format duration in hours with proper sign and precision
 * Example: 8.5 => "+8.50h", -2.25 => "-2.25h"
 */
@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(hours: number | null | undefined, showSign = true, precision = 2): string {
    if (hours === null || hours === undefined) {
      return '0.00h';
    }

    const sign = showSign && hours >= 0 ? '+' : '';
    return `${sign}${hours.toFixed(precision)}h`;
  }
}
