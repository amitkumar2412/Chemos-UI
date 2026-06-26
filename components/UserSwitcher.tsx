'use client';

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { logout } from '@/lib/redux/authSlice';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';

export default function UserSwitcher() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    authService.logout();
    dispatch(logout());
    router.replace('/login');
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>
          {user.username}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '1px 6px',
          background: 'var(--blue-dim)',
          color: 'var(--blue)',
          borderRadius: 4,
          letterSpacing: '0.03em',
        }}>
          {user.role}
        </span>
      </div>
      <button
        onClick={handleLogout}
        title="Sign out"
        style={{
          padding: '6px 10px',
          background: 'transparent',
          color: 'var(--red)',
          border: '1px solid var(--red)',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
