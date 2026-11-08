import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Home, NotebookPen, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CHALLENGE_MAP } from '../data/challenges';
import { ATTEMPT_MESSAGES, COMPLETION_MESSAGES } from '../data/quotes';
import { hashString } from '../lib/date';
import type { CompletionResult } from '../store';
import { useStore } from '../store';
import type { DiscomfortRating } from '../types';
import { ACHIEVEMENT_ICON, AnimatedNumber, ProgressBar } from './ui';

const DISCOMFORT_LABELS: Record<DiscomfortRating, string> = { 1: 'Barely', 2: 'A little', 3: 'Noticeably', 4: 'Very', 5: 'Terrifying' };

export function CompletionOverlay({ result, onDashboard, onAnother, onClose }: { result: CompletionResult; onDashboard: () => void; onAnother: () => void; onClose: () => void }) {
  const { saveReflection } = useStore();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<'celebrate' | 'reflect' | 'saved'>('celebrate');
  const [barPct, setBarPct] = useState(() => (result.before.level.ceil === result.before.level.floor ? 1 : (result.before.totalXP - result.before.level.floor) / (result.before.level.ceil - result.before.level.floor)));
  const challenge = CHALLENGE_MAP[result.attempt.challengeId];
  const isSkip = result.attempt.status === 'skipped';
  const isAttempt = result.attempt.status === 'attempted';

  const message = useMemo(() => {
    const pool = isAttempt ? ATTEMPT_MESSAGES : COMPLETION_MESSAGES;
    return pool[hashString(result.attempt.id) % pool.length];
  }, [isAttempt, result.attempt.id]);

  useEffect(() => {
    const after = result.after.level;
    const target = after.ceil === after.floor ? 1 : (result.after.totalXP - after.floor) / (after.ceil - after.floor);
    const t = window.setTimeout(() => setBarPct(target), reduce ? 0 : 500);
    return () => window.clearTimeout(t);
  }, [result, reduce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // Reflection form state
  const [discomfort, setDiscomfort] = useState<DiscomfortRating | undefined>();
  const [uncomfortable, setUncomfortable] = useState('');
  const [happened, setHappened] = useState('');
  const [learned, setLearned] = useState('');
  const canSave = !!discomfort || uncomfortable.trim() || happened.trim() || learned.trim();

  const headline = isSkip ? 'Mission skipped' : isAttempt ? 'Attempt logged' : result.alreadyEarned ? 'Practice complete' : 'Mission complete';

  return (
    <motion.div className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={headline}>
      {!isSkip && !result.alreadyEarned && !reduce && <Confetti seed={result.attempt.id} />}
      <div className="min-h-full flex items-center justify-center gutter py-10" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 'celebrate' && (
              <motion.div key="celebrate" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="text-center">
                <motion.div
                  className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center ${isSkip ? 'bg-surface2 text-fg2' : 'grad-accent text-onAccent glow-ring'}`}
                  initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                >
                  <motion.svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <motion.path d={isSkip ? 'M5 12h14' : 'M4 12.5l5 5L20 6.5'} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.5 }} />
                  </motion.svg>
                </motion.div>
                <div className="eyebrow mt-7 !text-accentInk">{headline}</div>
                <h1 className="font-display text-3xl font-extrabold mt-1.5 leading-tight">{challenge?.title}</h1>

                <motion.div className="mt-6 font-display text-6xl font-extrabold tnum leading-none" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 14 }}>
                  {result.xpGained > 0 ? <>+<AnimatedNumber value={result.xpGained} /> <span className="text-2xl text-accentInk">XP</span></> : <span className="text-3xl text-fg2">{isSkip ? 'No XP this time' : '+0 XP'}</span>}
                </motion.div>
                {result.alreadyEarned && !isSkip && <p className="mt-2 text-sm text-fg2">XP for this mission was already earned. Practice still counts for you.</p>}
                {isSkip && <p className="mt-2 text-sm text-fg2">Skipping is allowed. The mission stays available whenever you’re ready.</p>}

                <div className="card p-4 mt-7 text-left">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="eyebrow">Level {result.after.level.level}</div>
                      <div className="font-display font-extrabold text-lg leading-tight">{result.after.level.title}</div>
                    </div>
                    <div className="text-xs text-fg2 tnum font-semibold"><AnimatedNumber value={result.after.totalXP} /> / {result.after.level.ceil.toLocaleString()} XP</div>
                  </div>
                  <ProgressBar pct={barPct} className="mt-3" animate={false} />
                </div>

                <AnimatePresence>
                  {result.leveledUp && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 1.1, type: 'spring', stiffness: 220, damping: 16 }} className="mt-4 rounded-2xl p-4 grad-hero text-white flex items-center gap-3 text-left shadow-glow">
                      <Sparkles size={28} aria-hidden />
                      <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-widest">Level up</div>
                        <div className="font-display font-extrabold text-xl leading-tight">Level {result.after.level.level} · {result.after.level.title}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {result.newAchievements.length > 0 && (
                  <ul className="mt-4 space-y-2 text-left">
                    {result.newAchievements.map((a, i) => {
                      const Icon = ACHIEVEMENT_ICON[a.icon] ?? Trophy;
                      return (
                        <motion.li key={a.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 + i * 0.15 }} className="card p-3 flex items-center gap-3 border-accent/40">
                          <span className="h-11 w-11 rounded-xl bg-accent/15 text-accentInk flex items-center justify-center"><Icon size={22} aria-hidden /></span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-accentInk">Achievement unlocked</div>
                            <div className="font-display font-extrabold leading-tight">{a.title}</div>
                            <div className="text-xs text-fg2">{a.description}</div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}

                <p className="mt-7 text-fg2 italic">“{message}”</p>

                <div className="mt-7 flex flex-col gap-2.5">
                  {!isSkip && <button className="btn-primary" onClick={() => setStep('reflect')}><NotebookPen size={18} aria-hidden /> Add a reflection</button>}
                  <button className={isSkip ? 'btn-primary' : 'btn-secondary'} onClick={onDashboard}><Home size={18} aria-hidden /> Back to dashboard</button>
                  <button className="btn-ghost" onClick={onAnother}>Start another mission <ArrowRight size={16} aria-hidden /></button>
                </div>
              </motion.div>
            )}

            {step === 'reflect' && (
              <motion.form key="reflect" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="card p-5" onSubmit={(e) => { e.preventDefault(); if (!canSave) return; saveReflection(result.attempt.id, { discomfort, uncomfortable: uncomfortable.trim() || undefined, happened: happened.trim() || undefined, learned: learned.trim() || undefined }); setStep('saved'); }}>
                <div className="eyebrow">Reflection</div>
                <h2 className="font-display text-2xl font-extrabold mt-1">How did it go?</h2>
                <p className="text-sm text-fg2 mt-1">Optional, private, and stored only on this device.</p>

                <fieldset className="mt-5">
                  <legend className="text-sm font-bold mb-2">How uncomfortable did you feel?</legend>
                  <div className="grid grid-cols-5 gap-1.5" role="radiogroup">
                    {([1, 2, 3, 4, 5] as DiscomfortRating[]).map((n) => (
                      <button type="button" key={n} role="radio" aria-checked={discomfort === n} aria-label={`${n}: ${DISCOMFORT_LABELS[n]}`} onClick={() => setDiscomfort(n)}
                        className={`h-14 rounded-xl border font-display font-extrabold text-lg tnum transition-all ${discomfort === n ? 'bg-accent text-onAccent border-accent scale-[1.04]' : 'bg-surface2 border-line text-fg2 hover:text-fg'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-fg3 font-semibold mt-1.5 px-0.5"><span>Barely</span><span>{discomfort ? DISCOMFORT_LABELS[discomfort] : ''}</span><span>Terrifying</span></div>
                </fieldset>

                <label className="block mt-5 text-sm font-bold" htmlFor="refl-uncomfortable">What made you uncomfortable?</label>
                <textarea id="refl-uncomfortable" className="field mt-1.5" rows={2} value={uncomfortable} onChange={(e) => setUncomfortable(e.target.value)} placeholder="The moment before I spoke…" />
                <label className="block mt-4 text-sm font-bold" htmlFor="refl-happened">What actually happened?</label>
                <textarea id="refl-happened" className="field mt-1.5" rows={3} value={happened} onChange={(e) => setHappened(e.target.value)} placeholder="They smiled and said…" />
                <label className="block mt-4 text-sm font-bold" htmlFor="refl-learned">What did you learn?</label>
                <textarea id="refl-learned" className="field mt-1.5" rows={2} value={learned} onChange={(e) => setLearned(e.target.value)} placeholder="The fear was louder than the moment." />

                <div className="mt-6 flex flex-col gap-2.5">
                  <button type="submit" className="btn-primary" disabled={!canSave}><Check size={18} aria-hidden /> Save reflection</button>
                  <button type="button" className="btn-ghost" onClick={onDashboard}>Skip for now</button>
                </div>
              </motion.form>
            )}

            {step === 'saved' && (
              <motion.div key="saved" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-accent/15 text-accentInk flex items-center justify-center"><NotebookPen size={32} aria-hidden /></div>
                <h2 className="font-display text-2xl font-extrabold mt-5">Reflection saved</h2>
                <p className="text-sm text-fg2 mt-1">You’ll find it in your challenge history.</p>
                <div className="mt-7 flex flex-col gap-2.5">
                  <button className="btn-primary" onClick={onDashboard}><Home size={18} aria-hidden /> Back to dashboard</button>
                  <button className="btn-ghost" onClick={onAnother}>Start another mission <ArrowRight size={16} aria-hidden /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/** Light, tasteful burst of lime particles. Deterministic per attempt. */
function Confetti({ seed }: { seed: string }) {
  const pieces = useMemo(() => {
    const base = hashString(seed);
    return Array.from({ length: 28 }, (_, i) => {
      const r = (k: number) => ((hashString(`${base}:${i}:${k}`) % 1000) / 1000);
      return { left: 10 + r(1) * 80, delay: r(2) * 0.4, dur: 1.6 + r(3) * 1.2, size: 5 + r(4) * 6, drift: (r(5) - 0.5) * 160, rot: r(6) * 720, alpha: 0.5 + r(7) * 0.5 };
    });
  }, [seed]);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute top-[-4%] rounded-sm ${i % 3 === 0 ? 'bg-accent3' : i % 3 === 1 ? 'bg-accent2' : 'bg-accent'}`}
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.6, opacity: p.alpha }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: p.alpha }}
          animate={{ y: '115vh', x: p.drift, rotate: p.rot, opacity: 0 }}
          transition={{ delay: p.delay, duration: p.dur, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
