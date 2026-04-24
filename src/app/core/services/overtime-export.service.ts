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
   * Generates and saves an "Aufstellung der Überstunden" as an .xlsx file.
   *
   * Uses Tauri's native save dialog so the user can choose the target location.
   *
   * @param payoff  - the payoff entry (must have `allocations` populated)
   * @param employeeName - optional: shown in the info header block
   */
  async exportAufstellung(payoff: OvertimePayoff, employeeName?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clockify Manager';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Aufstellung Überstunden', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    // ── Column definitions ──────────────────────────────────────────────────
    sheet.columns = [
      { key: 'a', width: 20 },  // A: Datum
      { key: 'b', width: 13 },  // B: Wochentag
      { key: 'c', width: 22 },  // C: Überstunden gesamt
      { key: 'd', width: 22 },  // D: Angerechnete Stunden
      { key: 'e', width: 14 },  // E: Hinweis
    ];

    // ── Colour palette ──────────────────────────────────────────────────────
    const TITLE_BG    = { argb: 'FF1565C0' }; // deep blue
    const TITLE_FG    = { argb: 'FFFFFFFF' }; // white
    const HEADER_BG   = { argb: 'FFE3F2FD' }; // light blue for table header
    const HEADER_FG   = { argb: 'FF0D47A1' }; // dark blue text
    const ALT_ROW_BG  = { argb: 'FFF5F5F5' }; // light grey alternating
    const PARTIAL_BG  = { argb: 'FFFFF9C4' }; // light yellow – partial alloc
    const TOTAL_BG    = { argb: 'FFE8F5E9' }; // light green – total row
    const TOTAL_FG    = { argb: 'FF1B5E20' }; // dark green text
    const BORDER_BLUE: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF1565C0' } };
    const BORDER_GREEN: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF2E7D32' } };
    const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFBDBDBD' } };

    const allocations = payoff.allocations ?? [];

    // ── Row 1: Title ────────────────────────────────────────────────────────
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'AUFSTELLUNG DER ÜBERSTUNDEN';
    titleCell.font = { bold: true, size: 14, color: TITLE_FG, name: 'Calibri' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: TITLE_BG };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = { bottom: BORDER_BLUE };
    sheet.getRow(1).height = 30;

    // ── Rows 2-N: Info block ─────────────────────────────────────────────────
    let infoRow = 2;

    this.addInfoRow(sheet, infoRow++, 'Auszahlungsdatum', this.formatDateDE(payoff.date));
    this.addInfoRow(sheet, infoRow++, 'Beschreibung', payoff.description || '—');
    if (employeeName) {
      this.addInfoRow(sheet, infoRow++, 'Mitarbeiter', employeeName);
    }
    this.addInfoRow(sheet, infoRow++, 'Gesamtstunden', this.formatHoursDE(payoff.hours));

    // ── Blank separator row ──────────────────────────────────────────────────
    infoRow++;

    // ── Table header row ─────────────────────────────────────────────────────
    const headerRowNum = infoRow++;
    const headers = ['Datum', 'Wochentag', 'Überstunden gesamt', 'Angerechnete Stunden', 'Hinweis'];
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

    // ── Data rows ─────────────────────────────────────────────────────────────
    let totalAllocated = 0;

    for (let i = 0; i < allocations.length; i++) {
      const alloc = allocations[i];
      const isPartial = alloc.allocatedHours < alloc.availableOvertime - 0.001;
      const rowNum = headerRowNum + 1 + i;
      const row = sheet.getRow(rowNum);

      const values = [
        this.formatDateDE(alloc.date),
        this.translateWeekday(alloc.dayOfWeek),
        `+${this.formatHoursDE(alloc.availableOvertime)}`,
        this.formatHoursDE(alloc.allocatedHours),
        isPartial ? 'teilweise' : 'vollständig',
      ];

      values.forEach((v, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = v;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 11 };
        cell.border = {
          left: BORDER_THIN,
          right: BORDER_THIN,
          top: BORDER_THIN,
          bottom: BORDER_THIN,
        };

        // Highlight: partial allocation in yellow, alternate row in light grey
        if (isPartial) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: PARTIAL_BG };
        } else if (i % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: ALT_ROW_BG };
        }
      });

      row.height = 18;
      totalAllocated += alloc.allocatedHours;
    }

    // ── Total row ─────────────────────────────────────────────────────────────
    const totalRowNum = headerRowNum + 1 + allocations.length;
    const totalRow = sheet.getRow(totalRowNum);
    const totalValues = ['', 'Gesamt', '', this.formatHoursDE(totalAllocated), ''];
    totalValues.forEach((v, idx) => {
      const cell = totalRow.getCell(idx + 1);
      cell.value = v || null;
      cell.font = { bold: true, color: TOTAL_FG, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: TOTAL_BG };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: BORDER_GREEN,
        bottom: BORDER_GREEN,
        left: BORDER_THIN,
        right: BORDER_THIN,
      };
    });
    totalRow.height = 20;

    const defaultFileName = `Aufstellung_Ueberstunden_${payoff.date}.xlsx`;
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

  // ── Private helpers ───────────────────────────────────────────────────────

  private addInfoRow(sheet: ExcelJS.Worksheet, rowNum: number, label: string, value: string): void {
    const labelCell = sheet.getCell(rowNum, 1);
    labelCell.value = label + ':';
    labelCell.font = { bold: true, color: { argb: 'FF1565C0' }, name: 'Calibri' };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    sheet.mergeCells(rowNum, 2, rowNum, 5);
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
    // Use comma as decimal separator for German formatting
    return hours.toFixed(2).replace('.', ',') + ' h';
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
}
