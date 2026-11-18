import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GraduationCap,
  Bus,
  Wifi,
  ShieldCheck,
  BookOpen,
  BedDouble,
  Users,
  Armchair,
  WashingMachine,
  Search as SearchIcon,
  MapPin,
  Banknote,
  Heart,
  Plus,
  Check,
  Star,
  Map,
  X
} from 'lucide-react';
import researchProperties from '../data/researchProperties.json';
import { researchFallbackImage, researchImages } from '../data/researchMedia';
import { researchPriceSummary, extractMinPrice } from '../data/researchPricing';
import { parseOfferings, type ResearchProperty } from '../data/researchOfferings';
import { useResearchSelection } from '../data/researchSelection';
import { getPropertyReviews } from '../data/propertyReviews';
import './airbnb-home.css';

const CATEGORIES = [
  { id: 'all', label: 'All places', icon: Sparkles },
  { id: 'nsfas', label: 'NSFAS Approved', icon: GraduationCap },
  { id: 'shuttle', label: 'Free Shuttle', icon: Bus },
  { id: 'wifi', label: 'High-Speed Wi-Fi', icon: Wifi },
  { id: 'security', label: '24/7 Security', icon: ShieldCheck },
  { id: 'study', label: 'Study Desks', icon: BookOpen },
  { id: 'single', label: 'Single Rooms', icon: BedDouble },
  { id: 'sharing', label: 'Sharing Rooms', icon: Users },
  { id: 'furniture', label: 'Furnished', icon: Armchair },
  { id: 'laundry', label: 'On-site Laundry', icon: WashingMachine },
];

const POPULAR_AREAS = [
  'All areas',
  'Braamfontein',
  'Hatfield',
  'Arcadia',
  'Auckland Park',
  'New Doornfontein',
  'Midrand',
  'Soweto',
  'Centurion',
  'Parktown'
];

function AirbnbPropertyCard({
  item,
  saved,
  compared
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

        {/* Compare Plus Button */}
        <button
          type="button"
          className={`airbnb-card-plus ${isCompared ? 'is-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            compared.toggle(item.id);
          }}
          title={isCompared ? 'Remove from compare' : 'Add to compare'}
          aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
        >
          {isCompared ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.2} />}
        </button>

        {/* Heart Save Button */}
        <button
          type="button"
          className={`airbnb-card-heart ${isSaved ? 'is-saved' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            saved.toggle(item.id);
          }}
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePopover, setActivePopover] = useState<'where' | 'price' | 'pref' | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const listingsRef = useRef<HTMLElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!activePopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopover]);

  // Filter listings
  const filteredProperties = useMemo(() => {
    return (researchProperties as ResearchProperty[]).filter(item => {
      const offerings = parseOfferings(item);

      // 1. Location / Area filter
      if (activeArea && activeArea !== 'All areas') {
        if (!item.locality.toLowerCase().includes(activeArea.toLowerCase())) return false;
      }

      // 2. Text Search keyword
      if (searchQuery.trim()) {
        const needle = searchQuery.trim().toLowerCase();
        const matches = [item.name, item.provider, item.address, item.locality, item.region].some(
          v => v.toLowerCase().includes(needle)
        );
        if (!matches) return false;
      }

      // 3. Price Filter
      if (maxPrice < 12000) {
        const minP = extractMinPrice(item.advertisedPrice);
        if (minP !== null && minP > maxPrice) return false;
      }

      // 4. Category Filter
      switch (activeCategory) {
        case 'nsfas':
          return offerings.isNsfasClaimed;
        case 'shuttle':
          return offerings.hasTransport;
        case 'wifi':
          return offerings.hasWifi;
        case 'security':
          return offerings.hasSecurity || offerings.hasBiometrics;
        case 'study':
          return offerings.hasStudyArea;
        case 'single':
          return offerings.roomTypes.some(r => /single/i.test(r));
        case 'sharing':
          return offerings.roomTypes.some(r => /sharing|studio/i.test(r));
        case 'furniture':
          return offerings.hasFurniture;
        case 'laundry':
          return offerings.hasLaundry;
        default:
          return true;
      }
    });
  }, [activeArea, searchQuery, maxPrice, activeCategory]);

  const handleSearchClick = () => {
    setActivePopover(null);
    listingsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasActiveFilters = activeArea !== '' || maxPrice < 12000 || activeCategory !== 'all' || searchQuery !== '';

  const clearAllFilters = () => {
    setActiveArea('');
    setMaxPrice(12000);
    setActiveCategory('all');
    setSearchQuery('');
    setActivePopover(null);
  };

  return (
    <div className="airbnb-home">
      {/* ── Airbnb-style Hero Header ── */}
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

        {/* ── Airbnb Floating Search Capsule ── */}
        <div className="airbnb-search-capsule-wrap" ref={popoverRef}>
          <div className={`airbnb-search-capsule ${activePopover ? 'is-active' : ''}`}>
            {/* Where segment */}
            <button
              type="button"
              className={`airbnb-search-segment ${activePopover === 'where' ? 'is-active' : ''}`}
              onClick={() => setActivePopover(p => p === 'where' ? null : 'where')}
            >
              <span className="airbnb-segment-label">Where</span>
              <span className={`airbnb-segment-val ${!activeArea && !searchQuery ? 'is-placeholder' : ''}`}>
                {activeArea || searchQuery || 'Search areas or campus'}
              </span>
            </button>

            <span className="airbnb-segment-divider" />

            {/* Price segment */}
            <button
              type="button"
              className={`airbnb-search-segment ${activePopover === 'price' ? 'is-active' : ''}`}
              onClick={() => setActivePopover(p => p === 'price' ? null : 'price')}
            >
              <span className="airbnb-segment-label">Price</span>
              <span className={`airbnb-segment-val ${maxPrice >= 12000 ? 'is-placeholder' : ''}`}>
                {maxPrice >= 12000 ? 'Any budget' : `Up to R${maxPrice.toLocaleString('en-ZA')}/mo`}
              </span>
            </button>

            <span className="airbnb-segment-divider" />

            {/* Preferences segment */}
            <button
              type="button"
              className={`airbnb-search-segment ${activePopover === 'pref' ? 'is-active' : ''}`}
              onClick={() => setActivePopover(p => p === 'pref' ? null : 'pref')}
            >
              <span className="airbnb-segment-label">Preferences</span>
              <span className={`airbnb-segment-val ${activeCategory === 'all' ? 'is-placeholder' : ''}`}>
                {activeCategory !== 'all'
                  ? CATEGORIES.find(c => c.id === activeCategory)?.label
                  : 'NSFAS, Wi-Fi, Shuttle'}
              </span>
            </button>

            {/* Search Action Button */}
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

          {/* ── Popover Panels ── */}
          {activePopover === 'where' && (
            <div className="airbnb-search-popover">
              <div className="airbnb-popover-title">
                <span>Select Area or University</span>
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => setActiveArea('')} style={{ fontSize: '11px', height: '28px' }}>Clear</button>
              </div>
              <input
                type="text"
                className="input mb-14"
                placeholder="Type campus (e.g. Wits, UP, UJ) or street..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
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

          {activePopover === 'price' && (
            <div className="airbnb-search-popover">
              <div className="airbnb-popover-title">
                <span>Monthly Rent Budget</span>
                <b style={{ color: 'var(--green-ink)', fontSize: '15px' }}>
                  {maxPrice >= 12000 ? 'Any budget' : `Up to R${maxPrice.toLocaleString('en-ZA')} / mo`}
                </b>
              </div>
              <div className="airbnb-price-box">
                <div className="airbnb-price-slider-wrap">
                  <input
                    type="range"
                    min="2500"
                    max="12000"
                    step="250"
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-3)', fontWeight: 600 }}>
                    <span>R2,500</span>
                    <span>R6,000</span>
                    <span>R9,000</span>
                    <span>No limit</span>
                  </div>
                </div>

                <div className="airbnb-price-presets">
                  <button
                    type="button"
                    className={`map-drawer-pill ${maxPrice >= 12000 ? 'is-active' : ''}`}
                    onClick={() => setMaxPrice(12000)}
                  >
                    Any price
                  </button>
                  <button
                    type="button"
                    className={`map-drawer-pill ${maxPrice === 5000 ? 'is-active' : ''}`}
                    onClick={() => setMaxPrice(5000)}
                  >
                    &lt; R5,000
                  </button>
                  <button
                    type="button"
                    className={`map-drawer-pill ${maxPrice === 6500 ? 'is-active' : ''}`}
                    onClick={() => setMaxPrice(6500)}
                  >
                    &lt; R6,500
                  </button>
                  <button
                    type="button"
                    className={`map-drawer-pill ${maxPrice === 8000 ? 'is-active' : ''}`}
                    onClick={() => setMaxPrice(8000)}
                  >
                    &lt; R8,000
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePopover === 'pref' && (
            <div className="airbnb-search-popover">
              <div className="airbnb-popover-title">
                <span>Living Preferences & Amenities</span>
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => setActiveCategory('all')} style={{ fontSize: '11px', height: '28px' }}>Reset</button>
              </div>
              <div className="airbnb-popover-grid">
                {CATEGORIES.slice(1).map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`airbnb-popover-pill ${activeCategory === cat.id ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveCategory(prev => prev === cat.id ? 'all' : cat.id);
                        setActivePopover(null);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Icon size={16} strokeWidth={2} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Category Icon Tabs Bar (Airbnb Style) ── */}
      <nav className="airbnb-categories-bar" aria-label="Accommodation category filters">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              className={`airbnb-cat-tab ${activeCategory === cat.id ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="airbnb-cat-icon">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="airbnb-cat-label">{cat.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Feed Bar: Count & Active Filters ── */}
      <div className="airbnb-feed-bar" ref={listingsRef}>
        <div className="airbnb-feed-count">
          {filteredProperties.length} <span>places available</span>
        </div>

        {hasActiveFilters && (
          <div className="airbnb-active-chips">
            {activeArea && (
              <button type="button" className="airbnb-chip" onClick={() => setActiveArea('')}>
                <MapPin size={12} />
                <span>{activeArea}</span>
                <X size={12} />
              </button>
            )}
            {searchQuery && (
              <button type="button" className="airbnb-chip" onClick={() => setSearchQuery('')}>
                <span>"{searchQuery}"</span>
                <X size={12} />
              </button>
            )}
            {maxPrice < 12000 && (
              <button type="button" className="airbnb-chip" onClick={() => setMaxPrice(12000)}>
                <Banknote size={12} />
                <span>≤ R{maxPrice.toLocaleString('en-ZA')}</span>
                <X size={12} />
              </button>
            )}
            {activeCategory !== 'all' && (() => {
              const activeCatObj = CATEGORIES.find(c => c.id === activeCategory);
              const ActiveIcon = activeCatObj?.icon;
              return (
                <button type="button" className="airbnb-chip" onClick={() => setActiveCategory('all')}>
                  {ActiveIcon && <ActiveIcon size={12} strokeWidth={2.2} />}
                  <span>{activeCatObj?.label}</span>
                  <X size={12} />
                </button>
              );
            })()}
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
            <AirbnbPropertyCard
              key={item.id}
              item={item}
              saved={saved}
              compared={compared}
            />
          ))}
        </main>
      )}

      {/* ── Floating Airbnb Show Map Pill Button ── */}
      <Link to="/search" className="airbnb-float-map-btn" aria-label="Open accommodation map search">
        <Map size={16} />
        <span>Show map</span>
      </Link>
    </div>
  );
};
