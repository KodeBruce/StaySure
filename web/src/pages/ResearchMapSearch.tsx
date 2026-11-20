import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Banknote,
  BookOpen,
  Bus,
  Check,
  GraduationCap,
  LocateFixed,
  MapPin,
  Plus,
  Search as SearchIcon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Wifi,
  Armchair,
  WashingMachine,
  BedDouble,
  Heart,
  X
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { PropertySocialLinks } from '../components/PropertySocialLinks';
import records from '../data/researchProperties.json';
import { parseOfferings } from '../data/researchOfferings';
import { researchFallbackImage, researchImages } from '../data/researchMedia';
import { extractMinPrice, researchPriceSummary } from '../data/researchPricing';
import { useResearchSelection } from '../data/researchSelection';
import { getRoomRates } from '../data/roomRates';
import { matchResearchProperty, readSearchCriteria, saveSearchCriteria, type ResearchMatch, type SearchCriteria } from '../data/researchMatch';
import { matchesSelectedRoomTypes, parseRoomTypes, ROOM_TYPE_OPTIONS, type RoomTypeFilter } from '../data/roomTypeFilter';
import { getPropertyReviews } from '../data/propertyReviews';
import { readLocalReviewComments, saveLocalReviewComments, type LocalReviewComment } from '../data/localReviewComments';
import { AREA_CENTRES, distanceKm, withinBounds, UNIVERSITIES, isNearUniversity, getPropertyUniversities, type Coordinates, type MapBounds } from '../data/mapLocations';
import './airbnb-home.css';
import '../components/StudentReviews.css';
import './research-map-search.css';

const MAP_PREFERENCES = [
  { id: 'nsfas', label: 'NSFAS Approved', icon: GraduationCap },
  { id: 'shuttle', label: 'Free Shuttle', icon: Bus },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'security', label: '24/7 Security', icon: ShieldCheck },
  { id: 'study', label: 'Study Desks', icon: BookOpen },
  { id: 'furniture', label: 'Furnished', icon: Armchair },
  { id: 'laundry', label: 'Laundry', icon: WashingMachine },
];

type ResearchProperty = (typeof records)[number];
const johannesburg: Coordinates = [-26.19, 28.04];

function hasCoordinates(item: ResearchProperty): boolean {
  return typeof item.latitude === 'number' && typeof item.longitude === 'number';
}

function position(item: ResearchProperty): Coordinates {
  return [item.latitude!, item.longitude!];
}

export function MapPropertySheet({ item, match, onExited, saved, compared, image }: {
  item: ResearchProperty;
  match: ResearchMatch;
  onExited: () => void;
  saved: ReturnType<typeof useResearchSelection>;
  compared: ReturnType<typeof useResearchSelection>;
  image?: string;
}) {
  const [closing, setClosing] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [localComments, setLocalComments] = useState<LocalReviewComment[]>(() => readLocalReviewComments(item.id));
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const closingRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const price = researchPriceSummary(item.advertisedPrice);
  const rates = getRoomRates(item.id);
  const offerings = parseOfferings(item);
  const reviews = getPropertyReviews(item.id, item.name, item.locality);
  const isSaved = saved.ids.includes(item.id);
  const isCompared = compared.ids.includes(item.id);

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const author = commentName.trim();
    const text = commentText.trim();
    if (author.length < 2 || text.length < 10) {
      setCommentMessage('Enter your name and a comment of at least 10 characters.');
      return;
    }
    const comment: LocalReviewComment = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now()),
      author: author.slice(0, 40),
      rating: commentRating,
      text: text.slice(0, 1000),
      date: new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(new Date()),
    };
    const next = [comment, ...localComments];
    if (!saveLocalReviewComments(item.id, next)) {
      setCommentMessage('Your browser could not save the comment. Please try again.');
      return;
    }
    setLocalComments(next);
    setCommentText('');
    setCommentFormOpen(false);
    setCommentMessage('Your comment was saved on this device.');
  };

  const removeComment = (commentId: string) => {
    const next = localComments.filter(comment => comment.id !== commentId);
    if (!saveLocalReviewComments(item.id, next)) {
      setCommentMessage('Your browser could not remove the comment. Please try again.');
      return;
    }
    setLocalComments(next);
    setCommentMessage('Comment removed from this device.');
  };

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = window.setTimeout(onExited, 240);
  };

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const controls = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return createPortal(<div className={`map-detail-layer ${closing ? 'is-closing' : ''}`}>
    <div className="map-detail-backdrop" onClick={dismiss} />
    <section ref={panelRef} className="map-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="map-detail-title">
      <div className="map-detail-handle" aria-hidden="true" />
      <div className="map-detail-topline">
        <span>Property preview</span>
        <div className="map-detail-actions">
          <button type="button" onClick={() => saved.toggle(item.id)} aria-pressed={isSaved}><Heart size={16} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save'}</button>
          <button type="button" onClick={() => compared.toggle(item.id)} disabled={!isCompared && compared.ids.length >= 3} aria-pressed={isCompared}><Plus size={16} /> {isCompared ? 'Comparing' : 'Compare'}</button>
          <Link to={`/apply/${item.id}`} className="map-detail-apply">Apply now →</Link>
        </div>
        <button ref={closeRef} type="button" className="map-detail-close" onClick={dismiss} aria-label="Close property preview"><X size={19} /></button>
      </div>
      <div className="map-detail-content">
        <div className="map-detail-media">
          <img src={image || researchImages(item.id)[0]} onError={event => { event.currentTarget.src = researchFallbackImage; }} alt={`Illustrative accommodation image for ${item.name}`} />
          <span>Illustrative image</span>
        </div>
        <div className="map-detail-info">
          <div className="map-detail-heading">
            <div>
              <span className="map-detail-provider">{item.provider || 'Student accommodation'}</span>
              <h2 id="map-detail-title">{item.name}</h2>
              <p><MapPin size={14} /> {item.locality.split(',')[0]} <span>·</span> <Star size={13} fill="currentColor" /> {reviews.ratingFormatted} example rating</p>
            </div>
            <strong className="map-detail-price">{price?.label ?? 'Ask for rates'}<small>{price ? 'Advertised monthly range' : 'Rent not published'}</small></strong>
          </div>

          {match.score !== null && <div className="map-detail-match">
            <div><strong>✦ {match.score}% preference fit</strong><span>{match.matched} of {match.total} selected criteria supported{match.unknown ? ` · ${match.unknown} need confirmation` : ''}</span></div>
            <ul>{match.reasons.map((reason, index) => <li key={`${reason.text}-${index}`} className={`is-${reason.status}`}><span aria-hidden="true">{reason.status === 'match' ? '✓' : reason.status === 'miss' ? '×' : '?'}</span>{reason.text}</li>)}</ul>
          </div>}

          <div className="map-detail-section">
            <h3>Room prices</h3>
            {rates.length ? <div className="map-detail-rates">{rates.map(rate => <div key={`${rate.category}-${rate.name}`} className="map-detail-rate">
              <span>{rate.name}<small>{rate.basis}{rate.period ? ` · ${rate.period}` : ''}{rate.note ? ` · ${rate.note}` : ''}</small></span>
              <strong>{rate.monthly}<small>{rate.period ? '' : '/mo'}</small></strong>
            </div>)}</div> : <p>Room-specific rates are not published. Ask the provider for the current price of your preferred room.</p>}
          </div>

          <section className="map-detail-section student-reviews-card map-detail-reviews" aria-labelledby="map-detail-reviews-title">
            <div className="student-reviews-header"><h3 id="map-detail-reviews-title" className="student-reviews-title">Student reviews</h3></div>
            <div className="student-reviews-summary">
              <div className="student-reviews-score-col">
                <span className="student-reviews-big-score">{reviews.ratingFormatted}</span>
                <span className="student-reviews-star-row"><Star size={15} fill="currentColor" /> {reviews.ratingFormatted}</span>
                <span className="student-reviews-count-text">Example rating</span>
              </div>
              <div className="student-reviews-bars-col">{reviews.distribution.map(bar => <div className="student-reviews-bar-row" key={bar.stars}>
                <span className="student-reviews-bar-label">{bar.stars}★</span>
                <span className="student-reviews-track"><span className="student-reviews-fill" style={{ display: 'block', width: `${bar.percent}%` }} /></span>
              </div>)}</div>
            </div>
            <p className="map-detail-reviews-note">The rating and example comments below are illustrative; they are not verified student reviews for this property.</p>
            {localComments.length > 0 && <div className="map-detail-local-comments">
              <h4>Comments saved on this device</h4>
              <div className="student-reviews-list">{localComments.map(comment => <article className="student-review-item" key={comment.id}>
                <div className="student-review-head"><span className="student-review-avatar">{comment.author.slice(0, 2).toUpperCase()}</span><span className="student-review-author-info"><strong className="student-review-author-name">{comment.author}</strong><span className="student-review-date">{comment.date}</span></span><span className="student-review-rating"><Star size={14} fill="currentColor" /> {comment.rating}</span></div>
                <p className="student-review-text">{comment.text}</p>
                <button type="button" className="map-detail-remove-comment" onClick={() => removeComment(comment.id)} aria-label={`Remove comment by ${comment.author}`}>Remove</button>
              </article>)}</div>
            </div>}
            <div className="student-reviews-list">{reviews.reviews.slice(0, showAllReviews ? undefined : 2).map((review, index) => <article className="student-review-item" key={`${review.author}-${index}`}>
              <div className="student-review-head"><span className="student-review-avatar">{review.author.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="student-review-author-info"><strong className="student-review-author-name">{review.author}</strong><span className="student-review-date">{review.date} · Example</span></span><span className="student-review-rating"><Star size={14} fill="currentColor" /> {review.rating}</span></div>
              <p className="student-review-text">{review.text}</p>
            </article>)}</div>
            {reviews.reviews.length > 2 && <button type="button" className="student-reviews-toggle-btn" onClick={() => setShowAllReviews(value => !value)} aria-expanded={showAllReviews}>{showAllReviews ? 'Show fewer examples ↑' : `Read all ${reviews.reviews.length} examples ↓`}</button>}
            <div className="map-detail-comment-action">
              <button type="button" onClick={() => { setCommentFormOpen(value => !value); setCommentMessage(''); }} aria-expanded={commentFormOpen}>{commentFormOpen ? 'Cancel' : 'Write a comment'}</button>
              <span>Comments are saved on this device only.</span>
            </div>
            {commentFormOpen && <form className="map-detail-comment-form" onSubmit={submitComment}>
              <label>Your name<input value={commentName} onChange={event => setCommentName(event.target.value)} minLength={2} maxLength={40} required placeholder="Name or initials" /></label>
              <label>Rating<select value={commentRating} onChange={event => setCommentRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}</select></label>
              <label className="map-detail-comment-text">Your comment<textarea value={commentText} onChange={event => setCommentText(event.target.value)} minLength={10} maxLength={1000} required rows={4} placeholder="What should other students know?" /></label>
              <button type="submit">Post comment on this device</button>
            </form>}
            {commentMessage && <p className="map-detail-comment-message" role="status">{commentMessage}</p>}
          </section>

          <div className="map-detail-section">
            <h3>At a glance</h3>
            <div className="map-detail-chips">{offerings.roomTypes.map(type => <span key={type}>{type}</span>)}{offerings.keyOfferings.filter(offering => offering.available).slice(0, 4).map(offering => <span key={offering.id}>{offering.name}</span>)}</div>
            <p>{item.rooms || 'Ask the provider for room configuration and availability.'}</p>
          </div>

          <div className="map-detail-source">
            <strong>Check before you apply</strong>
            <p>{item.advertisedPrice}</p>
            {item.pricePeriod && <small>{item.pricePeriod}</small>}
          </div>

        </div>
      </div>
    </section>
  </div>, document.body);
}

function ResearchPins({ items, selectedId, center, targetZoom = 12, userPosition, radiusKm, onSelect, onViewChange }: {
  items: ResearchProperty[];
  selectedId: string | null;
  center: Coordinates;
  targetZoom?: number;
  userPosition: Coordinates | null;
  radiusKm: number;
  onSelect: (id: string) => void;
  onViewChange: (bounds: MapBounds) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const pinMarkers = useRef<{ marker: L.Marker; ids: string[] }[]>([]);
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

  useEffect(() => {
    if (!map.current) return;
    if (items.length > 1 && items.length <= 6) {
      const bounds = L.latLngBounds(items.map(position));
      map.current.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
    } else if (items.length === 1) {
      map.current.setView(position(items[0]), 15);
    } else {
      map.current.setView(center, targetZoom);
    }
  }, [center[0], center[1], targetZoom, items]);

  useEffect(() => {
    const selected = items.find(item => item.id === selectedId);
    if (selected && hasCoordinates(selected)) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const targetZoom = Math.max(map.current?.getZoom() || 12, 15);
      map.current?.flyTo(position(selected), targetZoom, {
        animate: !reduceMotion,
        duration: 0.45
      });
    }
  }, [selectedId, items]);

  useEffect(() => {
    const group = markers.current;
    const instance = map.current;
    if (!group || !instance) return;
    group.clearLayers();
    pinMarkers.current = [];

    for (const item of items) {
      const price = researchPriceSummary(item.advertisedPrice)?.pinLabel ?? 'Rate details';
      const isSelected = selectedId === item.id;
      const icon = L.divIcon({
        className: 'accom-map-pin-shell',
        html: `<span class="accom-map-pin${isSelected ? ' is-selected' : ''}"><span aria-hidden="true">⌂</span> ${price}</span>`,
        iconSize: [112, 38],
        iconAnchor: [56, 19]
      });
      const marker = L.marker(position(item), {
        icon,
        title: `${item.name}: ${price}`,
        zIndexOffset: isSelected ? 1000 : 0
      });
      const popup = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.name;
      const note = document.createElement('small');
      note.textContent = `${item.locality} · ${item.coordinatePrecision || item.coordinateStatus}. Entrance not confirmed.`;
      popup.append(name, document.createElement('br'), note);
      marker.bindPopup(popup);
      marker.on('click', () => selectRef.current(item.id));
      group.addLayer(marker);
      pinMarkers.current.push({ marker, ids: [item.id] });
    }

    if (userPosition) {
      L.circle(userPosition, { radius: radiusKm * 1000, color: '#1f9d5c', fillColor: '#1f9d5c', fillOpacity: 0.08, weight: 2 }).addTo(group);
      L.circleMarker(userPosition, { radius: 8, color: '#fff', weight: 3, fillColor: '#1f9d5c', fillOpacity: 1 }).bindTooltip('Your location').addTo(group);
    }
  }, [items, userPosition, radiusKm]);

  useEffect(() => {
    for (const { marker, ids } of pinMarkers.current) {
      const isSelected = selectedId !== null && ids.includes(selectedId);
      marker.getElement()?.querySelector('.accom-map-pin')?.classList.toggle('is-selected', isSelected);
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }
  }, [selectedId]);

  return <div ref={element} className="accom-map" role="region" aria-label="Map of researched accommodation with approximate locations" />;
}

export function ResearchMapSearch() {
  const compared = useResearchSelection('compare');
  const saved = useResearchSelection('saved');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUniversity, setSelectedUniversity] = useState(() => readSearchCriteria().universityId);
  const [area, setArea] = useState(() => readSearchCriteria().area);
  const [region, setRegion] = useState(() => readSearchCriteria().region);
  const [maxRent, setMaxRent] = useState(() => readSearchCriteria().maxRent ?? 12000);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(() => readSearchCriteria().preferences);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<RoomTypeFilter[]>(() => searchParams.has('rooms') ? parseRoomTypes(searchParams.get('rooms')) : readSearchCriteria().roomTypes);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(records.find(hasCoordinates)?.id ?? null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null);
  const [nearby, setNearby] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const railSelectionLock = useRef<number | null>(null);
  const railScrollTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (railSelectionLock.current !== null) window.clearTimeout(railSelectionLock.current);
    if (railScrollTimer.current !== null) window.clearTimeout(railScrollTimer.current);
  }, []);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const regions = useMemo(() => [...new Set(records.map(item => item.region))].sort(), []);
  const allAreas = useMemo(() => [...new Set(records.map(item => item.locality.split(',')[0].trim()))].sort(), []);

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

  const togglePref = (id: string) => {
    setSelectedPrefs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const updateRoomTypes = (next: RoomTypeFilter[]) => {
    setSelectedRoomTypes(next);
    const params = new URLSearchParams(searchParams);
    if (next.length) params.set('rooms', next.join(','));
    else params.delete('rooms');
    setSearchParams(params, { replace: true });
  };

  const toggleRoomType = (id: RoomTypeFilter) => {
    updateRoomTypes(selectedRoomTypes.includes(id) ? selectedRoomTypes.filter(type => type !== id) : [...selectedRoomTypes, id]);
  };

  const criteria = useMemo<SearchCriteria>(() => ({
    universityId: selectedUniversity, area, region, maxRent: maxRent < 12000 ? maxRent : null,
    roomTypes: selectedRoomTypes, preferences: selectedPrefs
  }), [selectedUniversity, area, region, maxRent, selectedRoomTypes, selectedPrefs]);
  useEffect(() => saveSearchCriteria(criteria), [criteria]);

  const results = useMemo(() => {
    const filtered = records.filter(item => {
      if (!matchesSelectedRoomTypes(item, selectedRoomTypes)) return false;
      if (selectedUniversity && selectedUniversity !== 'all') {
        if (!isNearUniversity(item, selectedUniversity)) return false;
      }
      if (area && !item.locality.toLocaleLowerCase().includes(area.toLocaleLowerCase())) return false;
      if (region && item.region !== region) return false;
      if (mapBounds && (!hasCoordinates(item) || !withinBounds(position(item), mapBounds))) return false;
      if (nearby && userPosition && (!hasCoordinates(item) || distanceKm(position(item), userPosition) > radiusKm)) return false;
      if (maxRent < 12000) {
        const minP = extractMinPrice(item.advertisedPrice);
        if (minP !== null && minP > maxRent) {
          return false;
        }
      }
      if (selectedPrefs.length > 0) {
        const offerings = parseOfferings(item);
        for (const pref of selectedPrefs) {
          switch (pref) {
            case 'nsfas':
              if (!offerings.isNsfasClaimed) return false;
              break;
            case 'shuttle':
              if (!offerings.hasTransport) return false;
              break;
            case 'wifi':
              if (!offerings.hasWifi) return false;
              break;
            case 'security':
              if (!offerings.hasSecurity && !offerings.hasBiometrics) return false;
              break;
            case 'study':
              if (!offerings.hasStudyArea) return false;
              break;
            case 'furniture':
              if (!offerings.hasFurniture) return false;
              break;
            case 'laundry':
              if (!offerings.hasLaundry) return false;
              break;
          }
        }
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (matchResearchProperty(a, criteria).score !== null) {
        const scoreDifference = (matchResearchProperty(b, criteria).score ?? 0) - (matchResearchProperty(a, criteria).score ?? 0);
        if (scoreDifference) return scoreDifference;
      }
      return Number(hasCoordinates(b)) - Number(hasCoordinates(a));
    });
  }, [selectedUniversity, area, region, maxRent, selectedPrefs, selectedRoomTypes, mapBounds, nearby, userPosition, radiusKm, criteria]);

  const mapped = useMemo(() => results.filter(hasCoordinates), [results]);
  const center = useMemo<Coordinates>(() => {
    if (userPosition && nearby) return userPosition;
    if (selectedUniversity && selectedUniversity !== 'all') {
      const uni = UNIVERSITIES.find(u => u.id === selectedUniversity);
      if (uni) return uni.position;
    }
    if (area && AREA_CENTRES[area]) return AREA_CENTRES[area];
    if (mapped.length) return position(mapped[0]);
    if (region && records.find(r => r.region === region && hasCoordinates(r))) {
      return position(records.find(r => r.region === region && hasCoordinates(r))!);
    }
    return johannesburg;
  }, [userPosition, nearby, selectedUniversity, area, mapped, region]);

  const targetZoom = useMemo(() => {
    if (selectedUniversity && selectedUniversity !== 'all') return 13;
    if (nearby) return 13;
    if (area) return 14;
    if (region) return 12;
    return 13;
  }, [selectedUniversity, nearby, area, region]);

  useEffect(() => {
    if (!results.some(item => item.id === selectedId)) setSelectedId(results[0]?.id ?? null);
  }, [results, selectedId]);

  function selectProperty(id: string) {
    if (railScrollTimer.current !== null) window.clearTimeout(railScrollTimer.current);
    railScrollTimer.current = null;
    setSelectedId(id);
    if (railSelectionLock.current !== null) window.clearTimeout(railSelectionLock.current);
    railSelectionLock.current = window.setTimeout(() => { railSelectionLock.current = null; }, 700);
    document.getElementById(`research-map-${id}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest', inline: 'center'
    });
  }

  function openDetail(id: string) {
    setSelectedId(id);
    setDetailId(id);
  }

  function onRailScroll() {
    if (railSelectionLock.current !== null) return;
    if (railScrollTimer.current !== null) window.clearTimeout(railScrollTimer.current);
    railScrollTimer.current = window.setTimeout(() => {
      railScrollTimer.current = null;
      const rail = railRef.current;
      if (!rail) return;
      const centre = rail.scrollLeft + rail.clientWidth / 2;
      const cards = [...rail.querySelectorAll<HTMLElement>('[data-property-id]')];
      const closest = cards.reduce<HTMLElement | null>((best, card) =>
        !best || Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - centre) ? card : best, null);
      if (closest?.dataset.propertyId) setSelectedId(previous => previous === closest.dataset.propertyId ? previous : closest.dataset.propertyId!);
    }, 100);
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setLocationMessage('Location is unavailable. Search by name or region instead.'); return; }
    setLocating(true);
    setLocationMessage('Finding your location…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setUserPosition([coords.latitude, coords.longitude]);
      setNearby(true);
      setMapBounds(null); setPendingBounds(null);
      setRegion(''); setArea('');
      setLocating(false); setDrawerOpen(false);
      setLocationMessage('Showing researched places with map points near you. Distances are approximate.');
    }, () => { setLocating(false); setLocationMessage('Location unavailable. Search by name or region instead.'); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  const activeUni = selectedUniversity !== 'all' ? UNIVERSITIES.find(u => u.id === selectedUniversity) : null;
  const activeLocationLabel = activeUni ? `Near ${activeUni.shortName}` : area || region.replace(/\s*\(.*/, '') || 'All locations';
  const activePriceLabel = maxRent < 12000 ? `≤ R${maxRent.toLocaleString('en-ZA')}` : 'Any budget';
  const activePrefsLabel = selectedPrefs.length > 0 ? `${selectedPrefs.length} pref${selectedPrefs.length > 1 ? 's' : ''}` : '';
  const activeRoomLabel = selectedRoomTypes.length === 1 ? ROOM_TYPE_OPTIONS.find(option => option.id === selectedRoomTypes[0])?.label : selectedRoomTypes.length > 1 ? `${selectedRoomTypes.length} room types` : '';

  return <div className="fullscreen-search research-map-search" aria-label="Research accommodation map search">
    <ResearchPins items={mapped} selectedId={selectedId} center={center} targetZoom={targetZoom} userPosition={nearby ? userPosition : null} radiusKm={radiusKm} onSelect={selectProperty} onViewChange={setPendingBounds} />
    <div className="fullscreen-map-top">
      <button type="button" className="map-float-button" onClick={useMyLocation} disabled={locating} aria-label="Find researched accommodation near me"><LocateFixed size={20} /></button>

      <div className="map-top-filter-bar">
        <button
          type="button"
          className="map-top-search-pill"
          onClick={() => setDrawerOpen(true)}
          aria-label="Filter accommodation by location, price, room type, and living preferences"
        >
          <SearchIcon size={15} />
          <span className="map-top-pill-label">
            {activeLocationLabel} · {activePriceLabel}{activeRoomLabel ? ` · ${activeRoomLabel}` : ''}{activePrefsLabel ? ` · ${activePrefsLabel}` : ''}
          </span>
          <span className="map-top-pill-count">{results.length}</span>
        </button>

        {/* Quick University filter chips */}
        <div className="map-top-uni-bar" role="group" aria-label="Filter by university">
          <button
            type="button"
            className={`map-top-uni-chip ${selectedUniversity === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedUniversity('all')}
          >
            <GraduationCap size={12} strokeWidth={2.4} />
            <span>All</span>
          </button>
          {UNIVERSITIES.map(u => (
            <button
              key={u.id}
              type="button"
              className={`map-top-uni-chip ${selectedUniversity === u.id ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedUniversity(prev => prev === u.id ? 'all' : u.id);
                setNearby(false);
                setMapBounds(null);
                setPendingBounds(null);
              }}
              title={u.fullName}
            >
              <GraduationCap size={12} strokeWidth={2.4} />
              <span>{u.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="map-float-button map-search-trigger" onClick={() => setDrawerOpen(true)} aria-label="Search and filter options" aria-expanded={drawerOpen}>
        <SlidersHorizontal size={19} />
      </button>
    </div>
    {pendingBounds && <button type="button" className="map-area-action" onClick={() => { setMapBounds(pendingBounds); setPendingBounds(null); }}>Search this area</button>}
    {mapBounds && <button type="button" className="map-area-clear" onClick={() => { setMapBounds(null); setPendingBounds(null); }}>Clear map area</button>}
    {locationMessage && <p className="map-location-toast" role="status">{locationMessage}</p>}

    <div className={`map-card-rail${detailId ? ' is-hidden' : ''}`} ref={railRef} onScroll={onRailScroll} aria-label="Researched accommodation listings" tabIndex={0}>
      {results.length === 0 ? <div className="map-rail-empty"><b>No researched places match.</b><span>Clear the map area or change the search filters.</span></div> : results.map(item => {
        const image = researchImages(item.id)[0];
        const price = researchPriceSummary(item.advertisedPrice);
        const offerings = parseOfferings(item);
        const reviews = getPropertyReviews(item.id, item.name, item.locality);
        const nearUnis = getPropertyUniversities(item);
        const isCompared = compared.ids.includes(item.id);
        const isSaved = saved.ids.includes(item.id);
        const match = matchResearchProperty(item, criteria);
        const isSelected = selectedId === item.id;

        return (
          <article
            key={item.id}
            data-property-id={item.id}
            className={`map-rail-card airbnb-card${isSelected ? ' is-selected' : ''}`}
          >
            <button id={`research-map-${item.id}`} type="button" className="property-card-open" aria-label={`Preview ${item.name}`} onClick={() => openDetail(item.id)} />
            <div className="airbnb-card-media">
              <img
                src={image}
                onError={event => { event.currentTarget.src = researchFallbackImage; }}
                alt={item.name}
                loading="lazy"
              />
              {match.score !== null && (
                <span className="airbnb-card-match" title={`${match.matched} of ${match.total} selected criteria supported`}>
                  ✦ {match.score}% fit
                </span>
              )}
              <button
                type="button"
                className={`airbnb-card-plus ${isCompared ? 'is-active' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  compared.toggle(item.id);
                }}
                disabled={!isCompared && compared.ids.length >= 3}
                title={isCompared ? `Remove ${item.name} from comparison` : compared.ids.length >= 3 ? 'Max 3 places' : `Compare ${item.name}`}
                aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
              >
                {isCompared ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.2} />}
              </button>
              <button
                type="button"
                className={`airbnb-card-heart ${isSaved ? 'is-saved' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  saved.toggle(item.id);
                }}
                title={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
                aria-label={isSaved ? `Unsave ${item.name}` : `Save ${item.name}`}
              >
                <Heart size={18} fill={isSaved ? '#ef4444' : 'none'} strokeWidth={2} />
              </button>
            </div>

            <div className="airbnb-card-body">
              <div className="airbnb-card-header">
                <div className="airbnb-card-name" title={item.name}>{item.name}</div>
                <div className="airbnb-card-rating">
                  <Star size={12} fill="currentColor" stroke="none" />
                  <span>{reviews.ratingFormatted}</span>
                </div>
              </div>

              <div className="airbnb-card-sub">
                <MapPin size={11} />
                <span>{offerings.localityShort} · {offerings.campusDistance}</span>
              </div>

              <div className="airbnb-card-tags">
                {nearUnis.length > 0 && (
                  <span
                    className="airbnb-card-tag airbnb-card-tag--uni"
                    title={`Near ${nearUnis.map(u => u.fullName).join(', ')}`}
                  >
                    <GraduationCap size={10} strokeWidth={2.4} /> Near {nearUnis.map(u => u.shortName).join(' & ')}
                  </span>
                )}
                {offerings.roomTypes.slice(0, 2).map(r => (
                  <span key={r} className="airbnb-card-tag">{r}</span>
                ))}
                {offerings.isNsfasClaimed && (
                  <span className="airbnb-card-tag" style={{ background: '#ecfdf5', color: '#047857' }}>NSFAS</span>
                )}
              </div>

              <div className="airbnb-card-price-row">
                <span className="airbnb-card-price">{price?.label ?? 'Ask for rates'}</span>
                <span className="airbnb-card-period">/ month</span>
              </div>
              <PropertySocialLinks item={item} />
            </div>
          </article>
        );
      })}
    </div>

    {detailId && (() => {
      const detailItem = records.find(item => item.id === detailId);
      return detailItem ? <MapPropertySheet key={detailId} item={detailItem} match={matchResearchProperty(detailItem, criteria)} saved={saved} compared={compared} onExited={() => {
        setDetailId(null);
        window.requestAnimationFrame(() => document.getElementById(`research-map-${detailId}`)?.focus({ preventScroll: true }));
      }} /> : null;
    })()}

    {createPortal(<>
      <div className={`map-search-drawer-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside ref={drawerRef} className={`map-search-drawer research-map-drawer${drawerOpen ? ' is-open' : ''}`} role="dialog" aria-modal={drawerOpen} aria-label="Search researched accommodation" aria-hidden={!drawerOpen}>
        <div className="map-drawer-heading"><div><span>FIND YOUR PLACE</span><h2>Search accommodation</h2></div><button type="button" ref={closeRef} onClick={() => setDrawerOpen(false)} aria-label="Close search"><X size={22} /></button></div>
        <div className="map-drawer-fields">
          {/* Location Preference */}
          <div className="map-drawer-section-title">
            <MapPin size={14} />
            <span>Location Preference</span>
          </div>

          <label>Nearby University
            <CustomSelect
              value={selectedUniversity}
              onChange={(val) => {
                setSelectedUniversity(val);
                setNearby(false);
                setMapBounds(null);
                setPendingBounds(null);
              }}
              options={[
                { value: 'all', label: 'All Universities' },
                ...UNIVERSITIES.map(u => ({ value: u.id, label: u.fullName }))
              ]}
              ariaLabel="Nearby University"
            />
          </label>

          <label>Region or area
            <CustomSelect
              value={area ? `area:${area}` : region ? `region:${region}` : ''}
              onChange={(val) => {
                setArea(val.startsWith('area:') ? val.slice(5) : '');
                setRegion(val.startsWith('region:') ? val.slice(7) : '');
                setNearby(false);
                setMapBounds(null);
                setPendingBounds(null);
              }}
              options={[{ value: '', label: 'All regions and areas' }, ...regions.map(item => ({ value: `region:${item}`, label: `Region · ${item.replace(/\s*\(.*/, '')}` })), ...allAreas.map(item => ({ value: `area:${item}`, label: `Area · ${item}` }))]}
              ariaLabel="Region or area"
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

          {/* Price Preference */}
          <div className="map-drawer-section-title" style={{ marginTop: '8px' }}>
            <Banknote size={14} />
            <span>Price Preference</span>
          </div>

          <label>Max rent budget: <b>{maxRent >= 12000 ? 'Any budget' : `R${maxRent.toLocaleString('en-ZA')} / mo`}</b>
            <input
              type="range"
              min="2500"
              max="12000"
              step="250"
              value={maxRent}
              onChange={event => setMaxRent(Number(event.target.value))}
            />
          </label>

          <div className="map-drawer-pills">
            <button
              type="button"
              className={`map-drawer-pill ${maxRent >= 12000 ? 'is-active' : ''}`}
              onClick={() => setMaxRent(12000)}
            >
              Any
            </button>
            <button
              type="button"
              className={`map-drawer-pill ${maxRent === 5000 ? 'is-active' : ''}`}
              onClick={() => setMaxRent(5000)}
            >
              &lt; R5k
            </button>
            <button
              type="button"
              className={`map-drawer-pill ${maxRent === 6500 ? 'is-active' : ''}`}
              onClick={() => setMaxRent(6500)}
            >
              &lt; R6.5k
            </button>
            <button
              type="button"
              className={`map-drawer-pill ${maxRent === 8000 ? 'is-active' : ''}`}
              onClick={() => setMaxRent(8000)}
            >
              &lt; R8k
            </button>
          </div>

          <div className="map-drawer-section-title" style={{ marginTop: '12px' }}>
            <BedDouble size={14} />
            <span>Room Type</span>
          </div>
          <p className="map-room-type-hint">Choose one or more. A place appears if it offers any selected type.</p>
          <div className="map-room-type-options" role="group" aria-label="Filter by room type">
            {ROOM_TYPE_OPTIONS.map(option => {
              const Icon = option.id === 'sharing' ? Users : BedDouble;
              const selected = selectedRoomTypes.includes(option.id);
              return (
                <button key={option.id} type="button" className={`map-room-type-option ${selected ? 'is-active' : ''}`} onClick={() => toggleRoomType(option.id)} aria-pressed={selected}>
                  <Icon size={18} />
                  <span>
                    <b>{option.label}</b>
                    <small>{option.description}</small>
                  </span>
                  {selected && <Check size={15} className="check-icon" />}
                </button>
              );
            })}
          </div>
          {selectedRoomTypes.length > 0 && <button type="button" className="map-room-type-clear" onClick={() => updateRoomTypes([])}>Any room type</button>}

          {/* Living Preferences (Multi-Select) */}
          <div className="map-drawer-section-title" style={{ marginTop: '12px' }}>
            <Sparkles size={14} />
            <span>Living Preferences</span>
          </div>

          <div className="map-pref-grid">
            {MAP_PREFERENCES.map(p => {
              const Icon = p.icon;
              const isSelected = selectedPrefs.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`map-pref-pill ${isSelected ? 'is-active' : ''}`}
                  onClick={() => togglePref(p.id)}
                >
                  <Icon size={14} />
                  <span>{p.label}</span>
                  {isSelected && <Check size={12} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>

          {nearby && <button type="button" className="btn btn--ghost" onClick={() => { setNearby(false); setLocationMessage(''); }}>Turn off Near me</button>}
        </div>
        <div className="map-drawer-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setSelectedUniversity('all');
              setArea('');
              setRegion('');
              setMaxRent(12000);
              setSelectedPrefs([]);
              updateRoomTypes([]);
              setNearby(false);
              setMapBounds(null);
              setPendingBounds(null);
            }}
          >
            Reset
          </button>
          <button type="button" className="btn btn--green" onClick={() => setDrawerOpen(false)}>
            Show {results.length} places
          </button>
        </div>
      </aside>
    </>, document.body)}
  </div>;
}
