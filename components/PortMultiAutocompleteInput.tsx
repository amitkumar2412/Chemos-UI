'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface PortMultiAutocompleteInputProps {
  value: string[];
  onChange: (value: string[]) => void;
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

export default function PortMultiAutocompleteInput({
  value,
  onChange,
  placeholder,
}: PortMultiAutocompleteInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await apiClient.get('/ports/suggestions', {
        params: { query: q.trim(), page: 0, size: 10 },
      });
      const results = normaliseResults(raw).filter((r) => !value.includes(r));
      setSuggestions(results);
      setShowList(true);
      setHighlight(-1);
    } catch {
      setSuggestions([]);
      setShowList(true);
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const addPort = (port: string) => {
    if (!value.includes(port)) onChange([...value, port]);
    setQuery('');
    setSuggestions([]);
    setShowList(false);
    setHighlight(-1);
    inputRef.current?.focus();
  };

  const removePort = (port: string) => {
    onChange(value.filter((p) => p !== port));
  };

  const handleCreate = async () => {
    const name = query && typeof query === 'string' ? query.trim() : '';
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const raw = await apiClient.post('/ports/createPort', { portName: name });
      const created = raw as Record<string, unknown>;
      const createdName = (created?.displayName ?? created?.portName ?? name) as string;
      addPort(createdName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create port');
    } finally {
      setCreating(false);
    }
  };

  const exactMatch = suggestions.some(
    (s) => query && typeof query === 'string' && s.toLowerCase() === query.trim().toLowerCase()
  ) || value.some((s) => query && typeof query === 'string' && s.toLowerCase() === query.trim().toLowerCase());
  const showCreate = query && typeof query === 'string' && query.trim().length > 0 && !exactMatch && !loading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !query && value.length > 0) {
      removePort(value[value.length - 1]);
      return;
    }
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
        addPort(suggestions[highlight]);
      } else if (highlight === suggestions.length && showCreate) {
        handleCreate();
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  };

  const renderHighlighted = (opt: string) => {
    const q = query && typeof query === 'string' ? query.trim().toLowerCase() : '';
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
      {/* Chips + input box */}
      <div
        className="fi"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          minHeight: '38px',
          height: 'auto',
          cursor: 'text',
          paddingTop: value.length ? '5px' : undefined,
          paddingBottom: value.length ? '5px' : undefined,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((p) => (
          <span
            key={p}
            style={{
              background: 'var(--accent, #3b82f6)',
              color: '#fff',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            {p}
            <span
              onMouseDown={(e) => { e.preventDefault(); removePort(p); }}
              style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}
            >
              ×
            </span>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          autoComplete="off"
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={(e) => { setQuery(e.target.value); setError(''); }}
          onFocus={() => { if (suggestions.length > 0 || (query && typeof query === 'string' && query.trim())) setShowList(true); }}
          onBlur={() => setTimeout(() => setShowList(false), 150)}
          onKeyDown={handleKeyDown}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            flex: 1,
            minWidth: '120px',
            fontSize: 'inherit',
            padding: 0,
          }}
        />
      </div>

      {/* Dropdown */}
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
              onMouseDown={() => addPort(opt)}
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
                <>+ Add &ldquo;<strong>{query.trim()}</strong>&rdquo; as new port</>
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
