import React, { useMemo, useRef, useState } from 'react';
import { formatDate } from '../lib/date';
import { fromDateKey } from '../lib/date';

interface Point { dateKey: string; xp: number; gained: number }

function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 50, 100];
  const raw = max / 2;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  return [0, top / 2, top];
}

/** Single-series cumulative XP area chart with crosshair tooltip. */
export function XPAreaChart({ series }: { series: Point[] }) {
  const W = 640, H = 220, PL = 44, PR = 16, PT = 14, PB = 28;
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const maxVal = Math.max(...series.map((p) => p.xp), 0);
  const ticks = useMemo(() => niceTicks(maxVal), [maxVal]);
  const top = ticks[ticks.length - 1] || 1;
  const x = (i: number) => PL + (i / Math.max(1, series.length - 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v / top) * (H - PT - PB);

  const linePath = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.xp).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(series.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const last = series[series.length - 1];

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PL) / (W - PL - PR)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };

  const h = hover !== null ? series[hover] : null;
  const labelIdx = [0, Math.floor((series.length - 1) / 2), series.length - 1];

  return (
    <div ref={ref} className="relative select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`Cumulative XP over the last ${series.length} days, now ${last?.xp ?? 0} XP`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeWidth={1} />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="rgb(var(--fg-3))" fontFamily="inherit" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t >= 10000 ? `${Math.round(t / 1000)}K` : t.toLocaleString()}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'} fontSize={11} fill="rgb(var(--fg-3))" fontFamily="inherit">
            {formatDate(fromDateKey(series[i].dateKey).toISOString())}
          </text>
        ))}
        <path d={areaPath} fill="rgb(var(--accent) / 0.12)" />
        <path d={linePath} fill="none" stroke="rgb(var(--accent))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {last && <circle cx={x(series.length - 1)} cy={y(last.xp)} r={5} fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth={2} />}
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="rgb(var(--fg-3))" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.xp)} r={5} fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth={2} />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > series.length / 2 ? '-110%' : '10%'})` }}
        >
          <div className="text-fg3 font-semibold">{formatDate(fromDateKey(h.dateKey).toISOString(), { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div className="font-extrabold tnum">{h.xp.toLocaleString()} XP total</div>
          {h.gained > 0 && <div className="text-accentInk font-bold tnum">+{h.gained} that day</div>}
        </div>
      )}
    </div>
  );
}

export interface BarRow { label: string; value: number; total: number; colorClass: string; icon?: React.ReactNode }

/** Horizontal bars: thin marks, value at the tip, text in text tokens. */
export function HBarChart({ rows }: { rows: BarRow[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const pct = r.total === 0 ? 0 : r.value / r.total;
        return (
          <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 items-center">
            <div className="flex items-center gap-2 min-w-0 text-[13px] font-semibold text-fg truncate">{r.icon}{r.label}</div>
            <div className="text-xs font-bold text-fg2 tnum">{r.value} / {r.total}</div>
            <div className="col-span-2 h-2.5 rounded-full bg-surface2 overflow-hidden" role="progressbar" aria-label={r.label} aria-valuemin={0} aria-valuemax={r.total} aria-valuenow={r.value}>
              <div className={`h-full rounded-r-full ${r.colorClass} transition-[width] duration-700`} style={{ width: `${pct * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
