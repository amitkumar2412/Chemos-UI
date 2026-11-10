'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueryState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
}

// Keeps a ref pointing at the latest value without writing to it during render.
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

// Minimal fetch-on-mount hook. Re-runs when `deps` change or `reload` is called; stale responses are discarded.
// Previous data is kept while a refetch is in flight.
export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): QueryState<T> {
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState<{ key: string | null; data: T | undefined; error: unknown }>({
    key: null,
    data: undefined,
    error: undefined,
  });
  const fetcherRef = useLatest(fetcher);

  // A key per (deps, tick) lets us derive `loading` without setting state inside the effect.
  const key = `${JSON.stringify(deps)}:${tick}`;

  useEffect(() => {
    let cancelled = false;
    fetcherRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ key, data, error: undefined });
      },
      (error) => {
        if (!cancelled) setSettled((prev) => ({ key, data: prev.data, error }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, fetcherRef]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = settled.key === key;
  return { data: settled.data, error: current ? settled.error : undefined, loading: !current, reload };
}

// Runs `callback` repeatedly. `getDelay` returns the next delay in ms, or null to stop.
// Polling pauses while the tab is hidden and resumes (immediately) when it becomes visible.
export function usePolling(callback: () => Promise<void> | void, getDelay: () => number | null, enabled: boolean) {
  const callbackRef = useLatest(callback);
  const delayRef = useLatest(getDelay);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const schedule = () => {
      if (stopped || document.hidden) return;
      const delay = delayRef.current();
      if (delay === null) return;
      timer = setTimeout(run, delay);
    };
    const run = async () => {
      try {
        await callbackRef.current();
      } finally {
        schedule();
      }
    };
    const onVisibility = () => {
      clearTimeout(timer);
      if (!document.hidden) void run();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, callbackRef, delayRef]);
}
