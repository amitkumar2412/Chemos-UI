'use client';

import { useMemo, useState } from 'react';
import EmailSystemTabs from '../_components/EmailSystemTabs';
import { CUSTOMERS } from '../data';

export default function CustomersPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CUSTOMERS;
    return CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Customers available to target in a campaign.</p>
      </div>

      <EmailSystemTabs />

      <input
        type="text"
        placeholder="Search by name, company or city…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%', maxWidth: '360px', padding: '10px 14px', background: 'var(--navy-light)',
          border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--white)',
          outline: 'none', marginBottom: '18px', boxSizing: 'border-box',
        }}
      />

      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
        {filtered.length} of {CUSTOMERS.length} customers
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
              {['Customer', 'Company', 'Email', 'Phone', 'City', 'Segment'].map((col) => (
                <th
                  key={col}
                  style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr key={c.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '13px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontSize: '13px', fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 20px', fontSize: '13px' }}>{c.companyName}</td>
                <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.email}</td>
                <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.phone}</td>
                <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.city}</td>
                <td style={{ padding: '13px 20px' }}>
                  <span
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: 'var(--teal-dim)', color: 'var(--teal)',
                    }}
                  >
                    {c.segment}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
