'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { campaignsApi } from '../../_lib/api/resources';
import { useCampaigns } from '../../_lib/campaigns';
import { useQuery } from '../../_lib/hooks';
import { ErrorState, SkeletonRows } from '../../_components/ui';

// Picks the step a returning user most likely wants, based on what the API says about the recipients.
export default function CampaignResumePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const { getCampaign } = useCampaigns();
  const campaign = getCampaign(id);
  const { data, error, reload } = useQuery(() => campaignsApi.recipients(id, { page: 0, size: 1000 }), [id]);

  useEffect(() => {
    if (!data) return;
    const base = `/admin/email-system/campaigns/${id}`;
    let step = 'review';
    if (data.total === 0) step = 'recipients';
    else if (data.items.some((r) => r.status !== 'PENDING')) step = 'progress';
    else if (!campaign?.templateIds?.length) step = 'templates';
    router.replace(`${base}/${step}`);
  }, [data, id, router, campaign?.templateIds?.length]);

  if (!Number.isInteger(id)) return <ErrorState error={new Error('Invalid campaign')} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <SkeletonRows rows={3} />;
}
