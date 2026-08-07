import { useState, useEffect } from 'react';
import { apiClient } from '../apiClient';

interface RevenueCsvResponse {
  message: string;
  data: {
    totalAmount: number;
  };
}

interface SalesLiftedResponse {
  grandTotal: number;
  byType: Array<{
    saleType: string;
    totalValue: number;
  }>;
}

export interface RevenueDetails {
  export: number;
  local: number;
  other: number;
}

export function useRevenueData() {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [details, setDetails] = useState<RevenueDetails>({
    export: 0,
    local: 0,
    other: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from both APIs in parallel
        const [revenueCsvData, salesLiftedData] = await Promise.all([
          apiClient.get<RevenueCsvResponse>('/revenue-csv/entries/total'),
          apiClient.get<SalesLiftedResponse>('/sales/lifted-value-summary'),
        ]);

        // Extract breakdown by sale type
        const exportValue = salesLiftedData.byType.find(t => t.saleType === 'Export')?.totalValue ?? 0;
        const localValue = salesLiftedData.byType.find(t => t.saleType === 'Local')?.totalValue ?? 0;
        const otherRevenue = revenueCsvData.data.totalAmount;

        // Sum the total amounts
        const total = otherRevenue + salesLiftedData.grandTotal;
        
        setTotalRevenue(total);
        setDetails({
          export: exportValue,
          local: localValue,
          other: otherRevenue,
        });
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
        setTotalRevenue(0);
        setDetails({ export: 0, local: 0, other: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  return { totalRevenue, details, loading, error };
}
