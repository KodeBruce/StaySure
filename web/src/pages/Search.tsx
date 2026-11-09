import React, { useEffect, useState } from 'react';
import { PropertyCard } from '../components/PropertyCard';
import { getProperties } from '../services/propertyService';
import { Property, FilterState } from '../types';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore } from '../data/matchScore';

export const Search: React.FC = () => {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    min: 1500,
    max: 6000,
    dist: [],
    verified: false,
    accredited: false,
    nsfas: false,
    self: false,
    facilities: [],
    types: [],
    location: '',
    sort: 'best'
  });

  useEffect(() => {
    getProperties().then(data => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  const filteredProperties = properties.filter(p => {
    if (p.price < filters.min || p.price > filters.max) return false;
    if (filters.verified && !p.verified) return false;
    if (filters.nsfas && !p.nsfas) return false;
    if (filters.types.length > 0 && !filters.types.includes(p.type)) return false;
    if (filters.location && p.area !== filters.location) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === 'price-asc') return a.price - b.price;
    if (filters.sort === 'price-desc') return b.price - a.price;
    if (filters.sort === 'dist') return a.distanceKm - b.distanceKm;
    // 'best' match score
    const scoreA = calculateMatchScore(a, profile).score;
    const scoreB = calculateMatchScore(b, profile).score;
    return scoreB - scoreA;
  });

  return (
    <div className="wrap" style={{ maxWidth: '1160px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
          Find your student home near Wits
        </h1>
        <span className="tiny muted">
          Personalised for your {profile.budget ? `R${profile.budget} budget` : "preferences"} · {filteredProperties.length} places available
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Filters Sidebar */}
        <aside className="card card--pad" style={{ background: '#fff' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--navy)' }}>Filters</h3>

          <div className="field" style={{ marginBottom: '16px' }}>
            <label>Max Monthly Rent: R{filters.max.toLocaleString('en-ZA')}</label>
            <input
              type="range"
              min="1500"
              max="6000"
              step="100"
              value={filters.max}
              onChange={e => setFilters(prev => ({ ...prev, max: Number(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="field" style={{ marginBottom: '16px' }}>
            <label>Area</label>
            <select
              className="input"
              value={filters.location}
              onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
            >
              <option value="">All Areas</option>
              <option value="Braamfontein">Braamfontein</option>
              <option value="Parktown">Parktown</option>
              <option value="Milpark">Milpark</option>
              <option value="Auckland Park">Auckland Park</option>
              <option value="Melville">Melville</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <label className="row" style={{ gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={e => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
              />
              StaySure Verified only
            </label>
            <label className="row" style={{ gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={filters.nsfas}
                onChange={e => setFilters(prev => ({ ...prev, nsfas: e.target.checked }))}
              />
              NSFAS Compatible
            </label>
          </div>

          <button
            className="btn btn--sm btn--ghost"
            style={{ width: '100%' }}
            onClick={() => setFilters({
              min: 1500,
              max: 6000,
              dist: [],
              verified: false,
              accredited: false,
              nsfas: false,
              self: false,
              facilities: [],
              types: [],
              location: '',
              sort: 'best'
            })}
          >
            Reset Filters
          </button>
        </aside>

        {/* Results Section */}
        <div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="tiny muted">{filteredProperties.length} accommodation listings</span>
            <div className="row" style={{ gap: '8px' }}>
              <span className="tiny muted">Sort by:</span>
              <select
                className="input"
                style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                value={filters.sort}
                onChange={e => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
              >
                <option value="best">Best Match Score</option>
                <option value="price-asc">Lowest Price</option>
                <option value="price-desc">Highest Price</option>
                <option value="dist">Closest to Campus</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="card card--pad tc muted">Loading accommodation options...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="card card--pad tc">
              <b>No accommodation matches your selected filters.</b>
              <p className="tiny muted mt-6">Try raising your budget or clearing area filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' }}>
              {filteredProperties.map(p => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

