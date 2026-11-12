import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocateFixed, Search as SearchIcon, X, MapPin, SlidersHorizontal } from 'lucide-react';
import { AccommodationMap } from '../components/AccommodationMap';
import { getProperties } from '../services/propertyService';
import type { Property, FilterState } from '../types';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore } from '../data/matchScore';
import { AREA_CENTRES, PROVINCES, PROVINCE_CENTRES, UNIVERSITIES, distanceKm, propertyPosition, propertyProvince, withinBounds, type Coordinates, type MapBounds } from '../data/mapLocations';

const initialFilters: FilterState = {
  min: 1500, max: 6000, dist: [], verified: false, accredited: false,
  nsfas: false, self: false, facilities: [], types: [], location: '', sort: 'best'
};

export function Search() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [province, setProvince] = useState('Gauteng');
  const [university, setUniversity] = useState('wits');
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState(0);
  const [nearby, setNearby] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => { getProperties().then(setProperties).catch(() => setProperties([])).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!drawerOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDrawerOpen(false); return; }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const controls = [...drawerRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [drawerOpen]);

  const campus = UNIVERSITIES.find((item) => item.id === university);
  const mapCenter = userPosition && nearby ? userPosition : campus?.position || PROVINCE_CENTRES[province] || AREA_CENTRES.Braamfontein;
  const areas = [...new Set(properties.filter((item) => !province || propertyProvince(item) === province).map((item) => item.area))].sort();

  const results = useMemo(() => properties.filter((property) => {
    if (property.price < filters.min || property.price > filters.max) return false;
    if (filters.verified && !property.verified) return false;
    if (filters.nsfas && !property.nsfas) return false;
    if (filters.location && property.area !== filters.location) return false;
    if (province && propertyProvince(property) !== province) return false;
    const location = propertyPosition(property);
    if (mapBounds && (!location || !withinBounds(location.position, mapBounds))) return false;
    if (campus && location && distanceKm(location.position, campus.position) > 12) return false;
    if (nearby && userPosition && (!location || distanceKm(location.position, userPosition) > radiusKm)) return false;
    return true;
  }).sort((a, b) => {
    const aPosition = propertyPosition(a)?.position;
    const bPosition = propertyPosition(b)?.position;
    if (nearby && userPosition) return (aPosition ? distanceKm(aPosition, userPosition) : Infinity) - (bPosition ? distanceKm(bPosition, userPosition) : Infinity);
    if (filters.sort === 'price-asc') return a.price - b.price;
    if (filters.sort === 'price-desc') return b.price - a.price;
    if (filters.sort === 'dist' && campus) return (aPosition ? distanceKm(aPosition, campus.position) : Infinity) - (bPosition ? distanceKm(bPosition, campus.position) : Infinity);
    return calculateMatchScore(b, profile).score - calculateMatchScore(a, profile).score;
  }), [properties, filters, province, campus, nearby, userPosition, radiusKm, mapBounds, profile]);

  function useMyLocation() {
    if (!navigator.geolocation) { setLocationMessage('Location is unavailable. Choose a province or area in Search.'); return; }
    setLocating(true);
    setLocationMessage('Finding your location…');
    navigator.geolocation.getCurrentPosition((position) => {
      setUserPosition([position.coords.latitude, position.coords.longitude]);
      setAccuracyMeters(position.coords.accuracy);
      setNearby(true);
      setProvince(''); setUniversity('');
      setFilters((previous) => ({ ...previous, location: '' }));
      setMapBounds(null); setPendingBounds(null);
      setLocating(false); setDrawerOpen(false);
      setLocationMessage('Showing approximate straight-line distances from your location.');
    }, () => {
      setLocating(false);
      setLocationMessage('Location unavailable. Choose a province, university or area in Search.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  function chooseProvince(value: string) {
    setProvince(value);
    setUniversity(value === 'Gauteng' ? 'wits' : '');
    setFilters((previous) => ({ ...previous, location: '' }));
    setNearby(false); setMapBounds(null); setPendingBounds(null);
  }

  function selectProperty(id: string) {
    setSelectedId(id);
    const card = document.getElementById(`search-property-${id}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function onRailScroll() {
    const rail = railRef.current;
    if (!rail) return;
    const centre = rail.scrollLeft + rail.clientWidth / 2;
    const cards = [...rail.querySelectorAll<HTMLElement>('[data-property-id]')];
    const closest = cards.reduce<HTMLElement | null>((best, card) =>
      !best || Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - centre) ? card : best, null);
    if (closest?.dataset.propertyId) setSelectedId((previous) => previous === closest.dataset.propertyId ? previous : closest.dataset.propertyId!);
  }

  return <div className="fullscreen-search" aria-label="Accommodation map search">
    <AccommodationMap properties={results} center={mapCenter} userPosition={nearby ? userPosition : null} accuracyMeters={accuracyMeters} radiusKm={radiusKm} selectedId={selectedId} visible onViewChange={setPendingBounds} onSelect={selectProperty} />

    <div className="fullscreen-map-top">
      <button type="button" className="map-float-button" onClick={useMyLocation} disabled={locating} aria-label={nearby ? 'Refresh my location' : 'Find accommodation near me'} title={nearby ? 'Refresh my location' : 'Near me'}><LocateFixed size={22} /></button>
      <span className="map-results-count">{loading ? 'Loading places…' : `${results.length} place${results.length === 1 ? '' : 's'}`}{nearby ? ' near you' : ''}</span>
      <button type="button" className="map-float-button map-search-trigger" onClick={() => setDrawerOpen(true)} aria-label="Open search filters" aria-expanded={drawerOpen} title="Search"><SearchIcon size={22} /></button>
    </div>
    {pendingBounds && <button type="button" className="map-area-action" onClick={() => { setMapBounds(pendingBounds); setPendingBounds(null); }}>Search this area</button>}
    {mapBounds && <button type="button" className="map-area-clear" onClick={() => { setMapBounds(null); setPendingBounds(null); }}>Clear map area</button>}
    {locationMessage && <p className="map-location-toast" role="status">{locationMessage}</p>}

    <div className="map-card-rail" ref={railRef} onScroll={onRailScroll} aria-label="Accommodation listings" tabIndex={0}>
      {loading ? <div className="map-rail-empty">Loading accommodation…</div> : results.length === 0 ? <div className="map-rail-empty"><b>No accommodation here yet.</b><span>Try a wider radius or change the search filters.</span></div> : results.map((property) => {
        const point = propertyPosition(property)?.position;
        const fromYou = nearby && userPosition && point ? distanceKm(point, userPosition) : null;
        return <article key={property.id} id={`search-property-${property.id}`} data-property-id={property.id} className={`map-rail-card${selectedId === property.id ? ' is-selected' : ''}`} onClick={() => setSelectedId(property.id)}>
          <img src={property.images[0] || '/images/p1.jpg'} alt="" />
          <div className="map-rail-card-body">
            <div className="map-rail-card-title"><strong>{property.name}</strong><b>R{property.price.toLocaleString('en-ZA')}</b></div>
            <span className="map-rail-meta"><MapPin size={13} /> {property.area} · {fromYou !== null ? `about ${fromYou.toFixed(1)} km from you` : property.type}</span>
            <div className="map-rail-footer"><span>{property.verified ? '✓ Verified' : 'Verification pending'}</span><Link to={`/detail/${property.id}`} aria-label={`View ${property.name}`}>View details →</Link></div>
          </div>
        </article>;
      })}
    </div>
    <p className="map-approx-note">Demo pins show approximate area locations · Straight-line distances</p>

    <div className={`map-search-drawer-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
    <aside ref={drawerRef} className={`map-search-drawer${drawerOpen ? ' is-open' : ''}`} role="dialog" aria-modal={drawerOpen} aria-label="Search accommodation" aria-hidden={!drawerOpen}>
      <div className="map-drawer-heading"><div><span>FIND YOUR PLACE</span><h2>Search accommodation</h2></div><button type="button" ref={closeRef} onClick={() => setDrawerOpen(false)} aria-label="Close search"><X size={22} /></button></div>
      <div className="map-drawer-fields">
        <label>Province<select className="input" value={province} onChange={(event) => chooseProvince(event.target.value)}><option value="">All provinces</option>{PROVINCES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>University<select className="input" value={university} onChange={(event) => { setUniversity(event.target.value); setNearby(false); setMapBounds(null); setPendingBounds(null); }}><option value="">Any university</option>{UNIVERSITIES.filter((item) => !province || item.province === province).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Area<select className="input" value={filters.location} onChange={(event) => setFilters((previous) => ({ ...previous, location: event.target.value }))}><option value="">All areas</option>{areas.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Max rent <b>R{filters.max.toLocaleString('en-ZA')}</b><input type="range" min="1500" max="6000" step="100" value={filters.max} onChange={(event) => setFilters((previous) => ({ ...previous, max: Number(event.target.value) }))} /></label>
        {nearby && <label>Within<select className="input" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>{[1, 3, 5, 10, 20].map((item) => <option key={item} value={item}>{item} km</option>)}</select></label>}
        <label className="map-drawer-check"><input type="checkbox" checked={filters.verified} onChange={(event) => setFilters((previous) => ({ ...previous, verified: event.target.checked }))} /> Verified only</label>
        <label className="map-drawer-check"><input type="checkbox" checked={filters.nsfas} onChange={(event) => setFilters((previous) => ({ ...previous, nsfas: event.target.checked }))} /> NSFAS compatible</label>
        <label>Sort by<select className="input" value={filters.sort} onChange={(event) => setFilters((previous) => ({ ...previous, sort: event.target.value as FilterState['sort'] }))}><option value="best">Best match</option><option value="price-asc">Lowest price</option><option value="price-desc">Highest price</option><option value="dist">Closest to university</option></select></label>
        {nearby && <button type="button" className="btn btn--ghost" onClick={() => { setNearby(false); setLocationMessage(''); }}>Turn off Near me</button>}
        <p>Demo pins use approximate area centres until listing coordinates are verified.</p>
      </div>
      <div className="map-drawer-actions"><button type="button" className="btn btn--ghost" onClick={() => { setFilters(initialFilters); setProvince('Gauteng'); setUniversity('wits'); setNearby(false); setMapBounds(null); setPendingBounds(null); }}>Reset</button><button type="button" className="btn btn--green" onClick={() => setDrawerOpen(false)}><SlidersHorizontal size={16} /> Show {results.length} places</button></div>
    </aside>
  </div>;
}
