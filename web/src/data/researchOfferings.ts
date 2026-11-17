import records from './researchProperties.json';
import { researchPriceSummary } from './researchPricing';

export type ResearchProperty = (typeof records)[number];

export interface OfferingItem {
  id: string;
  name: string;
  available: boolean;
  label: string;
  detail?: string;
}

export interface ParsedOfferings {
  priceLabel: string;
  priceNote: string;
  roomTypes: string[];
  campusDistance: string;
  localityShort: string;
  isNsfasClaimed: boolean;
  isEnsuite: boolean;
  hasWifi: boolean;
  hasFurniture: boolean;
  hasStudyArea: boolean;
  hasTransport: boolean;
  hasSecurity: boolean;
  hasBiometrics: boolean;
  hasLaundry: boolean;
  hasKitchen: boolean;
  hasEntertainment: boolean;
  keyOfferings: OfferingItem[];
}

export function parseOfferings(item: ResearchProperty): ParsedOfferings {
  const text = `${item.amenities || ''} ${item.rooms || ''} ${item.classification || ''}`.toLowerCase();
  const campusText = (item.campus || '').toLowerCase();
  const fundingText = `${item.funding || ''} ${item.fundingEvidence || ''} ${item.advertisedPrice || ''}`.toLowerCase();
  const price = researchPriceSummary(item.advertisedPrice);

  // 1. Room Types
  const roomTypes: string[] = [];
  if (/single/i.test(item.rooms)) roomTypes.push('Single Room');
  if (/two-sharing|2-sharing|two sharing|double/i.test(item.rooms)) roomTypes.push('2-Sharing');
  if (/3-sharing|3-bed|3 sharing|three/i.test(item.rooms)) roomTypes.push('3-Sharing');
  if (/4-sharing|4-bed|4 sharing|four/i.test(item.rooms)) roomTypes.push('4-Sharing');
  if (/en-suite|ensuite/i.test(text)) roomTypes.push('En-suite');
  if (/bachelor|studio/i.test(text)) roomTypes.push('Studio');
  if (roomTypes.length === 0) {
    if (/apartment/i.test(text)) roomTypes.push('Apartment Room');
    else roomTypes.push('Student Room');
  }

  // 2. Campus & Proximity
  let campusDistance = 'Near Campus';
  if (/wits/i.test(campusText)) {
    if (/close|walk|opposite/i.test(campusText) || /braamfontein/i.test(item.locality)) {
      campusDistance = 'Near Wits (~5–12 min walk)';
    } else {
      campusDistance = 'Wits Campus Area';
    }
  } else if (/uj/i.test(campusText)) {
    campusDistance = 'Near UJ Campus';
  } else if (/tut/i.test(campusText)) {
    campusDistance = 'Near TUT Campus';
  } else if (/up/i.test(campusText)) {
    campusDistance = 'Near UP Campus';
  } else if (/braamfontein/i.test(item.locality)) {
    campusDistance = 'Braamfontein (walk to Wits)';
  }

  const shortLocality = item.locality.split(',')[0].trim();

  // 3. Offerings detection
  const hasWifi = /wi-fi|wifi|internet|fibre|fiber|data/i.test(text);
  const hasFurniture = /furnish|bed|wardrobe|desk|chair/i.test(text);
  const hasStudyArea = /study|library|desk|reading room|quiet/i.test(text);
  const hasTransport = /transport|shuttle|bus/i.test(text);
  const hasSecurity = /security|guard|cctv|surveillance|24-hour|24hr|patrol/i.test(text);
  const hasBiometrics = /biometric|fingerprint|access control|facial|tag/i.test(text);
  const hasLaundry = /laundry|washing machine/i.test(text);
  const hasKitchen = /kitchen|fridge|microwave|stove|equipped/i.test(text);
  const isEnsuite = /en-suite|ensuite/i.test(text);
  const hasEntertainment = /dstv|netflix|tv|lounge|entertainment|games|gym/i.test(text);
  const isNsfasClaimed = /nsfas|accredit/i.test(fundingText);

  const keyOfferings: OfferingItem[] = [
    {
      id: 'wifi',
      name: 'Wi-Fi',
      available: hasWifi,
      label: hasWifi ? 'High-Speed Wi-Fi' : 'Wi-Fi not stated'
    },
    {
      id: 'furniture',
      name: 'Furniture',
      available: hasFurniture,
      label: hasFurniture ? 'Furnished (Bed & Wardrobe)' : 'Unfurnished'
    },
    {
      id: 'study',
      name: 'Study Space',
      available: hasStudyArea,
      label: hasStudyArea ? 'Study Area & Desk' : 'In-room study'
    },
    {
      id: 'transport',
      name: 'Transport',
      available: hasTransport,
      label: hasTransport ? 'Free Campus Shuttle' : 'Direct walking access'
    },
    {
      id: 'security',
      name: '24/7 Security',
      available: hasSecurity,
      label: hasSecurity ? '24/7 Guards & CCTV' : 'Secured building'
    },
    {
      id: 'biometrics',
      name: 'Biometrics',
      available: hasBiometrics,
      label: hasBiometrics ? 'Biometric Access Control' : 'Standard access'
    },
    {
      id: 'laundry',
      name: 'Laundry',
      available: hasLaundry,
      label: hasLaundry ? 'On-site Laundry' : 'Not stated'
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      available: hasKitchen,
      label: hasKitchen ? 'Equipped Kitchen / Fridge' : 'Shared kitchen'
    },
    {
      id: 'bathroom',
      name: 'Bathroom',
      available: true,
      label: isEnsuite ? 'En-suite & Shared options' : 'Shared Bathrooms'
    },
    {
      id: 'entertainment',
      name: 'Lounge & Media',
      available: hasEntertainment,
      label: hasEntertainment ? 'Student Lounge / DSTV' : 'Standard common areas'
    }
  ];

  return {
    priceLabel: price?.label ?? 'Ask Provider',
    priceNote: price?.note ?? 'Prices advertised by provider',
    roomTypes,
    campusDistance,
    localityShort: shortLocality,
    isNsfasClaimed,
    isEnsuite,
    hasWifi,
    hasFurniture,
    hasStudyArea,
    hasTransport,
    hasSecurity,
    hasBiometrics,
    hasLaundry,
    hasKitchen,
    hasEntertainment,
    keyOfferings
  };
}
