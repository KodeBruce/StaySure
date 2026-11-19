import { useSyncExternalStore } from 'react';
import { getRoomRates } from './roomRates';
import { extractMinPrice } from './researchPricing';
import { parseOfferings, type ResearchProperty } from './researchOfferings';
import { matchesSelectedRoomTypes, ROOM_TYPE_OPTIONS, type RoomTypeFilter } from './roomTypeFilter';
import { isNearUniversity, UNIVERSITIES } from './mapLocations';

export interface SearchCriteria {
  universityId: string;
  area: string;
  region: string;
  maxRent: number | null;
  roomTypes: RoomTypeFilter[];
  preferences: string[];
}

export interface MatchReason {
  status: 'match' | 'miss' | 'unknown';
  text: string;
}

export interface ResearchMatch {
  score: number | null;
  matched: number;
  total: number;
  unknown: number;
  reasons: MatchReason[];
}

export const EMPTY_CRITERIA: SearchCriteria = {
  universityId: 'all', area: '', region: '', maxRent: null, roomTypes: [], preferences: []
};

const key = 'staysure_research_match_criteria';
const eventName = 'staysure-research-match-criteria';
const preferenceLabels: Record<string, string> = {
  nsfas: 'NSFAS funding mentioned', shuttle: 'Transport listed', wifi: 'Wi-Fi listed',
  security: 'Security listed', study: 'Study space listed', furniture: 'Furniture listed', laundry: 'Laundry listed'
};

export function readSearchCriteria(): SearchCriteria {
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) || '{}');
    return {
      universityId: typeof stored.universityId === 'string' ? stored.universityId : 'all',
      area: typeof stored.area === 'string' ? stored.area : '',
      region: typeof stored.region === 'string' ? stored.region : '',
      maxRent: Number.isFinite(stored.maxRent) && stored.maxRent > 0 ? stored.maxRent : null,
      roomTypes: Array.isArray(stored.roomTypes) ? stored.roomTypes.filter((type: unknown) => ROOM_TYPE_OPTIONS.some(option => option.id === type)) : [],
      preferences: Array.isArray(stored.preferences) ? stored.preferences.filter((pref: unknown): pref is string => typeof pref === 'string' && pref in preferenceLabels) : []
    };
  } catch { return EMPTY_CRITERIA; }
}

export function saveSearchCriteria(criteria: SearchCriteria): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(criteria));
    window.dispatchEvent(new Event(eventName));
  } catch { /* Matching still works in the current page if storage is unavailable. */ }
}

// The snapshot is a stable string so useSyncExternalStore can compare it safely.
function snapshot(): string {
  try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
}

export function useSearchCriteria(): SearchCriteria {
  const stored = useSyncExternalStore(
    callback => { window.addEventListener(eventName, callback); window.addEventListener('storage', callback); return () => { window.removeEventListener(eventName, callback); window.removeEventListener('storage', callback); }; },
    snapshot,
    () => ''
  );
  try { return stored ? { ...EMPTY_CRITERIA, ...JSON.parse(stored) } : EMPTY_CRITERIA; }
  catch { return EMPTY_CRITERIA; }
}

export function relevantRent(item: ResearchProperty, criteria: SearchCriteria): { amount: number; basisKnown: boolean } | null {
  if (criteria.roomTypes.length) {
    const options = getRoomRates(item.id)
      .filter(rate => criteria.roomTypes.includes(rate.category as RoomTypeFilter))
      .map(rate => ({ amount: Number(rate.monthly.match(/R\s*([\d,]+(?:\.\d{2})?)/)?.[1].replace(/,/g, '')), basisKnown: rate.basis !== 'basis unconfirmed' && !rate.period }))
      .filter(rate => Number.isFinite(rate.amount));
    if (!options.length) return null;
    return options.sort((a, b) => a.amount - b.amount)[0];
  }
  const amount = extractMinPrice(item.advertisedPrice);
  return amount === null ? null : { amount, basisKnown: true };
}

export function matchResearchProperty(item: ResearchProperty, criteria: SearchCriteria): ResearchMatch {
  const reasons: MatchReason[] = [];
  const add = (status: MatchReason['status'], text: string) => reasons.push({ status, text });
  const offerings = parseOfferings(item);

  if (criteria.universityId && criteria.universityId !== 'all') {
    const university = UNIVERSITIES.find(value => value.id === criteria.universityId);
    if (university) add(isNearUniversity(item, university.id) ? 'match' : 'miss',
      isNearUniversity(item, university.id) ? `Listed near ${university.shortName}` : `Not listed near ${university.shortName}`);
  }
  if (criteria.area) add(item.locality.toLowerCase().includes(criteria.area.toLowerCase()) ? 'match' : 'miss', `Area: ${criteria.area}`);
  if (criteria.region) add(item.region === criteria.region ? 'match' : 'miss', `Region: ${criteria.region}`);

  if (criteria.roomTypes.length) {
    const labels = criteria.roomTypes.map(type => ROOM_TYPE_OPTIONS.find(option => option.id === type)?.label ?? type).join(' or ');
    add(/not (?:publicly )?(?:disclosed|verified)/i.test(item.rooms) ? 'unknown' : matchesSelectedRoomTypes(item, criteria.roomTypes) ? 'match' : 'miss', `Room type: ${labels}`);
  }

  if (criteria.maxRent !== null) {
    const rent = relevantRent(item, criteria);
    if (!rent) add('unknown', 'Price for your room choice is not published');
    else if (!rent.basisKnown) add('unknown', `Listed from R${rent.amount.toLocaleString('en-ZA')}; billing basis needs confirmation`);
    else add(rent.amount <= criteria.maxRent ? 'match' : 'miss',
      `Listed from R${rent.amount.toLocaleString('en-ZA')} against your R${criteria.maxRent.toLocaleString('en-ZA')} budget`);
  }

  for (const pref of criteria.preferences) {
    const available = pref === 'nsfas' ? offerings.isNsfasClaimed
      : pref === 'shuttle' ? offerings.hasTransport
      : pref === 'wifi' ? offerings.hasWifi
      : pref === 'security' ? offerings.hasSecurity || offerings.hasBiometrics
      : pref === 'study' ? offerings.hasStudyArea
      : pref === 'furniture' ? offerings.hasFurniture
      : pref === 'laundry' ? offerings.hasLaundry : false;
    add(available ? 'match' : 'unknown', available ? preferenceLabels[pref] : `${preferenceLabels[pref] ?? pref} not confirmed`);
  }

  const matched = reasons.filter(reason => reason.status === 'match').length;
  const unknown = reasons.filter(reason => reason.status === 'unknown').length;
  return { score: reasons.length ? Math.round(matched / reasons.length * 100) : null, matched, total: reasons.length, unknown, reasons };
}
