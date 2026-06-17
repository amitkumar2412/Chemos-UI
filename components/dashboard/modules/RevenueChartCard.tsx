'use client';

import { useState } from 'react';
import ChartPlaceholder from '../ChartPlaceholder';
import type { RevenueDataset } from '../types';

interface RevenueChartCardProps {
  data: Record<string, RevenueDataset>;
}

export default function RevenueChartCard({ data }: RevenueChartCardProps) {
  const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');
  // data[view] is available for wiring to a chart library
  void data[view];

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div className="db-card-title">📊 Revenue · Cost · Profit</div>
        <div className="db-toggle-group">
          {(['monthly', 'quarterly'] as const).map((v) => (
            <button
              key={v}
              className={`db-toggle-btn${view === v ? ' active' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'monthly' ? 'Monthly' : 'Quarterly'}
            </button>
          ))}
        </div>
      </div>
      <div className="db-card-body">
        <ChartPlaceholder title={`Revenue / Cost / Profit — ${view}`} size="md" />
      </div>
    </div>
  );
}
