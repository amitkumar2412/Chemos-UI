'use client';

import { useState } from 'react';
import ChartPlaceholder from '../ChartPlaceholder';
import type { TopPartner, KpiDriver, Port, ProspectSupplier } from '../types';

type ScmSubTab = 'timeliness' | 'partners' | 'kpi' | 'warehouse' | 'ports';

// ─── Top Partners Bar Chart ────────────────────────────────────────────────
function PartnerBars({ partners, currency }: { partners: TopPartner[]; currency: string }) {
  const max = Math.max(...partners.map((p) => p.value));
  return (
    <div>
      {partners.map((p) => (
        <div key={p.name} className="db-partner-row">
          <div className="db-partner-name">{p.name}</div>
          <div className="db-partner-bar-wrap">
            <div className="db-partner-bar" style={{ width: `${(p.value / max) * 100}%` }} />
          </div>
          <div className="db-partner-val">{p.value} {currency === 'month' ? 'Cr' : ''}</div>
          <div className="db-partner-pct">{p.pct}%</div>
        </div>
      ))}
    </div>
  );
}

interface ScmModuleProps {
  topCustomers: Record<string, TopPartner[]>;
  topSuppliers: Record<string, TopPartner[]>;
  kpiDrivers: KpiDriver[];
  ports: Port[];
  prospects: ProspectSupplier[];
}

export default function ScmModule({
  topCustomers, topSuppliers, kpiDrivers, ports, prospects,
}: ScmModuleProps) {
  const [sub, setSub] = useState<ScmSubTab>('timeliness');
  const [custRange, setCustRange] = useState<'month' | 'year'>('month');
  const [suppRange, setSuppRange] = useState<'month' | 'year'>('month');

  return (
    <div>
      {/* Sub-tabs */}
      <div className="db-scm-tabs">
        {([
          ['timeliness','Timeliness'],
          ['partners','Partners'],
          ['kpi','KPI Drivers'],
          ['warehouse','Warehouse'],
          ['ports','Ports & Trade'],
        ] as [ScmSubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            className={`db-scm-tab${sub === id ? ' active' : ''}`}
            onClick={() => setSub(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeliness */}
      {sub === 'timeliness' && (
        <div className="db-grid-2">
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">Lead Time Tracking</div></div>
            <div className="db-card-body"><ChartPlaceholder title="Lead Time by Vendor (Bar Chart)" size="sm" /></div>
          </div>
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">Order Fulfillment Rate</div></div>
            <div className="db-card-body"><ChartPlaceholder title="Fulfillment Rate Trend (Line Chart)" size="sm" /></div>
          </div>
        </div>
      )}

      {/* Partners */}
      {sub === 'partners' && (
        <div className="db-grid-2">
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title">Top 10 Customers</div>
              <div className="db-toggle-group">
                {(['month','year'] as const).map((r) => (
                  <button key={r} className={`db-toggle-btn${custRange === r ? ' active' : ''}`} onClick={() => setCustRange(r)}>
                    {r === 'month' ? 'MTD' : 'YTD'}
                  </button>
                ))}
              </div>
            </div>
            <div className="db-card-body">
              <PartnerBars partners={topCustomers[custRange] ?? []} currency={custRange} />
            </div>
          </div>
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title">Top 10 Suppliers</div>
              <div className="db-toggle-group">
                {(['month','year'] as const).map((r) => (
                  <button key={r} className={`db-toggle-btn${suppRange === r ? ' active' : ''}`} onClick={() => setSuppRange(r)}>
                    {r === 'month' ? 'MTD' : 'YTD'}
                  </button>
                ))}
              </div>
            </div>
            <div className="db-card-body">
              <PartnerBars partners={topSuppliers[suppRange] ?? []} currency={suppRange} />
            </div>
          </div>
        </div>
      )}

      {/* KPI Drivers */}
      {sub === 'kpi' && (
        <div className="db-grid-3">
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">KPI Drivers</div></div>
            <div className="db-card-body">
              {kpiDrivers.map((d) => (
                <div key={d.driver} className="db-kpi-driver-row">
                  <span className="db-kpi-driver-name">{d.driver}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`db-kpi-driver-arrow ${d.direction}`}>
                      {d.direction === 'up' ? '▲' : '▼'}
                    </span>
                    <span className="db-kpi-driver-val">{d.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">Customer Concentration</div></div>
            <div className="db-card-body"><ChartPlaceholder title="HHI Gauge" size="sm" /></div>
          </div>
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">Inventory Aging</div></div>
            <div className="db-card-body"><ChartPlaceholder title="Aging Stacked Bar" size="sm" /></div>
          </div>
        </div>
      )}

      {/* Warehouse */}
      {sub === 'warehouse' && (
        <div className="db-grid-2">
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">Warehouse Utilization</div></div>
            <div className="db-card-body"><ChartPlaceholder title="Zone Utilization Bar Chart" size="sm" /></div>
          </div>
          <div className="db-card">
            <div className="db-card-header"><div className="db-card-title">Zone Inventory Map</div></div>
            <div className="db-card-body"><ChartPlaceholder title="Zone Heat Map" size="sm" /></div>
          </div>
        </div>
      )}

      {/* Ports */}
      {sub === 'ports' && (
        <div className="db-card">
          <div className="db-card-header">
            <div>
              <div className="db-card-title">🚢 Port &amp; Trade Intelligence</div>
              <div className="db-card-subtitle">Ports used, commodities per vendor, prospective suppliers</div>
            </div>
          </div>
          <div className="db-card-body">
            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8, color: 'var(--gold)' }}>Port Activity</div>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table className="db-generic-tbl">
                <thead>
                  <tr>
                    <th>Port</th><th>City</th><th>Type</th>
                    <th>Volume</th><th>Key Vendors</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((p) => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td>{p.city}</td>
                      <td>{p.type}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.volume}</td>
                      <td style={{ color: 'var(--gray)', fontSize: 10 }}>{p.vendors}</td>
                      <td><span className={`db-port-status ${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8, color: 'var(--teal)' }}>Prospective Suppliers</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="db-generic-tbl">
                <thead>
                  <tr>
                    <th>Chemical</th><th>Supplier</th><th>Country</th>
                    <th>Capacity</th><th>Lead Time</th><th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--teal)' }}>{p.chem}</td>
                      <td>{p.supplier}</td>
                      <td>{p.country}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.capacity}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.lead}</td>
                      <td style={{ color: 'var(--gray)', fontSize: 10 }}>{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
