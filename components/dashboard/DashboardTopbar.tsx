'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Currency, Period, Notification } from './types';
import UserSwitcher from '../UserSwitcher';

interface DashboardTopbarProps {
  period: Period;
  currency: Currency;
  asOf: string | null;
  notifications: Notification[];
  onPeriodChange: (p: Period) => void;
  onCurrencyChange: (c: Currency) => void;
  onAsOfChange: (d: string | null) => void;
  onMenuToggle?: () => void;
}

export default function DashboardTopbar({
  period, currency, asOf, notifications,
  onPeriodChange, onCurrencyChange, onAsOfChange, onMenuToggle,
}: DashboardTopbarProps) {
  const [showNotif, setShowNotif]   = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [spinning, setSpinning]     = useState(false);
  const [lastRefresh, setLastRefresh] = useState('just now');

  const notifRef  = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotif(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
        setShowAvatar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setLastRefresh('just now');
    }, 800);
  };

  const todayISO = () => new Date().toISOString().split('T')[0];

  return (
    <header className="db-topbar">
      {/* Hamburger — mobile only */}
      <button className="db-hamburger" onClick={onMenuToggle} aria-label="Open menu">
        <span /><span /><span />
      </button>

      {/* Left — Brand */}
      <div className="db-tb-left">
        <div className="db-tb-logo">S</div>
        <div>
          <div className="db-tb-name">Sumairo <span>ChemOS™</span></div>
          <div className="db-tb-sub">Enterprise Intelligence Platform</div>
        </div>
      </div>

      {/* Center — Period / Date / Currency */}
      <div className="db-tb-center">
        <div className="db-period-bar">
          {(['today','mtd','qtd','ytd'] as Period[]).map((p) => (
            <button
              key={p}
              className={period === p ? 'active' : ''}
              onClick={() => onPeriodChange(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={`db-asof${asOf ? ' historical' : ''}`}>
          <span className="db-asof-label">{asOf ? 'AS OF' : 'LIVE'}</span>
          <input
            type="date"
            value={asOf ?? ''}
            max={todayISO()}
            onChange={(e) => onAsOfChange(e.target.value || null)}
          />
          {asOf && (
            <button className="db-asof-clear" onClick={() => onAsOfChange(null)} title="Back to live">
              ×
            </button>
          )}
        </div>

        <div className="db-currency">
          {([['inr','₹'],['usd','$'],['eur','€']] as [Currency, string][]).map(([c, sym]) => (
            <button
              key={c}
              className={currency === c ? 'active' : ''}
              onClick={() => onCurrencyChange(c)}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Right — Actions */}
      <div className="db-tb-right">
        {/* Theme toggle (replaces Purchase/Sale links) */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Toggle theme'}
          aria-label={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Toggle theme'}
          style={{ fontSize: 16, padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          suppressHydrationWarning
        >
          {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌙'}
        </button>

        {/* Search */}
        <div className="db-search">
          <span>Quick actions…</span>
          <kbd>⌘K</kbd>
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <div className="db-icon" onClick={() => setShowNotif((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && <div className="db-badge" />}
          </div>

          <div className={`db-notif-panel${showNotif ? ' show' : ''}`}>
            <div className="db-notif-header">
              <span className="db-notif-title">Notifications</span>
              <span className="db-notif-clear">Mark all read</span>
            </div>
            {notifications.map((n, i) => (
              <div key={i} className={`db-notif-item${!n.read ? ' unread' : ''}`}>
                <span className="db-notif-icon">{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="db-notif-text">{n.text}</div>
                  <div className="db-notif-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh */}
        <div className="db-refresh-wrap">
          <span className="db-refresh">Last {lastRefresh}</span>
          <button
            className={`db-refresh-btn${spinning ? ' spinning' : ''}`}
            onClick={handleRefresh}
            title="Refresh"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        {/* User Switcher for Testing */}
        <UserSwitcher />

        {/* Avatar */}
        <div ref={avatarRef} className="db-avatar-wrap">
          <div className="db-avatar" onClick={() => setShowAvatar((v) => !v)}>SK</div>
          <div className={`db-avatar-menu${showAvatar ? ' show' : ''}`}>
            <div className="db-avatar-menu-item">👤 My Profile</div>
            <div className="db-avatar-menu-item">⚙️ Preferences</div>
            <div className="db-avatar-menu-item">🔔 Alert Rules</div>
            <div className="db-avatar-divider" />
            <div className="db-avatar-menu-item">🔑 API Keys</div>
            <div className="db-avatar-menu-item">📖 Docs</div>
            <div className="db-avatar-divider" />
            <div className="db-avatar-menu-item danger">🚪 Sign Out</div>
          </div>
        </div>
      </div>
    </header>
  );
}
