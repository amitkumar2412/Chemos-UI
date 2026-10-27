'use client';

import { useEffect, useMemo, useState } from 'react';
import { colorForStatus, type Vessel } from '../data';
import { formatUtc } from '../format';
import {
  fetchDishPortSummary,
  invalidateDishPortSummary,
  listProducts,
  summarizeProduct,
  type DishPortSummaryRow,
} from '../productIntelApi';

const ACCENT = '#4895ef';
const PAGE_SIZE = 10;
const TOP_N = 10;

type SortKey = 'vessel_name' | 'dish_port_clean' | 'total_qty' | 'shipment_count' | 'avg_waiting_days' | 'avg_berth_days' | 'dish_port_share';

const fmtQty = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtDays = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)} d`);
const fmtPct = (v: number | null) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

/* ── Building blocks ─────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '16px 18px',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--gray)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '13px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--white)',
};

function PanelTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>{title}</div>
      {hint && <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>{hint}</div>}
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--white)' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--gray-dim)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

/** Single-series horizontal bar list: label · bar · value, with a hover tooltip. */
function BarList({ items }: { items: { key: string; label: string; value: number; detail: string }[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <div style={{ fontSize: '13px', color: 'var(--gray)' }}>No data.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((i) => (
        <div
          key={i.key}
          onMouseEnter={() => setHover(i.key)}
          onMouseLeave={() => setHover(null)}
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'minmax(110px, 38%) 1fr auto',
            alignItems: 'center',
            gap: '10px',
            padding: '5px 6px',
            borderRadius: '6px',
            background: hover === i.key ? 'var(--navy-light)' : 'transparent',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.label}>
            {i.label}
          </span>
          <div style={{ height: '10px', borderRadius: '2px', background: 'var(--border)', opacity: 0.6, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: '0 auto 0 0',
                width: `${(i.value / max) * 100}%`,
                minWidth: '2px',
                background: ACCENT,
                borderRadius: '0 4px 4px 0',
                opacity: hover && hover !== i.key ? 0.55 : 1,
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--white)', fontVariantNumeric: 'tabular-nums' }}>{fmtQty(i.value)}</span>
          {hover === i.key && (
            <div
              style={{
                position: 'absolute',
                right: '6px',
                bottom: 'calc(100% + 2px)',
                zIndex: 5,
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--navy-light)',
                border: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--white)',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            >
              <strong>{i.label}</strong> · {i.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export default function ProductIntelligence({
  vessels,
  onLocateVessel,
}: {
  vessels: Vessel[];
  onLocateVessel: (mmsi: string) => void;
}) {
  const [rows, setRows] = useState<DishPortSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [productId, setProductId] = useState<string>('');

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortKey>('total_qty');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchDishPortSummary()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product shipping data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const products = useMemo(() => listProducts(rows), [rows]);

  // Use the user's selection if valid, otherwise default to the first product from the API.
  const activeProductId = useMemo(() => {
    if (products.some((p) => p.product_id === productId)) return productId;
    return products[0]?.product_id ?? '';
  }, [products, productId]);

  function selectProduct(id: string) {
    setProductId(id);
    setPage(0);
    setSearch('');
  }

  const summary = useMemo(
    () => (activeProductId ? summarizeProduct(rows, activeProductId) : null),
    [rows, activeProductId]
  );

  // Historical carriers of this product that are also in the live feed right now.
  const liveCarriers = useMemo(() => {
    if (!summary) return [];
    const byShipId = new Map<number, Vessel>();
    for (const v of vessels) if (v.ship_id != null) byShipId.set(v.ship_id, v);
    return summary.vessels
      .filter((s) => s.ship_id != null && byShipId.has(s.ship_id))
      .map((s) => ({ stat: s, live: byShipId.get(s.ship_id as number)! }));
  }, [summary, vessels]);

  const tableRows = useMemo(() => {
    if (!summary) return [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? summary.rows.filter((r) => r.vessel_name.toLowerCase().includes(q) || r.dish_port_clean.toLowerCase().includes(q))
      : summary.rows;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) * sortDir;
    });
  }, [summary, search, sortCol, sortDir]);

  const pageCount = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const pageRows = tableRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(col: SortKey) {
    if (col === sortCol) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortCol(col);
      setSortDir(col === 'vessel_name' || col === 'dish_port_clean' ? 1 : -1);
    }
    setPage(0);
  }

  const controlStyle: React.CSSProperties = {
    padding: '10px 14px',
    background: 'var(--navy-light)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
    color: 'var(--white)',
    outline: 'none',
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Product
        </label>
        <select
          value={activeProductId}
          onChange={(e) => selectProduct(e.target.value)}
          disabled={loading || products.length === 0}
          style={{ ...controlStyle, minWidth: '300px', cursor: 'pointer' }}
        >
          {products.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.product} ({p.shipments} shipments)
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            invalidateDishPortSummary();
            setLoading(true);
            setError(null);
            setReloadKey((k) => k + 1);
          }}
          disabled={loading}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'var(--navy-light)',
            border: '1px solid var(--border)',
            color: 'var(--white)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Reload'}
        </button>
        {summary?.snapshot_at && (
          <span style={{ fontSize: '12px', color: 'var(--gray-dim)' }}>Summary built {formatUtc(summary.snapshot_at)}</span>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: '13px',
          }}
        >
          Unable to load product shipping data: {error}
        </div>
      )}

      {loading && !summary && <div style={{ ...card, color: 'var(--gray)', fontSize: '14px' }}>Loading product shipping history…</div>}

      {!loading && !error && products.length === 0 && (
        <div style={{ ...card, color: 'var(--gray)', fontSize: '14px' }}>No product shipping data returned by the backend.</div>
      )}

      {summary && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <StatTile label="Total quantity" value={fmtQty(summary.total_qty)} sub="Sum of discharged quantity" />
            <StatTile label="Shipments" value={summary.shipments.toLocaleString()} />
            <StatTile
              label="Unique vessels"
              value={summary.unique_vessels.toLocaleString()}
              sub={`${summary.linked_vessels} linked to live tracking`}
            />
            <StatTile label="Discharge ports" value={summary.port_count.toLocaleString()} />
            <StatTile label="Avg waiting time" value={fmtDays(summary.avg_waiting_days)} sub="Weighted by shipments" />
            <StatTile label="Avg berth time" value={fmtDays(summary.avg_berth_days)} sub="Weighted by shipments" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={card}>
              <PanelTitle title="Quantity by discharge port" hint="Where this product is discharged, by total quantity" />
              <BarList
                items={summary.ports.slice(0, TOP_N).map((p) => ({
                  key: p.port_id,
                  label: p.port_name,
                  value: p.total_qty,
                  detail: `${p.shipments} shipments · ${p.vessels} vessels · ${fmtPct(p.total_qty / summary.total_qty)} of volume`,
                }))}
              />
            </div>
            <div style={card}>
              <PanelTitle title={`Top ${Math.min(TOP_N, summary.vessels.length)} carriers`} hint="Vessels that moved the most of this product" />
              <BarList
                items={summary.vessels.slice(0, TOP_N).map((v) => ({
                  key: v.key,
                  label: v.vessel_name,
                  value: v.total_qty,
                  detail: `${v.shipments} shipments · ${v.ports.join(', ')}`,
                }))}
              />
            </div>
          </div>

          {/* Live carriers */}
          <div style={{ ...card, marginBottom: '20px' }}>
            <PanelTitle
              title={`Known carriers in the live feed (${liveCarriers.length})`}
              hint={`Vessels that have carried ${summary.product} and appear in the live tracking feed now. This shows where a vessel is, not what it carries now.`}
            />
            {liveCarriers.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                {vessels.length === 0
                  ? 'Live vessel data is not loaded yet.'
                  : 'None of this product’s historical carriers are in the live feed right now.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Vessel', 'Status', 'Current area', 'Heading to', 'ETA / ATA', 'Past qty', ''].map((h) => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveCarriers.map(({ stat, live }) => (
                      <tr key={stat.key}>
                        <td style={{ ...td, fontWeight: 600 }}>{live.vessel_name}</td>
                        <td style={td}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: `${colorForStatus(live.status)}22`,
                              color: colorForStatus(live.status),
                            }}
                          >
                            {live.status}
                          </span>
                        </td>
                        <td style={td}>{live.current_area}</td>
                        <td style={td}>{live.voyage_arrival_port_name}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          {formatUtc(live.voyage_arrival_label === 'ATA' ? live.voyage_arrival_utc : live.voyage_eta_utc)}
                        </td>
                        <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{fmtQty(stat.total_qty)}</td>
                        <td style={td}>
                          <button
                            onClick={() => onLocateVessel(live.mmsi)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(72,149,239,0.15)',
                              border: 'none',
                              color: ACCENT,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View on map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Port performance */}
          <div style={{ ...card, marginBottom: '20px' }}>
            <PanelTitle title="Port performance" hint="Ports are grouped by port_id. Other spellings of the same port are shown underneath." />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Port', 'Shipments', 'Vessels', 'Quantity', 'Share', 'Avg waiting', 'Avg berth'].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.ports.map((p) => (
                    <tr key={p.port_id}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{p.port_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-dim)' }}>
                          {p.port_id}
                          {p.aliases.length > 0 && ` · also “${p.aliases.join('”, “')}”`}
                        </div>
                      </td>
                      <td style={td}>{p.shipments}</td>
                      <td style={td}>{p.vessels}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{fmtQty(p.total_qty)}</td>
                      <td style={td}>{fmtPct(p.total_qty / summary.total_qty)}</td>
                      <td style={td}>{fmtDays(p.avg_waiting_days)}</td>
                      <td style={td}>{fmtDays(p.avg_berth_days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vessel × port detail */}
          <div style={{ ...card, marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <PanelTitle title="Vessel × port history" hint={`${tableRows.length} vessel–port records`} />
              <input
                type="text"
                placeholder="Filter by vessel or port…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                style={{ ...controlStyle, minWidth: '240px', fontSize: '13px', padding: '8px 12px' }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {([
                      ['vessel_name', 'Vessel'],
                      ['dish_port_clean', 'Discharge port'],
                      ['shipment_count', 'Shipments'],
                      ['total_qty', 'Quantity'],
                      ['dish_port_share', 'Vessel’s share to port'],
                      ['avg_waiting_days', 'Avg waiting'],
                      ['avg_berth_days', 'Avg berth'],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <th key={key} style={{ ...th, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(key)}>
                        {label}
                        {sortCol === key ? (sortDir === 1 ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...td, fontWeight: 600 }}>
                        {r.vessel_name}
                        {r.ship_id == null && (
                          <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--gray-dim)' }} title="No ship_id: cannot be linked to live tracking">
                            unlinked
                          </span>
                        )}
                      </td>
                      <td style={td}>{r.dish_port_clean}</td>
                      <td style={td}>{r.shipment_count ?? '—'}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{r.total_qty == null ? '—' : fmtQty(r.total_qty)}</td>
                      <td style={td}>{fmtPct(r.dish_port_share)}</td>
                      <td style={td}>{fmtDays(r.avg_waiting_days)}</td>
                      <td style={td}>{fmtDays(r.avg_berth_days)}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td style={{ ...td, color: 'var(--gray)' }} colSpan={7}>
                        No records match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '12px', fontSize: '12px', color: 'var(--gray)' }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ ...controlStyle, padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                Prev
              </button>
              Page {page + 1} of {pageCount}
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                style={{ ...controlStyle, padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>

          {/* Coverage note */}
          <div style={{ ...card, border: '1px dashed var(--border)', fontSize: '12px', color: 'var(--gray)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--white)' }}>Not available yet:</strong> monthly shipping activity, transit times and
            origin → destination routes. The summary only has totals for each vessel and discharge port. It has no shipment dates
            and no load ports. To add them, the backend needs per-shipment records with <code>load_port</code>,{' '}
            <code>discharge_port</code>, <code>departure_date</code>, <code>arrival_date</code> and <code>quantity</code>.
          </div>
        </>
      )}
    </div>
  );
}
