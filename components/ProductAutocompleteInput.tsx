'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface ProductAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ProductResult = { displayName?: string; productName?: string; name?: string; product_name?: string };

function normaliseResults(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      const r = item as ProductResult;
      return r.displayName ?? r.productName ?? r.name ?? r.product_name ?? '';
    }).filter(Boolean);
  }
  const obj = raw as Record<string, unknown>;
  const arr = obj?.content ?? obj?.products ?? obj?.data ?? obj?.results ?? [];
  return normaliseResults(arr);
}

export default function ProductAutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
}: ProductAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await apiClient.get('/products/search', {
        params: { query: query.trim(), page: 0, size: 20 },
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
              key={opt}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt)}
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
