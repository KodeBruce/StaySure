import React from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { calculateMatchScore, formatRand, formatKm } from '../data/matchScore';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property: p }) => {
  const { profile } = useAuth();
  const { compareIds, addToCompare, savedIds, toggleSave } = useCompare();

  const { score } = calculateMatchScore(p, profile);
  const isCompared = compareIds.includes(p.id);
  const isSaved = savedIds.includes(p.id);

  return (
    <div className="card property-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', height: '180px', background: '#eee' }}>
        <img
          src={p.images[0] || '/images/p1.jpg'}
          alt={p.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          {score >= 78 ? (
            <span className="pill pill--navy" style={{ fontSize: '11px', padding: '4px 8px' }}>
              ✦ {score}% Match
            </span>
          ) : (
            <span className="pill" style={{ background: 'rgba(255,255,255,0.9)', fontSize: '11px', padding: '4px 8px' }}>
              {p.type}
            </span>
          )}
        </div>

        <button
          className="btn-icon"
          onClick={() => toggleSave(p.id)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '34px',
            height: '34px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer'
          }}
          title={isSaved ? "Saved" : "Save property"}
        >
          <span style={{ color: isSaved ? '#e02424' : 'var(--ink-2)', fontSize: '16px' }}>
            {isSaved ? '♥' : '♡'}
          </span>
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '10px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: '17px', margin: 0, fontWeight: 700, color: 'var(--navy)' }}>
            <Link to={`/detail/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {p.name}
            </Link>
          </h3>
          <span className="tiny muted">★ {p.rating} ({p.reviewsCount})</span>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <b style={{ fontSize: '20px', color: 'var(--navy)' }}>{formatRand(p.price)}</b>
            <span className="tiny muted">/month</span>
          </div>
          <span className="tiny muted">{formatKm(p.distanceKm)} from Wits</span>
        </div>

        <div className="row row--wrap" style={{ gap: '6px' }}>
          {p.verified ? (
            <span className="pill pill--green" style={{ fontSize: '11px', padding: '2px 8px' }}>StaySure Verified ✓</span>
          ) : (
            <span className="pill pill--amber" style={{ fontSize: '11px', padding: '2px 8px' }}>Verification Pending</span>
          )}

          {p.nsfas && (
            <span className="pill pill--navy" style={{ fontSize: '11px', padding: '2px 8px' }}>NSFAS Compatible</span>
          )}
          {p.tour?.status === 'published' && (
            <span className="pill pill--green" style={{ fontSize: '11px', padding: '2px 8px' }}>3D tour available</span>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Link to={`/detail/${p.id}`} className="btn btn--navy btn--sm" style={{ textAlign: 'center', textDecoration: 'none' }}>
            View Details
          </Link>
          <button
            className={`btn btn--sm ${isCompared ? 'btn--green' : 'btn--ghost'}`}
            onClick={() => addToCompare(p.id)}
          >
            {isCompared ? '✓ Comparing' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
};

