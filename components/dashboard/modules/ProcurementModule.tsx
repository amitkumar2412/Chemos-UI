'use client';

import { useState } from 'react';
import ChartPlaceholder from '../ChartPlaceholder';
import type { Vendor } from '../types';

interface ProcurementModuleProps {
  vendors: Vendor[];
}

export default function ProcurementModule({ vendors }: ProcurementModuleProps) {
  const [selected, setSelected] = useState<Vendor | null>(vendors[0] ?? null);

  const scoreColor = (score: number) =>
    score >= 90 ? 'var(--green)' : score >= 80 ? 'var(--teal)' : 'var(--gold)';

  return (
    <div className="db-grid-2">
      {/* Vendor Scorecard */}
      <div className="db-card">
        <div className="db-card-header">
          <div>
            <div className="db-card-title">Vendor Scorecard</div>
            <div className="db-card-subtitle">Click row to view radar</div>
          </div>
        </div>
        <div className="db-card-body" style={{ padding: 0 }}>
          <table className="db-vendor-tbl">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Quality</th>
                <th>Delivery</th>
                <th>Overall</th>
                <th>HQ</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr
                  key={v.name}
                  className={selected?.name === v.name ? 'selected' : ''}
                  onClick={() => setSelected(v)}
                >
                  <td style={{ fontWeight: 700 }}>{v.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="db-score-bar">
                        <div className="db-score-fill" style={{ width: `${v.quality}%` }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{v.quality}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="db-score-bar">
                        <div className="db-score-fill" style={{ width: `${v.delivery}%` }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{v.delivery}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: scoreColor(v.overall) }}>
                      {v.overall}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gray)', fontSize: 10 }}>{v.hq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Radar */}
      <div className="db-card">
        <div className="db-card-header">
          <div className="db-card-title">
            Vendor Performance Radar
            {selected && (
              <span style={{ marginLeft: 8, color: 'var(--red)', fontSize: 11 }}>— {selected.name}</span>
            )}
          </div>
        </div>
        <div className="db-card-body">
          {selected && (
            <div style={{ marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                {[
                  ['Quality',       selected.quality],
                  ['Delivery',      selected.delivery],
                  ['Price',         selected.price],
                  ['Responsiveness',selected.responsiveness],
                  ['Compliance',    selected.compliance],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: scoreColor(Number(v)) }}>{v}</div>
                    <div style={{ fontSize: 8, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 1 }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ChartPlaceholder title="Vendor Performance Radar Chart" size="md" />
        </div>
      </div>
    </div>
  );
}
