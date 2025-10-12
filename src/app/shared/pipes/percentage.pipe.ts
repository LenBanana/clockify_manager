import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to format percentage values with proper precision
 * Example: 0.5 => "50.0%", 0.333 => "33.3%"
 */
@Pipe({
  name: 'percentage',
  standalone: true
})
export class PercentagePipe implements PipeTransform {
  transform(value: number | null | undefined, precision = 1, includeSymbol = true): string {
    if (value === null || value === undefined) {
      return '0.0%';
    }

    const formatted = value.toFixed(precision);
    return includeSymbol ? `${formatted}%` : formatted;
  }
}
