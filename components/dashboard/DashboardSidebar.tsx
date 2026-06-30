'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type DashboardModule = 'overview' | 'procurement' | 'scm' | 'finance' | 'research';

interface DashboardSidebarProps {
  activeModule: DashboardModule;
  onModuleChange: (m: DashboardModule) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

type MainCategory = 'main' | 'intelligence' | 'purchase' | 'sales' | 'inventory' | 'comparable' | 'admin' | 'template' | null;

const ICON_OVERVIEW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ICON_INTELLIGENCE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ICON_PURCHASE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const ICON_SALES = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

const ICON_ADMIN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M12 2L2 7v7c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ICON_INVENTORY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 12h4" />
  </svg>
);

const ICON_COMPARABLE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <rect x="2" y="3" width="8" height="18" rx="1" />
    <rect x="14" y="3" width="8" height="18" rx="1" />
    <line x1="6" y1="8" x2="6" y2="8.01" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="18" y1="8" x2="18" y2="8.01" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ICON_TEMPLATE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

// Icons for secondary items
const ICON_SMALL_OVERVIEW = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" />
    <rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" />
  </svg>
);

const ICON_SMALL_PROCUREMENT = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M4 1L2 4v8a1 1 0 001 1h10a1 1 0 001-1V4l-2-3z" />
    <line x1="2" y1="4" x2="14" y2="4" />
  </svg>
);

const ICON_SMALL_SCM = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <polyline points="15 8 12 8 10 14 6 2 4 8 1 8" />
  </svg>
);

const ICON_SMALL_FINANCE = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <line x1="8" y1="1" x2="8" y2="15" />
    <path d="M11 3H6.5a2 2 0 000 4h3a2 2 0 010 4H5" />
  </svg>
);

const ICON_SMALL_RESEARCH = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <circle cx="7" cy="7" r="5" />
    <line x1="14" y1="14" x2="11" y2="11" />
  </svg>
);

const ICON_SMALL_FORM = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V5z" />
    <polyline points="9 1 9 5 13 5" />
  </svg>
);

export default function DashboardSidebar({ activeModule, onModuleChange, mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const [activeMain, setActiveMain] = useState<MainCategory>(null);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  const toggleMain = (id: MainCategory) => setActiveMain((s) => (s === id ? null : id));

  useEffect(() => {
    if (!activeMain) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setActiveMain(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMain]);

  return (
    <>
      {mobileOpen && <div className="db-sidebar-overlay show" onClick={onMobileClose} />}
      <aside ref={sidebarRef} className={`db-sidebar-wrapper${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Icon-only main column */}
      <div className="db-sb-icon-col">
        <button 
          className={`db-sb-icon-btn${activeMain === 'main' ? ' active' : ''}`} 
          onClick={() => toggleMain('main')}
          title="Main"
        >
          {ICON_OVERVIEW}
          <span className="db-sb-icon-label">Main</span>
        </button>
        <button 
          className={`db-sb-icon-btn${activeMain === 'intelligence' ? ' active' : ''}`} 
          onClick={() => toggleMain('intelligence')}
          title="Intelligence"
        >
          {ICON_INTELLIGENCE}
          <span className="db-sb-icon-label">Intelligence</span>
        </button>
        <button 
          className={`db-sb-icon-btn${activeMain === 'purchase' ? ' active' : ''}`} 
          onClick={() => toggleMain('purchase')}
          title="Purchase"
        >
          {ICON_PURCHASE}
          <span className="db-sb-icon-label">Purchase</span>
        </button>
        <button 
          className={`db-sb-icon-btn${activeMain === 'sales' ? ' active' : ''}`} 
          onClick={() => toggleMain('sales')}
          title="Sales"
        >
          {ICON_SALES}
          <span className="db-sb-icon-label">Sales</span>
        </button>
        {/* <button
          className={`db-sb-icon-btn${activeMain === 'inventory' ? ' active' : ''}`}
          onClick={() => toggleMain('inventory')}
          title="Inventory"
        >
          {ICON_INVENTORY}
          <span className="db-sb-icon-label">Inventory</span>
        </button> */}
        <Link
          href="/comparable"
          className={`db-sb-icon-btn${pathname === '/comparable' ? ' active' : ''}`}
          title="Comparable"
          onClick={() => setActiveMain(null)}
          style={{ textDecoration: 'none' }}
        >
          {ICON_COMPARABLE}
          <span className="db-sb-icon-label">Comparable</span>
        </Link>
        <button
          className={`db-sb-icon-btn${activeMain === 'admin' ? ' active' : ''}`}
          onClick={() => toggleMain('admin')}
          title="Admin"
        >
          {ICON_ADMIN}
          <span className="db-sb-icon-label">Admin</span>
        </button>
        <button
          className={`db-sb-icon-btn${activeMain === 'template' ? ' active' : ''}`}
          onClick={() => toggleMain('template')}
          title="Template"
        >
          {ICON_TEMPLATE}
          <span className="db-sb-icon-label">Template</span>
        </button>

        <div className="db-sb-spacer" />
        
        <div className="db-sb-footer">
          <div className="db-sb-footer-text">Sumairo ChemOS™ v3.2<br />© 2026 Sumairo</div>
        </div>
      </div>

      {/* Secondary panel: slides in when a main icon is active */}
      {activeMain && (
        <div className="db-sb-secondary-panel">
          {activeMain === 'main' && (
            <div className="db-sb-secondary-content">
              <div className="db-sb-secondary-header">Main</div>
              <Link
                href="/"
                className={`db-sb-secondary-item${activeModule === 'overview' ? ' active' : ''}`}
                onClick={() => {
                  onModuleChange('overview');
                  setActiveMain(null);
                }}
              >
                <span className="db-sb-secondary-icon">{ICON_SMALL_OVERVIEW}</span>
                Overview
              </Link>
              {/* <button 
                className={`db-sb-secondary-item${activeModule === 'procurement' ? ' active' : ''}`} 
                onClick={() => onModuleChange('procurement')}
              >
                <span className="db-sb-secondary-icon">{ICON_SMALL_PROCUREMENT}</span>
                Procurement
              </button>
              <button 
                className={`db-sb-secondary-item${activeModule === 'scm' ? ' active' : ''}`} 
                onClick={() => onModuleChange('scm')}
              >
                <span className="db-sb-secondary-icon">{ICON_SMALL_SCM}</span>
                SCM Intelligence
              </button> */}
            </div>
          )}

          {activeMain === 'intelligence' && (
            <div className="db-sb-secondary-content">
              <div className="db-sb-secondary-header">Intelligence</div>
              <button
                className={`db-sb-secondary-item${activeModule === 'finance' ? ' active' : ''}`}
                onClick={() => { onModuleChange('finance'); setActiveMain(null); }}
              >
                <span className="db-sb-secondary-icon">{ICON_SMALL_FINANCE}</span>
                Finance
              </button>
              <button
                className={`db-sb-secondary-item${activeModule === 'research' ? ' active' : ''}`}
                onClick={() => { onModuleChange('research'); setActiveMain(null); }}
              >
                <span className="db-sb-secondary-icon">{ICON_SMALL_RESEARCH}</span>
                Research & Analysis
              </button>
            </div>
          )}

          {activeMain === 'purchase' && (
            <div className="db-sb-secondary-content">
              <div className="db-sb-secondary-header">Purchase</div>
              {/* <Link href="/enquiry" className="db-sb-secondary-item">
                <span className="db-sb-secondary-icon">{ICON_SMALL_FORM}</span>
                Purchase Enquiries
              </Link> */}
              <Link href="/purchases" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">{ICON_SMALL_PROCUREMENT}</span>
                Purchase Orders
              </Link>
            </div>
          )}

          {activeMain === 'sales' && (
            <div className="db-sb-secondary-content">
              <div className="db-sb-secondary-header">Sales</div>
              {/* <Link href="/sale-enquiry" className="db-sb-secondary-item">
                <span className="db-sb-secondary-icon">{ICON_SMALL_FORM}</span>
                Sale Enquiries
              </Link> */}
              <Link href="/sales" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">{ICON_SMALL_PROCUREMENT}</span>
                Sale Orders
              </Link>
            </div>
          )}

          {activeMain === 'admin' && (
            <div className="db-sb-secondary-content">
              <div className="db-sb-secondary-header">Admin</div>
              <Link href="/admin" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">{ICON_SMALL_FORM}</span>
                Orders Management
              </Link>
              <Link href="/admin/purchase-sale-link" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <path d="M2 8h3M11 8h3M5 5l-2 3 2 3M11 5l2 3-2 3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="5" cy="8" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="11" cy="8" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                Purchase-Sale Link
              </Link>
              <Link href="/admin/users" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                  </svg>
                </span>
                Users
              </Link>
              <Link href="/admin/audit" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1z" />
                    <line x1="4" y1="6" x2="12" y2="6" />
                    <line x1="4" y1="9" x2="9" y2="9" />
                    <circle cx="12" cy="11" r="2" />
                    <line x1="13.4" y1="12.4" x2="15" y2="14" />
                  </svg>
                </span>
                Audit Trail
              </Link>
            </div>
          )}

          {activeMain === 'template' && (
            <div className="db-sb-secondary-content">
              <div className="db-sb-secondary-header">Template</div>
              <Link href="/template/purchase" className="db-sb-secondary-item" onClick={() => setActiveMain(null)}>
                <span className="db-sb-secondary-icon">{ICON_SMALL_PROCUREMENT}</span>
                Purchase
              </Link>
            </div>
          )}
        </div>
      )}
    </aside>
    </>
  );
}
