'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AutocompleteInput from './AutocompleteInput';
import CompanyAutocompleteInput from './CompanyAutocompleteInput';
import ProductAutocompleteInput from './ProductAutocompleteInput';
import CountryAutocompleteInput from './CountryAutocompleteInput';
import PortAutocompleteInput from './PortAutocompleteInput';
import PortMultiAutocompleteInput from './PortMultiAutocompleteInput';
import type {
  FeedOptions,
  SalePunchPayload,
  MarketStatusType,
  CreatePunchResponse,
} from '@/lib/types';

interface SaleEntryCardProps {
  feedOptions: FeedOptions;
  onSubmit: (payload: SalePunchPayload) => Promise<CreatePunchResponse>;
  initialData?: any;
}


const DELIVERY_TERMS = ['CIF', 'CFR', 'FOB'];
const PURCHASE_TYPES = ['Import', 'HSS', 'Local', 'Tow'];


export default function SaleEntryCard({ feedOptions, onSubmit, initialData }: SaleEntryCardProps) {
  // Form state
  const [companyTo, setCompanyTo] = useState('');
  const COMPANY_TO_OPTIONS = [
    'KLJ Resources',
    'Sidhe Petrochemical',
    'Sidhgun Technologies',
  ];
  const [purchaseType, setPurchaseType] = useState(initialData?.purchase_type || '');
  const [companyFrom, setCompanyFrom] = useState(initialData?.company_from || '');
  const [product, setProduct] = useState(initialData?.product || '');
  const [vesselName, setVesselName] = useState('');
  const [shipmentStart, setShipmentStart] = useState('');
  const [shipmentEnd, setShipmentEnd] = useState('');
  const [quantity, setQuantity] = useState(initialData?.quantity ? String(initialData.quantity) : '');
  const [priceFc, setPriceFc] = useState(initialData?.price_fc ? String(initialData.price_fc) : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [offerUsd, setOfferUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate ? String(initialData.exchange_rate) : '');
  const [deliveryTerm, setDeliveryTerm] = useState('');
  const [paymentDays, setPaymentDays] = useState('');
  const [port, setPort] = useState(initialData?.port || '');
  const [dischargePorts, setDischargePorts] = useState<string[]>(initialData?.discharge_ports || []);
  const [marketPrice, setMarketPrice] = useState(initialData?.market_price ? String(initialData.market_price) : '');
  const [marketStatus, setMarketStatus] = useState<MarketStatusType>('');
  const [costPrice, setCostPrice] = useState('');
  const [replacementCost, setReplacementCost] = useState('');

  const [expense, setExpense] = useState('');
  const [customDuty, setCustomDuty] = useState('');
  const [sws, setSws] = useState('');
  const [add, setAdd] = useState('');
  const [otherExpense, setOtherExpense] = useState('');
  const [addUsd, setAddUsd] = useState(initialData?.add_usd ? String(initialData.add_usd) : '');

  const [make, setMake] = useState('');
  const [packaging, setPackaging] = useState('');
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [priceType, setPriceType] = useState(initialData?.price_type || 'Fixed Price');
  const [paymentTerm, setPaymentTerm] = useState(initialData?.payment_term || '');
  const [etd, setEtd] = useState(initialData?.etd || '');
  const [eta, setEta] = useState(initialData?.eta || '');

  // Price (₹/kg) = Price(FC) × Exchange Rate / 1000
  const computedPriceInr =
    ((parseFloat(priceFc) || 0) * (parseFloat(exchangeRate) || 0)) / 1000;
  const priceDisplay =
    computedPriceInr > 0
      ? computedPriceInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';

  const bcdAmount = (parseFloat(customDuty) || 0) / 100 * computedPriceInr;
  const swsAmount = bcdAmount * (parseFloat(sws) || 0) / 100;
  const computedTotalPrice =
    computedPriceInr + bcdAmount + swsAmount + (parseFloat(add) || 0) + (parseFloat(otherExpense) || 0);
  const totalPriceDisplay =
    computedTotalPrice > 0
      ? computedTotalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [dateStamp, setDateStamp] = useState('');

  // Date/time updater
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
    setCompanyTo(''); setCompanyFrom(''); setProduct(''); setVesselName('');
    setShipmentStart(''); setShipmentEnd(''); setQuantity(''); setPriceFc(''); setCurrency('USD'); setOfferUsd(''); setExchangeRate('');
    setDeliveryTerm(''); setPaymentDays(''); setPort(''); setMarketPrice('');
    setMarketStatus(''); setCostPrice(''); setReplacementCost(''); setMake('');
    setExpense(''); setCustomDuty(''); setSws(''); setAdd(''); setOtherExpense('');
    setPurchaseType('');
    setPackaging(''); setOrigin('');
    setDischargePorts([]);
    setPriceType('Fixed Price');
    setPaymentTerm('');
    setEtd('');
    setEta('');
    setAddUsd('');
  };

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    const fc = parseFloat(priceFc);
    const exRate = parseFloat(exchangeRate);

    const missing: string[] = [];
    if (!companyTo) missing.push('Company To');
    if (!companyFrom) missing.push('Company From');
    if (!product) missing.push('Product');
    if (!Number.isFinite(qty) || qty <= 0) missing.push('Quantity');
    if (!Number.isFinite(fc) || fc <= 0) missing.push('Price (FC)');
    if (!Number.isFinite(exRate) || exRate <= 0) missing.push('Exchange Rate');
    if (!port) missing.push('Port');
    if (missing.length) {
      toast.error('Please fill: ' + missing.join(', '));
      return;
    }

    const priceTypeMap: Record<string, string> = {
      'Fixed Price': 'FIXED',
      'Formula Price': 'FORMULA',
    };

    setSubmitting(true);
    try {
      const data = await onSubmit({
        company_to: companyTo,
        purchase_type: purchaseType,
        company_from: companyFrom,
        product,
        vessel_name: vesselName,
        shipment: shipmentStart && shipmentEnd ? `${shipmentStart} to ${shipmentEnd}` : '',
        quantity: qty,
        price_fc: fc,
        currency,
        offer_usd: fc,
        exchange_rate: exRate,
        price_inr: computedPriceInr,
        delivery_term: deliveryTerm,
        payment_days: parseFloat(paymentDays) || 0,
        port,
        market_price: parseFloat(marketPrice) || 0,
        market_status: marketStatus,
        cost_price: parseFloat(costPrice) || 0,
        replacement_cost: parseFloat(replacementCost) || 0,
        make,
        packaging,
        origin,
        expense: parseFloat(expense) || 0,
        custom_duty: parseFloat(customDuty) || 0,
        sws: parseFloat(sws) || 0,
        add: parseFloat(add) || 0,
        other_expense: parseFloat(otherExpense) || 0,
        add_usd: parseFloat(addUsd) || 0,
        discharge_ports: dischargePorts.join(', '),
        price_type: priceTypeMap[priceType] ?? priceType,
        payment_term: paymentTerm,
        etd: etd || undefined,
        eta: eta || undefined,
      } as any);
      toast.success(`Order #${data.id} created — ${product} · ${qty.toLocaleString('en-IN')} MT`);
      clearForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-t"> New Purchase</div>
        <div className="card-meta">{dateStamp}</div>
      </div>
      <div className="card-body">

        <div className="form-grid top-row">
          <div className="fg">
            <label className="fl">Purchase Type</label>
            <select className="fi" value={purchaseType} onChange={e => setPurchaseType(e.target.value)}>
              <option value="">Select…</option>
              {PURCHASE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Date</label>
            <input className="fi locked" value={dateValue} readOnly />
          </div>
        </div>

        <div className="form-grid">
          {/* Buyer */}
          <div className="fg">
            <label className="fl">Buyer <span className="req">*</span></label>
            <AutocompleteInput id="f-company-to" value={companyTo} onChange={setCompanyTo}
              options={COMPANY_TO_OPTIONS} placeholder="Buyer / customer name" />
          </div>

          {/* Seller */}
          <div className="fg">
            <label className="fl">Seller <span className="req">*</span></label>
            <CompanyAutocompleteInput id="f-company-from" value={companyFrom} onChange={setCompanyFrom}
              placeholder="Seller / supplier name" />
          </div>

          {/* Product, Origin, Make */}
          <div className="fg">
            <label className="fl">Product <span className="req">*</span></label>
            <ProductAutocompleteInput id="f-product" value={product} onChange={setProduct}
              placeholder="e.g. VAM (Carbide Base)" />
          </div>
          <div className="fg">
            <label className="fl">Origin</label>
            <CountryAutocompleteInput id="f-origin" value={origin} onChange={setOrigin}
              placeholder="Country of origin" />
          </div>
          <div className="fg">
            <label className="fl">Make</label>
            <AutocompleteInput id="f-make" value={make} onChange={setMake}
              options={feedOptions.makes} placeholder="Manufacturer" />
          </div>

          {/* Vessel, Shipment, Load Port */}
          <div className="fg">
            <label className="fl">Vessel Name</label>
            <input className="fi" value={vesselName} onChange={e => setVesselName(e.target.value)}
              placeholder="Ship / vessel name" />
          </div>
          <div className="fg">
            <label className="fl">Shipment Start</label>
            <input className="fi" type="date" value={shipmentStart} onChange={e => setShipmentStart(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Shipment End</label>
            <input className="fi" type="date" value={shipmentEnd} onChange={e => setShipmentEnd(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Load Port <span className="req">*</span></label>
            <PortAutocompleteInput id="f-port" value={port} onChange={setPort}
              placeholder="Search or add port…" />
          </div>

          <div className="fg">
            <label className="fl">Discharge Ports</label>
            <PortMultiAutocompleteInput value={dischargePorts} onChange={setDischargePorts}
              placeholder="Search or add ports…" />
          </div>

          {/* Packaging, Market Status, Quantity, Price */}
          <div className="fg">
            <label className="fl">Packaging</label>
            <AutocompleteInput id="f-packaging" value={packaging} onChange={setPackaging}
              options={feedOptions.packagings} placeholder="e.g. Bulk, IBC, Drum" />
          </div>
          <div className="fg">
            <label className="fl">Market Status</label>
            <select className="fi" value={marketStatus} onChange={e => setMarketStatus(e.target.value as MarketStatusType)}>
              <option value="">Select…</option>
              <option value="Ready Market">Ready Market</option>
              <option value="Incoming">Incoming</option>
              <option value="Spot">Spot</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Quantity (MT) <span className="req">*</span></label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="500"
              value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Price (FC)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={priceFc} onChange={e => setPriceFc(e.target.value)} />
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
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CNY">CNY</option>
              <option value="AED">AED</option>
              <option value="SGD">SGD</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
              <option value="CHF">CHF</option>
              <option value="ZAR">ZAR</option>
              <option value="THB">THB</option>
              <option value="HKD">HKD</option>
              <option value="KRW">KRW</option>
              <option value="MYR">MYR</option>
              <option value="NZD">NZD</option>
              <option value="SEK">SEK</option>
              <option value="NOK">NOK</option>
              <option value="DKK">DKK</option>
              <option value="RUB">RUB</option>
              <option value="BRL">BRL</option>
              <option value="MXN">MXN</option>
              <option value="IDR">IDR</option>
              <option value="TRY">TRY</option>
              <option value="SAR">SAR</option>
              <option value="PLN">PLN</option>
              <option value="TWD">TWD</option>
              <option value="VND">VND</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Exchange Rate (₹/$) <span className="req">*</span></label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="84.50"
              value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Price (₹/kg)</label>
            <input className="fi locked price-computed" value={priceDisplay} readOnly placeholder="" />
          </div>

          {/* Delivery, Payment */}
          <div className="fg">
            <label className="fl">Inco Term</label>
            <select className="fi" value={deliveryTerm} onChange={e => setDeliveryTerm(e.target.value)}>
              <option value="">Select…</option>
              {DELIVERY_TERMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Payment Term</label>
            <select className="fi" value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)}>
              <option value="">Select…</option>
              <option value="DA">DA</option>
              <option value="CAD">CAD</option>
              <option value="LC">LC</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Payment</label>
            <AutocompleteInput id="f-payment" value={paymentDays} onChange={setPaymentDays}
              options={feedOptions.payments} placeholder="e.g. 60 Days" />
          </div>
          <div className="fg">
            <label className="fl">Expense (Freight & Insurance)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={expense} onChange={e => setExpense(e.target.value)} />
          </div>

          {/* Duties */}
          <div className="fg">
            <label className="fl">Custom Duty BCD (%/kg)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="e.g. 7.5"
              value={customDuty} onChange={e => setCustomDuty(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">SWS (%)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="e.g. 10"
              value={sws} onChange={e => setSws(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">ADD ($/MT)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={addUsd} onChange={e => setAddUsd(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">ADD (₹)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={add} onChange={e => setAdd(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Other Expense (₹/kg)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={otherExpense} onChange={e => setOtherExpense(e.target.value)} />
          </div>

          {/* Total Price */}
          <div className="fg">
            <label className="fl">Total Price (₹/kg)</label>
            <input className="fi locked price-computed" value={totalPriceDisplay} readOnly placeholder="" />
          </div>

          {/* Market */}
          <div className="fg">
            <label className="fl">Replacement Cost (₹/kg)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={replacementCost} onChange={e => setReplacementCost(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Market Price (₹/kg)</label>
            <input className="fi" type="number" min={0} step={0.01} placeholder="0.00"
              value={marketPrice} onChange={e => setMarketPrice(e.target.value)} />
          </div>
        </div>

        <div className="form-grid">
          <div className="fg">
            <label className="fl">ETD</label>
            <input className="fi" type="date" value={etd} onChange={e => setEtd(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">ETA</label>
            <input className="fi" type="date" value={eta} onChange={e => setEta(e.target.value)} />
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-red" disabled={submitting} onClick={handleSubmit}>
            {submitting ? '⏳ Saving…' : '💾 Submit'}
          </button>
          <button className="btn btn-ghost" onClick={clearForm}>Clear</button>
        </div>

      </div>
    </div>
  );
}
