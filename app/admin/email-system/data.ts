// Demo data only — for illustration in the product pitch. Replace with real
// catalog / CRM data once the backend is ready.

import type { Chemical, Customer, EmailTemplate } from './types';

const GRADES = ['Industrial Grade', 'Technical Grade', 'AR Grade', '99% Purity', 'Pharma Grade'];
const PACKINGS = ['200L Drums', 'ISO Tank', 'Bulk Tanker', '1MT IBC', '50kg Bags'];

const CATEGORY_CHEMICALS: Record<string, string[]> = {
  Alcohols: ['Methanol', 'Ethanol', 'Isopropyl Alcohol', 'n-Butanol', 'Isobutanol', 'sec-Butanol', 'tert-Butanol', '2-Ethylhexanol', 'n-Propanol', 'Benzyl Alcohol'],
  Acids: ['Acetic Acid', 'Formic Acid', 'Propionic Acid', 'Butyric Acid', 'Oxalic Acid', 'Citric Acid', 'Lactic Acid', 'Adipic Acid', 'Benzoic Acid', 'Phthalic Anhydride', 'Maleic Anhydride', 'Acrylic Acid'],
  Esters: ['Ethyl Acetate', 'Butyl Acetate', 'Methyl Acetate', 'Isopropyl Acetate', 'Isobutyl Acetate', 'n-Propyl Acetate', 'Ethyl Lactate', 'Dioctyl Phthalate (DOP)', 'Dibutyl Phthalate (DBP)', 'Diisononyl Phthalate (DINP)'],
  Ethers: ['Diethyl Ether', 'Methyl Tertiary Butyl Ether (MTBE)', 'Tetrahydrofuran (THF)', '1,4-Dioxane', 'Diglyme', 'Propylene Glycol Methyl Ether (PGME)', 'PGME Acetate (PGMEA)', 'Ethylene Glycol Monobutyl Ether (EGBE)'],
  Phenols: ['Phenol', 'Cresol', 'Bisphenol A', 'Nonylphenol', 'Resorcinol', 'Hydroquinone'],
  Ketones: ['Acetone', 'Methyl Ethyl Ketone (MEK)', 'Methyl Isobutyl Ketone (MIBK)', 'Cyclohexanone', 'Diacetone Alcohol', 'Isophorone', 'Acetophenone', 'Methyl Amyl Ketone'],
  Aromatics: ['Benzene', 'Toluene', 'Mixed Xylene', 'Ortho-Xylene', 'Para-Xylene', 'Ethylbenzene', 'Styrene Monomer', 'Cumene', 'Naphthalene', 'Nitrobenzene'],
  Glycols: ['Mono Ethylene Glycol (MEG)', 'Di Ethylene Glycol (DEG)', 'Tri Ethylene Glycol (TEG)', 'Mono Propylene Glycol (MPG)', 'Dipropylene Glycol', 'Polyethylene Glycol 400', 'Butylene Glycol', 'Hexylene Glycol'],
  Amines: ['Monoethanolamine (MEA)', 'Diethanolamine (DEA)', 'Triethanolamine (TEA)', 'Ethylenediamine', 'Hexamethylenediamine', 'Aniline', 'Diethylamine', 'Triethylamine'],
  'Chlorinated Solvents': ['Methylene Chloride (DCM)', 'Chloroform', 'Carbon Tetrachloride', 'Trichloroethylene', 'Perchloroethylene', 'Ethylene Dichloride (EDC)', 'Vinyl Chloride Monomer (VCM)'],
  'Plasticizers & Intermediates': ['Dioctyl Adipate (DOA)', 'Epoxidized Soybean Oil', 'Tributyl Phosphate', 'Formaldehyde (37%)', 'Melamine', 'Urea', 'Caustic Soda Lye', 'Sulphuric Acid'],
  Inorganics: ['Hydrochloric Acid', 'Nitric Acid', 'Phosphoric Acid', 'Sodium Hypochlorite', 'Hydrogen Peroxide', 'Ammonium Sulphate', 'Calcium Carbonate', 'Titanium Dioxide', 'Sodium Sulphate', 'Potassium Hydroxide'],
  'Polymers & Precursors': ['Vinyl Acetate Monomer (VAM)', 'Acrylonitrile', 'Butadiene', 'Ethylene', 'Propylene', 'Caprolactam', 'Adiponitrile', 'Toluene Diisocyanate (TDI)', 'MDI', 'Polyvinyl Alcohol (PVA)'],
  'Fatty Chemicals': ['Glycerin', 'Sorbitol', 'Stearic Acid', 'Oleic Acid', 'Palm Fatty Acid Distillate'],
};

function hashPrice(seed: number, base: number, spread: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round((base + frac * spread) / 100) * 100;
}

let idx = 0;
export const CHEMICALS: Chemical[] = Object.entries(CATEGORY_CHEMICALS).flatMap(([category, names]) =>
  names.map((name) => {
    idx += 1;
    return {
      id: `chem-${idx}`,
      name,
      category,
      grade: GRADES[idx % GRADES.length],
      packing: PACKINGS[idx % PACKINGS.length],
      unit: 'MT',
      refPrice: hashPrice(idx, 32000, 95000),
    };
  })
);

export const CHEMICAL_CATEGORIES = Array.from(new Set(CHEMICALS.map((c) => c.category)));

const CITIES = ['Mumbai', 'Ahmedabad', 'Vadodara', 'Surat', 'Delhi NCR', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Kanpur', 'Indore', 'Vapi'];
const SEGMENTS = ['Distributor', 'Manufacturer', 'Trader', 'Formulator', 'Exporter'];
const COMPANY_PREFIX = ['Vishwas', 'Om Sai', 'Coastal', 'Zenith', 'Shree Ram', 'Sunrise', 'Prime', 'Bluewave', 'Nova', 'Anand', 'Kaveri', 'Everest', 'Silverline', 'Trident', 'Meridian', 'Orbit', 'Crest', 'Harbour', 'Northgate', 'Pearl', 'Emerald', 'Vantage', 'Sundar', 'Wellspring', 'Cascade'];
const COMPANY_SUFFIX = ['Chemicals', 'Polychem', 'Industries', 'Solvents & Traders', 'Petrochem', 'Impex', 'Chem Corp', 'Enterprises'];
const FIRST_NAMES = ['Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Neha', 'Arjun', 'Kavita', 'Suresh', 'Divya', 'Manoj', 'Pooja', 'Sanjay', 'Ritu', 'Anil', 'Meera', 'Karan', 'Shalini', 'Deepak', 'Nisha', 'Rohit', 'Anjali', 'Vivek', 'Swati', 'Ramesh'];
const LAST_NAMES = ['Sharma', 'Patel', 'Mehta', 'Verma', 'Reddy', 'Iyer', 'Kapoor', 'Nair', 'Gupta', 'Joshi', 'Desai', 'Malhotra', 'Rao', 'Chatterjee', 'Bansal'];

export const CUSTOMERS: Customer[] = Array.from({ length: 28 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[i % LAST_NAMES.length];
  const company = `${COMPANY_PREFIX[i % COMPANY_PREFIX.length]} ${COMPANY_SUFFIX[i % COMPANY_SUFFIX.length]} Pvt Ltd`;
  const domain = company.split(' ').slice(0, 2).join('').toLowerCase().replace(/[^a-z]/g, '') + '.com';
  return {
    id: `cust-${i + 1}`,
    name: `${first} ${last}`,
    companyName: company,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    phone: `+91 ${90000 + i * 137}${10000 + i * 91}`.replace(/(\+91 \d{5})(\d{5})/, '$1 $2'),
    city: CITIES[i % CITIES.length],
    segment: SEGMENTS[i % SEGMENTS.length],
  };
});

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-hello',
    name: 'Quick Hello',
    tone: 'Casual',
    subject: 'Hey {{customer_name}}, got a quick one for you',
    body:
      `Hi {{customer_name}},\n\n` +
      `Hope you're doing well! It's been a while since we last spoke — thought I'd reach out with something that might interest {{company_name}}.\n\n` +
      `We currently have {{chemical_name}} available at a very competitive rate of ₹{{price}}/MT. Quality and delivery timelines are exactly what you'd expect from us.\n\n` +
      `Let me know if this works for you and I'll block the quantity you need.\n\n` +
      `Looking forward to hearing from you!\n\n` +
      `Warm regards,\nTeam Sidhgun Technologies`,
  },
  {
    id: 'tmpl-checkin',
    name: 'Checking In',
    tone: 'Friendly',
    subject: "How's your day going, {{customer_name}}?",
    body:
      `Hi {{customer_name}},\n\n` +
      `Just checking in — hope your day at {{company_name}} is going great so far!\n\n` +
      `While I had you in mind, I wanted to flag that {{chemical_name}} is currently priced at ₹{{price}}/MT on our end, and I think it's a good window to lock this in.\n\n` +
      `Happy to share more details or samples if that helps.\n\n` +
      `Talk soon,\nTeam Sidhgun Technologies`,
  },
  {
    id: 'tmpl-market-update',
    name: 'Market Update',
    tone: 'Professional',
    subject: '{{chemical_name}} — Updated Pricing for {{company_name}}',
    body:
      `Dear {{customer_name}},\n\n` +
      `Greetings from Sidhgun Technologies.\n\n` +
      `We would like to bring to your attention our latest offer on {{chemical_name}}, currently quoted at ₹{{price}}/MT for {{company_name}}.\n\n` +
      `Given current market movement, we recommend confirming your requirement at the earliest to secure this rate.\n\n` +
      `Please let us know a suitable time to discuss quantity and delivery schedule.\n\n` +
      `Best regards,\nSidhgun Technologies`,
  },
  {
    id: 'tmpl-special-offer',
    name: 'Special Offer',
    tone: 'Promotional',
    subject: 'Special offer on {{chemical_name}} for {{company_name}}',
    body:
      `Hi {{customer_name}},\n\n` +
      `We're running a limited-time offer on {{chemical_name}} exclusively for a few valued partners like {{company_name}}.\n\n` +
      `Offer price: ₹{{price}}/MT — this is one of the best rates we've put out this quarter.\n\n` +
      `This offer is valid while stocks last, so do let us know quickly if you'd like to proceed.\n\n` +
      `Cheers,\nTeam Sidhgun Technologies`,
  },
  {
    id: 'tmpl-rate-card',
    name: 'Monthly Rate Card',
    tone: 'Formal',
    subject: 'Monthly Rate Card — {{chemical_name}}',
    body:
      `Dear {{customer_name}},\n\n` +
      `As part of our monthly rate circulation, please find below our offer for {{chemical_name}}:\n\n` +
      `Price: ₹{{price}}/MT\nCustomer: {{company_name}}\n\n` +
      `This rate is indicative and subject to confirmation at the time of order. Kindly revert with your requirement so we can proceed with a formal quotation.\n\n` +
      `Regards,\nSidhgun Technologies`,
  },
  {
    id: 'tmpl-festive',
    name: 'Festive Greeting + Offer',
    tone: 'Warm',
    subject: 'Season\'s greetings from Sidhgun Technologies + an offer for {{company_name}}',
    body:
      `Dear {{customer_name}},\n\n` +
      `Wishing you and everyone at {{company_name}} a wonderful festive season ahead!\n\n` +
      `As a small gesture, we'd love to offer {{chemical_name}} at ₹{{price}}/MT for your upcoming requirements.\n\n` +
      `Do let us know if you'd like to catch up and lock this in.\n\n` +
      `Warm wishes,\nTeam Sidhgun Technologies`,
  },
];
