'use client';

import { useState, useMemo } from 'react';


type RiskLevel = 'Low' | 'Medium' | 'High';

interface ComparableOffer {
  id: string;
  type: 'Purchase' | 'Sale';
  offerId: string;
  supplierCustomer: string;
  price: number;
  quantity: number;
  deliveryDays: number;
  location: string;
  validTill: string;
  risk: RiskLevel;
  product: string;
  origin: string;
  make: string;
  packaging: string;
  paymentTerms: string;
  deliveryTerm: string;
  currency: string;
  exchangeRate: number;
  expense: number;
  customDuty: number;
  sws: number;
  add: number;
  otherExpense: number;
}

const PRODUCTS = [
  'Methanol',
  'Sodium Bicarbonate',
  'Citric Acid',
  'Phosphoric Acid',
  'Acetic Acid',
  'Potassium Carbonate',
];

const ALL_OFFERS: ComparableOffer[] = [
  // Methanol – Purchase
  { id: 'm1', type: 'Purchase', offerId: 'PUR-4587', supplierCustomer: 'Global Chemicals Ltd',   price: 245, quantity: 1000, deliveryDays:  5, location: 'Nhava Sheva, India', validTill: '2026-06-15', risk: 'Low',    product: 'Methanol', origin: 'Saudi Arabia', make: 'SABIC',   packaging: 'ISO Tank',    paymentTerms: '45 Days',     deliveryTerm: 'CIF',      currency: 'USD', exchangeRate: 83.50, expense: 1200, customDuty: 5,   sws: 10, add: 500,  otherExpense: 300 },
  { id: 'm2', type: 'Purchase', offerId: 'PUR-4589', supplierCustomer: 'Euro Chem Industries',   price: 248, quantity:  500, deliveryDays:  7, location: 'Kandla, India',      validTill: '2026-06-14', risk: 'Medium', product: 'Methanol', origin: 'Iran',         make: 'NPC',    packaging: 'ISO Tank',    paymentTerms: '30 Days',     deliveryTerm: 'CFR',      currency: 'USD', exchangeRate: 83.25, expense: 1500, customDuty: 5,   sws: 10, add: 650,  otherExpense: 400 },
  { id: 'm3', type: 'Purchase', offerId: 'PUR-4591', supplierCustomer: 'Middle East Traders',    price: 252, quantity:  750, deliveryDays: 10, location: 'Mundra, India',      validTill: '2026-06-16', risk: 'Low',    product: 'Methanol', origin: 'UAE',          make: 'Ruwais', packaging: 'ISO Tank',    paymentTerms: '60 Days',     deliveryTerm: 'CIF',      currency: 'USD', exchangeRate: 83.75, expense: 1100, customDuty: 5,   sws: 10, add: 450,  otherExpense: 250 },
  { id: 'm4', type: 'Purchase', offerId: 'PUR-4593', supplierCustomer: 'Gulf Chem LLC',          price: 250, quantity:  600, deliveryDays: 12, location: 'Hazira, India',      validTill: '2026-06-18', risk: 'High',   product: 'Methanol', origin: 'Qatar',        make: 'Qafco',  packaging: 'Bulk',        paymentTerms: '45 Days',     deliveryTerm: 'FOB',      currency: 'USD', exchangeRate: 83.60, expense: 1800, customDuty: 5,   sws: 10, add: 600,  otherExpense: 500 },
  // Methanol – Sale
  { id: 'm5', type: 'Sale',     offerId: 'SAL-7712', supplierCustomer: 'ABC Petrochem Ltd',      price: 298, quantity:  800, deliveryDays:  6, location: 'Nhava Sheva, India', validTill: '2026-06-15', risk: 'Low',    product: 'Methanol', origin: 'Saudi Arabia', make: 'SABIC',   packaging: 'ISO Tank',    paymentTerms: 'Net 30',      deliveryTerm: 'Ex-Works', currency: 'USD', exchangeRate: 83.50, expense: 900,  customDuty: 0,   sws: 0,  add: 0,    otherExpense: 200 },
  { id: 'm6', type: 'Sale',     offerId: 'SAL-7714', supplierCustomer: 'Oceanic Solvents Co.',   price: 295, quantity: 1200, deliveryDays:  8, location: 'Kandla, India',      validTill: '2026-06-17', risk: 'Medium', product: 'Methanol', origin: 'Iran',         make: 'NPC',    packaging: 'ISO Tank',    paymentTerms: 'Net 45',      deliveryTerm: 'FOR',      currency: 'USD', exchangeRate: 83.25, expense: 750,  customDuty: 0,   sws: 0,  add: 0,    otherExpense: 150 },
  { id: 'm7', type: 'Sale',     offerId: 'SAL-7716', supplierCustomer: 'Greenfield Industries',  price: 300, quantity:  500, deliveryDays:  5, location: 'Mundra, India',      validTill: '2026-06-16', risk: 'Low',    product: 'Methanol', origin: 'UAE',          make: 'Ruwais', packaging: 'Drum',        paymentTerms: 'Net 30',      deliveryTerm: 'CIF',      currency: 'USD', exchangeRate: 83.75, expense: 600,  customDuty: 0,   sws: 0,  add: 0,    otherExpense: 100 },
  { id: 'm8', type: 'Sale',     offerId: 'SAL-7718', supplierCustomer: 'Future Polymers',        price: 292, quantity:  700, deliveryDays:  7, location: 'Nhava Sheva, India', validTill: '2026-06-19', risk: 'Low',    product: 'Methanol', origin: 'Saudi Arabia', make: 'SABIC',   packaging: 'ISO Tank',    paymentTerms: 'LC at Sight', deliveryTerm: 'CFR',      currency: 'USD', exchangeRate: 83.50, expense: 800,  customDuty: 0,   sws: 0,  add: 0,    otherExpense: 180 },
  // Sodium Bicarbonate – Purchase
  { id: 's1', type: 'Purchase', offerId: 'PUR-4601', supplierCustomer: 'Solvay Chemicals',       price: 850, quantity:  100, deliveryDays: 14, location: 'Mumbai, India',      validTill: '2026-06-20', risk: 'Low',    product: 'Sodium Bicarbonate', origin: 'Turkey',  make: 'Solvay',  packaging: '25 KG Bags', paymentTerms: '45 Days', deliveryTerm: 'CIF', currency: 'USD', exchangeRate: 83.50, expense: 2000, customDuty: 7.5, sws: 10, add: 800,  otherExpense: 500 },
  { id: 's2', type: 'Purchase', offerId: 'PUR-4603', supplierCustomer: 'Asian Suppliers Co',     price: 820, quantity:  200, deliveryDays: 18, location: 'Nhava Sheva, India', validTill: '2026-06-21', risk: 'Medium', product: 'Sodium Bicarbonate', origin: 'China',   make: 'Tianjin', packaging: '25 KG Bags', paymentTerms: '30 Days', deliveryTerm: 'FOB', currency: 'USD', exchangeRate: 83.25, expense: 1800, customDuty: 7.5, sws: 10, add: 700,  otherExpense: 450 },
  { id: 's3', type: 'Purchase', offerId: 'PUR-4605', supplierCustomer: 'Euro Chemicals GmbH',   price: 870, quantity:  150, deliveryDays: 22, location: 'Chennai, India',     validTill: '2026-06-23', risk: 'Low',    product: 'Sodium Bicarbonate', origin: 'Germany', make: 'Solvay',  packaging: '25 KG Bags', paymentTerms: '60 Days', deliveryTerm: 'CIF', currency: 'USD', exchangeRate: 83.75, expense: 2200, customDuty: 7.5, sws: 10, add: 900,  otherExpense: 600 },
  // Sodium Bicarbonate – Sale
  { id: 's4', type: 'Sale',     offerId: 'SAL-7720', supplierCustomer: 'Pharma Industries Ltd',  price: 920, quantity:   50, deliveryDays:  3, location: 'Mumbai, India',      validTill: '2026-06-16', risk: 'Low',    product: 'Sodium Bicarbonate', origin: 'Turkey',  make: 'Solvay',  packaging: '25 KG Bags', paymentTerms: 'Net 30',  deliveryTerm: 'Ex-Works', currency: 'USD', exchangeRate: 83.50, expense: 500,  customDuty: 0,   sws: 0,  add: 0,    otherExpense: 150 },
  { id: 's5', type: 'Sale',     offerId: 'SAL-7722', supplierCustomer: 'Food Processing Co',     price: 910, quantity:  100, deliveryDays:  5, location: 'Delhi, India',       validTill: '2026-06-17', risk: 'Low',    product: 'Sodium Bicarbonate', origin: 'Turkey',  make: 'Solvay',  packaging: '25 KG Bags', paymentTerms: 'Net 45',  deliveryTerm: 'FOR',      currency: 'USD', exchangeRate: 83.25, expense: 600,  customDuty: 0,   sws: 0,  add: 0,    otherExpense: 200 },
  // Citric Acid
  { id: 'c1', type: 'Purchase', offerId: 'PUR-4610', supplierCustomer: 'Weifang Trading Co',     price: 1150, quantity: 200, deliveryDays: 21, location: 'Chennai, India',    validTill: '2026-06-22', risk: 'Medium', product: 'Citric Acid', origin: 'China',  make: 'Weifang', packaging: '25 KG Bags', paymentTerms: '30 Days', deliveryTerm: 'FOB', currency: 'USD', exchangeRate: 83.25, expense: 1600, customDuty: 10, sws: 10, add: 1200, otherExpense: 700 },
  { id: 'c2', type: 'Purchase', offerId: 'PUR-4612', supplierCustomer: 'RZBC Group',             price: 1120, quantity: 500, deliveryDays: 25, location: 'Nhava Sheva, India', validTill: '2026-06-24', risk: 'Low',    product: 'Citric Acid', origin: 'China',  make: 'RZBC',    packaging: '25 KG Bags', paymentTerms: '45 Days', deliveryTerm: 'CIF', currency: 'USD', exchangeRate: 83.50, expense: 1400, customDuty: 10, sws: 10, add: 1100, otherExpense: 600 },
  { id: 'c3', type: 'Sale',     offerId: 'SAL-7730', supplierCustomer: 'Food Corp India',        price: 1250, quantity: 100, deliveryDays:  4, location: 'Chennai, India',    validTill: '2026-06-18', risk: 'Low',    product: 'Citric Acid', origin: 'China',  make: 'Weifang', packaging: '25 KG Bags', paymentTerms: 'Net 30',  deliveryTerm: 'Ex-Works', currency: 'USD', exchangeRate: 83.25, expense: 700,  customDuty: 0,  sws: 0,  add: 0,    otherExpense: 250 },
  { id: 'c4', type: 'Sale',     offerId: 'SAL-7732', supplierCustomer: 'Beverage Industries',    price: 1230, quantity: 200, deliveryDays:  6, location: 'Mumbai, India',     validTill: '2026-06-20', risk: 'Low',    product: 'Citric Acid', origin: 'China',  make: 'RZBC',    packaging: '25 KG Bags', paymentTerms: 'Net 45',  deliveryTerm: 'FOR',      currency: 'USD', exchangeRate: 83.50, expense: 800,  customDuty: 0,  sws: 0,  add: 0,    otherExpense: 300 },
  // Phosphoric Acid
  { id: 'p1', type: 'Purchase', offerId: 'PUR-4620', supplierCustomer: 'OCP Morocco',            price: 780, quantity:  300, deliveryDays: 25, location: 'Kandla, India',     validTill: '2026-06-25', risk: 'Low',    product: 'Phosphoric Acid', origin: 'Morocco', make: 'OCP',    packaging: 'Bulk Liquid', paymentTerms: '45 Days', deliveryTerm: 'CFR', currency: 'USD', exchangeRate: 83.50, expense: 2500, customDuty: 12, sws: 10, add: 1500, otherExpense: 800 },
  { id: 'p2', type: 'Purchase', offerId: 'PUR-4622', supplierCustomer: 'Mosaic Chemicals',       price: 800, quantity:  200, deliveryDays: 30, location: 'Mumbai, India',     validTill: '2026-06-27', risk: 'Medium', product: 'Phosphoric Acid', origin: 'USA',     make: 'Mosaic', packaging: 'Bulk Liquid', paymentTerms: '60 Days', deliveryTerm: 'CIF', currency: 'USD', exchangeRate: 83.75, expense: 2800, customDuty: 12, sws: 10, add: 1600, otherExpense: 900 },
  { id: 'p3', type: 'Sale',     offerId: 'SAL-7740', supplierCustomer: 'Fertilizer Corp India',  price: 840, quantity:  150, deliveryDays:  6, location: 'Kandla, India',     validTill: '2026-06-20', risk: 'Low',    product: 'Phosphoric Acid', origin: 'Morocco', make: 'OCP',    packaging: 'Bulk Liquid', paymentTerms: 'Net 60',  deliveryTerm: 'CFR', currency: 'USD', exchangeRate: 83.50, expense: 900,  customDuty: 0,  sws: 0,  add: 0,    otherExpense: 300 },
  // Acetic Acid
  { id: 'a1', type: 'Purchase', offerId: 'PUR-4630', supplierCustomer: 'Celanese Corp',          price: 920, quantity:  120, deliveryDays: 18, location: 'Vizag, India',      validTill: '2026-06-22', risk: 'Low',    product: 'Acetic Acid', origin: 'Malaysia',  make: 'Celanese', packaging: 'ISO Tank', paymentTerms: '30 Days', deliveryTerm: 'CIF', currency: 'USD', exchangeRate: 83.50, expense: 1300, customDuty: 7.5, sws: 10, add: 900,  otherExpense: 500 },
  { id: 'a2', type: 'Purchase', offerId: 'PUR-4632', supplierCustomer: 'BP Chemicals',           price: 935, quantity:   80, deliveryDays: 22, location: 'Nhava Sheva, India', validTill: '2026-06-24', risk: 'Medium', product: 'Acetic Acid', origin: 'Singapore', make: 'BP Chem',  packaging: 'ISO Tank', paymentTerms: '45 Days', deliveryTerm: 'CFR', currency: 'USD', exchangeRate: 83.25, expense: 1700, customDuty: 7.5, sws: 10, add: 950,  otherExpense: 600 },
  { id: 'a3', type: 'Sale',     offerId: 'SAL-7750', supplierCustomer: 'Textile Mills Ltd',      price: 1020, quantity:  60, deliveryDays:  4, location: 'Surat, India',      validTill: '2026-06-18', risk: 'Low',    product: 'Acetic Acid', origin: 'Malaysia',  make: 'Celanese', packaging: 'ISO Tank', paymentTerms: 'Net 30',  deliveryTerm: 'Ex-Works', currency: 'USD', exchangeRate: 83.50, expense: 650,  customDuty: 0,  sws: 0,  add: 0,    otherExpense: 200 },
  { id: 'a4', type: 'Sale',     offerId: 'SAL-7752', supplierCustomer: 'Pharma Chem Co',         price: 1010, quantity: 100, deliveryDays:  7, location: 'Mumbai, India',     validTill: '2026-06-21', risk: 'Low',    product: 'Acetic Acid', origin: 'Singapore', make: 'BP Chem',  packaging: 'ISO Tank', paymentTerms: 'Net 45',  deliveryTerm: 'FOR',      currency: 'USD', exchangeRate: 83.25, expense: 700,  customDuty: 0,  sws: 0,  add: 0,    otherExpense: 250 },
  // Potassium Carbonate
  { id: 'k1', type: 'Purchase', offerId: 'PUR-4640', supplierCustomer: 'BASF SE',                price: 950, quantity:  150, deliveryDays: 20, location: 'Chennai, India',    validTill: '2026-06-25', risk: 'Low',    product: 'Potassium Carbonate', origin: 'Germany', make: 'BASF',   packaging: '25 KG Bags', paymentTerms: '60 Days', deliveryTerm: 'CIF', currency: 'USD', exchangeRate: 83.75, expense: 2100, customDuty: 7.5, sws: 10, add: 1000, otherExpense: 700 },
  { id: 'k2', type: 'Purchase', offerId: 'PUR-4642', supplierCustomer: 'Euro Chem Industries',   price: 930, quantity:   80, deliveryDays: 16, location: 'Mumbai, India',     validTill: '2026-06-23', risk: 'Medium', product: 'Potassium Carbonate', origin: 'Germany', make: 'Evonik', packaging: '25 KG Bags', paymentTerms: '45 Days', deliveryTerm: 'CFR', currency: 'USD', exchangeRate: 83.50, expense: 1900, customDuty: 7.5, sws: 10, add: 950,  otherExpense: 650 },
  { id: 'k3', type: 'Sale',     offerId: 'SAL-7760', supplierCustomer: 'Export House India',     price: 1050, quantity:  80, deliveryDays:  5, location: 'Chennai, India',    validTill: '2026-06-18', risk: 'Low',    product: 'Potassium Carbonate', origin: 'Germany', make: 'BASF',   packaging: '25 KG Bags', paymentTerms: 'Net 30',  deliveryTerm: 'Ex-Works', currency: 'USD', exchangeRate: 83.75, expense: 850,  customDuty: 0,  sws: 0,  add: 0,    otherExpense: 300 },
];

const PAGE_SIZE = 8;


function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="cmp-stat-card">
      <div className="cmp-stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div className="cmp-stat-label">{label}</div>
        <div className="cmp-stat-value">{value}</div>
        <div className="cmp-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

// ── Compare Modal ─────────────────────────────────────────────────────────────
function CompareModal({
  offers,
  onClose,
}: {
  offers: ComparableOffer[];
  onClose: () => void;
}) {
  const prices = offers.map(o => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  function priceClass(p: number) {
    if (offers.length < 2) return '';
    if (p === minPrice) return 'cmp-cmp-best';
    if (p === maxPrice) return 'cmp-cmp-worst';
    return 'cmp-cmp-mid';
  }

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono,monospace' };
  const monoBold: React.CSSProperties = { ...mono, fontWeight: 700 };

  const rows: { label: string; render: (o: ComparableOffer) => React.ReactNode }[] = [
    // {
    //   label: 'Company From',
    //   render: o => <strong style={{ color: 'var(--white)' }}>{o.supplierCustomer}</strong>,
    // },
    {
      label: 'Load Port',
      render: o => o.location,
    },
    {
      label: 'QTY (MT)',
      render: o => <span style={mono}>{o.quantity.toLocaleString()}</span>,
    },
    {
      label: 'Delivery Term',
      render: o => o.deliveryTerm,
    },
    {
      label: 'Price (FC)',
      render: o => <span className={priceClass(o.price)} style={monoBold}>{o.price} {o.currency}</span>,
    },
    {
      label: 'Exchange Rate',
      render: o => <span style={mono}>{o.exchangeRate.toFixed(2)}</span>,
    },
    {
      label: 'Price (INR) / MT',
      render: o => {
        const inr = o.price * o.exchangeRate;
        return <span style={monoBold}>₹ {Math.round(inr).toLocaleString('en-IN')}</span>;
      },
    },
    {
      label: 'Valid Till',
      render: o => fmtDate(o.validTill),
    },
    {
      label: 'Expenses (Freight & Insurance)',
      render: o => <span style={mono}>₹ {o.expense.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Custom Duty BCD',
      render: o => {
        const bcd = Math.round(o.price * o.exchangeRate * o.customDuty / 100);
        return <span style={mono}>{o.customDuty}% = ₹ {bcd.toLocaleString('en-IN')}</span>;
      },
    },
    {
      label: 'SWS',
      render: o => {
        const bcd = o.price * o.exchangeRate * o.customDuty / 100;
        const swsAmt = Math.round(bcd * o.sws / 100);
        return <span style={mono}>{o.sws}% of BCD = ₹ {swsAmt.toLocaleString('en-IN')}</span>;
      },
    },
    {
      label: 'ADD (₹)',
      render: o => <span style={mono}>₹ {o.add.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Other Expense',
      render: o => <span style={mono}>₹ {o.otherExpense.toLocaleString('en-IN')}</span>,
    },
    {
      label: 'Landed Cost / MT',
      render: o => {
        const priceInr = o.price * o.exchangeRate;
        const bcd = priceInr * o.customDuty / 100;
        const swsAmt = bcd * o.sws / 100;
        const landed = Math.round(priceInr + o.expense + bcd + swsAmt + o.add + o.otherExpense);
        return <span style={{ ...monoBold, color: 'var(--green)' }}>₹ {landed.toLocaleString('en-IN')}</span>;
      },
    },
  ];

  return (
    <div className="cmp-modal-overlay" onClick={onClose}>
      <div className="cmp-modal" onClick={e => e.stopPropagation()}>
        <div className="cmp-modal-header">
          <div>
            <div className="cmp-modal-title">Offer Comparison</div>
            <div className="cmp-modal-sub">
              Side-by-side comparison · {offers.length} offer{offers.length > 1 ? 's' : ''} selected ·{' '}
              <span style={{ color: 'var(--green)' }}>Green = best</span>{' '}
              <span style={{ color: 'var(--red)', marginLeft: 6 }}>Red = worst</span>
            </div>
          </div>
          <button className="cmp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cmp-modal-body">
          <table className="cmp-compare-table">
            <thead>
              <tr>
                <th>Field</th>
                {offers.map(o => (
                  <th key={o.id}>
                    <div style={{ marginBottom: 4 }}>
                      {/* <span className={`cmp-type-badge ${o.type.toLowerCase()}`}>{o.type}</span> */}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', fontFamily: 'JetBrains Mono,monospace' }}>
                      {o.supplierCustomer}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2, fontWeight: 500, fontFamily: 'Montserrat,sans-serif' }}>
                      {o.offerId}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  {offers.map(o => (
                    <td key={o.id}>{row.render(o)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ComparablePage() {

  const [selectedProduct, setSelectedProduct] = useState('Methanol');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return ALL_OFFERS.filter(o => o.product === selectedProduct && o.type === 'Purchase');
  }, [selectedProduct]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedOffers = ALL_OFFERS.filter(o => selectedIds.has(o.id));

  const purchaseOffers = ALL_OFFERS.filter(o => o.product === selectedProduct && o.type === 'Purchase');
  const bestBuy = purchaseOffers.length ? Math.min(...purchaseOffers.map(o => o.price)) : 0;
  const confirmedCount = selectedIds.size;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const canCompare = selectedIds.size >= 2;

  const handleProductChange = (p: string) => {
    setSelectedProduct(p);
    setPage(1);
    setSelectedIds(new Set());
  };

  return (
    <div className="cmp-page">
      {/* Header */}
      <div className="cmp-header">
        <h1 className="cmp-title">Comparable</h1>
        <p className="cmp-subtitle">Compare multiple purchase and sale offers to choose the best deal</p>
      </div>

      {/* Controls */}
      <div className="cmp-controls">
        {/* Type tabs */}
        <div className="cmp-tabs">
          <button className="cmp-tab active">Purchase</button>
        </div>

        {/* Product selector */}
        <div className="cmp-product-selector">
          <span className="cmp-product-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          <span className="cmp-product-label">Product</span>
          <select
            className="cmp-product-select"
            value={selectedProduct}
            onChange={e => handleProductChange(e.target.value)}
          >
            {PRODUCTS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }} />

        {/* Compare Offers */}
        <button
          className="cmp-compare-btn"
          disabled={!canCompare}
          onClick={() => canCompare && setShowModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <rect x="2" y="3" width="8" height="18" rx="1" />
            <rect x="14" y="3" width="8" height="18" rx="1" />
          </svg>
          Compare Offers
          <span className="cmp-compare-badge">{selectedIds.size}</span>
        </button>

        {/* Export */}
        <button className="cmp-export-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Stats Row */}
      <div className="cmp-stats-row">
        <StatCard
          label="Total Purchase Offers"
          value={purchaseOffers.length}
          sub={`Best Price: USD ${bestBuy} / MT`}
          iconBg="rgba(72,149,239,.15)"
          iconColor="var(--blue)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M12 2L2 7v7c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7z" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="12" y1="8" x2="12" y2="16" />
            </svg>
          }
        />
        <StatCard
          label="Confirmed Offer"
          value={confirmedCount}
          sub={confirmedCount === 0 ? 'No offers confirmed yet' : `${confirmedCount} offer${confirmedCount > 1 ? 's' : ''} selected`}
          iconBg="rgba(6,214,160,.12)"
          iconColor="var(--green)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M12 2L2 7v7c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />
      </div>

      {/* Offers Table */}
      <div className="cmp-table-wrap">
        <div className="cmp-table-header">
          <div className="cmp-table-title">
            Purchase Offers for {selectedProduct}
          </div>
        </div>
        <table className="cmp-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Company From</th>
              <th className="num">QTY (MT)</th>
              <th>Load Port</th>
              <th>Delivery Term</th>
              <th className="num">Price (FC)</th>
              <th className="num">Exchange Rate</th>
              <th>Valid Till</th>
              <th className="num">Expense (₹)</th>
              <th className="num">Custom Duty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(offer => (
              <tr key={offer.id} className={selectedIds.has(offer.id) ? 'cmp-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    className="cmp-checkbox"
                    checked={selectedIds.has(offer.id)}
                    onChange={() => toggleSelect(offer.id)}
                    disabled={!selectedIds.has(offer.id) && selectedIds.size >= 4}
                  />
                </td>
                <td style={{ fontWeight: 600 }}>{offer.supplierCustomer}</td>
                <td className="num">{offer.quantity.toLocaleString()}</td>
                <td className="cmp-location">{offer.location}</td>
                <td>{offer.deliveryTerm}</td>
                <td className="num" style={{ fontWeight: 700 }}>{offer.price} {offer.currency}</td>
                <td className="num">{offer.exchangeRate.toFixed(2)}</td>
                <td style={{ fontSize: 11 }}>{fmtDate(offer.validTill)}</td>
                <td className="num">₹ {offer.expense.toLocaleString()}</td>
                <td className="num">{offer.customDuty}%</td>
                <td>
                  <div className="cmp-actions">
                    <button className="cmp-action-btn view" title="View details">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      className={`cmp-action-btn add${selectedIds.has(offer.id) ? ' added' : ''}`}
                      title={selectedIds.has(offer.id) ? 'Remove from compare' : 'Add to compare'}
                      onClick={() => toggleSelect(offer.id)}
                      disabled={!selectedIds.has(offer.id) && selectedIds.size >= 4}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        {selectedIds.has(offer.id) ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray)' }}>
                  No purchase offers found for {selectedProduct}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="cmp-pagination">
            <span className="cmp-showing">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} offers
            </span>
            <div className="cmp-pages">
              <button className="cmp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`cmp-page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              {totalPages > 5 && <span className="cmp-page-ellipsis">…</span>}
              {totalPages > 5 && (
                <button className={`cmp-page-btn${page === totalPages ? ' active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button className="cmp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Compare Bar */}
      <div className="cmp-bar">
        <div className="cmp-bar-info">
          <div className="cmp-bar-title">Compare Multiple Offers</div>
          <div className="cmp-bar-sub">
            Select 3 to 4 offers from the list and click &apos;Compare Offers&apos; to see a detailed side-by-side comparison.
          </div>
        </div>
        <div className="cmp-bar-right">
          <span className="cmp-selected-label">
            Selected Offers: <strong>{selectedIds.size} / 4</strong>
          </span>
          {selectedIds.size > 0 && (
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--gray)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          )}
          <button
            className={`cmp-compare-now-btn${canCompare ? ' enabled' : ''}`}
            disabled={!canCompare}
            onClick={() => canCompare && setShowModal(true)}
          >
            Compare Now
          </button>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="cmp-features">
        {[
          {
            color: 'var(--blue)',
            title: 'Smart Comparison',
            desc: 'Compare price, delivery, location, risk and more side by side.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="2" y="3" width="8" height="18" rx="1" /><rect x="14" y="3" width="8" height="18" rx="1" />
              </svg>
            ),
          },
          {
            color: 'var(--gold)',
            title: 'Better Decisions',
            desc: 'Identify the best value purchase or most profitable sale.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            ),
          },
          {
            color: 'var(--teal)',
            title: 'Save Time',
            desc: 'All critical information in one place for quick evaluation.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
          {
            color: 'var(--green)',
            title: 'Maximize Profit',
            desc: 'Find the best margin opportunities instantly.',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            ),
          },
        ].map(f => (
          <div key={f.title} className="cmp-feature">
            <div className="cmp-feature-icon" style={{ color: f.color }}>{f.icon}</div>
            <div>
              <div className="cmp-feature-title">{f.title}</div>
              <div className="cmp-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compare Modal */}
      {showModal && (
        <CompareModal offers={selectedOffers} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
