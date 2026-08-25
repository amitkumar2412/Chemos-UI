import { useState, useEffect } from 'react';
import { apiClient } from '../apiClient';

interface CostCsvTotalResponse {
  message: string;
  data: {
    totalDirectCost: number;
    totalIndirectCost: number;
  };
}

interface ReceivedPurchaseValueResponse {
  message: string;
  data: {
    total_value: number;
    purchase_count: number;
  };
}

export interface CostDetails {
  directCost: number;
  indirectCost: number;
  purchaseValue: number;
}

export function useCostData() {
  const [totalCost, setTotalCost] = useState<number>(0);
  const [details, setDetails] = useState<CostDetails>({
    directCost: 0,
    indirectCost: 0,
    purchaseValue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCost = async () => {
      setLoading(true);
      setError(null);

      // Fetch independently — e.g. cost-csv returns 400 "No CSV uploads
      // found" when nothing's been uploaded yet, which shouldn't wipe out
      // the purchase received-value figure (or vice versa).
      const [costCsvResult, receivedValueResult] = await Promise.allSettled([
        apiClient.get<CostCsvTotalResponse>('/cost-csv/entries/total'),
        apiClient.get<ReceivedPurchaseValueResponse>('/purchase/received-value'),
      ]);

      const directCost = costCsvResult.status === 'fulfilled' ? costCsvResult.value.data.totalDirectCost : 0;
      const indirectCost = costCsvResult.status === 'fulfilled' ? costCsvResult.value.data.totalIndirectCost : 0;
      const purchaseValue = receivedValueResult.status === 'fulfilled' ? receivedValueResult.value.data.total_value : 0;

      if (costCsvResult.status === 'rejected') {
        console.error('Error fetching cost-csv total:', costCsvResult.reason);
      }
      if (receivedValueResult.status === 'rejected') {
        console.error('Error fetching purchase received value:', receivedValueResult.reason);
      }
      if (costCsvResult.status === 'rejected' && receivedValueResult.status === 'rejected') {
        setError('Failed to fetch cost data');
      }

      setTotalCost(directCost + indirectCost + purchaseValue);
      setDetails({ directCost, indirectCost, purchaseValue });
      setLoading(false);
    };

    fetchCost();
  }, []);

  return { totalCost, details, loading, error };
}
