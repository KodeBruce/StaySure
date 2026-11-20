import { Globe2, LocateFixed } from 'lucide-react';
import { nearbyLocationMessage, type NearbyLocationState } from '../data/nearbyLocation';
import './nearby-search-controls.css';

export function NearbySearchControls({ location, onNearby, onAnywhere }: {
  location: NearbyLocationState;
  onNearby: () => void;
  onAnywhere: () => void;
}) {
  return <div className="nearby-search-controls">
    <div className="nearby-search-options" role="group" aria-label="Search location">
      <button type="button" onClick={onNearby} disabled={location.enabled && location.status === 'locating'} aria-pressed={location.enabled && location.position !== null}>
        <LocateFixed size={15} /><span>Closest to you</span>
      </button>
      <button type="button" onClick={onAnywhere} aria-pressed={!location.enabled}>
        <Globe2 size={15} /><span>Explore all locations</span>
      </button>
    </div>
    <p role="status">{nearbyLocationMessage(location)}</p>
  </div>;
}
