'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface SalespersonAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (id: string, name: string) => void;
  placeholder?: string;
}

type SearchResult = { id?: string | number; name?: string; salesPersonName?: string; salespersonName?: string; fullName?: string; displayName?: string };

type SalespersonOption = { id: string; name: string };

function normaliseResults(raw: unknown): SalespersonOption[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return { id: '', name: item };
      const r = item as SearchResult;
      const name = r.name ?? r.salesPersonName ?? r.salespersonName ?? r.fullName ?? r.displayName ?? '';
      const id = String(r.id ?? '');
      return { id, name };
    }).filter(opt => opt.name);
  }
  const obj = raw as Record<string, unknown>;
  const arr = obj?.salespersons ?? obj?.content ?? obj?.data ?? obj?.results ?? [];
  return normaliseResults(arr);
}

export default function SalespersonAutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
}: SalespersonAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<SalespersonOption[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
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
    try {
      const raw = await apiClient.get('/salespersons/suggestions', { params: { query: query.trim() } });
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

  const handleFocus = () => {
    isFocusedRef.current = true;
    if (value && typeof value === 'string' && value.trim()) search(value);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setTimeout(() => setShowList(false), 150);
  };

  const handlePick = (opt: SalespersonOption) => {
    justSelectedRef.current = true;
    onChange(opt.name);
    if (onSelect && opt.id) {
      onSelect(opt.id, opt.name);
    }
    setShowList(false);
    setHighlight(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlight >= 0) {
      handlePick(suggestions[highlight]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  };

  const renderHighlighted = (text: string) => {
    const q = value && typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!q) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="match">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
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
        onChange={(e) => onChange(e.target.value)}
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
              key={opt.id || opt.name}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt.name)}
            </div>
          ))}
          {!loading && suggestions.length === 0 && (
            <div className="ac-item" style={{ color: 'var(--muted, #888)', cursor: 'default' }}>
              No results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
