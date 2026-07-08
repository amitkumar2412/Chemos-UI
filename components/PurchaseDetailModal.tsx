'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { fetchPurchaseById, getPortName, getProductName, getPaymentTermName, getOriginName } from '@/lib/api';
import type { PurchaseOrder } from '@/lib/api';

interface Props {
  purchaseId: string | null;
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

export default function PurchaseDetailModal({ purchaseId, onClose }: Props) {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    fetchPurchaseById(purchaseId)
      .then(setOrder)
      .catch((e) => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [purchaseId]);

  const fmt = (n: number | null | undefined) =>
    n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';

  return (
    <Modal isOpen={!!purchaseId} onClose={onClose} title={`Purchase Order — ${purchaseId ?? ''}`} size="large">
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
            <Field label="PO ID" value={order.id} />
            <Field label="Company To" value={order.companyTo} />
            <Field label="Company From" value={order.companyFrom} />
            <Field label="Purchase Type" value={order.purchaseType} />
            <Field label="Product" value={getProductName(order.product)} />
            <Field label="Make" value={order.make} />
            <Field label="Packaging" value={order.packaging} />
            <Field label="Origin" value={getOriginName(order.origin)} />
            <Field label="Vessel Name" value={order.vesselName} />
          </Section>

          <Section title="Pricing">
            <Field label="Price (FC)" value={fmt(order.priceFc)} />
            <Field label="Currency" value={order.currency ?? 'USD'} />
            <Field label="Offer (USD)" value={fmt(order.offerUsd)} />
            <Field label="Exchange Rate" value={fmt(order.exchangeRate)} />
            <Field label="Price (INR)" value={`₹ ${fmt(order.priceInr)}`} />
            <Field label="Market Price" value={fmt(order.marketPrice)} />
            <Field label="Cost Price" value={fmt(order.costPrice)} />
            <Field label="Replacement Cost" value={fmt(order.replacementCost)} />
            <Field label="Market Status" value={order.marketStatus} />
            <Field label="Price Type" value={order.priceType} />
          </Section>

          <Section title="Charges">
            <Field label="Expense" value={fmt(order.expense)} />
            <Field label="Custom Duty" value={fmt(order.customDuty)} />
            <Field label="SWS" value={fmt(order.sws)} />
            <Field label="ADD" value={fmt(order.add)} />
            <Field label="Other Expense" value={fmt(order.otherExpense)} />
          </Section>

          <Section title="Shipment & Logistics">
            <Field label="Quantity" value={`${fmt(order.quantity)} MT`} />
            <Field label="Shipment" value={order.shipment} />
            <Field label="Delivery Term" value={order.deliveryTerm} />
            <Field label="Port" value={getPortName(order.port)} />
            <Field label="Discharge Port" value={getPortName(order.dischargePort)} />
            <Field label="ETD" value={order.etd} />
            <Field label="ETA" value={order.eta} />
          </Section>

          <Section title="Payment">
            <Field label="Payment Term" value={getPaymentTermName(order.paymentTerm)} />
            <Field label="Payment Days" value={order.paymentDays} />
          </Section>
        </div>
      )}
    </Modal>
  );
}
