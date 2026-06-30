
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAllPurchases, fetchAllSales, type PurchaseOrder } from '@/lib/api';
import type { SaleEntry } from '@/lib/types';
import { useAppSelector } from '@/lib/redux/hooks';

const LINKS_KEY = 'ps_links_v1';

interface PSLink {
  id: string;
  purchaseId: string;
  saleId: string;
  product: string;
}

function loadLinks(): PSLink[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LINKS_KEY) ?? '[]'); } catch { return []; }
}
function saveLinks(links: PSLink[]) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TH: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: '11px',
  fontWeight: '700', color: 'var(--gray)', letterSpacing: '0.06em', textTransform: 'uppercase',
};

// ─── Comparison Modal ──────────────────────────────────────────────────────────

function CompareModal({
  purchase,
  sale,
  onClose,
  onLink,
  alreadyLinked,
}: {
  purchase: PurchaseOrder;
  sale: SaleEntry;
  onClose: () => void;
  onLink: () => void;
  alreadyLinked: boolean;
}) {
  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
  const monoBold: React.CSSProperties = { ...mono, fontWeight: 700 };

  const rows: { label: string; p: React.ReactNode; s: React.ReactNode }[] = [
    { label: 'Product',         p: purchase.product,       s: sale.product },
    { label: 'Load Port',       p: purchase.port ?? '—',   s: sale.port ?? '—' },
    { label: 'QTY (MT)',        p: <span style={mono}>{purchase.quantity.toLocaleString('en-IN')}</span>, s: <span style={mono}>{sale.quantity.toLocaleString('en-IN')}</span> },
    { label: 'Delivery Term',   p: purchase.deliveryTerm ?? '—', s: sale.deliveryTerm ?? '—' },
    { label: 'Price (FC)',       p: <span style={monoBold}>{purchase.priceFc} {purchase.currency ?? 'USD'}</span>, s: '—' },
    { label: 'Exchange Rate',   p: <span style={mono}>{purchase.exchangeRate?.toFixed(2) ?? '—'}</span>, s: '—' },
    { label: 'Price (INR) / MT',p: <span style={monoBold}>₹ {purchase.priceInr?.toLocaleString('en-IN') ?? '—'}</span>, s: <span style={monoBold}>₹ {sale.price?.toLocaleString('en-IN') ?? '—'}</span> },
    { label: 'Market Price',    p: <span style={mono}>{purchase.marketPrice ? `₹ ${purchase.marketPrice.toLocaleString('en-IN')}` : '—'}</span>, s: <span style={mono}>{sale.marketPrice ? `₹ ${sale.marketPrice.toLocaleString('en-IN')}` : '—'}</span> },
    { label: 'Shipment',        p: purchase.shipment ?? '—', s: sale.vesselName ?? '—' },
    { label: 'ETD / ETA',       p: <span style={mono}>{fmtDate(purchase.etd)} → {fmtDate(purchase.eta)}</span>, s: '—' },
    { label: 'Expenses (₹)',    p: <span style={mono}>₹ {(purchase.expense ?? 0).toLocaleString('en-IN')}</span>, s: '—' },
    { label: 'Custom Duty BCD', p: <span style={mono}>₹ {(purchase.customDuty ?? 0).toLocaleString('en-IN')}</span>, s: '—' },
    { label: 'SWS',             p: <span style={mono}>₹ {(purchase.sws ?? 0).toLocaleString('en-IN')}</span>, s: '—' },
    { label: 'ADD (₹)',         p: <span style={mono}>₹ {(purchase.add ?? 0).toLocaleString('en-IN')}</span>, s: '—' },
    { label: 'Other Expense',   p: <span style={mono}>₹ {(purchase.otherExpense ?? 0).toLocaleString('en-IN')}</span>, s: '—' },
    { label: 'Make',            p: purchase.make ?? '—',   s: sale.make ?? '—' },
    { label: 'Origin',          p: purchase.origin ?? '—', s: sale.origin ?? '—' },
    { label: 'Packaging',       p: purchase.packaging ?? '—', s: sale.packaging ?? '—' },
    { label: 'Payment',         p: purchase.paymentTerm ?? '—', s: sale.payment ?? '—' },
    { label: 'Company',         p: purchase.companyFrom,   s: sale.companyTo },
    { label: 'Status',          p: <StatusBadge status={purchase.status} />, s: <StatusBadge status={sale.status} /> },
  ];

  return (
    <div
      className="cmp-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="cmp-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px', width: '92vw' }}
      >
        {/* Modal Header */}
        <div className="cmp-modal-header">
          <div>
            <div className="cmp-modal-title">Purchase ↔ Sale Comparison</div>
            <div className="cmp-modal-sub">
              Side-by-side comparison &middot; Confirmed orders &middot;{' '}
              <span style={{ color: 'var(--blue)' }}>Purchase</span>{' '}
              vs{' '}
              <span style={{ color: 'var(--teal)' }}>Sale</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {alreadyLinked ? (
              <span style={{
                padding: '8px 18px', background: 'rgba(72,187,120,0.15)', color: '#48bb78',
                border: '1px solid rgba(72,187,120,0.4)', borderRadius: '8px',
                fontSize: '13px', fontWeight: '700',
              }}>
                ✓ Already Linked
              </span>
            ) : (
              <button
                onClick={onLink}
                style={{
                  padding: '9px 22px', background: 'var(--blue)', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M6 9a3 3 0 0 0 4.5.5l2-2a3 3 0 0 0-4.24-4.24l-1.15 1.15" strokeLinecap="round" />
                  <path d="M10 7a3 3 0 0 0-4.5-.5l-2 2a3 3 0 0 0 4.24 4.24l1.14-1.14" strokeLinecap="round" />
                </svg>
                Link These Orders
              </button>
            )}
            <button className="cmp-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="cmp-modal-body">
          <table className="cmp-compare-table">
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Field</th>
                <th>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {purchase.companyFrom}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 2, fontWeight: 600 }}>
                    PURCHASE · #{purchase.id}
                  </div>
                </th>
                <th>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {sale.companyTo}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--teal)', marginTop: 2, fontWeight: 600 }}>
                    SALE · #{sale.id}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.p}</td>
                  <td>{row.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseSaleLinkPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [allProducts, setAllProducts] = useState<string[]>([]);
  const [product, setProduct] = useState('');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<PSLink[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean; visible: boolean }>({ message: '', ok: true, visible: false });

  useEffect(() => {
    setLinks(loadLinks());
    // Fetch all purchases + all sales to build the unified product list
    Promise.all([fetchAllPurchases(), fetchAllSales(0, 1000)]).then(([pAll, sAll]) => {
      const fromPurchases = pAll.map((p) => p.product);
      const fromSales = sAll.content.map((s) => s.product);
      const unique = [...new Set([...fromPurchases, ...fromSales])].filter(Boolean).sort();
      setAllProducts(unique);
    }).catch(() => {});
  }, []);

  const showToast = (message: string, ok: boolean) => {
    setToast({ message, ok, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  const loadData = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        fetchAllPurchases({ status: 'CONFIRMED', product }),
        fetchAllSales(0, 500),
      ]);
      setPurchases(pData);
      setSales(sData.content.filter((s) => s.product === product && s.status?.toUpperCase() === 'CONFIRMED'));
    } catch {
      showToast('Failed to load orders', false);
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const handleProductChange = (p: string) => {
    setProduct(p);
    setSelectedPurchaseId(null);
    setSelectedSaleId(null);
    setShowModal(false);
  };

  const handlePurchaseClick = (id: string) => {
    const next = selectedPurchaseId === id ? null : id;
    setSelectedPurchaseId(next);
    setShowModal(false);
    if (next && selectedSaleId) setShowModal(true);
  };

  const handleSaleClick = (id: string) => {
    const next = selectedSaleId === id ? null : id;
    setSelectedSaleId(next);
    setShowModal(false);
    if (next && selectedPurchaseId) setShowModal(true);
  };

  const handleLink = () => {
    if (!selectedPurchaseId || !selectedSaleId) return;
    if (links.some((l) => l.purchaseId === selectedPurchaseId && l.saleId === selectedSaleId)) {
      showToast('This pair is already linked', false);
      return;
    }
    const newLink: PSLink = {
      id: `${selectedPurchaseId}__${selectedSaleId}__${Date.now()}`,
      purchaseId: selectedPurchaseId,
      saleId: selectedSaleId,
      product,
    };
    const updated = [...links, newLink];
    setLinks(updated);
    saveLinks(updated);
    setShowModal(false);
    setSelectedPurchaseId(null);
    setSelectedSaleId(null);
    showToast('Orders linked successfully', true);
  };

  const handleUnlink = (linkId: string) => {
    const updated = links.filter((l) => l.id !== linkId);
    setLinks(updated);
    saveLinks(updated);
    showToast('Link removed', true);
  };

  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId) ?? null;
  const selectedSale = sales.find((s) => s.id === selectedSaleId) ?? null;
  const alreadyLinked = !!(selectedPurchaseId && selectedSaleId &&
    links.some((l) => l.purchaseId === selectedPurchaseId && l.saleId === selectedSaleId));
  const productLinks = links.filter((l) => l.product === product);

  return (
    <div style={{ padding: 0, height: '100%' }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Purchase-Sale Link</h1>
          <p>Select a confirmed purchase and a confirmed sale to compare and map them together</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: 'var(--gray)', fontWeight: '500' }}>Product</label>
          <select
            value={product}
            onChange={(e) => handleProductChange(e.target.value)}
            style={{
              padding: '8px 36px 8px 12px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', minWidth: '180px', appearance: 'none',
            }}
          >
            <option value="">— Select Product —</option>
            {allProducts.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="page-content">
        {!product ? (
          <EmptyPrompt />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>Loading confirmed orders…</div>
        ) : (
          <>
            {/* Selection hint */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
              padding: '10px 16px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px',
            }}>
              <Step done={!!selectedPurchaseId} num={1} label="Click a purchase order" />
              <div style={{ color: 'var(--border)', fontSize: '16px' }}>→</div>
              <Step done={!!selectedSaleId} num={2} label="Click a sale order" />
              <div style={{ color: 'var(--border)', fontSize: '16px' }}>→</div>
              <Step done={!!selectedPurchaseId && !!selectedSaleId} num={3} label="Compare & link" />
            </div>

            {/* ── Two-column ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Purchase column */}
              <Section title={`Purchase Orders — CONFIRMED (${purchases.length})`} accent="var(--blue)">
                {purchases.length === 0 ? (
                  <EmptyList label="confirmed purchase orders for this product" />
                ) : (
                  <div className="table-scroll" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                      <thead>
                        <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                          <th style={TH}>Vessel</th>
                          <th style={TH}>Origin</th>
                          <th style={TH}>Mkt Status</th>
                          <th style={TH}>ETA</th>
                          <th style={{ ...TH, textAlign: 'right' }}>Qty (MT)</th>
                          <th style={TH}>Port</th>
                          <th style={{ ...TH, textAlign: 'center' }}>Links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((p) => {
                          const isSelected = selectedPurchaseId === p.id;
                          const linkedCount = links.filter((l) => l.purchaseId === p.id).length;
                          return (
                            <tr
                              key={p.id}
                              onClick={() => handlePurchaseClick(p.id)}
                              style={{
                                borderBottom: '1px solid var(--border)',
                                background: isSelected ? 'rgba(66,153,225,0.12)' : undefined,
                                cursor: 'pointer',
                                outline: isSelected ? '2px solid rgba(66,153,225,0.5)' : undefined,
                                outlineOffset: '-2px',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ''; }}
                            >
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.vesselName || '—'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--gray)' }}>#{p.id}</div>
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--gray)' }}>
                                {p.origin || '—'}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <MarketStatusBadge status={p.marketStatus} />
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--gray)' }}>
                                {fmtDate(p.eta)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
                                {p.quantity.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--gray)' }}>
                                {p.port || '—'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                {linkedCount > 0 && (
                                  <span style={{ fontSize: '11px', background: 'rgba(72,187,120,0.15)', color: '#48bb78', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                                    {linkedCount}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {/* Sale column */}
              <Section title={`Sale Orders — CONFIRMED (${sales.length})`} accent="var(--teal)">
                {sales.length === 0 ? (
                  <EmptyList label="confirmed sale orders for this product" />
                ) : (
                  <div className="table-scroll" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '460px' }}>
                      <thead>
                        <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                          <th style={TH}>Company</th>
                          <th style={{ ...TH, textAlign: 'right' }}>Qty (MT)</th>
                          <th style={TH}>Mkt Status</th>
                          <th style={TH}>Port</th>
                          <th style={{ ...TH, textAlign: 'center' }}>Links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((s) => {
                          const isSelected = selectedSaleId === s.id;
                          const linkedCount = links.filter((l) => l.saleId === s.id).length;
                          return (
                            <tr
                              key={s.id}
                              onClick={() => handleSaleClick(s.id)}
                              style={{
                                borderBottom: '1px solid var(--border)',
                                background: isSelected ? 'rgba(72,187,120,0.12)' : undefined,
                                cursor: 'pointer',
                                outline: isSelected ? '2px solid rgba(72,187,120,0.5)' : undefined,
                                outlineOffset: '-2px',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ''; }}
                            >
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.companyTo}</div>
                                <div style={{ fontSize: '11px', color: 'var(--gray)' }}>#{s.id}</div>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
                                {s.quantity.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <MarketStatusBadge status={s.marketStatus} />
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--gray)' }}>
                                {s.port || '—'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                {linkedCount > 0 && (
                                  <span style={{ fontSize: '11px', background: 'rgba(66,153,225,0.15)', color: '#63b3ed', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                                    {linkedCount}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>

            {/* ── Linked Pairs ── */}
            {productLinks.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  Mapped Pairs for {product} ({productLinks.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productLinks.map((link) => {
                    const p = purchases.find((x) => x.id === link.purchaseId);
                    const s = sales.find((x) => x.id === link.saleId);
                    return (
                      <div
                        key={link.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', background: 'var(--navy-light)',
                          borderRadius: '8px', border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--blue)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Purchase</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p?.companyFrom ?? `#${link.purchaseId}`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                            #{link.purchaseId}{p ? ` · ${p.quantity.toLocaleString('en-IN')} MT · ${p.priceFc} ${p.currency ?? ''}` : ''}
                          </div>
                        </div>
                        <div style={{ color: 'var(--blue)', fontSize: '18px', flexShrink: 0 }}>⟷</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--teal)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Sale</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s?.companyTo ?? `#${link.saleId}`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                            #{link.saleId}{s ? ` · ${s.quantity.toLocaleString('en-IN')} MT · ₹${s.price.toLocaleString('en-IN')}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlink(link.id)}
                          style={{
                            padding: '5px 12px', background: 'rgba(245,101,101,0.08)',
                            color: '#f56565', border: '1px solid rgba(245,101,101,0.3)',
                            borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          Unlink
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Comparison Modal ── */}
      {showModal && selectedPurchase && selectedSale && (
        <CompareModal
          purchase={selectedPurchase}
          sale={selectedSale}
          alreadyLinked={alreadyLinked}
          onClose={() => { setShowModal(false); setSelectedPurchaseId(null); setSelectedSaleId(null); }}
          onLink={handleLink}
        />
      )}

      {/* Toast */}
      {toast.visible && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          padding: '12px 20px', background: toast.ok ? '#48bb78' : '#f56565',
          color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
          zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '3px', height: '16px', background: accent, borderRadius: '2px' }} />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Step({ num, label, done }: { num: number; label: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
        background: done ? 'var(--blue)' : 'var(--border)',
        color: done ? '#fff' : 'var(--gray)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700',
      }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontSize: '12px', color: done ? 'var(--text)' : 'var(--gray)', fontWeight: done ? '600' : '400' }}>
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? 'UNKNOWN').toUpperCase();
  const map: Record<string, { bg: string; color: string }> = {
    CONFIRMED:   { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    UNCONFIRMED: { bg: 'rgba(237,137,54,0.15)', color: '#ed8936' },
    CANCELLED:   { bg: 'rgba(245,101,101,0.15)', color: '#f56565' },
  };
  const style = map[s] ?? { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
      fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em',
      textTransform: 'uppercase', background: style.bg, color: style.color,
    }}>
      {s}
    </span>
  );
}

function EmptyPrompt() {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 40px',
      background: 'var(--card)', borderRadius: '12px',
      border: '2px dashed var(--border)',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Select a Product</h3>
      <p style={{ color: 'var(--gray)', maxWidth: '380px', margin: '0 auto' }}>
        Choose a product from the dropdown above to view its confirmed purchase and sale orders, then compare and map them together.
      </p>
    </div>
  );
}

function MarketStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span style={{ color: 'var(--gray)', fontSize: '12px' }}>—</span>;
  const s = status.toUpperCase();
  const map: Record<string, { bg: string; color: string }> = {
    HIGH:    { bg: 'rgba(72,187,120,0.15)',  color: '#48bb78' },
    LOW:     { bg: 'rgba(245,101,101,0.15)', color: '#f56565' },
    MEDIUM:  { bg: 'rgba(237,137,54,0.15)',  color: '#ed8936' },
    STABLE:  { bg: 'rgba(66,153,225,0.15)',  color: '#63b3ed' },
  };
  const style = map[s] ?? { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
      fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em',
      textTransform: 'uppercase', background: style.bg, color: style.color,
    }}>
      {status}
    </span>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px',
      background: 'var(--card)', borderRadius: '10px',
      border: '1px dashed var(--border)', color: 'var(--gray)', fontSize: '13px',
    }}>
      No {label} found
    </div>
  );
}
