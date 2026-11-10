'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { friendlyError } from '../../_lib/api/client';
import { campaignsApi, productsApi } from '../../_lib/api/resources';
import { useCampaigns } from '../../_lib/campaigns';
import { useQuery } from '../../_lib/hooks';
import { parsePrice } from '../../_lib/logic';
import { EmptyState, ErrorState, Field, SkeletonRows, cardStyle, inputStyle, primaryButton } from '../../_components/ui';

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign } = useCampaigns();
  const products = useQuery(() => productsApi.list(true), []);
  const [name, setName] = useState('');
  const [chemicalId, setChemicalId] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<{ name?: string; chemicalId?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Campaign name is required';
    else if (name.trim().length > 255) next.name = 'Name must be 255 characters or fewer';
    if (!chemicalId) next.chemicalId = 'Choose a chemical';
    const parsed = parsePrice(price);
    if (parsed.error) next.price = parsed.error;
    setErrors(next);
    if (Object.keys(next).length || parsed.value === undefined) return;

    setSaving(true);
    try {
      const campaign = await campaignsApi.create({ name: name.trim(), chemicalId, offerPrice: parsed.value });
      addCampaign({
        id: campaign.id,
        name: campaign.name,
        chemicalId: campaign.chemical.id,
        chemicalName: campaign.chemical.name,
        offerPrice: campaign.offerPrice,
        createdAt: new Date().toISOString(),
      });
      router.push(`/admin/email-system/campaigns/${campaign.id}/recipients`);
    } catch (err) {
      toast.error(friendlyError(err));
      setSaving(false);
    }
  };

  if (products.error && !products.data) return <ErrorState error={products.error} onRetry={products.reload} />;
  if (products.loading && !products.data) return <SkeletonRows rows={3} />;
  if (products.data && products.data.length === 0) {
    return <EmptyState title="Add a chemical first" text="A campaign needs an active chemical to offer. Add one on the Chemicals tab." />;
  }

  return (
    <form onSubmit={submit} style={{ ...cardStyle, maxWidth: '560px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Step 1 · Campaign details</h2>
      <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '18px' }}>
        Name, chemical and base price cannot be edited after the campaign is created. The base price can be overridden per recipient later.
      </p>
      <Field label="Campaign name" error={errors.name}>
        <input style={inputStyle} value={name} maxLength={255} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Chemical" error={errors.chemicalId}>
        <select style={inputStyle} value={chemicalId} onChange={(e) => setChemicalId(e.target.value)}>
          <option value="">Select a chemical…</option>
          {products.data?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
        </select>
      </Field>
      <Field label="Base offer price" hint="Positive number, up to 2 decimals." error={errors.price}>
        <input style={inputStyle} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
      </Field>
      <button type="submit" style={primaryButton} disabled={saving}>{saving ? 'Creating…' : 'Create campaign & continue'}</button>
    </form>
  );
}
