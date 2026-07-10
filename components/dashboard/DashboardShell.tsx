'use client';

import { useState } from 'react';
import type { Period, Currency } from './types';
import type { DashboardModule } from './DashboardSidebar';

import DashboardTopbar   from './DashboardTopbar';
import DashboardSidebar  from './DashboardSidebar';
import { KpiGrid }       from './KpiCard';
import PipelineSlider    from './PipelineSlider';
import InventoryCommandCentre from './InventoryCommandCentre';
import AlertsPanel       from './AlertsPanel';
import RevenueChartCard  from './modules/RevenueChartCard';
import ForecastChartCard from './modules/ForecastChartCard';
import ProcurementModule from './modules/ProcurementModule';
import ScmModule         from './modules/ScmModule';
import FinanceModule     from './modules/FinanceModule';
import ResearchModule    from './modules/ResearchModule';

import {
  MOCK_KPIS, MOCK_ALERTS, MOCK_PIPELINE,
  MOCK_VENDORS, MOCK_PORTS, MOCK_PROSPECTS,
  MOCK_TOP_CUSTOMERS, MOCK_TOP_SUPPLIERS,
  MOCK_KPI_DRIVERS, MOCK_CASHFLOW, MOCK_FINANCE_OFFERS,
  MOCK_SHOCK_CHEMICALS, MOCK_NEWS, MOCK_NOTIFICATIONS, MOCK_REVENUE,
} from './data/mockData';

export default function DashboardShell() {
  const [period,       setPeriod]   = useState<Period>('mtd');
  const [currency,     setCurrency] = useState<Currency>('inr');
  const [asOf,         setAsOf]     = useState<string | null>(null);
  const [activeModule, setModule]   = useState<DashboardModule>('overview');

  return (
    <div className="db-shell">
      {/* Top bar */}
      <DashboardTopbar
        period={period}
        currency={currency}
        asOf={asOf}
        notifications={MOCK_NOTIFICATIONS}
        onPeriodChange={setPeriod}
        onCurrencyChange={setCurrency}
        onAsOfChange={setAsOf}
      />

      {/* Sidebar */}
      <DashboardSidebar activeModule={activeModule} onModuleChange={setModule} />

      {/* Main content */}
      <main className="db-main">

        {/* ── Overview module ────────────────────────────────────────── */}
        {activeModule === 'overview' && (
          <>
            {/* KPI cards */}
            <KpiGrid kpis={MOCK_KPIS} currency={currency} />

            {/* Pipeline */}
            {/* <PipelineSlider stages={MOCK_PIPELINE} /> */}

            {/* ICC + Alerts row */}
            <div className="db-grid-icc-alerts">
              <InventoryCommandCentre currency={currency} />
              <AlertsPanel alerts={MOCK_ALERTS} />
            </div>

            {/* Revenue + Forecast charts */}
            {/* <div className="db-grid-2">
              <RevenueChartCard data={MOCK_REVENUE} />
              <ForecastChartCard />
            </div> */}
          </>
        )}

        {/* ── Procurement module ─────────────────────────────────────── */}
        {activeModule === 'procurement' && (
          <ProcurementModule vendors={MOCK_VENDORS} />
        )}

        {/* ── SCM Intelligence module ────────────────────────────────── */}
        {activeModule === 'scm' && (
          <ScmModule
            topCustomers={MOCK_TOP_CUSTOMERS}
            topSuppliers={MOCK_TOP_SUPPLIERS}
            kpiDrivers={MOCK_KPI_DRIVERS}
            ports={MOCK_PORTS}
            prospects={MOCK_PROSPECTS}
          />
        )}

        {/* ── Finance module ─────────────────────────────────────────── */}
        {activeModule === 'finance' && (
          <FinanceModule
            offers={MOCK_FINANCE_OFFERS}
            cashflow={MOCK_CASHFLOW}
            currency={currency}
          />
        )}

        {/* ── Research & Analysis module ─────────────────────────────── */}
        {activeModule === 'research' && (
          <ResearchModule
            shockChemicals={MOCK_SHOCK_CHEMICALS}
            news={MOCK_NEWS}
          />
        )}

      </main>
    </div>
  );
}
