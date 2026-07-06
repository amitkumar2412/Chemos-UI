'use client';

import type { PunchEntry } from '@/lib/types';
import { getProductName } from '@/lib/api';

interface TodayPunchesProps {
  entries: PunchEntry[];
  onDelete: (id: number) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function marketStatusClass(status: string) {
  if (status === 'Ready Market') return 'Ready';
  if (status === 'Incoming') return 'Incoming';
  if (status === 'Spot') return 'Spot';
  return '';
}

export default function TodayPunches({ entries, onDelete, page, totalPages, total, onPageChange }: TodayPunchesProps) {
  const totalQty = entries.reduce((s, r) => s + Number(r.quantity), 0);
  const totalValue = entries.reduce((s, r) => s + Number(r.quantity) * Number(r.price_inr), 0);

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-t">📋 Punch-ins Today</div>
        <div className="summary-bar">
          <span>
            Total <strong>{total}</strong> ·{' '}
            Qty <strong>{totalQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })} MT</strong> ·{' '}
            Value <strong>₹{Math.round(totalValue).toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>
      <div className="card-body">
        <div className="punch-list">
          {entries.length === 0 ? (
            <div className="punch-empty">
              No punch-ins yet today. The first one shows up here the moment you submit.
            </div>
          ) : (
            entries.map((r) => {
              const t = new Date(r.ts).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: false,
              });
              const qty = Number(r.quantity);
              const offerUsd = Number(r.offer_usd);
              const priceInr = Number(r.price_inr);
              const cls = marketStatusClass(r.market_status);

              return (
                <div key={r.id} className="punch-row">
                  {/* Time */}
                  <div className="punch-time">{t}</div>

                  {/* Company To / From */}
                  <div className="punch-company">
                    <div>{r.company_to}</div>
                    <div className="punch-sub">← {r.company_from}</div>
                  </div>

                  {/* Product + Port */}
                  <div className="punch-product">
                    <div>{getProductName(r.product)}</div>
                    {r.port && <div className="punch-sub">@ {r.port}</div>}
                  </div>

                  {/* Quantity */}
                  <div className="punch-qty">
                    {qty.toLocaleString('en-IN', { maximumFractionDigits: 2 })} MT
                  </div>

                  {/* Offer + Price stacked */}
                  <div className="punch-prices">
                    <div className="punch-offer">${offerUsd.toLocaleString('en-IN')}</div>
                    <div className="punch-rate">₹{priceInr.toLocaleString('en-IN')}</div>
                  </div>

                  {/* Market Status */}
                  <div>
                    {cls && (
                      <span className={`punch-avail ${cls}`}>{r.market_status}</span>
                    )}
                    {r.origin && <div className="punch-sub" style={{ marginTop: '4px' }}>{r.origin}</div>}
                  </div>

                  {/* Delete */}
                  <button
                    className="punch-del"
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete punch-in #${r.id}?`)) onDelete(r.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pg-btn"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              ← Prev
            </button>
            <span className="pg-info">Page {page} of {totalPages}</span>
            <button
              className="pg-btn"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
