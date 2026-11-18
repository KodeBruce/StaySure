import type { Property } from '../types';

export type Coordinates = [number, number];
export interface MapBounds { south: number; west: number; north: number; east: number }

export function withinBounds(point: Coordinates, bounds: MapBounds): boolean {
  return point[0] >= bounds.south && point[0] <= bounds.north &&
    point[1] >= bounds.west && point[1] <= bounds.east;
}

export const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
];

export const PROVINCE_CENTRES: Record<string, Coordinates> = {
  'Eastern Cape': [-32.849, 27.442], 'Free State': [-29.085, 26.159],
  Gauteng: [-26.193, 28.031], 'KwaZulu-Natal': [-29.858, 31.022],
  Limpopo: [-23.904, 29.469], Mpumalanga: [-25.474, 30.970],
  'North West': [-25.865, 25.644], 'Northern Cape': [-28.728, 24.749],
  'Western Cape': [-33.925, 18.424]
};

export interface UniversityInfo {
  id: string;
  shortName: string;
  name: string;
  fullName: string;
  province: string;
  position: Coordinates;
  campuses: string[];
  radiusKm: number;
}

export const UNIVERSITIES: UniversityInfo[] = [
  {
    id: 'wits',
    shortName: 'Wits',
    name: 'University of the Witwatersrand',
    fullName: 'Wits · University of the Witwatersrand',
    province: 'Gauteng',
    position: [-26.1929, 28.0305] as Coordinates,
    campuses: ['Braamfontein Main Campus', 'Parktown Health/Education'],
    radiusKm: 6
  },
  {
    id: 'uj',
    shortName: 'UJ',
    name: 'University of Johannesburg',
    fullName: 'UJ · University of Johannesburg',
    province: 'Gauteng',
    position: [-26.1826, 28.0005] as Coordinates,
    campuses: ['Auckland Park (APK/APB)', 'Doornfontein (DFC)', 'Soweto (SWC)'],
    radiusKm: 8
  },
  {
    id: 'up',
    shortName: 'UP',
    name: 'University of Pretoria',
    fullName: 'UP · University of Pretoria',
    province: 'Gauteng',
    position: [-25.7545, 28.2314] as Coordinates,
    campuses: ['Hatfield Main Campus', 'Hillcrest', 'Groenkloof', 'Prinshof'],
    radiusKm: 8
  },
  {
    id: 'tut',
    shortName: 'TUT',
    name: 'Tshwane University of Technology',
    fullName: 'TUT · Tshwane University of Technology',
    province: 'Gauteng',
    position: [-25.7323, 28.1624] as Coordinates,
    campuses: ['Pretoria West Main Campus', 'Arcadia', 'Soshanguve', 'Ga-Rankuwa'],
    radiusKm: 14
  }
];

export function getPropertyUniversities(property: {
  name?: string;
  address?: string;
  locality?: string;
  area?: string;
  campus?: string;
  institutions?: string;
  witsStatus?: string;
  ujStatus?: string;
  upStatus?: string;
  tutStatus?: string;
  latitude?: number;
  longitude?: number;
}): UniversityInfo[] {
  const matched: UniversityInfo[] = [];
  const text = (
    (property.name || '') + ' ' +
    (property.address || '') + ' ' +
    (property.locality || '') + ' ' +
    (property.area || '') + ' ' +
    (property.campus || '') + ' ' +
    (property.institutions || '')
  ).toLowerCase();

  const witsS = (property.witsStatus || '').toLowerCase();
  const ujS = (property.ujStatus || '').toLowerCase();
  const upS = (property.upStatus || '').toLowerCase();
  const tutS = (property.tutStatus || '').toLowerCase();

  const hasCoords = Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
  const pCoords: Coordinates = hasCoords ? [property.latitude!, property.longitude!] : [0, 0];

  // 1. Wits (University of the Witwatersrand)
  const witsStatusMatch = witsS && !witsS.includes('not assessed') && !witsS.includes('not found');
  const witsTextMatch = text.includes('wits') || text.includes('witwatersrand') || text.includes('braamfontein') || text.includes('parktown') || text.includes('milpark');
  const witsNearCoord = hasCoords && distanceKm(pCoords, UNIVERSITIES[0].position) <= UNIVERSITIES[0].radiusKm;
  if (witsStatusMatch || witsTextMatch || witsNearCoord) {
    matched.push(UNIVERSITIES[0]);
  }

  // 2. UJ (University of Johannesburg)
  const ujStatusMatch = ujS && !ujS.includes('not assessed') && !ujS.includes('no match');
  const ujTextMatch = text.includes('uj') || text.includes('university of johannesburg') || text.includes('auckland park') || text.includes('doornfontein') || text.includes('bunting') || text.includes('kingsway') || text.includes('westdene') || text.includes('melville') || text.includes('soweto');
  const ujNearCoord = hasCoords && distanceKm(pCoords, UNIVERSITIES[1].position) <= UNIVERSITIES[1].radiusKm;
  if (ujStatusMatch || ujTextMatch || ujNearCoord) {
    matched.push(UNIVERSITIES[1]);
  }

  // 3. UP (University of Pretoria)
  const upStatusMatch = upS && !upS.includes('not assessed') && !upS.includes('no match');
  const upTextMatch = text.includes('university of pretoria') || text.includes('hatfield') || text.includes('hillcrest') || text.includes('brooklyn') || text.includes('groenkloof') || text.includes('prinshof') || (text.includes('pretoria') && !text.includes('pretoria west'));
  const upNearCoord = hasCoords && distanceKm(pCoords, UNIVERSITIES[2].position) <= UNIVERSITIES[2].radiusKm;
  if (upStatusMatch || upTextMatch || upNearCoord) {
    matched.push(UNIVERSITIES[2]);
  }

  // 4. TUT (Tshwane University of Technology)
  const tutStatusMatch = tutS && !tutS.includes('not assessed') && !tutS.includes('no match');
  const tutTextMatch = text.includes('tshwane') || text.includes('tut') || text.includes('arcadia') || text.includes('pretoria west') || text.includes('soshanguve') || text.includes('ga-rankuwa') || text.includes('danville');
  const tutNearCoord = hasCoords && distanceKm(pCoords, UNIVERSITIES[3].position) <= UNIVERSITIES[3].radiusKm;
  if (tutStatusMatch || tutTextMatch || tutNearCoord) {
    matched.push(UNIVERSITIES[3]);
  }

  return matched;
}

export function isNearUniversity(property: any, universityId: string): boolean {
  if (!universityId || universityId === 'all') return true;
  const unis = getPropertyUniversities(property);
  return unis.some(u => u.id === universityId.toLowerCase());
}

// The demo listings have no street coordinates. These are approximate area centres.
export const AREA_CENTRES: Record<string, Coordinates> = {
  Braamfontein: [-26.1917, 28.0322],
  Parktown: [-26.1816, 28.0401],
  Milpark: [-26.1808, 28.0143],
  'Auckland Park': [-26.1817, 28.0045],
  Melville: [-26.1763, 28.0091],
  Berea: [-26.1900, 28.0527],
  Rosebank: [-26.1466, 28.0418],
  Westdene: [-26.1759, 27.9941],
  'New Doornfontein': [-26.1985, 28.0575],
  Arcadia: [-25.7485, 28.2205],
  Hatfield: [-25.7505, 28.2365],
  'Pretoria CBD': [-25.7460, 28.1880],
  'Pretoria Central': [-25.7460, 28.1880],
  Brooklyn: [-25.7710, 28.2380],
  Midrand: [-26.0125, 28.1280],
  Soweto: [-26.2485, 27.8540],
  Centurion: [-25.8600, 28.1890],
  Germiston: [-26.2250, 28.1680],
  Randhart: [-26.2910, 28.1100],
  Soshanguve: [-25.5200, 28.1000]
};

export function propertyPosition(property: Property): { position: Coordinates; approximate: boolean } | null {
  if (Number.isFinite(property.latitude) && Number.isFinite(property.longitude)) {
    return { position: [property.latitude!, property.longitude!], approximate: false };
  }
  const position = AREA_CENTRES[property.area];
  return position ? { position, approximate: true } : null;
}

export function propertyProvince(property: Property): string {
  return property.province || (AREA_CENTRES[property.area] ? 'Gauteng' : '');
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b[0] - a[0]);
  const dLng = radians(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
