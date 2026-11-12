'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { mailboxApi } from './api/resources';
import type { MailboxStatus } from './api/types';

export type MailboxHealth = 'loading' | 'healthy' | 'failing' | 'needs-reconnect' | 'not-connected' | 'unknown';

export function mailboxHealth(status: MailboxStatus | undefined, error: unknown, loading: boolean): MailboxHealth {
  if (status) {
    if (status.needsReconnect) return 'needs-reconnect';
    if (!status.connected) return 'not-connected';
    if (status.consecutiveFailures > 0) return 'failing';
    return 'healthy';
  }
  if (loading) return 'loading';
  return error ? 'unknown' : 'loading';
}

interface MailboxContextValue {
  status: MailboxStatus | undefined;
  error: unknown;
  loading: boolean;
  health: MailboxHealth;
  refresh: () => Promise<MailboxStatus | undefined>;
}

const MailboxContext = createContext<MailboxContextValue | null>(null);

export function MailboxProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MailboxStatus | undefined>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await mailboxApi.status();
      setStatus(next);
      setError(undefined);
      return next;
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    mailboxApi.status().then(
      (next) => {
        if (cancelled) return;
        setStatus(next);
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<MailboxContextValue>(
    () => ({ status, error, loading, health: mailboxHealth(status, error, loading), refresh }),
    [status, error, loading, refresh]
  );

  return <MailboxContext.Provider value={value}>{children}</MailboxContext.Provider>;
}

export function useMailbox() {
  const ctx = useContext(MailboxContext);
  if (!ctx) throw new Error('useMailbox must be used within MailboxProvider');
  return ctx;
}
