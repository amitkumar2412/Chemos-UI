'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface VesselOption {
  id: string;
  vesselName: string;
}

interface VesselAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (vessel: VesselOption) => void;
  placeholder?: string;
}

const PAGE_SIZE = 10;

function normaliseResults(raw: unknown): VesselOption[] {
  const obj = raw as Record<string, unknown> | null;
  const arr = Array.isArray(raw) ? raw : (obj?.data ?? obj?.content ?? obj?.results ?? []);
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: VesselOption[] = [];
  for (const item of arr) {
    const r = (item ?? {}) as Record<string, unknown>;
    const name = typeof r.vessel_name === 'string' ? r.vessel_name.trim() : '';
    if (!name) continue;
    const key = String(r.id ?? name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: key, vesselName: name });
  }
  return out;
}

export default function VesselAutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
}: VesselAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<VesselOption[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);
  const isFocusedRef = useRef(false);
  const requestIdRef = useRef(0); // ignore out-of-order responses

  const search = useCallback(async (query: string) => {
    const q = typeof query === 'string' ? query.trim() : '';
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(false);
    setShowList(true);
    try {
      // No query → plain list endpoint; otherwise search endpoint.
      const raw = await apiClient.get('/ships', {
        params: q ? { q, limit: PAGE_SIZE } : { limit: PAGE_SIZE },
      });
      if (reqId !== requestIdRef.current) return;
      setSuggestions(normaliseResults(raw));
      setHighlight(-1);
    } catch {
      if (reqId !== requestIdRef.current) return;
      setSuggestions([]);
      setError(true);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (!isFocusedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  const closeList = () => {
    requestIdRef.current++; // drop any in-flight response
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(false);
    setShowList(false);
    setHighlight(-1);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    search(value);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setTimeout(closeList, 150);
  };

  const handlePick = (opt: VesselOption) => {
    justSelectedRef.current = true;
    onChange(opt.vesselName);
    onSelect?.(opt);
    closeList();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlight >= 0 && suggestions[highlight]) {
      handlePick(suggestions[highlight]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      closeList();
    }
  };

  const renderHighlighted = (opt: string) => {
    const q = value && typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!q) return opt;
    const idx = opt.toLowerCase().indexOf(q);
    if (idx === -1) return opt;
    return (
      <>
        {opt.slice(0, idx)}
        <span className="match">{opt.slice(idx, idx + q.length)}</span>
        {opt.slice(idx + q.length)}
      </>
    );
  };

  const muted = { color: 'var(--muted, #888)', cursor: 'default' } as const;

  return (
    <div className="ac-wrap">
      <input
        id={id}
        className="fi"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <div className="ac-list">
          {loading && <div className="ac-item" style={muted}>Searching…</div>}
          {!loading && error && <div className="ac-item" style={muted}>Could not load vessels</div>}
          {!loading && !error && suggestions.map((opt, i) => (
            <div
              key={opt.id}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt.vesselName)}
            </div>
          ))}
          {!loading && !error && suggestions.length === 0 && (
            <div className="ac-item" style={muted}>No vessels found</div>
          )}
        </div>
      )}
    </div>
  );
}
