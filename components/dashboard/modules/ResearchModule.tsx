'use client';

import { useState } from 'react';
import ChartPlaceholder from '../ChartPlaceholder';
import type { ShockChemical, NewsItem } from '../types';

interface ResearchModuleProps {
  shockChemicals: ShockChemical[];
  news: NewsItem[];
}

export default function ResearchModule({ shockChemicals, news }: ResearchModuleProps) {
  // Track shock percentages locally (separate from immutable props)
  const [shockPcts, setShockPcts] = useState<number[]>(() => shockChemicals.map(() => 0));

  const updateShock = (idx: number, value: number) =>
    setShockPcts((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const sentimentColor = (s: string) =>
    s === 'pos' ? 'var(--green)' : s === 'neg' ? 'var(--red)' : 'var(--gold)';
  const sentimentLabel = (s: string) =>
    s === 'pos' ? 'BULLISH' : s === 'neg' ? 'BEARISH' : 'NEUTRAL';

  return (
    <div>
      <div className="db-grid-2">
        {/* Supply Chain Shock Model */}
        <div className="db-card">
          <div className="db-card-header">
            <div>
              <div className="db-card-title">⚡ Supply Shock Model</div>
              <div className="db-card-subtitle">Drag sliders to simulate supply disruptions</div>
            </div>
          </div>
          <div className="db-card-body">
            {shockChemicals.map((sc, i) => {
              const pct = shockPcts[i] ?? 0;
              return (
                <div key={sc.name} className="db-shock-row">
                  <div className="db-shock-head">
                    <span className="db-shock-name">{sc.name}</span>
                    <span className={`db-shock-val ${pct < 0 ? 'neg' : 'pos'}`}>
                      {pct > 0 ? '+' : ''}{pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    className="db-range db-shock-range"
                    min={-50} max={50} value={pct}
                    onChange={(e) => updateShock(i, Number(e.target.value))}
                  />
                  <div className="db-shock-impact">
                    <span>Price impact: </span>
                    <span style={{ color: pct < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      {pct < 0 ? '-' : '+'}₹{Math.abs(Math.round(sc.base * pct / 100)).toLocaleString('en-IN')}/MT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Intelligence News */}
        <div className="db-card">
          <div className="db-card-header">
            <div>
              <div className="db-card-title">📰 Market Intelligence</div>
              <div className="db-card-subtitle">AI-curated news &amp; signals</div>
            </div>
          </div>
          <div className="db-card-body" style={{ padding: 0 }}>
            <div className="db-news-feed">
              {news.map((item, i) => (
                <div key={i} className="db-news-item">
                  <div className="db-news-item-head">
                    <div>
                      <div className="db-news-title">{item.title}</div>
                      <div className="db-news-meta">{item.source} · {item.time} · {item.tags.join(', ')}</div>
                    </div>
                    <span className="db-news-sentiment" style={{ color: sentimentColor(item.sentiment) }}>
                      {sentimentLabel(item.sentiment)}
                    </span>
                  </div>
                  <div className="db-news-summary">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="db-card" style={{ marginTop: 16 }}>
        <div className="db-card-header">
          <div>
            <div className="db-card-title">Correlation Matrix</div>
            <div className="db-card-subtitle">Chemical price correlations · Pearson R</div>
          </div>
        </div>
        <div className="db-card-body">
          <ChartPlaceholder title="Correlation Heat Map Matrix" size="md" />
        </div>
      </div>
    </div>
  );
}
