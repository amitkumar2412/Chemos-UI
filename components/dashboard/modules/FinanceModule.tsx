'use client';

import ChartPlaceholder from '../ChartPlaceholder';
import { formatCurrency } from '../utils';
import type { FinanceOffer, CashflowItem, Currency } from '../types';

interface FinanceModuleProps {
  offers: FinanceOffer[];
  cashflow: CashflowItem[];
  currency: Currency;
}

export default function FinanceModule({ offers, cashflow, currency }: FinanceModuleProps) {
  return (
    <div>
      {/* Top Offers */}
      <div className="db-card" style={{ marginBottom: 16 }}>
        <div className="db-card-header">
          <div>
            <div className="db-card-title">💰 Top Finance Offers</div>
            <div className="db-card-subtitle">High-margin opportunities this period</div>
          </div>
        </div>
        <div className="db-card-body" style={{ padding: 0 }}>
          <table className="db-offers-tbl">
            <thead>
              <tr>
                <th>Item</th><th>Customer</th><th>Port</th>
                <th>Qty (MT)</th><th>Revenue</th><th>Margin%</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o, i) => {
                const revenue = (o.sellPrice * o.qty) / 100000; // in lakhs
                const margin = Math.round(((o.sellPrice - o.buyPrice) / o.sellPrice) * 100 * 10) / 10;
                const isPositive = o.spread > 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{o.item}</td>
                    <td>{o.company}</td>
                    <td>{o.port}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{o.qty}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>
                      ₹{revenue.toFixed(1)}L
                    </td>
                    <td>
                      <span style={{ color: margin >= 25 ? 'var(--green)' : margin >= 15 ? 'var(--teal)' : 'var(--gold)', fontWeight: 700 }}>
                        {margin}%
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: isPositive ? 'rgba(0,225,150,.18)' : 'rgba(220,50,50,.15)', color: isPositive ? 'var(--green)' : 'var(--red)', fontWeight: 800, fontSize: 9 }}>
                        {o.recommendation === 'PURSUE' ? '✓' : o.recommendation === 'DECLINE' ? '✗' : '~'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="db-grid-2">
        {/* Cashflow Waterfall */}
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">Cashflow Waterfall</div>
          </div>
          <div className="db-card-body">
            {/* Mini ledger preview */}
            <div style={{ marginBottom: 12 }}>
              {cashflow.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ color: 'var(--gray)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: row.value >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    {row.value >= 0 ? '+' : ''}{formatCurrency(Math.abs(row.value), currency)}
                  </span>
                </div>
              ))}
            </div>
            <ChartPlaceholder title="Cashflow Waterfall Chart" size="sm" />
          </div>
        </div>

        {/* Margin Simulator */}
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">Margin Simulator</div>
          </div>
          <div className="db-card-body">
            <ChartPlaceholder title="Price vs Margin Simulation Chart" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
