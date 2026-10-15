'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { colorForStatus, type Vessel } from './data';
import { fetchShippingData } from './api';
import { formatUtc } from './format';

const ShipMap = dynamic(() => import('./_components/ShipMap'), { ssr: false });
const ShipInventoryTable = dynamic(() => import('./_components/ShipInventoryTable'), { ssr: false });

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'start', marginBottom: '20px' }}>
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
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Vessel['status']>('All');
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedMmsi, setSelectedMmsi] = useState<string | null>(null);
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
        return data[0]?.mmsi ?? null;
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vessels.filter((v) => {
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
  }, [vessels, query, statusFilter]);

  const selected = useMemo(
    () => vessels.find((v) => v.mmsi === selectedMmsi) ?? null,
    [vessels, selectedMmsi]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Underway: 0, 'At Anchor': 0, Moored: 0, 'In Port': 0 };
    for (const v of vessels) counts[v.status] = (counts[v.status] ?? 0) + 1;
    return counts;
  }, [vessels]);

  return (
    <div style={{ padding: '32px', maxWidth: '1600px' }}>
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
            Tracking <strong style={{ color: 'var(--white)' }}>{vessels.length}</strong> vessels
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

      {/* Map + fleet list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '16px', marginBottom: '24px' }}>
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
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px',
            height: '540px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--white)' }}>
              Fleet
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              {filtered.length} of {vessels.length}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--gray)', fontSize: '13px' }}>
                {loading
                  ? 'Loading vessels…'
                  : vessels.length === 0
                  ? 'No vessels returned from the shipping API.'
                  : 'No vessels match your filters.'}
              </div>
            )}
            {filtered.map((v) => {
              const active = v.mmsi === selectedMmsi;
              return (
                <button
                  key={v.mmsi}
                  onClick={() => setSelectedMmsi(v.mmsi)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: active ? 'var(--blue-dim)' : 'var(--navy-light)',
                    border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    color: 'var(--white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{v.vessel_name}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: `${colorForStatus(v.status)}22`,
                        color: colorForStatus(v.status),
                      }}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                    {v.vessel_subtype} · {v.flag}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-dim)' }}>
                    {v.voyage_departure_port_name} → {v.voyage_arrival_port_name} · {v.speed_kn} kn
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Vessel Detail Dashboard ───────────────────────────────── */}
      {selected ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Vessel header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                Vessel Tracking
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{selected.vessel_name}</h2>
              <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                IMO {selected.imo} · MMSI {selected.mmsi} · {selected.callsign}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: `${colorForStatus(selected.status)}22`,
                  color: colorForStatus(selected.status),
                }}
              >
                {selected.navigational_status}
              </span>
            </div>
          </div>

          {/* Summary strips */}
          {selected.vessel_summary_position && (
            <div
              style={{
                background: 'var(--navy-light)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '12px',
                color: 'var(--gray)',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              {renderBold(selected.vessel_summary_position)}
            </div>
          )}
          {selected.vessel_summary_particulars && (
            <div
              style={{
                background: 'var(--navy-light)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '22px',
                color: 'var(--gray)',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              {renderBold(selected.vessel_summary_particulars)}
            </div>
          )}

          {/* ── Section A: Voyage Route ───────────────────────────── */}
          <SectionHeading>Voyage Route</SectionHeading>
          <VoyageRoute vessel={selected} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <InfoCard label="ETA (UTC)" value={formatUtc(selected.voyage_eta_utc)} />
            <InfoCard
              label="ETA Timezone"
              value={selected.voyage_eta_timezone !== 0 ? `UTC${selected.voyage_eta_timezone > 0 ? '+' : ''}${selected.voyage_eta_timezone}` : 'UTC'}
            />
            <InfoCard label="Reported Destination" value={selected.voyage_reported_destination} />
            <InfoCard label="Load Condition" value={selected.voyage_load_condition} />
            {selected.voyage_distance_travelled != null && (
              <InfoCard label="Distance Travelled" value={`${selected.voyage_distance_travelled} nm`} />
            )}
            {selected.voyage_distance_to_go != null && (
              <InfoCard label="Distance To Go" value={`${selected.voyage_distance_to_go} nm`} />
            )}
          </div>

          {/* ── Section B: Live Position ──────────────────────────── */}
          <SectionHeading>Live Position</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <InfoCard label="Current Area" value={`${selected.current_area} (${selected.area_code})`} />
            <InfoCard label="Position (UTC)" value={formatUtc(selected.position_position_utc)} />
            <InfoCard
              label="Vessel Local Time"
              value={new Date(selected.position_vessel_local_time).toLocaleString()}
            />
            <InfoCard
              label="Timezone"
              value={selected.position_timezone !== 0 ? `UTC${selected.position_timezone > 0 ? '+' : ''}${selected.position_timezone}` : 'UTC'}
            />
            <InfoCard label="AIS Source" value={selected.position_station_type} />
          </div>

          {/* ── Section C: Vessel Particulars ─────────────────────── */}
          <SectionHeading>Vessel Particulars</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <InfoCard label="Type" value={selected.vessel_type} />
            <InfoCard label="Subtype" value={selected.vessel_subtype} />
            <InfoCard label="Flag" value={`${selected.vessel_country} (${selected.flag})`} />
            <InfoCard label="Callsign" value={selected.callsign} />
            <InfoCard label="Market" value={selected.market_name} />
          </div>

          {/* ── Section D: Tracking History ───────────────────────── */}
          <SectionHeading>Tracking History</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <InfoCard label="Vessel First Seen" value={formatUtc(selected.vessel_first_seen_at)} />
            <InfoCard label="Vessel Last Updated" value={formatUtc(selected.vessel_updated_at)} />
            <InfoCard label="Voyage First Seen" value={formatUtc(selected.voyage_first_seen_at)} />
            <InfoCard label="Voyage Last Seen" value={formatUtc(selected.voyage_last_seen_at)} />
            <InfoCard label="Position Scraped At" value={formatUtc(selected.position_scraped_at)} />
            <InfoCard label="Last Synced" value={formatUtc(selected.synced_at)} />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '2px dashed var(--border)',
            borderRadius: '14px',
            padding: '48px',
            marginBottom: '24px',
            textAlign: 'center',
            color: 'var(--gray)',
            fontSize: '14px',
          }}
        >
          {loading ? 'Loading vessel data…' : 'Select a vessel to see detailed voyage information.'}
        </div>
      )}

      {/* ── Ship Inventory Table ─────────────────────────────────── */}
      <ShipInventoryTable />
    </div>
  );
}
