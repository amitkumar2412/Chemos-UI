'use client';

import { useState } from 'react';
import ChartPlaceholder from '../ChartPlaceholder';

type ForecastLens = 'trend' | 'news' | 'season' | 'supply';

const LENS_LABELS: Record<ForecastLens, string> = {
  trend:  'Trend',
  news:   'News-adj',
  season: 'Seasonal',
  supply: 'Supply Risk',
};

export default function ForecastChartCard() {
  const [lens, setLens]         = useState<ForecastLens>('trend');
  const [demandBias, setDemand] = useState(0);
  const [costShock, setCost]    = useState(0);

  return (
    <div className="db-card">
      <div className="db-card-header">
        <div>
          <div className="db-card-title">📈 Demand Forecast</div>
          <div className="db-card-subtitle">ML-powered · scenario analysis</div>
        </div>
        <div className="db-toggle-group">
          {(Object.keys(LENS_LABELS) as ForecastLens[]).map((l) => (
            <button
              key={l}
              className={`db-toggle-btn${lens === l ? ' active' : ''}`}
              onClick={() => setLens(l)}
            >
              {LENS_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="db-card-body">
        <ChartPlaceholder title={`Demand Forecast — ${LENS_LABELS[lens]}`} size="md" />

        <div className="db-grid-2" style={{ marginTop: 12, marginBottom: 0 }}>
          <div className="db-slider-group">
            <div className="db-slider-label">
              <span>Demand Bias</span>
              <span>{demandBias > 0 ? '+' : ''}{demandBias}%</span>
            </div>
            <input
              type="range"
              className="db-range"
              min={-30} max={30} value={demandBias}
              onChange={(e) => setDemand(Number(e.target.value))}
            />
          </div>
          <div className="db-slider-group">
            <div className="db-slider-label">
              <span>RM Cost Shock</span>
              <span>{costShock > 0 ? '+' : ''}{costShock}%</span>
            </div>
            <input
              type="range"
              className="db-range"
              min={-25} max={25} value={costShock}
              onChange={(e) => setCost(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
