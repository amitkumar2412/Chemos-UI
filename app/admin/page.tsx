'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeedOptions, fetchTodayPunches, fetchTodaySales, deletePunch, deleteSale } from '@/lib/api';
import type { PunchEntry, SaleEntry, FeedOptions } from '@/lib/types';
import { useAppSelector } from '@/lib/redux/hooks';
import { dummyPurchaseOrders, dummySaleOrders } from '@/lib/dummyData';

type FilterType = 'purchase' | 'sale';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [filter, setFilter] = useState<FilterType>('purchase');
  const [purchaseOrders, setPurchaseOrders] = useState<PunchEntry[]>([]);
  const [saleOrders, setSaleOrders] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Check permissions
  const canViewPurchases = user?.permissions.canViewPurchases || false;
  const canViewSales = user?.permissions.canViewSales || false;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Using dummy data for now - replace with real API calls later
      setPurchaseOrders(dummyPurchaseOrders);
      setSaleOrders(dummySaleOrders);
      
      // Real API call (commented out for testing with dummy data)
      // const today = new Date().toISOString().slice(0, 10);
      // const [purchases, sales] = await Promise.all([
      //   fetchTodayPunches(today, 1, 100),
      //   fetchTodaySales(today, 1, 100),
      // ]);
      // setPurchaseOrders(purchases.rows ?? []);
      // setSaleOrders(sales.rows ?? []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Set initial filter based on permissions
  useEffect(() => {
    if (!canViewPurchases && canViewSales) {
      setFilter('sale');
    } else if (canViewPurchases && !canViewSales) {
      setFilter('purchase');
    }
  }, [canViewPurchases, canViewSales]);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div style={{ padding: '32px', maxWidth: '1400px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--card)',
            borderRadius: '12px',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Authentication Required
          </h3>
          <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
            Please login to access the admin panel
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 24px',
              background: 'var(--blue)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if user has no permissions
  if (!canViewPurchases && !canViewSales) {
    return (
      <div style={{ padding: '32px', maxWidth: '1400px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--card)',
            borderRadius: '12px',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⛔</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Access Denied
          </h3>
          <p style={{ color: 'var(--gray)' }}>
            You don't have permission to view this section
          </p>
        </div>
      </div>
    );
  }

  const handleView = (type: FilterType, id: number) => {
    router.push(`/admin/${type}/${id}`);
  };

  const handleEdit = (type: FilterType, id: number) => {
    // For now, navigate to the respective order page
    router.push(type === 'purchase' ? '/purchases' : '/sales');
  };

  const handleConfirm = async (type: FilterType, id: number) => {
    if (!window.confirm(`Confirm ${type} order #${id}?`)) return;
    // In a real app, this would call a confirm endpoint
    alert(`Order #${id} confirmed!`);
  };

  const handleDelete = async (type: FilterType, id: number) => {
    if (!window.confirm(`Delete ${type} order #${id}?`)) return;
    try {
      if (type === 'purchase') {
        await deletePunch(id);
      } else {
        await deleteSale(id);
      }
      await loadOrders();
    } catch (error) {
      console.error(`Failed to delete ${type} order:`, error);
    }
  };

  // Determine which orders to display based on filter and permissions
  let displayedOrders: (PunchEntry | SaleEntry)[] = [];
  if (filter === 'purchase' && canViewPurchases) {
    displayedOrders = purchaseOrders;
  } else if (filter === 'sale' && canViewSales) {
    displayedOrders = saleOrders;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Admin Panel - {user.name}
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
            {canViewPurchases && canViewSales
              ? 'Manage and review all purchase and sale orders'
              : canViewPurchases
              ? 'Manage and review purchase orders'
              : 'Manage and review sale orders'}
          </p>
        </div>

        {/* Filter Toggle - Only show if user has access to both */}
        {canViewPurchases && canViewSales && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'var(--card)',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setFilter('purchase')}
              style={{
                padding: '10px 24px',
                background: filter === 'purchase' ? 'var(--blue)' : 'transparent',
                color: filter === 'purchase' ? 'white' : 'var(--text)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setFilter('sale')}
              style={{
                padding: '10px 24px',
                background: filter === 'sale' ? 'var(--teal)' : 'transparent',
                color: filter === 'sale' ? 'white' : 'var(--text)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sale Orders ({saleOrders.length})
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
          Loading orders...
        </div>
      ) : displayedOrders.length === 0 ? (
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
            No {filter} orders found
          </h3>
          <p style={{ color: 'var(--gray)' }}>Orders will appear here once created</p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Product</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>
                  {filter === 'purchase' ? 'Seller' : 'Buyer'}
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Quantity</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Price</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '16px', fontSize: '14px' }}>#{order.id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>
                    {new Date(order.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{order.product}</td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    {filter === 'purchase' 
                      ? (order as PunchEntry).company_from 
                      : (order as SaleEntry).company_to}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    {order.quantity.toLocaleString('en-IN')} MT
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    {filter === 'purchase'
                      ? `${(order as PunchEntry).currency} ${(order as PunchEntry).price_fc.toLocaleString('en-IN')}`
                      : `₹${(order as SaleEntry).price.toLocaleString('en-IN')}/kg`}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleView(filter, order.id)}
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
                      <button
                        onClick={() => handleEdit(filter, order.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--orange)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleConfirm(filter, order.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--green)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDelete(filter, order.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--red)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
