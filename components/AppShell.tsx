'use client';

import { ReactNode } from 'react';
import DashboardTopbar from './dashboard/DashboardTopbar';
import DashboardSidebar from './dashboard/DashboardSidebar';
import { MOCK_NOTIFICATIONS } from './dashboard/data/mockData';
import { useState } from 'react';
import type { Period, Currency } from './dashboard/types';
import type { DashboardModule } from './dashboard/DashboardSidebar';
import { ActiveModuleContext } from '@/lib/activeModuleContext';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [period, setPeriod] = useState<Period>('mtd');
  const [currency, setCurrency] = useState<Currency>('inr');
  const [asOf, setAsOf] = useState<string | null>(null);
  const [activeModule, setModule] = useState<DashboardModule>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="db-shell">
      {/* Top bar */}
      <DashboardTopbar
        period={period}
        currency={currency}
        asOf={asOf}
        notifications={MOCK_NOTIFICATIONS}
        onPeriodChange={setPeriod}
        onCurrencyChange={setCurrency}
        onAsOfChange={setAsOf}
        onMenuToggle={() => setMobileNavOpen((v) => !v)}
      />

      {/* Sidebar */}
      <DashboardSidebar
        activeModule={activeModule}
        onModuleChange={setModule}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Main content */}
      <ActiveModuleContext.Provider value={{ activeModule }}>
        <main className="db-main">{children}</main>
      </ActiveModuleContext.Provider>
    </div>
  );
}
