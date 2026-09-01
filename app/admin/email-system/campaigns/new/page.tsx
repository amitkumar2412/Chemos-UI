'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmailSystemTabs from '../../_components/EmailSystemTabs';
import { useEmailSystem } from '../../_lib/store';
import { CHEMICALS, CUSTOMERS, EMAIL_TEMPLATES } from '../../data';
import { renderTemplate, type Campaign, type CampaignGroup } from '../../types';

interface GroupDraft {
  id: string;
  chemicalId: string;
  price: number;
  templateId: string;
  subject: string;
  body: string;
}

const STEPS = ['Select Customers', 'Offers & Groups', 'Preview & Edit', 'Review & Send'];

function makeGroup(idx: number): GroupDraft {
  const chemical = CHEMICALS[idx % CHEMICALS.length];
  const template = EMAIL_TEMPLATES[idx % EMAIL_TEMPLATES.length];
  return {
    id: `grp-${idx}-${chemical.id}`,
    chemicalId: chemical.id,
    price: chemical.refPrice,
    templateId: template.id,
    subject: template.subject,
    body: template.body,
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--navy-light)', border: '1px solid var(--border)',
  borderRadius: '8px', fontSize: '14px', color: 'var(--white)', outline: 'none', boxSizing: 'border-box',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign } = useEmailSystem();

  const [step, setStep] = useState(0);
  const [campaignName, setCampaignName] = useState('');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupDraft[]>([]);
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [previewCustomerByGroup, setPreviewCustomerByGroup] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CUSTOMERS;
    return CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q));
  }, [query]);

  const allFilteredSelected = filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedIds.includes(c.id));

  const toggleCustomer = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredCustomers.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredCustomers.map((c) => c.id)])));
    }
  };

  const goToStep2 = () => {
    let currentGroups = groups;
    if (currentGroups.length === 0) {
      currentGroups = [makeGroup(0)];
      setGroups(currentGroups);
    }
    const firstGroupId = currentGroups[0].id;
    setAssignment((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (!next[id] || !currentGroups.some((g) => g.id === next[id])) next[id] = firstGroupId;
      });
      Object.keys(next).forEach((id) => {
        if (!selectedIds.includes(id)) delete next[id];
      });
      return next;
    });
    setStep(1);
  };

  const addGroup = () => {
    const g = makeGroup(groups.length);
    setGroups((prev) => [...prev, g]);
  };

  const removeGroup = (id: string) => {
    if (groups.length <= 1) return;
    const remaining = groups.filter((g) => g.id !== id);
    setGroups(remaining);
    setAssignment((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((custId) => {
        if (next[custId] === id) next[custId] = remaining[0].id;
      });
      return next;
    });
  };

  const updateGroup = (id: string, patch: Partial<GroupDraft>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const handleChemicalChange = (groupId: string, chemicalId: string) => {
    const chemical = CHEMICALS.find((c) => c.id === chemicalId);
    updateGroup(groupId, { chemicalId, price: chemical?.refPrice ?? 0 });
  };

  const handleTemplateChange = (groupId: string, templateId: string) => {
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    updateGroup(groupId, { templateId, subject: template.subject, body: template.body });
  };

  const customersOfGroup = (groupId: string) =>
    CUSTOMERS.filter((c) => selectedIds.includes(c.id) && assignment[c.id] === groupId);

  const activeGroups = groups.filter((g) => customersOfGroup(g.id).length > 0);

  const goToStep3 = () => setStep(2);

  const goToStep4 = () => {
    setStep(3);
    if (!campaignName.trim()) {
      const firstChemical = CHEMICALS.find((c) => c.id === activeGroups[0]?.chemicalId);
      setCampaignName(`${firstChemical?.name ?? 'Chemical'} Offer — ${new Date().toLocaleDateString()}`);
    }
  };

  const totalRecipients = activeGroups.reduce((sum, g) => sum + customersOfGroup(g.id).length, 0);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      const campaign: Campaign = {
        id: `camp-${Date.now()}`,
        name: campaignName.trim() || 'Untitled Campaign',
        createdAt: new Date().toISOString(),
        status: 'sent',
        groups: activeGroups.map<CampaignGroup>((g) => ({
          id: g.id,
          chemicalId: g.chemicalId,
          price: g.price,
          templateId: g.templateId,
          subject: g.subject,
          body: g.body,
          customerIds: customersOfGroup(g.id).map((c) => c.id),
        })),
      };
      addCampaign(campaign);
      setSending(false);
      toast.success(`Campaign sent to ${totalRecipients} customer${totalRecipients !== 1 ? 's' : ''}!`);
      router.push(`/admin/email-system/campaigns/${campaign.id}`);
    }, 1200);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Create and send a new campaign.</p>
      </div>

      <EmailSystemTabs />

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '8px' }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                  background: i <= step ? 'var(--blue)' : 'var(--navy-light)',
                  color: i <= step ? 'white' : 'var(--gray)',
                  border: i <= step ? 'none' : '1px solid var(--border)',
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: i === step ? 'var(--white)' : 'var(--gray)' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Customers */}
      {step === 0 && (
        <div>
          <input
            type="text"
            placeholder="Search by name or company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ ...inputStyle, maxWidth: '360px', marginBottom: '14px' }}
          />
          <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
            {selectedIds.length} selected · {filteredCustomers.length} shown
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '12px 20px', width: '40px', background: 'var(--navy-light)' }}>
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                    </th>
                    {['Customer', 'Company', 'Email', 'City'].map((col) => (
                      <th key={col} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--navy-light)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, idx) => (
                    <tr
                      key={c.id}
                      onClick={() => toggleCustomer(c.id)}
                      style={{ borderBottom: idx < filteredCustomers.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '12px 20px' }} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleCustomer(c.id)} />
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.companyName}</td>
                      <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.email}</td>
                      <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button
            onClick={goToStep2}
            disabled={selectedIds.length === 0}
            style={{
              padding: '11px 28px', background: selectedIds.length === 0 ? 'var(--gray)' : 'var(--blue)', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Next: Offers & Groups →
          </button>
        </div>
      )}

      {/* Step 2: Offers & Groups */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '18px' }}>
            Create one or more offer groups — each with its own chemical, price and template — then assign your selected customers to a group.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {groups.map((g, gi) => {
              const chemical = CHEMICALS.find((c) => c.id === g.chemicalId);
              const count = customersOfGroup(g.id).length;
              return (
                <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Group {gi + 1} <span style={{ fontWeight: 400, color: 'var(--gray)', fontSize: '13px' }}>· {count} customer{count !== 1 ? 's' : ''}</span></div>
                    {groups.length > 1 && (
                      <button
                        onClick={() => removeGroup(g.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray)' }}>Chemical</label>
                      <select value={g.chemicalId} onChange={(e) => handleChemicalChange(g.id, e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {CHEMICALS.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray)' }}>Price (₹/{chemical?.unit ?? 'MT'})</label>
                      <input
                        type="number"
                        value={g.price}
                        onChange={(e) => updateGroup(g.id, { price: Number(e.target.value) })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray)' }}>Template</label>
                      <select value={g.templateId} onChange={(e) => handleTemplateChange(g.id, e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {EMAIL_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={addGroup}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed var(--border)',
              borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--blue)',
              cursor: 'pointer', marginBottom: '28px',
            }}
          >
            + Add Group
          </button>

          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Assign customers to groups</h3>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--navy-light)', borderBottom: '1px solid var(--border)' }}>
                  {['Customer', 'Company', 'Group'].map((col) => (
                    <th key={col} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CUSTOMERS.filter((c) => selectedIds.includes(c.id)).map((c, idx, arr) => (
                  <tr key={c.id} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--gray)' }}>{c.companyName}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <select
                        value={assignment[c.id] ?? groups[0]?.id}
                        onChange={(e) => setAssignment((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        style={{ ...inputStyle, padding: '7px 12px', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {groups.map((g, gi) => (
                          <option key={g.id} value={g.id}>Group {gi + 1} — {CHEMICALS.find((c2) => c2.id === g.chemicalId)?.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(0)} style={{ padding: '11px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--white)', cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={goToStep3} style={{ padding: '11px 28px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Next: Preview & Edit →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '18px' }}>
            Preview how each group's email will look for a recipient, and tweak the wording if you like — placeholders stay live for every customer in the group.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            {activeGroups.map((g, gi) => {
              const chemical = CHEMICALS.find((c) => c.id === g.chemicalId);
              const groupCustomers = customersOfGroup(g.id);
              const previewId = previewCustomerByGroup[g.id] ?? groupCustomers[0]?.id;
              const previewCustomer = groupCustomers.find((c) => c.id === previewId) ?? groupCustomers[0];
              const rendered = previewCustomer
                ? renderTemplate(g.body, {
                    customerName: previewCustomer.name,
                    companyName: previewCustomer.companyName,
                    chemicalName: chemical?.name ?? '',
                    price: g.price.toLocaleString('en-IN'),
                  })
                : g.body;
              const renderedSubject = previewCustomer
                ? renderTemplate(g.subject, {
                    customerName: previewCustomer.name,
                    companyName: previewCustomer.companyName,
                    chemicalName: chemical?.name ?? '',
                    price: g.price.toLocaleString('en-IN'),
                  })
                : g.subject;

              return (
                <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>
                      Group {gi + 1} · {chemical?.name} @ ₹{g.price.toLocaleString('en-IN')}/{chemical?.unit}
                    </div>
                    {groupCustomers.length > 1 && (
                      <select
                        value={previewId}
                        onChange={(e) => setPreviewCustomerByGroup((prev) => ({ ...prev, [g.id]: e.target.value }))}
                        style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {groupCustomers.map((c) => (
                          <option key={c.id} value={c.id}>Preview as: {c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray)' }}>Subject (editable)</label>
                      <input value={g.subject} onChange={(e) => updateGroup(g.id, { subject: e.target.value })} style={{ ...inputStyle, marginBottom: '14px' }} />
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray)' }}>Body (editable)</label>
                      <textarea
                        value={g.body}
                        onChange={(e) => updateGroup(g.id, { body: e.target.value })}
                        rows={12}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray)' }}>
                        Live preview {previewCustomer ? `— to ${previewCustomer.name}` : ''}
                      </label>
                      <div style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', height: '336px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                          {renderedSubject}
                        </div>
                        <div style={{ fontSize: '13px', whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--gray)' }}>{rendered}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(1)} style={{ padding: '11px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--white)', cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={goToStep4} style={{ padding: '11px 28px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Next: Review & Send →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Send */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: '20px', maxWidth: '480px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Campaign Name</label>
            <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--blue)' }}>{activeGroups.length}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>Offer Group{activeGroups.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green)' }}>{totalRecipients}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>Total Recipients</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {activeGroups.map((g, gi) => {
              const chemical = CHEMICALS.find((c) => c.id === g.chemicalId);
              const template = EMAIL_TEMPLATES.find((t) => t.id === g.templateId);
              const groupCustomers = customersOfGroup(g.id);
              return (
                <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                    Group {gi + 1}: {chemical?.name} @ ₹{g.price.toLocaleString('en-IN')}/{chemical?.unit}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>Template: {template?.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                    {groupCustomers.length} recipient{groupCustomers.length !== 1 ? 's' : ''}: {groupCustomers.map((c) => c.name).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(2)} disabled={sending} style={{ padding: '11px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--white)', cursor: sending ? 'not-allowed' : 'pointer' }}>
              ← Back
            </button>
            <button
              onClick={handleSend}
              disabled={sending || totalRecipients === 0}
              style={{
                padding: '11px 28px', background: sending ? 'var(--gray)' : 'var(--green)', color: 'white', border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {sending ? 'Sending…' : `Send Campaign to ${totalRecipients} Customer${totalRecipients !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
