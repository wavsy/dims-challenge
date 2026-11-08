import { BarChart3, Home, Swords, User } from 'lucide-react';
import { useStore } from '../store';

export type Tab = 'home' | 'challenges' | 'progress' | 'profile';

const ITEMS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'challenges', label: 'Challenges', icon: Swords },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Primary"
      className="md:hidden float-nav"
    >
      <ul className="grid grid-cols-4 h-[68px] px-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <li key={id} className="min-w-0">
              <button
                className={`w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${active ? 'text-accentInk' : 'text-fg3 hover:text-fg2'}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(id)}
              >
                <span className={`flex items-center justify-center h-8 w-14 rounded-full transition-all ${active ? 'grad-accent text-onAccent shadow-glow' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { stats, state } = useStore();
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen border-r border-line bg-surface px-5 py-7" style={{ paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))' }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl grad-hero text-white flex items-center justify-center font-display font-extrabold text-lg shadow-glow">D</div>
        <div className="min-w-0">
          <div className="font-display font-extrabold leading-tight">Dim’s Challenge</div>
          <div className="text-[11px] text-fg3 font-semibold truncate">Get uncomfortable. Become unstoppable.</div>
        </div>
      </div>
      <nav aria-label="Primary">
        <ul className="space-y-1">
          {ITEMS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onChange(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-bold transition-colors ${active ? 'bg-accent/15 text-accentInk shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)]' : 'text-fg2 hover:bg-surface2 hover:text-fg'}`}
                >
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden /> {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto card p-4">
        <div className="eyebrow">Level {stats.level.level}</div>
        <div className="font-display font-extrabold mt-0.5 leading-tight">{stats.level.title}</div>
        <div className="text-xs text-fg3 mt-1 tnum">{stats.totalXP.toLocaleString()} XP · {state.profile.username}</div>
      </div>
    </aside>
  );
}
