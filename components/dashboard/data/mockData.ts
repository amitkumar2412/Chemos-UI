// ─── Mock Data ────────────────────────────────────────────────────────────
// Replace these imports/exports with real API calls when the backend is ready.
// Each const corresponds 1-to-1 with the backend entity it will eventually fetch.

import type {
  Kpi, Alert, PipelineStage, IccItem, Vendor, Port, ProspectSupplier,
  TopPartner, KpiDriver, CashflowItem, FinanceOffer, ShockChemical,
  NewsItem, Notification, RevenueDataset,
} from '../types';

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── KPIs ─────────────────────────────────────────────────────────────────
export const MOCK_KPIS: Kpi[] = [
  {
    id: 'rev', label: 'Total Revenue', unit: 'currency', baseValue: 1247500000,
    change: 12.4, direction: 'up', vs: 'vs prev. month',
    details: [['Domestic','98.2 Cr'], ['Export','26.5 Cr'], ['Tolling','0.08 Cr']],
    spark: [85,92,78,95,88,102,110,98,115,108,120,124],
  },
  {
    id: 'margin', label: 'Gross Margin', unit: 'percent', baseValue: '34.2%',
    change: 1.8, direction: 'up', vs: 'vs prev. month',
    details: [['COGS','82.1 Cr'], ['Material %','52.3%'], ['Labor %','13.5%']],
    spark: [31,30.5,32,31.8,33,32.5,33.5,34,33.2,34.5,33.8,34.2],
  },
  {
    id: 'orders', label: 'Open Orders', unit: 'count', baseValue: 347,
    change: 8.2, direction: 'up', vs: 'vs prev. month',
    details: [['Domestic','284'], ['Export','63'], ['Avg Value','3.6 L']],
    spark: [280,295,310,290,305,320,315,330,325,340,335,347],
  },
  {
    id: 'alerts', label: 'Active Alerts', unit: 'count', baseValue: 12,
    change: 3, direction: 'down', vs: 'vs yesterday',
    details: [['Critical','3'], ['Warning','5'], ['Watch','4']],
    spark: [18,15,14,16,13,15,12,14,11,13,10,12],
  },
];

// ─── Alerts ───────────────────────────────────────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  { id:'a1', severity:'critical', title:'Benzene stock below safety threshold', desc:'Current: 28 MT | Safety: 40 MT | Lead: 18d', source:'Inventory', time:'12m ago', ack:false, owner:null, scope:'internal' },
  { id:'a2', severity:'critical', title:'Acetic Acid price spike +14% (7d)', desc:'Spot ₹48,200/MT vs avg ₹42,500. Celanese FM.', source:'Market', time:'28m ago', ack:false, owner:null, scope:'external' },
  { id:'a3', severity:'critical', title:'Payment overdue: Reliance Polymers', desc:'#INV-2847 — ₹18.4L, 22d past due', source:'Finance', time:'1h ago', ack:false, owner:null, scope:'internal' },
  { id:'a4', severity:'warning', title:'Butyl Acetate demand forecast +18%', desc:'Seasonal coating cycle Q2. Stock: 12d cover.', source:'Forecast', time:'2h ago', ack:false, owner:null, scope:'external' },
  { id:'a5', severity:'warning', title:'Warehouse Zone C utilization 94%', desc:'Approaching capacity. Rearrange/offload.', source:'Warehouse', time:'3h ago', ack:false, owner:null, scope:'internal' },
  { id:'a6', severity:'warning', title:'Vendor lead time deviation: Eastman', desc:'Avg 22d vs contracted 14d. 3 consecutive.', source:'SCM', time:'4h ago', ack:false, owner:null, scope:'internal' },
  { id:'a7', severity:'warning', title:'FX exposure: USD/INR +1.2%', desc:'Open USD payables ₹4.2Cr. Hedge recommended.', source:'Finance', time:'5h ago', ack:false, owner:null, scope:'external' },
  { id:'a8', severity:'warning', title:'Freight rates spike — Red Sea', desc:'Container rates Asia-EU +42%. RM delays +5-8d.', source:'Logistics', time:'5h ago', ack:false, owner:null, scope:'external' },
  { id:'a9', severity:'watch', title:'IOCL contract renewal in 30d', desc:'Current terms expire May 28. Pre-negotiate.', source:'Procurement', time:'1d ago', ack:false, owner:null, scope:'internal' },
  { id:'a10', severity:'watch', title:'Competitor: Aarti DOP ₹138K/MT', desc:'vs our ₹142K. Monitor volume impact.', source:'Market', time:'2d ago', ack:false, owner:null, scope:'external' },
  { id:'a11', severity:'watch', title:'EU REACH restricts 4 phthalates', desc:'New DEHP/DBP/BBP/DIBP restrictions.', source:'Regulatory', time:'3d ago', ack:false, owner:null, scope:'external' },
  { id:'a12', severity:'watch', title:'New BIS IS-15907 standard update', desc:'Plasticizer testing revision. Review needed.', source:'Regulatory', time:'3d ago', ack:false, owner:null, scope:'external' },
];

// ─── Pipeline ─────────────────────────────────────────────────────────────
export const MOCK_PIPELINE: PipelineStage[] = [
  { label:'Decision', icon:'🎯', status:'done', pct:100, vars:['Price Trend','Sentiment','Inventory'], insight:'Market signals analyzed. Buy recommendation for Acetic Acid based on price trajectory + seasonal demand.' },
  { label:'Procurement', icon:'📋', status:'done', pct:100, vars:['Supplier Score','Lead Time','Budget'], insight:'PO #PO-3847 raised to Celanese. Qty: 200 MT. Negotiated 3.2% below spot.' },
  { label:'SCM', icon:'🚚', status:'active', pct:65, vars:['ETA','Route','Customs'], insight:'Shipment in transit. ETA: April 30. Vessel: MV Chennai Express. Port: JNPT.' },
  { label:'Factory', icon:'🏭', status:'pending', pct:0, vars:['Capacity','Yield','QC'], insight:'Production slot reserved: Line 3, May 2-4. Batch plan: 180 MT DOP.' },
  { label:'FG Stock', icon:'📦', status:'pending', pct:0, vars:['Zone','Aging','Turnover'], insight:'Projected output: 172 MT DOP (95.5% yield). Zone B-04 allocated.' },
  { label:'Sales', icon:'💰', status:'pending', pct:0, vars:['Orders','Pricing','Credit'], insight:'6 pending orders totaling ₹2.4 Cr fulfillable upon production.' },
  { label:'Payment', icon:'✅', status:'pending', pct:0, vars:['DSO','Collection','Aging'], insight:'Expected receivables: ₹2.1 Cr within 30 days, ₹0.3 Cr 60-day terms.' },
];

// ─── ICC (Inventory Command Centre) ──────────────────────────────────────
export const MOCK_ICC: IccItem[] = [
  { item:'Isopropanol',        port:'JNPT',   company:'Deepak Fert.', physical:210, ready:210, safety:40, reorder:80, market:55000, selling:55000, trend7d:[200,205,208,210,212,210,210], status:'ok' },
  { item:'Acetic Acid (Glacial)', port:'JNPT',company:'Celanese',    physical:185, ready:185, safety:40, reorder:80, market:42500, selling:42500, trend7d:[195,190,188,185,183,185,185], status:'ok' },
  { item:'2-Ethyl Hexanol',    port:'JNPT',   company:'BASF',        physical:142, ready:142, safety:50, reorder:100,market:98500, selling:98500, trend7d:[150,148,145,143,140,142,142], status:'ok' },
  { item:'Butyl Acetate',      port:'Kandla', company:'Eastman',     physical:110, ready:110, safety:35, reorder:70, market:88000, selling:88000, trend7d:[115,112,110,108,110,110,110], status:'ok' },
  { item:'Phthalic Anhydride', port:'JNPT',   company:'Thirumalai',  physical:95,  ready:95,  safety:45, reorder:90, market:72000, selling:72000, trend7d:[100,98,96,94,95,95,95],      status:'warn' },
  { item:'Maleic Anhydride',   port:'JNPT',   company:'Huntsman',    physical:68,  ready:68,  safety:25, reorder:50, market:82000, selling:82000, trend7d:[72,70,69,68,67,68,68],       status:'ok' },
  { item:'Benzene',            port:'Paradip',company:'IOCL',        physical:28,  ready:28,  safety:40, reorder:60, market:78200, selling:78200, trend7d:[45,40,36,32,30,28,28],       status:'critical' },
  { item:'VAM',                port:'Mundra', company:'Celanese',    physical:52,  ready:52,  safety:30, reorder:60, market:115000,selling:115000,trend7d:[58,56,55,54,53,52,52],       status:'warn' },
];

// ─── Vendors ──────────────────────────────────────────────────────────────
export const MOCK_VENDORS: Vendor[] = [
  { name:'Celanese',       quality:92, delivery:85, price:88, responsiveness:90, compliance:95, overall:90, hq:'Dallas, TX',         port:'JNPT / Mundra',    commodities:[{chem:'Acetic Acid',qty:1200},{chem:'VAM',qty:340}] },
  { name:'BASF',           quality:96, delivery:91, price:82, responsiveness:88, compliance:98, overall:91, hq:'Ludwigshafen, DE',   port:'JNPT / Chennai',   commodities:[{chem:'2-EH',qty:850},{chem:'Isopropanol',qty:420}] },
  { name:'Eastman',        quality:88, delivery:72, price:90, responsiveness:78, compliance:92, overall:84, hq:'Kingsport, TN',      port:'JNPT / Kandla',    commodities:[{chem:'Acetic Acid',qty:600},{chem:'Butyl Acetate',qty:480}] },
  { name:'IOCL',           quality:85, delivery:88, price:94, responsiveness:82, compliance:90, overall:88, hq:'New Delhi, IN',      port:'Paradip / Haldia', commodities:[{chem:'Benzene',qty:2400},{chem:'Toluene',qty:800}] },
  { name:'RIL',            quality:90, delivery:86, price:91, responsiveness:85, compliance:93, overall:89, hq:'Mumbai, IN',         port:'JNPT / Hazira',    commodities:[{chem:'Benzene',qty:3200},{chem:'PA',qty:1100}] },
  { name:'LyondellBasell', quality:94, delivery:80, price:78, responsiveness:86, compliance:96, overall:87, hq:'Houston, TX',        port:'JNPT / Mundra',    commodities:[{chem:'VAM',qty:280},{chem:'Butyl Acetate',qty:350}] },
];

// ─── Ports ────────────────────────────────────────────────────────────────
export const MOCK_PORTS: Port[] = [
  { name:'JNPT (Nhava Sheva)', city:'Navi Mumbai', type:'Container + Liquid', volume:'42,000 MT/yr', vendors:'Celanese, BASF, Eastman, RIL, Lyondell', status:'Primary' },
  { name:'Mundra',             city:'Gujarat',     type:'Liquid Bulk',        volume:'18,000 MT/yr', vendors:'Celanese, LyondellBasell',                status:'Secondary' },
  { name:'Paradip',            city:'Odisha',      type:'Liquid Bulk',        volume:'28,000 MT/yr', vendors:'IOCL',                                    status:'Primary' },
  { name:'Haldia',             city:'West Bengal', type:'Container',          volume:'12,000 MT/yr', vendors:'IOCL',                                    status:'Secondary' },
  { name:'Chennai',            city:'Tamil Nadu',  type:'Container',          volume:'8,500 MT/yr',  vendors:'BASF',                                    status:'Secondary' },
  { name:'Hazira',             city:'Gujarat',     type:'Liquid Bulk',        volume:'22,000 MT/yr', vendors:'RIL',                                     status:'Primary' },
  { name:'Kandla',             city:'Gujarat',     type:'Container',          volume:'6,200 MT/yr',  vendors:'Eastman',                                 status:'Tertiary' },
];

// ─── Prospect Suppliers ───────────────────────────────────────────────────
export const MOCK_PROSPECTS: ProspectSupplier[] = [
  { chem:'Acetic Acid',    supplier:'Daicel Corp.',   country:'Japan', capacity:'200 KTPA', lead:'28d', note:'Competitive Asian pricing, quality certified' },
  { chem:'Acetic Acid',    supplier:'Jiangsu Sopo',   country:'China', capacity:'500 KTPA', lead:'21d', note:'Lowest cost, BIS compliance pending' },
  { chem:'Benzene',        supplier:'Nayara Energy',  country:'India', capacity:'350 KTPA', lead:'5d',  note:'Domestic, Vadinar refinery' },
  { chem:'2-EH',           supplier:'KH Neochem',     country:'Japan', capacity:'120 KTPA', lead:'25d', note:'Premium grade, Chiba plant' },
  { chem:'PA',             supplier:'Stepan Company', country:'USA',   capacity:'180 KTPA', lead:'30d', note:'Specialty PA, higher purity' },
  { chem:'Butyl Acetate',  supplier:'GNFC',           country:'India', capacity:'60 KTPA',  lead:'7d',  note:'Domestic, competitive freight' },
  { chem:'VAM',            supplier:'Kuraray',        country:'Japan', capacity:'250 KTPA', lead:'22d', note:'High purity specialty grade' },
  { chem:'Maleic Anhydride', supplier:'Polynt SpA',   country:'Italy', capacity:'200 KTPA', lead:'28d', note:'European quality standard' },
];

// ─── Top Customers ────────────────────────────────────────────────────────
export const MOCK_TOP_CUSTOMERS: Record<string, TopPartner[]> = {
  month: [
    { name:'Relaxo Footwears',  value:18.4, pct:14.7 },
    { name:'Supreme Industries',value:15.2, pct:12.2 },
    { name:'Finolex Cables',    value:12.8, pct:10.2 },
    { name:'Astral Pipes',      value:9.6,  pct:7.7  },
    { name:'Polycab',           value:8.1,  pct:6.5  },
    { name:'Havells India',     value:6.8,  pct:5.4  },
    { name:'Century Plyboards', value:5.2,  pct:4.2  },
    { name:'Pidilite Ind.',     value:4.5,  pct:3.6  },
    { name:'Kansai Nerolac',    value:3.8,  pct:3.0  },
    { name:'Asian Paints',      value:3.2,  pct:2.6  },
  ],
  year: [
    { name:'Relaxo Footwears',  value:198, pct:13.5 },
    { name:'Supreme Industries',value:172, pct:11.7 },
    { name:'Finolex Cables',    value:148, pct:10.1 },
    { name:'Astral Pipes',      value:112, pct:7.6  },
    { name:'Polycab',           value:95,  pct:6.5  },
    { name:'Havells India',     value:78,  pct:5.3  },
    { name:'Century Plyboards', value:62,  pct:4.2  },
    { name:'Pidilite Ind.',     value:54,  pct:3.7  },
    { name:'Kansai Nerolac',    value:44,  pct:3.0  },
    { name:'Asian Paints',      value:38,  pct:2.6  },
  ],
};

// ─── Top Suppliers ────────────────────────────────────────────────────────
export const MOCK_TOP_SUPPLIERS: Record<string, TopPartner[]> = {
  month: [
    { name:'Celanese',       value:22.5, pct:18.0 },
    { name:'BASF',           value:18.7, pct:15.0 },
    { name:'IOCL',           value:14.2, pct:11.4 },
    { name:'RIL',            value:11.8, pct:9.4  },
    { name:'Eastman',        value:9.3,  pct:7.4  },
    { name:'LyondellBasell', value:7.1,  pct:5.7  },
    { name:'Huntsman',       value:5.8,  pct:4.6  },
    { name:'Lanxess',        value:4.2,  pct:3.4  },
    { name:'Thirumalai',     value:3.5,  pct:2.8  },
    { name:'GNFC',           value:2.8,  pct:2.2  },
  ],
  year: [
    { name:'Celanese',       value:245, pct:17.2 },
    { name:'BASF',           value:210, pct:14.8 },
    { name:'IOCL',           value:162, pct:11.4 },
    { name:'RIL',            value:138, pct:9.7  },
    { name:'Eastman',        value:108, pct:7.6  },
    { name:'LyondellBasell', value:82,  pct:5.8  },
    { name:'Huntsman',       value:65,  pct:4.6  },
    { name:'Lanxess',        value:48,  pct:3.4  },
    { name:'Thirumalai',     value:40,  pct:2.8  },
    { name:'GNFC',           value:32,  pct:2.2  },
  ],
};

// ─── KPI Drivers ──────────────────────────────────────────────────────────
export const MOCK_KPI_DRIVERS: KpiDriver[] = [
  { driver:'RM Price Index',    impact:'+3.2%',    direction:'up'   },
  { driver:'Capacity Util.',    impact:'87.4%',    direction:'up'   },
  { driver:'Order Book',        impact:'+347 active',direction:'up' },
  { driver:'Cash Cycle',        impact:'42 days',  direction:'down' },
  { driver:'Inventory Turns',   impact:'6.2x',     direction:'up'   },
  { driver:'Avg Lead Time',     impact:'16.4 days',direction:'down' },
];

// ─── Cashflow ─────────────────────────────────────────────────────────────
export const MOCK_CASHFLOW: CashflowItem[] = [
  { label:'Opening',  value:48,   type:'total' },
  { label:'Sales',    value:124,  type:'pos'   },
  { label:'RM Cost',  value:-81,  type:'neg'   },
  { label:'Wages',    value:-18,  type:'neg'   },
  { label:'Utilities',value:-7,   type:'neg'   },
  { label:'Overheads',value:-5,   type:'neg'   },
  { label:'Tax',      value:-8,   type:'neg'   },
  { label:'Closing',  value:53,   type:'total' },
];

// ─── Finance Offers ───────────────────────────────────────────────────────
export const MOCK_FINANCE_OFFERS: FinanceOffer[] = [
  { rank:1,  item:'Isopropanol',        port:'JNPT',   company:'Deepak Fert.', family:'Alcohols',    qty:150, buyPrice:50000,  sellPrice:58000,  period:45,  roic:24.8, wacc:14.0, spread:10.8, recommendation:'PURSUE'   },
  { rank:2,  item:'2-Ethyl Hexanol',    port:'JNPT',   company:'BASF',         family:'Plasticizers', qty:100, buyPrice:92000,  sellPrice:106000, period:60,  roic:21.4, wacc:14.0, spread:7.4,  recommendation:'PURSUE'   },
  { rank:3,  item:'DOP (Finished)',     port:'—',      company:'Own Mfg.',     family:'Plasticizers', qty:200, buyPrice:118000, sellPrice:142000, period:30,  roic:28.3, wacc:14.0, spread:14.3, recommendation:'PURSUE'   },
  { rank:4,  item:'Acetic Acid',        port:'JNPT',   company:'Celanese',     family:'Acids',        qty:80,  buyPrice:40000,  sellPrice:45000,  period:45,  roic:18.2, wacc:16.0, spread:2.2,  recommendation:'MARGINAL' },
  { rank:5,  item:'Butyl Acetate',      port:'Kandla', company:'Eastman',      family:'Esters',       qty:60,  buyPrice:82000,  sellPrice:92000,  period:30,  roic:22.1, wacc:14.0, spread:8.1,  recommendation:'PURSUE'   },
  { rank:6,  item:'Phthalic Anhydride', port:'JNPT',   company:'Thirumalai',   family:'Anhydrides',   qty:90,  buyPrice:68000,  sellPrice:75000,  period:60,  roic:15.3, wacc:16.0, spread:-0.7, recommendation:'DECLINE'  },
  { rank:7,  item:'DOTP (Finished)',    port:'—',      company:'Own Mfg.',     family:'Plasticizers', qty:120, buyPrice:135000, sellPrice:165000, period:30,  roic:26.5, wacc:14.0, spread:12.5, recommendation:'PURSUE'   },
  { rank:8,  item:'VAM',               port:'Mundra', company:'Celanese',     family:'Monomers',     qty:50,  buyPrice:108000, sellPrice:120000, period:45,  roic:17.6, wacc:16.0, spread:1.6,  recommendation:'MARGINAL' },
  { rank:9,  item:'Maleic Anhydride',  port:'JNPT',   company:'Huntsman',     family:'Anhydrides',   qty:40,  buyPrice:77000,  sellPrice:86000,  period:45,  roic:16.8, wacc:16.0, spread:0.8,  recommendation:'MARGINAL' },
  { rank:10, item:'Benzene',           port:'Paradip',company:'IOCL',         family:'Aromatics',    qty:30,  buyPrice:74000,  sellPrice:81000,  period:30,  roic:13.5, wacc:16.0, spread:-2.5, recommendation:'DECLINE'  },
];

// ─── Shock Chemicals ──────────────────────────────────────────────────────
export const MOCK_SHOCK_CHEMICALS: ShockChemical[] = [
  { name:'Benzene',     base:78200,  crudeCoeff:.65, fxCoeff:.40, supplyCoeff:.30 },
  { name:'Acetic Acid', base:42500,  crudeCoeff:.35, fxCoeff:.25, supplyCoeff:.45 },
  { name:'2-EH',        base:98500,  crudeCoeff:.55, fxCoeff:.35, supplyCoeff:.20 },
  { name:'PA',          base:72000,  crudeCoeff:.50, fxCoeff:.30, supplyCoeff:.35 },
  { name:'DOP',         base:142000, crudeCoeff:.45, fxCoeff:.20, supplyCoeff:.25 },
];

// ─── News ─────────────────────────────────────────────────────────────────
export const MOCK_NEWS: NewsItem[] = [
  { title:'Celanese declares force majeure on Acetic Acid', sentiment:'neg', source:'Reuters', time:'2h ago', tags:['Acetic Acid','Supply'], detail:'Clear Lake outage. 3-4 week recovery. Spot +8% in Asian markets.' },
  { title:'India crude basket rises to $86/bbl on OPEC cuts', sentiment:'neg', source:'Bloomberg', time:'4h ago', tags:['Crude','Macro'], detail:'OPEC+ extends cuts through Q3. Naphtha chain under pressure.' },
  { title:'China PMI rebounds to 51.2', sentiment:'pos', source:'Caixin', time:'6h ago', tags:['Macro','Demand'], detail:'Manufacturing expansion. Export orders at 52.8 — 8-month high.' },
  { title:'IOCL Paradip expansion on track for Q3', sentiment:'pos', source:'ET', time:'8h ago', tags:['Benzene','Supply'], detail:'300 KTPA aromatics capacity. August 2026 commissioning.' },
  { title:'EU REACH restricts 4 phthalate plasticizers', sentiment:'neu', source:'ECHA', time:'1d ago', tags:['Regulatory','DOTP'], detail:'DEHP/DBP/BBP/DIBP restricted. Shift to DOTP accelerated.' },
  { title:'RIL announces $2.5B downstream complex', sentiment:'pos', source:'Mint', time:'1d ago', tags:['Supply','Benzene'], detail:'Jamnagar: 500 KTPA benzene, 400 KTPA PX. 2028 commissioning.' },
  { title:'Freight rates spike — Red Sea disruption', sentiment:'neg', source:'Platts', time:'2d ago', tags:['SCM','Logistics'], detail:'Container Asia-EU +42%. Chemical tankers firm. +5-8d delays.' },
];

// ─── Notifications ────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { icon:'⚠️', text:'Benzene stock critically low',    time:'12m ago', read:false },
  { icon:'📈', text:'Acetic Acid spot crossed ₹48K',   time:'28m ago', read:false },
  { icon:'💳', text:'Payment: Supreme Ind. ₹8.4L',     time:'1h ago',  read:true  },
  { icon:'🚚', text:'MV Chennai Express ETA: Apr 30',  time:'2h ago',  read:true  },
  { icon:'📊', text:'Weekly report generated',         time:'4h ago',  read:true  },
];

// ─── Revenue ──────────────────────────────────────────────────────────────
export const MOCK_REVENUE: Record<string, RevenueDataset> = {
  monthly: {
    labels: MO,
    revenue: [82,88,95,91,98,105,102,110,108,115,120,124],
    cost:    [54,58,61,60,64,68,67,72,70,74,78,81],
    profit:  [28,30,34,31,34,37,35,38,38,41,42,43],
  },
  quarterly: {
    labels:  ['Q1','Q2','Q3','Q4'],
    revenue: [265,294,320,359],
    cost:    [173,192,209,233],
    profit:  [92,102,111,126],
  },
};
