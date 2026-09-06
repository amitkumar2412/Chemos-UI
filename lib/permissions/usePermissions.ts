'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import type { ModuleAccess } from '@/lib/services/auth';

export function usePermissions() {
  const { modules, permissions, status, dashboardVisible } = useAppSelector((s) => s.permissions);
  const role = useAppSelector((s) => s.auth.user?.role);

  return {
    modules,
    permissions,
    status,
    role,
    dashboardVisible,
    can: (module: string, action: keyof ModuleAccess = 'canView'): boolean => modules[module]?.[action] ?? false,
    hasPermission: (key: string): boolean => permissions.includes(key),
  };
}
