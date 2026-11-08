import { AlertTriangle, Award, BookOpen, Check, CheckCircle2, ChevronDown, Monitor, Moon, NotebookPen, Pencil, Repeat, RotateCcw, SkipForward, Sun, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BackupCard } from '../components/BackupCard';
import { InstallCard } from '../components/InstallCard';
import { ACHIEVEMENT_ICON, CodeOfCourage, EmptyState, SectionTitle } from '../components/ui';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHALLENGE_MAP } from '../data/challenges';
import { formatDateTime } from '../lib/date';
import { achievementTimeline } from '../lib/progress';
import { useStore } from '../store';
import type { ThemePreference } from '../types';

const THEMES: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export function Profile({ onOpenChallenge }: { onOpenChallenge: (id: string) => void }) {
  const { state, stats, setUsername, setTheme, resetProgress } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.profile.username);
  const [confirmReset, setConfirmReset] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const timeline = useMemo(() => achievementTimeline(state.attempts), [state.attempts]);
  const unlocked = new Set(timeline.map((t) => t.achievement.id));
  const lvl = stats.level;
  const pct = lvl.ceil === lvl.floor ? 1 : (stats.totalXP - lvl.floor) / (lvl.ceil - lvl.floor);
  const history = showAll ? stats.recent : stats.recent.slice(0, 10);
  const initial = (state.profile.username.trim()[0] ?? 'C').toUpperCase();
  const R = 54, C = 2 * Math.PI * R;

  const commitName = () => { setUsername(draft); setEditing(false); };

  return (
    <div className="space-y-7">
      <header className="hero-grad card p-6 flex flex-col items-center text-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(var(--surface-2))" strokeWidth="6" />
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(var(--accent))" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
          </svg>
          <div className="absolute inset-3 rounded-full bg-surface2 flex items-center justify-center font-display text-5xl font-extrabold">{initial}</div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full grad-accent text-onAccent text-[11px] font-extrabold px-2.5 h-6 flex items-center tnum">LVL {lvl.level}</div>
        </div>

        {editing ? (
          <form className="mt-5 flex items-center gap-2 w-full max-w-xs" onSubmit={(e) => { e.preventDefault(); commitName(); }}>
            <input id="username" className="field !h-11 !py-0 text-center font-display font-extrabold text-lg" value={draft} maxLength={24} autoFocus onChange={(e) => setDraft(e.target.value)} aria-label="Username" />
            <button type="submit" className="h-11 w-11 shrink-0 rounded-full bg-accent text-onAccent flex items-center justify-center" aria-label="Save name"><Check size={18} /></button>
            <button type="button" className="h-11 w-11 shrink-0 rounded-full bg-surface2 text-fg2 flex items-center justify-center" aria-label="Cancel" onClick={() => { setDraft(state.profile.username); setEditing(false); }}><X size={18} /></button>
          </form>
        ) : (
          <button className="mt-5 inline-flex items-center gap-2 group" onClick={() => { setDraft(state.profile.username); setEditing(true); }} aria-label="Edit username">
            <h1 className="font-display text-3xl font-extrabold leading-none">{state.profile.username}</h1>
            <Pencil size={16} className="text-fg3 group-hover:text-accentInk transition-colors" aria-hidden />
          </button>
        )}
        <div className="eyebrow !text-accentInk mt-2">{lvl.title}</div>

        <dl className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
          <div><dt className="eyebrow">XP</dt><dd className="font-display text-2xl font-extrabold tnum">{stats.totalXP.toLocaleString()}</dd></div>
          <div><dt className="eyebrow">Missions</dt><dd className="font-display text-2xl font-extrabold tnum">{stats.uniqueCompleted}<span className="text-sm text-fg2 font-body">/30</span></dd></div>
          <div><dt className="eyebrow">Badges</dt><dd className="font-display text-2xl font-extrabold tnum">{unlocked.size}<span className="text-sm text-fg2 font-body">/{ACHIEVEMENTS.length}</span></dd></div>
        </dl>
        <p className="text-xs text-fg3 font-semibold mt-4 tnum">{(lvl.ceil - stats.totalXP).toLocaleString()} XP to level {lvl.level + 1}</p>
      </header>

      <InstallCard />

      <section aria-labelledby="p-ach">
        <SectionTitle><span id="p-ach">Achievements</span></SectionTitle>
        {unlocked.size === 0 ? (
          <EmptyState icon={Award} title="No badges yet" body="Badges are earned from real progress. Complete your first mission to unlock First Blood." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.map((a) => {
              const Icon = ACHIEVEMENT_ICON[a.icon] ?? Award;
              const on = unlocked.has(a.id);
              return (
                <li key={a.id} title={`${a.title}: ${a.description}`} className={`inline-flex items-center gap-2 h-10 pl-2 pr-3.5 rounded-full border text-sm font-bold ${on ? 'bg-accent/15 border-accent/40 text-fg' : 'bg-surface border-line text-fg3'}`}>
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center ${on ? 'grad-accent text-onAccent' : 'bg-surface2'}`}><Icon size={13} aria-hidden /></span>
                  {a.title}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="p-hist">
        <SectionTitle action={stats.recent.length > 10 ? <button className="btn-ghost -mr-2 !min-h-8 text-xs" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show less' : `Show all ${stats.recent.length}`}</button> : undefined}><span id="p-hist">Challenge history</span></SectionTitle>
        {stats.recent.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No history yet" body="Every completed, attempted or skipped mission is logged here, with your reflections." />
        ) : (
          <ul className="space-y-2">
            {history.map((a) => {
              const c = CHALLENGE_MAP[a.challengeId];
              const open = expanded === a.id;
              return (
                <li key={a.id} className="card overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${a.status === 'completed' ? 'bg-accent/15 text-accentInk' : a.status === 'attempted' ? 'bg-medium/15 text-medium' : 'bg-surface2 text-fg3'}`}>
                      {a.status === 'completed' ? <CheckCircle2 size={18} aria-hidden /> : a.status === 'attempted' ? <Repeat size={18} aria-hidden /> : <SkipForward size={18} aria-hidden />}
                    </span>
                    <button className="flex-1 min-w-0 text-left" onClick={() => onOpenChallenge(a.challengeId)}>
                      <span className="font-display font-extrabold block truncate">{c?.title ?? a.challengeId}</span>
                      <span className="text-xs text-fg2 capitalize">{a.status} · {formatDateTime(a.timestamp)}</span>
                    </button>
                    <span className={`text-sm font-extrabold tnum shrink-0 ${a.xpAwarded > 0 ? 'text-accentInk' : 'text-fg3'}`}>{a.xpAwarded > 0 ? `+${a.xpAwarded}` : '—'}</span>
                    {a.reflection && (
                      <button className="h-9 w-9 rounded-full flex items-center justify-center text-fg2 hover:bg-surface2 shrink-0" aria-expanded={open} aria-label="Toggle reflection" onClick={() => setExpanded(open ? null : a.id)}>
                        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {a.reflection && open && (
                    <div className="px-4 pb-4 pt-0 text-sm space-y-1.5 border-t border-line">
                      <div className="pt-3 text-xs font-bold text-fg2">{a.reflection.discomfort ? `Discomfort ${a.reflection.discomfort}/5` : 'Reflection'}</div>
                      {a.reflection.uncomfortable && <p><span className="text-fg3">Uncomfortable: </span>{a.reflection.uncomfortable}</p>}
                      {a.reflection.happened && <p><span className="text-fg3">Happened: </span>{a.reflection.happened}</p>}
                      {a.reflection.learned && <p><span className="text-fg3">Learned: </span>{a.reflection.learned}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="p-theme">
        <SectionTitle><span id="p-theme">Appearance</span></SectionTitle>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface2 p-1.5" role="radiogroup" aria-label="Theme">
          {THEMES.map(({ id, label, icon: Icon }) => {
            const on = state.settings.theme === id;
            return (
              <button key={id} role="radio" aria-checked={on} onClick={() => setTheme(id)} className={`h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors ${on ? 'grad-accent text-onAccent shadow-glow' : 'text-fg2 hover:text-fg'}`}>
                <Icon size={17} aria-hidden /> {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-label="Data and safety">
        <BackupCard />
        <button onClick={() => setCodeOpen(true)} className="card w-full p-4 flex items-center gap-3 text-left hover:border-accent/50 transition-colors">
          <span className="h-10 w-10 rounded-xl bg-surface2 text-fg2 flex items-center justify-center shrink-0"><BookOpen size={20} aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="font-display font-extrabold block">Code of Courage</span><span className="text-xs text-fg2">Eight rules for brave, respectful missions.</span></span>
        </button>

        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="card w-full p-4 flex items-center gap-3 text-left hover:border-danger/50 transition-colors">
            <span className="h-10 w-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0"><RotateCcw size={20} aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="font-display font-extrabold block">Reset progress</span><span className="text-xs text-fg2">Erase XP, history, reflections and badges on this device.</span></span>
          </button>
        ) : (
          <div className="card p-5 border-danger/50" role="alertdialog" aria-labelledby="reset-title">
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1">
                <h3 id="reset-title" className="font-display font-extrabold text-lg">Erase all progress?</h3>
                <p className="text-sm text-fg2 mt-1">This deletes {stats.totalEvents} logged mission{stats.totalEvents === 1 ? '' : 's'}, {stats.totalXP.toLocaleString()} XP, {stats.reflections} reflection{stats.reflections === 1 ? '' : 's'} and every badge. Your name and theme stay. This can’t be undone.</p>
                <div className="mt-4 flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => setConfirmReset(false)}>Keep my progress</button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 min-h-12 rounded-full bg-danger text-white font-extrabold text-sm" onClick={() => { resetProgress(); setConfirmReset(false); }}><Trash2 size={16} aria-hidden /> Erase everything</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-fg3 pb-2">Dim’s Challenge · Progress lives only in this browser · Schema v{state.version}</p>
      <CodeOfCourage open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
