// ─── On-Device OCR (Tesseract.js) ──────────────────────────────────────────────
// 100% free, open-source, runs entirely on-device (WASM) — zero network calls
// after the initial language pack download, zero rate limits, works offline.
// https://github.com/naptha/tesseract.js
//
// NOTE: Tesseract.js works on web (browser canvas) and can run inside an Expo
// app via a WebView bridge for native, OR via the pure-web build for the
// website. For native iOS/Android we run it inside a hidden WebView that hosts
// the tesseract.js worker — this avoids any native module compilation while
// staying 100% free and offline-capable after first load.

import { createWorker, type Worker } from 'tesseract.js';

export interface OcrExtractedFields {
  rawText: string;
  productName?: string;
  expiryDate?: string;     // ISO yyyy-mm-dd if confidently parsed
  manufactureDate?: string;
  batchNumber?: string;
}

let workerInstance: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (workerInstance) return workerInstance;
  workerInstance = await createWorker('eng');
  return workerInstance;
}

/** Call once when leaving the OCR screen to free memory. Safe to call multiple times. */
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}

/**
 * Runs OCR on an image (local URI or base64 data URL) and extracts likely
 * product label fields using regex heuristics on the raw recognized text.
 */
export async function extractLabelFields(imageUri: string): Promise<OcrExtractedFields> {
  const worker = await getWorker();
  const { data } = await worker.recognize(imageUri);
  const rawText = data.text || '';

  return {
    rawText,
    expiryDate: findDate(rawText, EXPIRY_KEYWORDS),
    manufactureDate: findDate(rawText, MFG_KEYWORDS),
    batchNumber: findBatch(rawText),
    productName: guessProductName(rawText),
  };
}

// ─── Heuristics ─────────────────────────────────────────────────────────────────

const EXPIRY_KEYWORDS = /(exp|expiry|expires?|use by|best before|bb)[:\s.]*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{1,2}[\/\-.][0-9]{4})/i;
const MFG_KEYWORDS = /(mfg|mfd|manufactured?|packed on|pkd)[:\s.]*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{1,2}[\/\-.][0-9]{4})/i;
const BATCH_REGEX = /(batch|lot)[\s.:#]*([A-Z0-9\-]{3,15})/i;

function findDate(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  if (!match) return undefined;
  return normalizeDate(match[2]);
}

function findBatch(text: string): string | undefined {
  const match = text.match(BATCH_REGEX);
  return match ? match[2] : undefined;
}

function normalizeDate(raw: string): string | undefined {
  const sep = /[\/\-.]/;
  const parts = raw.split(sep).map(p => p.trim());

  try {
    if (parts.length === 3) {
      let [a, b, c] = parts.map(Number);
      // Heuristic: if first part > 31, it's already yyyy-mm-dd-ish ordering
      let year: number, month: number, day: number;
      if (a > 31) {
        year = a; month = b; day = c;
      } else if (c < 100) {
        // dd/mm/yy
        year = 2000 + c; month = b; day = a;
      } else {
        // dd/mm/yyyy (most common on Indian product labels)
        year = c; month = b; day = a;
      }
      if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return undefined;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (parts.length === 2) {
      // mm/yyyy — assume end of month
      let [m, y] = parts.map(Number);
      if (y < 100) y += 2000;
      const lastDay = new Date(y, m, 0).getDate();
      return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function guessProductName(text: string): string | undefined {
  // First non-empty line that isn't purely numbers/dates is usually the brand/product line.
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length < 3) continue;
    if (/^[\d\s\/\-.:]+$/.test(line)) continue; // skip pure number/date lines
    if (/^(exp|mfg|mfd|batch|lot|use by|best before)/i.test(line)) continue;
    return line.slice(0, 60);
  }
  return undefined;
}
