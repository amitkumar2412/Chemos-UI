import { apiClient } from '@/lib/apiClient';

export type InheritanceMode = 'NONE' | 'ALL' | 'SELECTED';
export type OverrideEffect = 'ALLOW' | 'DENY';

export interface Permission {
  id: string;
  permissionCode: string;
  displayName: string;
  module: string;
}

export interface RolePermissions {
  id: string;
  name: string;
  displayName: string;
  isSuperRole: boolean;
  parentRoleId: string | null;
  permissions: string[];
  inheritanceMode: InheritanceMode;
  selectedInheritedPermissions: string[];
  inheritedPermissions: string[];
  effectivePermissions: string[];
}

export interface RolePermissionUpdate {
  parentRoleId: string | null;
  inheritanceMode: InheritanceMode;
  permissions: string[];
  selectedInheritedPermissions: string[];
}

export interface PermissionOverride {
  username: string;
  permissionCode: string;
  displayName: string;
  effect: OverrideEffect;
  reason?: string | null;
}

export interface UserPermissions {
  username: string;
  role: RolePermissions;
  overrides: PermissionOverride[];
  effectivePermissions: string[];
}

const rolePath = (id: string) => `/auth/roles/${encodeURIComponent(id)}/permissions`;
const userPath = (username: string) => `/auth/users/${encodeURIComponent(username)}`;
const overridePath = (username: string, code: string) =>
  `${userPath(username)}/permission-overrides/${encodeURIComponent(code)}`;

export const permissionService = {
  listPermissions: () => apiClient.get<Permission[]>('/auth/permissions'),
  listRoles: () => apiClient.get<RolePermissions[]>('/auth/roles'),
  getRole: (id: string) => apiClient.get<RolePermissions>(rolePath(id)),
  updateRole: (id: string, payload: RolePermissionUpdate) =>
    apiClient.put<RolePermissions>(rolePath(id), payload),
  getUser: (username: string) =>
    apiClient.get<UserPermissions>(`${userPath(username)}/permissions`),
  setOverride: (username: string, code: string, effect: OverrideEffect, reason?: string) =>
    apiClient.put<PermissionOverride>(overridePath(username, code), { effect, reason }),
  removeOverride: (username: string, code: string) => apiClient.delete(overridePath(username, code)),
};
