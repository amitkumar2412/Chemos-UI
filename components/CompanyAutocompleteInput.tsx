'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface CompanyAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}


type SearchResult = { displayName?: string; companyName?: string };

function normaliseResults(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      const r = item as SearchResult;
      return r.displayName ?? r.companyName ?? '';
    }).filter(Boolean);
  }
  const obj = raw as Record<string, unknown>;
  const arr = obj?.companies ?? obj?.data ?? obj?.results ?? [];
  return normaliseResults(arr);
}

export default function CompanyAutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
}: CompanyAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const justSelectedRef = useRef(false);
  const isFocusedRef = useRef(false);

  const search = useCallback(async (query: string) => {
    if (!query || typeof query !== 'string' || !query.trim()) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await apiClient.get('/companies/search', { params: { query: query.trim() } });
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
    if (!isFocusedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  const handleInput = (newVal: string) => {
    onChange(newVal);
    setError('');
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    if (value && typeof value === 'string' && value.trim()) search(value);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setTimeout(() => setShowList(false), 150);
  };

  const handlePick = (val: string) => {
    justSelectedRef.current = true;
    onChange(val);
    setShowList(false);
    setHighlight(-1);
  };

  const handleCreate = async () => {
    const name = value && typeof value === 'string' ? value.trim() : '';
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const raw = await apiClient.post('/companies/create-company', { companyName: name });
      const created = raw as Record<string, unknown>;
      const createdName = (created?.companyName ?? created?.company_name ?? name) as string;
      onChange(createdName);
      setShowList(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const exactMatch = suggestions.some(
    (s) => value && typeof value === 'string' && s.toLowerCase() === value.trim().toLowerCase()
  );
  const showCreate = value && typeof value === 'string' && value.trim().length > 0 && !exactMatch && !loading;

  const allItems = suggestions;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    const total = allItems.length + (showCreate ? 1 : 0);
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(total - 1, h + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < allItems.length) {
        handlePick(allItems[highlight]);
      } else if (highlight === allItems.length && showCreate) {
        handleCreate();
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  };

  const renderHighlighted = (opt: string) => {
    const q = value && typeof value === 'string' ? value.trim().toLowerCase() : '';
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
        onChange={(e) => handleInput(e.target.value)}
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
          {!loading && allItems.map((opt, i) => (
            <div
              key={opt}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt)}
            </div>
          ))}
          {!loading && allItems.length === 0 && !showCreate && (
            <div className="ac-item" style={{ color: 'var(--muted, #888)', cursor: 'default' }}>
              No results
            </div>
          )}
          {showCreate && (
            <div
              className={`ac-item${highlight === allItems.length ? ' highlight' : ''}`}
              style={{ borderTop: allItems.length ? '1px solid var(--border)' : undefined, fontStyle: 'italic' }}
              onMouseDown={creating ? undefined : handleCreate}
            >
              {creating ? 'Creating…' : (
                <>+ Add &ldquo;<strong>{value.trim()}</strong>&rdquo; as new company</>
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
