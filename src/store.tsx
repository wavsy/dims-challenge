import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACHIEVEMENTS } from './data/achievements';
import { CHALLENGE_MAP } from './data/challenges';
import { pickDailyChallenge } from './lib/daily';
import { toDateKey, uid } from './lib/date';
import { computeStats, hasEarnedXP, unlockedIds } from './lib/progress';
import { clearState, defaultState, loadState, requestPersistentStorage, saveState } from './lib/storage';
import type { Achievement, AppState, AttemptStatus, ChallengeAttempt, ChallengeReflection, ProgressStats, ThemePreference } from './types';

export interface CompletionResult {
  attempt: ChallengeAttempt;
  xpGained: number;
  alreadyEarned: boolean;
  before: ProgressStats;
  after: ProgressStats;
  leveledUp: boolean;
  newAchievements: Achievement[];
}

interface StoreValue {
  state: AppState;
  stats: ProgressStats;
  today: string;
  dailyChallengeId: string;
  startChallenge: (id: string) => void;
  cancelChallenge: (id: string) => void;
  recordAttempt: (challengeId: string, status: AttemptStatus) => CompletionResult;
  saveReflection: (attemptId: string, reflection: Omit<ChallengeReflection, 'createdAt'>) => void;
  swapDaily: () => void;
  setUsername: (name: string) => void;
  setTheme: (theme: ThemePreference) => void;
  resetProgress: () => void;
  importState: (next: AppState) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const stateRef = useRef(state);
  stateRef.current = state;
  const [today, setToday] = useState(() => toDateKey());

  // Persist on every change.
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Ask the browser to keep this origin's storage (matters for installed PWAs on iOS).
  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  // Theme.
  useEffect(() => {
    applyTheme(state.settings.theme);
  }, [state.settings.theme]);

  // Roll the calendar date when the app stays open past midnight or regains focus.
  useEffect(() => {
    const tick = () => setToday((t) => (t === toDateKey() ? t : toDateKey()));
    const i = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(i);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const stats = useMemo(() => computeStats(state.attempts, today), [state.attempts, today]);

  // Daily pick: stable for the day, refreshed on a new local calendar date.
  const dailyChallengeId = useMemo(() => {
    if (state.daily && state.daily.dateKey === today && CHALLENGE_MAP[state.daily.challengeId]) return state.daily.challengeId;
    return pickDailyChallenge(today, stats.completedIds, stats.level.level, 0).id;
  }, [state.daily, today, stats.completedIds, stats.level.level]);

  useEffect(() => {
    if (!state.daily || state.daily.dateKey !== today || !CHALLENGE_MAP[state.daily.challengeId]) {
      setState((s) => ({ ...s, daily: { dateKey: today, challengeId: dailyChallengeId, swaps: 0 } }));
    }
  }, [state.daily, today, dailyChallengeId]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const startChallenge = useCallback((id: string) => {
    update((s) => (s.active[id] ? s : { ...s, active: { ...s.active, [id]: new Date().toISOString() } }));
  }, [update]);

  const cancelChallenge = useCallback((id: string) => {
    update((s) => {
      const active = { ...s.active };
      delete active[id];
      return { ...s, active };
    });
  }, [update]);

  const recordAttempt = useCallback((challengeId: string, status: AttemptStatus): CompletionResult => {
    const s = stateRef.current;
    const challenge = CHALLENGE_MAP[challengeId];
    const now = new Date();
    const alreadyEarned = hasEarnedXP(s.attempts, challengeId);
    const xpGained = status === 'skipped' || alreadyEarned || !challenge ? 0 : challenge.xp;
    const attempt: ChallengeAttempt = {
      id: uid(),
      challengeId,
      status,
      timestamp: now.toISOString(),
      dateKey: toDateKey(now),
      startedAt: s.active[challengeId],
      xpAwarded: xpGained,
    };
    const before = computeStats(s.attempts, attempt.dateKey);
    const active = { ...s.active };
    delete active[challengeId];
    const next = update((cur) => ({ ...cur, attempts: [...cur.attempts, attempt], active }));
    const after = computeStats(next.attempts, attempt.dateKey);
    const beforeIds = unlockedIds(before);
    const afterIds = unlockedIds(after);
    const newAchievements = ACHIEVEMENTS.filter((a) => afterIds.has(a.id) && !beforeIds.has(a.id));
    return { attempt, xpGained, alreadyEarned, before, after, leveledUp: after.level.level > before.level.level, newAchievements };
  }, [update]);

  const saveReflection = useCallback((attemptId: string, reflection: Omit<ChallengeReflection, 'createdAt'>) => {
    update((s) => ({
      ...s,
      attempts: s.attempts.map((a) => (a.id === attemptId ? { ...a, reflection: { ...reflection, createdAt: new Date().toISOString() } } : a)),
    }));
  }, [update]);

  const swapDaily = useCallback(() => {
    update((s) => {
      const swaps = (s.daily?.dateKey === today ? s.daily.swaps : 0) + 1;
      const current = s.daily?.challengeId;
      const st = computeStats(s.attempts, today);
      const pick = pickDailyChallenge(today, st.completedIds, st.level.level, swaps, current ? [current] : []);
      return { ...s, daily: { dateKey: today, challengeId: pick.id, swaps } };
    });
  }, [update, today]);

  const setUsername = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 24);
    update((s) => ({ ...s, profile: { ...s.profile, username: trimmed || 'Challenger' } }));
  }, [update]);

  const setTheme = useCallback((theme: ThemePreference) => {
    update((s) => ({ ...s, settings: { ...s.settings, theme } }));
  }, [update]);

  const resetProgress = useCallback(() => {
    clearState();
    const fresh = defaultState();
    // Keep theme preference and username; reset everything that counts as progress.
    update((s) => ({ ...fresh, profile: { ...fresh.profile, username: s.profile.username }, settings: s.settings }));
  }, [update]);

  const importState = useCallback((next: AppState) => {
    update(() => ({ ...next, daily: null }));
  }, [update]);

  const value = useMemo<StoreValue>(() => ({
    state, stats, today, dailyChallengeId,
    startChallenge, cancelChallenge, recordAttempt, saveReflection, swapDaily, setUsername, setTheme, resetProgress, importState,
  }), [state, stats, today, dailyChallengeId, startChallenge, cancelChallenge, recordAttempt, saveReflection, swapDaily, setUsername, setTheme, resetProgress, importState]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
