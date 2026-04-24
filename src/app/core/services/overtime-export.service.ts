import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { OvertimePayoff, OvertimePayoffAllocation } from '../models/config.model';
import { DayBreakdown } from '../models/overtime.model';

export interface AllocationResult {
  allocations: OvertimePayoffAllocation[];
  /** Remaining hours that could not be allocated (insufficient surplus data in the provided breakdown) */
  unallocated: number;
}

export interface OvertimeTableExportOptions {
  startDate?: string;
  endDate?: string;
  employeeName?: string;
}

@Injectable({ providedIn: 'root' })
export class OvertimeExportService {

  /**
   * FIFO allocation: distributes `payoffHours` across days with positive overtime,
   * oldest first, skipping hours already consumed by `existingPayoffs`.
   *
   * @param payoffHours   - hours to cover with this payoff
   * @param dailyBreakdown - full day breakdown in scope (ideally from entry_date → today)
   * @param existingPayoffs - already-saved payoffs (with their allocations) to avoid double-counting
   * @param excludePayoffId - id of the payoff being edited (excluded from consumed map)
   */
  computeAllocations(
    payoffHours: number,
    dailyBreakdown: DayBreakdown[],
    existingPayoffs: OvertimePayoff[],
    excludePayoffId?: string,
  ): AllocationResult {
    // Build a map of already-consumed overtime per date from other payoffs
    const consumedByDate = new Map<string, number>();
    for (const payoff of existingPayoffs) {
      if (payoff.id === excludePayoffId) continue;
      for (const alloc of payoff.allocations ?? []) {
        consumedByDate.set(alloc.date, (consumedByDate.get(alloc.date) ?? 0) + alloc.allocatedHours);
      }
    }

    // Collect all surplus days, sorted chronologically (oldest first = FIFO)
    const surplusDays = dailyBreakdown
      .filter(d => d.overtimeHours > 0.001)
      .sort((a, b) => a.date.localeCompare(b.date));

    const allocations: OvertimePayoffAllocation[] = [];
    let remaining = payoffHours;

    for (const day of surplusDays) {
      if (remaining < 0.001) break;
      const alreadyConsumed = consumedByDate.get(day.date) ?? 0;
      const available = day.overtimeHours - alreadyConsumed;
      if (available < 0.001) continue;

      const allocate = Math.min(available, remaining);
      allocations.push({
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        availableOvertime: Math.round(day.overtimeHours * 100) / 100,
        allocatedHours: Math.round(allocate * 100) / 100,
      });
      remaining -= allocate;
    }

    return {
      allocations,
      unallocated: Math.max(0, Math.round(remaining * 100) / 100),
    };
  }

  /**
   * Generates and saves the current overtime table as an .xlsx file.
   */
  async exportCurrentTable(
    dailyBreakdown: DayBreakdown[],
    options: OvertimeTableExportOptions = {},
  ): Promise<void> {
    if (!dailyBreakdown.length) {
      throw new Error('Keine Überstunden-Tabelle zum Exportieren verfügbar.');
    }

    const exportDays = dailyBreakdown.filter((day) => this.shouldIncludeExportRow(day));
    if (!exportDays.length) {
      throw new Error('Für den gewählten Zeitraum gibt es keine exportierbaren Zeilen.');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clockify Manager';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Aufstellung Überstunden', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { key: 'date', width: 18 },
      { key: 'day', width: 15 },
      { key: 'start', width: 11 },
      { key: 'end', width: 11 },
      { key: 'break', width: 11 },
      { key: 'hours', width: 13 },
      { key: 'overtime', width: 14 },
      { key: 'deficit', width: 14 },
    ];

    const TITLE_BG = { argb: 'FF1565C0' };
    const TITLE_FG = { argb: 'FFFFFFFF' };
    const HEADER_BG = { argb: 'FFE3F2FD' };
    const HEADER_FG = { argb: 'FF0D47A1' };
    const ALT_ROW_BG = { argb: 'FFF5F5F5' };
    const TOTAL_BG = { argb: 'FFE8F5E9' };
    const TOTAL_FG = { argb: 'FF1B5E20' };
    const POSITIVE_BG = { argb: 'FFE8F5E9' };
    const NEGATIVE_BG = { argb: 'FFFFEBEE' };
    const VACATION_BG = { argb: 'FFE8F5E9' };
    const SICK_BG = { argb: 'FFFFEBEE' };
    const PERSONAL_BG = { argb: 'FFFFF3E0' };
    const TRAINING_BG = { argb: 'FFF3E5F5' };
    const BUSINESS_BG = { argb: 'FFE0F7FA' };
    const SALDO_BG = { argb: 'FFFFF3E0' };
    const WEEKEND_BG = { argb: 'FFF5F5F5' };
    const HOLIDAY_BG = { argb: 'FFE3F2FD' };
    const BORDER_BLUE: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF1565C0' } };
    const BORDER_GREEN: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF2E7D32' } };
    const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFBDBDBD' } };

    const resolvedStartDate = options.startDate ?? dailyBreakdown[0]?.date;
    const resolvedEndDate = options.endDate ?? dailyBreakdown[dailyBreakdown.length - 1]?.date;
    const exportedAt = new Date();
    const rows = exportDays.map((day) => ({
      date: this.formatDateDE(day.date),
      day: this.buildDayLabel(day),
      start: day.startTime ?? '',
      end: day.endTime ?? '',
      break: day.startTime && day.endTime ? this.formatDurationHHMM(day.breakHours ?? 0) : '',
      hours: day.actualHours,
      overtime: day.overtimeHours > 0.001 ? day.overtimeHours : null,
      deficit: day.overtimeHours < -0.001 ? Math.abs(day.overtimeHours) : null,
      rawExpected: day.expectedHours,
      rawOvertime: day.overtimeHours,
      rawHours: day.actualHours,
      dayType: day.dayType,
    }));
    const totalExpected = rows.reduce((sum, row) => sum + row.rawExpected, 0);
    const totalWorked = rows.reduce((sum, row) => sum + row.rawHours, 0);
    const totalOvertime = rows.reduce((sum, row) => sum + Math.max(row.rawOvertime, 0), 0);
    const totalDeficit = rows.reduce((sum, row) => sum + Math.max(-row.rawOvertime, 0), 0);
    const netOvertime = totalOvertime - totalDeficit;
    const DAY_TYPE_FILL: Partial<Record<DayBreakdown['dayType'], { argb: string }>> = {
      Weekend: WEEKEND_BG,
      PublicHoliday: HOLIDAY_BG,
      Vacation: VACATION_BG,
      SickDay: SICK_BG,
      PersonalDay: PERSONAL_BG,
      Training: TRAINING_BG,
      BusinessTrip: BUSINESS_BG,
      Saldo: SALDO_BG,
    };

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'AUFSTELLUNG DER ÜBERSTUNDEN';
    titleCell.font = { bold: true, size: 14, color: TITLE_FG, name: 'Calibri' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: TITLE_BG };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = { bottom: BORDER_BLUE };
    sheet.getRow(1).height = 30;

    let infoRow = 2;

    if (resolvedStartDate && resolvedEndDate) {
      const periodLabel = resolvedStartDate === resolvedEndDate
        ? this.formatDateDE(resolvedStartDate)
        : `${this.formatDateDE(resolvedStartDate)} bis ${this.formatDateDE(resolvedEndDate)}`;
      this.addInfoRow(sheet, infoRow++, 'Zeitraum', periodLabel, 8);
    }
    this.addInfoRow(sheet, infoRow++, 'Exportiert am', exportedAt.toLocaleString('de-DE'), 8);
    if (options.employeeName) {
      this.addInfoRow(sheet, infoRow++, 'Mitarbeiter', options.employeeName, 8);
    }
    this.addInfoRow(sheet, infoRow++, 'Soll Stunden', this.formatHoursDE(totalExpected), 8);
    this.addInfoRow(sheet, infoRow++, 'Ist Stunden', this.formatHoursDE(totalWorked), 8);
    const overtimeInfoRowNum = infoRow;
    this.addInfoRow(sheet, infoRow++, 'Saldo Überstunden', this.formatSignedHoursDE(netOvertime), 8);

    infoRow++;

    const headerRowNum = infoRow++;
    const headers = ['Datum', 'Tag', 'Beginn', 'Ende', 'Pause', 'Stunden', 'Überstunden', 'Minusstunden'];
    const headerRow = sheet.getRow(headerRowNum);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { bold: true, color: HEADER_FG, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: HEADER_BG };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: BORDER_BLUE,
        bottom: BORDER_BLUE,
        left: BORDER_THIN,
        right: BORDER_THIN,
      };
    });
    headerRow.height = 22;
    sheet.autoFilter = {
      from: { row: headerRowNum, column: 1 },
      to: { row: headerRowNum, column: headers.length },
    };

    const dataStartRowNum = headerRowNum + 1;
    const dataEndRowNum = headerRowNum + rows.length;
    const hoursNumberFormat = '#,##0.00" h"';

    for (let i = 0; i < rows.length; i++) {
      const exportRow = rows[i];
      const rowNum = headerRowNum + 1 + i;
      const row = sheet.getRow(rowNum);
      const typeFill = DAY_TYPE_FILL[exportRow.dayType];

      const values = [
        exportRow.date,
        exportRow.day,
        exportRow.start,
        exportRow.end,
        exportRow.break,
        exportRow.hours,
        exportRow.overtime,
        exportRow.deficit,
      ];

      values.forEach((v, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = v;
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: idx === 1,
        };
        cell.font = { name: 'Calibri', size: 11 };
        cell.border = {
          left: BORDER_THIN,
          right: BORDER_THIN,
          top: BORDER_THIN,
          bottom: BORDER_THIN,
        };

        if (idx >= 5) {
          cell.numFmt = hoursNumberFormat;
        }

        if (typeFill) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: typeFill };
        }

        if (idx === 6 && exportRow.rawOvertime > 0.001) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: POSITIVE_BG };
        } else if (idx === 7 && exportRow.rawOvertime < -0.001) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: NEGATIVE_BG };
        } else if (!typeFill && i % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: ALT_ROW_BG };
        }

        if (idx === 1 && exportRow.day.includes('\n')) {
          cell.font = { name: 'Calibri', size: 11, bold: true };
        }
      });

      row.height = exportRow.day.includes('\n') ? 30 : 18;
    }

    const totalRowNum = headerRowNum + 1 + rows.length;
    const totalRow = sheet.getRow(totalRowNum);
    const totalValues = [
      '',
      'Gesamt',
      '',
      '',
      '',
      { formula: `SUBTOTAL(109,F${dataStartRowNum}:F${dataEndRowNum})`, result: totalWorked },
      { formula: `SUBTOTAL(109,G${dataStartRowNum}:G${dataEndRowNum})`, result: totalOvertime },
      { formula: `SUBTOTAL(109,H${dataStartRowNum}:H${dataEndRowNum})`, result: totalDeficit },
    ];
    totalValues.forEach((v, idx) => {
      const cell = totalRow.getCell(idx + 1);
      cell.value = v || null;
      cell.font = { bold: true, color: TOTAL_FG, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: TOTAL_BG };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (idx >= 5) {
        cell.numFmt = hoursNumberFormat;
      }
      cell.border = {
        top: BORDER_GREEN,
        bottom: BORDER_GREEN,
        left: BORDER_THIN,
        right: BORDER_THIN,
      };
    });
    totalRow.height = 20;

    const overtimeValueCell = sheet.getCell(overtimeInfoRowNum, 2);
    overtimeValueCell.value = {
      formula: `G${totalRowNum}-H${totalRowNum}`,
      result: netOvertime,
    };
    overtimeValueCell.numFmt = '+#,##0.00" h";-#,##0.00" h";0.00" h"';
    overtimeValueCell.font = {
      name: 'Calibri',
      bold: true,
      color: netOvertime < -0.001 ? { argb: 'FFC62828' } : { argb: 'FF2E7D32' },
    };

    const defaultFileName = this.buildDefaultFileName(resolvedStartDate, resolvedEndDate);
    const targetPath = await save({
      defaultPath: defaultFileName,
      filters: [
        {
          name: 'Excel-Arbeitsmappe',
          extensions: ['xlsx'],
        },
      ],
    });

    // User cancelled the dialog.
    if (!targetPath) {
      return;
    }

    // ── Generate and save ─────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    await writeFile(targetPath, bytes);
  }

  private addInfoRow(sheet: ExcelJS.Worksheet, rowNum: number, label: string, value: string, lastColumn = 5): void {
    const labelCell = sheet.getCell(rowNum, 1);
    labelCell.value = label + ':';
    labelCell.font = { bold: true, color: { argb: 'FF1565C0' }, name: 'Calibri' };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    sheet.mergeCells(rowNum, 2, rowNum, lastColumn);
    const valueCell = sheet.getCell(rowNum, 2);
    valueCell.value = value;
    valueCell.font = { name: 'Calibri' };
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' };

    sheet.getRow(rowNum).height = 18;
  }

  private formatDateDE(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  }

  private formatHoursDE(hours: number): string {
    return hours.toFixed(2).replace('.', ',') + ' h';
  }

  private formatSignedHoursDE(hours: number): string {
    const sign = hours > 0.001 ? '+' : hours < -0.001 ? '-' : '';
    return `${sign}${Math.abs(hours).toFixed(2).replace('.', ',')} h`;
  }

  private formatDurationHHMM(hours: number): string {
    const totalMinutes = Math.max(0, Math.round(hours * 60));
    const durationHours = Math.floor(totalMinutes / 60);
    const durationMinutes = totalMinutes % 60;
    return `${String(durationHours).padStart(2, '0')}:${String(durationMinutes).padStart(2, '0')}`;
  }

  private buildDefaultFileName(startDate?: string, endDate?: string): string {
    if (startDate && endDate) {
      return startDate === endDate
        ? `Aufstellung_Ueberstunden_${startDate}.xlsx`
        : `Aufstellung_Ueberstunden_${startDate}_bis_${endDate}.xlsx`;
    }

    const today = new Date().toISOString().slice(0, 10);
    return `Aufstellung_Ueberstunden_${today}.xlsx`;
  }

  private translateWeekday(englishDay: string): string {
    const map: Record<string, string> = {
      Monday: 'Montag',
      Tuesday: 'Dienstag',
      Wednesday: 'Mittwoch',
      Thursday: 'Donnerstag',
      Friday: 'Freitag',
      Saturday: 'Samstag',
      Sunday: 'Sonntag',
    };
    return map[englishDay] ?? englishDay;
  }

  private shouldIncludeExportRow(day: DayBreakdown): boolean {
    const hasHours = day.actualHours > 0.001 || Math.abs(day.overtimeHours) > 0.001;
    if (hasHours || day.dayType === 'WorkDay') {
      return true;
    }

    return day.dayType !== 'Weekend' && day.dayType !== 'PublicHoliday';
  }

  private buildDayLabel(day: DayBreakdown): string {
    const weekday = this.translateWeekday(day.dayOfWeek);
    const dayTypeLabel = this.translateDayType(day.dayType);

    return dayTypeLabel ? `${weekday}\n${dayTypeLabel}` : weekday;
  }

  private translateDayType(dayType: DayBreakdown['dayType']): string | null {
    const map: Record<Exclude<DayBreakdown['dayType'], 'WorkDay'>, string> = {
      Weekend: 'Wochenende',
      PublicHoliday: 'Feiertag',
      Vacation: 'Urlaub',
      SickDay: 'Krank',
      PersonalDay: 'Privat',
      Training: 'Schulung',
      BusinessTrip: 'Dienstreise',
      Saldo: 'Saldo',
    };

    return dayType === 'WorkDay' ? null : map[dayType];
  }
}
