import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Sparkles, GraduationCap, Bus, Wifi, ShieldCheck, BookOpen,
  BedDouble, Users, Armchair, WashingMachine,
  Search as SearchIcon, MapPin, Banknote, Heart, Plus, Check,
  Star, Map, X, ChevronDown
} from 'lucide-react';
import researchProperties from '../data/researchProperties.json';
import { researchFallbackImage, researchImages } from '../data/researchMedia';
import { researchPriceSummary, extractMinPrice } from '../data/researchPricing';
import { parseOfferings, type ResearchProperty } from '../data/researchOfferings';
import { useResearchSelection } from '../data/researchSelection';
import { getPropertyReviews } from '../data/propertyReviews';
import './airbnb-home.css';

const CATEGORIES = [
  { id: 'all',       label: 'All places',       icon: Sparkles },
  { id: 'nsfas',    label: 'NSFAS Approved',    icon: GraduationCap },
  { id: 'shuttle',  label: 'Free Shuttle',       icon: Bus },
  { id: 'wifi',     label: 'High-Speed Wi-Fi',   icon: Wifi },
  { id: 'security', label: '24/7 Security',      icon: ShieldCheck },
  { id: 'study',    label: 'Study Desks',        icon: BookOpen },
  { id: 'single',   label: 'Single Rooms',       icon: BedDouble },
  { id: 'sharing',  label: 'Sharing Rooms',      icon: Users },
  { id: 'furniture',label: 'Furnished',          icon: Armchair },
  { id: 'laundry',  label: 'On-site Laundry',    icon: WashingMachine },
];

const POPULAR_AREAS = [
  'All areas', 'Braamfontein', 'Hatfield', 'Arcadia',
  'Auckland Park', 'New Doornfontein', 'Midrand', 'Soweto',
  'Centurion', 'Parktown',
];

function AirbnbPropertyCard({
  item, saved, compared,
}: {
  item: ResearchProperty;
  saved: ReturnType<typeof useResearchSelection>;
  compared: ReturnType<typeof useResearchSelection>;
}) {
  const image = researchImages(item.id)[0];
  const price = researchPriceSummary(item.advertisedPrice);
  const offerings = parseOfferings(item);
  const reviews = getPropertyReviews(item.id, item.name, item.locality);
  const isSaved = saved.ids.includes(item.id);
  const isCompared = compared.ids.includes(item.id);
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/research/${item.id}`} className="airbnb-card" aria-label={`View ${item.name}`}>
      <div className="airbnb-card-media">
        <img
          src={imgError ? researchFallbackImage : image}
          onError={() => setImgError(true)}
          alt={item.name}
          loading="lazy"
        />
        <button
          type="button"
          className={`airbnb-card-plus ${isCompared ? 'is-active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); compared.toggle(item.id); }}
          title={isCompared ? 'Remove from compare' : 'Add to compare'}
          aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
        >
          {isCompared ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.2} />}
        </button>
        <button
          type="button"
          className={`airbnb-card-heart ${isSaved ? 'is-saved' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); saved.toggle(item.id); }}
          title={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
          aria-label={isSaved ? `Unsave ${item.name}` : `Save ${item.name}`}
        >
          <Heart size={20} fill={isSaved ? '#ef4444' : 'none'} strokeWidth={2} />
        </button>
      </div>

      <div className="airbnb-card-body">
        <div className="airbnb-card-header">
          <div className="airbnb-card-name" title={item.name}>{item.name}</div>
          <div className="airbnb-card-rating">
            <Star size={13} fill="currentColor" stroke="none" />
            <span>{reviews.ratingFormatted}</span>
          </div>
        </div>
        <div className="airbnb-card-sub">
          <MapPin size={12} />
          <span>{offerings.localityShort} · {offerings.campusDistance}</span>
        </div>
        <div className="airbnb-card-tags">
          {offerings.roomTypes.slice(0, 3).map(r => (
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
      </div>
    </Link>
  );
}

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const saved = useResearchSelection('saved');
  const compared = useResearchSelection('compare');

  const [activeArea, setActiveArea] = useState('');
  const [maxPrice, setMaxPrice] = useState(12000);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePopover, setActivePopover] = useState<'where' | 'price' | 'pref' | null>(null);

  const listingsRef = useRef<HTMLElement>(null);

  // Lock body scroll and listen for Escape key when bottom sheet is open
  useEffect(() => {
    if (!activePopover) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePopover]);

  const togglePref = (id: string) => {
    setSelectedPrefs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const filteredProperties = useMemo(() => {
    return (researchProperties as ResearchProperty[]).filter(item => {
      const offerings = parseOfferings(item);
      if (activeArea && activeArea !== 'All areas') {
        if (!item.locality.toLowerCase().includes(activeArea.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const needle = searchQuery.trim().toLowerCase();
        const matches = [item.name, item.provider, item.address, item.locality, item.region].some(
          v => v.toLowerCase().includes(needle)
        );
        if (!matches) return false;
      }
      if (maxPrice < 12000) {
        const minP = extractMinPrice(item.advertisedPrice);
        if (minP !== null && minP > maxPrice) return false;
      }
      if (selectedPrefs.length > 0) {
        for (const pref of selectedPrefs) {
          switch (pref) {
            case 'nsfas':    if (!offerings.isNsfasClaimed) return false; break;
            case 'shuttle':  if (!offerings.hasTransport) return false; break;
            case 'wifi':     if (!offerings.hasWifi) return false; break;
            case 'security': if (!offerings.hasSecurity && !offerings.hasBiometrics) return false; break;
            case 'study':    if (!offerings.hasStudyArea) return false; break;
            case 'single':   if (!offerings.roomTypes.some(r => /single/i.test(r))) return false; break;
            case 'sharing':  if (!offerings.roomTypes.some(r => /sharing|studio/i.test(r))) return false; break;
            case 'furniture':if (!offerings.hasFurniture) return false; break;
            case 'laundry':  if (!offerings.hasLaundry) return false; break;
          }
        }
      }
      return true;
    });
  }, [activeArea, searchQuery, maxPrice, selectedPrefs]);

  const handleSearchClick = () => {
    setActivePopover(null);
    listingsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasActiveFilters = activeArea !== '' || maxPrice < 12000 || selectedPrefs.length > 0 || searchQuery !== '';

  const clearAllFilters = () => {
    setActiveArea('');
    setMaxPrice(12000);
    setSelectedPrefs([]);
    setSearchQuery('');
    setActivePopover(null);
  };

  return (
    <div className="airbnb-home">
      {/* ── Hero Header ── */}
      <header className="airbnb-hero">
        <span className="airbnb-hero-badge">
          <GraduationCap size={14} />
          <span>Verified Student Accommodation · Gauteng</span>
        </span>
        <h1 className="airbnb-hero-title">
          Find student accommodation you can <span>trust.</span>
        </h1>
        <p className="airbnb-hero-sub">
          Search by price, campus proximity, and living preferences across verified student residences.
        </p>

        {/* ── Search Capsule ── */}
        <div className="airbnb-search-capsule-wrap">
          <div className={`airbnb-search-capsule ${activePopover ? 'is-active' : ''}`}>

            {/* Where */}
            <button
              type="button"
              className={`airbnb-search-segment ${activePopover === 'where' ? 'is-active' : ''}`}
              onClick={() => setActivePopover(p => p === 'where' ? null : 'where')}
            >
              <span className="airbnb-segment-label">Where</span>
              <span className="airbnb-segment-row">
                <span className={`airbnb-segment-val ${!activeArea && !searchQuery ? 'is-placeholder' : ''}`}>
                  {activeArea || searchQuery || 'Search areas or campus'}
                </span>
                <ChevronDown
                  size={13}
                  className={`airbnb-segment-chevron ${activePopover === 'where' ? 'is-open' : ''}`}
                />
              </span>
            </button>

            <span className="airbnb-segment-divider" />

            {/* Price */}
            <button
              type="button"
              className={`airbnb-search-segment ${activePopover === 'price' ? 'is-active' : ''}`}
              onClick={() => setActivePopover(p => p === 'price' ? null : 'price')}
            >
              <span className="airbnb-segment-label">Price</span>
              <span className="airbnb-segment-row">
                <span className={`airbnb-segment-val ${maxPrice >= 12000 ? 'is-placeholder' : ''}`}>
                  {maxPrice >= 12000 ? 'Any budget' : `Up to R${maxPrice.toLocaleString('en-ZA')}/mo`}
                </span>
                <ChevronDown
                  size={13}
                  className={`airbnb-segment-chevron ${activePopover === 'price' ? 'is-open' : ''}`}
                />
              </span>
            </button>

            <span className="airbnb-segment-divider" />

            {/* Preferences */}
            <button
              type="button"
              className={`airbnb-search-segment ${activePopover === 'pref' ? 'is-active' : ''}`}
              onClick={() => setActivePopover(p => p === 'pref' ? null : 'pref')}
            >
              <span className="airbnb-segment-label">Preferences</span>
              <span className="airbnb-segment-row">
                <span className={`airbnb-segment-val ${selectedPrefs.length === 0 ? 'is-placeholder' : ''}`}>
                  {selectedPrefs.length === 0
                    ? 'NSFAS, Wi-Fi, Shuttle...'
                    : selectedPrefs.length === 1
                    ? CATEGORIES.find(c => c.id === selectedPrefs[0])?.label
                    : `${CATEGORIES.find(c => c.id === selectedPrefs[0])?.label} (+${selectedPrefs.length - 1})`}
                </span>
                <ChevronDown
                  size={13}
                  className={`airbnb-segment-chevron ${activePopover === 'pref' ? 'is-open' : ''}`}
                />
              </span>
            </button>

            {/* Search button */}
            <button
              type="button"
              className="airbnb-search-btn"
              onClick={handleSearchClick}
              aria-label="Search accommodations"
            >
              <SearchIcon size={17} strokeWidth={2.5} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Bottom Sheet Popovers ── */}
      {activePopover && createPortal(
        <>
          <div
            className="airbnb-sheet-backdrop"
            onClick={() => setActivePopover(null)}
            aria-hidden="true"
          />
          <div className="airbnb-bottom-sheet" role="dialog" aria-modal="true">
            <div className="airbnb-sheet-handle" />

            {/* WHERE */}
            {activePopover === 'where' && (
              <div className="airbnb-sheet-body">
                <div className="airbnb-sheet-header">
                  <span className="airbnb-sheet-title">Where do you want to stay?</span>
                  <button type="button" className="airbnb-sheet-close" onClick={() => setActivePopover(null)} aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
                <input
                  type="text"
                  className="airbnb-sheet-input"
                  placeholder="Campus, street or area..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <div className="airbnb-sheet-label">Popular areas</div>
                <div className="airbnb-popover-grid">
                  {POPULAR_AREAS.map(ar => (
                    <button
                      key={ar}
                      type="button"
                      className={`airbnb-popover-pill ${activeArea === (ar === 'All areas' ? '' : ar) ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveArea(ar === 'All areas' ? '' : ar);
                        setActivePopover('price');
                      }}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRICE */}
            {activePopover === 'price' && (
              <div className="airbnb-sheet-body">
                <div className="airbnb-sheet-header">
                  <span className="airbnb-sheet-title">Monthly Rent Budget</span>
                  <button type="button" className="airbnb-sheet-close" onClick={() => setActivePopover(null)} aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
                <div className="airbnb-sheet-price-display">
                  {maxPrice >= 12000 ? 'Any budget' : `Up to R${maxPrice.toLocaleString('en-ZA')} / month`}
                </div>
                <div className="airbnb-price-box">
                  <div className="airbnb-price-slider-wrap">
                    <input
                      type="range" min="2500" max="12000" step="250"
                      value={maxPrice}
                      onChange={e => setMaxPrice(Number(e.target.value))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-3)', fontWeight: 600 }}>
                      <span>R2,500</span><span>R6,000</span><span>R9,000</span><span>No limit</span>
                    </div>
                  </div>
                  <div className="airbnb-price-presets">
                    {([12000, 5000, 6500, 8000] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`airbnb-sheet-preset ${maxPrice === v ? 'is-active' : ''}`}
                        onClick={() => setMaxPrice(v)}
                      >
                        {v >= 12000 ? 'Any' : `< R${(v / 1000).toFixed(1).replace('.0', '')}k`}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="airbnb-sheet-apply-btn" onClick={() => setActivePopover(null)}>
                  Apply budget
                </button>
              </div>
            )}

            {/* PREFERENCES */}
            {activePopover === 'pref' && (
              <div className="airbnb-sheet-body">
                <div className="airbnb-sheet-header">
                  <div>
                    <span className="airbnb-sheet-title">Living Preferences</span>
                    <div className="airbnb-sheet-subtitle">
                      Select as many as apply · {selectedPrefs.length} selected
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {selectedPrefs.length > 0 && (
                      <button type="button" className="airbnb-sheet-clear" onClick={() => setSelectedPrefs([])}>
                        Clear
                      </button>
                    )}
                    <button type="button" className="airbnb-sheet-close" onClick={() => setActivePopover(null)} aria-label="Close">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="airbnb-popover-grid airbnb-popover-grid--multi">
                  {CATEGORIES.slice(1).map(cat => {
                    const Icon = cat.icon;
                    const isSelected = selectedPrefs.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`airbnb-popover-pill ${isSelected ? 'is-active' : ''}`}
                        onClick={() => togglePref(cat.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={15} strokeWidth={2} />
                          <span>{cat.label}</span>
                        </span>
                        {isSelected && <Check size={13} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="airbnb-sheet-apply-btn" onClick={() => setActivePopover(null)}>
                  {selectedPrefs.length === 0
                    ? 'Skip'
                    : `Apply ${selectedPrefs.length} preference${selectedPrefs.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* ── Category Icon Tabs Bar ── */}
      <nav className="airbnb-categories-bar" aria-label="Accommodation category filters">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isAll = cat.id === 'all';
          const isActive = isAll ? selectedPrefs.length === 0 : selectedPrefs.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              className={`airbnb-cat-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => isAll ? setSelectedPrefs([]) : togglePref(cat.id)}
              title={isAll ? 'Show all' : (isActive ? `Remove ${cat.label}` : `Add ${cat.label}`)}
            >
              <span className="airbnb-cat-icon"><Icon size={20} strokeWidth={2} /></span>
              <span className="airbnb-cat-label">{cat.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Feed Bar ── */}
      <div className="airbnb-feed-bar" ref={listingsRef as React.RefObject<HTMLDivElement>}>
        <div className="airbnb-feed-count">
          {filteredProperties.length} <span>places available</span>
        </div>
        {hasActiveFilters && (
          <div className="airbnb-active-chips">
            {activeArea && (
              <button type="button" className="airbnb-chip" onClick={() => setActiveArea('')}>
                <MapPin size={12} /><span>{activeArea}</span><X size={12} />
              </button>
            )}
            {searchQuery && (
              <button type="button" className="airbnb-chip" onClick={() => setSearchQuery('')}>
                <span>"{searchQuery}"</span><X size={12} />
              </button>
            )}
            {maxPrice < 12000 && (
              <button type="button" className="airbnb-chip" onClick={() => setMaxPrice(12000)}>
                <Banknote size={12} /><span>≤ R{maxPrice.toLocaleString('en-ZA')}</span><X size={12} />
              </button>
            )}
            {selectedPrefs.map(prefId => {
              const cat = CATEGORIES.find(c => c.id === prefId);
              if (!cat) return null;
              const CatIcon = cat.icon;
              return (
                <button key={prefId} type="button" className="airbnb-chip" onClick={() => togglePref(prefId)}>
                  <CatIcon size={12} strokeWidth={2.2} /><span>{cat.label}</span><X size={12} />
                </button>
              );
            })}
            <button type="button" className="airbnb-clear-all-btn" onClick={clearAllFilters}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Listings Grid ── */}
      {filteredProperties.length === 0 ? (
        <div className="research-empty cmp-empty-card" style={{ margin: '40px auto', maxWidth: '560px' }}>
          <h2>No matching accommodations found</h2>
          <p>Try widening your budget or clearing filters to see more student residences.</p>
          <button type="button" className="btn btn--navy mt-14" onClick={clearAllFilters}>
            Clear all filters
          </button>
        </div>
      ) : (
        <main className="airbnb-grid">
          {filteredProperties.map(item => (
            <AirbnbPropertyCard key={item.id} item={item} saved={saved} compared={compared} />
          ))}
        </main>
      )}

      {/* ── Floating Map Button ── */}
      <Link to="/search" className="airbnb-float-map-btn" aria-label="Open accommodation map search">
        <Map size={16} />
        <span>Show map</span>
      </Link>
    </div>
  );
};
