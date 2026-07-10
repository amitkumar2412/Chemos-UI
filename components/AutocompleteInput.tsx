'use client';

import { useState, useCallback } from 'react';

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export default function AutocompleteInput({
  id,
  value,
  onChange,
  options,
  placeholder,
}: AutocompleteInputProps) {
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [filtered, setFiltered] = useState<string[]>([]);

  const getFiltered = useCallback(
    (q: string) => {
      if (!q) return options.slice(0, 8);
      const lower = q.toLowerCase();
      const prefix = options.filter((s) => s.toLowerCase().startsWith(lower));
      const substr = options.filter(
        (s) => !s.toLowerCase().startsWith(lower) && s.toLowerCase().includes(lower)
      );
      return [...prefix, ...substr].slice(0, 8);
    },
    [options]
  );

  const handleInput = (newVal: string) => {
    onChange(newVal);
    const opts = getFiltered(newVal.trim());
    setFiltered(opts);
    setHighlight(-1);
    setShowList(opts.length > 0);
  };

  const handleFocus = () => {
    if (!value || typeof value !== 'string' || !value.trim()) return;
    const opts = getFiltered(value.trim());
    setFiltered(opts);
    setShowList(opts.length > 0);
  };

  const handleBlur = () => {
    setTimeout(() => setShowList(false), 150);
  };

  const handlePick = (val: string) => {
    onChange(val);
    setShowList(false);
    setHighlight(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlight >= 0) {
      handlePick(filtered[highlight]);
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
      {showList && filtered.length > 0 && (
        <div className="ac-list">
          {filtered.map((opt, i) => (
            <div
              key={opt}
              className={`ac-item${i === highlight ? ' highlight' : ''}`}
              onMouseDown={() => handlePick(opt)}
            >
              {renderHighlighted(opt)}
              {!value.trim() && i === 0 && (
                <span className="hint">most used</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
