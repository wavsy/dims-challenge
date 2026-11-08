import { ACHIEVEMENTS } from '../data/achievements';
import { CATEGORIES, CHALLENGES, CHALLENGE_MAP, DIFFICULTIES } from '../data/challenges';
import type { Achievement, Category, ChallengeAttempt, Difficulty, LevelInfo, ProgressStats, UnlockedAchievement } from '../types';
import { addDays, dayDiff, toDateKey } from './date';

export const LEVEL_TABLE: { level: number; title: string; xp: number }[] = [
  { level: 1, title: 'The Observer', xp: 0 },
  { level: 2, title: 'First Steps', xp: 150 },
  { level: 3, title: 'Ice Breaker', xp: 400 },
  { level: 4, title: 'Comfort Zone Breaker', xp: 800 },
  { level: 5, title: 'Social Explorer', xp: 1400 },
  { level: 6, title: 'Courage Builder', xp: 2200 },
  { level: 7, title: 'Fear Challenger', xp: 3200 },
  { level: 8, title: 'Social Adventurer', xp: 4500 },
  { level: 9, title: 'Unshakable', xp: 6000 },
  { level: 10, title: 'Fearless', xp: 8000 },
];

function roman(n: number): string {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Cumulative XP required to reach a level. Beyond 10 each level costs 2,000 XP more than the last, plus 500 per extra level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= 10) return LEVEL_TABLE[level - 1].xp;
  let xp = 8000;
  for (let l = 11; l <= level; l++) xp += 2000 + 500 * (l - 11);
  return xp;
}

export function titleForLevel(level: number): string {
  if (level <= 10) return LEVEL_TABLE[level - 1].title;
  return `Legend ${roman(level - 10)}`;
}

export function levelFromXP(totalXP: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return { level, title: titleForLevel(level), floor: xpForLevel(level), ceil: xpForLevel(level + 1) };
}

export function earnsXP(a: ChallengeAttempt): boolean {
  return a.status !== 'skipped';
}

export function hasEarnedXP(attempts: ChallengeAttempt[], challengeId: string): boolean {
  return attempts.some((a) => a.challengeId === challengeId && a.xpAwarded > 0);
}

/** Days on which the player earned XP for a never-before-rewarded challenge. Repeats never extend a streak. */
export function streakDays(attempts: ChallengeAttempt[]): string[] {
  const days = new Set<string>();
  for (const a of attempts) if (a.xpAwarded > 0) days.add(a.dateKey);
  return [...days].sort();
}

export function computeStreaks(attempts: ChallengeAttempt[], today = toDateKey()): { current: number; longest: number; activeToday: boolean } {
  const days = streakDays(attempts);
  if (days.length === 0) return { current: 0, longest: 0, activeToday: false };
  const set = new Set(days);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (dayDiff(days[i - 1], days[i]) === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
  }
  const activeToday = set.has(today);
  let anchor = activeToday ? today : set.has(addDays(today, -1)) ? addDays(today, -1) : null;
  let current = 0;
  while (anchor && set.has(anchor)) {
    current++;
    anchor = addDays(anchor, -1);
  }
  return { current, longest, activeToday };
}

export function computeStats(attempts: ChallengeAttempt[], today = toDateKey()): ProgressStats {
  const totalXP = attempts.reduce((s, a) => s + a.xpAwarded, 0);
  const completedIds = new Set<string>();
  for (const a of attempts) if (earnsXP(a)) completedIds.add(a.challengeId);

  const byDifficulty = Object.fromEntries(DIFFICULTIES.map((d) => [d, { done: 0, total: 0 }])) as Record<Difficulty, { done: number; total: number }>;
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, { done: 0, total: 0 }])) as Record<Category, { done: number; total: number }>;
  for (const c of CHALLENGES) {
    byDifficulty[c.difficulty].total++;
    byCategory[c.category].total++;
    if (completedIds.has(c.id)) {
      byDifficulty[c.difficulty].done++;
      byCategory[c.category].done++;
    }
  }

  const xpMap = new Map<string, number>();
  for (const a of attempts) if (a.xpAwarded > 0) xpMap.set(a.dateKey, (xpMap.get(a.dateKey) ?? 0) + a.xpAwarded);
  const xpByDay = [...xpMap.entries()].map(([dateKey, xp]) => ({ dateKey, xp })).sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));

  const streaks = computeStreaks(attempts, today);
  const recent = [...attempts].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return {
    totalXP,
    level: levelFromXP(totalXP),
    completedIds,
    uniqueCompleted: completedIds.size,
    totalEvents: attempts.length,
    completedEvents: attempts.filter((a) => a.status === 'completed').length,
    attemptedEvents: attempts.filter((a) => a.status === 'attempted').length,
    skippedEvents: attempts.filter((a) => a.status === 'skipped').length,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    activeToday: streaks.activeToday,
    xpByDay,
    byDifficulty,
    byCategory,
    recent,
    reflections: attempts.filter((a) => !!a.reflection).length,
  };
}

export function unlockedIds(stats: ProgressStats): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.measure(stats) >= a.target).map((a) => a.id));
}

/** Replays history to find when each achievement was first unlocked. */
export function achievementTimeline(attempts: ChallengeAttempt[]): UnlockedAchievement[] {
  const sorted = [...attempts].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  const seen = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    const prefix = sorted.slice(0, i + 1);
    const stats = computeStats(prefix, sorted[i].dateKey);
    for (const a of ACHIEVEMENTS) {
      if (!seen.has(a.id) && a.measure(stats) >= a.target) seen.set(a.id, sorted[i].timestamp);
    }
  }
  return ACHIEVEMENTS.filter((a) => seen.has(a.id)).map((a) => ({ achievement: a, unlockedAt: seen.get(a.id)! }));
}

export function achievementProgress(a: Achievement, stats: ProgressStats): { current: number; target: number; pct: number } {
  const current = Math.min(a.measure(stats), a.target);
  return { current, target: a.target, pct: a.target === 0 ? 1 : current / a.target };
}

/** Cumulative XP series over the last `days` days (inclusive of today), zero-filled. */
export function cumulativeXPSeries(stats: ProgressStats, days: number, today = toDateKey()): { dateKey: string; xp: number; gained: number }[] {
  const start = addDays(today, -(days - 1));
  let base = 0;
  for (const d of stats.xpByDay) if (d.dateKey < start) base += d.xp;
  const byDay = new Map(stats.xpByDay.map((d) => [d.dateKey, d.xp]));
  const out: { dateKey: string; xp: number; gained: number }[] = [];
  let running = base;
  for (let i = 0; i < days; i++) {
    const key = addDays(start, i);
    const gained = byDay.get(key) ?? 0;
    running += gained;
    out.push({ dateKey: key, xp: running, gained });
  }
  return out;
}

export function challengeTitle(id: string): string {
  return CHALLENGE_MAP[id]?.title ?? 'Unknown challenge';
}
