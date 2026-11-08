import { CHALLENGES } from '../data/challenges';
import type { Challenge, Difficulty } from '../types';
import { hashString } from './date';

function preferredDifficulties(level: number): Difficulty[] {
  if (level <= 2) return ['Easy'];
  if (level <= 4) return ['Easy', 'Medium'];
  if (level <= 6) return ['Medium', 'Hard'];
  if (level <= 8) return ['Hard', 'Extreme'];
  return ['Extreme', 'Hard'];
}

/**
 * Deterministic daily pick. Same date + same progress + same swap count always yields the same challenge.
 * Prefers uncompleted challenges at a difficulty suited to the player's level, falling back gracefully.
 */
export function pickDailyChallenge(dateKey: string, completedIds: Set<string>, level: number, swaps = 0, exclude: string[] = []): Challenge {
  const notDone = CHALLENGES.filter((c) => !completedIds.has(c.id) && !exclude.includes(c.id));
  const preferred = preferredDifficulties(level);
  let pool = notDone.filter((c) => preferred.includes(c.difficulty));
  if (pool.length === 0) pool = notDone;
  if (pool.length === 0) pool = CHALLENGES.filter((c) => !exclude.includes(c.id));
  if (pool.length === 0) pool = CHALLENGES;
  const sorted = [...pool].sort((a, b) => (a.id < b.id ? -1 : 1));
  const idx = hashString(`${dateKey}#${swaps}`) % sorted.length;
  return sorted[idx];
}

export function dailyQuoteIndex(dateKey: string, count: number): number {
  return hashString(`quote:${dateKey}`) % count;
}
