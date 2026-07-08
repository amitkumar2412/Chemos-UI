'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAllPurchases, comparePurchases, getPortName, getProductName, getProductId, getPaymentTermName } from '@/lib/api';
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

// ── Interest Rate Prompt ──────────────────────────────────────────────────────
function InterestRatePrompt({
  defaultRate,
  onConfirm,
  onCancel,
}: {
  defaultRate: number;
  onConfirm: (rate: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [rate, setRate] = useState(defaultRate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(rate);
      // parent sets showRatePrompt(false) on success → this component unmounts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doConfirm();
    if (e.key === 'Escape' && !loading) onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
      }}
      onClick={loading ? undefined : onCancel}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 32px',
          width: 360,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Set Interest Rate</div>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 24, lineHeight: 1.5 }}>
          Used to calculate <strong style={{ color: 'var(--text)' }}>Credit Benefit</strong> and{' '}
          <strong style={{ color: 'var(--text)' }}>Voyage Cost</strong> in the comparison.
        </div>

        <label style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Annual Interest Rate
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: error ? 12 : 28 }}>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={rate}
            autoFocus
            disabled={loading}
            onChange={e => setRate(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'var(--navy-light)',
              border: `1px solid ${error ? '#f56565' : 'var(--blue)'}`,
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 22,
              fontFamily: 'JetBrains Mono,monospace',
              fontWeight: 700,
              textAlign: 'right',
              outline: 'none',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <span style={{ fontSize: 15, color: 'var(--gray)', fontWeight: 600, minWidth: 40 }}>% / yr</span>
        </div>

        {error && (
          <div style={{
            marginBottom: 16,
            padding: '8px 12px',
            background: 'rgba(245,101,101,0.1)',
            border: '1px solid rgba(245,101,101,0.3)',
            borderRadius: 6,
            color: '#f56565',
            fontSize: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--gray)',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={doConfirm}
            disabled={loading}
            style={{
              flex: 2,
              padding: '10px',
              background: 'linear-gradient(135deg, var(--blue), var(--teal))',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(66,153,225,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" strokeDasharray="25" strokeDashoffset="8" />
                </svg>
                Comparing…
              </>
            ) : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Compare Modal ─────────────────────────────────────────────────────────────
function CompareModal({
  data,
  portMap,
  purchaseMap,
  interestRate,
  onClose,
}: {
  data: CompareResponse;
  portMap: Map<string, string>;
  purchaseMap: Map<string, PurchaseOrder>;
  interestRate: number;
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

  // daily rate = annualRate / 100 / 365
  const dailyRate = interestRate / 100 / 365;

  function creditBenefit(o: CompareItem): number {
    const po = purchaseMap.get(o.id);
    return (po?.paymentDays ?? 0) * (o.landed_cost_per_mt ?? 0) * dailyRate;
  }

  function voyageCost(o: CompareItem): number {
    return (o.transit_days ?? 0) * (o.landed_cost_per_mt ?? 0) * dailyRate;
  }

  function isAdvance(o: CompareItem): boolean {
    const term = getPaymentTermName(purchaseMap.get(o.id)?.paymentTerm ?? null);
    return term.toUpperCase().includes('ADVANCE');
  }

  function totalCost(o: CompareItem): number {
    const cb = creditBenefit(o);
    const vc = voyageCost(o);
    return isAdvance(o)
      ? o.landed_cost_per_mt + cb + vc
      : o.landed_cost_per_mt - cb + vc;
  }

  // Client-side best/worst for Total Cost
  const totalCosts = purchases.map(o => totalCost(o));
  const bestTotal  = purchases.length > 1 ? Math.min(...totalCosts) : null;
  const worstTotal = purchases.length > 1 ? Math.max(...totalCosts) : null;

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows: { label: string; render: (o: CompareItem) => React.ReactNode }[] = [
    {
      label: 'QTY (MT)',
      render: o => <span style={mono}>{(o.quantity ?? 0).toLocaleString()}</span>,
    },
    {
      label: 'Delivery Term',
      render: o => o.delivery_term ?? '—',
    },
    {
      label: 'Price (FC)',
      render: o => (
        <span className={hlClass('price_fc', o.id)} style={monoBold}>
          {o.price_fc ?? '—'} {o.currency || 'USD'}
        </span>
      ),
    },
    {
      label: 'Exchange Rate',
      render: o => <span style={mono}>{(o.exchange_rate ?? 0).toFixed(2)}</span>,
    },
    {
      label: 'Price (INR) / MT',
      render: o => (
        <span className={hlClass('price_inr_per_mt', o.id)} style={monoBold}>
          ₹ {(o.price_inr_per_mt ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      label: 'Valid Till',
      render: o => fmtDate(o.valid_till),
    },
    {
      label: 'Expenses (Freight & Insurance)',
      render: o => <span style={mono}>₹ {(o.expense ?? 0).toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Custom Duty BCD',
      render: o => <span style={mono}>₹ {(o.custom_duty ?? 0).toLocaleString('en-IN')}</span>,
    },
    {
      label: 'SWS',
      render: o => <span style={mono}>₹ {(o.sws ?? 0).toLocaleString('en-IN')}</span>,
    },
    {
      label: 'ADD (₹)',
      render: o => <span style={mono}>₹ {(o.add ?? 0).toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Other Expense',
      render: o => <span style={mono}>₹ {(o.other_expense ?? 0).toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Landed Cost / MT',
      render: o => (
        <span className={hlClass('landed_cost_per_mt', o.id)} style={monoBold}>
          ₹ {(o.landed_cost_per_mt ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    // ── Divider row ───────────────────────────────────────────────────────────
    {
      label: '──',
      render: () => null,
    },
    {
      label: 'Load Port',
      render: o => portMap.get(o.id) ?? '—',
    },
    {
      label: 'Discharge Port',
      render: o => getPortName(purchaseMap.get(o.id)?.dischargePort ?? null),
    },
    {
      label: 'Voyage Days',
      render: (o: CompareItem) => (
        <span style={mono}>{o.transit_days ?? '—'} days</span>
      ),
    },
    {
      label: 'Voyage Cost',
      render: (o: CompareItem) => (
        <span style={{ ...monoBold, color: '#ed8936' }}>
          + ₹ {fmt(voyageCost(o))}
        </span>
      ),
    },
    {
      label: 'Payment Terms',
      render: (o: CompareItem) => {
        const po = purchaseMap.get(o.id);
        return <span style={mono}>{getPaymentTermName(po?.paymentTerm ?? null)}</span>;
      },
    },
    {
      label: 'Payment Days',
      render: (o: CompareItem) => {
        const po = purchaseMap.get(o.id);
        return <span style={mono}>{po?.paymentDays ?? '—'} days</span>;
      },
    },
    {
      label: `Credit Benefit`,
      render: (o: CompareItem) => {
        const cb = creditBenefit(o);
        const adv = isAdvance(o);
        return (
          <span style={{ ...monoBold, color: adv ? '#ed8936' : '#48bb78' }}>
            {adv ? '+' : '−'} ₹ {fmt(cb)}
          </span>
        );
      },
    },
    {
      label: 'Total Cost / MT',
      render: (o: CompareItem) => {
        const total = totalCost(o);
        const isBest  = bestTotal !== null && total === bestTotal;
        const isWorst = worstTotal !== null && total === worstTotal;
        return (
          <span style={{ ...monoBold, color: isBest ? 'var(--green)' : isWorst ? 'var(--red)' : undefined }}>
            ₹ {fmt(total)}
          </span>
        );
      },
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
          {/* Interest rate badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16,
            padding: '4px 10px', background: 'var(--navy-light)', border: '1px solid var(--border)', borderRadius: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500 }}>Interest</span>
            <span style={{ fontSize: 13, color: 'var(--blue)', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
              {interestRate}% / yr
            </span>
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
              {rows.map(row =>
                row.label === '──' ? (
                  <tr key="divider">
                    <td colSpan={purchases.length + 1} style={{ padding: '4px 0', borderBottom: '2px solid var(--border)' }} />
                  </tr>
                ) : row.label === 'Total Cost / MT' ? (
                  <tr key={row.label} style={{ background: 'var(--navy-light)', boxShadow: 'inset 0 1px 0 var(--border), inset 0 -1px 0 var(--border)' }}>
                    <td style={{ fontWeight: 800 }}>{row.label}</td>
                    {purchases.map(o => (
                      <td key={o.id}>{row.render(o)}</td>
                    ))}
                  </tr>
                ) : (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {purchases.map(o => (
                      <td key={o.id}>{row.render(o)}</td>
                    ))}
                  </tr>
                )
              )}
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
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparing, setComparing] = useState(false);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [page, setPage] = useState(1);
  const [showRatePrompt, setShowRatePrompt] = useState(false);
  const [pendingRate, setPendingRate] = useState(12);
  const [confirmedRate, setConfirmedRate] = useState(12);

  // Fetch all UNCONFIRMED once on mount to populate the product dropdown
  useEffect(() => {
    fetchAllPurchases({ status: 'UNCONFIRMED' })
      .then(data => {
        const byId = new Map<string, string>();
        data.forEach(p => {
          const id = getProductId(p.product);
          const name = getProductName(p.product);
          if (id && name && name !== '—') byId.set(id, name);
        });
        const prods = [...byId.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAllProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
        else setLoading(false);
      })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  // Re-fetch from backend with status=UNCONFIRMED + product filter whenever product changes
  useEffect(() => {
    if (!selectedProduct) return;
    setLoading(true);
    fetchAllPurchases({ status: 'UNCONFIRMED', product: selectedProduct })
      .then(setPurchases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProduct]);

  const totalPages = Math.ceil(purchases.length / PAGE_SIZE);
  const paged = purchases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedProductName = allProducts.find(p => p.id === selectedProduct)?.name ?? selectedProduct;

  const portMap = useMemo(
    () => new Map(purchases.map(p => [p.id, getPortName(p.port)])),
    [purchases]
  );

  const purchaseMap = useMemo(
    () => new Map(purchases.map(p => [p.id, p])),
    [purchases]
  );

  const bestBuy = purchases.length ? Math.min(...purchases.map(o => o.priceFc)) : 0;
  const canCompare = selectedIds.size >= 2;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const handleCompare = () => {
    if (!canCompare) return;
    setShowRatePrompt(true);
  };

  const handleConfirmCompare = async (rate: number): Promise<void> => {
    setConfirmedRate(rate);
    setPendingRate(rate);
    setComparing(true);
    try {
      const data = await comparePurchases([...selectedIds]);
      setCompareData(data);
      setShowRatePrompt(false); // close prompt only on success
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
            {allProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
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
          value={loading ? '…' : purchases.length}
          sub={loading ? 'Loading…' : purchases.length > 0 ? `Best Price: ${bestBuy.toLocaleString()} / MT` : 'No offers'}
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
            Purchase Offers{selectedProduct ? ` for ${selectedProductName}` : ''}
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
                  No purchase offers found{selectedProduct ? ` for ${selectedProductName}` : ''}
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
                  <td className="num">{offer.quantity?.toLocaleString() ?? '—'}</td>
                  <td className="cmp-location">{getPortName(offer.port)}</td>
                  <td>{offer.deliveryTerm ?? '—'}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {offer.priceFc ?? '—'} {offer.currency || 'USD'}
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, purchases.length)} of {purchases.length} offers
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

      {/* Interest Rate Prompt */}
      {showRatePrompt && (
        <InterestRatePrompt
          defaultRate={pendingRate}
          onConfirm={handleConfirmCompare}
          onCancel={() => setShowRatePrompt(false)}
        />
      )}

      {/* Compare Modal */}
      {compareData && (
        <CompareModal
          data={compareData}
          portMap={portMap}
          purchaseMap={purchaseMap}
          interestRate={confirmedRate}
          onClose={() => setCompareData(null)}
        />
      )}
    </div>
  );
}
