'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { fetchPurchaseById, updatePurchaseReceipt } from '@/lib/api';

interface Props {
  purchaseId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PurchaseReceiptModal({ purchaseId, onClose, onSaved }: Props) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [quantityReceived, setQuantityReceived] = useState('');
  const [payDueDate, setPayDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId) return;
    setFetching(true);
    setFetchError(null);
    setSubmitError(null);

    fetchPurchaseById(purchaseId)
      .then(data => {
        setQuantityReceived(data.quantityReceived != null ? String(data.quantityReceived) : '');
        setPayDueDate(data.payDueDate || '');
      })
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setFetching(false));
  }, [purchaseId]);

  if (!purchaseId) return null;

  const handleSubmit = async () => {
    setSubmitError(null);
    const qty = parseFloat(quantityReceived);

    const missing: string[] = [];
    if (!Number.isFinite(qty) || qty < 0) missing.push('Quantity Received');
    if (!payDueDate) missing.push('Pay Due Date');
    if (missing.length) {
      setSubmitError('Please fill required fields: ' + missing.join(', '));
      return;
    }

    setSubmitting(true);
    try {
      await updatePurchaseReceipt(purchaseId, {
        quantityReceived: qty,
        payDueDate,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Update Receipt — ${purchaseId}`} size="small">
      <div className="card">
        <div className="card-body">

          {fetching && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
              Loading order details…
            </div>
          )}

          {!fetching && fetchError && (
            <div className="result err" style={{ marginBottom: 16 }}>
              ✗ {fetchError}
            </div>
          )}

          {!fetching && !fetchError && (
            <>
              <div className="form-grid">
                <div className="fg">
                  <label className="fl">Quantity Received (MT) <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={quantityReceived}
                    onChange={e => setQuantityReceived(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Pay Due Date <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="date"
                    value={payDueDate}
                    onChange={e => setPayDueDate(e.target.value)}
                  />
                </div>
              </div>

              {submitError && (
                <div className="result err" style={{ marginTop: '12px' }}>
                  ✗ {submitError}
                </div>
              )}

              <div className="btn-row">
                <button className="btn btn-red" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? '⏳ Saving…' : '💾 Save Changes'}
                </button>
                <button className="btn btn-ghost" disabled={submitting} onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </Modal>
  );
}
