'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAllPurchases,
  fetchAllSalesComplete,
  confirmPurchase,
  unconfirmPurchase,
  cancelPurchase,
  confirmSale,
  unconfirmSale,
  cancelSale,
  fetchFeedOptions,
  getPortName,
  getProductName,
  getStatusName,
  getStatusId,
  type PurchaseOrder,
  type StatusValue,
} from '@/lib/api';
import type { SaleEntry, FeedOptions } from '@/lib/types';
import { useAppSelector } from '@/lib/redux/hooks';
import { ApiError } from '@/lib/apiClient';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import PurchaseEditModal from '@/components/PurchaseEditModal';
import SaleDetailModal from '@/components/SaleDetailModal';
import SaleEditModal from '@/components/SaleEditModal';
import ActionMenu from '@/components/ActionMenu';
import Toast from '@/components/Toast';

const EMPTY_OPTIONS: FeedOptions = {
  products: [], ports: [], companies: [], makes: [], packagings: [], origins: [], payments: [], shipments: [],
};

type FilterType = 'purchase' | 'sale';
type OrderAction = 'confirm' | 'unconfirm' | 'cancel';

const PAGE_SIZE = 15;

const ACTION_VERB: Record<OrderAction, string> = {
  confirm: 'confirmed',
  unconfirm: 'unconfirmed',
  cancel: 'cancelled',
};

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
  const [purchasePage, setPurchasePage] = useState(0);
  const [salePage, setSalePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedOptions, setFeedOptions] = useState<FeedOptions>(EMPTY_OPTIONS);
  const [actioning, setActioning] = useState<{ id: string; action: OrderAction } | null>(null);
  const [viewingPurchaseId, setViewingPurchaseId] = useState<string | null>(null);
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
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
      const [purchases, sales] = await Promise.all([
        canViewPurchases ? fetchAllPurchases() : Promise.resolve([]),
        canViewSales ? fetchAllSalesComplete() : Promise.resolve([]),
      ]);
      setPurchaseOrders(purchases);
      setSaleOrders(sales);
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
    if (filter === 'purchase') setPurchasePage(0);
    else setSalePage(0);
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated) loadOrders();
    fetchFeedOptions().then(setFeedOptions).catch(() => {});
  }, [isAuthenticated, loadOrders]);

  const PURCHASE_ACTIONS: Record<OrderAction, (id: string) => Promise<PurchaseOrder>> = {
    confirm: confirmPurchase,
    unconfirm: unconfirmPurchase,
    cancel: cancelPurchase,
  };

  const SALE_ACTIONS: Record<OrderAction, (id: string) => Promise<SaleEntry>> = {
    confirm: confirmSale,
    unconfirm: unconfirmSale,
    cancel: cancelSale,
  };

  const handlePurchaseAction = async (id: string, action: OrderAction) => {
    setActioning({ id, action });
    try {
      const updated = await PURCHASE_ACTIONS[action](id);
      setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      showToast(`Purchase order ${id} has been ${ACTION_VERB[action]}.`, true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) showToast(`This purchase order is already ${ACTION_VERB[action]}.`, false);
        else if (err.status === 403) showToast(`You do not have permission to ${action} purchase orders.`, false);
        else if (err.status === 404) showToast('Purchase order not found.', false);
        else showToast(`Error: ${err.message}`, false);
      }
    } finally {
      setActioning(null);
    }
  };

  const handleSaleAction = async (id: string, action: OrderAction) => {
    setActioning({ id, action });
    try {
      const updated = await SALE_ACTIONS[action](id);
      setSaleOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      showToast(`Sale order ${id} has been ${ACTION_VERB[action]}.`, true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) showToast(`This sale order is already ${ACTION_VERB[action]}.`, false);
        else if (err.status === 403) showToast(`You do not have permission to ${action} sale orders.`, false);
        else if (err.status === 404) showToast('Sale order not found.', false);
        else showToast(`Error: ${err.message}`, false);
      }
    } finally {
      setActioning(null);
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

  const purchaseTotalPages = Math.max(1, Math.ceil(purchaseOrders.length / PAGE_SIZE));
  const saleTotalPages = Math.max(1, Math.ceil(saleOrders.length / PAGE_SIZE));
  const pagedPurchaseOrders = purchaseOrders.slice(
    purchasePage * PAGE_SIZE,
    purchasePage * PAGE_SIZE + PAGE_SIZE
  );
  const pagedSaleOrders = saleOrders.slice(salePage * PAGE_SIZE, salePage * PAGE_SIZE + PAGE_SIZE);

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
          <>
            <PurchaseTable
              orders={pagedPurchaseOrders}
              actioning={actioning}
              onAction={handlePurchaseAction}
              onView={setViewingPurchaseId}
              onEdit={setEditingPurchaseId}
            />
            <PaginationBar
              page={purchasePage}
              totalPages={purchaseTotalPages}
              totalItems={purchaseOrders.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPurchasePage}
            />
          </>
        ) : filter === 'sale' && canViewSales ? (
          <>
            <SaleTable
              orders={pagedSaleOrders}
              actioning={actioning}
              onAction={handleSaleAction}
              onView={setViewingSaleId}
              onEdit={(sale) => setEditingId(sale.id)}
            />
            <PaginationBar
              page={salePage}
              totalPages={saleTotalPages}
              totalItems={saleOrders.length}
              pageSize={PAGE_SIZE}
              onPageChange={setSalePage}
            />
          </>
        ) : null}
      </div>

      <PurchaseDetailModal purchaseId={viewingPurchaseId} onClose={() => setViewingPurchaseId(null)} />
      <PurchaseEditModal
        purchaseId={editingPurchaseId}
        feedOptions={feedOptions}
        onClose={() => setEditingPurchaseId(null)}
        onSaved={loadOrders}
      />
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

// ─── Action Menu Helper ────────────────────────────────────────────────────────

function orderActionItems(
  orderId: string,
  actioning: { id: string; action: OrderAction } | null,
  onAction: (id: string, action: OrderAction) => void
) {
  const busyAction = actioning?.id === orderId ? actioning.action : null;
  return [
    {
      label: busyAction === 'confirm' ? 'Confirming…' : 'Confirm Order',
      onClick: () => onAction(orderId, 'confirm'),
      color: '#48bb78',
      disabled: busyAction !== null,
    },
    {
      label: busyAction === 'unconfirm' ? 'Unconfirming…' : 'Unconfirm Order',
      onClick: () => onAction(orderId, 'unconfirm'),
      color: '#ed8936',
      disabled: busyAction !== null,
    },
    {
      label: busyAction === 'cancel' ? 'Cancelling…' : 'Cancel Order',
      onClick: () => onAction(orderId, 'cancel'),
      color: '#f56565',
      disabled: busyAction !== null,
    },
  ];
}

// ─── Purchase Table ───────────────────────────────────────────────────────────

function PurchaseTable({
  orders,
  actioning,
  onAction,
  onView,
  onEdit,
}: {
  orders: PurchaseOrder[];
  actioning: { id: string; action: OrderAction } | null;
  onAction: (id: string, action: OrderAction) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
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
            return (
              <tr
                key={o.id}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.id}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{getProductName(o.product)}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.companyFrom}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.companyTo}</td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right' }}>
                  {o.quantity != null ? o.quantity.toLocaleString('en-IN') : '—'}
                </td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                  {o.priceFc != null ? o.priceFc.toLocaleString('en-IN') : '—'}
                </td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.currency ?? '—'}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.deliveryTerm ?? '—'}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{getPortName(o.port)}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <StatusBadge status={o.status} />
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <ActionMenu items={[
                    { label: 'View Details', onClick: () => onView(o.id) },
                    { label: 'Edit', onClick: () => onEdit(o.id) },
                    ...orderActionItems(o.id, actioning, onAction),
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
  actioning,
  onAction,
  onView,
  onEdit,
}: {
  orders: SaleEntry[];
  actioning: { id: string; action: OrderAction } | null;
  onAction: (id: string, action: OrderAction) => void;
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
            return (
              <tr
                key={o.id}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.id}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.date}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{getProductName(o.product)}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.companyTo}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{o.companyFrom}</td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right' }}>
                  {o.quantity != null ? o.quantity.toLocaleString('en-IN') : '—'}
                </td>
                <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                  {o.price != null ? `₹${o.price.toLocaleString('en-IN')}` : '—'}
                </td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{o.deliveryTerm ?? '—'}</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{getPortName(o.port)}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <StatusBadge status={o.status} />
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <ActionMenu items={[
                    { label: 'View Details', onClick: () => onView(o.id) },
                    { label: 'Edit', onClick: () => onEdit(o) },
                    ...orderActionItems(o.id, actioning, onAction),
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

function StatusBadge({ status }: { status?: StatusValue }) {
  const name = getStatusName(status);
  const id = getStatusId(status) || name;
  const map: Record<string, { bg: string; color: string }> = {
    CONFIRMED:   { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    UNCONFIRMED: { bg: 'rgba(237,137,54,0.15)', color: '#ed8936' },
    CANCELLED:   { bg: 'rgba(245,101,101,0.15)', color: '#f56565' },
  };
  const style = map[id.toUpperCase()] ?? { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' };
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
      {name}
    </span>
  );
}

function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;
  const startEntry = page * pageSize + 1;
  const endEntry = Math.min(page * pageSize + pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        padding: '0 4px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--gray)' }}>
        Showing {startEntry}–{endEntry} of {totalItems} orders
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <PaginationButton label="«" onClick={() => onPageChange(0)} disabled={page === 0} />
        <PaginationButton label="‹" onClick={() => onPageChange(page - 1)} disabled={page === 0} />

        {buildPageRange(page, totalPages).map((item, i) =>
          item === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--gray)', fontSize: '14px' }}>
              …
            </span>
          ) : (
            <PaginationButton
              key={item}
              label={String((item as number) + 1)}
              onClick={() => onPageChange(item as number)}
              active={item === page}
            />
          )
        )}

        <PaginationButton
          label="›"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        />
        <PaginationButton
          label="»"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
        />
      </div>
    </div>
  );
}

function PaginationButton({
  label,
  onClick,
  disabled = false,
  active = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '34px',
        height: '34px',
        padding: '0 8px',
        border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: '6px',
        background: active ? 'var(--blue)' : 'var(--card)',
        color: active ? 'white' : disabled ? 'var(--gray)' : 'var(--text)',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | '...')[] = [];
  const addPage = (p: number) => pages.push(p);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== '...') pages.push('...');
  };

  addPage(0);
  if (current > 3) addEllipsis();

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) addPage(i);

  if (current < total - 4) addEllipsis();
  addPage(total - 1);

  return pages;
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
