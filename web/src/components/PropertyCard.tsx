import React from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { calculateMatchScore, formatRand, formatKm } from '../data/matchScore';
import { Check, Plus, Heart, GraduationCap } from 'lucide-react';
import { getPropertyUniversities } from '../data/mapLocations';

interface PropertyCardProps {
  property: Property;
  onOpen?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property: p, onOpen }) => {
  const { profile } = useAuth();
  const { compareIds, addToCompare, removeFromCompare, savedIds, toggleSave } = useCompare();

  const { score } = calculateMatchScore(p, profile);
  const isCompared = compareIds.includes(p.id);
  const isSaved = savedIds.includes(p.id);
  const nearUnis = getPropertyUniversities(p);

  return (
    <div className="card property-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '18px', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)' }}>
      <div style={{ position: 'relative', width: '100%', height: '180px', background: '#eee', overflow: 'hidden' }}>
        {onOpen && <button type="button" onClick={() => onOpen(p.id)} aria-label={`Preview ${p.name}`} style={{ position: 'absolute', inset: 0, zIndex: 1, border: 0, background: 'transparent', cursor: 'pointer' }} />}
        <img
          src={p.images[0] || '/images/p1.jpg'}
          alt={p.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Top-Right Pure Minimalist + (To Replace Compare button, no oval) */}
        <button
          type="button"
          onClick={() => (isCompared ? removeFromCompare(p.id) : addToCompare(p.id))}
          title={isCompared ? `Remove ${p.name} from comparison` : `Compare ${p.name}`}
          aria-label={isCompared ? `Remove ${p.name} from comparison` : `Compare ${p.name}`}
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
          onClick={() => toggleSave(p.id)}
          title={isSaved ? "Saved" : "Save property"}
          aria-label={isSaved ? "Saved" : "Save property"}
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

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: '16.5px', margin: 0, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em' }}>
            <Link to={`/detail/${p.id}`} onClick={event => { if (onOpen) { event.preventDefault(); onOpen(p.id); } }} style={{ textDecoration: 'none', color: 'inherit' }}>
              {p.name}
            </Link>
          </h3>
          <span className="tiny muted" style={{ fontWeight: 700, fontSize: '11.5px', color: '#475569' }}>★ {p.rating} ({p.reviewsCount})</span>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <b style={{ fontSize: '18px', color: '#059669', fontFamily: 'var(--display)' }}>{formatRand(p.price)}</b>
            <span className="tiny muted" style={{ fontSize: '11px', marginLeft: '2px' }}>/mo</span>
          </div>
          <span className="tiny muted" style={{ fontSize: '11.5px' }}>{formatKm(p.distanceKm)} from Wits</span>
        </div>

        <div className="row row--wrap" style={{ gap: '5px' }}>
          {nearUnis.length > 0 && (
            <span
              className="pill"
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid rgba(34, 197, 94, 0.28)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title={`Near ${nearUnis.map(u => u.fullName).join(', ')}`}
            >
              <GraduationCap size={11} strokeWidth={2.4} /> Near {nearUnis.map(u => u.shortName).join(' & ')}
            </span>
          )}

          {p.verified ? (
            <span className="pill pill--green" style={{ fontSize: '10.5px', padding: '2px 7px' }}>Verified ✓</span>
          ) : (
            <span className="pill pill--amber" style={{ fontSize: '10.5px', padding: '2px 7px' }}>Pending</span>
          )}

          {p.nsfas && (
            <span className="pill pill--navy" style={{ fontSize: '10.5px', padding: '2px 7px' }}>NSFAS</span>
          )}
          {p.tour?.status === 'published' && (
            <span className="pill pill--green" style={{ fontSize: '10.5px', padding: '2px 7px' }}>3D Tour</span>
          )}
        </div>

        {/* Card Footer: Clean "View details →" (NO line, neat font) */}
        <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end', borderTop: 'none' }}>
          <Link
            to={`/detail/${p.id}`}
            onClick={event => { if (onOpen) { event.preventDefault(); onOpen(p.id); } }}
            className="rail-card-details-link"
            aria-label={`View details for ${p.name}`}
          >
            View details <span className="arrow-glyph">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

