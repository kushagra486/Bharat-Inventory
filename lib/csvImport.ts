// ─── CSV / Excel Bulk Import ────────────────────────────────────────────────────
// 100% client-side parsing. No server round-trip, no API key, no row limit
// imposed by any third party. papaparse (CSV) and xlsx/SheetJS (Excel) are both
// MIT-licensed, free, open source.

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ProductInsert } from '@/types';

export interface ImportRow {
  raw: Record<string, string>;
  parsed: Partial<ProductInsert> & { name: string };
  errors: string[];
  isDuplicate?: boolean;
}

export interface ImportResult {
  rows: ImportRow[];
  validCount: number;
  errorCount: number;
}

// Column header aliases — accepts common variations so users don't have to
// match an exact template.
const HEADER_ALIASES: Record<string, keyof ProductInsert | 'category_name' | 'supplier_name'> = {
  name: 'name', product: 'name', 'product name': 'name', productname: 'name',
  category: 'category_name', categoryname: 'category_name',
  barcode: 'barcode', upc: 'barcode', ean: 'barcode',
  batch: 'batch_number', batchnumber: 'batch_number', 'batch number': 'batch_number', lot: 'batch_number',
  mfg: 'manufacture_date', mfgdate: 'manufacture_date', 'manufacture date': 'manufacture_date', 'mfg date': 'manufacture_date',
  expiry: 'expiry_date', expirydate: 'expiry_date', 'expiry date': 'expiry_date', 'exp date': 'expiry_date', exp: 'expiry_date',
  qty: 'quantity', quantity: 'quantity',
  unit: 'unit',
  supplier: 'supplier_name', suppliername: 'supplier_name',
  price: 'price',
  location: 'location',
  notes: 'notes', note: 'notes',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Parses a CSV file's text content into raw row objects. */
export function parseCsvText(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeHeader(h),
  });
  return result.data;
}

/** Parses an Excel file (as ArrayBuffer) into raw row objects from the first sheet. */
export function parseExcelBuffer(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  // Normalize headers the same way as CSV
  return (json as Record<string, any>[]).map(row => {
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      normalized[normalizeHeader(key)] = String(row[key] ?? '');
    }
    return normalized;
  });
}

function toIsoDate(raw: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const sep = /[\/\-.]/;
  const parts = trimmed.split(sep).map(p => p.trim());
  if (parts.length !== 3) return undefined;

  let [a, b, c] = parts.map(Number);
  if ([a, b, c].some(isNaN)) return undefined;

  let year: number, month: number, day: number;
  if (a > 31) { year = a; month = b; day = c; }
  else if (c < 100) { year = 2000 + c; month = b; day = a; }
  else { year = c; month = b; day = a; }

  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return undefined;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Validates and maps raw parsed rows into structured product rows ready for
 * preview and bulk insert. Category/supplier name resolution to IDs happens
 * at import time once the caller has the live category/supplier lists.
 */
export function buildImportRows(
  rawRows: Record<string, string>[],
  existingBarcodes: Set<string>
): ImportResult {
  const rows: ImportRow[] = rawRows.map(raw => {
    const errors: string[] = [];
    const mapped: Record<string, any> = {};

    for (const [header, value] of Object.entries(raw)) {
      const field = HEADER_ALIASES[header];
      if (field) mapped[field] = value;
    }

    const name = (mapped.name || '').trim();
    if (!name) errors.push('Missing product name');

    const expiryRaw = mapped.expiry_date || '';
    const expiry_date = toIsoDate(expiryRaw);
    if (!expiry_date) errors.push('Missing or invalid expiry date');

    const manufacture_date = mapped.manufacture_date ? toIsoDate(mapped.manufacture_date) : undefined;

    const quantity = mapped.quantity ? parseInt(mapped.quantity, 10) : 1;
    const price = mapped.price ? parseFloat(mapped.price) : undefined;

    const barcode = mapped.barcode?.trim() || undefined;
    const isDuplicate = barcode ? existingBarcodes.has(barcode) : false;

    return {
      raw,
      parsed: {
        name,
        barcode,
        batch_number: mapped.batch_number?.trim() || undefined,
        manufacture_date,
        expiry_date: expiry_date || '',
        quantity: isNaN(quantity) ? 1 : quantity,
        unit: mapped.unit?.trim() || 'pcs',
        price: price && !isNaN(price) ? price : undefined,
        location: mapped.location?.trim() || undefined,
        notes: mapped.notes?.trim() || undefined,
        // category_name / supplier_name kept as raw strings on the row;
        // resolved to IDs by the screen using live category/supplier lists.
        ...( { category_name: mapped.category_name?.trim(), supplier_name: mapped.supplier_name?.trim() } as any ),
      } as any,
      errors,
      isDuplicate,
    };
  });

  return {
    rows,
    validCount: rows.filter(r => r.errors.length === 0).length,
    errorCount: rows.filter(r => r.errors.length > 0).length,
  };
}

/** Generates a downloadable CSV template string matching the expected columns. */
export function generateCsvTemplate(): string {
  const headers = [
    'name', 'category', 'barcode', 'batch_number', 'manufacture_date',
    'expiry_date', 'quantity', 'unit', 'supplier', 'price', 'location', 'notes',
  ];
  const example = [
    'Amul Milk 1L', 'Dairy', '8901234567890', 'BATCH-001', '2026-06-01',
    '2026-07-15', '10', 'pcs', 'Local Dairy Supplier', '60', 'Fridge A', 'Sample row — delete me',
  ];
  return Papa.unparse([headers, example]);
}
