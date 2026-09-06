'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { initFromStorage } from '@/lib/redux/authSlice';
import { setPermissions, setPermissionsError, setPermissionsLoading } from '@/lib/redux/permissionsSlice';
import { authService } from '@/lib/services/auth';
import { tokenStorage } from '@/lib/apiClient';
import { findAccessRuleForPath, getDefaultLandingRoute, hasAccess } from '@/lib/permissions/navConfig';
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
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const permissionsState = useAppSelector((state) => state.permissions);

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

  // Fetch this user's module permissions whenever they become authenticated
  // (covers both a fresh login and hydration-from-storage, since both flip
  // isAuthenticated to true).
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    dispatch(setPermissionsLoading());
    authService
      .me()
      .then((data) => {
        if (!cancelled)
          dispatch(
            setPermissions({
              permissions: data.permissions,
              modules: data.modules,
              dashboardVisible: data.dashboardVisible,
            })
          );
      })
      .catch(() => {
        if (!cancelled) dispatch(setPermissionsError());
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, dispatch]);

  // Route protection — runs after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && pathname === '/login') {
      router.replace('/');
      return;
    }
    if (!isAuthenticated && !AUTH_ROUTES.includes(pathname)) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated && permissionsState.status === 'loaded') {
      const ctx = {
        modules: permissionsState.modules,
        permissions: permissionsState.permissions,
        role: user?.role,
        dashboardVisible: permissionsState.dashboardVisible,
      };
      // '/' is the dashboard and the app's default post-login landing page, so it's
      // handled separately from the generic rule below instead of via NAV_CONFIG:
      // redirecting a no-access hit on '/' back to '/' would just loop forever.
      if (pathname === '/' && !permissionsState.dashboardVisible) {
        router.replace(getDefaultLandingRoute(ctx));
        return;
      }
      const rule = findAccessRuleForPath(pathname);
      if (rule && !hasAccess(rule, ctx)) {
        toast.error("You don't have access to that section.");
        router.replace(getDefaultLandingRoute(ctx));
      }
    }
  }, [hydrated, isAuthenticated, pathname, router, permissionsState, user?.role]);

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
