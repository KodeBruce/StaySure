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

export const UNIVERSITIES = [
  { id: 'wits', name: 'University of the Witwatersrand', province: 'Gauteng', position: [-26.1929, 28.0305] as Coordinates },
  { id: 'uj', name: 'University of Johannesburg', province: 'Gauteng', position: [-26.1826, 28.0005] as Coordinates }
];

// The demo listings have no street coordinates. These are approximate area centres.
export const AREA_CENTRES: Record<string, Coordinates> = {
  Braamfontein: [-26.1917, 28.0322],
  Parktown: [-26.1816, 28.0401],
  Milpark: [-26.1808, 28.0143],
  'Auckland Park': [-26.1817, 28.0045],
  Melville: [-26.1763, 28.0091],
  Berea: [-26.1900, 28.0527],
  Rosebank: [-26.1466, 28.0418],
  Westdene: [-26.1759, 27.9941]
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
