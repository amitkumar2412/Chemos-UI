'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { initFromStorage } from '@/lib/redux/authSlice';
import { authService } from '@/lib/services/auth';
import { tokenStorage } from '@/lib/apiClient';
import DashboardTopbar from './dashboard/DashboardTopbar';
import DashboardSidebar from './dashboard/DashboardSidebar';
import { MOCK_NOTIFICATIONS } from './dashboard/data/mockData';
import type { Period, Currency } from './dashboard/types';
import type { DashboardModule } from './dashboard/DashboardSidebar';
import { ActiveModuleContext } from '@/lib/activeModuleContext';

const AUTH_ROUTES = ['/login'];

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [hydrated, setHydrated] = useState(false);
  const [period, setPeriod] = useState<Period>('mtd');
  const [currency, setCurrency] = useState<Currency>('inr');
  const [asOf, setAsOf] = useState<string | null>(null);
  const [activeModule, setModule] = useState<DashboardModule>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Hydrate Redux from localStorage on first mount
  useEffect(() => {
    const token = tokenStorage.get();
    const storedUser = authService.getStoredUser();
    if (token && storedUser) {
      dispatch(initFromStorage({ ...storedUser, token }));
    }
    setHydrated(true);
  }, [dispatch]);

  // Route protection — runs after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    } else if (!isAuthenticated && !AUTH_ROUTES.includes(pathname)) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  // Prevent any render until we know auth state
  if (!hydrated) return null;

  // Auth routes — skip the shell entirely (but redirect away if already logged in)
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) return null; // redirect in progress
    return <>{children}</>;
  }

  // Protected area — redirect in progress
  if (!isAuthenticated) return null;

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
