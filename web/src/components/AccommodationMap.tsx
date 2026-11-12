import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '../types';
import { propertyPosition, type Coordinates, type MapBounds } from '../data/mapLocations';

interface Props {
  properties: Property[];
  center: Coordinates;
  userPosition: Coordinates | null;
  accuracyMeters: number;
  radiusKm: number;
  selectedId: string | null;
  visible: boolean;
  onSelect: (id: string) => void;
  onViewChange: (bounds: MapBounds) => void;
}

export function AccommodationMap({ properties, center, userPosition, accuracyMeters, radiusKm, selectedId, visible, onSelect, onViewChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { scrollWheelZoom: false }).setView(center, userPosition ? 13 : 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(instance);
    const group = L.layerGroup().addTo(instance);
    const reportBounds = () => {
      const bounds = instance.getBounds();
      onViewChangeRef.current({ south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() });
    };
    instance.on('dragend zoomend', reportBounds);
    map.current = instance;
    markers.current = group;
    return () => { instance.remove(); map.current = null; markers.current = null; };
  }, []);

  useEffect(() => { map.current?.setView(center, userPosition ? 13 : 12); }, [center[0], center[1], userPosition]);
  useEffect(() => { if (visible) window.setTimeout(() => map.current?.invalidateSize(), 0); }, [visible]);

  useEffect(() => {
    const property = properties.find((item) => item.id === selectedId);
    const location = property && propertyPosition(property);
    if (location) map.current?.panTo(location.position);
  }, [selectedId]);

  useEffect(() => {
    const group = markers.current;
    if (!group) return;
    group.clearLayers();
    for (const property of properties) {
      const location = propertyPosition(property);
      if (!location) continue;
      const selected = selectedId === property.id;
      const icon = L.divIcon({
        className: 'accom-map-pin-shell',
        html: `<span class="accom-map-pin${selected ? ' is-selected' : ''}"><span aria-hidden="true">⌂</span> R${property.price.toLocaleString('en-ZA')}</span>`,
        iconSize: [106, 38], iconAnchor: [53, 38]
      });
      const marker = L.marker(location.position, { icon, title: `${property.name}, R${property.price} per month` });
      const popup = document.createElement('div');
      popup.className = 'accom-map-popup';
      const title = document.createElement('strong');
      title.textContent = property.name;
      const detail = document.createElement('span');
      detail.textContent = `${property.area} · R${property.price.toLocaleString('en-ZA')}/month`;
      const note = document.createElement('small');
      note.textContent = location.approximate ? 'Approximate area location' : 'Listing location';
      popup.append(title, detail, note);
      marker.bindPopup(popup);
      marker.on('click', () => onSelectRef.current(property.id));
      group.addLayer(marker);
    }
    if (userPosition) {
      L.circle(userPosition, { radius: radiusKm * 1000, color: '#1f9d5c', fillColor: '#1f9d5c', fillOpacity: 0.07, weight: 2 }).addTo(group);
      L.circle(userPosition, { radius: accuracyMeters, color: '#2266d1', fillColor: '#2266d1', fillOpacity: 0.14, weight: 1 }).addTo(group);
      L.circleMarker(userPosition, { radius: 8, color: '#fff', weight: 3, fillColor: '#2266d1', fillOpacity: 1 }).bindTooltip('Your location').addTo(group);
    }
  }, [properties, selectedId, userPosition, accuracyMeters, radiusKm]);

  return <div ref={container} className="accom-map" role="region" aria-label="Accommodation map" />;
}
