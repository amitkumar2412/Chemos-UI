import { NextResponse } from 'next/server';

const products = [
  'VAM (Carbide Base)',
  'VAM (Natural Gas)',
  'Toluene',
  'MEG (Mono Ethylene Glycol)',
  'Acetic Acid',
  'Methanol',
  'Ethanol',
  'Benzene',
  'Xylene',
  'Acetone',
  'IPA (Isopropyl Alcohol)',
  'Glycerin',
  'Caustic Soda',
  'Hydrochloric Acid',
  'Sulfuric Acid',
  'Phosphoric Acid',
  'Hydrogen Peroxide',
  'Ethyl Acetate',
  'Styrene Monomer',
  'Propylene Glycol',
  'Butanol',
  'Formaldehyde',
  'Chloroform',
];

const ports = [
  'Kandla',
  'JNPT Mumbai',
  'Mundra Port',
  'Nhava Sheva',
  'Hazira Terminal',
  'Dahej Port',
  'Chennai Port',
  'Vizag Port',
  'Paradip Port',
  'Kolkata Dock',
  'Pipavav Port',
  'Tuna Terminal',
];

const companies = [
  'Reliance Industries',
  'ONGC',
  'GAIL India',
  'Indian Oil Corporation',
  'BPCL',
  'HPCL',
  'BASF India',
  'Dow Chemical India',
  'Tata Chemicals',
  'UPL Limited',
  'Deepak Nitrite',
  'Aarti Industries',
  'Gujarat Alkalies',
  'SRF Limited',
  'Chemplast Sanmar',
];

const makes = [
  'Sinopec',
  'BASF',
  'Kuraray',
  'Celanese',
  'LyondellBasell',
  'Eastman',
  'Mitsubishi Chemical',
  'Wacker Chemie',
  'Dairen Chemical',
  'Chang Chun',
  'Taiwan Petrochemical',
  'Jilin Chemical',
  'Shandong Hualu',
];

const packagings = [
  'Bulk',
  'ISO Tank',
  'IBC (1000L)',
  'Drum (200L)',
  'Drum (50L)',
  'Flexi Bag',
  'Barrel',
  'Jerrycan (25L)',
];

const origins = [
  'China',
  'India',
  'Germany',
  'USA',
  'South Korea',
  'Taiwan',
  'Japan',
  'Saudi Arabia',
  'Singapore',
  'Malaysia',
  'Netherlands',
  'Belgium',
];

const payments = [
  '30 Days',
  '45 Days',
  '60 Days',
  '90 Days',
  'Advance',
  'LC at Sight',
  'LC 30 Days',
  'LC 60 Days',
  'CAD',
  'DA 30 Days',
  'DA 60 Days',
  'DP at Sight',
];

const shipments = [
  'Ready Stock',
  'Spot',
  'January Loading',
  'February Loading',
  'March Loading',
  'April Loading',
  'May Loading',
  'June Loading',
  'July Loading',
  'August Loading',
  'September Loading',
  'October Loading',
  'November Loading',
  'December Loading',
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
  'Q4 2026',
];

export async function GET() {
  return NextResponse.json({
    products,
    ports,
    companies,
    makes,
    packagings,
    origins,
    payments,
    shipments,
  });
}
