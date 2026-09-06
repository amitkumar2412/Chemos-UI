'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchRoles, type Role } from '@/lib/api';
import { authService, type CreateUserPayload, type UpdateUserPayload, type UserResponse } from '@/lib/services/auth';
import { useAppSelector } from '@/lib/redux/hooks';

type AppUser = UserResponse;

const EMPTY_FORM: CreateUserPayload = {
  username: '',
  password: '',
  roleId: '',
  name: '',
  email: '',
};

const EMPTY_EDIT_FORM: UpdateUserPayload = {
  roleId: '',
  name: '',
  email: '',
  newPassword: '',
};

export default function UsersPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserPayload>(EMPTY_EDIT_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<Role[]>([]);
  const [toggleTarget, setToggleTarget] = useState<AppUser | null>(null);
  const [toggling, setToggling] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadUsers();
  }, [isAuthenticated, loadUsers]);

  const openModal = async () => {
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setSubmitSuccess(false);
    setShowModal(true);
    setRolesLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
      if (data.length > 0) setForm((prev) => ({ ...prev, roleId: data[0].id }));
    } catch {
      // dropdown stays empty; user can't submit without a role
    } finally {
      setRolesLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleFormChange = (field: keyof CreateUserPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await authService.createUser(form);
      setSubmitSuccess(true);
      await loadUsers();
      setTimeout(() => closeModal(), 1200);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset2fa = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await authService.adminReset2fa(resetTarget.username);
      toast.success(`2FA reset for ${resetTarget.username}`);
      setResetTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reset 2FA');
    } finally {
      setResetting(false);
    }
  };

  const openEditModal = async (user: AppUser) => {
    setEditTarget(user);
    setEditError(null);
    setEditForm({ roleId: '', name: user.name ?? '', email: user.email ?? '', newPassword: '' });
    setEditLoading(true);
    try {
      const [fresh, roleList] = await Promise.all([authService.getUserById(user.id), fetchRoles()]);
      setEditRoles(roleList);
      const matchedRoleId = roleList.find((r) => r.name === fresh.role)?.id ?? roleList[0]?.id ?? '';
      setEditForm({ roleId: matchedRoleId, name: fresh.name ?? '', email: fresh.email ?? '', newPassword: '' });
      setEditTarget(fresh);
    } catch {
      // fall back to the row data already on screen; role list may still be empty
      const matchedRoleId = editRoles.find((r) => r.name === user.role)?.id ?? '';
      setEditForm((prev) => ({ ...prev, roleId: matchedRoleId }));
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditError(null);
  };

  const handleEditFormChange = (field: keyof UpdateUserPayload, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const payload: UpdateUserPayload = {
        roleId: editForm.roleId,
        name: editForm.name,
        email: editForm.email,
        ...(editForm.newPassword ? { newPassword: editForm.newPassword } : {}),
      };
      await authService.updateUser(editTarget.username, payload);
      toast.success(`${editTarget.username} updated`);
      await loadUsers();
      closeEditModal();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleUser = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await authService.toggleUser(toggleTarget.username);
      toast.success(`${toggleTarget.username} ${toggleTarget.isActive ? 'deactivated' : 'activated'}`);
      setToggleTarget(null);
      await loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update user status');
    } finally {
      setToggling(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'var(--blue)';
      case 'PURCHASE_MANAGER': return 'var(--orange)';
      default: return 'var(--teal)';
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>User Management</h1>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Manage system users and their roles</p>
        </div>
        <button
          onClick={openModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Create User
        </button>
      </div>

      {/* Stats Bar */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Users', value: users.length, color: 'var(--blue)' },
            { label: 'Active', value: users.filter((u) => u.isActive).length, color: 'var(--green)' },
            { label: 'Inactive', value: users.filter((u) => !u.isActive).length, color: 'var(--red)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--gray)' }}>Loading users...</div>
      ) : error ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--card)',
            borderRadius: '12px',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'var(--red)', fontWeight: '600', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={loadUsers}
            style={{
              padding: '8px 20px',
              background: 'var(--blue)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px',
            background: 'var(--card)',
            borderRadius: '12px',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No users found</h3>
          <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>Get started by creating your first user</p>
          <button
            onClick={openModal}
            style={{
              padding: '10px 24px',
              background: 'var(--blue)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Create User
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                {['Username', 'Role', 'Status', 'User ID', 'Actions'].map((col) => (
                  <th
                    key={col}
                    style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: idx < users.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--navy-light)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: getRoleColor(user.role),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{user.username}</div>
                        {user.name && <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{user.name}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getRoleColor(user.role) + '22',
                        color: getRoleColor(user.role),
                      }}
                    >
                      {user.roleDisplay}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.isActive ? '#16a34a22' : '#dc262622',
                        color: user.isActive ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: user.isActive ? 'var(--green)' : 'var(--red)',
                        }}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--gray)', fontFamily: 'monospace' }}>
                    {user.id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEditModal(user)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setToggleTarget(user)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: user.isActive ? 'var(--orange, #d97706)' : 'var(--green)',
                          cursor: 'pointer',
                        }}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setResetTarget(user)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--red)',
                          cursor: 'pointer',
                        }}
                      >
                        Reset 2FA
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activate/Deactivate Confirm Dialog */}
      {toggleTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !toggling) setToggleTarget(null); }}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>
              {toggleTarget.isActive ? 'Deactivate user?' : 'Activate user?'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '24px' }}>
              {toggleTarget.isActive ? (
                <>
                  <strong style={{ color: 'var(--text)' }}>{toggleTarget.username}</strong> will no longer be able to log in
                  until reactivated.
                </>
              ) : (
                <>
                  <strong style={{ color: 'var(--text)' }}>{toggleTarget.username}</strong> will be able to log in again.
                </>
              )}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setToggleTarget(null)}
                disabled={toggling}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleUser}
                disabled={toggling}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: toggling ? 'var(--gray)' : toggleTarget.isActive ? 'var(--orange, #d97706)' : 'var(--green)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                }}
              >
                {toggling ? 'Saving...' : toggleTarget.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Edit {editTarget.username}</h2>
                <p style={{ fontSize: '13px', color: 'var(--gray)' }}>Update details, role, or reset the password</p>
              </div>
              <button
                onClick={closeEditModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {editLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray)' }}>Loading…</div>
            ) : (
              <form onSubmit={handleEditUser}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Full Name <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Email <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Role <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <select
                      required
                      value={editForm.roleId}
                      onChange={(e) => handleEditFormChange('roleId', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                    >
                      {editRoles.length === 0 ? (
                        <option value="">No roles available</option>
                      ) : (
                        editRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.displayName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={editForm.newPassword ?? ''}
                      onChange={(e) => handleEditFormChange('newPassword', e.target.value)}
                      placeholder="Leave blank to keep current password"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {editError && (
                  <div style={{ marginTop: '16px', padding: '10px 14px', background: '#dc262615', border: '1px solid #dc262640', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
                    {editError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    style={{ flex: 1, padding: '11px', background: editSubmitting ? 'var(--gray)' : 'var(--blue)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: 'white', cursor: editSubmitting ? 'not-allowed' : 'pointer' }}
                  >
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset 2FA Confirm Dialog */}
      {resetTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !resetting) setResetTarget(null); }}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>Reset 2FA?</h2>
            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '24px' }}>
              This immediately invalidates <strong style={{ color: 'var(--text)' }}>{resetTarget.username}</strong>&apos;s
              current authenticator and all their backup codes. Their next login will show the QR enrollment screen again.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                disabled={resetting}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  cursor: resetting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset2fa}
                disabled={resetting}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: resetting ? 'var(--gray)' : 'var(--red)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: resetting ? 'not-allowed' : 'pointer',
                }}
              >
                {resetting ? 'Resetting...' : 'Reset 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Create New User</h2>
                <p style={{ fontSize: '13px', color: 'var(--gray)' }}>Fill in the details to create a system user</p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ fontWeight: '600', color: 'var(--green)' }}>User created successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Full Name <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="e.g. Ankit Kumar"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Username <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.username}
                      onChange={(e) => handleFormChange('username', e.target.value)}
                      placeholder="e.g. ankit"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Email <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="e.g. ankit@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Password <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
                      Role <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <select
                      required
                      disabled={rolesLoading}
                      value={form.roleId}
                      onChange={(e) => handleFormChange('roleId', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: rolesLoading ? 'var(--gray)' : 'var(--text)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: rolesLoading ? 'not-allowed' : 'pointer',
                        opacity: rolesLoading ? 0.6 : 1,
                      }}
                    >
                      {rolesLoading ? (
                        <option value="">Loading roles…</option>
                      ) : roles.length === 0 ? (
                        <option value="">No roles available</option>
                      ) : (
                        roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.displayName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {submitError && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '10px 14px',
                      background: '#dc262615',
                      border: '1px solid #dc262640',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--red)',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '11px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '11px',
                      background: submitting ? 'var(--gray)' : 'var(--blue)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
