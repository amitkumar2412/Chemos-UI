'use client';

import { useState, useMemo } from 'react';
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
import { useRevenueData } from '@/lib/hooks/useRevenueData';
import { useCostData } from '@/lib/hooks/useCostData';
import { formatCurrency } from '@/components/dashboard/utils';

import {
  MOCK_KPIS,
  MOCK_ALERTS,
  MOCK_PIPELINE,
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

  // Fetch real revenue data from APIs
  const { totalRevenue, details, loading, error } = useRevenueData();

  // Fetch real cost data from APIs
  const { totalCost, details: costDetails } = useCostData();

  // Update KPIs with real revenue/cost data and detailed breakdown
  const kpis = useMemo(() => {
    return MOCK_KPIS.map((kpi) => {
      if (kpi.id === 'rev') {
        return {
          ...kpi,
          baseValue: totalRevenue,
          details: [
            ['Export', formatCurrency(details.export, currency)],
            ['Local', formatCurrency(details.local, currency)],
            ['Other Revenue', formatCurrency(details.other, currency)],
          ] as [string, string][],
        };
      }
      if (kpi.id === 'orders') {
        return {
          ...kpi,
          baseValue: totalCost,
          details: [
            ['Direct Cost', formatCurrency(costDetails.directCost, currency)],
            ['Indirect Cost', formatCurrency(costDetails.indirectCost, currency)],
            ['Purchase Value', formatCurrency(costDetails.purchaseValue, currency)],
          ] as [string, string][],
        };
      }
      return kpi;
    });
  }, [totalRevenue, details, totalCost, costDetails, currency]);

  return (
    <>
      {/* ── Overview module ───────────────────────────────────────── */}
      {activeModule === 'overview' && (
        <>
          <KpiGrid kpis={kpis} currency={currency} />
          {/* <PipelineSlider stages={MOCK_PIPELINE} /> */}
          <div className="db-grid-icc-alerts">
            <InventoryCommandCentre currency={currency} />
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
