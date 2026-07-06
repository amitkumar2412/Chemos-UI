
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllPurchases, fetchAllSales, getPortName, getProductName, getPaymentTermName,
  createLink, deleteLink, getSaleSummary, getPurchaseSummary, fetchMyLinks,
  getOriginName, getProductId,
  type PurchaseOrder, type SalePurchaseLink,
} from '@/lib/api';
import type { SaleEntry } from '@/lib/types';
import { useAppSelector } from '@/lib/redux/hooks';

interface PSLink {
  id: string;
  purchaseId: string;
  saleId: string;
  product: string;
  linkedQuantity: number;
}

interface LinkRecord {
  linkId: string;
  purchaseId: string;
  saleId: string;
  linkedQuantity: number;
  purchaseCompany: string;
  saleCompany: string;
  purchaseOriginalQty: number;
  saleTotalRequired: number;
  saleRemainingQty: number;
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
    { label: 'Product',         p: getProductName(purchase.product), s: getProductName(sale.product) },
    { label: 'Load Port',       p: getPortName(purchase.port), s: sale.port ?? '—' },
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
    { label: 'Origin',          p: getOriginName(purchase.origin), s: sale.origin ?? '—' },
    { label: 'Packaging',       p: purchase.packaging ?? '—', s: sale.packaging ?? '—' },
    { label: 'Payment',         p: getPaymentTermName(purchase.paymentTerm), s: sale.payment ?? '—' },
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

// ─── Link Quantity Modal ──────────────────────────────────────────────────────

function LinkQuantityModal({
  purchase,
  sale,
  onClose,
  onSuccess,
}: {
  purchase: PurchaseOrder;
  sale: SaleEntry;
  onClose: () => void;
  onSuccess: (link: SalePurchaseLink) => void;
}) {
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [purchaseAvailable, setPurchaseAvailable] = useState(purchase.quantity);
  const [saleRemaining, setSaleRemaining] = useState(sale.quantity);

  useEffect(() => {
    Promise.allSettled([
      getPurchaseSummary(purchase.id),
      getSaleSummary(sale.id),
    ]).then(([pRes, sRes]) => {
      if (pRes.status === 'fulfilled') setPurchaseAvailable(pRes.value.availableQuantity);
      if (sRes.status === 'fulfilled') setSaleRemaining(sRes.value.remaining);
      setSummaryLoading(false);
    });
  }, [purchase.id, sale.id]);

  const maxQty = Math.min(purchaseAvailable, saleRemaining);
  const qtyNum = parseFloat(qty);
  const isValid = !isNaN(qtyNum) && qtyNum > 0 && qtyNum <= maxQty;

  const handleConfirm = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const link = await createLink(sale.id, purchase.id, qtyNum);
      onSuccess(link);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create link');
      setLoading(false);
    }
  };

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1200,
      }}
      onClick={loading ? undefined : onClose}
    >
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '28px 32px', width: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Link These Orders</div>
          <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
            Specify how much quantity (MT) to commit from this purchase to the sale.
          </div>
        </div>

        {/* PO / Sale availability cards */}
        {summaryLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray)', fontSize: 13 }}>
            Loading available quantities…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div style={{ minWidth: 0, padding: '12px 14px', background: 'rgba(66,153,225,0.08)', border: '1px solid rgba(66,153,225,0.25)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Purchase</div>
              <div title={purchase.companyFrom} style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{purchase.companyFrom}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>#{purchase.id.slice(0, 8)}…</div>
              <div style={{ fontSize: 16, ...mono, fontWeight: 700 }}>{purchaseAvailable.toLocaleString('en-IN')} MT</div>
              <div style={{ fontSize: 10, color: 'var(--gray)' }}>available</div>
            </div>
            <div style={{ minWidth: 0, padding: '12px 14px', background: 'rgba(72,187,120,0.08)', border: '1px solid rgba(72,187,120,0.25)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Sale</div>
              <div title={sale.companyTo} style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{sale.companyTo}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>#{sale.id.slice(0, 8)}…</div>
              <div style={{ fontSize: 16, ...mono, fontWeight: 700 }}>{saleRemaining.toLocaleString('en-IN')} MT</div>
              <div style={{ fontSize: 10, color: 'var(--gray)' }}>still needed</div>
            </div>
          </div>
        )}

        {/* Quantity input */}
        <label style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Quantity to Link (MT) — max {maxQty.toLocaleString('en-IN')} MT
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: error ? 12 : 24 }}>
          <input
            type="number"
            min={0.01}
            max={maxQty}
            step={0.01}
            value={qty}
            autoFocus
            disabled={loading || summaryLoading}
            placeholder={`0 – ${maxQty.toLocaleString('en-IN')}`}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape' && !loading) onClose(); }}
            style={{
              flex: 1, padding: '10px 12px',
              background: 'var(--navy-light)',
              border: `1px solid ${error ? '#f56565' : !qty ? 'var(--border)' : isValid ? 'var(--blue)' : '#f56565'}`,
              borderRadius: 8, color: 'var(--text)',
              fontSize: 20, ...mono, fontWeight: 700, textAlign: 'right',
              outline: 'none', opacity: (loading || summaryLoading) ? 0.6 : 1,
            }}
          />
          <span style={{ fontSize: 14, color: 'var(--gray)', fontWeight: 600, minWidth: 28 }}>MT</span>
        </div>

        {error && (
          <div style={{
            marginBottom: 16, padding: '8px 12px',
            background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)',
            borderRadius: 6, color: '#f56565', fontSize: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--gray)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading || summaryLoading}
            style={{
              flex: 2, padding: '10px',
              background: (!isValid || summaryLoading) ? 'rgba(66,153,225,0.35)' : 'linear-gradient(135deg, var(--blue), var(--teal))',
              border: 'none', borderRadius: 8, color: 'white',
              fontSize: 14, fontWeight: 600,
              cursor: (!isValid || loading || summaryLoading) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(66,153,225,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" strokeDasharray="25" strokeDashoffset="8" />
                </svg>
                Linking…
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M6 9a3 3 0 0 0 4.5.5l2-2a3 3 0 0 0-4.24-4.24l-1.15 1.15" strokeLinecap="round" />
                  <path d="M10 7a3 3 0 0 0-4.5-.5l-2 2a3 3 0 0 0 4.24 4.24l1.14-1.14" strokeLinecap="round" />
                </svg>
                Confirm Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ProductOption {
  id: string;
  name: string;
}

export default function PurchaseSaleLinkPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [product, setProduct] = useState('');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<PSLink[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLinkQtyModal, setShowLinkQtyModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean; visible: boolean }>({ message: '', ok: true, visible: false });
  const [activeTab, setActiveTab] = useState<'link' | 'all-links'>('link');
  const [allLinks, setAllLinks] = useState<LinkRecord[]>([]);
  const [allLinksLoading, setAllLinksLoading] = useState(false);

  useEffect(() => {
    // Fetch all purchases + all sales to build the unified product list
    Promise.all([fetchAllPurchases(), fetchAllSales(0, 1000)]).then(([pAll, sAll]) => {
      const productsMap = new Map<string, ProductOption>();
      
      pAll.forEach((p) => {
        const id = getProductId(p.product);
        const name = getProductName(p.product);
        if (id && name) productsMap.set(id, { id, name });
      });
      
      sAll.content.forEach((s) => {
        const id = getProductId(s.product);
        const name = getProductName(s.product);
        if (id && name) productsMap.set(id, { id, name });
      });
      
      const unique = Array.from(productsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
      setSales(sData.content.filter((s) => getProductId(s.product) === product && s.status?.toUpperCase() === 'CONFIRMED'));
    } catch {
      showToast('Failed to load orders', false);
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const loadAllLinks = useCallback(async () => {
    setAllLinksLoading(true);
    try {
      const apiLinks = await fetchMyLinks();
      const records: LinkRecord[] = apiLinks.map((lnk) => {
        const po = purchases.find((p) => p.id === lnk.purchaseId);
        const sale = sales.find((s) => s.id === lnk.saleId);
        return {
          linkId: lnk.id,
          purchaseId: lnk.purchaseId,
          saleId: lnk.saleId,
          linkedQuantity: lnk.linkedQuantity,
          purchaseCompany: po?.companyFrom ?? `#${lnk.purchaseId.slice(0, 8)}…`,
          saleCompany: sale?.companyTo ?? `#${lnk.saleId.slice(0, 8)}…`,
          purchaseOriginalQty: lnk.purchaseOriginalQuantity,
          saleTotalRequired: lnk.saleTotalRequired,
          saleRemainingQty: lnk.saleRemainingQuantity,
        };
      });
      setAllLinks(records);
    } catch {
      setAllLinks([]);
    } finally {
      setAllLinksLoading(false);
    }
  }, [purchases, sales]);

  useEffect(() => {
    if (activeTab === 'all-links') loadAllLinks();
  }, [activeTab, loadAllLinks]);

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
    setShowLinkQtyModal(true);
  };

  const handleLinkSuccess = (apiLink: SalePurchaseLink) => {
    const productName = allProducts.find(p => p.id === product)?.name || product;
    const newLink: PSLink = {
      id: apiLink.id,
      purchaseId: apiLink.purchaseId,
      saleId: apiLink.saleId,
      product: productName,
      linkedQuantity: apiLink.linkedQuantity,
    };
    setLinks((prev) => [...prev, newLink]);
    // Also add to allLinks so the "All Links" tab is up to date
    const po = purchases.find((p) => p.id === apiLink.purchaseId);
    const sale = sales.find((s) => s.id === apiLink.saleId);
    if (po && sale) {
      const newRecord: LinkRecord = {
        linkId: apiLink.id,
        purchaseId: apiLink.purchaseId,
        saleId: apiLink.saleId,
        linkedQuantity: apiLink.linkedQuantity,
        purchaseCompany: po.companyFrom,
        saleCompany: sale.companyTo,
        purchaseOriginalQty: apiLink.purchaseOriginalQuantity,
        saleTotalRequired: apiLink.saleTotalRequired,
        saleRemainingQty: apiLink.saleRemainingQuantity,
      };
      setAllLinks((prev) => [...prev, newRecord]);
    }
    setShowLinkQtyModal(false);
    setShowModal(false);
    setSelectedPurchaseId(null);
    setSelectedSaleId(null);
    showToast(`${apiLink.linkedQuantity} MT linked successfully`, true);
  };

  const handleUnlink = async (linkId: string) => {
    try {
      await deleteLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      setAllLinks((prev) => prev.filter((l) => l.linkId !== linkId));
      showToast('Link removed', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to remove link', false);
    }
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
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="page-content">
        {/* ── Tab Bar ── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['link', 'all-links'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', background: 'transparent', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--blue)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--blue)' : 'var(--gray)',
                fontSize: '13px', fontWeight: activeTab === tab ? '700' : '500',
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {tab === 'link' ? (
                <>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                    <path d="M6 9a3 3 0 0 0 4.5.5l2-2a3 3 0 0 0-4.24-4.24l-1.15 1.15" strokeLinecap="round" />
                    <path d="M10 7a3 3 0 0 0-4.5-.5l-2 2a3 3 0 0 0 4.24 4.24l1.14-1.14" strokeLinecap="round" />
                  </svg>
                  Link Orders
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                  All Links
                  {allLinks.length > 0 && (
                    <span style={{ marginLeft: 6, padding: '1px 7px', background: 'var(--blue)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: '700' }}>
                      {allLinks.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── All Links Tab ── */}
        {activeTab === 'all-links' && (
          allLinksLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>Loading your links…</div>
          ) : allLinks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 40px',
              background: 'var(--card)', borderRadius: '12px',
              border: '2px dashed var(--border)',
            }}>
              <div style={{ fontSize: '42px', marginBottom: '16px' }}>🔗</div>
              <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px' }}>No Links Yet</h3>
              <p style={{ color: 'var(--gray)', maxWidth: '340px', margin: '0 auto', fontSize: '13px' }}>
                You haven&apos;t linked any purchase-sale pairs yet. Switch to the &quot;Link Orders&quot; tab to create one.
              </p>
              <button
                onClick={() => setActiveTab('link')}
                style={{ marginTop: '20px', padding: '9px 20px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Go to Link Orders
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
                  All My Linked Pairs
                  <span style={{ marginLeft: 8, fontSize: '11px', color: 'var(--gray)', fontWeight: '500' }}>
                    {allLinks.length} link{allLinks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={loadAllLinks}
                  disabled={allLinksLoading}
                  style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--gray)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                  <thead>
                    <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                      <th style={TH}>Purchase</th>
                      <th style={{ ...TH, textAlign: 'right' }}>PO Qty</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Linked MT</th>
                      <th style={TH}>Sale</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Sale Req.</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Remaining</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLinks.map((rec) => (
                      <tr key={rec.linkId} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{rec.purchaseCompany}</div>
                          <div style={{ fontSize: '10px', color: 'var(--blue)', marginTop: 2 }}>#{rec.purchaseId.slice(0, 8)}…</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--gray)' }}>
                          {rec.purchaseOriginalQty.toLocaleString('en-IN')} MT
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: 'rgba(72,187,120,0.12)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: '999px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: '#48bb78' }}>
                            ⟷ {rec.linkedQuantity.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{rec.saleCompany}</div>
                          <div style={{ fontSize: '10px', color: 'var(--teal)', marginTop: 2 }}>#{rec.saleId.slice(0, 8)}…</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--gray)' }}>
                          {rec.saleTotalRequired.toLocaleString('en-IN')} MT
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
                          <span style={{ color: rec.saleRemainingQty === 0 ? '#48bb78' : '#ed8936', fontWeight: '700' }}>
                            {rec.saleRemainingQty.toLocaleString('en-IN')} MT
                          </span>
                          {rec.saleRemainingQty === 0 && (
                            <span style={{ marginLeft: 4, fontSize: '10px', color: '#48bb78' }}>✓</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleUnlink(rec.linkId)}
                            style={{ padding: '4px 12px', background: 'rgba(245,101,101,0.08)', color: '#f56565', border: '1px solid rgba(245,101,101,0.3)', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Unlink
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {activeTab === 'link' && (!product ? (
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
                                {getOriginName(p.origin)}
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
                                {getPortName(p.port)}
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <div style={{ color: 'var(--blue)', fontSize: '18px' }}>⟷</div>
                          <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                            {link.linkedQuantity.toLocaleString('en-IN')} MT
                          </div>
                        </div>
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
        ))}
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

      {/* ── Link Quantity Modal (overlays comparison modal) ── */}
      {showLinkQtyModal && selectedPurchase && selectedSale && (
        <LinkQuantityModal
          purchase={selectedPurchase}
          sale={selectedSale}
          onClose={() => setShowLinkQtyModal(false)}
          onSuccess={handleLinkSuccess}
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
