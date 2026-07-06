'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import AutocompleteInput from './AutocompleteInput';
import CompanyAutocompleteInput from './CompanyAutocompleteInput';
import PortAutocompleteInput from './PortAutocompleteInput';
import ProductAutocompleteInput from './ProductAutocompleteInput';
import { fetchSaleById, updateSale, fetchMarketStatuses, getProductName } from '@/lib/api';
import type { SaleEntry, FeedOptions, MarketStatusType, MarketStatusOption } from '@/lib/types';

interface Props {
  saleId: string | null;
  feedOptions: FeedOptions;
  onClose: () => void;
  onSaved: () => void;
}

const DELIVERY_TERMS = ['CIF', 'CFR', 'FOB', 'FOR-DELIVERED', 'EX-WORKS'];
const COMPANY_FROM_OPTIONS = ['KLJ Resources', 'Sidhe Petrochemical', 'Sidhgun Technologies'];

export default function SaleEditModal({ saleId, feedOptions, onClose, onSaved }: Props) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sale, setSale] = useState<SaleEntry | null>(null);

  // Form fields
  const [saleType, setSaleType] = useState('');
  const [companyFrom, setCompanyFrom] = useState('');
  const [companyTo, setCompanyTo] = useState('');
  const [product, setProduct] = useState('');
  const [packaging, setPackaging] = useState('');
  const [port, setPort] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [payment, setPayment] = useState('');
  const [deliveryTerm, setDeliveryTerm] = useState('');
  const [storageDays, setStorageDays] = useState('');
  const [transitTolerance, setTransitTolerance] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketStatus, setMarketStatus] = useState<MarketStatusType>('');
  const [marketStatusOptions, setMarketStatusOptions] = useState<MarketStatusOption[]>([]);
  const [message, setMessage] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [brokerName, setBrokerName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketStatuses().then(setMarketStatusOptions).catch(() => {});
  }, []);

  // Fetch sale by ID whenever the modal opens
  useEffect(() => {
    if (!saleId) {
      setSale(null);
      return;
    }
    setFetching(true);
    setFetchError(null);
    setSubmitError(null);

    fetchSaleById(saleId)
      .then(data => {
        setSale(data);
        // Populate all form fields from the fetched data
        setSaleType(data.salesType || 'Local');
        setCompanyFrom(data.companyFrom || '');
        setCompanyTo(data.companyTo || '');
        setProduct(data.product ? getProductName(data.product) : '');
        setPackaging(data.packaging || '');
        setPort(data.port || '');
        setQuantity(data.quantity != null ? String(data.quantity) : '');
        setPrice(data.price != null ? String(data.price) : '');
        setPayment(data.payment || '');
        setDeliveryTerm(data.deliveryTerm || '');
        setStorageDays(data.storageDays != null ? String(data.storageDays) : '');
        setTransitTolerance(data.transitTolerance || '');
        setMarketPrice(data.marketPrice != null ? String(data.marketPrice) : '');
        setMarketStatus((data.marketStatus as MarketStatusType) || '');
        setMessage(data.message || '');
        setVesselName(data.vesselName || '');
        setRemarks(data.remarks || '');
        setSalesPerson(data.salesPerson || '');
        setBrokerName(data.brokerName || '');
      })
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setFetching(false));
  }, [saleId]);

  if (!saleId) return null;

  const companyFromOptions = COMPANY_FROM_OPTIONS.includes(companyFrom)
    ? COMPANY_FROM_OPTIONS
    : companyFrom
    ? [...COMPANY_FROM_OPTIONS, companyFrom]
    : COMPANY_FROM_OPTIONS;

  const handleSubmit = async () => {
    if (!sale) return;
    setSubmitError(null);
    const qty = parseFloat(quantity);
    const priceVal = parseFloat(price);

    const missing: string[] = [];
    if (!companyTo) missing.push('Company To');
    if (!companyFrom) missing.push('Company From');
    if (!product) missing.push('Product');
    if (!Number.isFinite(qty) || qty <= 0) missing.push('Quantity');
    if (!Number.isFinite(priceVal) || priceVal <= 0) missing.push('Price');
    if (!port) missing.push('Port');
    if (missing.length) {
      setSubmitError('Please fill required fields: ' + missing.join(', '));
      return;
    }

    setSubmitting(true);
    try {
      await updateSale(sale.id, {
        salesType: saleType,
        companyFrom,
        companyTo,
        product,
        origin: sale.origin || '',
        make: sale.make || '',
        packaging: packaging || '',
        port,
        quantity: qty,
        price: priceVal,
        payment: payment || '',
        deliveryTerm: deliveryTerm || '',
        storageDays: parseFloat(storageDays) || 0,
        marketPrice: parseFloat(marketPrice) || 0,
        marketStatus: marketStatus || '',
        transitTolerance: transitTolerance || '',
        message: message || '',
        vesselName: vesselName || '',
        remarks: remarks || '',
        salesPerson: salesPerson || '',
        brokerName: brokerName || '',
        status: sale.status,
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
    <Modal isOpen={true} onClose={onClose} title={`Edit Sale Order — ${saleId}`} size="xlarge">
      <div className="card">
        <div className="card-body">

          {/* Loading state */}
          {fetching && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
              Loading order details…
            </div>
          )}

          {/* Fetch error */}
          {!fetching && fetchError && (
            <div className="result err" style={{ marginBottom: 16 }}>
              ✗ {fetchError}
            </div>
          )}

          {/* Form — only shown after successful fetch */}
          {!fetching && !fetchError && sale && (
            <>
              <div className="form-grid">

                {/* Sale Type */}
                <div className="fg wide">
                  <label className="fl">Sale Type</label>
                  <select className="fi" value={saleType} onChange={e => setSaleType(e.target.value)}>
                    <option value="Export">Export</option>
                    <option value="Local">Local</option>
                    <option value="HSS">HSS</option>
                    <option value="TOW">TOW</option>
                  </select>
                </div>

                {/* Company From / To */}
                <div className="fg">
                  <label className="fl">Company From <span className="req">*</span></label>
                  <select className="fi" value={companyFrom} onChange={e => setCompanyFrom(e.target.value)}>
                    <option value="">Select company…</option>
                    {companyFromOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Company To <span className="req">*</span></label>
                  <CompanyAutocompleteInput
                    id="se-company-to"
                    value={companyTo}
                    onChange={setCompanyTo}
                    placeholder="Buyer / customer name"
                  />
                </div>

                {/* Product */}
                <div className="fg">
                  <label className="fl">Product <span className="req">*</span></label>
                  <ProductAutocompleteInput
                    id="se-product"
                    value={product}
                    onChange={setProduct}
                    placeholder="e.g. VAM (Carbide Base)"
                  />
                </div>

                {/* Packaging, Port, Quantity */}
                <div className="fg">
                  <label className="fl">Packaging</label>
                  <AutocompleteInput
                    id="se-packaging"
                    value={packaging}
                    onChange={setPackaging}
                    options={feedOptions.packagings}
                    placeholder="e.g. Bulk, IBC, Drum"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Port <span className="req">*</span></label>
                  <PortAutocompleteInput
                    id="se-port"
                    value={port}
                    onChange={setPort}
                    placeholder="Search or add port…"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Quantity (MT) <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>

                {/* Price, Payment, Delivery Term */}
                <div className="fg">
                  <label className="fl">Price (₹) <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Payment</label>
                  <AutocompleteInput
                    id="se-payment"
                    value={payment}
                    onChange={setPayment}
                    options={feedOptions.payments}
                    placeholder="e.g. 60 Days"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Delivery Term</label>
                  <select className="fi" value={deliveryTerm} onChange={e => setDeliveryTerm(e.target.value)}>
                    <option value="">Select…</option>
                    {DELIVERY_TERMS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Storage Days, Transit Tolerance */}
                <div className="fg">
                  <label className="fl">Storage Days</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={1}
                    value={storageDays}
                    onChange={e => setStorageDays(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Transit Tolerance</label>
                  <input
                    className="fi"
                    value={transitTolerance}
                    onChange={e => setTransitTolerance(e.target.value)}
                    placeholder="e.g. ±2%"
                  />
                </div>

                {/* Market Price, Market Status */}
                <div className="fg">
                  <label className="fl">Market Price (₹)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={marketPrice}
                    onChange={e => setMarketPrice(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Market Status</label>
                  <select className="fi" value={marketStatus} onChange={e => setMarketStatus(e.target.value)}>
                    <option value="">Select…</option>
                    {marketStatusOptions.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {/* Vessel, Sales Person, Broker, Remarks */}
                <div className="fg">
                  <label className="fl">Vessel Name</label>
                  <input
                    className="fi"
                    value={vesselName}
                    onChange={e => setVesselName(e.target.value)}
                    placeholder="e.g. MV Chennai Express"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Sales Person</label>
                  <input
                    className="fi"
                    value={salesPerson}
                    onChange={e => setSalesPerson(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Broker Name</label>
                  <input
                    className="fi"
                    value={brokerName}
                    onChange={e => setBrokerName(e.target.value)}
                    placeholder="Broker"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Remarks</label>
                  <input
                    className="fi"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="e.g. Priority shipment"
                  />
                </div>
                <div className="fg wide">
                  <label className="fl">Message</label>
                  <textarea
                    className="fi"
                    rows={2}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write your message here..."
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
