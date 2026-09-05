import type { ModuleAccess } from '@/lib/services/auth';

export type AccessRule =
  | { type: 'public' }
  | { type: 'module'; module: string; action?: keyof ModuleAccess }
  | { type: 'role'; roles: string[] }; // temporary fallback for sections the backend doesn't yet return permissions for

export interface AccessContext {
  modules: Record<string, ModuleAccess>;
  permissions: string[];
  role?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  access: AccessRule;
}

export interface NavGroup {
  id: string;
  label: string;
  access: AccessRule;
  href?: string; // groups that are a single direct link (e.g. Comparable) instead of a flyout
  items?: NavItem[];
}

/**
 * Single source of truth for which sidebar sections/links exist and what
 * gates each one. `Main`/`Intelligence` are omitted on purpose — they're
 * always public and have no real routes (mock-only), so they stay as plain
 * hardcoded JSX in DashboardSidebar.
 */
export const NAV_CONFIG: NavGroup[] = [
  {
    id: 'purchase',
    label: 'Purchase',
    access: { type: 'module', module: 'purchases' },
    items: [
      { id: 'purchase-orders', label: 'Purchase Orders', href: '/purchases', access: { type: 'module', module: 'purchases' } },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    access: { type: 'module', module: 'sales' },
    items: [
      { id: 'sale-orders', label: 'Sale Orders', href: '/sales', access: { type: 'module', module: 'sales' } },
    ],
  },
  {
    id: 'comparable',
    label: 'Comparable',
    href: '/comparable',
    access: { type: 'role', roles: ['ADMIN'] },
  },
  {
    id: 'admin',
    label: 'Admin',
    access: { type: 'role', roles: ['ADMIN'] },
    items: [
      { id: 'orders', label: 'Orders Management', href: '/admin', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'ps-link', label: 'Purchase-Sale Link', href: '/admin/purchase-sale-link', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'users', label: 'Users', href: '/admin/users', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'audit', label: 'Audit Trail', href: '/admin/audit', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'email-system', label: 'Email System', href: '/admin/email-system', access: { type: 'role', roles: ['ADMIN'] } },
    ],
  },
  {
    id: 'template',
    label: 'Template',
    access: { type: 'role', roles: ['ADMIN'] },
    items: [
      { id: 'template-purchase', label: 'Purchase', href: '/template/purchase', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'template-expense', label: 'Expense', href: '/template/expense', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'template-sale-lifted', label: 'Sale Lifted', href: '/template/sale-lifted', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'template-revenue', label: 'Revenue', href: '/template/revenue', access: { type: 'role', roles: ['ADMIN'] } },
      { id: 'template-cost', label: 'Total Cost', href: '/template/cost', access: { type: 'role', roles: ['ADMIN'] } },
    ],
  },
];

export function hasAccess(rule: AccessRule, ctx: AccessContext): boolean {
  switch (rule.type) {
    case 'public':
      return true;
    case 'module':
      return ctx.modules[rule.module]?.[rule.action ?? 'canView'] ?? false;
    case 'role': {
      if (!ctx.role) return false;
      const upper = ctx.role.toUpperCase();
      return rule.roles.some((keyword) => upper.includes(keyword.toUpperCase()));
    }
  }
}

/** Flattens NAV_CONFIG to find the access rule guarding a given pathname, for route guarding. */
export function findAccessRuleForPath(pathname: string): AccessRule | null {
  for (const group of NAV_CONFIG) {
    if (group.href === pathname) return group.access;
    for (const item of group.items ?? []) {
      if (item.href === pathname) return item.access;
    }
  }
  return null;
}
