'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { fetchSaleById } from '@/lib/api';
import type { SaleEntry } from '@/lib/types';

interface Props {
  saleId: string | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: 'var(--white)', fontWeight: '500' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '12px', fontWeight: '700', color: 'var(--blue)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '12px', paddingBottom: '6px',
        borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {children}
      </div>
    </div>
  );
}

export default function SaleDetailModal({ saleId, onClose }: Props) {
  const [order, setOrder] = useState<SaleEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    fetchSaleById(saleId)
      .then(setOrder)
      .catch((e) => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [saleId]);

  const fmt = (n: number | null | undefined) =>
    n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';

  return (
    <Modal isOpen={!!saleId} onClose={onClose} title={`Sale Order — ${saleId ?? ''}`} size="large">
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--red)' }}>
          {error}
        </div>
      )}
      {order && (
        <div>
          <Section title="Order Info">
            <Field label="SO ID" value={order.id} />
            <Field label="Date" value={order.date} />
            <Field label="Sales Type" value={order.salesType} />
            <Field label="Company To" value={order.companyTo} />
            <Field label="Company From" value={order.companyFrom} />
            <Field label="Product" value={order.product} />
            <Field label="Make" value={order.make} />
            <Field label="Packaging" value={order.packaging} />
            <Field label="Origin" value={order.origin} />
          </Section>

          <Section title="Pricing">
            <Field label="Price (₹)" value={`₹ ${fmt(order.price)}`} />
            <Field label="Market Price" value={fmt(order.marketPrice)} />
            <Field label="Market Status" value={order.marketStatus} />
          </Section>

          <Section title="Shipment & Logistics">
            <Field label="Quantity (MT)" value={`${fmt(order.quantity)} MT`} />
            <Field label="Delivery Term" value={order.deliveryTerm} />
            <Field label="Port" value={order.port} />
            <Field label="Storage Days" value={order.storageDays} />
            <Field label="Transit Tolerance" value={order.transitTolerance} />
            <Field label="Vessel Name" value={order.vesselName} />
          </Section>

          <Section title="Payment & Notes">
            <Field label="Payment" value={order.payment} />
            <Field label="Remarks" value={order.remarks} />
            <Field label="Message" value={order.message} />
          </Section>
        </div>
      )}
    </Modal>
  );
}
