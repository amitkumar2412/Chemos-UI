'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Campaign } from '../types';

const STORAGE_KEY = 'chemos_email_system_campaigns';

interface EmailSystemContextValue {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  getCampaign: (id: string) => Campaign | undefined;
}

const EmailSystemContext = createContext<EmailSystemContextValue | null>(null);

export function EmailSystemProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCampaigns(JSON.parse(raw));
    } catch {
      // ignore malformed/unavailable storage — start with an empty list
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    } catch {
      // storage unavailable — campaign list just won't persist across reloads
    }
  }, [campaigns, hydrated]);

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  }, []);

  const getCampaign = useCallback((id: string) => campaigns.find((c) => c.id === id), [campaigns]);

  return (
    <EmailSystemContext.Provider value={{ campaigns, addCampaign, getCampaign }}>
      {children}
    </EmailSystemContext.Provider>
  );
}

export function useEmailSystem() {
  const ctx = useContext(EmailSystemContext);
  if (!ctx) throw new Error('useEmailSystem must be used within EmailSystemProvider');
  return ctx;
}
