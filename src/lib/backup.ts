import type { AppState } from '../types';
import { migrate, SCHEMA_VERSION } from './storage';

export interface BackupFile {
  app: 'dims-challenge';
  schemaVersion: number;
  exportedAt: string;
  state: AppState;
}

export function createBackup(state: AppState): string {
  const file: BackupFile = { app: 'dims-challenge', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), state };
  return JSON.stringify(file, null, 2);
}

/** Parses a backup (or a raw state object) and migrates it to the current schema. Throws on garbage. */
export function parseBackup(text: string): AppState {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That isn’t valid backup text. Paste the whole export, starting with { and ending with }.');
  }
  if (!raw || typeof raw !== 'object') throw new Error('Backup must be a JSON object.');
  const obj = raw as Partial<BackupFile> & Partial<AppState>;
  const candidate = obj.app === 'dims-challenge' && obj.state ? obj.state : obj;
  if (!candidate || typeof candidate !== 'object' || !Array.isArray((candidate as Partial<AppState>).attempts)) {
    throw new Error('This doesn’t look like a Dim’s Challenge backup (no attempts list found).');
  }
  return migrate(candidate);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Triggers a file download where the browser allows it. Returns false when it likely did nothing. */
export function downloadText(filename: string, text: string): boolean {
  try {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
