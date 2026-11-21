'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** Called with the trimmed text after the user pauses typing (and once on mount). */
  onSearch: (q: string) => void;
  placeholder?: string;
  delayMs?: number;
}

export default function SearchBox({ onSearch, placeholder = 'Search…', delayMs = 350 }: Props) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => onSearch(value.trim()), delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '640px',
        marginBottom: '20px',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={focused ? 'var(--blue)' : 'var(--gray)'}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label="Search"
        style={{
          width: '100%',
          height: '52px',
          padding: '0 44px 0 48px',
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--text)',
          background: 'var(--card)',
          border: `2px solid ${focused ? 'var(--blue)' : 'color-mix(in srgb, var(--gray) 55%, transparent)'}`,
          borderRadius: '12px',
          outline: 'none',
          boxShadow: focused
            ? '0 0 0 4px rgba(66, 153, 225, 0.2), 0 4px 14px rgba(0, 0, 0, 0.08)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />

      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '50%',
            background: 'var(--navy-light)',
            color: 'var(--gray)',
            fontSize: '18px',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
