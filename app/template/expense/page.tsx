'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Modal from '@/components/Modal';
import { fetchPlUploads, fetchPlUploadEntries, uploadPlExpense, type PlUpload, type PlUploadEntry } from '@/lib/api';

export default function ExpenseTemplatePage() {
  const [uploads, setUploads] = useState<PlUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<PlUpload | null>(null);
  const [entries, setEntries] = useState<PlUploadEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUploads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlUploads();
      setUploads([...data].sort((a, b) => b.uploadId - a.uploadId));
    } catch (error) {
      console.error('Failed to load expense uploads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  useEffect(() => {
    if (!selectedUpload) return;
    let cancelled = false;
    setEntriesLoading(true);
    setEntriesError(null);
    const date = selectedUpload.uploadedAt.split('T')[0];
    fetchPlUploadEntries(selectedUpload.uploadId, date)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch((err) => {
        if (!cancelled) setEntriesError(err instanceof Error ? err.message : 'Failed to load entries.');
      })
      .finally(() => { if (!cancelled) setEntriesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedUpload]);

  const closeEntriesModal = () => {
    setSelectedUpload(null);
    setEntries([]);
    setEntriesError(null);
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
      await uploadPlExpense(file);
      await loadUploads();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{ padding: '0', height: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Expense</h1>
          <p>Upload and track profit &amp; loss expense data</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '12px 24px',
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
            flexShrink: 0,
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
              <span style={{ fontSize: '18px' }}>+</span>
              Upload Expense
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

      {/* Content Area */}
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
            Loading expense uploads...
          </div>
        ) : uploads.length === 0 ? (
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
              No expense uploads yet
            </h3>
            <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
              Upload a CSV of profit &amp; loss expense data to get started
            </p>
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
              Upload Expense
            </button>
          </div>
        ) : (
          <div className="table-scroll" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Upload ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Uploaded By</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Uploaded At</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Rows</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr
                    key={upload.uploadId}
                    onClick={() => setSelectedUpload(upload)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--navy-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>#{upload.uploadId}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{upload.uploadedBy}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>{formatTimestamp(upload.uploadedAt)}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{upload.rowCount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entries Modal */}
      <Modal
        isOpen={!!selectedUpload}
        onClose={closeEntriesModal}
        title={selectedUpload ? `Upload #${selectedUpload.uploadId} — Expense Entries` : ''}
        size="large"
      >
        {entriesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
            Loading entries...
          </div>
        ) : entriesError ? (
          <div style={{ padding: '16px', color: '#f56565', fontSize: '14px' }}>{entriesError}</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
            No entries found for this upload.
          </div>
        ) : (
          <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Particular</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--gray)' }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{entry.particular}</td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: entry.amount < 0 ? '#f56565' : 'var(--text)',
                      }}
                    >
                      ₹ {entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--navy-light)' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700' }}>Total</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                    ₹ {entries.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
