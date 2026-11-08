import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Check, CheckCircle2, Clock, HeartHandshake, MapPin, Play, Repeat, ShieldCheck, SkipForward, Target, X } from 'lucide-react';
import { useState } from 'react';
import { getChallenge } from '../data/challenges';
import { formatDateTime } from '../lib/date';
import { useStore } from '../store';
import type { AttemptStatus } from '../types';
import { CategoryTag, CodeOfCourage, DIFF_STYLE, DifficultyBadge, XPPill } from '../components/ui';

export function ChallengeDetail({ id, onBack, onRecord }: { id: string; onBack: () => void; onRecord: (challengeId: string, status: AttemptStatus) => void }) {
  const { state, stats, startChallenge, cancelChallenge } = useStore();
  const [codeOpen, setCodeOpen] = useState(false);
  const c = getChallenge(id);
  if (!c) {
    return (
      <div className="space-y-4">
        <button className="btn-ghost -ml-3" onClick={onBack}><ArrowLeft size={18} aria-hidden /> Back</button>
        <p className="text-fg2">That mission doesn’t exist.</p>
      </div>
    );
  }
  const ds = DIFF_STYLE[c.difficulty];
  const active = state.active[c.id];
  const done = stats.completedIds.has(c.id);
  const history = stats.recent.filter((a) => a.challengeId === c.id);
  const firstEarned = history.filter((a) => a.xpAwarded > 0).at(-1);

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.25 }} className="space-y-6 pb-32 md:pb-8">
      <button className="btn-ghost -ml-3" onClick={onBack}><ArrowLeft size={18} aria-hidden /> Back</button>

      <header className={`card overflow-hidden border ${ds.border}`}>
        <div className={`h-1.5 ${ds.bar}`} aria-hidden />
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={c.difficulty} size="md" />
            <XPPill xp={c.xp} className="!h-8 !text-xs !px-3" />
            {done && <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-onAccent text-xs font-extrabold"><CheckCircle2 size={14} aria-hidden /> Completed</span>}
            {active && !done && <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-medium/15 text-medium text-xs font-extrabold"><span className="h-1.5 w-1.5 rounded-full bg-medium animate-pulse" aria-hidden /> In progress</span>}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight mt-4">{c.title}</h1>
          <p className="text-fg2 mt-3 leading-relaxed text-[15.5px]">{c.description}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <CategoryTag category={c.category} className="!text-sm" />
            <span className="inline-flex items-center gap-1.5 text-fg2 font-semibold tnum"><Clock size={15} aria-hidden /> About {c.estimatedMinutes} min</span>
          </div>
          {firstEarned && <p className="mt-3 text-xs text-fg3 font-semibold">First completed {formatDateTime(firstEarned.timestamp)} · {firstEarned.xpAwarded} XP earned</p>}
        </div>
      </header>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display font-extrabold text-lg"><Target size={18} className="text-accentInk" aria-hidden /> Why this matters</h2>
        <p className="mt-2 text-fg2 leading-relaxed">{c.objective}</p>
      </section>

      <section className="card p-5">
        <h2 className="font-display font-extrabold text-lg">How to do it</h2>
        <ol className="mt-3 space-y-3">
          {c.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className={`shrink-0 h-7 w-7 rounded-full ${ds.bg} ${ds.text} font-display font-extrabold text-sm flex items-center justify-center tnum`}>{i + 1}</span>
              <span className="leading-snug pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-display font-extrabold"><MapPin size={17} className="text-fg2" aria-hidden /> Suggested setting</h2>
          <p className="mt-2 text-sm text-fg2 leading-relaxed">{c.suggestedSetting}</p>
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-display font-extrabold"><ShieldCheck size={17} className="text-fg2" aria-hidden /> Respect &amp; consent</h2>
          <p className="mt-2 text-sm text-fg2 leading-relaxed">{c.safetyTip}</p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-accentInk" onClick={() => setCodeOpen(true)}><BookOpen size={15} aria-hidden /> Read the Code of Courage</button>
        </div>
      </section>

      <section className="card p-5 bg-surface2/60">
        <div className="flex items-start gap-3">
          <HeartHandshake size={20} className="text-accentInk shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-fg2 leading-relaxed"><strong className="text-fg">XP rewards the attempt, not the outcome.</strong> A respectful “no”, an awkward silence, or a polite brush-off earns the full {c.xp} XP. Only the other person’s comfort is non-negotiable.</p>
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="font-display font-extrabold text-lg mb-3">Your history with this mission</h2>
          <ul className="space-y-2">
            {history.map((a) => (
              <li key={a.id} className="card p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold capitalize inline-flex items-center gap-1.5">
                    {a.status === 'completed' ? <Check size={15} className="text-accentInk" aria-hidden /> : a.status === 'attempted' ? <Repeat size={15} className="text-medium" aria-hidden /> : <SkipForward size={15} className="text-fg3" aria-hidden />}
                    {a.status}
                  </span>
                  <span className="text-fg3 text-xs font-semibold tnum">{formatDateTime(a.timestamp)} · {a.xpAwarded > 0 ? `+${a.xpAwarded} XP` : 'no XP'}</span>
                </div>
                {a.reflection && (
                  <div className="mt-3 text-sm space-y-1.5 border-t border-line pt-3">
                    {a.reflection.discomfort && <div className="text-xs font-bold text-fg2">Discomfort {a.reflection.discomfort}/5</div>}
                    {a.reflection.uncomfortable && <p><span className="text-fg3">Uncomfortable: </span>{a.reflection.uncomfortable}</p>}
                    {a.reflection.happened && <p><span className="text-fg3">Happened: </span>{a.reflection.happened}</p>}
                    {a.reflection.learned && <p><span className="text-fg3">Learned: </span>{a.reflection.learned}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Action bar */}
      <div className="fixed md:static bottom-[88px] md:bottom-auto inset-x-0 z-30 md:z-auto bg-gradient-to-t from-bg via-bg/95 to-transparent md:bg-none gutter pt-6 pb-2 md:p-0" style={{ paddingBottom: '8px' }}>
        <div className="mx-auto max-w-md md:max-w-none">
          {active ? (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button className="btn-primary" onClick={() => onRecord(c.id, 'completed')}><Check size={18} aria-hidden /> I did it</button>
                <button className="btn-secondary" onClick={() => onRecord(c.id, 'attempted')}><Repeat size={18} aria-hidden /> I tried</button>
              </div>
              <div className="flex justify-between">
                <button className="btn-ghost text-xs" onClick={() => cancelChallenge(c.id)}><X size={14} aria-hidden /> Not now</button>
                <button className="btn-ghost text-xs" onClick={() => onRecord(c.id, 'skipped')}><SkipForward size={14} aria-hidden /> Skip this mission</button>
              </div>
              <p className="text-[11px] text-fg3 text-center -mt-1">“I tried” means you made a respectful attempt. It earns {done ? 'no extra' : 'full'} XP.</p>
            </div>
          ) : (
            <button className="btn-primary w-full" onClick={() => startChallenge(c.id)}>
              {done ? <><Repeat size={18} aria-hidden /> Repeat for practice · no extra XP</> : <><Play size={18} fill="currentColor" aria-hidden /> Start challenge · {c.xp} XP</>}
            </button>
          )}
        </div>
      </div>

      <CodeOfCourage open={codeOpen} onClose={() => setCodeOpen(false)} />
    </motion.div>
  );
}
