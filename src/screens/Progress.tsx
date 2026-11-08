import { Award, CheckCircle2, Flame, Lock, Repeat, SkipForward, Sparkles, Trophy, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HBarChart, XPAreaChart } from '../components/Charts';
import { ACHIEVEMENT_ICON, CATEGORY_ICON, DIFF_STYLE, EmptyState, SectionTitle, StatTile } from '../components/ui';
import { ACHIEVEMENTS } from '../data/achievements';
import { CATEGORIES, CHALLENGE_MAP, DIFFICULTIES } from '../data/challenges';
import { formatDateTime, relativeDay } from '../lib/date';
import { achievementProgress, achievementTimeline, cumulativeXPSeries } from '../lib/progress';
import { useStore } from '../store';

const RANGES = [14, 30, 90] as const;

export function Progress({ onOpenChallenge, onBrowse }: { onOpenChallenge: (id: string) => void; onBrowse: () => void }) {
  const { state, stats, today } = useStore();
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const series = useMemo(() => cumulativeXPSeries(stats, range, today), [stats, range, today]);
  const timeline = useMemo(() => achievementTimeline(state.attempts), [state.attempts]);
  const unlockedMap = new Map(timeline.map((t) => [t.achievement.id, t.unlockedAt]));
  const empty = state.attempts.length === 0;

  return (
    <div className="space-y-7">
      <header>
        <div className="eyebrow">Personal growth</div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight mt-0.5">Your courage, measured</h1>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3" aria-label="Headline stats">
        <StatTile label="Total XP" value={stats.totalXP.toLocaleString()} icon={Zap} accent />
        <StatTile label="Level" value={stats.level.level} icon={Trophy} sub={stats.level.title} />
        <StatTile label="Completed" value={<span className="inline-flex items-baseline gap-1">{stats.uniqueCompleted}<span className="text-sm text-fg2 font-body">/30</span></span>} icon={CheckCircle2} />
        <StatTile label="Streak" value={<span className="inline-flex items-baseline gap-1">{stats.currentStreak}<span className="text-sm text-fg2 font-body">d</span></span>} icon={Flame} sub={stats.currentStreak > 0 && !stats.activeToday ? 'At risk today' : undefined} />
        <StatTile label="Longest" value={<span className="inline-flex items-baseline gap-1">{stats.longestStreak}<span className="text-sm text-fg2 font-body">d</span></span>} icon={Flame} />
      </section>

      {empty ? (
        <EmptyState icon={Sparkles} title="No missions logged yet" body="Your XP curve, streaks and badges appear here after your first attempt. The first one is always the hardest." action={<button className="btn-primary" onClick={onBrowse}>Find a mission</button>} />
      ) : (
        <>
          <section className="card p-5" aria-labelledby="xp-chart-title">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 id="xp-chart-title" className="font-display font-extrabold text-lg">XP over time</h2>
                <p className="text-xs text-fg3 font-semibold">Cumulative, last {range} days</p>
              </div>
              <div className="flex gap-1 rounded-full bg-surface2 p-1" role="group" aria-label="Range">
                {RANGES.map((r) => (
                  <button key={r} className={`h-8 px-3 rounded-full text-xs font-bold tnum transition-colors ${range === r ? 'bg-accent text-onAccent' : 'text-fg2 hover:text-fg'}`} aria-pressed={range === r} onClick={() => setRange(r)}>{r}d</button>
                ))}
              </div>
            </div>
            <XPAreaChart series={series} />
          </section>

          <section className="grid md:grid-cols-2 gap-3">
            <div className="card p-5">
              <h2 className="font-display font-extrabold text-lg mb-4">Completion by difficulty</h2>
              <HBarChart rows={DIFFICULTIES.map((d) => ({ label: d, value: stats.byDifficulty[d].done, total: stats.byDifficulty[d].total, colorClass: DIFF_STYLE[d].bar }))} />
            </div>
            <div className="card p-5">
              <h2 className="font-display font-extrabold text-lg mb-4">Category distribution</h2>
              <HBarChart rows={CATEGORIES.map((c) => { const Icon = CATEGORY_ICON[c]; return { label: c, value: stats.byCategory[c].done, total: stats.byCategory[c].total, colorClass: 'bg-accent', icon: <Icon size={14} className="text-fg3 shrink-0" aria-hidden /> }; })} />
            </div>
          </section>
        </>
      )}

      <section aria-labelledby="ach-title">
        <SectionTitle action={<span className="text-xs font-bold text-fg2 tnum">{timeline.length} / {ACHIEVEMENTS.length}</span>}><span id="ach-title">Achievements</span></SectionTitle>
        {timeline.length === 0 && (
          <p className="text-sm text-fg2 mb-3">Nothing unlocked yet. Your first completed mission unlocks First Blood.</p>
        )}
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlockedAt = unlockedMap.get(a.id);
            const Icon = ACHIEVEMENT_ICON[a.icon] ?? Award;
            const p = achievementProgress(a, stats);
            return (
              <li key={a.id} className={`card p-4 flex flex-col gap-2 min-w-0 ${unlockedAt ? 'border-accent/40' : ''}`}>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${unlockedAt ? 'grad-accent text-onAccent shadow-glow' : 'bg-surface2 text-fg3'}`}>
                  {unlockedAt ? <Icon size={24} aria-hidden /> : <Lock size={20} aria-hidden />}
                </div>
                <div className="font-display font-extrabold leading-tight mt-1">{a.title}</div>
                <div className="text-xs text-fg2 leading-snug">{a.description}</div>
                {unlockedAt ? (
                  <div className="text-[11px] font-bold text-accentInk mt-auto">Unlocked {relativeDay(unlockedAt.slice(0, 10), today)}</div>
                ) : (
                  <div className="mt-auto">
                    <div className="h-1.5 rounded-full bg-surface2 overflow-hidden"><div className="h-full bg-fg3/60 rounded-full" style={{ width: `${p.pct * 100}%` }} /></div>
                    <div className="text-[11px] font-bold text-fg3 mt-1 tnum">{p.current} / {p.target}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {!empty && (
        <section aria-labelledby="recent-title">
          <SectionTitle><span id="recent-title">Recent activity</span></SectionTitle>
          <ul className="space-y-2">
            {stats.recent.slice(0, 8).map((a) => {
              const c = CHALLENGE_MAP[a.challengeId];
              return (
                <li key={a.id}>
                  <button onClick={() => onOpenChallenge(a.challengeId)} className="card w-full p-4 flex items-center gap-3 text-left hover:border-accent/50 transition-colors">
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${a.status === 'completed' ? 'bg-accent/15 text-accentInk' : a.status === 'attempted' ? 'bg-medium/15 text-medium' : 'bg-surface2 text-fg3'}`}>
                      {a.status === 'completed' ? <CheckCircle2 size={18} aria-hidden /> : a.status === 'attempted' ? <Repeat size={18} aria-hidden /> : <SkipForward size={18} aria-hidden />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-display font-extrabold block truncate">{c?.title ?? a.challengeId}</span>
                      <span className="text-xs text-fg2 capitalize">{a.status} · {formatDateTime(a.timestamp)}{a.reflection ? ' · reflection' : ''}</span>
                    </span>
                    <span className={`text-sm font-extrabold tnum shrink-0 ${a.xpAwarded > 0 ? 'text-accentInk' : 'text-fg3'}`}>{a.xpAwarded > 0 ? `+${a.xpAwarded}` : '—'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
