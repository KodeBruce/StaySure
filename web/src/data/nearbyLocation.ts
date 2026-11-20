import { distanceKm, type Coordinates } from './mapLocations';

type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';
export interface NearbyLocationState {
  enabled: boolean;
  position: Coordinates | null;
  status: LocationStatus;
}

export function createNearbyLocationStore(
  getGeolocation: () => Geolocation | undefined,
  enabled = true,
  saveEnabled: (enabled: boolean) => void = () => {}
) {
  let state: NearbyLocationState = { enabled, position: null, status: 'idle' };
  let request = 0;
  let capturedAt = 0;
  const listeners = new Set<() => void>();
  const update = (next: NearbyLocationState) => {
    state = next;
    listeners.forEach(listener => listener());
  };
  const browseAnywhere = () => {
    request++;
    saveEnabled(false);
    update({ ...state, enabled: false, status: state.position ? 'ready' : 'idle' });
  };
  const requestNearby = () => {
    if (state.enabled && state.status === 'locating') return;
    const token = ++request;
    saveEnabled(true);
    if (state.position && Date.now() - capturedAt < 60000) {
      update({ ...state, enabled: true, status: 'ready' });
      return;
    }
    update({ enabled: true, position: null, status: 'locating' });
    const failed = (status: 'denied' | 'unavailable') => {
      if (token === request) update({ enabled: true, position: null, status });
    };
    try {
      const geolocation = getGeolocation();
      if (!geolocation) { failed('unavailable'); return; }
      geolocation.getCurrentPosition(({ coords }) => {
        if (token !== request) return; // A manual filter wins over a delayed location result.
        const position: Coordinates = [coords.latitude, coords.longitude];
        if (!validCoordinates(position)) { failed('unavailable'); return; }
        capturedAt = Date.now();
        update({ enabled: true, position, status: 'ready' });
      }, error => failed(error.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
    } catch { failed('unavailable'); }
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    ensureRequested() { if (state.enabled && state.status === 'idle') requestNearby(); },
    requestNearby,
    browseAnywhere
  };
}

const modeKey = 'staysure_location_preference';
function defaultEnabled() {
  try { return sessionStorage.getItem(modeKey) !== 'anywhere'; } catch { return true; }
}

// Coordinates live in memory only. Share one request between Home and the map.
export const nearbyLocation = createNearbyLocationStore(
  () => typeof navigator !== 'undefined' ? navigator.geolocation : undefined,
  defaultEnabled(),
  enabled => { try { sessionStorage.setItem(modeKey, enabled ? 'nearby' : 'anywhere'); } catch { /* Optional session preference. */ } }
);

function validCoordinates(position: Coordinates): boolean {
  return Number.isFinite(position[0]) && Math.abs(position[0]) <= 90 &&
    Number.isFinite(position[1]) && Math.abs(position[1]) <= 180;
}

export function residenceDistance(item: { latitude?: number | null; longitude?: number | null }, origin: Coordinates): number {
  if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return Infinity;
  const point: Coordinates = [item.latitude, item.longitude];
  return validCoordinates(point) ? distanceKm(point, origin) : Infinity;
}

export function compareResidenceDistance(a: Parameters<typeof residenceDistance>[0], b: Parameters<typeof residenceDistance>[0], origin: Coordinates): number {
  const first = residenceDistance(a, origin), second = residenceDistance(b, origin);
  return first === second ? 0 : first < second ? -1 : 1;
}

export function residenceDistanceLabel(item: Parameters<typeof residenceDistance>[0], origin: Coordinates | null): string {
  if (!origin) return '';
  const distance = residenceDistance(item, origin);
  if (!Number.isFinite(distance)) return 'Distance unavailable';
  return `≈ ${distance < 1 ? `${Math.round(distance * 1000 / 10) * 10} m` : `${distance.toFixed(1)} km`} away`;
}

export function nearbyLocationMessage(state: NearbyLocationState): string {
  if (!state.enabled) return '';
  if (state.status === 'idle' || state.status === 'locating') return 'Finding your location. You can choose another area at any time.';
  if (state.status === 'ready') return 'Closest residences first. Distances are approximate, in a straight line.';
  if (state.status === 'denied') return 'Location access is off. Explore all locations or choose a university or area.';
  return 'We couldn’t find your location. Explore all locations or choose a university or area.';
}
