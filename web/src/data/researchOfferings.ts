import records from './researchProperties.json';
import { researchPriceSummary } from './researchPricing';
import { distanceKm } from './mapLocations';
import { WITS_CAMPUSES } from './witsCampuses';

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
  let campusDistance = 'Campus proximity unconfirmed';
  // Use the mapped campus for Parktown pins, rather than a generic university
  // or a walking time that has not been measured. Campus positions are not gates.
  const nearestWits = /\bparktown\b/i.test(item.locality) &&
    Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    ? WITS_CAMPUSES.map(campus => ({
      campus,
      distance: distanceKm([item.latitude!, item.longitude!], campus.position)
    })).sort((a, b) => a.distance - b.distance)[0]
    : undefined;
  if (nearestWits && nearestWits.distance <= 2) {
    campusDistance = nearestWits.campus.id === 'management'
      ? 'Near Wits Business School'
      : `Near Wits ${nearestWits.campus.name}`;
  } else if (/\bwits\b|witwatersrand/i.test(campusText)) {
    if (/medical|health sciences/i.test(campusText)) {
      campusDistance = /education/i.test(campusText)
        ? 'Wits Health Sciences / Education campuses'
        : 'Wits Health Sciences Campus area';
    } else if (/business school|management campus/i.test(campusText)) {
      campusDistance = 'Wits Business School area';
    } else if (/education/i.test(campusText)) {
      campusDistance = 'Wits Education Campus area';
    } else if (/main campus|braamfontein/i.test(campusText)) {
      campusDistance = 'Wits Braamfontein campuses';
    } else {
      campusDistance = 'Wits campus area';
    }
  } else if (/\buj\b|university of johannesburg/i.test(campusText)) {
    campusDistance = 'UJ campus area';
  } else if (/\btut\b|tshwane university of technology/i.test(campusText)) {
    campusDistance = 'TUT campus area';
  } else if (/\bup\b|university of pretoria/i.test(campusText)) {
    campusDistance = 'UP campus area';
  } else if (/\bparktown\b/i.test(item.locality)) {
    campusDistance = 'Wits Parktown campuses';
  } else if (/\bbraamfontein\b/i.test(item.locality)) {
    campusDistance = 'Wits Braamfontein campuses';
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
  const isNsfasClaimed = /nsfas/i.test(item.funding) && !/\b(?:no|not)\s+nsfas|nsfas\s+(?:not|unavailable)/i.test(item.funding);

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
