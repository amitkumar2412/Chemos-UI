'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/apiClient';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { authService, type UserResponse } from '@/lib/services/auth';
import {
  permissionService, type Permission, type RolePermissions, type RolePermissionUpdate,
  type UserPermissions, type OverrideEffect,
} from '@/lib/services/permissions';
import { eligibleParents, permissionChanges, previewEffective, roleDraft } from '@/lib/permissions/roleDraft';
import PermissionMatrix from '@/components/permissions/PermissionMatrix';
import styles from './permissions.module.css';

const CONFIG_HINT = 'Changes apply to the next API request. The affected user must log in again or reload their configuration to refresh menus and buttons.';

function message(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return 'Not authorized';
  return error instanceof Error ? error.message : 'Unable to complete the request. Please try again.';
}

function Dialog({ title, children, onClose, busy = false }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className="pm-dialog" aria-labelledby="pm-dialog-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 id="pm-dialog-title">{title}</h2>
    {children}
  </dialog>;
}

function RoleEditor({ roleId, roles, permissions, onSaved }: {
  roleId: string; roles: RolePermissions[]; permissions: Permission[]; onSaved: (role: RolePermissions) => void;
}) {
  const [role, setRole] = useState<RolePermissions | null>(null);
  const [draft, setDraft] = useState<RolePermissionUpdate | null>(null);
  const [parent, setParent] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentLoading, setParentLoading] = useState(false);
  const [error, setError] = useState('');
  const [parentError, setParentError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    permissionService.getRole(roleId).then(async (fresh) => {
      const freshParent = fresh.parentRoleId ? await permissionService.getRole(fresh.parentRoleId) : null;
      if (cancelled) return;
      setRole(fresh);
      setDraft(roleDraft(fresh));
      setParent(freshParent);
      setError('');
    }).catch((error: unknown) => {
      if (!cancelled) setError(message(error));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [roleId, attempt]);

  const changeParent = async (id: string) => {
    if (!draft) return;
    setParentLoading(true);
    setParentError('');
    setSaved(false);
    try {
      const fresh = id ? await permissionService.getRole(id) : null;
      setParent(fresh);
      setDraft({
        ...draft,
        parentRoleId: id || null,
        inheritanceMode: fresh && !fresh.isSuperRole ? draft.inheritanceMode : 'NONE',
        selectedInheritedPermissions: fresh && !fresh.isSuperRole && draft.inheritanceMode === 'SELECTED' ?
          draft.selectedInheritedPermissions.filter((code) => fresh.permissions.includes(code)) : [],
      });
    } catch (error: unknown) {
      setParentError(message(error));
    } finally {
      setParentLoading(false);
    }
  };

  const save = async () => {
    if (!role || !draft || role.isSuperRole) return;
    setSaving(true);
    setError('');
    try {
      const updated = await permissionService.updateRole(role.id, {
        ...draft,
        selectedInheritedPermissions: draft.inheritanceMode === 'SELECTED' ? draft.selectedInheritedPermissions : [],
      });
      setRole(updated);
      setDraft(roleDraft(updated));
      onSaved(updated);
      setConfirming(false);
      setSaved(true);
      toast.success('Role permissions saved');
    } catch (error: unknown) {
      setError(message(error));
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p role="status">Loading role permissions...</p>;
  if (!role || !draft) return <div role="alert">{error}<button onClick={() => {
    setLoading(true); setAttempt((value) => value + 1);
  }}>Retry</button></div>;

  const superRole = role.isSuperRole;
  const locked = superRole || saving || parentLoading;
  const parentOptions = eligibleParents(roles, role.id);
  const savedParent = draft.parentRoleId && !parentOptions.some((option) => option.id === draft.parentRoleId) ?
    roles.find((candidate) => candidate.id === draft.parentRoleId) : undefined;
  const superParent = parent?.isSuperRole ?? false;
  const allCodes = permissions.map((permission) => permission.permissionCode);
  const currentEffective = superRole ? allCodes : role.effectivePermissions;
  const preview = superRole ? allCodes : previewEffective(draft, parent);
  const changes = permissionChanges(currentEffective, preview);
  const toggle = (field: 'permissions' | 'selectedInheritedPermissions', code: string, checked: boolean) => {
    setSaved(false);
    setDraft({ ...draft, [field]: checked ? [...draft[field], code] : draft[field].filter((item) => item !== code) });
  };

  return <>
    <div className="pm-heading"><div><h2>{role.displayName}</h2><p className="pm-muted">{role.name}</p></div>
      {superRole && <span className="pm-badge">Admin - all permissions</span>}
    </div>
    {error && <p className="pm-error" role="alert">{error}</p>}
    {saved && <p className="pm-notice" role="status">{CONFIG_HINT}</p>}
    {superRole && <p className="pm-notice">This super role has every permission and is read-only.</p>}
    <fieldset disabled={locked} className="pm-settings">
      <legend>Role inheritance</legend>
      <label>Parent role
        <select aria-label="Parent role" value={draft.parentRoleId ?? ''} onChange={(event) => void changeParent(event.target.value)}>
          <option value="">None</option>
          {parentOptions.map((candidate) =>
            <option value={candidate.id} key={candidate.id}>{candidate.displayName}</option>
          )}
          {savedParent && <option value={savedParent.id}>{savedParent.displayName} (current)</option>}
        </select>
      </label>
      <fieldset disabled={!draft.parentRoleId || superParent} className="pm-modes">
        <legend>Inheritance mode</legend>
        {(['NONE', 'ALL', 'SELECTED'] as const).map((mode) => <label key={mode}>
          <input type="radio" name="inheritanceMode" value={mode} checked={draft.inheritanceMode === mode}
            onChange={() => {
              setSaved(false);
              setDraft({ ...draft, inheritanceMode: mode, selectedInheritedPermissions: mode === 'SELECTED' ? draft.selectedInheritedPermissions : [] });
            }} />
          {mode === 'NONE' ? 'None' : mode === 'ALL' ? 'Inherit all from parent' : 'Inherit selected'}
        </label>)}
      </fieldset>
      <p className="pm-muted">{superParent ?
        'Admin is the top-level parent. It has all permissions, so nothing is inherited from it.' :
        'Only the parent\u2019s direct grants are inherited. A parent alone grants nothing.'}</p>
    </fieldset>
    {parentLoading && <p role="status">Loading parent permissions...</p>}
    {parentError && <p className="pm-error" role="alert">{parentError} The parent was not changed. Please try again.</p>}
    <p className="pm-muted">
      Check to grant directly to this role.
      {draft.inheritanceMode === 'SELECTED' && ' The second checkbox selects access from the parent.'}
      {draft.inheritanceMode === 'ALL' && ' A checked, read-only second checkbox shows access from the parent.'}
    </p>
    <PermissionMatrix permissions={permissions} effectivePermissions={currentEffective} renderPermission={(permission) => {
      const code = permission.permissionCode;
      const parentGrants = !parent?.isSuperRole && (parent?.permissions.includes(code) ?? false);
      return <>
        <label className="pm-choice" title={`Grant ${permission.displayName} directly`}><input type="checkbox"
          aria-label={`Grant ${permission.displayName} directly`}
          checked={superRole || draft.permissions.includes(code)} disabled={locked}
          onChange={(event) => toggle('permissions', code, event.target.checked)} />Direct</label>
        {draft.inheritanceMode === 'SELECTED' && <label className="pm-choice" title={!parentGrants ? 'Not directly granted by the parent' : undefined}>
          <input type="checkbox" aria-label={`Inherit ${permission.displayName} from parent`}
            checked={draft.selectedInheritedPermissions.includes(code)} disabled={locked || !parentGrants}
            onChange={(event) => toggle('selectedInheritedPermissions', code, event.target.checked)} />Inherit
        </label>}
        {draft.inheritanceMode === 'ALL' && parentGrants &&
          <label className="pm-choice" title={`Inherited from ${parent?.displayName}`}>
            <input type="checkbox" checked disabled aria-label={`${permission.displayName} inherited from ${parent?.displayName}`} />
            Inherited from {parent?.displayName}
          </label>}
        <span className={`pm-access-state ${currentEffective.includes(code) ? 'is-granted' : 'is-denied'}`}>
          Current access: {currentEffective.includes(code) ? 'Granted' : 'Not granted'}
        </span>
        {!superRole && preview.includes(code) !== currentEffective.includes(code) &&
          <span className="pm-pending-state">
            After saving: {preview.includes(code) ? 'Will be granted' : 'Will be removed'}
          </span>}
      </>;
    }} />
    {!superRole && <div className="pm-actions"><button className="pm-primary" disabled={locked}
      onClick={() => setConfirming(true)}>Review &amp; save</button></div>}
    {confirming && <Dialog title="Confirm role permission changes" onClose={() => setConfirming(false)} busy={saving}>
      <p>Save the complete configuration for {role.displayName}?</p>
      <p className="pm-muted">Effective permission changes for this role (user overrides may change individual access):</p>
      <h3>Added ({changes.added.length})</h3>
      <ul>{changes.added.map((code) => <li key={code}>{code}</li>)}</ul>
      {!changes.added.length && <p>None</p>}
      <h3>Removed ({changes.removed.length})</h3>
      <ul>{changes.removed.map((code) => <li key={code}>{code}</li>)}</ul>
      {!changes.removed.length && <p>None</p>}
      <p className="pm-notice">{CONFIG_HINT}</p>
      <div className="pm-actions">
        <button disabled={saving} onClick={() => setConfirming(false)}>Cancel</button>
        <button className="pm-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Saving...' : 'Save permissions'}</button>
      </div>
    </Dialog>}
  </>;
}

function UserEditor({ username, permissions }: { username: string; permissions: Permission[] }) {
  const [data, setData] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<{ permission: Permission; effect: OverrideEffect } | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    permissionService.getUser(username).then((fresh) => {
      if (!cancelled) { setData(fresh); setError(''); }
    }).catch((error: unknown) => {
      if (!cancelled) setError(message(error));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username, attempt]);

  const changeOverride = async (permission: Permission, effect: OverrideEffect | 'DEFAULT', text?: string) => {
    if (!data || data.role.isSuperRole) return;
    const existing = data.overrides.find((override) => override.permissionCode === permission.permissionCode);
    if (effect === 'DEFAULT' && !existing) return;
    setBusy(true);
    setError('');
    setSaved(false);
    let persisted = false;
    try {
      if (effect === 'DEFAULT') await permissionService.removeOverride(username, permission.permissionCode);
      else await permissionService.setOverride(username, permission.permissionCode, effect, text?.trim() || undefined);
      persisted = true;
      setPending(null);
      const fresh = await permissionService.getUser(username);
      setData(fresh);
      setSaved(true);
      toast.success('User permissions saved');
    } catch (error: unknown) {
      if (persisted) setData(null);
      setPending(null);
      setError(persisted ? `The change was saved, but the updated permissions could not be loaded. ${message(error)}` : message(error));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p role="status">Loading user permissions...</p>;
  if (!data) return <div role="alert">{error}<button onClick={() => {
    setLoading(true); setAttempt((value) => value + 1);
  }}>Reload permissions</button></div>;
  const superRole = data.role.isSuperRole;
  const effective = superRole ? permissions.map((permission) => permission.permissionCode) : data.effectivePermissions;

  return <>
    <div className="pm-heading"><div><h2>{data.username}</h2><p className="pm-muted">{data.role.displayName}</p></div>
      {superRole && <span className="pm-badge">Admin - all permissions</span>}
    </div>
    {error && <p role="alert" className="pm-error">{error}</p>}
    {saved && <p className="pm-notice" role="status">{CONFIG_HINT}</p>}
    {superRole && <p className="pm-notice">Super-role users have every permission and are read-only.</p>}
    <p className="pm-muted">First checkbox: Allow. Second checkbox: Deny. Leave both unchecked to follow the role.</p>
    <PermissionMatrix permissions={permissions} effectivePermissions={effective} renderPermission={(permission) => {
      const code = permission.permissionCode;
      const override = data.overrides.find((item) => item.permissionCode === code);
      const fromRole = superRole || data.role.effectivePermissions.includes(code);
      const granted = effective.includes(code);
      return <>
        <span className={`pm-role-state ${fromRole ? 'is-granted' : 'is-denied'}`}>
          Role access: {fromRole ? 'Granted' : 'Not granted'}
          {data.role.inheritedPermissions.includes(code) && ' (inherited)'}
        </span>
        <div className="pm-override-control">
          <strong>User-specific access</strong>
          <span className="pm-muted">Leave both unchecked to follow the role.</span>
          <div className="pm-override-options">
            <label className="pm-choice">
              <input type="checkbox" aria-label={`Allow ${permission.displayName}`}
                checked={override?.effect === 'ALLOW'} disabled={superRole || busy}
                onChange={(event) => {
                  if (event.target.checked) {
                    setReason(override?.reason ?? '');
                    setPending({ permission, effect: 'ALLOW' });
                  } else if (override?.effect === 'ALLOW') {
                    void changeOverride(permission, 'DEFAULT');
                  }
                }} />
              Allow
            </label>
            <label className="pm-choice">
              <input type="checkbox" aria-label={`Deny ${permission.displayName}`}
                checked={override?.effect === 'DENY'} disabled={superRole || busy}
                onChange={(event) => {
                  if (event.target.checked) {
                    setReason(override?.reason ?? '');
                    setPending({ permission, effect: 'DENY' });
                  } else if (override?.effect === 'DENY') {
                    void changeOverride(permission, 'DEFAULT');
                  }
                }} />
              Deny
            </label>
          </div>
        </div>
        {override?.reason && <span className="pm-muted">Reason: {override.reason}</span>}
        <span className={`pm-access-state ${granted ? 'is-granted' : 'is-denied'} ${granted !== fromRole ? granted ? 'is-allow' : 'is-override-deny' : ''}`}>
          Final access: {granted ? 'Granted' : 'Not granted'}
          {granted !== fromRole && (granted ? ' · Allowed for this user' : ' · Denied for this user')}
        </span>
      </>;
    }} />
    {busy && <p role="status">Saving and refreshing permissions...</p>}
    {pending && <Dialog title={`${pending.effect === 'ALLOW' ? 'Allow' : 'Deny'} ${pending.permission.displayName}`}
      onClose={() => setPending(null)} busy={busy}>
      <form onSubmit={(event) => { event.preventDefault(); void changeOverride(pending.permission, pending.effect, reason); }}>
        <p>Update the override for {username}.</p>
        <label>Reason (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy} /></label>
        <div className="pm-actions">
          <button type="button" disabled={busy} onClick={() => setPending(null)}>Cancel</button>
          <button className="pm-primary" disabled={busy} type="submit">{busy ? 'Saving...' : 'Save override'}</button>
        </div>
      </form>
    </Dialog>}
  </>;
}

function PermissionManagement() {
  const [tab, setTab] = useState<'roles' | 'users'>('roles');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roleId, setRoleId] = useState('');
  const [username, setUsername] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([permissionService.listPermissions(), permissionService.listRoles(), authService.getUsers()])
      .then(([permissionList, roleList, userList]) => {
        if (cancelled) return;
        setPermissions(permissionList);
        setRoles(roleList);
        setUsers(userList);
        setRoleId(roleList[0]?.id ?? '');
        setUsername(userList[0]?.username ?? '');
        setError('');
      }).catch((error: unknown) => { if (!cancelled) setError(message(error)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  if (loading) return <p role="status">Loading permission management...</p>;
  if (error) return <div role="alert" className="pm-error">{error}<button onClick={() => {
    setLoading(true); setAttempt((value) => value + 1);
  }}>Retry</button></div>;

  const query = search.trim().toLowerCase();
  const matches = users.filter((user) =>
    [user.name, user.username, user.role, user.roleDisplay].some((value) => value?.toLowerCase().includes(query))
  );
  return <>
    <div className="pm-tabs" role="tablist" aria-label="Permission management">
      <button role="tab" id="roles-tab" aria-controls="roles-panel" aria-selected={tab === 'roles'}
        onClick={() => setTab('roles')}>Role Permissions</button>
      <button role="tab" id="users-tab" aria-controls="users-panel" aria-selected={tab === 'users'}
        onClick={() => setTab('users')}>User Permissions</button>
    </div>
    <div className="pm-layout" role="tabpanel" id={`${tab}-panel`} aria-labelledby={`${tab}-tab`}>
      <aside className="pm-list" aria-label={tab === 'roles' ? 'Roles' : 'Users'}>
        {tab === 'roles' ? <>
          <h2 className="pm-list-title">Roles <span className="pm-muted">({roles.length})</span></h2>
          {!roles.length && <p>No roles found.</p>}
          <div className="pm-list-rows">
            {roles.map((role) => <button key={role.id} className="pm-list-item" aria-pressed={roleId === role.id}
              title={role.name} onClick={() => setRoleId(role.id)}>
              <span className="pm-list-name">{role.displayName}</span>
              {role.isSuperRole && <span className="pm-list-tag" title="All permissions">Admin</span>}
            </button>)}
          </div>
        </> : <>
          <h2 className="pm-list-title">Users <span className="pm-muted">({users.length})</span></h2>
          <input type="search" aria-label="Search users" value={search} placeholder="Search name, username or role"
            onChange={(event) => setSearch(event.target.value)} />
          {!matches.length && <p className="pm-muted">No users found.</p>}
          <div className="pm-list-rows">
            {matches.map((user) => <button key={user.username} className="pm-list-item" aria-pressed={username === user.username}
              title={`@${user.username} · ${user.roleDisplay || user.role}`} onClick={() => setUsername(user.username)}>
              <span className="pm-list-text">
                <span className="pm-list-name">{user.name || user.username}</span>
                <small>{user.roleDisplay || user.role}</small>
              </span>
              <span className={`pm-status-dot ${user.isActive ? 'is-active' : ''}`}
                aria-label={user.isActive ? 'Active' : 'Inactive'} title={user.isActive ? 'Active' : 'Inactive'} />
            </button>)}
          </div>
        </>}
      </aside>
      <section className="pm-editor" aria-label={tab === 'roles' ? 'Role permissions editor' : 'User permissions editor'}>
        {tab === 'roles' ? roleId ? <RoleEditor key={roleId} roleId={roleId} roles={roles} permissions={permissions}
          onSaved={(updated) => setRoles((current) => current.map((role) => role.id === updated.id ? updated : role))} /> :
          <p>Select a role to view permissions.</p> :
          username ? <UserEditor key={username} username={username} permissions={permissions} /> :
            <p>Select a user to view permissions.</p>}
      </section>
    </div>
  </>;
}

export default function PermissionsPage() {
  const { status, hasPermission } = usePermissions();
  return <div className={styles.page}>
    <header className="pm-page-header"><h1>Roles &amp; Permissions</h1>
      <p className="pm-muted">Configure role inheritance and individual user access.</p></header>
    {status === 'idle' || status === 'loading' ? <p role="status">Checking access...</p> :
      status === 'error' ? <p role="alert" className="pm-error">Unable to load your access configuration. Reload the page to try again.</p> :
        !hasPermission('ROLE_MANAGEMENT') ? <p role="alert">Not authorized</p> : <PermissionManagement />}
  </div>;
}
