'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface PortAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (id: string, displayName: string) => void;
  placeholder?: string;
}

type PortResult = { 
  id?: string | number; 
  portId?: string | number;
  code?: string;
  portCode?: string;
  displayName?: string; 
  portName?: string; 
  name?: string;
};

type PortOption = { id: string; displayName: string };

function normaliseResults(raw: unknown): PortOption[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return { id: '', displayName: item };
      const r = item as PortResult;
      const displayName = r.displayName ?? r.portName ?? r.name ?? '';
      const id = String(r.id ?? r.portId ?? r.code ?? r.portCode ?? '');
      return { id, displayName };
    }).filter(opt => opt.displayName);
  }
  const obj = raw as Record<string, unknown>;
  const arr = obj?.content ?? obj?.data ?? obj?.results ?? [];
  return normaliseResults(arr);
}

export default function PortAutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
}: PortAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PortOption[]>([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);
  const isFocusedRef = useRef(false);
  const [selectedValid, setSelectedValid] = useState(() => !!(value && value.trim()));

  const search = useCallback(async (query: string) => {
    if (!query || typeof query !== 'string' || !query.trim()) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    setLoading(true);
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
    setTimeout(() => {
      setShowList(false);
      if (!selectedValid && value && typeof value === 'string' && value.trim()) {
        onChange('');
        if (onSelect) onSelect('', '');
      }
    }, 150);
  };

  const handlePick = (opt: PortOption) => {
    justSelectedRef.current = true;
    setSelectedValid(true);
    onChange(opt.displayName);
    if (onSelect && opt.id) {
      onSelect(opt.id, opt.displayName);
    }
    setShowList(false);
    setHighlight(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    const total = suggestions.length;
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(total - 1, h + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < suggestions.length) {
        handlePick(suggestions[highlight]);
      }
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
        onChange={(e) => { setSelectedValid(false); onChange(e.target.value); }}
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
              key={opt.id || opt.displayName}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt.displayName)}
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
