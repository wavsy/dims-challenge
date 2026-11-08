import { motion, useReducedMotion } from 'framer-motion';
import { Award, Clock, Compass, Crown, Flag, Flame, Heart, MessageCircle, Mic, Shield, Snowflake, Sparkles, Swords, Users, Zap, type LucideIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Category, Difficulty } from '../types';

export const DIFF_STYLE: Record<Difficulty, { text: string; bg: string; bar: string; border: string; dot: string }> = {
  Easy: { text: 'text-easy', bg: 'bg-easy/15', bar: 'bg-easy', border: 'border-easy/40', dot: 'bg-easy' },
  Medium: { text: 'text-medium', bg: 'bg-medium/15', bar: 'bg-medium', border: 'border-medium/40', dot: 'bg-medium' },
  Hard: { text: 'text-hard', bg: 'bg-hard/15', bar: 'bg-hard', border: 'border-hard/40', dot: 'bg-hard' },
  Extreme: { text: 'text-extreme', bg: 'bg-extreme/15', bar: 'bg-extreme', border: 'border-extreme/40', dot: 'bg-extreme' },
};

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  'Social Initiation': Sparkles,
  Conversation: MessageCircle,
  'Rejection Resilience': Shield,
  'Public Confidence': Mic,
  Vulnerability: Heart,
  'Social Leadership': Users,
};

export const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  flag: Flag, snowflake: Snowflake, swords: Swords, compass: Compass, flame: Flame, zap: Zap, shield: Shield, mic: Mic, users: Users, crown: Crown, award: Award,
};

export function DifficultyBadge({ difficulty, size = 'sm' }: { difficulty: Difficulty; size?: 'sm' | 'md' }) {
  const s = DIFF_STYLE[difficulty];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${s.bg} ${s.text} ${size === 'sm' ? 'h-6 px-2.5 text-[10.5px]' : 'h-8 px-3 text-xs'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {difficulty}
    </span>
  );
}

export function CategoryTag({ category, className = '' }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-fg2 ${className}`}>
      <Icon size={13} aria-hidden /> {category}
    </span>
  );
}

export function XPPill({ xp, className = '' }: { xp: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 h-6 text-[11px] font-extrabold text-accentInk tnum ${className}`}>
      <Zap size={12} aria-hidden /> {xp} XP
    </span>
  );
}

export function Duration({ minutes, className = '' }: { minutes: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-fg2 tnum ${className}`}>
      <Clock size={13} aria-hidden /> {minutes} min
    </span>
  );
}

export function StatTile({ label, value, icon: Icon, accent = false, sub }: { label: string; value: React.ReactNode; icon?: LucideIcon; accent?: boolean; sub?: string }) {
  return (
    <div className={`card p-4 min-w-0 ${accent ? 'glow-ring' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {Icon && <span className={`h-8 w-8 -mt-1 -mr-1 rounded-full flex items-center justify-center ${accent ? 'grad-accent text-onAccent' : 'bg-surface2 text-fg2'}`}><Icon size={15} aria-hidden /></span>}
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold tnum leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-fg3">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className="font-display text-lg font-extrabold">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-surface2 flex items-center justify-center text-fg2">
        <Icon size={26} aria-hidden />
      </div>
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      <p className="text-sm text-fg2 max-w-xs">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Animated number that counts from its previous value to the new one. */
export function AnimatedNumber({ value, duration = 900, className = '' }: { value: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    const from = display;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);
  return <span className={`tnum ${className}`}>{display.toLocaleString()}</span>;
}

export function ProgressBar({ pct, className = '', height = 'h-3', animate = true }: { pct: number; className?: string; height?: string; animate?: boolean }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className={`w-full ${height} rounded-full bg-surface2 overflow-hidden ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped * 100)}>
      <motion.div
        className={`${height} rounded-full xp-bar`}
        initial={animate ? { width: 0 } : false}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
      />
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <motion.button className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.div
        className="relative w-full md:max-w-lg max-h-[88vh] overflow-y-auto bg-surface border border-line rounded-t-3xl md:rounded-3xl shadow-card"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-line px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button className="btn-ghost -mr-2" onClick={onClose}>Close</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </motion.div>
    </div>
  );
}

export const CODE_OF_COURAGE = [
  'Challenge yourself, not other people’s boundaries.',
  'Respect rejection immediately.',
  'Never pressure anyone into participating.',
  'Avoid disturbing people who are working, resting, or visibly occupied.',
  'Never record or photograph strangers without consent.',
  'Don’t treat other people as trophies or achievements.',
  'Stay in safe, appropriate environments.',
  'You can stop a challenge whenever necessary.',
];

export function CodeOfCourage({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Code of Courage">
      <p className="text-sm text-fg2 mb-5">Make yourself uncomfortable, not the people around you. XP is never tied to anyone else’s consent, number, attraction, or willingness to take part. A respectful attempt earns the same reward as a “yes”.</p>
      <ol className="space-y-3">
        {CODE_OF_COURAGE.map((rule, i) => (
          <li key={rule} className="flex gap-3 items-start">
            <span className="shrink-0 h-7 w-7 rounded-full bg-accent/15 text-accentInk font-display font-extrabold text-sm flex items-center justify-center tnum">{i + 1}</span>
            <span className="text-[15px] leading-snug pt-0.5">{rule}</span>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}
