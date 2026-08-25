'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Alert, AlertSeverity, AlertScope } from './types';

interface AlertsPanelProps {
  alerts: Alert[];
}

const ASSIGNEES = ['Shrish K.', 'R. Sharma', 'A. Gupta', 'P. Nair', 'Dr. Mehta', 'V. Reddy'];

// Max alerts kept visible in the live stack before the oldest rolls into history.
const MAX_VISIBLE = 8;
// How often a new (simulated) alert arrives.
const FEED_INTERVAL_MS = 2000;
// Keep in sync with the CSS transition/animation durations below.
const SHIFT_DURATION_MS = 320;
const LEAVE_DURATION_MS = 320;

// Pool of incoming alerts used to simulate a live feed on top of the dummy data.
const INCOMING_POOL: Omit<Alert, 'id' | 'time' | 'ack' | 'owner'>[] = [
  { severity: 'critical', title: 'Toluene stock below safety threshold', desc: 'Current: 31 MT | Safety: 45 MT | Lead: 15d', source: 'Inventory', scope: 'internal' },
  { severity: 'warning', title: 'Methanol price up +6% (24h)', desc: 'Spot ₹31,800/MT vs avg ₹30,000. Track spread.', source: 'Market', scope: 'external' },
  { severity: 'watch', title: 'New RoHS amendment published', desc: 'Annex II update. Compliance review pending.', source: 'Regulatory', scope: 'external' },
  { severity: 'critical', title: 'Payment overdue: Astral Pipes', desc: '#INV-3011 — ₹9.2L, 14d past due', source: 'Finance', scope: 'internal' },
  { severity: 'warning', title: 'Warehouse Zone A utilization 88%', desc: 'Trending up. Review offload schedule.', source: 'Warehouse', scope: 'internal' },
  { severity: 'watch', title: 'Vendor scorecard refresh: BASF', desc: 'Quarterly review due in 6d.', source: 'SCM', scope: 'internal' },
  { severity: 'warning', title: 'Container availability tightening', desc: 'JNPT bookings +20% w/w. Book early.', source: 'Logistics', scope: 'external' },
  { severity: 'critical', title: 'Isopropanol demand spike detected', desc: 'Order inflow +30% vs 7d avg. Check cover.', source: 'Forecast', scope: 'external' },
  { severity: 'watch', title: 'Customer credit limit near cap: Polycab', desc: '92% of ₹2.0Cr limit utilized.', source: 'Finance', scope: 'internal' },
  { severity: 'warning', title: 'Crude benchmark volatility rising', desc: 'Brent swing ±3% intraday. Feedstock watch.', source: 'Market', scope: 'external' },
];

export default function AlertsPanel({ alerts: initialAlerts }: AlertsPanelProps) {
  const [alerts, setAlerts]         = useState<Alert[]>(initialAlerts);
  const [history, setHistory]       = useState<Alert[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scope, setScope]           = useState<'all' | AlertScope>('all');
  const [severity, setSeverity]     = useState<AlertSeverity | 'all'>('all');
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [leavingId, setLeavingId]   = useState<string | null>(null);
  const [live, setLive]             = useState(true);

  const itemRefs      = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTopsRef    = useRef<Map<string, number> | null>(null);
  const poolIndexRef   = useRef(0);
  const idCounterRef   = useRef(1000);

  // ─── Simulated live feed: every 2s, a new alert slides into the stack ────
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      const tops = new Map<string, number>();
      itemRefs.current.forEach((el, id) => {
        if (el) tops.set(id, el.getBoundingClientRect().top);
      });
      prevTopsRef.current = tops;

      const template = INCOMING_POOL[poolIndexRef.current % INCOMING_POOL.length];
      poolIndexRef.current += 1;
      const newAlert: Alert = {
        ...template,
        id: `sim-${idCounterRef.current++}`,
        time: 'Just now',
        ack: false,
        owner: null,
      };

      setEnteringId(newAlert.id);
      setAlerts((prev) => {
        const next = [newAlert, ...prev];
        if (next.length > MAX_VISIBLE) {
          setLeavingId(next[next.length - 1].id);
        }
        return next;
      });
    }, FEED_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [live]);

  // ─── FLIP: shift existing rows down smoothly, staggered by position ─────
  useLayoutEffect(() => {
    const prevTops = prevTopsRef.current;
    if (!prevTops) return;
    prevTopsRef.current = null;

    alerts.forEach((alert, index) => {
      if (alert.id === enteringId) return;
      const el = itemRefs.current.get(alert.id);
      const prevTop = prevTops.get(alert.id);
      if (!el || prevTop == null) return;
      const delta = prevTop - el.getBoundingClientRect().top;
      if (!delta) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.getBoundingClientRect(); // force reflow before animating back
      const delay = Math.min(index, 6) * 35;
      el.style.transition = `transform ${SHIFT_DURATION_MS}ms cubic-bezier(.2,.8,.2,1) ${delay}ms`;
      el.style.transform = '';
    });

    if (enteringId) {
      const t = setTimeout(() => setEnteringId(null), 420);
      return () => clearTimeout(t);
    }
  }, [alerts, enteringId]);

  // ─── After the leave animation plays, archive the oldest alert ─────────
  useEffect(() => {
    if (!leavingId) return;
    const t = setTimeout(() => {
      setAlerts((prev) => {
        const archived = prev.find((a) => a.id === leavingId);
        if (archived) setHistory((h) => [archived, ...h].slice(0, 30));
        return prev.filter((a) => a.id !== leavingId);
      });
      setLeavingId(null);
    }, LEAVE_DURATION_MS);
    return () => clearTimeout(t);
  }, [leavingId]);

  const acknowledge = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ack: true } : a)));

  const filtered = alerts.filter((a) => {
    if (scope !== 'all' && a.scope !== scope) return false;
    if (severity !== 'all' && a.severity !== severity) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning:  alerts.filter((a) => a.severity === 'warning').length,
    watch:    alerts.filter((a) => a.severity === 'watch').length,
  };

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div>
          <div className="db-card-title"> Active Alerts</div>
          <div className="db-card-subtitle">External &amp; internal risk signals</div>
        </div>
        <div className="db-card-actions">
          <button
            className={`db-alert-live${live ? ' on' : ''}`}
            onClick={() => setLive((v) => !v)}
            title={live ? 'Pause live feed' : 'Resume live feed'}
          >
            <span className="db-alert-live-dot" /> {live ? 'Live' : 'Paused'}
          </button>
          {history.length > 0 && (
            <button className="db-alert-history-btn" onClick={() => setShowHistory((v) => !v)}>
              History {history.length}
            </button>
          )}
        </div>
      </div>
      <div className="db-card-body">
        {/* Scope segmented control */}
        <div className="db-alert-seg">
          {(['all', 'external', 'internal'] as const).map((s) => (
            <button
              key={s}
              className={`db-alert-seg-btn${scope === s ? ' active' : ''}`}
              onClick={() => setScope(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Severity filter chips */}
        <div className="db-alert-filters">
          <button
            className={`db-alert-chip${severity === 'all' ? ' active' : ''}`}
            onClick={() => setSeverity('all')}
          >
            All {alerts.length}
          </button>
          <button
            className={`db-alert-chip${severity === 'critical' ? ' crit' : ''}`}
            onClick={() => setSeverity(severity === 'critical' ? 'all' : 'critical')}
          >
            Critical {counts.critical}
          </button>
          <button
            className={`db-alert-chip${severity === 'warning' ? ' warn' : ''}`}
            onClick={() => setSeverity(severity === 'warning' ? 'all' : 'warning')}
          >
            Warning {counts.warning}
          </button>
          <button
            className={`db-alert-chip${severity === 'watch' ? ' watch' : ''}`}
            onClick={() => setSeverity(severity === 'watch' ? 'all' : 'watch')}
          >
            Watch {counts.watch}
          </button>
        </div>

        {/* Alert list */}
        <div className="db-alert-list">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              ref={(el) => {
                if (el) itemRefs.current.set(alert.id, el);
                else itemRefs.current.delete(alert.id);
              }}
              className={`db-alert-item${alert.ack ? ' acked' : ''}${alert.id === enteringId ? ' entering' : ''}${alert.id === leavingId ? ' leaving' : ''}`}
            >
              <div className={`db-alert-dot ${alert.severity}`} />
              <div className="db-alert-content">
                <div className="db-alert-title">{alert.title}</div>
                <div className="db-alert-desc">{alert.desc}</div>
                <div className="db-alert-meta">
                  {alert.source} · {alert.time}
                  {alert.owner && ` · Assigned: ${alert.owner}`}
                </div>
                {!alert.ack && (
                  <div className="db-alert-actions">
                    <button
                      className="db-alert-act ack"
                      onClick={() => acknowledge(alert.id)}
                    >
                      ✓ Ack
                    </button>
                    <button className="db-alert-act snooze">⏱ Snooze</button>
                    <select
                      className="db-alert-act"
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setAlerts((prev) =>
                          prev.map((a) =>
                            a.id === alert.id ? { ...a, owner: e.target.value } : a,
                          ),
                        );
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="" disabled>Assign…</option>
                      {ASSIGNEES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {/* Severity badge on the right */}
              <div style={{ fontSize: 8, fontWeight: 700, color: alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--gold)' : 'var(--blue)', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>
                {alert.severity}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-dim)', fontSize: 11 }}>
              No alerts match the current filter
            </div>
          )}
        </div>

        {showHistory && history.length > 0 && (
          <div className="db-alert-archive">
            <div className="db-alert-archive-title">Archived</div>
            {history.map((alert) => (
              <div key={alert.id} className="db-alert-archive-item">
                <div className={`db-alert-dot ${alert.severity}`} />
                <div className="db-alert-content">
                  <div className="db-alert-title">{alert.title}</div>
                  <div className="db-alert-meta">{alert.source} · {alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
