'use client';

import { useMemo, useState } from 'react';
import EmailSystemTabs from '../_components/EmailSystemTabs';
import { CHEMICALS, CHEMICAL_CATEGORIES } from '../data';

export default function ChemicalsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHEMICALS.filter((c) => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q);
      const matchesCategory = category === 'All' || c.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Chemical catalog used when building campaign offers.</p>
      </div>

      <EmailSystemTabs />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search chemicals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: '1 1 260px', padding: '10px 14px', background: 'var(--navy-light)', border: '1px solid var(--border)',
            borderRadius: '8px', fontSize: '14px', color: 'var(--white)', outline: 'none',
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '10px 14px', background: 'var(--navy-light)', border: '1px solid var(--border)',
            borderRadius: '8px', fontSize: '14px', color: 'var(--white)', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="All">All Categories</option>
          {CHEMICAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
        {filtered.length} of {CHEMICALS.length} chemicals
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '640px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                {['Chemical', 'Category', 'Grade', 'Packing', 'Ref. Price (₹/MT)'].map((col) => (
                  <th
                    key={col}
                    style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--navy-light)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.category}</td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.grade}</td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.packing}</td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: 600 }}>₹{c.refPrice.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                    No chemicals match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
