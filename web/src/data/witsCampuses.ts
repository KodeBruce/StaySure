import data from './witsCampuses.json';
import type { Coordinates } from './mapLocations';

export interface WitsCampus {
  id: string;
  name: string;
  area: string;
  streets: string[];
  color: string;
  position: Coordinates;
  outline: Coordinates[];
  sourceWay: number;
  sourceUrl: string;
  officialMapUrl: string;
  note: string;
}

export interface CampusFocus { id: string; request: number }
export const WITS_CAMPUSES = data.campuses as WitsCampus[];
export const WITS_MAP_SOURCE = data.source;

export function campusFocusPoints(id: string): Coordinates[] {
  return WITS_CAMPUSES.filter(campus => id === 'all' || campus.id === id).flatMap(campus => campus.outline);
}
