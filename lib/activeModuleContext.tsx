'use client';

import { createContext, useContext } from 'react';
import type { DashboardModule } from '@/components/dashboard/DashboardSidebar';

interface ActiveModuleContextType {
  activeModule: DashboardModule;
}

export const ActiveModuleContext = createContext<ActiveModuleContextType>({
  activeModule: 'overview',
});

export const useActiveModule = () => useContext(ActiveModuleContext);
