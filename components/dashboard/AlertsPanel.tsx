'use client';

import { useState } from 'react';
import type { Alert, AlertSeverity, AlertScope } from './types';

interface AlertsPanelProps {
  alerts: Alert[];
}

const ASSIGNEES = ['Shrish K.', 'R. Sharma', 'A. Gupta', 'P. Nair', 'Dr. Mehta', 'V. Reddy'];

export default function AlertsPanel({ alerts: initialAlerts }: AlertsPanelProps) {
  const [alerts, setAlerts]         = useState<Alert[]>(initialAlerts);
  const [scope, setScope]           = useState<'all' | AlertScope>('all');
  const [severity, setSeverity]     = useState<AlertSeverity | 'all'>('all');

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
            <div key={alert.id} className={`db-alert-item${alert.ack ? ' acked' : ''}`}>
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
      </div>
    </div>
  );
}
