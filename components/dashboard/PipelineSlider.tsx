'use client';

import { useState } from 'react';
import type { PipelineStage } from './types';

interface PipelineSliderProps {
  stages: PipelineStage[];
}

export default function PipelineSlider({ stages }: PipelineSliderProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(
    stages.findIndex((s) => s.status === 'active'),
  );

  // Overall progress: average pct of done + active stages
  const overallPct = Math.round(
    stages.reduce((sum, s) => sum + s.pct, 0) / stages.length,
  );

  const selected = activeIdx !== null ? stages[activeIdx] : null;

  return (
    <div className="db-pipeline">
      <div className="db-pipe-header">
        <span className="db-pipe-title">🔄 Value Chain Pipeline</span>
        <span>
          Overall progress:{' '}
          <span className="db-pipe-pct">{overallPct}%</span>
        </span>
      </div>

      {/* Progress track */}
      <div className="db-pipe-track">
        <div className="db-pipe-fill" style={{ width: `${overallPct}%` }} />
      </div>

      {/* Stage buttons */}
      <div className="db-pipe-stages">
        {stages.map((stage, i) => (
          <button
            key={stage.label}
            className={`db-pipe-st ${stage.status}${activeIdx === i ? ' active' : ''}`}
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
          >
            <div className="db-pipe-st-icon">{stage.icon}</div>
            <div className="db-pipe-st-name">{stage.label}</div>
          </button>
        ))}
      </div>

      {/* Stage detail */}
      {selected && (
        <div className="db-pipe-detail">
          <div className="db-pipe-detail-title">
            {selected.icon} {selected.label}{' '}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--gray)', fontWeight: 400 }}>
              — {selected.pct}% complete
            </span>
          </div>
          <div className="db-pipe-detail-text">{selected.insight}</div>
          <div className="db-pipe-vars">
            {selected.vars.map((v) => (
              <span key={v} className="db-pipe-var">{v}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
