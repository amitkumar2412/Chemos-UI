'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAllPurchases, comparePurchases } from '@/lib/api';
import type { PurchaseOrder, CompareResponse, CompareItem } from '@/lib/api';

const PAGE_SIZE = 8;

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="cmp-stat-card">
      <div className="cmp-stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div className="cmp-stat-label">{label}</div>
        <div className="cmp-stat-value">{value}</div>
        <div className="cmp-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

// ── Compare Modal ─────────────────────────────────────────────────────────────
function CompareModal({
  data,
  portMap,
  onClose,
}: {
  data: CompareResponse;
  portMap: Map<string, string>;
  onClose: () => void;
}) {
  const { purchases, highlights } = data;

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono,monospace' };
  const monoBold: React.CSSProperties = { ...mono, fontWeight: 700 };

  function hlClass(field: keyof CompareResponse['highlights'], id: string) {
    const h = highlights[field];
    if (!h) return '';
    if (h.best_id === id) return 'cmp-cmp-best';
    if (h.worst_id === id) return 'cmp-cmp-worst';
    return 'cmp-cmp-mid';
  }

  const rows: { label: string; render: (o: CompareItem) => React.ReactNode }[] = [
    {
      label: 'Load Port',
      render: o => portMap.get(o.id) ?? '—',
    },
    {
      label: 'QTY (MT)',
      render: o => <span style={mono}>{o.quantity.toLocaleString()}</span>,
    },
    {
      label: 'Delivery Term',
      render: o => o.delivery_term,
    },
    {
      label: 'Price (FC)',
      render: o => (
        <span className={hlClass('price_fc', o.id)} style={monoBold}>
          {o.price_fc} {o.currency || 'USD'}
        </span>
      ),
    },
    {
      label: 'Exchange Rate',
      render: o => <span style={mono}>{o.exchange_rate.toFixed(2)}</span>,
    },
    {
      label: 'Price (INR) / MT',
      render: o => (
        <span className={hlClass('price_inr_per_mt', o.id)} style={monoBold}>
          ₹ {o.price_inr_per_mt.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      label: 'Valid Till',
      render: o => fmtDate(o.valid_till),
    },
    {
      label: 'Expenses (Freight & Insurance)',
      render: o => <span style={mono}>₹ {o.expense.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Custom Duty BCD',
      render: o => <span style={mono}>₹ {o.custom_duty.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'SWS',
      render: o => <span style={mono}>₹ {o.sws.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'ADD (₹)',
      render: o => <span style={mono}>₹ {o.add.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Other Expense',
      render: o => <span style={mono}>₹ {o.other_expense.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Landed Cost / MT',
      render: o => (
        <span className={hlClass('landed_cost_per_mt', o.id)} style={{ ...monoBold, color: hlClass('landed_cost_per_mt', o.id) ? undefined : 'var(--green)' }}>
          ₹ {o.landed_cost_per_mt.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="cmp-modal-overlay" onClick={onClose}>
      <div className="cmp-modal" onClick={e => e.stopPropagation()}>
        <div className="cmp-modal-header">
          <div>
            <div className="cmp-modal-title">Offer Comparison</div>
            <div className="cmp-modal-sub">
              Side-by-side comparison · {purchases.length} offer{purchases.length > 1 ? 's' : ''} selected ·{' '}
              <span style={{ color: 'var(--green)' }}>Green = best</span>{' '}
              <span style={{ color: 'var(--red)', marginLeft: 6 }}>Red = worst</span>
            </div>
          </div>
          <button className="cmp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cmp-modal-body">
          <table className="cmp-compare-table">
            <thead>
              <tr>
                <th>Field</th>
                {purchases.map(o => (
                  <th key={o.id}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', fontFamily: 'JetBrains Mono,monospace' }}>
                      {o.company_from}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2, fontWeight: 500, fontFamily: 'Montserrat,sans-serif' }}>
                      {o.id}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  {purchases.map(o => (
                    <td key={o.id}>{row.render(o)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ComparablePage() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparing, setComparing] = useState(false);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAllPurchases()
      .then(data => {
        setPurchases(data);
        if (data.length > 0) {
          const first = [...new Set(data.map(p => p.product))].filter(Boolean).sort()[0];
          if (first) setSelectedProduct(first);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const products = useMemo(
    () => [...new Set(purchases.map(p => p.product))].filter(Boolean).sort(),
    [purchases]
  );

  const filtered = useMemo(
    () => (selectedProduct ? purchases.filter(p => p.product === selectedProduct) : purchases),
    [purchases, selectedProduct]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const portMap = useMemo(
    () => new Map(purchases.map(p => [p.id, p.port])),
    [purchases]
  );

  const bestBuy = filtered.length ? Math.min(...filtered.map(o => o.priceFc)) : 0;
  const canCompare = selectedIds.size >= 2;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const handleCompare = async () => {
    if (!canCompare) return;
    setComparing(true);
    try {
      const data = await comparePurchases([...selectedIds]);
      setCompareData(data);
    } catch (err) {
      console.error('Compare failed:', err);
    } finally {
      setComparing(false);
    }
  };

  const handleProductChange = (p: string) => {
    setSelectedProduct(p);
    setPage(1);
    setSelectedIds(new Set());
  };

  return (
    <div className="cmp-page">
      {/* Header */}
      <div className="cmp-header">
        <h1 className="cmp-title">Comparable</h1>
        <p className="cmp-subtitle">Compare multiple purchase and sale offers to choose the best deal</p>
      </div>

      {/* Controls */}
      <div className="cmp-controls">
        <div className="cmp-tabs">
          <button className="cmp-tab active">Purchase</button>
        </div>

        <div className="cmp-product-selector">
          <span className="cmp-product-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          <span className="cmp-product-label">Product</span>
          <select
            className="cmp-product-select"
            value={selectedProduct}
            onChange={e => handleProductChange(e.target.value)}
            disabled={loading}
          >
            {products.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }} />

        <button
          className="cmp-compare-btn"
          disabled={!canCompare || comparing}
          onClick={handleCompare}
        >
          {comparing ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
              </svg>
              Comparing…
            </span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="2" y="3" width="8" height="18" rx="1" />
                <rect x="14" y="3" width="8" height="18" rx="1" />
              </svg>
              Compare Offers
              <span className="cmp-compare-badge">{selectedIds.size}</span>
            </>
          )}
        </button>

        <button className="cmp-export-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Stats Row */}
      <div className="cmp-stats-row">
        <StatCard
          label="Total Purchase Offers"
          value={loading ? '…' : filtered.length}
          sub={loading ? 'Loading…' : filtered.length > 0 ? `Best Price: ${bestBuy.toLocaleString()} / MT` : 'No offers'}
          iconBg="rgba(72,149,239,.15)"
          iconColor="var(--blue)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M12 2L2 7v7c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7z" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="12" y1="8" x2="12" y2="16" />
            </svg>
          }
        />
        <StatCard
          label="Confirmed Offer"
          value={selectedIds.size}
          sub={selectedIds.size === 0 ? 'No offers confirmed yet' : `${selectedIds.size} offer${selectedIds.size > 1 ? 's' : ''} selected`}
          iconBg="rgba(6,214,160,.12)"
          iconColor="var(--green)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M12 2L2 7v7c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />
      </div>

      {/* Offers Table */}
      <div className="cmp-table-wrap">
        <div className="cmp-table-header">
          <div className="cmp-table-title">
            Purchase Offers{selectedProduct ? ` for ${selectedProduct}` : ''}
          </div>
        </div>
        <table className="cmp-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Company From</th>
              <th className="num">QTY (MT)</th>
              <th>Load Port</th>
              <th>Delivery Term</th>
              <th className="num">Price (FC)</th>
              <th className="num">Exchange Rate</th>
              <th>Valid Till</th>
              <th className="num">Expense (₹)</th>
              <th className="num">Custom Duty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray)' }}>
                  Loading purchases…
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray)' }}>
                  No purchase offers found{selectedProduct ? ` for ${selectedProduct}` : ''}
                </td>
              </tr>
            ) : (
              paged.map(offer => (
                <tr key={offer.id} className={selectedIds.has(offer.id) ? 'cmp-selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      className="cmp-checkbox"
                      checked={selectedIds.has(offer.id)}
                      onChange={() => toggleSelect(offer.id)}
                      disabled={!selectedIds.has(offer.id) && selectedIds.size >= 4}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{offer.companyFrom}</td>
                  <td className="num">{offer.quantity.toLocaleString()}</td>
                  <td className="cmp-location">{offer.port || '—'}</td>
                  <td>{offer.deliveryTerm}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {offer.priceFc} {offer.currency || 'USD'}
                  </td>
                  <td className="num">{offer.exchangeRate?.toFixed(2) ?? '—'}</td>
                  <td style={{ fontSize: 11 }}>{fmtDate(offer.etd)}</td>
                  <td className="num">₹ {offer.expense?.toLocaleString() ?? '0'}</td>
                  <td className="num">{offer.customDuty ?? 0}%</td>
                  <td>
                    <div className="cmp-actions">
                      <button className="cmp-action-btn view" title="View details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className={`cmp-action-btn add${selectedIds.has(offer.id) ? ' added' : ''}`}
                        title={selectedIds.has(offer.id) ? 'Remove from compare' : 'Add to compare'}
                        onClick={() => toggleSelect(offer.id)}
                        disabled={!selectedIds.has(offer.id) && selectedIds.size >= 4}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          {selectedIds.has(offer.id) ? (
                            <polyline points="20 6 9 17 4 12" />
                          ) : (
                            <>
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="cmp-pagination">
            <span className="cmp-showing">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} offers
            </span>
            <div className="cmp-pages">
              <button className="cmp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`cmp-page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              {totalPages > 5 && <span className="cmp-page-ellipsis">…</span>}
              {totalPages > 5 && (
                <button className={`cmp-page-btn${page === totalPages ? ' active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button className="cmp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Compare Bar */}
      <div className="cmp-bar">
        <div className="cmp-bar-info">
          <div className="cmp-bar-title">Compare Multiple Offers</div>
          <div className="cmp-bar-sub">
            Select 2 to 4 offers from the list and click &apos;Compare Offers&apos; to see a detailed side-by-side comparison.
          </div>
        </div>
        <div className="cmp-bar-right">
          <span className="cmp-selected-label">
            Selected Offers: <strong>{selectedIds.size} / 4</strong>
          </span>
          {selectedIds.size > 0 && (
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--gray)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          )}
          <button
            className={`cmp-compare-now-btn${canCompare ? ' enabled' : ''}`}
            disabled={!canCompare || comparing}
            onClick={handleCompare}
          >
            {comparing ? 'Comparing…' : 'Compare Now'}
          </button>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="cmp-features">
        {[
          {
            color: 'var(--blue)',
            title: 'Smart Comparison',
            desc: 'Compare price, delivery, location, risk and more side by side.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="2" y="3" width="8" height="18" rx="1" /><rect x="14" y="3" width="8" height="18" rx="1" />
              </svg>
            ),
          },
          {
            color: 'var(--gold)',
            title: 'Better Decisions',
            desc: 'Identify the best value purchase or most profitable sale.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            ),
          },
          {
            color: 'var(--teal)',
            title: 'Save Time',
            desc: 'All critical information in one place for quick evaluation.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
          {
            color: 'var(--green)',
            title: 'Maximize Profit',
            desc: 'Find the best margin opportunities instantly.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            ),
          },
        ].map(f => (
          <div key={f.title} className="cmp-feature">
            <div className="cmp-feature-icon" style={{ color: f.color }}>{f.icon}</div>
            <div>
              <div className="cmp-feature-title">{f.title}</div>
              <div className="cmp-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compare Modal */}
      {compareData && (
        <CompareModal
          data={compareData}
          portMap={portMap}
          onClose={() => setCompareData(null)}
        />
      )}
    </div>
  );
}
