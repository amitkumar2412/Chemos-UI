'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import AutocompleteInput from './AutocompleteInput';
import CompanyAutocompleteInput from './CompanyAutocompleteInput';
import PortAutocompleteInput from './PortAutocompleteInput';
import ProductAutocompleteInput from './ProductAutocompleteInput';
import CountryAutocompleteInput from './CountryAutocompleteInput';
import {
  fetchPurchaseById,
  updatePurchase,
  fetchMarketStatuses,
  fetchPaymentTerms,
  getProductName,
  getProductId,
  getPortName,
  getPortId,
  getOriginName,
  getOriginId,
  getPaymentTermId,
  getStatusId,
} from '@/lib/api';
import type { PurchaseOrder } from '@/lib/api';
import type { FeedOptions, MarketStatusType, MarketStatusOption, PaymentTermOption } from '@/lib/types';

interface Props {
  purchaseId: string | null;
  feedOptions: FeedOptions;
  onClose: () => void;
  onSaved: () => void;
}

const DELIVERY_TERMS = ['CIF', 'CFR', 'FOB', 'FOR DELIVERED', 'EX-WORKS'];
const PURCHASE_TYPES = ['Import', 'HSS', 'Local', 'Tow'];
const CURRENCIES = [
  'USD', 'EUR', 'INR', 'GBP', 'JPY', 'CNY', 'AED', 'SGD', 'AUD', 'CAD', 'CHF',
  'ZAR', 'THB', 'HKD', 'KRW', 'MYR', 'NZD', 'SEK', 'NOK', 'DKK', 'RUB', 'BRL',
  'MXN', 'IDR', 'TRY', 'SAR', 'PLN', 'TWD', 'VND',
];
const COMPANY_TO_OPTIONS = ['KLJ Resources', 'Sidhe Petrochemical', 'Sidhgun Technologies'];
const priceTypeReverseMap: Record<string, string> = {
  FIXED: 'Fixed Price',
  FORMULA: 'Formula Price',
};

export default function PurchaseEditModal({ purchaseId, feedOptions, onClose, onSaved }: Props) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);

  const [purchaseType, setPurchaseType] = useState('');
  const [companyTo, setCompanyTo] = useState('');
  const [companyFrom, setCompanyFrom] = useState('');
  const [product, setProduct] = useState('');
  const [productId, setProductId] = useState('');
  const [origin, setOrigin] = useState('');
  const [originId, setOriginId] = useState('');
  const [make, setMake] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [port, setPort] = useState('');
  const [portId, setPortId] = useState('');
  const [dischargePort, setDischargePort] = useState('');
  const [dischargePortId, setDischargePortId] = useState('');
  const [packaging, setPackaging] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priceFc, setPriceFc] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [deliveryTerm, setDeliveryTerm] = useState('');
  const [paymentDays, setPaymentDays] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('');
  const [paymentTermOptions, setPaymentTermOptions] = useState<PaymentTermOption[]>([]);
  const [marketPrice, setMarketPrice] = useState('');
  const [marketStatus, setMarketStatus] = useState<MarketStatusType>('');
  const [marketStatusOptions, setMarketStatusOptions] = useState<MarketStatusOption[]>([]);
  const [replacementCost, setReplacementCost] = useState('');
  const [expense, setExpense] = useState('');
  const [customDuty, setCustomDuty] = useState('');
  const [sws, setSws] = useState('');
  const [add, setAdd] = useState('');
  const [otherExpense, setOtherExpense] = useState('');
  const [priceType, setPriceType] = useState('Fixed Price');
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketStatuses().then(setMarketStatusOptions).catch(() => {});
    fetchPaymentTerms().then(setPaymentTermOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!purchaseId) {
      setOrder(null);
      return;
    }
    setFetching(true);
    setFetchError(null);
    setSubmitError(null);

    fetchPurchaseById(purchaseId)
      .then(data => {
        setOrder(data);
        setPurchaseType(data.purchaseType || '');
        setCompanyTo(data.companyTo || '');
        setCompanyFrom(data.companyFrom || '');
        setProduct(getProductName(data.product));
        setProductId(getProductId(data.product));
        setOrigin(getOriginName(data.origin));
        setOriginId(getOriginId(data.origin));
        setMake(data.make || '');
        setVesselName(data.vesselName || '');
        setPort(getPortName(data.port));
        setPortId(getPortId(data.port));
        setDischargePort(getPortName(data.dischargePort));
        setDischargePortId(getPortId(data.dischargePort));
        setPackaging(data.packaging || '');
        setQuantity(data.quantity != null ? String(data.quantity) : '');
        setPriceFc(data.priceFc != null ? String(data.priceFc) : '');
        setCurrency(data.currency || 'USD');
        setExchangeRate(data.exchangeRate != null ? String(data.exchangeRate) : '');
        setDeliveryTerm(data.deliveryTerm || '');
        setPaymentDays(data.paymentDays != null ? String(data.paymentDays) : '');
        setPaymentTerm(getPaymentTermId(data.paymentTerm));
        setMarketPrice(data.marketPrice != null ? String(data.marketPrice) : '');
        setMarketStatus((data.marketStatus as MarketStatusType) || '');
        setReplacementCost(data.replacementCost != null ? String(data.replacementCost) : '');
        setExpense(data.expense != null ? String(data.expense) : '');
        setCustomDuty(data.customDuty != null ? String(data.customDuty) : '');
        setSws(data.sws != null ? String(data.sws) : '');
        setAdd(data.add != null ? String(data.add) : '');
        setOtherExpense(data.otherExpense != null ? String(data.otherExpense) : '');
        setPriceType(priceTypeReverseMap[data.priceType || ''] || data.priceType || 'Fixed Price');
        setEtd(data.etd || '');
        setEta(data.eta || '');
      })
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setFetching(false));
  }, [purchaseId]);

  if (!purchaseId) return null;

  const companyToOptions = COMPANY_TO_OPTIONS.includes(companyTo)
    ? COMPANY_TO_OPTIONS
    : companyTo
    ? [...COMPANY_TO_OPTIONS, companyTo]
    : COMPANY_TO_OPTIONS;

  const priceTypeMap: Record<string, string> = {
    'Fixed Price': 'FIXED',
    'Formula Price': 'FORMULA',
  };

  const handleSubmit = async () => {
    if (!order) return;
    setSubmitError(null);
    const qty = parseFloat(quantity);
    const fc = parseFloat(priceFc);
    const exRate = parseFloat(exchangeRate);

    const missing: string[] = [];
    if (!companyTo) missing.push('Buyer');
    if (!companyFrom) missing.push('Seller');
    if (!product) missing.push('Product');
    if (!Number.isFinite(qty) || qty <= 0) missing.push('Quantity');
    if (!Number.isFinite(fc) || fc <= 0) missing.push('Price (FC)');
    if (!Number.isFinite(exRate) || exRate <= 0) missing.push('Exchange Rate');
    if (!port) missing.push('Load Port');
    if (missing.length) {
      setSubmitError('Please fill required fields: ' + missing.join(', '));
      return;
    }

    setSubmitting(true);
    try {
      await updatePurchase(order.id, {
        purchaseType,
        companyTo,
        companyFrom,
        product: productId || product,
        vesselName,
        quantity: qty,
        priceFc: fc,
        currency,
        offerUsd: fc,
        exchangeRate: exRate,
        priceInr: (fc * exRate) / 1000,
        deliveryTerm,
        paymentDays: parseFloat(paymentDays) || 0,
        port: portId || port,
        marketPrice: parseFloat(marketPrice) || 0,
        marketStatus,
        replacementCost: parseFloat(replacementCost) || 0,
        make,
        packaging,
        origin: originId || origin,
        expense: parseFloat(expense) || 0,
        customDuty: parseFloat(customDuty) || 0,
        sws: parseFloat(sws) || 0,
        add: parseFloat(add) || 0,
        otherExpense: parseFloat(otherExpense) || 0,
        dischargePort: dischargePortId || dischargePort,
        priceType: priceTypeMap[priceType] ?? priceType,
        paymentTerm: paymentTerm ? parseInt(paymentTerm, 10) : undefined,
        etd: etd || undefined,
        eta: eta || undefined,
        status: getStatusId(order.status) || null,
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
    <Modal isOpen={true} onClose={onClose} title={`Edit Purchase Order — ${purchaseId}`} size="xlarge">
      <div className="card">
        <div className="card-body">

          {fetching && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
              Loading order details…
            </div>
          )}

          {!fetching && fetchError && (
            <div className="result err" style={{ marginBottom: 16 }}>
              ✗ {fetchError}
            </div>
          )}

          {!fetching && !fetchError && order && (
            <>
              <div className="form-grid">

                <div className="fg">
                  <label className="fl">Purchase Type</label>
                  <select className="fi" value={purchaseType} onChange={e => setPurchaseType(e.target.value)}>
                    <option value="">Select…</option>
                    {PURCHASE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="fg">
                  <label className="fl">Buyer <span className="req">*</span></label>
                  <AutocompleteInput
                    id="pe-company-to"
                    value={companyTo}
                    onChange={setCompanyTo}
                    options={companyToOptions}
                    placeholder="Buyer / customer name"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Seller <span className="req">*</span></label>
                  <CompanyAutocompleteInput
                    id="pe-company-from"
                    value={companyFrom}
                    onChange={setCompanyFrom}
                    placeholder="Seller / supplier name"
                  />
                </div>

                <div className="fg">
                  <label className="fl">Product <span className="req">*</span></label>
                  <ProductAutocompleteInput
                    id="pe-product"
                    value={product}
                    onChange={val => { setProduct(val); setProductId(''); }}
                    onSelect={p => setProductId(p.id)}
                    placeholder="e.g. VAM (Carbide Base)"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Origin</label>
                  <CountryAutocompleteInput
                    id="pe-origin"
                    value={origin}
                    onChange={val => { setOrigin(val); setOriginId(''); }}
                    onSelect={country => setOriginId(country.id)}
                    placeholder="Country of origin"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Make</label>
                  <AutocompleteInput
                    id="pe-make"
                    value={make}
                    onChange={setMake}
                    options={feedOptions.makes}
                    placeholder="Manufacturer"
                  />
                </div>

                <div className="fg">
                  <label className="fl">Vessel Name</label>
                  <input
                    className="fi"
                    value={vesselName}
                    onChange={e => setVesselName(e.target.value)}
                    placeholder="Ship / vessel name"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Load Port <span className="req">*</span></label>
                  <PortAutocompleteInput
                    id="pe-port"
                    value={port}
                    onChange={val => { setPort(val); setPortId(''); }}
                    onSelect={(id, name) => { setPortId(id); setPort(name); }}
                    placeholder="Search or add port…"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Discharge Port</label>
                  <PortAutocompleteInput
                    id="pe-discharge-port"
                    value={dischargePort}
                    onChange={val => { setDischargePort(val); setDischargePortId(''); }}
                    onSelect={(id, name) => { setDischargePortId(id); setDischargePort(name); }}
                    placeholder="Search or add port…"
                  />
                </div>

                <div className="fg">
                  <label className="fl">Packaging</label>
                  <AutocompleteInput
                    id="pe-packaging"
                    value={packaging}
                    onChange={setPackaging}
                    options={feedOptions.packagings}
                    placeholder="e.g. Bulk, IBC, Drum"
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

                <div className="fg">
                  <label className="fl">Price (FC) <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceFc}
                    onChange={e => setPriceFc(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Price Type</label>
                  <select className="fi" value={priceType} onChange={e => setPriceType(e.target.value)}>
                    <option value="Formula Price">Formula Price</option>
                    <option value="Fixed Price">Fixed Price</option>
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Currency</label>
                  <select className="fi" value={currency} onChange={e => setCurrency(e.target.value)}>
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Exchange Rate (₹/$) <span className="req">*</span></label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={exchangeRate}
                    onChange={e => setExchangeRate(e.target.value)}
                  />
                </div>

                <div className="fg">
                  <label className="fl">Inco Term</label>
                  <select className="fi" value={deliveryTerm} onChange={e => setDeliveryTerm(e.target.value)}>
                    <option value="">Select…</option>
                    {DELIVERY_TERMS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Payment Term</label>
                  <select className="fi" value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)}>
                    <option value="">Select…</option>
                    {paymentTermOptions.map(o => (
                      <option key={o.id} value={o.id}>{o.paymentTerm}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Payment</label>
                  <AutocompleteInput
                    id="pe-payment"
                    value={paymentDays}
                    onChange={setPaymentDays}
                    options={feedOptions.payments}
                    placeholder="e.g. 60 Days"
                  />
                </div>
                <div className="fg">
                  <label className="fl">Expense (Freight & Insurance)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={expense}
                    onChange={e => setExpense(e.target.value)}
                  />
                </div>

                <div className="fg">
                  <label className="fl">Custom Duty BCD (%/kg)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={customDuty}
                    onChange={e => setCustomDuty(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">SWS (%)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={sws}
                    onChange={e => setSws(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">ADD (₹)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={add}
                    onChange={e => setAdd(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Other Expense (₹/kg)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={otherExpense}
                    onChange={e => setOtherExpense(e.target.value)}
                  />
                </div>

                <div className="fg">
                  <label className="fl">Replacement Cost (₹/kg)</label>
                  <input
                    className="fi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={replacementCost}
                    onChange={e => setReplacementCost(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Market Price (₹/kg)</label>
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
                  <label className="fl">ETD</label>
                  <input className="fi" type="date" value={etd} onChange={e => setEtd(e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">ETA</label>
                  <input className="fi" type="date" value={eta} onChange={e => setEta(e.target.value)} />
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
