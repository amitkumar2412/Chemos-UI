'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAuditLogs, type AuditLog, type AuditEntityType } from '@/lib/api';
import { useAppSelector } from '@/lib/redux/hooks';

const TH: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--gray)',
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE:  { bg: 'rgba(72,187,120,0.15)',  color: '#48bb78' },
  UPDATE:  { bg: 'rgba(99,179,237,0.15)',  color: '#63b3ed' },
  DELETE:  { bg: 'rgba(245,101,101,0.15)', color: '#f56565' },
  CONFIRM: { bg: 'rgba(159,122,234,0.15)', color: '#9f7aea' },
};

const ENTITY_FILTERS: { label: string; value: AuditEntityType | 'ALL' }[] = [
  { label: 'All',       value: 'ALL'      },
  { label: 'Users',     value: 'USER'     },
  { label: 'Purchases', value: 'PURCHASE' },
  { label: 'Sales',     value: 'SALE'     },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return iso; }
}

function tryParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged';
interface DiffRow { key: string; before: unknown; after: unknown; kind: DiffKind }

function buildDiff(before: Record<string, unknown> | null, after: Record<string, unknown> | null): DiffRow[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return Array.from(keys).map((key) => {
    const b = before?.[key];
    const a = after?.[key];
    let kind: DiffKind;
    if (before === null || !(key in (before ?? {})))       kind = 'added';
    else if (after === null || !(key in (after ?? {})))    kind = 'removed';
    else if (JSON.stringify(b) !== JSON.stringify(a))      kind = 'changed';
    else                                                   kind = 'unchanged';
    return { key, before: b, after: a, kind };
  });
}

function displayVal(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const s = ACTION_COLORS[action?.toUpperCase()] ?? { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: '600', letterSpacing: '0.04em',
      textTransform: 'uppercase', background: s.bg, color: s.color,
    }}>
      {action}
    </span>
  );
}

function EntityBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    USER:     { bg: 'rgba(99,179,237,0.12)',  color: '#63b3ed' },
    PURCHASE: { bg: 'rgba(246,173,85,0.12)',  color: '#f6ad55' },
    SALE:     { bg: 'rgba(104,211,145,0.12)', color: '#68d391' },
  };
  const s = map[type?.toUpperCase()] ?? { bg: 'rgba(160,174,192,0.12)', color: '#a0aec0' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color,
    }}>
      {type}
    </span>
  );
}

// ─── Diff Modal ───────────────────────────────────────────────────────────────

const DIFF_STYLES: Record<DiffKind, { row: string; label: string; labelText: string; before: string; after: string }> = {
  added:     { row: 'rgba(72,187,120,0.06)',  label: 'rgba(72,187,120,0.2)',  labelText: '#48bb78', before: 'rgba(0,0,0,0)',       after: 'rgba(72,187,120,0.12)'  },
  removed:   { row: 'rgba(245,101,101,0.06)', label: 'rgba(245,101,101,0.2)', labelText: '#f56565', before: 'rgba(245,101,101,0.12)', after: 'rgba(0,0,0,0)'       },
  changed:   { row: 'rgba(246,173,85,0.06)',  label: 'rgba(246,173,85,0.2)',  labelText: '#f6ad55', before: 'rgba(245,101,101,0.1)', after: 'rgba(72,187,120,0.1)' },
  unchanged: { row: 'transparent',            label: 'rgba(160,174,192,0.1)', labelText: '#718096', before: 'transparent',          after: 'transparent'          },
};

const KIND_LABEL: Record<DiffKind, string> = {
  added: 'NEW', removed: 'DEL', changed: 'MOD', unchanged: '—',
};

interface DiffModalProps {
  log: AuditLog;
  onClose: () => void;
}

function DiffModal({ log, onClose }: DiffModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const before = tryParse(log.dataBefore);
  const after  = tryParse(log.dataAfter);
  const rows   = buildDiff(before, after);

  const changed   = rows.filter((r) => r.kind !== 'unchanged').length;
  const unchanged = rows.filter((r) => r.kind === 'unchanged').length;
  const [showUnchanged, setShowUnchanged] = useState(false);
  const visible = showUnchanged ? rows : rows.filter((r) => r.kind !== 'unchanged');

  // Close on overlay click
  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const hasBefore = log.dataBefore !== null;
  const hasAfter  = log.dataAfter  !== null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <ActionBadge action={log.action} />
              <EntityBadge type={log.entityType} />
              <span style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'monospace' }}>
                {log.entityId}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
              by <strong style={{ color: 'var(--text)' }}>{log.performedByName}</strong>
              {' '}(@{log.performedBy}) · {log.performedByRole} · {formatDate(log.performedAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--gray)',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '16px',
              lineHeight: 1,
              flexShrink: 0,
              marginLeft: '16px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats bar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: '20px',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Changed',   count: rows.filter((r) => r.kind === 'changed').length,   color: '#f6ad55' },
            { label: 'Added',     count: rows.filter((r) => r.kind === 'added').length,     color: '#48bb78' },
            { label: 'Removed',   count: rows.filter((r) => r.kind === 'removed').length,   color: '#f56565' },
            { label: 'Unchanged', count: unchanged,                                          color: '#718096' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: color, display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ color: 'var(--gray)' }}>{label}</span>
              <strong style={{ color: count > 0 ? color : 'var(--gray)' }}>{count}</strong>
            </div>
          ))}

          {unchanged > 0 && (
            <button
              onClick={() => setShowUnchanged((s) => !s)}
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--gray)',
                cursor: 'pointer',
              }}
            >
              {showUnchanged ? 'Hide unchanged' : `Show ${unchanged} unchanged`}
            </button>
          )}
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr',
            padding: '8px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          {['', 'Field', 'Before', 'After'].map((h) => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Diff rows */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {visible.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
              No changes to display
            </div>
          ) : (
            visible.map(({ key, before: b, after: a, kind }) => {
              const ds = DIFF_STYLES[kind];
              return (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 1fr 1fr',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--border)',
                    background: ds.row,
                    alignItems: 'start',
                    gap: '8px',
                  }}
                >
                  {/* Kind pill */}
                  <div style={{ paddingTop: '2px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      background: ds.label,
                      color: ds.labelText,
                    }}>
                      {KIND_LABEL[kind]}
                    </span>
                  </div>

                  {/* Key */}
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', paddingTop: '3px', wordBreak: 'break-all' }}>
                    {key}
                  </div>

                  {/* Before value */}
                  <div style={{
                    fontSize: '12px', fontFamily: 'monospace',
                    background: ds.before, borderRadius: '6px',
                    padding: kind !== 'unchanged' ? '6px 10px' : '0',
                    color: kind === 'removed' || kind === 'changed' ? '#f56565' : 'var(--gray)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    opacity: kind === 'added' ? 0.3 : 1,
                  }}>
                    {b !== undefined ? displayVal(b) : <span style={{ opacity: 0.3 }}>—</span>}
                  </div>

                  {/* After value */}
                  <div style={{
                    fontSize: '12px', fontFamily: 'monospace',
                    background: ds.after, borderRadius: '6px',
                    padding: kind !== 'unchanged' ? '6px 10px' : '0',
                    color: kind === 'added' || kind === 'changed' ? '#48bb78' : 'var(--gray)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    opacity: kind === 'removed' ? 0.3 : 1,
                  }}>
                    {a !== undefined ? displayVal(a) : <span style={{ opacity: 0.3 }}>—</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 24px',
              background: 'var(--blue)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [entityFilter, setEntityFilter] = useState<AuditEntityType | 'ALL'>('ALL');
  const [logs, setLogs]               = useState<AuditLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const PAGE_SIZE = 20;

  const isAdmin = user?.role?.toUpperCase().includes('ADMIN');

  const loadLogs = useCallback(async (p: number, filter: AuditEntityType | 'ALL') => {
    setLoading(true);
    try {
      const resp = await fetchAuditLogs(p, PAGE_SIZE, filter === 'ALL' ? undefined : filter);
      setLogs(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) loadLogs(page, entityFilter);
  }, [isAuthenticated, isAdmin, page, entityFilter, loadLogs]);

  const handleFilterChange = (val: AuditEntityType | 'ALL') => {
    setEntityFilter(val);
    setPage(0);
  };

  if (!isAuthenticated || !user) {
    return (
      <div style={{ padding: '32px' }}>
        <Placeholder icon="🔒" title="Authentication Required" message="Please login to access this section" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '32px' }}>
        <Placeholder icon="⛔" title="Access Denied" message="Only administrators can view audit logs" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0', height: '100%' }}>
      {/* Comparison modal */}
      {selectedLog && <DiffModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Audit Trail</h1>
          <p>Complete log of all actions performed in the system</p>
        </div>
        <div style={{
          display: 'flex', gap: '8px',
          background: 'var(--card)', padding: '6px',
          borderRadius: '8px', border: '1px solid var(--border)',
        }}>
          {ENTITY_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              style={{
                padding: '8px 18px',
                background: entityFilter === value ? 'var(--blue)' : 'transparent',
                color: entityFilter === value ? 'white' : 'var(--text)',
                border: 'none', borderRadius: '6px',
                fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
            Loading audit logs…
          </div>
        ) : logs.length === 0 ? (
          <Placeholder icon="📋" title="No audit logs found" message="Actions will appear here once recorded" />
        ) : (
          <>
            {/* Summary strip */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '12px', fontSize: '13px', color: 'var(--gray)',
            }}>
              <span>
                Showing{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)}
                </strong>{' '}
                of <strong style={{ color: 'var(--text)' }}>{totalElements}</strong> entries
              </span>
              <span style={{ fontSize: '12px' }}>Click "View Changes" to see a field-by-field diff</span>
            </div>

            {/* Table */}
            <div className="table-scroll" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                <thead>
                  <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                    <th style={TH}>Action</th>
                    <th style={TH}>Entity Type</th>
                    <th style={TH}>Entity ID</th>
                    <th style={TH}>Performed By</th>
                    <th style={TH}>Role</th>
                    <th style={TH}>Performed At</th>
                    <th style={{ ...TH, textAlign: 'center' }}>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const hasData = log.dataBefore !== null || log.dataAfter !== null;
                    return (
                      <tr
                        key={log.id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <ActionBadge action={log.action} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <EntityBadge type={log.entityType} />
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--gray)', fontFamily: 'monospace' }}>
                          {log.entityId}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{log.performedByName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>@{log.performedBy}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--gray)' }}>
                          {log.performedByRole}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                          {formatDate(log.performedAt)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {hasData ? (
                            <button
                              onClick={() => setSelectedLog(log)}
                              style={{
                                padding: '6px 16px',
                                background: 'rgba(99,179,237,0.12)',
                                color: '#63b3ed',
                                border: '1px solid rgba(99,179,237,0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,179,237,0.22)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,179,237,0.12)'; }}
                            >
                              View Changes
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--gray)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '8px', marginTop: '20px', flexWrap: 'wrap',
              }}>
                <PaginationBtn label="← Prev" disabled={page === 0} onClick={() => setPage((p) => p - 1)} />

                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1)
                  .reduce<(number | '…')[]>((acc, i, idx, arr) => {
                    if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '…' ? (
                      <span key={`el-${idx}`} style={{ color: 'var(--gray)', padding: '0 4px' }}>…</span>
                    ) : (
                      <PaginationBtn
                        key={item}
                        label={String((item as number) + 1)}
                        active={item === page}
                        onClick={() => setPage(item as number)}
                      />
                    )
                  )}

                <PaginationBtn label="Next →" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function PaginationBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 14px',
        background: active ? 'var(--blue)' : 'var(--card)',
        color: active ? 'white' : disabled ? 'var(--gray)' : 'var(--text)',
        border: '1px solid var(--border)', borderRadius: '6px',
        fontSize: '13px', fontWeight: active ? '600' : '400',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function Placeholder({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px',
      background: 'var(--card)', borderRadius: '12px',
      border: '2px dashed var(--border)',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--gray)' }}>{message}</p>
    </div>
  );
}
