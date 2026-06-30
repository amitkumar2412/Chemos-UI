'use client';

import { useState, useRef } from 'react';
import { exportPhysicalStockCsv, importPhysicalStock, type ImportPhysicalStockResult } from '@/lib/api';

interface UploadRecord {
  fileName: string;
  timestamp: string;
  result: ImportPhysicalStockResult;
}

export default function PurchaseTemplatePage() {
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const csv = await exportPhysicalStockCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'purchase_physical_stock_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setUploadError('Failed to download template. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setUploadError('Only CSV files are supported.');
      e.target.value = '';
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const result = await importPhysicalStock(file);
      setHistory((prev) => [
        {
          fileName: file.name,
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
          result,
        },
        ...prev,
      ]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ padding: '0', height: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Purchase Template</h1>
          <p>Download the CSV template, fill in physical stock data, then upload</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: '10px 20px',
              background: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: downloading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.borderColor = 'var(--blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <path d="M14 10v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2" />
              <polyline points="5 7 8 10 11 7" />
              <line x1="8" y1="1" x2="8" y2="10" />
            </svg>
            {downloading ? 'Downloading…' : 'Template'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--blue), var(--teal))',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: uploading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 153, 225, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.3)';
            }}
          >
            {uploading ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                  <path d="M14 10v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2" />
                  <polyline points="5 5 8 2 11 5" />
                  <line x1="8" y1="2" x2="8" y2="10" />
                </svg>
                Upload
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {uploadError && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'rgba(245,101,101,0.1)',
              border: '1px solid rgba(245,101,101,0.3)',
              borderRadius: '8px',
              color: '#f56565',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <circle cx="8" cy="8" r="7" />
              <line x1="8" y1="5" x2="8" y2="8" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
            {uploadError}
            <button
              onClick={() => setUploadError(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f56565', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        {history.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              background: 'var(--navy-light)',
              borderRadius: '12px',
              border: '2px dashed var(--border)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No uploads yet
            </h3>
            <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
              Download the template CSV, fill in the physical stock data, then upload it here
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  padding: '10px 20px',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Download Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  background: 'var(--blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Upload CSV
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.map((record, idx) => (
              <ImportResultCard key={idx} record={record} isLatest={idx === 0} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ImportResultCard({ record, isLatest }: { record: UploadRecord; isLatest: boolean }) {
  const { fileName, timestamp, result } = record;
  const hasErrors = result.errors && result.errors.length > 0;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${isLatest ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: isLatest ? 'rgba(66,153,225,0.06)' : 'var(--navy-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"
            style={{ color: 'var(--blue)', flexShrink: 0 }}>
            <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V5z" />
            <polyline points="9 1 9 5 13 5" />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{fileName}</span>
          {isLatest && (
            <span style={{
              padding: '2px 8px',
              background: 'rgba(66,153,225,0.15)',
              color: 'var(--blue)',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.04em',
            }}>
              LATEST
            </span>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{timestamp}</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0', borderBottom: hasErrors ? '1px solid var(--border)' : undefined }}>
        <StatCell
          label="Updated"
          value={result.updated}
          color="#48bb78"
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
              <polyline points="2 8 6 12 14 4" />
            </svg>
          }
        />
        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
        <StatCell
          label="Skipped"
          value={result.skipped}
          color="#ed8936"
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
              <circle cx="8" cy="8" r="7" />
              <line x1="5" y1="8" x2="11" y2="8" />
            </svg>
          }
        />
        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
        <StatCell
          label="Errors"
          value={result.errors?.length ?? 0}
          color={hasErrors ? '#f56565' : 'var(--gray)'}
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
              <circle cx="8" cy="8" r="7" />
              <line x1="8" y1="5" x2="8" y2="9" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </svg>
          }
        />
      </div>

      {/* Error list */}
      {hasErrors && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#f56565', marginBottom: '10px' }}>
            Error Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.errors.map((err, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(245,101,101,0.08)',
                  border: '1px solid rgba(245,101,101,0.2)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#f56565',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {err}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', fontWeight: '500' }}>{label}</div>
      </div>
    </div>
  );
}
