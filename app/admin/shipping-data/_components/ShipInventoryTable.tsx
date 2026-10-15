'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchShipInventory, searchShipInventory, type ShipInventoryRow } from '../inventoryApi';
import { formatUtc } from '../format';

type SortKey = 'vessel_name' | 'voyage_departure_port_name' | 'voyage_arrival_port_name' | 'voyage_eta_utc' | 'vessel_type' | 'vessel_subtype' | 'vessel_updated_at';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function departureBadgeColor(label: string | null) {
  return label === 'ATD' ? { bg: 'rgba(6,214,160,0.15)', fg: '#06d6a0' } : { bg: 'rgba(72,149,239,0.15)', fg: '#4895ef' };
}

export default function ShipInventoryTable() {
  const [rows, setRows] = useState<ShipInventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ShipInventoryRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [sortCol, setSortCol] = useState<SortKey>('vessel_name');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(0);

  // Initial load of the full inventory (shown when there's no active search).
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchShipInventory(controller.signal)
      .then((data) => setRows(data))
      .catch((err) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load ship inventory');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Debounce the raw input before hitting the search API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // GET /ship-inventory/search?q=... — only called once the user has typed something.
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults(null);
      setSearchError(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);
    searchShipInventory(debouncedSearch, controller.signal)
      .then((data) => setSearchResults(data))
      .catch((err) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setSearchError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    return () => controller.abort();
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const isSearchActive = debouncedSearch.length > 0;
  const baseRows = isSearchActive ? searchResults ?? [] : rows;

  const filtered = useMemo(() => {
    return [...baseRows].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [baseRows, sortCol, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortCol(col);
      setSortDir(1);
    }
    setPage(0);
  };

  const columns: [SortKey, string][] = [
    ['vessel_name', 'Vessel Name'],
    ['voyage_departure_port_name', 'From'],
    ['voyage_arrival_port_name', 'To'],
    ['voyage_eta_utc', 'ETA (UTC)'],
    ['vessel_type', 'Type'],
    ['vessel_subtype', 'Subtype'],
    ['vessel_updated_at', 'Vessel Last Updated'],
  ];

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--white)' }}>
            Ship Inventory
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
            {loading && !isSearchActive
              ? 'Loading…'
              : searching
              ? 'Searching…'
              : isSearchActive
              ? `${filtered.length} matches for "${debouncedSearch}"`
              : `${filtered.length} of ${rows.length} vessels`}
          </div>
        </div>
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="14"
            height="14"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search vessel, port, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              background: 'var(--navy-light)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--white)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {error && !isSearchActive && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: '13px',
          }}
        >
          Unable to load ship inventory: {error}
        </div>
      )}

      {searchError && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: '13px',
          }}
        >
          Search failed: {searchError}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr>
              {columns.map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => toggleSort(col)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--gray)',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                  {sortCol === col && <span style={{ marginLeft: '4px', opacity: 0.6 }}>{sortDir === 1 ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => {
              const badge = departureBadgeColor(row.voyage_departure_label);
              return (
                <tr key={row.ship_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--white)' }}>
                    {row.vessel_name ?? '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--white)' }}>
                    <div>{row.voyage_departure_port_name ?? '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--gray-dim)' }}>{formatUtc(row.voyage_departure_utc)}</span>
                      {row.voyage_departure_label && (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.fg,
                          }}
                        >
                          {row.voyage_departure_label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--white)' }}>{row.voyage_arrival_port_name ?? '—'}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--gray)' }}>{formatUtc(row.voyage_eta_utc)}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--gray)' }}>{row.vessel_type ?? '—'}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--gray)' }}>{row.vessel_subtype ?? '—'}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--gray)' }}>{formatUtc(row.vessel_updated_at)}</td>
                </tr>
              );
            })}
            {!loading && !searching && paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-dim)', fontSize: '13px' }}>
                  {isSearchActive
                    ? `No ships match "${debouncedSearch}".`
                    : rows.length === 0
                    ? 'No ships returned from the inventory API.'
                    : 'No ships to show.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--navy-light)',
              border: '1px solid var(--border)',
              color: 'var(--white)',
              fontSize: '12px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 0 ? 0.5 : 1,
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--navy-light)',
              border: '1px solid var(--border)',
              color: 'var(--white)',
              fontSize: '12px',
              cursor: currentPage >= pageCount - 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage >= pageCount - 1 ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
