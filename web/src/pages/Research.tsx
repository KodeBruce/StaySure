import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  Info, ArrowRight, Star, X, Check, Plus
} from 'lucide-react';
import './research.css';

type ResearchProperty = (typeof records)[number];
const properties: ResearchProperty[] = records;

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
      <Link to="/search" className="research-back-link">← Back to map search</Link>
      <div className="research-detail-actions">
        {/* Minimalist Save icon */}
        <button
          type="button"
          onClick={() => saved.toggle(item.id)}
          title={isSaved ? 'Saved' : 'Save'}
          aria-label={isSaved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: isSaved ? '#ef4444' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12.5px',
            fontWeight: 700,
            padding: '5px 2px',
          }}
        >
          <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2.2} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        {/* Minimalist + / ✓ compare icon */}
        <button
          type="button"
          onClick={() => compared.toggle(item.id)}
          disabled={!isCompared && compared.ids.length >= 3}
          title={isCompared ? `Remove from comparison` : compared.ids.length >= 3 ? 'Max 3 places' : 'Add to compare'}
          aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: isCompared ? '#059669' : '#64748b',
            cursor: isCompared || compared.ids.length < 3 ? 'pointer' : 'not-allowed',
            opacity: !isCompared && compared.ids.length >= 3 ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12.5px',
            fontWeight: 700,
            padding: '5px 2px',
          }}
        >
          {isCompared ? <Check size={15} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2} />}
          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
        </button>
        {compared.ids.length > 0 && (
          <Link
            to="/compare"
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#0f172a',
              textDecoration: 'none',
              padding: '5px 2px',
            }}
          >
            View {compared.ids.length} →
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

/* ── Offering-based Smart Compare Component ── */
export function ResearchCompare() {
  const compared = useResearchSelection('compare');
  const [expandNotes, setExpandNotes] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);
  const [mobilePair, setMobilePair] = useState<'all' | '0-1' | '1-2' | '0-2'>('all');

  const items = compared.ids
    .map(id => properties.find(item => item.id === id))
    .filter((item): item is ResearchProperty => Boolean(item));

  const parsedItems = useMemo(() => items.map(item => ({
    item,
    offerings: parseOfferings(item),
    priceSummary: researchPriceSummary(item.advertisedPrice)
  })), [items]);

  // Available accommodations to add to comparison
  const availableToAdd = useMemo(() => {
    return properties.filter(p => !compared.ids.includes(p.id));
  }, [compared.ids]);

  const comparePickerOptions = useMemo(() => {
    return availableToAdd.map(p => ({
      value: p.id,
      label: `+ ${p.name}`,
      sublabel: p.locality.split(',')[0],
    }));
  }, [availableToAdd]);

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

  return <div className="research-page research-compare-page">
    <div className="research-heading">
      <span className="pill pill--amber">Side-by-side Decision Support</span>
      <h1>Compare accommodation offerings</h1>
      <p>Compare room types, Wi-Fi, distance, study areas and security at a glance without reading walls of text.</p>
    </div>

    {items.length === 0 ? (
      <div className="research-empty cmp-empty-card">
        <div className="cmp-empty-icon"><BedDouble size={36} /></div>
        <h2>Nothing selected to compare yet</h2>
        <p>Pick 2 or 3 student accommodations from the research list or map to compare offerings side by side.</p>
        <Link to="/search" className="btn btn--navy">Explore map places →</Link>
      </div>
    ) : (
      <div className="cmp-smart-container">
        {/* Top Summary & Actions */}
        <div className="cmp-top-bar">
          <div className="cmp-count-badge">
            <strong>{items.length} of 3</strong> places selected
          </div>
          <div className="cmp-top-actions">
            {items.length < 3 && availableToAdd.length > 0 && (
              <div className="cmp-inline-picker-wrap">
                <CustomSelect
                  value=""
                  onChange={val => {
                    if (val) compared.toggle(val);
                  }}
                  options={comparePickerOptions}
                  placeholder={`+ Add ${items.length === 1 ? 'second' : 'third'} place…`}
                  ariaLabel="Add accommodation to comparison"
                  size="sm"
                  clearOnSelect
                  minMenuWidth={280}
                  className="cmp-custom-picker"
                />
              </div>
            )}
            <Link to="/search" className="btn btn--sm btn--ghost">Browse map</Link>
            <button type="button" onClick={compared.clear} className="btn btn--sm btn--ghost">Clear all</button>
          </div>
        </div>

        {items.length === 1 && (
          <div className="cmp-single-hint">
            <span>Select one more accommodation above or from the map to compare side by side.</span>
          </div>
        )}

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
                  <ResearchImage src={researchImages(item.id)[0]} name={item.name} />
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

        {/* Smart Toolbar: Filter Differences */}
        {activeItems.length > 1 && (
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
        )}

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
      </div>
    )}
  </div>;
}
