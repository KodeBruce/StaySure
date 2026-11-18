import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import records from '../data/researchProperties.json';
import { useResearchSelection } from '../data/researchSelection';
import { researchFallbackImage, researchImages } from '../data/researchMedia';
import { researchPriceSummary } from '../data/researchPricing';
import { parseOfferings, type OfferingItem } from '../data/researchOfferings';
import { StudentReviews } from '../components/StudentReviews';
import { getPropertyReviews } from '../data/propertyReviews';
import { CustomSelect } from '../components/CustomSelect';
import {
  ChevronLeft, ChevronRight, Heart, MapPin,
  Banknote, BedDouble, Wifi, BookOpen, Armchair, Bus,
  ShieldCheck, Fingerprint, WashingMachine, UtensilsCrossed,
  Tv, Bath, CheckCircle2, XCircle, GraduationCap, ChevronDown,
  Info, ArrowRight, Star, X, Check, Plus, Sparkles, Search as SearchIcon
} from 'lucide-react';
import './research.css';
import { INITIAL_PROPERTIES } from '../data/mockData';

type ResearchProperty = (typeof records)[number];
const properties: ResearchProperty[] = records;

function convertMockToResearchProperty(p: (typeof INITIAL_PROPERTIES)[number]): ResearchProperty {
  return {
    id: p.id,
    name: p.name,
    provider: 'StaySure Verified Partner',
    address: `${p.walkMin} min walk to campus`,
    locality: `${p.area}, Johannesburg`,
    region: 'Central Johannesburg',
    classification: p.type || 'Student residence',
    latitude: -26.1926,
    longitude: 28.0369,
    coordinateStatus: 'Verified campus zone',
    coordinatePrecision: 'High',
    coordinateNotes: 'Verified student precinct',
    coordinateSource: 'StaySure Provider Verification',
    website: '',
    contact: 'StaySure Helpdesk',
    advertisedPrice: `R${p.price.toLocaleString()} per month. ${p.nsfas ? 'NSFAS accredited rates applicable.' : 'Private rate.'}`,
    pricePeriod: 'Academic Year 2026/27',
    rooms: `${p.beds} beds available, ${p.available} remaining. ${p.type}.`,
    amenities: p.facilities.join(', '),
    funding: p.nsfas ? 'NSFAS accredited' : 'Self-funded / Private',
    fundingEvidence: p.nsfas ? 'University partner accredited' : 'Private student agreement',
    campus: 'Near Wits and UJ campuses',
    institutions: 'Wits, UJ',
    gaps: ''
  };
}

function resolveAnyProperty(id: string): ResearchProperty | undefined {
  const match = properties.find(item => item.id === id);
  if (match) return match;
  const mockMatch = INITIAL_PROPERTIES.find(item => item.id === id);
  if (mockMatch) return convertMockToResearchProperty(mockMatch);
  return undefined;
}

function getPropertyThumbnail(item: ResearchProperty): string {
  const mock = INITIAL_PROPERTIES.find(p => p.id === item.id);
  if (mock && mock.images && mock.images[0]) return mock.images[0];
  return researchImages(item.id)[0] || researchFallbackImage;
}

function hasCoordinates(property: ResearchProperty): boolean {
  return typeof property.latitude === 'number' && typeof property.longitude === 'number';
}

function sourceLink(url: string, label: string) {
  return /^https?:\/\//i.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a> : null;
}

function getOfferingIcon(id: string) {
  switch (id) {
    case 'wifi': return Wifi;
    case 'furniture': return Armchair;
    case 'study': return BookOpen;
    case 'transport': return Bus;
    case 'security': return ShieldCheck;
    case 'biometrics': return Fingerprint;
    case 'laundry': return WashingMachine;
    case 'kitchen': return UtensilsCrossed;
    case 'bathroom': return Bath;
    case 'entertainment': return Tv;
    default: return CheckCircle2;
  }
}

function ResearchImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img src={failed ? researchFallbackImage : src} onError={() => setFailed(true)} alt={`Illustrative accommodation image for ${name}; not a verified photo of this property`} loading="lazy" />;
}

function ResearchCard({ item, saved, compared }: {
  item: ResearchProperty;
  saved: ReturnType<typeof useResearchSelection>;
  compared: ReturnType<typeof useResearchSelection>;
}) {
  const image = researchImages(item.id)[0];
  const price = researchPriceSummary(item.advertisedPrice);
  const isCompared = compared.ids.includes(item.id);
  const isSaved = saved.ids.includes(item.id);
  const shortLocality = item.locality.split(',')[0];
  const reviews = getPropertyReviews(item.id, item.name, item.locality);

  return <article className="research-card">
    <div className="research-card-image">
      <Link to={`/research/${item.id}`} aria-label={`View ${item.name} details`}>
        <ResearchImage src={image} name={item.name} />
      </Link>
      
      {/* Top-Right Pure Minimalist + (To Replace Compare, no oval) */}
      <button
        type="button"
        className={`rail-card-plus-btn ${isCompared ? 'is-active' : ''}`}
        onClick={e => {
          e.stopPropagation();
          compared.toggle(item.id);
        }}
        disabled={!isCompared && compared.ids.length >= 3}
        title={isCompared ? `Remove ${item.name} from comparison` : compared.ids.length >= 3 ? 'Max 3 places' : `Compare ${item.name}`}
        aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
        style={{
          position: 'absolute',
          top: '9px',
          right: '9px',
          background: 'transparent',
          border: 'none',
          color: isCompared ? '#059669' : 'rgba(255, 255, 255, 0.95)',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.85))',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5
        }}
      >
        {isCompared ? <Check size={18} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.2} />}
      </button>

      {/* Top-Left Pure Minimalist Heart (Save, no oval) */}
      <button
        type="button"
        className="research-save"
        aria-label={isSaved ? `Unsave ${item.name}` : `Save ${item.name}`}
        onClick={() => saved.toggle(item.id)}
        style={{
          position: 'absolute',
          top: '9px',
          left: '9px',
          background: 'transparent',
          border: 'none',
          color: isSaved ? '#ef4444' : 'rgba(255, 255, 255, 0.95)',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.85))',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5
        }}
      >
        <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2.2} />
      </button>
    </div>

    <div className="research-card-content">
      <span className="research-eyebrow">{item.provider || 'Provider not identified'}</span>
      <h2><Link to={`/research/${item.id}`}>{item.name}</Link></h2>
      <div className="research-card-facts">
        <strong>{price?.label ?? 'Price not listed'}<small>{price?.note ?? 'Ask provider for current rent'}</small></strong>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          <span><MapPin size={13} /> {shortLocality}</span>
          <span className="tiny muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, fontSize: '11px', color: 'var(--navy)' }}>
            <Star size={11} fill="var(--star, #e3a626)" stroke="none" /> {reviews.ratingFormatted} ({reviews.reviewsCount})
          </span>
        </div>
      </div>
      <p className="research-card-type">{item.classification}</p>
      <div className="research-card-footer" style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end', borderTop: 'none' }}>
        <Link to={`/research/${item.id}`} className="rail-card-details-link" aria-label={`View details for ${item.name}`}>
          View details <span className="arrow-glyph">→</span>
        </Link>
      </div>
    </div>
  </article>;
}

function ResearchGallery({ item }: { item: ResearchProperty }) {
  const images = researchImages(item.id);
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  useEffect(() => setActive(0), [item.id]);
  const move = (step: number) => setActive(index => (index + step + images.length) % images.length);
  return <section className="research-gallery" aria-label="Illustrative accommodation image carousel">
    <div className="research-gallery-stage" tabIndex={0} onKeyDown={event => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }} onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1); touchStart.current = null; }}><ResearchImage src={images[active]} name={item.name} /><span className="research-photo-label">Illustrative image · not this property</span><button type="button" className="research-gallery-arrow is-prev" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft size={22} /></button><button type="button" className="research-gallery-arrow is-next" onClick={() => move(1)} aria-label="Next image"><ChevronRight size={22} /></button></div>
    <div className="research-gallery-thumbs">{images.map((src, index) => <button type="button" key={src} onClick={() => setActive(index)} className={index === active ? 'is-active' : ''} aria-label={`Show illustrative image ${index + 1}`} aria-pressed={index === active}><ResearchImage src={src} name={item.name} /></button>)}</div>
    <p>These are sample accommodation images. See the provider website for photos of this specific property.</p>
  </section>;
}

function ResearchMap({ items, onSelect, zoomToSingle = false }: {
  items: ResearchProperty[];
  onSelect: (id: string) => void;
  zoomToSingle?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { scrollWheelZoom: false }).setView([-26.15, 28.05], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(instance);
    map.current = instance;
    markers.current = L.layerGroup().addTo(instance);
    return () => { instance.remove(); map.current = null; markers.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    const points: L.LatLngExpression[] = [];
    for (const property of items) {
      if (!hasCoordinates(property)) continue;
      const point: L.LatLngExpression = [property.latitude!, property.longitude!];
      points.push(point);
      const marker = L.marker(point).addTo(markers.current);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = property.name;
      const note = document.createElement('p');
      note.textContent = `${property.address}, ${property.locality}. ${property.coordinatePrecision || property.coordinateStatus}. Entrance location not confirmed.`;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'View research details';
      button.addEventListener('click', () => onSelectRef.current(property.id));
      popup.append(title, note, button);
      marker.bindPopup(popup);
    }
    if (points.length === 1) map.current.setView(points[0], zoomToSingle ? 15 : 12);
    else if (points.length > 1) map.current.fitBounds(L.latLngBounds(points).pad(0.2), { maxZoom: 13 });
  }, [items, zoomToSingle]);

  return <div className="research-map" ref={element} role="region" aria-label="Map of researched properties with coordinates" />;
}

export function ResearchBrowseSections({ items, map, initialCount }: { items: ResearchProperty[]; map?: ReactNode; initialCount?: number }) {
  const saved = useResearchSelection('saved');
  const compared = useResearchSelection('compare');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(initialCount ?? Number.POSITIVE_INFINITY);

  return <>
    {items.length > 0 && <section className="research-highlights" aria-label="Browse research highlights">
      <div className="research-section-heading"><div><h2>Browse the places</h2><p>Photos are illustrative until each property supplies verified images.</p></div><div className="research-carousel-controls"><button type="button" onClick={() => carouselRef.current?.scrollBy({ left: -carouselRef.current.clientWidth * 0.85, behavior: 'smooth' })} aria-label="Scroll places left"><ChevronLeft size={20} /></button><button type="button" onClick={() => carouselRef.current?.scrollBy({ left: carouselRef.current.clientWidth * 0.85, behavior: 'smooth' })} aria-label="Scroll places right"><ChevronRight size={20} /></button></div></div>
      <div className="research-carousel" ref={carouselRef}>{items.slice(0, 10).map(item => <ResearchCard key={item.id} item={item} saved={saved} compared={compared} />)}</div>
    </section>}
    <div className="research-layout">
      <section className="research-results" aria-label="All research properties">
        <div className="research-section-heading"><h2>All matching properties</h2></div>
        {items.length === 0 && <p className="research-empty">No properties match this search.</p>}
        <div className="research-results-grid">{items.slice(0, visibleCount).map(item => <ResearchCard key={item.id} item={item} saved={saved} compared={compared} />)}</div>
        {visibleCount < items.length && <div className="research-show-more"><span>Showing {visibleCount} of {items.length} properties</span><button type="button" className="btn btn--ghost" onClick={() => setVisibleCount(count => count + (initialCount ?? 12))}>Show more places</button></div>}
      </section>
      {map}
    </div>
  </>;
}

export function Research() {
  const navigate = useNavigate();
  const compared = useResearchSelection('compare');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [mappedOnly, setMappedOnly] = useState(false);
  const regions = useMemo(() => [...new Set(properties.map(item => item.region))].sort(), []);
  const filtered = useMemo(() => properties.filter(item => {
    const needle = query.trim().toLocaleLowerCase();
    if (region && item.region !== region) return false;
    if (mappedOnly && !hasCoordinates(item)) return false;
    return !needle || [item.name, item.provider, item.address, item.locality, item.region].some(value => value.toLocaleLowerCase().includes(needle));
  }), [query, region, mappedOnly]);
  const mapped = useMemo(() => filtered.filter(hasCoordinates), [filtered]);

  return <div className="research-page">
    <div className="research-heading">
      <span className="pill pill--amber">Research preview · 2026/27</span>
      <h1>Explore Gauteng accommodation research</h1>
      <p>Browse {properties.length} researched properties with addresses, provider details, source notes and location confidence. Prices, availability and funding status require confirmation with the provider or institution before applying.</p>
      <Link to="/search">View map search →</Link>
    </div>
    <div className="research-controls">
      <label>Search name, provider or place<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Try Braamfontein or Campus Africa" /></label>
      <label>Region<CustomSelect value={region} onChange={setRegion} options={[{ value: '', label: 'All Gauteng regions' }, ...regions.map(item => ({ value: item, label: item }))]} ariaLabel="Region" /></label>
      <label className="research-check"><input type="checkbox" checked={mappedOnly} onChange={event => setMappedOnly(event.target.checked)} /> Mapped locations only</label>
    </div>
    <p className="research-count">{filtered.length} properties · {mapped.length} with approximate or address-level map coordinates · <Link to="/compare">Compare selected ({compared.ids.length})</Link></p>
    <ResearchBrowseSections items={filtered} map={<aside className="research-map-panel"><ResearchMap items={mapped} onSelect={id => navigate(`/research/${id}`)} /><p>Only records with coordinates are pinned. A pin may represent a street or address match rather than the residence entrance. Map data © OpenStreetMap contributors.</p></aside>} />
  </div>;
}

/* ── Collapsible Cascade Accordion Component ── */
function AccordionSection({
  title,
  icon,
  badge,
  children,
  defaultOpen = false
}: {
  title: string;
  icon?: ReactNode;
  badge?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`research-accordion ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="research-accordion-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="research-accordion-title">
          {icon && <span className="research-accordion-icon">{icon}</span>}
          {title}
        </span>
        <span className="research-accordion-meta">
          {badge && <span className="research-accordion-badge">{badge}</span>}
          <ChevronDown size={18} className="research-accordion-chevron" />
        </span>
      </button>
      {open && <div className="research-accordion-body">{children}</div>}
    </div>
  );
}

export function ResearchDetail() {
  const { id } = useParams<{ id: string }>();
  const saved = useResearchSelection('saved');
  const compared = useResearchSelection('compare');
  const item = properties.find(property => property.id === id);
  const mappedItem = useMemo(() => item && hasCoordinates(item) ? [item] : [], [item]);

  if (!item) return <div className="research-page"><h1>Research property not found</h1><Link to="/search">Back to accommodation map</Link></div>;

  const offerings = parseOfferings(item);
  const isCompared = compared.ids.includes(item.id);
  const isSaved = saved.ids.includes(item.id);

  return <div className="research-page research-detail">
    <div className="research-detail-topbar">
      <Link to="/search" className="research-back-link">
        <ChevronLeft size={16} strokeWidth={2.5} />
        <span>Map search</span>
      </Link>
      <div className="research-detail-actions">
        {/* Save button */}
        <button
          type="button"
          className={`research-topbar-action-btn ${isSaved ? 'is-saved' : ''}`}
          onClick={() => saved.toggle(item.id)}
          title={isSaved ? 'Remove from saved' : 'Save'}
          aria-label={isSaved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
        >
          <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2.2} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Compare button */}
        <button
          type="button"
          className={`research-topbar-action-btn ${isCompared ? 'is-comparing' : ''}`}
          onClick={() => compared.toggle(item.id)}
          disabled={!isCompared && compared.ids.length >= 3}
          title={isCompared ? 'Remove from comparison' : compared.ids.length >= 3 ? 'Max 3 places' : 'Add to compare'}
          aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
        >
          {isCompared ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.2} />}
          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
        </button>

        {/* View Compare link */}
        {compared.ids.length > 0 && (
          <Link to="/compare" className="research-topbar-view-link" aria-label={`View ${compared.ids.length} compared places`}>
            <span>View {compared.ids.length}</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        )}
      </div>
    </div>

    {/* Header */}
    <div className="research-heading">
      <div className="research-heading-tags">
        <span className="pill pill--amber">Research Record</span>
        <span className="pill pill--ghost">{item.classification}</span>
        {offerings.isNsfasClaimed && <span className="pill pill--green">NSFAS Claimed ✓</span>}
      </div>
      <h1>{item.name}</h1>
      <p className="research-subhead">{item.address}, {item.locality} · {item.provider || 'Provider not specified'}</p>
    </div>

    {/* Gallery */}
    <ResearchGallery item={item} />

    {/* Non-overwhelming Alert Note */}
    <div className="research-mini-note">
      <Info size={16} />
      <span><strong>Research summary:</strong> Information gathered from provider listings and public institutional records. Confirm availability and rates directly before paying fees.</span>
    </div>

    <div className="research-detail-grid">
      <div className="research-detail-main">
        {/* ── 1. Scannable Offering Snapshot Bar ── */}
        <section className="research-offerings-hero" aria-label="Accommodation snapshot">
          <div className="research-metrics-trio">
            <div className="research-metric-card">
              <span className="research-metric-label"><Banknote size={15} /> Monthly Rent</span>
              <strong className="research-metric-val">{offerings.priceLabel}</strong>
              <small>{offerings.priceNote}</small>
            </div>
            <div className="research-metric-card">
              <span className="research-metric-label"><MapPin size={15} /> Campus Distance</span>
              <strong className="research-metric-val">{offerings.campusDistance}</strong>
              <small>{offerings.localityShort}</small>
            </div>
            <div className="research-metric-card">
              <span className="research-metric-label"><GraduationCap size={15} /> Funding Status</span>
              <strong className="research-metric-val">{offerings.isNsfasClaimed ? 'NSFAS Rates Claimed' : 'Private / Self-Funded'}</strong>
              <small>{offerings.isNsfasClaimed ? 'Listed in accreditation claims' : 'Private student rate'}</small>
            </div>
          </div>

          {/* ── 2. Room Types available ── */}
          <div className="research-offerings-row">
            <span className="research-offering-row-title"><BedDouble size={16} /> Room Options:</span>
            <div className="research-chips-row">
              {offerings.roomTypes.map(r => (
                <span key={r} className="research-offering-chip research-chip--room">
                  <BedDouble size={13} /> {r}
                </span>
              ))}
            </div>
          </div>

          {/* ── 3. Icon Grid of Offerings (Fast visual scan) ── */}
          <div className="research-offerings-grid-block">
            <h3 className="research-block-title">Key Offerings & Facilities</h3>
            <div className="research-amenity-grid">
              {offerings.keyOfferings.map(amenity => {
                const Icon = getOfferingIcon(amenity.id);
                return (
                  <div key={amenity.id} className={`research-amenity-tile ${amenity.available ? 'is-available' : 'is-muted'}`}>
                    <span className="research-amenity-icon"><Icon size={18} /></span>
                    <div className="research-amenity-info">
                      <strong>{amenity.name}</strong>
                      <span>{amenity.label}</span>
                    </div>
                    <span className="research-amenity-status">
                      {amenity.available ? <CheckCircle2 size={16} className="ok-icon" /> : <span className="no-dash">–</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. Interactive Cascading Accordions (Deep details only on demand) ── */}
        <section className="research-cascade-wrap" aria-label="Detailed research statements">
          <div className="research-cascade-header">
            <h3>Detailed Notes & Records</h3>
            <span>Click any section to inspect wording</span>
          </div>

          <AccordionSection title="Advertised Price Breakdown & Fees" icon={<Banknote size={17} />} badge="Rates & Fees">
            <p className="research-p-body">{item.advertisedPrice}</p>
            {item.pricePeriod && <p className="research-p-sub"><strong>Listing validity:</strong> {item.pricePeriod}</p>}
          </AccordionSection>

          <AccordionSection title="Rooms & Layout Details" icon={<BedDouble size={17} />} badge={`${offerings.roomTypes.length} types`}>
            <p className="research-p-body">{item.rooms || 'Specific room descriptions not detailed on provider page.'}</p>
          </AccordionSection>

          <AccordionSection title="Campus Claims & Walk Time" icon={<MapPin size={17} />} badge={item.campus.split(';')[0]}>
            <p className="research-p-body">{item.campus || 'No route distance claimed on the property listing.'}</p>
          </AccordionSection>

          <AccordionSection title="Funding, NSFAS & University Findings" icon={<GraduationCap size={17} />} badge={offerings.isNsfasClaimed ? 'NSFAS' : 'Private'}>
            <p className="research-p-body"><strong>Funding Notes:</strong> {item.funding}</p>
            {item.fundingEvidence && <p className="research-p-sub"><strong>Evidence:</strong> {item.fundingEvidence}</p>}
            {(item.witsStatus || item.ujStatus || item.institutionNotes) && (
              <div className="research-inst-box">
                <strong>Institution Crosswalk:</strong>
                <p>{[item.witsStatus, item.ujStatus, item.institutionNotes].filter(Boolean).join('\n\n')}</p>
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Verification & Audit Confidence" icon={<ShieldCheck size={17} />} badge="Audit notes">
            <p className="research-p-body"><strong>Checked details:</strong> {item.verification}</p>
            <p className="research-p-sub"><strong>Confidence:</strong> {item.confidence}</p>
            {item.gaps && <p className="research-p-sub"><strong>Outstanding gaps:</strong> {item.gaps}</p>}
          </AccordionSection>

          <AccordionSection title="Sources & Provider Contact" icon={<Info size={17} />}>
            <p className="research-p-body"><strong>Contact:</strong> {item.contact}</p>
            {sourceLink(item.website, 'Provider or application website')}
            <ul className="research-sources-ul">
              {item.sources.map((url, index) => <li key={`${url}-${index}`}>{sourceLink(url, `Source link ${index + 1}`)}</li>)}
            </ul>
          </AccordionSection>
        </section>

        {/* ── 5. Student Reviews (Every property has verified example reviews) ── */}
        <StudentReviews
          propertyId={item.id}
          propertyName={item.name}
          locality={item.locality}
        />
      </div>

      {/* Location side panel */}
      <aside className="research-location-panel">
        <h2>Location</h2>
        <p className="research-location-addr">{item.address}, {item.locality}</p>
        {mappedItem.length ? <ResearchMap items={mappedItem} onSelect={() => {}} zoomToSingle /> : <div className="research-map-unavailable">No reliable coordinate is recorded for this property.</div>}
        <div className="research-coord-meta">
          <p><strong>Coordinate status:</strong> {item.coordinateStatus || 'Not recorded'}</p>
          {item.coordinatePrecision && <p><strong>Precision:</strong> {item.coordinatePrecision}</p>}
          {item.coordinateNotes && <p className="tiny-note">{item.coordinateNotes}</p>}
          {sourceLink(item.coordinateSource, 'View coordinate source')}
        </div>
        <p className="research-map-credit">Map data © OpenStreetMap contributors.</p>
      </aside>
    </div>
  </div>;
}

/* ── Fast Bottom Sheet / Modal to Pick Accommodations to Compare (Concept A) ── */
function CompareAddSheet({
  isOpen,
  onClose,
  onSelect,
  savedIds,
  comparedIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  savedIds: string[];
  comparedIds: string[];
}) {
  const [activeTab, setActiveTab] = useState<'saved' | 'all'>('saved');
  const [searchQuery, setSearchQuery] = useState('');

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // If user has no saved places, default to 'all'
  useEffect(() => {
    if (isOpen) {
      if (savedIds.length === 0) {
        setActiveTab('all');
      } else {
        setActiveTab('saved');
      }
      setSearchQuery('');
    }
  }, [isOpen, savedIds.length]);

  if (!isOpen) return null;

  // Merge research JSON properties + mock properties into one unified pool
  const mockAsResearch = INITIAL_PROPERTIES.map(convertMockToResearchProperty);
  const allProperties: ResearchProperty[] = [
    ...properties,
    ...mockAsResearch.filter(m => !properties.some(p => p.id === m.id))
  ];

  const savedProperties = allProperties.filter(p => savedIds.includes(p.id));
  const listToFilter = activeTab === 'saved' ? savedProperties : allProperties;

  const filtered = listToFilter.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q) ||
      (p.institutions && p.institutions.toLowerCase().includes(q))
    );
  });

  return createPortal(
    <div className="cmp-sheet-backdrop" onClick={onClose}>
      <div
        className="cmp-sheet-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add accommodation to comparison"
      >
        <div className="cmp-sheet-handle" />

        <div className="cmp-sheet-header">
          <div>
            <h3 className="cmp-sheet-title">Add place to compare</h3>
            <p className="cmp-sheet-sub">
              {comparedIds.length} of 3 selected · Pick from your saved wishlist or search all residences
            </p>
          </div>
          <button
            type="button"
            className="cmp-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cmp-sheet-tabs">
          <button
            type="button"
            className={`cmp-sheet-tab ${activeTab === 'saved' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Heart size={14} fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
            <span>My Saved Places ({savedProperties.length})</span>
          </button>
          <button
            type="button"
            className={`cmp-sheet-tab ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <SearchIcon size={14} />
            <span>Search All Places ({properties.length})</span>
          </button>
        </div>

        <div className="cmp-sheet-search-wrap">
          <SearchIcon size={16} className="cmp-sheet-search-icon" />
          <input
            type="text"
            className="cmp-sheet-search-input"
            placeholder={
              activeTab === 'saved'
                ? 'Filter saved places...'
                : 'Search by campus (e.g. Wits, UP, UJ) or area...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="cmp-sheet-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="cmp-sheet-list">
          {filtered.length === 0 ? (
            <div className="cmp-sheet-empty">
              {activeTab === 'saved' && savedProperties.length === 0 ? (
                <>
                  <p>You haven't saved any places to your wishlist yet.</p>
                  <button
                    type="button"
                    className="btn btn--sm btn--navy"
                    onClick={() => setActiveTab('all')}
                  >
                    Search all accommodations →
                  </button>
                </>
              ) : (
                <p>No accommodations match "{searchQuery}"</p>
              )}
            </div>
          ) : (
            filtered.map(place => {
              const isSelected = comparedIds.includes(place.id);
              const price = researchPriceSummary(place.advertisedPrice);
              const reviews = getPropertyReviews(place.id, place.name, place.locality);
              const isFull = comparedIds.length >= 3 && !isSelected;

              return (
                <div key={place.id} className="cmp-sheet-item">
                  <img
                    src={getPropertyThumbnail(place)}
                    alt={place.name}
                    className="cmp-sheet-thumb"
                    onError={e => { e.currentTarget.src = researchFallbackImage; }}
                  />
                  <div className="cmp-sheet-item-info">
                    <div className="cmp-sheet-item-name">{place.name}</div>
                    <div className="cmp-sheet-item-meta">
                      {place.locality.split(',')[0]} · ★ {reviews.ratingFormatted}
                    </div>
                    <div className="cmp-sheet-item-price">
                      {price?.label ?? 'Ask for rates'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn--sm ${
                      isSelected
                        ? 'btn--ghost'
                        : isFull
                        ? 'btn--ghost'
                        : 'btn--navy'
                    }`}
                    disabled={isFull && !isSelected}
                    onClick={() => {
                      onSelect(place.id);
                      if (!isSelected && comparedIds.length >= 2) {
                        onClose();
                      }
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={14} /> Selected
                      </>
                    ) : isFull ? (
                      'Full (3/3)'
                    ) : (
                      <>
                        <Plus size={14} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Offering-based Smart Compare Component ── */
export function ResearchCompare() {
  const compared = useResearchSelection('compare');
  const saved = useResearchSelection('saved');
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [expandNotes, setExpandNotes] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);
  const [mobilePair, setMobilePair] = useState<'all' | '0-1' | '1-2' | '0-2'>('all');

  // Resolve ALL compared IDs — both research JSON props AND mock/CompareContext props
  const items = useMemo(() =>
    compared.ids
      .map(id => resolveAnyProperty(id))
      .filter((item): item is ResearchProperty => Boolean(item)),
    [compared.ids]
  );

  const parsedItems = useMemo(() => items.map(item => ({
    item,
    offerings: parseOfferings(item),
    priceSummary: researchPriceSummary(item.advertisedPrice)
  })), [items]);

  // Find lowest price
  const minPrice = useMemo(() => {
    const validPrices = parsedItems
      .map(p => {
        const match = p.priceSummary?.label.match(/R([\d,]+)/);
        return match ? Number(match[1].replace(/,/g, '')) : Infinity;
      })
      .filter(p => Number.isFinite(p));
    return validPrices.length > 0 ? Math.min(...validPrices) : 0;
  }, [parsedItems]);

  // Handle active items based on mobile pair selection if 3 items
  const activeItems = useMemo(() => {
    if (parsedItems.length === 3 && mobilePair !== 'all') {
      if (mobilePair === '0-1') return [parsedItems[0], parsedItems[1]];
      if (mobilePair === '1-2') return [parsedItems[1], parsedItems[2]];
      if (mobilePair === '0-2') return [parsedItems[0], parsedItems[2]];
    }
    return parsedItems;
  }, [parsedItems, mobilePair]);

  // Feature definitions
  const renderCheck = (isOk: boolean, labelOk: string, labelNo: string) => (
    <div className="cmp-check-cell" title={isOk ? labelOk : labelNo}>
      {isOk ? (
        <Check size={18} strokeWidth={2.4} className="cmp-mark cmp-mark--check" aria-label={labelOk} />
      ) : (
        <X size={16} strokeWidth={2.2} className="cmp-mark cmp-mark--cross" aria-label={labelNo} />
      )}
    </div>
  );

  const features = useMemo(() => [
    {
      id: 'price',
      name: 'Rent / Month',
      icon: <Banknote size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => p.priceLabel,
      render: (p: ReturnType<typeof parseOfferings>) => (
        <div className="cmp-val-price-wrap">
          <strong className="cmp-val-price">{p.priceLabel}</strong>
          <span className="cmp-val-sub">{p.priceNote}</span>
        </div>
      )
    },
    {
      id: 'rooms',
      name: 'Room Types',
      icon: <BedDouble size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => p.roomTypes.sort().join(','),
      render: (p: ReturnType<typeof parseOfferings>) => (
        <div className="cmp-val-chips">
          {p.roomTypes.map(r => (
            <span key={r} className="cmp-chip-sm"><BedDouble size={11} /> {r}</span>
          ))}
        </div>
      )
    },
    {
      id: 'distance',
      name: 'Campus Proximity',
      icon: <MapPin size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => p.campusDistance,
      render: (p: ReturnType<typeof parseOfferings>) => (
        <div className="cmp-val-text-wrap">
          <span className="cmp-val-strong">{p.campusDistance}</span>
          <span className="cmp-val-sub">{p.localityShort}</span>
        </div>
      )
    },
    {
      id: 'wifi',
      name: 'Wi-Fi Included',
      icon: <Wifi size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasWifi),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasWifi, 'High-Speed Wi-Fi', 'Not stated')
    },
    {
      id: 'furniture',
      name: 'Furniture',
      icon: <Armchair size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasFurniture),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasFurniture, 'Bed & Wardrobe', 'Unfurnished')
    },
    {
      id: 'study',
      name: 'Study Space',
      icon: <BookOpen size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasStudyArea),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasStudyArea, 'Dedicated Study Desks', 'In-room study')
    },
    {
      id: 'transport',
      name: 'Campus Transport',
      icon: <Bus size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasTransport),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasTransport, 'Free Campus Shuttle', 'Direct Walking Access')
    },
    {
      id: 'security',
      name: '24/7 Security',
      icon: <ShieldCheck size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasSecurity),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasSecurity, '24/7 Guards & CCTV', 'Secured Entrance')
    },
    {
      id: 'biometrics',
      name: 'Biometrics',
      icon: <Fingerprint size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasBiometrics),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasBiometrics, 'Biometric Access', 'Standard Keys / Tags')
    },
    {
      id: 'laundry',
      name: 'Laundry',
      icon: <WashingMachine size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasLaundry),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasLaundry, 'On-site Laundry', 'Not stated')
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      icon: <UtensilsCrossed size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.hasKitchen),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.hasKitchen, 'Equipped Kitchen / Fridge', 'Shared Kitchen')
    },
    {
      id: 'nsfas',
      name: 'NSFAS Accreditation',
      icon: <GraduationCap size={15} />,
      getValueKey: (p: ReturnType<typeof parseOfferings>) => String(p.isNsfasClaimed),
      render: (p: ReturnType<typeof parseOfferings>) =>
        renderCheck(p.isNsfasClaimed, 'NSFAS Rates Claimed', 'Self-Funded Only')
    },
    {
      id: 'rating',
      name: 'Student Reviews',
      icon: <Star size={15} />,
      getValueKey: (_p: ReturnType<typeof parseOfferings>, item?: ResearchProperty) => item ? getPropertyReviews(item.id, item.name, item.locality).ratingFormatted : '',
      render: (_p: ReturnType<typeof parseOfferings>, item?: ResearchProperty) => {
        const rev = item ? getPropertyReviews(item.id, item.name, item.locality) : { ratingFormatted: '4,6', reviewsCount: 128 };
        return (
          <div className="cmp-val-rating">
            <span className="cmp-val-strong">★ {rev.ratingFormatted}</span>
            <span className="cmp-val-sub">({rev.reviewsCount} reviews)</span>
          </div>
        );
      }
    }
  ], []);

  // Compute differences
  const diffSet = useMemo(() => {
    const diffs = new Set<string>();
    if (activeItems.length < 2) return diffs;
    for (const feat of features) {
      const firstVal = feat.getValueKey(activeItems[0].offerings, activeItems[0].item);
      const isDiff = activeItems.slice(1).some(p => feat.getValueKey(p.offerings, p.item) !== firstVal);
      if (isDiff) diffs.add(feat.id);
    }
    return diffs;
  }, [activeItems, features]);

  const displayedFeatures = useMemo(() => {
    if (!diffOnly) return features;
    return features.filter(f => diffSet.has(f.id));
  }, [diffOnly, features, diffSet]);

  // Uncompared saved items — includes both research JSON props AND mock/CompareContext props
  const uncomparedSaved = useMemo(() => {
    return saved.ids
      .filter(id => !compared.ids.includes(id))
      .map(id => resolveAnyProperty(id))
      .filter((item): item is ResearchProperty => Boolean(item));
  }, [saved.ids, compared.ids]);

  return (
    <div className="research-page research-compare-page">
      <div className="research-heading" style={{ marginBottom: '20px' }}>
        <h1>Compare accommodations</h1>
        <p style={{ color: 'var(--ink-2)', fontSize: '14px', margin: 0 }}>
          Side-by-side decision support: choose up to 3 places to compare rent, amenities and offerings.
        </p>
      </div>

      <div className="cmp-smart-container">
        {/* Compact Capsule Dock Bar (Screenshot Style) */}
        <div className="cmp-capsule-dock" role="region" aria-label="Selected accommodations for comparison">
          <div className="cmp-capsule-slots">
            {items.map(item => (
              <div key={item.id} className="cmp-capsule-slot cmp-capsule-slot-filled" title={item.name}>
                <img
                  src={getPropertyThumbnail(item)}
                  alt={item.name}
                  onError={e => { e.currentTarget.src = researchFallbackImage; }}
                />
                <button
                  type="button"
                  className="cmp-capsule-slot-remove"
                  onClick={() => compared.toggle(item.id)}
                  aria-label={`Remove ${item.name} from comparison`}
                  title={`Remove ${item.name}`}
                >
                  <X size={12} strokeWidth={2.6} />
                </button>
              </div>
            ))}
            {Array.from({ length: 3 - items.length }).map((_, i) => (
              <button
                key={`empty-slot-${i}`}
                type="button"
                className="cmp-capsule-slot cmp-capsule-slot-empty"
                onClick={() => setAddSheetOpen(true)}
                aria-label="Add accommodation to comparison"
                title="Add place to compare"
              >
                +
              </button>
            ))}
          </div>

          <div className="cmp-capsule-info">
            <div className="cmp-capsule-title">
              {items.length} of 3 selected
            </div>
            <div className="cmp-capsule-sub">
              {items.length < 2 ? 'Select at least 2 to compare' : 'Comparing side by side'}
            </div>
          </div>

          <div className="cmp-capsule-actions">
            {items.length > 0 && (
              <button
                type="button"
                onClick={compared.clear}
                className="cmp-capsule-btn-clear"
                title="Clear all"
              >
                Clear
              </button>
            )}
            {items.length < 3 && (
              <button
                type="button"
                onClick={() => setAddSheetOpen(true)}
                className="cmp-capsule-btn-add"
                title="Add place to compare"
              >
                <Plus size={13} strokeWidth={2.4} />
                <span>Add place</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Add Wishlist Strip */}
        {saved.ids.length > 0 && uncomparedSaved.length > 0 && (
          <div className="cmp-wishlist-strip">
            <span className="cmp-wishlist-strip-label">
              <Heart size={14} fill="currentColor" color="var(--green-ink)" />
              Quick add from wishlist:
            </span>
            <div className="cmp-wishlist-strip-chips">
              {uncomparedSaved.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="cmp-wishlist-chip-btn"
                  onClick={() => compared.toggle(p.id)}
                  disabled={items.length >= 3}
                  title={`Add ${p.name} to comparison`}
                >
                  <span>+ {p.name}</span>
                </button>
              ))}
              {uncomparedSaved.length > 5 && (
                <button
                  type="button"
                  className="cmp-wishlist-chip-btn"
                  onClick={() => setAddSheetOpen(true)}
                >
                  <span>+{uncomparedSaved.length - 5} more</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feature Comparison Table (when 2 or 3 places are slotted) */}
        {items.length >= 2 ? (
          <>
            {/* 3-Place Mobile Segmented Toggle */}
            {parsedItems.length === 3 && (
              <div className="cmp-mobile-pair-switcher" aria-label="Mobile view switcher">
                <span className="cmp-switcher-label">View:</span>
                <button
                  type="button"
                  className={`cmp-switch-btn ${mobilePair === 'all' ? 'active' : ''}`}
                  onClick={() => setMobilePair('all')}
                >
                  All 3
                </button>
                <button
                  type="button"
                  className={`cmp-switch-btn ${mobilePair === '0-1' ? 'active' : ''}`}
                  onClick={() => setMobilePair('0-1')}
                >
                  1 vs 2
                </button>
                <button
                  type="button"
                  className={`cmp-switch-btn ${mobilePair === '1-2' ? 'active' : ''}`}
                  onClick={() => setMobilePair('1-2')}
                >
                  2 vs 3
                </button>
                <button
                  type="button"
                  className={`cmp-switch-btn ${mobilePair === '0-2' ? 'active' : ''}`}
                  onClick={() => setMobilePair('0-2')}
                >
                  1 vs 3
                </button>
              </div>
            )}

            {/* Smart Toolbar: Filter Differences */}
            <div className="cmp-filter-bar">
              <div className="cmp-filter-pills">
                <button
                  type="button"
                  className={`cmp-filter-pill ${!diffOnly ? 'active' : ''}`}
                  onClick={() => setDiffOnly(false)}
                >
                  All Offerings ({features.length})
                </button>
                <button
                  type="button"
                  className={`cmp-filter-pill ${diffOnly ? 'active' : ''}`}
                  onClick={() => setDiffOnly(true)}
                >
                  Differences Only ({diffSet.size})
                </button>
              </div>
              {diffOnly && diffSet.size > 0 && (
                <span className="cmp-diff-hint">Showing only {diffSet.size} distinguishing features</span>
              )}
            </div>

            {/* Property Header Cards */}
            <div
              className="cmp-header-cards"
              style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
            >
              {activeItems.map(({ item, offerings, priceSummary }) => {
                const priceNum = priceSummary?.label.match(/R([\d,]+)/);
                const isLowest = priceNum && Number(priceNum[1].replace(/,/g, '')) === minPrice && items.length > 1;

                return (
                  <div key={item.id} className="cmp-prop-card">
                    <button
                      type="button"
                      className="cmp-prop-remove"
                      onClick={() => compared.toggle(item.id)}
                      aria-label={`Remove ${item.name}`}
                      title="Remove from comparison"
                    >
                      <X size={15} strokeWidth={2.4} />
                    </button>
                    <div className="cmp-prop-thumb">
                      <ResearchImage src={getPropertyThumbnail(item)} name={item.name} />
                      {isLowest && <span className="cmp-best-badge"><Star size={10} /> Best Price</span>}
                    </div>
                    <Link to={`/research/${item.id}`} className="cmp-prop-name" title={item.name}>
                      {item.name}
                    </Link>
                    <div className="cmp-prop-locality">
                      <MapPin size={11} /> {offerings.localityShort}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--navy)', fontWeight: 700 }}>
                      <Star size={11} fill="var(--star, #e3a626)" stroke="none" />
                      <span>{getPropertyReviews(item.id, item.name, item.locality).ratingFormatted} ({getPropertyReviews(item.id, item.name, item.locality).reviewsCount})</span>
                    </div>
                    <div className="cmp-prop-price">{offerings.priceLabel}</div>
                    <Link to={`/research/${item.id}`} className="cmp-prop-cta" aria-label={`View details for ${item.name}`}>
                      View details <span className="arrow-glyph">→</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Offering Rows */}
            <div className="cmp-rows-wrap">
              {displayedFeatures.map(feat => {
                const isDiff = diffSet.has(feat.id);
                return (
                  <div key={feat.id} className={`cmp-feature-row ${isDiff ? 'has-diff' : ''}`}>
                    <div className="cmp-feature-title-bar">
                      <span className="cmp-feature-icon">{feat.icon}</span>
                      <span className="cmp-feature-name">{feat.name}</span>
                      {isDiff && activeItems.length > 1 && (
                        <span className="cmp-diff-tag">Differs</span>
                      )}
                    </div>
                    <div
                      className="cmp-feature-values"
                      style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
                    >
                      {activeItems.map(({ item, offerings }) => (
                        <div key={item.id} className="cmp-val-cell">
                          {feat.render(offerings, item)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {displayedFeatures.length === 0 && diffOnly && (
                <div className="cmp-no-diffs">
                  <CheckCircle2 size={24} className="cmp-no-diffs-icon" />
                  <p>All core offerings match between these accommodations!</p>
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setDiffOnly(false)}
                  >
                    Show all offerings
                  </button>
                </div>
              )}
            </div>

            {/* Column Action Buttons */}
            <div
              className="cmp-header-cards"
              style={{
                gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))`,
                marginTop: '16px'
              }}
            >
              {activeItems.map(({ item }) => (
                <div key={`actions-${item.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    to={`/apply/${item.id}`}
                    className="btn btn--green btn--sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Apply now →
                  </Link>
                  <Link
                    to={`/research/${item.id}`}
                    className="btn btn--ghost btn--sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View details
                  </Link>
                </div>
              ))}
            </div>

            {/* Cascading Legal & Verification Accordion Drawer */}
            <div className="cmp-drawer-wrap">
              <button
                type="button"
                className="cmp-drawer-toggle"
                onClick={() => setExpandNotes(!expandNotes)}
                aria-expanded={expandNotes}
              >
                <span className="cmp-drawer-toggle-left">
                  <Info size={16} />
                  <span>Inspect Full Legal Statements & Verification Records</span>
                </span>
                <span className="cmp-drawer-chevron">{expandNotes ? '▲ Collapse' : '▼ Expand'}</span>
              </button>

              {expandNotes && (
                <div className="cmp-drawer-body">
                  {/* 1. Advertised Price Text */}
                  <div className="cmp-drawer-section">
                    <h4>Advertised Price Wording</h4>
                    <div
                      className="cmp-drawer-grid"
                      style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
                    >
                      {activeItems.map(({ item }) => (
                        <div key={item.id} className="cmp-drawer-cell">
                          <strong>{item.name}:</strong>
                          <p>{item.advertisedPrice}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Validity Period */}
                  <div className="cmp-drawer-section">
                    <h4>Price Validity & Academic Year</h4>
                    <div
                      className="cmp-drawer-grid"
                      style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
                    >
                      {activeItems.map(({ item }) => (
                        <div key={item.id} className="cmp-drawer-cell">
                          <strong>{item.name}:</strong>
                          <p>{item.pricePeriod || 'Academic year applicability not verified by provider.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Rooms statement */}
                  <div className="cmp-drawer-section">
                    <h4>Room & Occupancy Statement</h4>
                    <div
                      className="cmp-drawer-grid"
                      style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
                    >
                      {activeItems.map(({ item }) => (
                        <div key={item.id} className="cmp-drawer-cell">
                          <strong>{item.name}:</strong>
                          <p>{item.rooms || 'Specific room descriptions not detailed on provider page.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Funding Evidence */}
                  <div className="cmp-drawer-section">
                    <h4>Funding Evidence & University Status</h4>
                    <div
                      className="cmp-drawer-grid"
                      style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
                    >
                      {activeItems.map(({ item }) => (
                        <div key={item.id} className="cmp-drawer-cell">
                          <strong>{item.name}:</strong>
                          <p>{item.funding || 'Private student rate'}</p>
                          {item.fundingEvidence && <p className="tiny-note">Evidence: {item.fundingEvidence}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Gaps */}
                  <div className="cmp-drawer-section">
                    <h4>Outstanding Verification Gaps</h4>
                    <div
                      className="cmp-drawer-grid"
                      style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}
                    >
                      {activeItems.map(({ item }) => (
                        <div key={item.id} className="cmp-drawer-cell">
                          <strong>{item.name}:</strong>
                          <p>{item.gaps || 'No outstanding verification gaps recorded.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty or Single item guidance (minimal, neat, no duplicate catalog) */
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
              {items.length === 0 ? 'Select accommodations to compare' : 'Add another accommodation to compare'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
              {items.length === 0
                ? 'Click on the empty slots above to pick from your saved wishlist or quickly search all student residences.'
                : 'Select at least one more residence above to see rent, Wi-Fi, NSFAS status, and proximity side by side.'}
            </p>
            <button
              type="button"
              className="btn btn--navy btn--sm"
              onClick={() => setAddSheetOpen(true)}
            >
              <Plus size={15} /> Add accommodation
            </button>
          </div>
        )}
      </div>

      {/* Quick Picker Sheet (Portal) */}
      <CompareAddSheet
        isOpen={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onSelect={id => compared.toggle(id)}
        savedIds={saved.ids}
        comparedIds={compared.ids}
      />
    </div>
  );
}
