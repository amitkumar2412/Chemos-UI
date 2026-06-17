import './dashboard.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'ChemOS™ Dashboard',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
