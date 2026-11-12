'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { colorForStatus, type Vessel } from './data';
import { fetchShippingData } from './api';
import { fetchShipInventory, type OwnershipFilter, type ShipInventoryRow } from './inventoryApi';
import { formatUtc } from './format';

const ShipMap = dynamic(() => import('./_components/ShipMap'), { ssr: false });
const ShipInventoryTable = dynamic(() => import('./_components/ShipInventoryTable'), { ssr: false });

const OWNERSHIP_OPTIONS: { id: OwnershipFilter; label: string }[] = [
  { id: 'all', label: 'All Ships' },
  { id: 'my', label: 'My Ships' },
  { id: 'global', label: 'Global Ships' },
];

function renderBold(text: string) {
  if (!text) return null;
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: 'var(--white)' }}>
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* ── Shared sub-components ───────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--gray)',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {children}
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

function InfoCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div
      style={{
        background: 'var(--navy-light)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'var(--gray)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: accent ?? 'var(--white)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function CompactHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--gray-dim)',
        margin: '14px 0 6px',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '3px 0', fontSize: '12px' }}>
      <span style={{ color: 'var(--gray)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--white)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

/* ── Voyage route visual ─────────────────────────────────────────── */

function VoyageRoute({ vessel }: { vessel: Vessel }) {
  const progress = Math.min(100, Math.max(0, vessel.voyage_progress));
  const isArrived = vessel.voyage_arrival_label === 'ATA' || progress >= 100;
  const progressColor = isArrived ? '#06d6a0' : '#4895ef';

  return (
    <div
      style={{
        background: 'var(--navy-light)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}
    >
      {/* FROM → TO header */}
      <div className="rsp-stack-sm" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'start', marginBottom: '20px' }}>
        {/* Departure */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: '4px' }}>
            From
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>
            {vessel.voyage_departure_port_name}
          </div>
          {vessel.voyage_departure_unlocode !== '—' && (
            <div style={{ fontSize: '11px', color: 'var(--gray-dim)' }}>
              {vessel.voyage_departure_unlocode}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
            {formatUtc(vessel.voyage_departure_utc)}
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              background: 'rgba(72,149,239,0.15)',
              color: '#4895ef',
            }}
          >
            {vessel.voyage_departure_label}
          </span>
        </div>

        {/* Arrow */}
        <div style={{ paddingTop: '18px', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Arrival */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: '4px' }}>
            To
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>
            {vessel.voyage_arrival_port_name}
          </div>
          {vessel.voyage_arrival_unlocode !== '—' && (
            <div style={{ fontSize: '11px', color: 'var(--gray-dim)' }}>
              {vessel.voyage_arrival_unlocode}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
            {vessel.voyage_arrival_label === 'ATA'
              ? formatUtc(vessel.voyage_arrival_utc)
              : `ETA ${formatUtc(vessel.voyage_eta_utc)}`}
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              background: isArrived ? 'rgba(6,214,160,0.15)' : 'rgba(248,162,97,0.15)',
              color: isArrived ? '#06d6a0' : '#f4a261',
            }}
          >
            {vessel.voyage_arrival_label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '3px',
              width: `${progress}%`,
              background: progressColor,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
            fontSize: '11px',
          }}
        >
          <span style={{ color: 'var(--gray-dim)' }}>
            {vessel.voyage_reported_destination !== '—' && `Dest: ${vessel.voyage_reported_destination}`}
          </span>
          <span style={{ color: progressColor, fontWeight: 700 }}>
            {isArrived ? 'Arrived' : `${progress.toFixed(1)}% complete`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function ShippingDataPage() {
  const [ownership, setOwnership] = useState<OwnershipFilter>('all');
  const [inventory, setInventory] = useState<ShipInventoryRow[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Vessel['status']>('All');
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedMmsi, setSelectedMmsi] = useState<string | null>(null);
  const [trackQuery, setTrackQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShippingData(signal);
      if (signal?.aborted) return;
      setVessels(data);
      setLastUpdated(new Date());
      setSelectedMmsi((prev) => {
        if (prev && data.some((v) => v.mmsi === prev)) return prev;
        return null;
      });
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load shipping data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  // Inventory is the source of truth for `my_ship`; the live feed has no such flag.
  useEffect(() => {
    const controller = new AbortController();
    setInvLoading(true);
    setInvError(null);
    fetchShipInventory(controller.signal)
      .then((rows) => setInventory(rows))
      .catch((err) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setInvError(err instanceof Error ? err.message : 'Failed to load ship inventory');
      })
      .finally(() => {
        if (!controller.signal.aborted) setInvLoading(false);
      });
    return () => controller.abort();
  }, []);

  const myShipIds = useMemo(
    () => new Set(inventory.filter((r) => r.my_ship === true).map((r) => r.ship_id)),
    [inventory]
  );

  const isMine = useCallback((v: Vessel) => v.ship_id != null && myShipIds.has(v.ship_id), [myShipIds]);

  const ownershipCounts = useMemo(() => {
    // Counted from the full (all pages) inventory API, so they match the table.
    const my = inventory.filter((r) => r.my_ship === true).length;
    return { all: inventory.length, my, global: inventory.length - my } as Record<OwnershipFilter, number>;
  }, [inventory]);

  const scopedVessels = useMemo(() => {
    if (ownership === 'all') return vessels;
    return vessels.filter((v) => (ownership === 'my' ? isMine(v) : !isMine(v)));
  }, [vessels, ownership, isMine]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedVessels.filter((v) => {
      const matchesQuery =
        !q ||
        v.vessel_name.toLowerCase().includes(q) ||
        v.imo.includes(q) ||
        v.mmsi.includes(q) ||
        v.callsign.toLowerCase().includes(q) ||
        v.voyage_arrival_port_name.toLowerCase().includes(q) ||
        v.voyage_departure_port_name.toLowerCase().includes(q) ||
        v.vessel_country.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [scopedVessels, query, statusFilter]);

  const selected = useMemo(
    () => vessels.find((v) => v.mmsi === selectedMmsi) ?? null,
    [vessels, selectedMmsi]
  );

  const trackResults = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    const list = q
      ? scopedVessels.filter(
          (v) =>
            v.vessel_name.toLowerCase().includes(q) ||
            v.imo.includes(q) ||
            v.mmsi.includes(q) ||
            v.callsign.toLowerCase().includes(q)
        )
      : scopedVessels;
    return list.slice(0, 50);
  }, [scopedVessels, trackQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Underway: 0, 'At Anchor': 0, Moored: 0, 'In Port': 0 };
    for (const v of scopedVessels) counts[v.status] = (counts[v.status] ?? 0) + 1;
    return counts;
  }, [scopedVessels]);

  return (
    <div style={{ width: '95%', margin: '0 auto', padding: '32px 0', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Shipping Data</h1>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
            Live vessel positions and voyage intelligence across global shipping lanes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
            Tracking <strong style={{ color: 'var(--white)' }}>{scopedVessels.length}</strong> vessels
          </span>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: 'var(--gray-dim)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadData()}
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
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: error ? 'rgba(239,68,68,0.15)' : 'var(--green-dim)',
              color: error ? '#ef4444' : 'var(--green)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: error ? '#ef4444' : 'var(--green)',
              }}
            />
            {error ? 'OFFLINE' : 'LIVE'}
          </span>
        </div>
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
          Unable to load shipping data: {error}
        </div>
      )}

      {/* Ownership filter: All / My / Global */}
      <div className="own-seg" role="tablist" aria-label="Ship ownership filter" style={{ marginBottom: '20px' }}>
        {OWNERSHIP_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={ownership === o.id}
            className={`own-seg-btn${ownership === o.id ? ' active' : ''}`}
            onClick={() => setOwnership(o.id)}
          >
            {o.label}
            <span className="own-seg-count">{invLoading ? '…' : ownershipCounts[o.id]}</span>
          </button>
        ))}
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {([
          { label: 'Underway', value: statusCounts.Underway, color: '#4895ef' },
          { label: 'At Anchor', value: statusCounts['At Anchor'], color: '#f4a261' },
          { label: 'Moored', value: statusCounts.Moored, color: '#2ec4b6' },
          { label: 'In Port', value: statusCounts['In Port'], color: '#06d6a0' },
        ] as const).map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${s.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.color,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M12 2 L18 20 L12 16 L6 20 Z" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar + status filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by vessel, IMO, MMSI, callsign, port or country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 40px',
              background: 'var(--navy-light)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '14px',
              color: 'var(--white)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | Vessel['status'])}
          style={{
            padding: '12px 14px',
            background: 'var(--navy-light)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            color: 'var(--white)',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '160px',
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Underway">Underway</option>
          <option value="At Anchor">At Anchor</option>
          <option value="Moored">Moored</option>
          <option value="In Port">In Port</option>
        </select>
      </div>

      {/* Map + vessel detail */}
      <div className="rsp-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 24%, 380px)', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
            height: '540px',
          }}
        >
          <ShipMap vessels={filtered} selectedMmsi={selectedMmsi} onSelect={setSelectedMmsi} />
        </div>
            {selected ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            height: '540px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => setSelectedMmsi(null)}
            style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '8px' }}
          >
            ← Search another ship
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{selected.vessel_name}</h2>
              <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '2px' }}>
                IMO {selected.imo} · MMSI {selected.mmsi}
              </div>
            </div>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: `${colorForStatus(selected.status)}22`,
                color: colorForStatus(selected.status),
              }}
            >
              {selected.navigational_status}
            </span>
          </div>

          {/* Voyage */}
          <CompactHeading>Voyage</CompactHeading>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
            <span>{selected.voyage_departure_port_name}</span>
            <span style={{ color: 'var(--gray)' }}>→</span>
            <span style={{ textAlign: 'right' }}>{selected.voyage_arrival_port_name}</span>
          </div>
          <style>{`@keyframes liveBlink { 0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.8); } }`}</style>
          {(() => {
            const pct = Math.min(100, Math.max(0, selected.voyage_progress));
            const color = pct >= 100 ? '#06d6a0' : '#4895ef';
            return (
              <div style={{ position: 'relative', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '10px 0 6px' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: color }} />
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill={color}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'liveBlink 1.2s ease-in-out infinite',
                    filter: `drop-shadow(0 0 3px ${color})`,
                  }}
                >
                  <path d="M4 4 L20 12 L4 20 L8 12 Z" />
                </svg>
              </div>
            );
          })()}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray)', marginBottom: '6px' }}>
            <span>{Math.round(selected.voyage_progress * 10) / 10}% complete</span>
            <span>{selected.voyage_arrival_label} {formatUtc(selected.voyage_arrival_label === 'ATA' ? selected.voyage_arrival_utc : selected.voyage_eta_utc)}</span>
          </div>
          {selected.voyage_distance_to_go != null && <KV label="Distance to go" value={`${selected.voyage_distance_to_go} nm`} />}
          <KV label="Load condition" value={selected.voyage_load_condition} />

          {/* Position */}
          <CompactHeading>Position</CompactHeading>
          <KV label="Area" value={`${selected.current_area} (${selected.area_code})`} />
          <KV label="Updated (UTC)" value={formatUtc(selected.position_position_utc)} />
          <KV label="AIS source" value={selected.position_station_type} />

          {/* Particulars */}
          <CompactHeading>Particulars</CompactHeading>
          <KV label="Type" value={selected.vessel_subtype || selected.vessel_type} />
          <KV label="Flag" value={`${selected.vessel_country} (${selected.flag})`} />
          <KV label="Callsign" value={selected.callsign} />
          <KV label="Market" value={selected.market_name} />
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            height: '540px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--gray)',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>Track a ship</div>
          <div style={{ fontSize: '12px', marginBottom: '12px' }}>
            {loading ? 'Loading vessel data…' : 'Please select a ship to track.'}
          </div>
          <input
            type="text"
            placeholder="Search ship by name, IMO, MMSI…"
            value={trackQuery}
            onChange={(e) => setTrackQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--navy-light)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'var(--white)',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '10px',
            }}
          />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {trackResults.map((v) => (
              <button
                key={v.mmsi}
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('All');
                  setSelectedMmsi(v.mmsi);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--white)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{v.vessel_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                  IMO {v.imo} · {v.vessel_subtype || v.vessel_type}
                </div>
              </button>
            ))}
            {!loading && trackResults.length === 0 && (
              <div style={{ fontSize: '12px', padding: '12px 4px' }}>No ships found.</div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ── Ship Inventory Table ─────────────────────────────────── */}
      <ShipInventoryTable
        rows={inventory}
        loading={invLoading}
        error={invError}
        ownership={ownership}
        selectedShipId={selected?.ship_id ?? null}
        onSelectShip={(shipId) => {
          const vessel = vessels.find((v) => v.ship_id === shipId);
          if (!vessel) return;
          // Make sure the vessel isn't hidden by the map filters, then bring the cards into view.
          setQuery('');
          setStatusFilter('All');
          setSelectedMmsi(vessel.mmsi);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
