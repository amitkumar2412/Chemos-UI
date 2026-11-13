'use client';

import { useParams } from 'next/navigation';
import PersonalizeStep from '../../../_components/wizard/PersonalizeStep';
import RepliesView from '../../../_components/RepliesView';
import ProgressStep from '../../../_components/wizard/ProgressStep';
import RecipientsStep from '../../../_components/wizard/RecipientsStep';
import ReviewStep from '../../../_components/wizard/ReviewStep';
import TemplatesStep from '../../../_components/wizard/TemplatesStep';
import { EmptyState } from '../../../_components/ui';

export default function CampaignStepPage() {
  const params = useParams<{ id: string; step: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) return <EmptyState title="Not found" text="This campaign link is not valid." />;

  switch (params.step) {
    case 'recipients': return <RecipientsStep campaignId={id} />;
    case 'templates': return <TemplatesStep campaignId={id} />;
    case 'personalize': return <PersonalizeStep campaignId={id} />;
    case 'review': return <ReviewStep campaignId={id} />;
    case 'progress': return <ProgressStep campaignId={id} />;
    case 'replies': return <RepliesView campaignId={id} />;
    default: return <EmptyState title="Not found" text="Unknown campaign step." />;
  }
}
