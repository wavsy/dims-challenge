import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Play } from 'lucide-react';
import type { Challenge } from '../types';
import { CategoryTag, DIFF_STYLE, DifficultyBadge, Duration, XPPill } from './ui';

export type ChallengeStatus = 'available' | 'in-progress' | 'completed';

export function ChallengeCard({ challenge, status, onOpen, onStart, index = 0 }: { challenge: Challenge; status: ChallengeStatus; onOpen: () => void; onStart: () => void; index?: number }) {
  const s = DIFF_STYLE[challenge.difficulty];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.3 }}
      className={`card relative overflow-hidden p-4 flex flex-col gap-3 min-w-0 ${status === 'completed' ? 'opacity-90' : ''}`}
    >
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${s.bar}`} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={challenge.difficulty} />
          <XPPill xp={challenge.xp} />
        </div>
        {status === 'completed' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accentInk"><CheckCircle2 size={14} aria-hidden /> Done</span>
        )}
        {status === 'in-progress' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-medium"><span className="h-1.5 w-1.5 rounded-full bg-medium animate-pulse" aria-hidden /> In progress</span>
        )}
      </div>
      <button onClick={onOpen} className="text-left pl-2 group min-w-0">
        <h3 className="font-display text-[17px] font-extrabold leading-tight group-hover:text-accentInk transition-colors">{challenge.title}</h3>
        <p className="mt-1.5 text-[13.5px] text-fg2 leading-snug line-clamp-2">{challenge.description}</p>
      </button>
      <div className="flex items-center justify-between gap-3 pl-2 mt-auto">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <CategoryTag category={challenge.category} />
          <Duration minutes={challenge.estimatedMinutes} />
        </div>
        {status === 'completed' ? (
          <button onClick={onOpen} className="btn-ghost -mr-2 shrink-0">Details <ChevronRight size={16} aria-hidden /></button>
        ) : status === 'in-progress' ? (
          <button onClick={onOpen} className="btn-secondary shrink-0 !min-h-10 !px-4">Continue</button>
        ) : (
          <button onClick={onStart} className="btn-primary shrink-0 !min-h-10 !px-4 !text-sm"><Play size={14} fill="currentColor" aria-hidden /> Start</button>
        )}
      </div>
    </motion.article>
  );
}
