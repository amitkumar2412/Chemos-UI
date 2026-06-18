'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface PortAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type PortResult = { displayName?: string; portName?: string; name?: string };

function normaliseResults(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      const r = item as PortResult;
      return r.displayName ?? r.portName ?? r.name ?? '';
    }).filter(Boolean);
  }
  const obj = raw as Record<string, unknown>;
  const arr = obj?.content ?? obj?.data ?? obj?.results ?? [];
  return normaliseResults(arr);
}

export default function PortAutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
}: PortAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await apiClient.get('/ports/suggestions', {
        params: { query: query.trim(), page: 0, size: 10 },
      });
      const results = normaliseResults(raw);
      setSuggestions(results);
      setShowList(true);
      setHighlight(-1);
    } catch {
      setSuggestions([]);
      setShowList(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  const handleFocus = () => {
    if (value.trim() && suggestions.length > 0) setShowList(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowList(false), 150);
  };

  const handlePick = (val: string) => {
    justSelectedRef.current = true;
    onChange(val);
    setShowList(false);
    setHighlight(-1);
  };

  const handleCreate = async () => {
    const name = value.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const raw = await apiClient.post('/ports/createPort', { portName: name });
      const created = raw as Record<string, unknown>;
      const createdName = (created?.displayName ?? created?.portName ?? name) as string;
      onChange(createdName);
      setShowList(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create port');
    } finally {
      setCreating(false);
    }
  };

  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === value.trim().toLowerCase()
  );
  const showCreate = value.trim().length > 0 && !exactMatch && !loading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    const total = suggestions.length + (showCreate ? 1 : 0);
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(total - 1, h + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < suggestions.length) {
        handlePick(suggestions[highlight]);
      } else if (highlight === suggestions.length && showCreate) {
        handleCreate();
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  };

  const renderHighlighted = (opt: string) => {
    const q = value.trim().toLowerCase();
    if (!q) return opt;
    const lower = opt.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return opt;
    return (
      <>
        {opt.slice(0, idx)}
        <span className="match">{opt.slice(idx, idx + q.length)}</span>
        {opt.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="ac-wrap">
      <input
        id={id}
        className="fi"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setError(''); }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <div className="ac-list">
          {loading && (
            <div className="ac-item" style={{ color: 'var(--muted, #888)', cursor: 'default' }}>
              Searching…
            </div>
          )}
          {!loading && suggestions.map((opt, i) => (
            <div
              key={opt}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt)}
            </div>
          ))}
          {!loading && suggestions.length === 0 && !showCreate && (
            <div className="ac-item" style={{ color: 'var(--muted, #888)', cursor: 'default' }}>
              No results
            </div>
          )}
          {showCreate && (
            <div
              className={`ac-item${highlight === suggestions.length ? ' highlight' : ''}`}
              style={{ borderTop: suggestions.length ? '1px solid var(--border)' : undefined, fontStyle: 'italic' }}
              onMouseDown={creating ? undefined : handleCreate}
            >
              {creating ? 'Creating…' : (
                <>+ Add &ldquo;<strong>{value.trim()}</strong>&rdquo; as new port</>
              )}
            </div>
          )}
        </div>
      )}
      {error && (
        <div style={{ fontSize: '11px', color: 'var(--danger, #dc2626)', marginTop: '2px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
