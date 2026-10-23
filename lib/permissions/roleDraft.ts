import type { RolePermissions, RolePermissionUpdate } from '@/lib/services/permissions';

export function roleDraft(role: RolePermissions): RolePermissionUpdate {
  return {
    parentRoleId: role.parentRoleId,
    inheritanceMode: role.inheritanceMode,
    permissions: [...role.permissions],
    selectedInheritedPermissions: role.inheritanceMode === 'SELECTED' ? [...role.selectedInheritedPermissions] : [],
  };
}

export function previewEffective(draft: RolePermissionUpdate, parent: RolePermissions | null): string[] {
  const parentDirect = parent && !parent.isSuperRole ? parent.permissions : [];
  const inherited = draft.inheritanceMode === 'ALL' ? parentDirect :
    draft.inheritanceMode === 'SELECTED' ?
      draft.selectedInheritedPermissions.filter((code) => parentDirect.includes(code)) : [];
  return [...new Set([...draft.permissions, ...inherited])].sort();
}

export function permissionChanges(current: string[], next: string[]) {
  return {
    added: next.filter((code) => !current.includes(code)),
    removed: current.filter((code) => !next.includes(code)),
  };
}

// Allowed parent roles per role name; roles not listed fall back to any non-super, non-cyclic role.
export const PARENT_ROLE_RULES: Record<string, string[]> = {
  PURCHASE_MANAGER: ['ADMIN'],
  SALES_MANAGER: ['ADMIN'],
  PURCHASE_EXECUTIVE: ['PURCHASE_MANAGER'],
  SALES_EXECUTIVE: ['SALES_MANAGER'],
};

function createsCycle(roles: RolePermissions[], roleId: string, candidate: RolePermissions): boolean {
  const visited = new Set<string>([roleId]);
  let current: RolePermissions | undefined = candidate;
  while (current) {
    if (visited.has(current.id)) return true;
    visited.add(current.id);
    current = roles.find((item) => item.id === current?.parentRoleId);
  }
  return false;
}

export function eligibleParents(roles: RolePermissions[], roleId: string): RolePermissions[] {
  const self = roles.find((role) => role.id === roleId);
  const allowed = self ? PARENT_ROLE_RULES[self.name.toUpperCase()] : undefined;
  return roles.filter((role) => {
    if (role.id === roleId) return false;
    if (allowed) return allowed.includes(role.name.toUpperCase()) && (role.isSuperRole || !createsCycle(roles, roleId, role));
    return !role.isSuperRole && !createsCycle(roles, roleId, role);
  });
}
