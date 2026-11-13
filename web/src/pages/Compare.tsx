import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { getPropertyById } from '../services/propertyService';
import { Property } from '../types';
import { formatRand, formatKm } from '../data/matchScore';
import {
  CheckCircle2, Clock, MapPin, ShieldCheck, Banknote,
  BedDouble, Zap, X, ArrowRight, Star, Info,
} from 'lucide-react';

/* ── Helpers ── */
function Badge({ green, label }: { green: boolean; label: string }) {
  return (
    <span className={`cmp-badge ${green ? 'cmp-badge--green' : 'cmp-badge--amber'}`}>
      {green ? <CheckCircle2 size={12} /> : <Info size={12} />}
      {label}
    </span>
  );
}

function BestTag() {
  return <span className="cmp-best-tag"><Star size={10} /> Best value</span>;
}

function Row({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="cmp-row">
      <div className="cmp-row-label">
        <span className="cmp-row-icon">{icon}</span>
        {label}
      </div>
      <div className="cmp-row-cells">{children}</div>
    </div>
  );
}

export const Compare: React.FC = () => {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(compareIds.map(id => getPropertyById(id))).then(results => {
      setProperties(results.filter(Boolean) as Property[]);
      setLoading(false);
    });
  }, [compareIds]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="cmp-empty-wrap">
        <div className="cmp-empty-card">
          <div className="cmp-spinner" />
          <p>Loading comparison…</p>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (properties.length === 0) {
    return (
      <div className="cmp-empty-wrap">
        <div className="cmp-empty-card">
          <div className="cmp-empty-icon"><BedDouble size={32} /></div>
          <h2>Nothing to compare yet</h2>
          <p>Add 2 or 3 places from search results, then come back here to compare price, distance, facilities and more.</p>
          <Link to="/search" className="btn btn--navy">Explore places</Link>
        </div>
      </div>
    );
  }

  /* ── Derived "best" values ── */
  const minPrice = Math.min(...properties.map(p => p.price));
  const minDist  = Math.min(...properties.map(p => p.distanceKm ?? Infinity));

  return (
    <div className="cmp-page screen">
      {/* Header */}
      <div className="cmp-header">
        <div>
          <h1 className="cmp-title">Compare</h1>
          <p className="cmp-sub">{properties.length} place{properties.length > 1 ? 's' : ''} selected · side-by-side</p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={clearCompare}>
          <X size={14} /> Clear all
        </button>
      </div>

      {/* Scrollable compare grid */}
      <div className="cmp-scroll-wrap">
        <div className="cmp-grid" style={{ '--cols': properties.length } as React.CSSProperties}>

          {/* ── Property header cards ── */}
          <div className="cmp-label-col" aria-hidden="true" />
          {properties.map(p => (
            <div key={p.id} className="cmp-prop-head">
              <button
                className="cmp-remove"
                onClick={() => removeFromCompare(p.id)}
                title={`Remove ${p.name}`}
                aria-label={`Remove ${p.name} from comparison`}
              >
                <X size={14} />
              </button>
              <img src={p.images[0] || '/images/p1.jpg'} alt={p.name} className="cmp-prop-img" />
              <div className="cmp-prop-info">
                <strong className="cmp-prop-name">{p.name}</strong>
                <span className="cmp-prop-area"><MapPin size={11} />{p.area}</span>
              </div>
            </div>
          ))}

          {/* ── Monthly rent ── */}
          <div className="cmp-row-label-cell">
            <span className="cmp-row-icon"><Banknote size={15} /></span>Monthly rent
          </div>
          {properties.map(p => (
            <div key={p.id} className={`cmp-cell ${p.price === minPrice ? 'cmp-cell--best' : ''}`}>
              <span className="cmp-price">{formatRand(p.price)}<em>/mo</em></span>
              {p.price === minPrice && properties.length > 1 && <BestTag />}
            </div>
          ))}

          {/* ── Distance ── */}
          <div className="cmp-row-label-cell">
            <span className="cmp-row-icon"><MapPin size={15} /></span>Distance to Wits
          </div>
          {properties.map(p => (
            <div key={p.id} className={`cmp-cell ${p.distanceKm === minDist ? 'cmp-cell--best' : ''}`}>
              <span className="cmp-val">{formatKm(p.distanceKm)}</span>
              <span className="cmp-sub-val"><Clock size={11} /> {p.walkMin} min walk</span>
              {p.distanceKm === minDist && properties.length > 1 && <BestTag />}
            </div>
          ))}

          {/* ── Room type ── */}
          <div className="cmp-row-label-cell">
            <span className="cmp-row-icon"><BedDouble size={15} /></span>Room type
          </div>
          {properties.map(p => (
            <div key={p.id} className="cmp-cell">
              <span className="cmp-val">{p.type}</span>
            </div>
          ))}

          {/* ── Verification ── */}
          <div className="cmp-row-label-cell">
            <span className="cmp-row-icon"><ShieldCheck size={15} /></span>Verification
          </div>
          {properties.map(p => (
            <div key={p.id} className="cmp-cell">
              <Badge
                green={p.verified}
                label={p.verified ? 'Verified ✓' : `Pending (${p.passedChecks}/6)`}
              />
            </div>
          ))}

          {/* ── NSFAS ── */}
          <div className="cmp-row-label-cell">
            <span className="cmp-row-icon"><CheckCircle2 size={15} /></span>NSFAS
          </div>
          {properties.map(p => (
            <div key={p.id} className="cmp-cell">
              <Badge green={p.nsfas} label={p.nsfas ? 'Compatible' : 'Self-funded only'} />
            </div>
          ))}

          {/* ── Facilities ── */}
          <div className="cmp-row-label-cell cmp-row-label-cell--top">
            <span className="cmp-row-icon"><Zap size={15} /></span>Facilities
          </div>
          {properties.map(p => (
            <div key={p.id} className="cmp-cell cmp-cell--wrap">
              {p.facilities.length > 0
                ? p.facilities.map(f => <span key={f} className="cmp-fac-chip">{f}</span>)
                : <span className="cmp-muted">Not listed</span>}
            </div>
          ))}

          {/* ── Action ── */}
          <div className="cmp-row-label-cell" />
          {properties.map(p => (
            <div key={p.id} className="cmp-cell cmp-cell--action">
              <Link to={`/detail/${p.id}`} className="btn btn--ghost btn--sm cmp-btn-detail">
                View details
              </Link>
              <Link to={`/apply/${p.id}`} className="btn btn--green btn--sm cmp-btn-apply">
                Apply <ArrowRight size={13} />
              </Link>
            </div>
          ))}

        </div>
      </div>

      {/* Add more prompt if < 3 */}
      {properties.length < 3 && (
        <div className="cmp-add-more">
          <span>Add up to {3 - properties.length} more place{3 - properties.length > 1 ? 's' : ''} to compare</span>
          <Link to="/search" className="btn btn--navy btn--sm">+ Search places</Link>
        </div>
      )}
    </div>
  );
};
