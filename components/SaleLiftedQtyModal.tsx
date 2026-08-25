'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { fetchSaleById, updateSaleLiftedQty } from '@/lib/api';

interface Props {
  saleId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaleLiftedQtyModal({ saleId, onClose, onSaved }: Props) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState<number | null>(null);
  const [liftedQty, setLiftedQty] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) return;
    setFetching(true);
    setFetchError(null);
    setSubmitError(null);

    fetchSaleById(saleId)
      .then((data) => {
        setQuantity(data.quantity ?? null);
        setLiftedQty(data.liftedQty != null ? String(data.liftedQty) : '');
      })
      .catch((err) => setFetchError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setFetching(false));
  }, [saleId]);

  if (!saleId) return null;

  const handleSubmit = async () => {
    setSubmitError(null);
    const qty = parseFloat(liftedQty);

    if (!Number.isFinite(qty) || qty < 0) {
      setSubmitError('Please enter a valid lifted quantity.');
      return;
    }

    setSubmitting(true);
    try {
      await updateSaleLiftedQty(saleId, qty);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Update Lifted Qty — ${saleId}`} size="small">
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
                  <label className="fl">Lifted Quantity (MT) <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={liftedQty}
                    onChange={(e) => setLiftedQty(e.target.value)}
                    autoFocus
                  />
                  {quantity != null && (
                    <span style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', display: 'block' }}>
                      Order quantity: {quantity.toLocaleString('en-IN')} MT
                    </span>
                  )}
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
