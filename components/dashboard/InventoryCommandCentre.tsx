'use client';

import { useState, useMemo, useEffect } from 'react';
import type { IccItem, InventoryStatus, Currency } from './types';
import { fetchStockStatsSummary, fetchStockStatsByProduct, type StockStatsSummary, type StockStatsByProduct } from '@/lib/api';

// ─── Inline sparkline ─────────────────────────────────────────────────────
function MiniSparkline({ data, status }: { data: number[]; status: InventoryStatus }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 60, H = 18;
  const step = W / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${H - ((v - min) / range) * H}`).join(' ');
  const color = status === 'critical' ? 'var(--red)' : status === 'warn' ? 'var(--gold)' : 'var(--teal)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: 60, height: 18 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Headline stat ─────────────────────────────────────────────────────────
function HeadlineStat({
  icon, label, value, unit, delta, colorClass,
}: {
  icon: string; label: string; value: string | number; unit?: string;
  delta?: string; colorClass?: string;
}) {
  return (
    <div className={`db-hl${colorClass ? ` ${colorClass}` : ''}`}>
      <div className="db-hl-label">{icon} {label}</div>
      <div className="db-hl-val">
        {value}
        {unit && <span className="db-hl-unit">{unit}</span>}
      </div>
      {delta && <div className="db-hl-delta flat">{delta}</div>}
    </div>
  );
}

// ─── Detail Rail ──────────────────────────────────────────────────────────
function DetailRail({ item, onClose }: { item: IccItem; onClose: () => void }) {
  return (
    <div className="db-rail">
      <div className="db-rail-head">
        <div>
          <div className="db-rail-name">{item.item}</div>
          <div className="db-rail-ctx">{item.port} · {item.company}</div>
        </div>
        <button className="db-rail-close" onClick={onClose}>×</button>
      </div>

      <div className="db-rail-section">
        <div className="db-rail-section-title">Stock Overview</div>
        <div className="db-rail-stats">
          <div className="db-rail-stat">
            <div className="db-rail-stat-label">Physical</div>
            <div className="db-rail-stat-val green">{item.physical} MT</div>
          </div>
          <div className="db-rail-stat">
            <div className="db-rail-stat-label">Ready/Unsold</div>
            <div className="db-rail-stat-val">{item.ready} MT</div>
          </div>
          <div className="db-rail-stat">
            <div className="db-rail-stat-label">Safety Level</div>
            <div className="db-rail-stat-val gold">{item.safety} MT</div>
          </div>
          <div className="db-rail-stat">
            <div className="db-rail-stat-label">Reorder Point</div>
            <div className="db-rail-stat-val">{item.reorder} MT</div>
          </div>
        </div>
      </div>

      <div className="db-rail-section">
        <div className="db-rail-section-title">Pricing</div>
        <div className="db-rail-stats">
          <div className="db-rail-stat">
            <div className="db-rail-stat-label">Market ₹/MT</div>
            <div className="db-rail-stat-val">{item.market.toLocaleString('en-IN')}</div>
          </div>
          <div className="db-rail-stat">
            <div className="db-rail-stat-label">Selling ₹/MT</div>
            <div className="db-rail-stat-val green">{item.selling.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="db-rail-section">
        <div className="db-rail-section-title">7-Day Trend</div>
        <div style={{ background: 'rgba(255,255,255,.025)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox={`0 0 120 50`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: 50 }}
          >
            {(() => {
              const d = item.trend7d;
              const min = Math.min(...d); const max = Math.max(...d); const range = max - min || 1;
              const step = 120 / (d.length - 1);
              const pts = d.map((v, i) => `${i * step},${50 - ((v - min) / range) * 40}`).join(' ');
              const color = item.status === 'critical' ? 'var(--red)' : item.status === 'warn' ? 'var(--gold)' : 'var(--teal)';
              return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />;
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
interface InventoryCommandCentreProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currency: Currency; // reserved for future backend pricing
}

type SortKey = keyof IccItem;

export default function InventoryCommandCentre({}: InventoryCommandCentreProps) {
  const [search, setSearch]         = useState('');
  const [portFilter, setPortFilter] = useState<string | null>(null);
  const [coFilter, setCoFilter]     = useState<string | null>(null);
  const [statusFilter, setStatus]   = useState<string | null>(null);
  const [selectedItem, setSelected] = useState<IccItem | null>(null);
  const [sortCol, setSortCol]       = useState<SortKey>('item');
  const [sortDir, setSortDir]       = useState<1 | -1>(1);
  const [aggByItem, setAggByItem]   = useState(false);

  const [summary, setSummary]               = useState<StockStatsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [lastUpdated, setLastUpdated]       = useState<string>('just now');
  const [byProduct, setByProduct]           = useState<StockStatsByProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSummaryLoading(true);
      try {
        const [summaryData, byProductData] = await Promise.allSettled([
          fetchStockStatsSummary(),
          fetchStockStatsByProduct(),
        ]);
        if (!cancelled) {
          if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
          if (byProductData.status === 'fulfilled') setByProduct(byProductData.value);
          setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const apiItems = useMemo((): IccItem[] | null => {
    if (!byProduct || byProduct.length === 0) return null;
    return byProduct.map((row) => ({
      item:             row.product,
      port:             row.dischargePort,
      company:          row.companyName ?? '—',
      physical:         row.physicalUnsold,
      ready:            row.incomingBalance,
      safety:           0,
      reorder:          0,
      market:           0,
      selling:          0,
      trend7d:          [row.physicalStock, row.physicalUnsold],
      status:           row.totalStock <= 0 ? 'critical' : row.physicalUnsold < 50 ? 'warn' : 'ok',
      physicalReady:    row.physicalReady,
      physicalStock:    row.physicalStock,
      physicalSold:     row.physicalSold,
      incomingStock:    row.incomingStock,
      purchaseIncoming: row.purchaseIncoming,
      incomingSales:    row.incomingSales,
      totalStock:       row.totalStock,
    }));
  }, [byProduct]);

  const tableItems = apiItems ?? [];

  const ports    = useMemo(() => [...new Set(tableItems.map((i) => i.port))],    [tableItems]);

  const filtered = useMemo(() => {
    let rows = tableItems;
    if (search)      rows = rows.filter((r) => r.item.toLowerCase().includes(search.toLowerCase()) || r.company.toLowerCase().includes(search.toLowerCase()) || r.port.toLowerCase().includes(search.toLowerCase()));
    if (portFilter)  rows = rows.filter((r) => r.port === portFilter);
    if (coFilter)    rows = rows.filter((r) => r.company === coFilter);
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);

    if (aggByItem) {
      const map = new Map<string, IccItem>();
      rows.forEach((r) => {
        const existing = map.get(r.item);
        if (existing) {
          existing.physical     += r.physical;
          existing.ready        += r.ready;
          existing.physicalReady = (existing.physicalReady ?? 0) + (r.physicalReady ?? 0);
        } else {
          map.set(r.item, { ...r, port: '—', company: '—' });
        }
      });
      rows = [...map.values()];
    }

    return [...rows].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [tableItems, search, portFilter, coFilter, statusFilter, aggByItem, sortCol, sortDir]);

  const toggleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortCol(col); setSortDir(1); }
  };

  // Headline aggregates — from summary API when available, otherwise derived from table data
  const totalPhysical         = tableItems.reduce((s, i) => s + i.physical, 0);
  const totalReady            = tableItems.reduce((s, i) => s + i.ready, 0);
  const totalStock            = summary ? summary.totalStock            : totalPhysical;
  const physicalUnsoldClosing = summary ? summary.physicalUnsoldClosing : totalReady;
  const incomingUnsold        = summary ? summary.incomingUnsoldClosing : 0;
  const incomingSold          = summary ? summary.incomingSold          : 0;

  function fmt(v: number) { return Number.isInteger(v) ? v : parseFloat(v.toFixed(2)); }

  const statusCounts = useMemo(() => ({
    critical: tableItems.filter((i) => i.status === 'critical').length,
    warn:     tableItems.filter((i) => i.status === 'warn').length,
    ok:       tableItems.filter((i) => i.status === 'ok').length,
  }), [tableItems]);



  return (
    <div className="db-icc-wrap">
      <div className="db-icc">
        {/* Header */}
        <div className="db-icc-head">
          <div className="db-icc-title-block">
            <div className="db-icc-glyph">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 7l9-4 9 4M3 7l9 4 9-4M3 7v10l9 4 9-4V7M12 11v10" />
              </svg>
            </div>
            <div>
              <div className="db-icc-title">Inventory Command Centre</div>
              <div className="db-icc-sub">Real-time stock intelligence · {tableItems.length} positions</div>
            </div>
          </div>
          <div className="db-icc-pulse">
            <div className="db-icc-pulse-dot" />
            <span className="db-icc-pulse-text">
              {summaryLoading ? 'Loading…' : <>Updated <strong>{lastUpdated}</strong></>}
            </span>
          </div>
        </div>

        {/* Headline stats */}
        <div className="db-headline">
          <HeadlineStat icon="" label="TOTAL STOCK"             value={fmt(totalStock)}            unit=" MT" />
          <HeadlineStat icon="" label="PHYSICAL UNSOLD" value={fmt(physicalUnsoldClosing)} unit=" MT" />
          <HeadlineStat icon="" label="INCOMING UNSOLD"         value={fmt(incomingUnsold)}        unit=" MT" />
          <HeadlineStat icon="" label="INCOMING SOLD"           value={fmt(incomingSold)}          unit=" MT" />
        </div>

        {/* Filter controls */}
        <div className="db-ctrl">
          {/* Search */}
          <div className="db-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="db-icc-search"
              type="text"
              placeholder="Search item, port, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Port chips */}
          <div className="db-ctrl-group">
            <span className="db-ctrl-label">Port</span>
            <div className="db-chips">
              {ports.map((p) => (
                <button
                  key={p}
                  className={`db-chip${portFilter === p ? ' active' : ''}`}
                  onClick={() => setPortFilter(portFilter === p ? null : p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status chips */}
          <div className="db-ctrl-group">
            <span className="db-ctrl-label">Status</span>
            <div className="db-chips">
              {(['critical','warn','ok'] as InventoryStatus[]).map((s) => (
                <button
                  key={s}
                  className={`db-chip${statusFilter === s ? ' active' : ''}`}
                  onClick={() => setStatus(statusFilter === s ? null : s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="db-chip-count">{statusCounts[s as keyof typeof statusCounts] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="db-ctrl-spacer" />

          <button className="db-ctrl-btn" onClick={() => setAggByItem((v) => !v)}>
            ⊞ {aggByItem ? 'By SKU' : 'By Item'}
          </button>
          <button className="db-ctrl-btn">⬇ CSV</button>
        </div>

        {/* Table + Rail */}
        <div className="db-icc-main">
          <div className="db-tbl-region" style={{ overflowX: 'auto' }}>
            <table className="db-inv" style={{ minWidth: 1320 }}>
              <thead>
                <tr>
                  {([
                    ['item',             'Product'],
                    ['port',             'Port'],
                     ['physicalStock',    'Physical Stock '],
                    ['physicalReady',    'Purchase Ready'],
                   
                    ['physicalSold',     'Physical Sold'],
                    ['physical',         'Physical Unsold '],
                    ['incomingStock',    'Incoming Stock'],
                    ['purchaseIncoming', 'Purchase Incoming'],
                    ['incomingSales',    'Incoming Sales'],
                    ['ready',            'Incoming Balance'],
                    ['totalStock',       'Total Stock'],
                    ['company',          'Company'],
                  ] as [string, string][]).map(([col, label]) => {
                    const isNum = ['physicalReady','physicalStock','physicalSold','physical','incomingStock','purchaseIncoming','incomingSales','ready','totalStock'].includes(col);
                    const stickyClass = col === 'item' ? 'db-col-sticky db-col-sticky-1' : col === 'port' ? 'db-col-sticky db-col-sticky-2' : '';
                    return (
                      <th
                        key={col}
                        className={[isNum ? 'num' : '', stickyClass].filter(Boolean).join(' ')}
                        onClick={() => toggleSort(col as SortKey)}
                      >
                        {label}
                        {sortCol === col && (
                          <span style={{ marginLeft: 4, opacity: .6 }}>{sortDir === 1 ? '▲' : '▼'}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={i}
                    className={selectedItem?.item === row.item && selectedItem?.port === row.port ? 'selected' : ''}
                    onClick={() => setSelected(selectedItem?.item === row.item && selectedItem?.port === row.port ? null : row)}
                  >
                    <td className="db-col-sticky db-col-sticky-1">
                      <div className="db-row-name">
                        <span className={`db-row-dot ${row.status}`} />
                        {row.item}
                      </div>
                    </td>
                    <td className="db-col-sticky db-col-sticky-2">{row.port}</td>
                    
                    <td className="num">{row.physicalStock ?? '—'}</td>
                    <td className="num">{row.physicalReady ?? '—'}</td>
                    <td className="num">{row.physicalSold ?? '—'}</td>
                    <td className="num">{row.physical}</td>
                    <td className="num">{row.incomingStock ?? '—'}</td>
                    <td className="num">{row.purchaseIncoming ?? '—'}</td>
                    <td className="num">{row.incomingSales ?? '—'}</td>
                    <td className="num">{row.ready}</td>
                    <td className="num">{row.totalStock ?? '—'}</td>
                    <td>{row.company}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-dim)' }}>
                      {summaryLoading
                        ? 'Loading inventory data…'
                        : tableItems.length === 0
                        ? 'No data found'
                        : 'No items match the current filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail popup */}
        {selectedItem && (
          <div className="db-rail-modal-overlay" onClick={() => setSelected(null)}>
            <div className="db-rail-modal" onClick={(e) => e.stopPropagation()}>
              <DetailRail item={selectedItem} onClose={() => setSelected(null)} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="db-icc-foot">
          <div style={{ display: 'flex', gap: 18 }}>
            <div className="db-icc-foot-stat">
              <span>Showing</span>
              <strong>{filtered.length}</strong>
              <span>of</span>
              <strong>{tableItems.length}</strong>
              <span>rows</span>
            </div>
            <div className="db-icc-foot-stat">
              <span>Filtered physical:</span>
              <strong>{filtered.reduce((s, r) => s + r.physical, 0)} MT</strong>
            </div>
          </div>
        </div>

        {/* ─── Summary Panel ──────────────────────────────────────────────── */}
        <StockSummaryPanel
          summary={summary}
          loading={summaryLoading}
          items={tableItems}
        />
      </div>
    </div>
  );
}

// ─── Stock Summary Panel ───────────────────────────────────────────────────
function StockSummaryPanel({
  items,
}: {
  summary: StockStatsSummary | null;
  loading: boolean;
  items: IccItem[];
}) {
  const portTotals = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => map.set(i.port, (map.get(i.port) ?? 0) + i.physical));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const maxPortQty = portTotals[0]?.[1] ?? 1;

  const totalItems = items.length;
  const criticalCt = items.filter((i) => i.status === 'critical').length;
  const warnCt     = items.filter((i) => i.status === 'warn').length;
  const okCt       = items.filter((i) => i.status === 'ok').length;

  return (
    <div className="db-summary">
      <div className="db-summary-title">Stock Summary</div>

      {/* Status breakdown + port breakdown */}
      <div className="db-summary-lower">
        {/* Status breakdown */}
        <div className="db-sum-status">
          <div className="db-sum-section-title">Status Distribution — {totalItems} positions</div>
          {([
            ['critical', criticalCt] as const,
            ['warn',     warnCt]     as const,
            ['ok',       okCt]       as const,
          ]).map(([s, count]) => (
            <div key={s} className="db-sum-status-row">
              <span className={`db-sum-status-label ${s}`}>{s.toUpperCase()}</span>
              <div className="db-sum-bar-track">
                <div
                  className={`db-sum-bar-fill ${s}`}
                  style={{ width: totalItems ? `${(count / totalItems) * 100}%` : '0%' }}
                />
              </div>
              <span className="db-sum-status-count">{count}</span>
            </div>
          ))}
        </div>

        {/* Port breakdown */}
        <div className="db-sum-ports">
          <div className="db-sum-section-title">Physical Stock by Port</div>
          {portTotals.map(([port, qty]) => (
            <div key={port} className="db-sum-port-row">
              <span className="db-sum-port-name">{port}</span>
              <div className="db-sum-port-bar-track">
                <div
                  className="db-sum-port-bar-fill"
                  style={{ width: `${(qty / maxPortQty) * 100}%` }}
                />
              </div>
              <span className="db-sum-port-qty">{qty} MT</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
