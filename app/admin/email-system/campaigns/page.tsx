'use client';

import RecentCampaigns, { NewCampaignLink } from '../_components/RecentCampaigns';

export default function CampaignsPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Campaigns</h2>
        <NewCampaignLink />
      </div>
      <RecentCampaigns />
    </div>
  );
}
