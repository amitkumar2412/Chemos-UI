'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchTodayPunches, fetchTodaySales } from '@/lib/api';
import type { PunchEntry, SaleEntry } from '@/lib/types';

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as 'purchase' | 'sale';
  const id = parseInt(params.id as string);

  const [order, setOrder] = useState<PunchEntry | SaleEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        if (type === 'purchase') {
          const data = await fetchTodayPunches(today, 1, 1000);
          const found = data.rows.find((o) => o.id === id);
          setOrder(found || null);
        } else {
          const data = await fetchTodaySales(today, 1, 1000);
          const found = data.content.find((o) => o.id === String(id));
          setOrder(found || null);
        }
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [type, id]);

  const handleFinalConfirm = async () => {
    setConfirming(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Order #${id} has been FINALIZED!`);
    setConfirming(false);
    router.push('/admin');
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: 'var(--gray)' }}>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Order Not Found</h2>
        <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
          The {type} order #{id} could not be found.
        </p>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '12px 24px',
            background: 'var(--blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Back to Admin
        </button>
      </div>
    );
  }

  const isPurchase = type === 'purchase';
  const purchaseOrder = isPurchase ? (order as PunchEntry) : null;
  const saleOrder = !isPurchase ? (order as SaleEntry) : null;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '8px 16px',
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Back to Admin
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {isPurchase ? 'Purchase' : 'Sale'} Order #{order.id}
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Created: {new Date(isPurchase ? (order as PunchEntry).ts : (order as SaleEntry).date).toLocaleString('en-IN', {
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Order Details Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Order Details</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {/* Common fields */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Product</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{order.product}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>
              {isPurchase ? 'Seller' : 'Buyer'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              {isPurchase ? purchaseOrder?.company_from : saleOrder?.companyTo}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Quantity</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{order.quantity.toLocaleString('en-IN')} MT</div>
          </div>

          {isPurchase && purchaseOrder && (
            <>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Buyer</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.company_to}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Price (FC)</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {purchaseOrder.currency} {purchaseOrder.price_fc.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Exchange Rate</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>₹{purchaseOrder.exchange_rate}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Price (₹/kg)</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  ₹{purchaseOrder.price_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Port</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.port}</div>
              </div>

              {purchaseOrder.vessel_name && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Vessel Name</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.vessel_name}</div>
                </div>
              )}

              {purchaseOrder.shipment && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Shipment</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.shipment}</div>
                </div>
              )}

              {purchaseOrder.origin && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Origin</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.origin}</div>
                </div>
              )}

              {purchaseOrder.make && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Make</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.make}</div>
                </div>
              )}

              {purchaseOrder.packaging && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Packaging</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.packaging}</div>
                </div>
              )}

              {purchaseOrder.delivery_term && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Delivery Term</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.delivery_term}</div>
                </div>
              )}

              {purchaseOrder.payment_days && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Payment</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.payment_days}</div>
                </div>
              )}

              {purchaseOrder.market_status && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Market Status</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{purchaseOrder.market_status}</div>
                </div>
              )}
            </>
          )}

          {!isPurchase && saleOrder && (
            <>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Sale Type</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{saleOrder.salesType}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Price</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  ₹{saleOrder.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Port</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{saleOrder.port}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Storage Days</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{saleOrder.storageDays} days</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Payment</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{saleOrder.payment}</div>
              </div>

              {saleOrder.salesPerson && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Sales Person</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{saleOrder.salesPerson}</div>
                </div>
              )}

              {saleOrder.brokerName && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Broker</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{saleOrder.brokerName}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '12px 24px',
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleFinalConfirm}
          disabled={confirming}
          style={{
            padding: '12px 32px',
            background: confirming ? 'var(--gray)' : 'linear-gradient(135deg, var(--green), var(--teal))',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: confirming ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
          }}
        >
          {confirming ? '⏳ Confirming...' : '✓ Final Confirm'}
        </button>
      </div>
    </div>
  );
}
