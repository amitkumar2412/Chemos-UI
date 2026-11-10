'use client';

import { useCallback, useSyncExternalStore } from 'react';

// TODO: the email service has no "list campaigns" / "get campaign" endpoint yet. Until it does, the campaigns a
// user creates in this browser are remembered locally. Swap the internals of useCampaigns() for GET /campaigns
// once that exists; consumers only depend on the hook's return shape.

const STORAGE_KEY = 'chemos_email_recent_campaigns';
const MAX_ENTRIES = 50;

export interface RecentCampaign {
  id: number;
  name: string;
  chemicalId: string;
  chemicalName: string;
  offerPrice: number;
  createdAt: string;
  // The pool is write-only on the API (no GET), so the ids chosen in the wizard are remembered here.
  templateIds?: number[];
}

const listeners = new Set<() => void>();
const EMPTY: RecentCampaign[] = [];
let cachedRaw: string | null = null;
let cachedValue: RecentCampaign[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): RecentCampaign[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? (parsed as RecentCampaign[]) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function write(next: RecentCampaign[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)));
  } catch {
    // storage unavailable: the list simply won't survive a reload
  }
  listeners.forEach((l) => l());
}

export function useCampaigns() {
  const campaigns = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const addCampaign = useCallback((campaign: RecentCampaign) => {
    write([campaign, ...getSnapshot().filter((c) => c.id !== campaign.id)]);
  }, []);

  const updateCampaign = useCallback((id: number, patch: Partial<RecentCampaign>) => {
    write(getSnapshot().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCampaign = useCallback((id: number) => {
    write(getSnapshot().filter((c) => c.id !== id));
  }, []);

  const getCampaign = useCallback((id: number) => campaigns.find((c) => c.id === id), [campaigns]);

  return { campaigns, addCampaign, updateCampaign, removeCampaign, getCampaign };
}
