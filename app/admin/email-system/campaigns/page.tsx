'use client';

import RecentCampaigns, { NewCampaignLink } from '../_components/RecentCampaigns';
import { Banner } from '../_components/ui';

export default function CampaignsPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent campaigns</h2>
        <NewCampaignLink />
      </div>
      <Banner tone="info">
        The email service cannot list campaigns yet, so this shows campaigns created in this browser. Open one to continue or track it.
      </Banner>
      <RecentCampaigns />
    </div>
  );
}
