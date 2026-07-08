'use client';

import { useState } from 'react';
import type { Currency } from '@/components/dashboard/types';

import { KpiGrid } from '@/components/dashboard/KpiCard';
import PipelineSlider from '@/components/dashboard/PipelineSlider';
import InventoryCommandCentre from '@/components/dashboard/InventoryCommandCentre';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import RevenueChartCard from '@/components/dashboard/modules/RevenueChartCard';
import ForecastChartCard from '@/components/dashboard/modules/ForecastChartCard';
import ProcurementModule from '@/components/dashboard/modules/ProcurementModule';
import ScmModule from '@/components/dashboard/modules/ScmModule';
import FinanceModule from '@/components/dashboard/modules/FinanceModule';
import ResearchModule from '@/components/dashboard/modules/ResearchModule';
import ComingSoonOverlay from '@/components/dashboard/ComingSoonOverlay';
import { useActiveModule } from '@/lib/activeModuleContext';

import {
  MOCK_KPIS,
  MOCK_ALERTS,
  MOCK_PIPELINE,
  MOCK_ICC,
  MOCK_VENDORS,
  MOCK_PORTS,
  MOCK_PROSPECTS,
  MOCK_TOP_CUSTOMERS,
  MOCK_TOP_SUPPLIERS,
  MOCK_KPI_DRIVERS,
  MOCK_CASHFLOW,
  MOCK_FINANCE_OFFERS,
  MOCK_SHOCK_CHEMICALS,
  MOCK_NEWS,
  MOCK_REVENUE,
} from '@/components/dashboard/data/mockData';

export default function HomePage() {
  const [currency] = useState<Currency>('inr');
  const { activeModule } = useActiveModule();

  return (
    <>
      {/* ── Overview module ───────────────────────────────────────── */}
      {activeModule === 'overview' && (
        <>
          <KpiGrid kpis={MOCK_KPIS} currency={currency} />
          {/* <PipelineSlider stages={MOCK_PIPELINE} /> */}
          <div className="db-grid-icc-alerts">
            <InventoryCommandCentre items={MOCK_ICC} currency={currency} />
            <AlertsPanel alerts={MOCK_ALERTS} />
          </div>
          {/* <div className="db-grid-2">
            <RevenueChartCard data={MOCK_REVENUE} />
            <ForecastChartCard />
          </div> */}
        </>
      )}

      {/* ── Procurement module ─────────────────────────────────────── */}
      {activeModule === 'procurement' && <ProcurementModule vendors={MOCK_VENDORS} />}

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

      {/* ── Finance module — blurred (under development) ───────────── */}
      {activeModule === 'finance' && (
        <ComingSoonOverlay module="Finance Intelligence" progress={40}>
          <FinanceModule offers={MOCK_FINANCE_OFFERS} cashflow={MOCK_CASHFLOW} currency={currency} />
        </ComingSoonOverlay>
      )}

      {/* ── Research & Analysis module — blurred (under development) ── */}
      {activeModule === 'research' && (
        <ComingSoonOverlay module="Research & Analysis" progress={25}>
          <ResearchModule shockChemicals={MOCK_SHOCK_CHEMICALS} news={MOCK_NEWS} />
        </ComingSoonOverlay>
      )}
    </>
  );
}
