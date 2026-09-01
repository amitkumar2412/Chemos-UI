'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/email-system', label: 'Overview', match: (p: string) => p === '/admin/email-system' },
  { href: '/admin/email-system/chemicals', label: 'Chemicals', match: (p: string) => p.startsWith('/admin/email-system/chemicals') },
  { href: '/admin/email-system/customers', label: 'Customers', match: (p: string) => p.startsWith('/admin/email-system/customers') },
  { href: '/admin/email-system/templates', label: 'Templates', match: (p: string) => p.startsWith('/admin/email-system/templates') },
  { href: '/admin/email-system/campaigns', label: 'Campaigns', match: (p: string) => p.startsWith('/admin/email-system/campaigns') },
];

export default function EmailSystemTabs() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '28px' }}>
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: active ? 'var(--blue)' : 'var(--gray)',
              textDecoration: 'none',
              borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
