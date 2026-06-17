'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserSwitcher from './UserSwitcher';

export default function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('chemos_theme') as 'dark' | 'light' | null;
    const initial = stored ?? 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('chemos_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const pathname = usePathname();
  return (
    <header className="header">
      <div className="hdr-left">
        <div className="logo">S</div>
        <div>
          <div className="brand">
            Sumairo <span>ChemOS™</span>
          </div>
          <div className="brand-sub">Punch-in Form</div>
        </div>
      </div>
      <nav className="hdr-right">
        <Link className={`hdr-link${pathname === '/' ? ' active' : ''}`} href="/">
          Purchase Form
        </Link>
        <Link className={`hdr-link${pathname === '/sales' ? ' active' : ''}`} href="/sales">
          Sale Form
        </Link>
        <Link className="dash-link" href="/dashboard">
          📊 Dashboard
        </Link>
        <UserSwitcher />
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  );
}
