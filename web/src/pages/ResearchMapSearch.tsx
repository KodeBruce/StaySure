import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, LocateFixed, MapPin, Plus, Search as SearchIcon, Star, X } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import records from '../data/researchProperties.json';
import { researchFallbackImage, researchImages } from '../data/researchMedia';
import { researchPriceSummary } from '../data/researchPricing';
import { useResearchSelection } from '../data/researchSelection';
import { getPropertyReviews } from '../data/propertyReviews';
import { distanceKm, withinBounds, type Coordinates, type MapBounds } from '../data/mapLocations';
import './research-map-search.css';

type ResearchProperty = (typeof records)[number];
const johannesburg: Coordinates = [-26.19, 28.04];

function hasCoordinates(item: ResearchProperty): boolean {
  return typeof item.latitude === 'number' && typeof item.longitude === 'number';
}

function position(item: ResearchProperty): Coordinates {
  return [item.latitude!, item.longitude!];
}

function ResearchPins({ items, selectedId, center, userPosition, radiusKm, onSelect, onViewChange }: {
  items: ResearchProperty[];
  selectedId: string | null;
  center: Coordinates;
  userPosition: Coordinates | null;
  radiusKm: number;
  onSelect: (id: string) => void;
  onViewChange: (bounds: MapBounds) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const [zoom, setZoom] = useState(12);
  const selectRef = useRef(onSelect);
  const viewRef = useRef(onViewChange);
  selectRef.current = onSelect;
  viewRef.current = onViewChange;

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { scrollWheelZoom: false, zoomControl: false }).setView(johannesburg, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19
    }).addTo(instance);
    L.control.zoom({ position: 'bottomright' }).addTo(instance);
    markers.current = L.layerGroup().addTo(instance);
    const reportBounds = () => {
      const bounds = instance.getBounds();
      viewRef.current({ south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() });
    };
    instance.on('dragend zoomend', reportBounds);
    instance.on('zoomend', () => setZoom(instance.getZoom()));
    map.current = instance;
    window.setTimeout(() => instance.invalidateSize(), 0);
    return () => { instance.remove(); map.current = null; markers.current = null; };
  }, []);

  useEffect(() => { map.current?.setView(center, userPosition ? 13 : 12); }, [center[0], center[1], userPosition]);
  useEffect(() => {
    const selected = items.find(item => item.id === selectedId);
    if (selected && hasCoordinates(selected)) map.current?.panTo(position(selected));
  }, [selectedId, items]);
  useEffect(() => {
    const group = markers.current;
    const instance = map.current;
    if (!group || !instance) return;
    group.clearLayers();
    const clusters: ResearchProperty[][] = [];
    for (const item of items) {
      const point = instance.latLngToLayerPoint(position(item));
      const cluster = clusters.find(bucket => {
        const other = instance.latLngToLayerPoint(position(bucket[0]));
        return point.distanceTo(other) < 22;
      });
      if (cluster) cluster.push(item);
      else clusters.push([item]);
    }
    for (const cluster of clusters) {
      if (cluster.length > 1) {
        const average: Coordinates = [cluster.reduce((sum, item) => sum + item.latitude!, 0) / cluster.length, cluster.reduce((sum, item) => sum + item.longitude!, 0) / cluster.length];
        const icon = L.divIcon({ className: 'accom-map-pin-shell', html: `<span class="accom-map-pin${cluster.some(item => item.id === selectedId) ? ' is-selected' : ''}">${cluster.length} places</span>`, iconSize: [112, 38], iconAnchor: [56, 38] });
        const marker = L.marker(average, { icon, title: `${cluster.length} researched places near this location` });
        marker.on('click', () => {
          const latLngs = cluster.map(p => position(p));
          instance.fitBounds(L.latLngBounds(latLngs).pad(0.3), { maxZoom: 16 });
        });
        const popup = document.createElement('div');
        popup.className = 'research-map-cluster-popup';
        const heading = document.createElement('strong');
        heading.textContent = `${cluster.length} researched places nearby`;
        popup.append(heading);
        for (const item of cluster) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `${item.name} · ${researchPriceSummary(item.advertisedPrice)?.pinLabel ?? 'Rate details'}`;
          button.addEventListener('click', () => selectRef.current(item.id));
          popup.append(button);
        }
        marker.bindPopup(popup);
        group.addLayer(marker);
        continue;
      }
      const item = cluster[0];
      const price = researchPriceSummary(item.advertisedPrice)?.pinLabel;
      const label = price ?? 'Rate details';
      const icon = L.divIcon({
        className: 'accom-map-pin-shell',
        html: `<span class="accom-map-pin${item.id === selectedId ? ' is-selected' : ''}"><span aria-hidden="true">⌂</span> ${label}</span>`,
        iconSize: [112, 38], iconAnchor: [56, 38]
      });
      const marker = L.marker(position(item), { icon, title: `${item.name}: ${label}; approximate location` });
      const popup = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.name;
      const note = document.createElement('small');
      note.textContent = `${item.locality} · ${item.coordinatePrecision || item.coordinateStatus}. Entrance not confirmed.`;
      popup.append(name, document.createElement('br'), note);
      marker.bindPopup(popup);
      marker.on('click', () => selectRef.current(item.id));
      group.addLayer(marker);
    }
    if (userPosition) {
      L.circle(userPosition, { radius: radiusKm * 1000, color: '#1f9d5c', fillColor: '#1f9d5c', fillOpacity: 0.08, weight: 2 }).addTo(group);
      L.circleMarker(userPosition, { radius: 8, color: '#fff', weight: 3, fillColor: '#1f9d5c', fillOpacity: 1 }).bindTooltip('Your location').addTo(group);
    }
  }, [items, selectedId, userPosition, radiusKm, zoom]);

  return <div ref={element} className="accom-map" role="region" aria-label="Map of researched accommodation with approximate locations" />;
}

export function ResearchMapSearch() {
  const compared = useResearchSelection('compare');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [mappedOnly, setMappedOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(records.find(hasCoordinates)?.id ?? null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null);
  const [nearby, setNearby] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const railSelectionLock = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const regions = useMemo(() => [...new Set(records.map(item => item.region))].sort(), []);

  useEffect(() => {
    document.body.classList.toggle('search-drawer-open', drawerOpen);
    if (!drawerOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDrawerOpen(false); return; }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const controls = [...drawerRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('search-drawer-open');
      previousFocus?.focus();
    };
  }, [drawerOpen]);

  const results = useMemo(() => records.filter(item => {
    const needle = query.trim().toLocaleLowerCase();
    if (region && item.region !== region) return false;
    if (mappedOnly && !hasCoordinates(item)) return false;
    if (mapBounds && (!hasCoordinates(item) || !withinBounds(position(item), mapBounds))) return false;
    if (nearby && userPosition && (!hasCoordinates(item) || distanceKm(position(item), userPosition) > radiusKm)) return false;
    return !needle || [item.name, item.provider, item.address, item.locality, item.region].some(value => value.toLocaleLowerCase().includes(needle));
  }).sort((a, b) => Number(hasCoordinates(b)) - Number(hasCoordinates(a))), [query, region, mappedOnly, mapBounds, nearby, userPosition, radiusKm]);
  const mapped = useMemo(() => results.filter(hasCoordinates), [results]);
  const center = useMemo<Coordinates>(() => userPosition && nearby ? userPosition : region && mapped.length ? position(mapped[0]) : johannesburg, [userPosition, nearby, region, mapped]);

  useEffect(() => {
    if (!results.some(item => item.id === selectedId)) setSelectedId(results[0]?.id ?? null);
  }, [results, selectedId]);

  function selectProperty(id: string) {
    setSelectedId(id);
    if (railSelectionLock.current !== null) window.clearTimeout(railSelectionLock.current);
    railSelectionLock.current = window.setTimeout(() => { railSelectionLock.current = null; }, 700);
    document.getElementById(`research-map-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function onRailScroll() {
    if (railSelectionLock.current !== null) return;
    const rail = railRef.current;
    if (!rail) return;
    const centre = rail.scrollLeft + rail.clientWidth / 2;
    const cards = [...rail.querySelectorAll<HTMLElement>('[data-property-id]')];
    const closest = cards.reduce<HTMLElement | null>((best, card) =>
      !best || Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - centre) ? card : best, null);
    if (closest?.dataset.propertyId) setSelectedId(previous => previous === closest.dataset.propertyId ? previous : closest.dataset.propertyId!);
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setLocationMessage('Location is unavailable. Search by name or region instead.'); return; }
    setLocating(true);
    setLocationMessage('Finding your location…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setUserPosition([coords.latitude, coords.longitude]);
      setNearby(true);
      setMapBounds(null); setPendingBounds(null);
      setRegion(''); setMappedOnly(false);
      setLocating(false); setDrawerOpen(false);
      setLocationMessage('Showing researched places with map points near you. Distances are approximate.');
    }, () => { setLocating(false); setLocationMessage('Location unavailable. Search by name or region instead.'); },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  return <div className="fullscreen-search research-map-search" aria-label="Research accommodation map search">
    <ResearchPins items={mapped} selectedId={selectedId} center={center} userPosition={nearby ? userPosition : null} radiusKm={radiusKm} onSelect={selectProperty} onViewChange={setPendingBounds} />
    <div className="fullscreen-map-top">
      <button type="button" className="map-float-button" onClick={useMyLocation} disabled={locating} aria-label="Find researched accommodation near me"><LocateFixed size={20} /></button>
      <span className="map-results-count">{results.length} places · {mapped.length} mapped</span>
      <button type="button" className="map-float-button map-search-trigger" onClick={() => setDrawerOpen(true)} aria-label="Search researched accommodation" aria-expanded={drawerOpen}><SearchIcon size={20} /></button>
    </div>
    {pendingBounds && <button type="button" className="map-area-action" onClick={() => { setMapBounds(pendingBounds); setPendingBounds(null); }}>Search this area</button>}
    {mapBounds && <button type="button" className="map-area-clear" onClick={() => { setMapBounds(null); setPendingBounds(null); }}>Clear map area</button>}
    {locationMessage && <p className="map-location-toast" role="status">{locationMessage}</p>}

    <div className="map-card-rail" ref={railRef} onScroll={onRailScroll} aria-label="Researched accommodation listings" tabIndex={0}>
      {results.length === 0 ? <div className="map-rail-empty"><b>No researched places match.</b><span>Clear the map area or change the search filters.</span></div> : results.map(item => {
        const image = researchImages(item.id)[0];
        const price = researchPriceSummary(item.advertisedPrice);
        const isCompared = compared.ids.includes(item.id);
        const reviews = getPropertyReviews(item.id, item.name, item.locality);
        return <article key={item.id} id={`research-map-${item.id}`} data-property-id={item.id} className={`map-rail-card${selectedId === item.id ? ' is-selected' : ''}`} onClick={() => setSelectedId(item.id)}>
          {/* Top-Right Pure Minimalist + Icon */}
          <button
            type="button"
            className={`rail-card-plus-btn ${isCompared ? 'is-active' : ''}`}
            onClick={event => {
              event.stopPropagation();
              compared.toggle(item.id);
            }}
            disabled={!isCompared && compared.ids.length >= 3}
            title={isCompared ? `Remove ${item.name} from comparison` : compared.ids.length >= 3 ? 'Max 3 places' : `Compare ${item.name}`}
            aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
          >
            {isCompared ? <Check size={17} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2} />}
          </button>

          <div className="research-rail-media">
            <img src={image} onError={event => { event.currentTarget.src = researchFallbackImage; }} alt={item.name} loading="lazy" />
          </div>

          <div className="map-rail-card-body">
            <div className="map-rail-card-title">
              <strong title={item.name}>{item.name}</strong>
              <span className="map-rail-card-price">{price?.label ?? 'Ask for price'}</span>
            </div>
            <div className="map-rail-meta">
              <MapPin size={11} />
              <span>{item.locality.split(',')[0]}</span>
              <span className="map-rail-dot">·</span>
              <span className="map-rail-rating"><Star size={10} fill="currentColor" stroke="none" /> {reviews.ratingFormatted}</span>
            </div>
            <div className="map-rail-footer">
              <Link to={`/research/${item.id}`} className="rail-card-details-link" aria-label={`View details for ${item.name}`}>
                View details <span className="arrow-glyph">→</span>
              </Link>
            </div>
          </div>
        </article>;
      })}
    </div>
    <p className="map-approx-note">{mapped.length} of {results.length} results have map points · Pins may not mark entrances · <Link to="/compare">Compare ({compared.ids.length})</Link> · <Link to="/research">All research →</Link></p>

    {createPortal(<>
      <div className={`map-search-drawer-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside ref={drawerRef} className={`map-search-drawer research-map-drawer${drawerOpen ? ' is-open' : ''}`} role="dialog" aria-modal={drawerOpen} aria-label="Search researched accommodation" aria-hidden={!drawerOpen}>
        <div className="map-drawer-heading"><div><span>FIND YOUR PLACE</span><h2>Search accommodation</h2></div><button type="button" ref={closeRef} onClick={() => setDrawerOpen(false)} aria-label="Close search"><X size={22} /></button></div>
        <div className="map-drawer-fields">
          <label>Name, provider or place<input className="input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try Braamfontein" /></label>
          <label>Region
            <CustomSelect
              value={region}
              onChange={(val) => {
                setRegion(val);
                setNearby(false);
                setMapBounds(null);
                setPendingBounds(null);
              }}
              options={[{ value: '', label: 'All Gauteng regions' }, ...regions.map(item => ({ value: item, label: item }))]}
              ariaLabel="Region"
            />
          </label>
          {nearby && (
            <label>Within
              <CustomSelect
                value={String(radiusKm)}
                onChange={(val) => setRadiusKm(Number(val))}
                options={[1, 3, 5, 10, 20].map(value => ({ value: String(value), label: `${value} km` }))}
                ariaLabel="Within radius"
              />
            </label>
          )}
          <label className="map-drawer-check"><input type="checkbox" checked={mappedOnly} onChange={event => setMappedOnly(event.target.checked)} /> Mapped locations only</label>
          {nearby && <button type="button" className="btn btn--ghost" onClick={() => { setNearby(false); setLocationMessage(''); }}>Turn off Near me</button>}
          <p>All {records.length} Res Data records can appear in the cards. Only {records.filter(hasCoordinates).length} have approximate map coordinates. Prices and availability require confirmation.</p>
          <Link to="/research" onClick={() => setDrawerOpen(false)}>View full research and source details →</Link>
          <Link to="/search/demo" onClick={() => setDrawerOpen(false)}>View original demo listings →</Link>
        </div>
        <div className="map-drawer-actions"><button type="button" className="btn btn--ghost" onClick={() => { setQuery(''); setRegion(''); setMappedOnly(false); setNearby(false); setMapBounds(null); setPendingBounds(null); }}>Reset</button><button type="button" className="btn btn--green" onClick={() => setDrawerOpen(false)}>Show {results.length} places</button></div>
      </aside>
    </>, document.body)}
  </div>;
}
