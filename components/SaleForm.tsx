'use client';

import { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';
import CompanyAutocompleteInput from './CompanyAutocompleteInput';
import PortAutocompleteInput from './PortAutocompleteInput';
import ProductAutocompleteInput from './ProductAutocompleteInput';
import type {
  FeedOptions,
  SaleFormPayload,
  MarketStatusType,
  CreateSaleResponse,
} from '@/lib/types';

interface SaleFormProps {
  feedOptions: FeedOptions;
  onSubmit: (payload: SaleFormPayload) => Promise<CreateSaleResponse>;
  initialData?: Partial<SaleFormPayload>;
}

type ResultState = { msg: string; ok: boolean; detail?: string } | null;

const DELIVERY_TERMS = ['CIF', 'CFR', 'FOB' ,'FOR','EX-WORKS'];

export default function SaleForm({ feedOptions, onSubmit, initialData }: SaleFormProps) {
  const [saleType, setSaleType] = useState(initialData?.salesType || 'Export');
  // Form state
  const [companyFrom, setCompanyFrom] = useState('');
  const [companyTo, setCompanyTo] = useState(initialData?.companyTo || '');
  const [product, setProduct] = useState(initialData?.product || '');
  const [origin, setOrigin] = useState('');
  const [make, setMake] = useState('');
  const [packaging, setPackaging] = useState('');
  const [port, setPort] = useState(initialData?.port || '');
  const [quantity, setQuantity] = useState(initialData?.quantity ? String(initialData.quantity) : '');
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [payment, setPayment] = useState(initialData?.payment || '');
  const [deliveryTerm, setDeliveryTerm] = useState('');
  const [storageDays, setStorageDays] = useState(initialData?.storageDays ? String(initialData.storageDays) : '');
  const [transitTolerance, setTransitTolerance] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketStatus, setMarketStatus] = useState<MarketStatusType>('');
  const [message, setMessage] = useState('');
  const [vesselName, setVesselName] = useState(initialData?.vesselName || '');
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [salesPerson, setSalesPerson] = useState(initialData?.salesPerson || '');
  const [brokerName, setBrokerName] = useState(initialData?.brokerName || '');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [dateValue, setDateValue] = useState('');
  const [dateStamp, setDateStamp] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const d = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      setDateValue(d);
      setDateStamp(`${d}  ·  ${t}`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const clearForm = () => {
    setSaleType('Export');
    setCompanyFrom(''); setCompanyTo(''); setProduct(''); setOrigin(''); setMake(''); setPackaging(''); setPort('');
    setQuantity(''); setPrice(''); setPayment(''); setDeliveryTerm(''); setStorageDays(''); setTransitTolerance(''); setMarketPrice(''); setMarketStatus(''); setMessage('');
    setVesselName(''); setRemarks(''); setSalesPerson(''); setBrokerName('');
    setResult(null);
  };

  const handleSubmit = async () => {
    setResult(null);
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
      setResult({ msg: 'Please fill: ' + missing.join(', '), ok: false });
      return;
    }

    setSubmitting(true);
    try {
      const data = await onSubmit({
        salesType: saleType,
        companyFrom,
        companyTo,
        product,
        origin,
        make,
        packaging,
        port,
        quantity: qty,
        price: priceVal,
        payment,
        deliveryTerm,
        storageDays: parseFloat(storageDays) || 0,
        marketPrice: parseFloat(marketPrice) || 0,
        marketStatus,
        transitTolerance,
        message,
        vesselName,
        remarks,
        salesPerson,
        brokerName,
      });
      setResult({
        msg: `Sale #${data.id} recorded — ${qty.toLocaleString('en-IN')} MT @ ₹${priceVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        ok: true,
        detail: `${product} · ${companyTo} ← ${companyFrom} · Port: ${port}${deliveryTerm ? ' · ' + deliveryTerm : ''}`,
      });
      clearForm();
    } catch (err: unknown) {
      setResult({ msg: err instanceof Error ? err.message : 'Submission failed', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-t"> New Sale</div>
        <div className="card-meta">{dateStamp}</div>
      </div>
      <div className="card-body">

        <div className="form-grid">
          {/* Row 0: Sale Type */}
          <div className="fg wide">
            <label className="fl">Sale Type</label>
            <select className="fi" value={saleType} onChange={e => setSaleType(e.target.value as 'Export' | 'Local' | 'HSS' | 'TOW')}>
              <option value="Export">Export</option>
              <option value="Local">Local</option>
              <option value="HSS">HSS</option>
              <option value="TOW">TOW</option>
            </select>
          </div>

          {/* Row 1: Date */}
          <div className="fg">
            <label className="fl">Date</label>
            <input className="fi locked" value={dateValue} readOnly />
          </div>

          {/* Row 2: Company From, Company To */}
          <div className="fg">
            <label className="fl">Company From <span className="req">*</span></label>
            <select className="fi" value={companyFrom} onChange={e => setCompanyFrom(e.target.value)}>
              <option value="">Select company…</option>
              <option value="KLJ Resources">KLJ Resources</option>
              <option value="Sidhe Petrochemical">Sidhe Petrochemical</option>
              <option value="Sidhgun Technologies">Sidhgun Technologies</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Company To <span className="req">*</span></label>
            <CompanyAutocompleteInput id="sf-company-to" value={companyTo} onChange={setCompanyTo}
              placeholder="Buyer / customer name" />
          </div>

          {/* Row 3: Product, Origin, Make */}
          <div className="fg">
            <label className="fl">Product <span className="req">*</span></label>
            <ProductAutocompleteInput id="sf-product" value={product} onChange={setProduct}
              placeholder="e.g. VAM (Carbide Base)" />
          </div>
          {/* <div className="fg">
            <label className="fl">Origin</label>
            <AutocompleteInput id="sf-origin" value={origin} onChange={setOrigin}
              options={feedOptions.origins} placeholder="Country of origin" />
          </div>
          <div className="fg">
            <label className="fl">Make</label>
            <AutocompleteInput id="sf-make" value={make} onChange={setMake}
              options={feedOptions.makes} placeholder="Manufacturer" />
          </div> */}

          {/* Row 4: Packaging, Port, Quantity (MT) */}
          <div className="fg">
            <label className="fl">Packaging</label>
            <AutocompleteInput id="sf-packaging" value={packaging} onChange={setPackaging}
              options={feedOptions.packagings} placeholder="e.g. Bulk, IBC, Drum" />
          </div>
          <div className="fg">
            <label className="fl">Port <span className="req">*</span></label>
            <PortAutocompleteInput id="sf-port" value={port} onChange={setPort}
              placeholder="Search or add port…" />
          </div>
          <div className="fg">
            <label className="fl">Quantity (MT) <span className="req">*</span></label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="500"
              value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>

          {/* Row 5: Price (₹), Payment, Delivery Term */}
          <div className="fg">
            <label className="fl">Price (₹) <span className="req">*</span></label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="145.00"
              value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Payment</label>
            <AutocompleteInput id="sf-payment" value={payment} onChange={setPayment}
              options={feedOptions.payments} placeholder="e.g. 60 Days" />
          </div>
          <div className="fg">
            <label className="fl">Delivery Term</label>
            <select className="fi" value={deliveryTerm} onChange={e => setDeliveryTerm(e.target.value)}>
              <option value="">Select…</option>
              {DELIVERY_TERMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Row 6: Storage Days, Transit Tolerance */}
          <div className="fg">
            <label className="fl">Storage Days</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={storageDays} onChange={e => setStorageDays(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Transit Tolerance</label>
            <input className="fi" type="text" placeholder="e.g. ±2%"
              value={transitTolerance} onChange={e => setTransitTolerance(e.target.value)} />
          </div>

          {/* Row 7: Market Price, Market Status */}
          <div className="fg">
            <label className="fl">Market Price (₹)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="145.00"
              value={marketPrice} onChange={e => setMarketPrice(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Market Status</label>
            <AutocompleteInput id="sf-market-status" value={marketStatus} onChange={v => setMarketStatus(v as MarketStatusType)}
              options={['Ready Market', 'Incoming', 'Spot']} placeholder="Market status" />
          </div>

          {/* Row 8: Vessel, Sales Person, Broker */}
          <div className="fg">
            <label className="fl">Vessel Name</label>
            <input className="fi" value={vesselName} onChange={e => setVesselName(e.target.value)} placeholder="e.g. MV Chennai Express" />
          </div>
          <div className="fg">
            <label className="fl">Sales Person</label>
            <input className="fi" value={salesPerson} onChange={e => setSalesPerson(e.target.value)} placeholder="Name" />
          </div>
          <div className="fg">
            <label className="fl">Broker Name</label>
            <input className="fi" value={brokerName} onChange={e => setBrokerName(e.target.value)} placeholder="Broker" />
          </div>
          <div className="fg">
            <label className="fl">Remarks</label>
            <input className="fi" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Priority shipment" />
          </div>
          <div className="fg wide">
            <label className="fl">Message</label>
            <textarea className="fi" placeholder="Write your message here..." value={message} onChange={e => setMessage(e.target.value)} rows={2} />
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-red" disabled={submitting} onClick={handleSubmit}>
            {submitting ? '⏳ Saving…' : '💾 Submit'}
          </button>
          <button className="btn btn-ghost" onClick={clearForm}>Clear</button>
        </div>

        {result && (
          <div className={`result ${result.ok ? 'ok' : 'err'}`}>
            {result.ok ? '✓ ' : '✗ '}
            {result.msg}
            {result.detail && <div className="result-detail">{result.detail}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
