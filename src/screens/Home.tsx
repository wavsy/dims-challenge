import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CheckCircle2, Flame, Play, Quote, Shuffle, Trophy, Zap } from 'lucide-react';
import { useState } from 'react';
import { CHALLENGE_MAP } from '../data/challenges';
import { QUOTES } from '../data/quotes';
import { dailyQuoteIndex } from '../lib/daily';
import { useStore } from '../store';
import { CategoryTag, CodeOfCourage, DIFF_STYLE, DifficultyBadge, Duration, ProgressBar, SectionTitle, StatTile, XPPill, AnimatedNumber } from '../components/ui';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home({ onOpenChallenge, onStart, onBrowse }: { onOpenChallenge: (id: string) => void; onStart: (id: string) => void; onBrowse: () => void }) {
  const { state, stats, today, dailyChallengeId, swapDaily } = useStore();
  const [codeOpen, setCodeOpen] = useState(false);
  const daily = CHALLENGE_MAP[dailyChallengeId];
  const quote = QUOTES[dailyQuoteIndex(today, QUOTES.length)];
  const lvl = stats.level;
  const pct = lvl.ceil === lvl.floor ? 1 : (stats.totalXP - lvl.floor) / (lvl.ceil - lvl.floor);
  const toNext = Math.max(0, lvl.ceil - stats.totalXP);
  const dailyDone = stats.completedIds.has(dailyChallengeId);
  const dailyActive = !!state.active[dailyChallengeId];
  const activeIds = Object.keys(state.active).filter((id) => CHALLENGE_MAP[id]);
  const ds = daily ? DIFF_STYLE[daily.difficulty] : DIFF_STYLE.Easy;

  return (
    <div className="space-y-7">
      <header>
        <p className="text-fg2 font-semibold">{greeting()}, {state.profile.username}.</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight mt-0.5">
          {stats.activeToday ? 'Courage logged today. Keep going.' : stats.uniqueCompleted === 0 ? 'Ready to get uncomfortable?' : 'Time to step outside again.'}
        </h1>
      </header>

      <motion.section className="hero-card p-5 md:p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} aria-label="Level progress">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Level {lvl.level}</div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-tight leading-none mt-1">{lvl.title}</h2>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-3xl font-extrabold tnum leading-none"><AnimatedNumber value={stats.totalXP} /></div>
            <div className="text-xs text-fg2 font-semibold tnum mt-1">/ {lvl.ceil.toLocaleString()} XP</div>
          </div>
        </div>
        <ProgressBar pct={pct} className="mt-5" height="h-3.5" />
        <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-fg2 tnum">
          <span>{Math.round(pct * 100)}% to level {lvl.level + 1}</span>
          <span>{toNext.toLocaleString()} XP to go</span>
        </div>
      </motion.section>

      <section className="grid grid-cols-3 gap-3" aria-label="Quick stats">
        <StatTile label="Streak" value={<span className="inline-flex items-baseline gap-1">{stats.currentStreak}<span className="text-sm text-fg2 font-body">d</span></span>} icon={Flame} accent={stats.currentStreak > 0 && stats.activeToday} sub={stats.currentStreak > 0 && !stats.activeToday ? 'Keep it alive today' : stats.currentStreak > 0 ? 'On fire' : 'Start today'} />
        <StatTile label="Done" value={<span className="inline-flex items-baseline gap-1">{stats.uniqueCompleted}<span className="text-sm text-fg2 font-body">/30</span></span>} icon={CheckCircle2} />
        <StatTile label="XP" value={stats.totalXP.toLocaleString()} icon={Zap} />
      </section>

      {daily && (
        <section aria-labelledby="daily-title">
          <SectionTitle action={<button className="btn-ghost -mr-2 !min-h-9 text-xs !text-accentInk" onClick={swapDaily}><Shuffle size={14} aria-hidden /> Pick another</button>}>
            <span id="daily-title">Today’s mission</span>
          </SectionTitle>
          <motion.article layout className={`card overflow-hidden border ${ds.border}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className={`h-1.5 ${ds.bar}`} aria-hidden />
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={daily.difficulty} />
                <XPPill xp={daily.xp} />
                <Duration minutes={daily.estimatedMinutes} className="ml-auto" />
              </div>
              <h3 className="font-display text-2xl font-extrabold leading-tight mt-3">{daily.title}</h3>
              <p className="text-fg2 mt-2 leading-snug">{daily.description}</p>
              <div className="mt-3"><CategoryTag category={daily.category} /></div>
              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                {dailyDone ? (
                  <button className="btn-secondary flex-1" onClick={() => onOpenChallenge(daily.id)}><CheckCircle2 size={18} aria-hidden /> Completed · view details</button>
                ) : dailyActive ? (
                  <button className="btn-primary flex-1" onClick={() => onOpenChallenge(daily.id)}>Continue mission <ArrowRight size={18} aria-hidden /></button>
                ) : (
                  <button className="btn-primary flex-1" onClick={() => onStart(daily.id)}><Play size={18} fill="currentColor" aria-hidden /> Start challenge</button>
                )}
                <button className="btn-ghost" onClick={() => onOpenChallenge(daily.id)}>Details</button>
              </div>
            </div>
          </motion.article>
        </section>
      )}

      {activeIds.length > 0 && (
        <section aria-label="In progress">
          <SectionTitle>In progress</SectionTitle>
          <ul className="space-y-2">
            {activeIds.map((id) => {
              const c = CHALLENGE_MAP[id];
              return (
                <li key={id}>
                  <button onClick={() => onOpenChallenge(id)} className="card w-full p-4 flex items-center gap-3 text-left hover:border-accent/50 transition-colors">
                    <span className={`h-2.5 w-2.5 rounded-full ${DIFF_STYLE[c.difficulty].dot} animate-pulse`} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="font-display font-extrabold block truncate">{c.title}</span>
                      <span className="text-xs text-fg2">{c.difficulty} · {c.xp} XP</span>
                    </span>
                    <ArrowRight size={18} className="text-fg3" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card p-5 flex gap-4" aria-label="Daily quote">
        <Quote size={22} className="text-accentInk shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="font-display text-lg font-bold leading-snug">“{quote.text}”</p>
          <p className="text-xs text-fg3 font-semibold mt-2">{quote.by}</p>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <button onClick={onBrowse} className="card p-4 flex items-center gap-3 text-left hover:border-accent/50 transition-colors">
          <span className="h-11 w-11 rounded-xl bg-accent/15 text-accentInk flex items-center justify-center shrink-0"><Trophy size={22} aria-hidden /></span>
          <span className="min-w-0"><span className="font-display font-extrabold block">Browse all 30 missions</span><span className="text-xs text-fg2">Filter by difficulty, category and time.</span></span>
        </button>
        <button onClick={() => setCodeOpen(true)} className="card p-4 flex items-center gap-3 text-left hover:border-accent/50 transition-colors">
          <span className="h-11 w-11 rounded-xl bg-surface2 text-fg2 flex items-center justify-center shrink-0"><BookOpen size={22} aria-hidden /></span>
          <span className="min-w-0"><span className="font-display font-extrabold block">Code of Courage</span><span className="text-xs text-fg2">Challenge yourself, not other people’s boundaries.</span></span>
        </button>
      </section>

      <CodeOfCourage open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
