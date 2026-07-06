'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import SaleEntryCard from '@/components/SaleEntryCard';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import ActionMenu from '@/components/ActionMenu';
import { fetchFeedOptions, fetchAllPurchases, createPunch, getProductName } from '@/lib/api';
import type { PurchaseOrder } from '@/lib/api';
import type { FeedOptions, SalePunchPayload } from '@/lib/types';

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

export default function PurchasesPage() {
  const [feedOptions, setFeedOptions] = useState<FeedOptions>(EMPTY_OPTIONS);
  const [entries, setEntries] = useState<PurchaseOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllPurchases();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedOptions().then(setFeedOptions).catch(() => {});
    loadPurchases();
  }, [loadPurchases]);

  const handleSubmitPunch = async (payload: SalePunchPayload) => {
    const data = await createPunch(payload);
    setIsCreateModalOpen(false);
    await loadPurchases();
    return data;
  };

  return (
    <div style={{ padding: '0', height: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p>Manage and track all purchase orders and transactions</p>
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
            Loading purchase orders...
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
              No purchase orders yet
            </h3>
            <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
              Create your first purchase order to get started
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
          <div className="table-scroll" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Company From</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Product</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Shipment</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Quantity</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Price (INR)</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Delivery Term</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Discharge Ports</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{entry.companyFrom}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{getProductName(entry.product)}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{entry.shipment}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{entry.quantity?.toLocaleString('en-IN') ?? '—'} MT</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>₹ {entry.priceInr?.toLocaleString('en-IN') ?? '—'}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{entry.deliveryTerm}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{entry.dischargePorts}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <StatusBadge status={entry.status} />
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <ActionMenu items={[
                        { label: 'View Details', onClick: () => setViewingId(entry.id) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase Detail Modal */}
      <PurchaseDetailModal
        purchaseId={viewingId}
        onClose={() => setViewingId(null)}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        title="Create Purchase Order"
        size="xlarge"
      >
        <SaleEntryCard 
          feedOptions={feedOptions} 
          onSubmit={handleSubmitPunch}
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
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color,
      }}
    >
      {s}
    </span>
  );
}
