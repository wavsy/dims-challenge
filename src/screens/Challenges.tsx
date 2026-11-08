import { Search, SearchX, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ChallengeCard, type ChallengeStatus } from '../components/ChallengeCard';
import { EmptyState } from '../components/ui';
import { CATEGORIES, CHALLENGES, DIFFICULTIES } from '../data/challenges';
import { useStore } from '../store';
import type { Category, Difficulty } from '../types';

type DurationFilter = 'all' | 'quick' | 'short' | 'medium' | 'long';
type StatusFilter = 'all' | 'available' | 'in-progress' | 'completed';

const DURATIONS: { id: DurationFilter; label: string; test: (m: number) => boolean }[] = [
  { id: 'all', label: 'Any time', test: () => true },
  { id: 'quick', label: '≤ 5 min', test: (m) => m <= 5 },
  { id: 'short', label: '≤ 15 min', test: (m) => m <= 15 },
  { id: 'medium', label: '≤ 30 min', test: (m) => m <= 30 },
  { id: 'long', label: '60 min', test: (m) => m >= 60 },
];

const STATUSES: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Not done' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      <div className="scroll-x -mx-4 px-4 flex gap-2" role="group" aria-label={label}>{children}</div>
    </div>
  );
}

export function Challenges({ onOpen, onStart }: { onOpen: (id: string) => void; onStart: (id: string) => void }) {
  const { state, stats } = useStore();
  const [q, setQ] = useState('');
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [dur, setDur] = useState<DurationFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const statusOf = (id: string): ChallengeStatus => (stats.completedIds.has(id) ? 'completed' : state.active[id] ? 'in-progress' : 'available');

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const durTest = DURATIONS.find((d) => d.id === dur)!.test;
    return CHALLENGES.filter((c) => {
      if (diff !== 'all' && c.difficulty !== diff) return false;
      if (cat !== 'all' && c.category !== cat) return false;
      if (!durTest(c.estimatedMinutes)) return false;
      if (status !== 'all' && statusOf(c.id) !== status) return false;
      if (needle && !`${c.title} ${c.description} ${c.category} ${c.objective}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, diff, cat, dur, status, state.active, stats.completedIds]);

  const hasFilters = q || diff !== 'all' || cat !== 'all' || dur !== 'all' || status !== 'all';
  const clear = () => { setQ(''); setDiff('all'); setCat('all'); setDur('all'); setStatus('all'); };

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">Mission library</div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight mt-0.5">30 ways to get braver</h1>
        <p className="text-fg2 mt-1.5">{stats.uniqueCompleted} of {CHALLENGES.length} completed. Every attempt counts, whatever the answer.</p>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg3 pointer-events-none" aria-hidden />
        <input id="challenge-search" type="search" className="field !pl-11 !pr-11 !rounded-full h-12" placeholder="Search missions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search missions" />
        {q && <button className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-fg2 hover:bg-surface2" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
      </div>

      <div className="space-y-4">
        <ChipRow label="Difficulty">
          <button className="chip" aria-pressed={diff === 'all'} onClick={() => setDiff('all')}>All</button>
          {DIFFICULTIES.map((d) => <button key={d} className="chip" aria-pressed={diff === d} onClick={() => setDiff(d)}>{d}</button>)}
        </ChipRow>
        <ChipRow label="Category">
          <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All</button>
          {CATEGORIES.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </ChipRow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChipRow label="Duration">
            {DURATIONS.map((d) => <button key={d.id} className="chip" aria-pressed={dur === d.id} onClick={() => setDur(d.id)}>{d.label}</button>)}
          </ChipRow>
          <ChipRow label="Status">
            {STATUSES.map((s) => <button key={s.id} className="chip" aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</button>)}
          </ChipRow>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-fg2 font-semibold">
        <span aria-live="polite" className="tnum">{results.length} mission{results.length === 1 ? '' : 's'}</span>
        {hasFilters && <button className="btn-ghost !min-h-8 -mr-2 text-xs" onClick={clear}><X size={14} aria-hidden /> Clear filters</button>}
      </div>

      {results.length === 0 ? (
        <EmptyState icon={SearchX} title="No missions match" body="Try a different word, or loosen a filter. All 30 are still waiting." action={<button className="btn-secondary" onClick={clear}>Clear filters</button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {results.map((c, i) => (
            <li key={c.id} className="min-w-0">
              <ChallengeCard challenge={c} status={statusOf(c.id)} index={i} onOpen={() => onOpen(c.id)} onStart={() => onStart(c.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
