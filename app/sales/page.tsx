'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import SaleForm from '@/components/SaleForm';
import SaleDetailModal from '@/components/SaleDetailModal';
import { fetchFeedOptions, fetchAllSales, createSale } from '@/lib/api';
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

export default function SalesPage() {
  const [feedOptions, setFeedOptions] = useState<FeedOptions>(EMPTY_OPTIONS);
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllSales();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedOptions().then(setFeedOptions).catch(() => {});
    loadSales();
  }, [loadSales]);

  const handleSubmitSale = async (payload: SaleFormPayload) => {
    const data = await createSale(payload);
    setIsCreateModalOpen(false);
    await loadSales();
    return data;
  };

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
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{sale.product}</td>
                    <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right' }}>
                      {sale.quantity.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                      ₹{sale.price.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{sale.deliveryTerm ?? '—'}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{sale.port ?? '—'}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setViewingId(sale.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--blue)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        saleId={viewingId}
        onClose={() => setViewingId(null)}
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
