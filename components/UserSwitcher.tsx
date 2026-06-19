'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { login, logout } from '@/lib/redux/authSlice';
import { dummyUsers } from '@/lib/dummyData';

export default function UserSwitcher() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = (selectedUser: typeof dummyUsers[0]) => {
    dispatch(login(selectedUser));
    setIsOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          background: isAuthenticated ? 'var(--green)' : 'transparent',
          color: isAuthenticated ? 'white' : '#0070FF',
          border: isAuthenticated ? 'none' : '1.5px solid #0070FF',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>{isAuthenticated ? `👤 ${user?.name}` : '🔓 Login (Test)'}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '280px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--gray)',
            }}
          >
            SWITCH USER (Testing Mode)
          </div>

          {isAuthenticated && (
            <>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--navy-light)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>
                  {user?.email}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: 'var(--blue)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  {user?.role.toUpperCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  color: 'var(--red)',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🚪 Logout
              </button>
            </>
          )}

          <div style={{ padding: '8px 0' }}>
            {dummyUsers.map((dummyUser) => (
              <button
                key={dummyUser.id}
                onClick={() => handleLogin(dummyUser)}
                disabled={user?.id === dummyUser.id}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: user?.id === dummyUser.id ? 'var(--navy-light)' : 'transparent',
                  color: user?.id === dummyUser.id ? 'var(--gray)' : 'var(--text)',
                  border: 'none',
                  fontSize: '13px',
                  cursor: user?.id === dummyUser.id ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontWeight: '600' }}>
                  {dummyUser.name}
                  {user?.id === dummyUser.id && ' ✓'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                  Role: {dummyUser.role} | 
                  {dummyUser.permissions.canViewPurchases && ' Purchase'}
                  {dummyUser.permissions.canViewSales && ' Sales'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
