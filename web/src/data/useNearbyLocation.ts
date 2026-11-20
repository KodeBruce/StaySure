import { useEffect, useRef, useSyncExternalStore } from 'react';
import { nearbyLocation } from './nearbyLocation';

export function useNearbyLocation(hasLocationFilter: boolean) {
  const initialLocationFilter = useRef(hasLocationFilter);
  const state = useSyncExternalStore(nearbyLocation.subscribe, nearbyLocation.getSnapshot, nearbyLocation.getSnapshot);
  useEffect(() => {
    if (initialLocationFilter.current) nearbyLocation.browseAnywhere();
    else nearbyLocation.ensureRequested();
  }, []);
  return {
    ...state,
    nearby: state.enabled && state.position !== null,
    locating: state.enabled && state.status === 'locating',
    requestNearby: nearbyLocation.requestNearby,
    browseAnywhere: nearbyLocation.browseAnywhere
  };
}
