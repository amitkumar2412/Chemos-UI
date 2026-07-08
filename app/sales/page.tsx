'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import SaleForm from '@/components/SaleForm';
import SaleDetailModal from '@/components/SaleDetailModal';
import SaleEditModal from '@/components/SaleEditModal';
import ActionMenu from '@/components/ActionMenu';
import { fetchFeedOptions, fetchAllSales, createSale, getProductName, getPortName } from '@/lib/api';
import type { SaleEntry, FeedOptions, SaleFormPayload } from '@/lib/types';

const EMPTY_OPTIONS: FeedOptions = {
  products: [],
  ports: [],
  companies: [],
  makes: [],
  packagings: [],
  origins: [],
  payments: [],
  shipments: [],
};

const TH: React.CSSProperties = {
  padding: '16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--gray)',
};

const PAGE_SIZE = 10;

export default function SalesPage() {
  const [feedOptions, setFeedOptions] = useState<FeedOptions>(EMPTY_OPTIONS);
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadSales = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const data = await fetchAllSales(page, PAGE_SIZE);
      setEntries(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedOptions().then(setFeedOptions).catch(() => {});
    loadSales(0);
  }, [loadSales]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadSales(page);
  };

  const handleSubmitSale = async (payload: SaleFormPayload) => {
    const data = await createSale(payload);
    setIsCreateModalOpen(false);
    await loadSales(currentPage);
    return data;
  };

  const startEntry = currentPage * PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * PAGE_SIZE + entries.length, totalElements);

  return (
    <div style={{ padding: '0', height: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Sales Orders</h1>
          <p>Manage and track all sales orders and transactions</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--blue), var(--teal))',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 153, 225, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          Create Order
        </button>
      </div>

      {/* Content Area */}
      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
            Loading sales orders...
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              background: 'var(--navy-light)',
              borderRadius: '12px',
              border: '2px dashed var(--border)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No sales orders yet
            </h3>
            <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
              Create your first sales order to get started
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '10px 20px',
                background: 'var(--blue)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Create Order
            </button>
          </div>
        ) : (
          <>
            <div className="table-scroll" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                    <th style={TH}>Date</th>
                    <th style={TH}>Company To</th>
                    <th style={TH}>Company From</th>
                    <th style={TH}>Product</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Quantity (MT)</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Price (₹)</th>
                    <th style={TH}>Delivery Term</th>
                    <th style={TH}>Port</th>
                    <th style={{ ...TH, textAlign: 'center' }}>Status</th>
                    <th style={{ ...TH, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>
                        {sale.date}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{sale.companyTo}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{sale.companyFrom}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{getProductName(sale.product)}</td>
                      <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right' }}>
                        {sale.quantity.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                        ₹{sale.price.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{sale.deliveryTerm ?? '—'}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{getPortName(sale.port)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <StatusBadge status={sale.status} />
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <ActionMenu items={[
                          { label: 'View Details', onClick: () => setViewingId(sale.id) },
                          { label: 'Edit', onClick: () => setEditingId(sale.id) },
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                Showing {startEntry}–{endEntry} of {totalElements} orders
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PaginationButton
                  label="«"
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                />
                <PaginationButton
                  label="‹"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                />

                {buildPageRange(currentPage, totalPages).map((item, i) =>
                  item === '...' ? (
                    <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--gray)', fontSize: '14px' }}>
                      …
                    </span>
                  ) : (
                    <PaginationButton
                      key={item}
                      label={String((item as number) + 1)}
                      onClick={() => handlePageChange(item as number)}
                      active={item === currentPage}
                    />
                  )
                )}

                <PaginationButton
                  label="›"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                />
                <PaginationButton
                  label="»"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        saleId={viewingId}
        onClose={() => setViewingId(null)}
      />

      {/* Edit Modal */}
      <SaleEditModal
        saleId={editingId}
        feedOptions={feedOptions}
        onClose={() => setEditingId(null)}
        onSaved={() => loadSales(currentPage)}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sales Order"
        size="xlarge"
      >
        <SaleForm
          feedOptions={feedOptions}
          onSubmit={handleSubmitSale}
        />
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? 'UNKNOWN';
  const colorMap: Record<string, { bg: string; color: string }> = {
    CONFIRMED:   { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    UNCONFIRMED: { bg: 'rgba(237,137,54,0.15)', color: '#ed8936' },
    CANCELLED:   { bg: 'rgba(245,101,101,0.15)', color: '#f56565' },
  };
  const style = colorMap[s.toUpperCase()] ?? { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.04em',
        background: style.bg,
        color: style.color,
        textTransform: 'uppercase',
      }}
    >
      {s}
    </span>
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
