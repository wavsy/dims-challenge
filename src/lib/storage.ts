import type { AppState, ChallengeAttempt } from '../types';

export const STORAGE_KEY = 'dims-challenge:v1';
export const SCHEMA_VERSION = 1;

export function defaultState(): AppState {
  return {
    version: SCHEMA_VERSION,
    profile: { username: 'Challenger', createdAt: new Date().toISOString() },
    settings: { theme: 'dark' },
    attempts: [],
    active: {},
    daily: null,
  };
}

/** Migrate any older persisted shape forward to the current schema. */
export function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState> & { version?: number };
  // Future migrations go here, e.g. if (r.version === 1) { ... r.version = 2 }
  const attempts: ChallengeAttempt[] = Array.isArray(r.attempts)
    ? r.attempts.filter((a): a is ChallengeAttempt => !!a && typeof a === 'object' && typeof (a as ChallengeAttempt).challengeId === 'string')
    : [];
  return {
    version: SCHEMA_VERSION,
    profile: { ...base.profile, ...(r.profile ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
    attempts,
    active: r.active && typeof r.active === 'object' ? r.active : {},
    daily: r.daily && typeof r.daily === 'object' ? r.daily : null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Ask the browser not to evict this origin's storage under pressure. Best effort; resolves to whether it is persisted. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
