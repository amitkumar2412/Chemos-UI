'use client';

import { useState } from 'react';
import type { Kpi, Currency } from './types';
import { formatCurrency, formatCount } from './utils';

// Inline SVG sparkline — no chart library required
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100, H = 30;
  const step = W / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${H - ((v - min) / range) * H}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 30, display: 'block' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity=".8"
      />
    </svg>
  );
}

const SPARK_COLORS: Record<string, string> = {
  rev:    'var(--green)',
  margin: 'var(--blue)',
  orders: 'var(--gold)',
  alerts: 'var(--red)',
};

const ICONS: Record<string, React.ReactNode> = {
  rev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  margin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  alerts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

interface KpiCardProps {
  kpi: Kpi;
  currency: Currency;
}

export function KpiCard({ kpi, currency }: KpiCardProps) {
  const [open, setOpen] = useState(false);

  const displayValue =
    kpi.unit === 'currency'
      ? formatCurrency(kpi.baseValue as number, currency)
      : kpi.unit === 'count'
      ? formatCount(kpi.baseValue as number)
      : String(kpi.baseValue);

  return (
    <div
      className={`db-kpi db-kpi-${kpi.id}${open ? ' open' : ''}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="db-kpi-top">
        <div className="db-kpi-label">{kpi.label}</div>
        <div className="db-kpi-icon">{ICONS[kpi.id]}</div>
      </div>

      <div className="db-kpi-val">{displayValue}</div>

      <div className="db-kpi-row">
        <span className={`db-kpi-change ${kpi.direction}`}>
          {kpi.direction === 'up' ? '▲' : '▼'} {kpi.change}%
        </span>
        <span className="db-kpi-vs">{kpi.vs}</span>
      </div>

      <div className="db-kpi-spark">
        <Sparkline data={kpi.spark} color={SPARK_COLORS[kpi.id] ?? 'var(--gray)'} />
      </div>

      {/* Expandable detail */}
      <div className="db-kpi-expanded">
        {kpi.details.map(([k, v]) => (
          <div key={k} className="db-kpi-detail">
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface KpiGridProps {
  kpis: Kpi[];
  currency: Currency;
}

export function KpiGrid({ kpis, currency }: KpiGridProps) {
  return (
    <div className="db-kpi-grid">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} currency={currency} />
      ))}
    </div>
  );
}
