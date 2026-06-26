'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAllPurchases,
  fetchAllSales,
  confirmPurchase,
  confirmSale,
  fetchFeedOptions,
  type PurchaseOrder,
} from '@/lib/api';
import type { SaleEntry, FeedOptions } from '@/lib/types';
import { useAppSelector } from '@/lib/redux/hooks';
import { ApiError } from '@/lib/apiClient';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import SaleDetailModal from '@/components/SaleDetailModal';
import SaleEditModal from '@/components/SaleEditModal';
import ActionMenu from '@/components/ActionMenu';
import Toast from '@/components/Toast';

const EMPTY_OPTIONS: FeedOptions = {
  products: [], ports: [], companies: [], makes: [], packagings: [], origins: [], payments: [], shipments: [],
};

type FilterType = 'purchase' | 'sale';

const TH: React.CSSProperties = {
  padding: '16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--gray)',
};

function hasRole(role: string | undefined, ...keywords: string[]): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return keywords.some((k) => r.includes(k.toUpperCase()));
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [filter, setFilter] = useState<FilterType>('purchase');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [saleOrders, setSaleOrders] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedOptions, setFeedOptions] = useState<FeedOptions>(EMPTY_OPTIONS);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [viewingPurchaseId, setViewingPurchaseId] = useState<string | null>(null);
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean; visible: boolean }>({
    message: '', ok: true, visible: false,
  });

  const showToast = (message: string, ok: boolean) => {
    setToast({ message, ok, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  const canViewPurchases = hasRole(user?.role, 'ADMIN', 'PURCHASE');
  const canViewSales = hasRole(user?.role, 'ADMIN', 'SALES');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [purchases, salesResp] = await Promise.all([
        canViewPurchases ? fetchAllPurchases() : Promise.resolve([]),
        canViewSales
          ? fetchAllSales(0, 200)
          : Promise.resolve({ content: [], totalPages: 0, totalElements: 0, number: 0 }),
      ]);
      setPurchaseOrders(purchases);
      setSaleOrders(salesResp.content);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [canViewPurchases, canViewSales]);

  useEffect(() => {
    if (!canViewPurchases && canViewSales) setFilter('sale');
    else if (canViewPurchases) setFilter('purchase');
  }, [canViewPurchases, canViewSales]);

  useEffect(() => {
    if (isAuthenticated) loadOrders();
    fetchFeedOptions().then(setFeedOptions).catch(() => {});
  }, [isAuthenticated, loadOrders]);

  const handleConfirmPurchase = async (id: string) => {
    setConfirmingId(id);
    try {
      const updated = await confirmPurchase(id);
      setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      showToast(`Purchase order ${id} has been confirmed.`, true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) showToast('This purchase order is already confirmed.', false);
        else if (err.status === 403) showToast('You do not have permission to confirm purchase orders.', false);
        else if (err.status === 404) showToast('Purchase order not found.', false);
        else showToast(`Error: ${err.message}`, false);
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const handleConfirmSale = async (id: string) => {
    setConfirmingId(id);
    try {
      const updated = await confirmSale(id);
      setSaleOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      showToast(`Sale order ${id} has been confirmed.`, true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) showToast('This sale order is already confirmed.', false);
        else if (err.status === 403) showToast('You do not have permission to confirm sale orders.', false);
        else if (err.status === 404) showToast('Sale order not found.', false);
        else showToast(`Error: ${err.message}`, false);
      }
    } finally {
      setConfirmingId(null);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div style={{ padding: '32px' }}>
        <AccessBlock
          icon="🔒"
          title="Authentication Required"
          message="Please login to access the admin panel"
          action={
            <button onClick={() => router.push('/dashboard')} style={btnStyle('var(--blue)')}>
              Go to Dashboard
            </button>
          }
        />
      </div>
    );
  }

  if (!canViewPurchases && !canViewSales) {
    return (
      <div style={{ padding: '32px' }}>
        <AccessBlock icon="⛔" title="Access Denied" message="You don't have permission to view this section" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0', height: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Admin Panel</h1>
          <p>
            {canViewPurchases && canViewSales
              ? 'Manage and review all purchase and sale orders'
              : canViewPurchases
              ? 'Manage and review purchase orders'
              : 'Manage and review sale orders'}
          </p>
        </div>

        {canViewPurchases && canViewSales && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              background: 'var(--card)',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <TabButton
              label={`Purchase (${purchaseOrders.length})`}
              active={filter === 'purchase'}
              color="var(--blue)"
              onClick={() => setFilter('purchase')}
            />
            <TabButton
              label={`Sales (${saleOrders.length})`}
              active={filter === 'sale'}
              color="var(--teal)"
              onClick={() => setFilter('sale')}
            />
          </div>
        )}
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
            Loading orders…
          </div>
        ) : filter === 'purchase' && canViewPurchases ? (
          <PurchaseTable
            orders={purchaseOrders}
            confirmingId={confirmingId}
            onConfirm={handleConfirmPurchase}
            onView={setViewingPurchaseId}
          />
        ) : filter === 'sale' && canViewSales ? (
          <SaleTable
            orders={saleOrders}
            confirmingId={confirmingId}
            onConfirm={handleConfirmSale}
            onView={setViewingSaleId}
            onEdit={(sale) => setEditingId(sale.id)}
          />
        ) : null}
      </div>

      <PurchaseDetailModal purchaseId={viewingPurchaseId} onClose={() => setViewingPurchaseId(null)} />
      <SaleDetailModal saleId={viewingSaleId} onClose={() => setViewingSaleId(null)} />
      <SaleEditModal
        saleId={editingId}
        feedOptions={feedOptions}
        onClose={() => setEditingId(null)}
        onSaved={loadOrders}
      />
      <Toast message={toast.message} ok={toast.ok} visible={toast.visible} />
    </div>
  );
}

// ─── Purchase Table ───────────────────────────────────────────────────────────

function PurchaseTable({
  orders,
  confirmingId,
  onConfirm,
  onView,
}: {
  orders: PurchaseOrder[];
  confirmingId: string | null;
  onConfirm: (id: string) => void;
  onView: (id: string) => void;
}) {
  if (orders.length === 0) return <EmptyState label="purchase" />;
  return (
    <div
      className="table-scroll"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
        <thead>
          <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
            <th style={TH}>ID</th>
            <th style={TH}>Product</th>
            <th style={TH}>Company From</th>
            <th style={TH}>Company To</th>
            <th style={{ ...TH, textAlign: 'right' }}>Qty (MT)</th>
            <th style={{ ...TH, textAlign: 'right' }}>Price (FC)</th>
            <th style={TH}>Currency</th>
            <th style={TH}>Delivery Term</th>
            <th style={TH}>Port</th>
            <th style={{ ...TH, textAlign: 'center' }}>Status</th>
            <th style={{ ...TH, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const isConfirmed = o.status?.toUpperCase() === 'CONFIRMED';
            const isConfirming = confirmingId === o.id;
            return (
              <tr
                key={o.id}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.id}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{o.product}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.companyFrom}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.companyTo}</td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right' }}>
                  {o.quantity.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                  {o.priceFc.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.currency ?? '—'}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.deliveryTerm ?? '—'}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.port ?? '—'}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <StatusBadge status={o.status} />
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <ActionMenu items={[
                    { label: 'View Details', onClick: () => onView(o.id) },
                    ...(!isConfirmed ? [{
                      label: isConfirming ? 'Confirming…' : 'Confirm Order',
                      onClick: () => onConfirm(o.id),
                      color: '#48bb78',
                      disabled: isConfirming,
                    }] : []),
                  ]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sale Table ───────────────────────────────────────────────────────────────

function SaleTable({
  orders,
  confirmingId,
  onConfirm,
  onView,
  onEdit,
}: {
  orders: SaleEntry[];
  confirmingId: string | null;
  onConfirm: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (sale: SaleEntry) => void;
}) {
  if (orders.length === 0) return <EmptyState label="sale" />;
  return (
    <div
      className="table-scroll"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
        <thead>
          <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
            <th style={TH}>ID</th>
            <th style={TH}>Date</th>
            <th style={TH}>Product</th>
            <th style={TH}>Company To</th>
            <th style={TH}>Company From</th>
            <th style={{ ...TH, textAlign: 'right' }}>Qty (MT)</th>
            <th style={{ ...TH, textAlign: 'right' }}>Price (₹)</th>
            <th style={TH}>Delivery Term</th>
            <th style={TH}>Port</th>
            <th style={{ ...TH, textAlign: 'center' }}>Status</th>
            <th style={{ ...TH, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const isConfirmed = o.status?.toUpperCase() === 'CONFIRMED';
            const isConfirming = confirmingId === o.id;
            return (
              <tr
                key={o.id}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.id}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.date}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{o.product}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.companyTo}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.companyFrom}</td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right' }}>
                  {o.quantity.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                  ₹{o.price.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.deliveryTerm ?? '—'}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.port ?? '—'}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <StatusBadge status={o.status} />
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <ActionMenu items={[
                    { label: 'View Details', onClick: () => onView(o.id) },
                    ...(!isConfirmed ? [
                      { label: 'Edit', onClick: () => onEdit(o) },
                      {
                        label: isConfirming ? 'Confirming…' : 'Confirm Order',
                        onClick: () => onConfirm(o.id),
                        color: '#48bb78',
                        disabled: isConfirming,
                      },
                    ] : []),
                  ]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? 'UNKNOWN';
  const map: Record<string, { bg: string; color: string }> = {
    CONFIRMED:   { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    UNCONFIRMED: { bg: 'rgba(237,137,54,0.15)', color: '#ed8936' },
    CANCELLED:   { bg: 'rgba(245,101,101,0.15)', color: '#f56565' },
  };
  const style = map[s.toUpperCase()] ?? { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color,
      }}
    >
      {s}
    </span>
  );
}

function TabButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 24px',
        background: active ? color : 'transparent',
        color: active ? 'white' : 'var(--text)',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px',
        background: 'var(--card)',
        borderRadius: '12px',
        border: '2px dashed var(--border)',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
        No {label} orders found
      </h3>
      <p style={{ color: 'var(--gray)' }}>Orders will appear here once created</p>
    </div>
  );
}

function AccessBlock({
  icon,
  title,
  message,
  action,
}: {
  icon: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px',
        background: 'var(--card)',
        borderRadius: '12px',
        border: '2px dashed var(--border)',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--gray)', marginBottom: action ? '20px' : 0 }}>{message}</p>
      {action}
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '10px 24px',
    background: bg,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  };
}
