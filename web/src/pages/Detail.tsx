import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPropertyById } from '../services/propertyService';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { calculateMatchScore, formatRand, formatKm } from '../data/matchScore';
import { ScoreRing } from '../components/ScoreRing';

export const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { compareIds, addToCompare, savedIds, toggleSave } = useCompare();

  const [property, setProperty] = useState<Property | null>(null);
  const [selectedImg, setSelectedImg] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getPropertyById(id).then(p => {
        setProperty(p);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <div className="wrap card card--pad tc mt-32">Loading property details...</div>;
  }

  if (!property) {
    return (
      <div className="wrap card card--pad tc mt-32">
        <h2>Property not found</h2>
        <Link to="/search" className="btn btn--navy mt-12">Back to Search</Link>
      </div>
    );
  }

  const { score, reasons } = calculateMatchScore(property, profile);
  const isCompared = compareIds.includes(property.id);
  const isSaved = savedIds.includes(property.id);
  const hasPublishedTour = property.tour?.status === 'published';

  return (
    <div className="wrap" style={{ maxWidth: '1160px', margin: '32px auto', padding: '0 24px' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
        <Link to="/search" className="tiny" style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 700 }}>
          ← Back to results
        </Link>
        <div className="row" style={{ gap: '10px' }}>
          <button className="btn btn--sm btn--ghost" onClick={() => addToCompare(property.id)}>
            {isCompared ? "✓ Compared" : "Add to Compare"}
          </button>
          <button className="btn btn--sm btn--ghost" onClick={() => toggleSave(property.id)}>
            {isSaved ? "♥ Saved" : "♡ Save"}
          </button>
        </div>
      </div>

      {/* Gallery Section */}
          <div className="detail-gallery-grid">
            <div style={{ borderRadius: '18px', overflow: 'hidden', height: '100%', minHeight: '260px' }}>
              <img
                src={property.images[selectedImg] || '/images/p1.jpg'}
                alt={property.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
              <div className="detail-gallery-thumbs" style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '12px', height: '100%' }}>
                {property.images.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImg(idx)}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedImg === idx ? '3px solid var(--navy)' : 'none'
                    }}
                  >
                    <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>

            {hasPublishedTour && (
              <div className="tour-callout">
                <div>
                  <strong>Explore this property in 3D</strong>
                  <p>Look around the spaces captured for this listing before you apply.</p>
                </div>
                <Link className="btn btn--navy" to={`/detail/${property.id}/tour`}>Explore 3D tour →</Link>
              </div>
            )}

            {/* Main Grid: Details + Side Action Card */}
              <div className="detail-main-grid">
                <div>
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div className="row" style={{ gap: '8px', marginBottom: '8px' }}>
                      {property.verified && <span className="pill pill--green">StaySure Verified ✓</span>}
                      {property.nsfas && <span className="pill pill--navy">NSFAS Compatible</span>}
                      <span className="pill pill--ghost">{property.type}</span>
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
                      {property.name}
                    </h1>
                    <p className="tiny muted">
                      {property.area} · {formatKm(property.distanceKm)} from Wits ({property.walkMin} min walk) · ★ {property.rating} ({property.reviewsCount} reviews)
                    </p>
                  </div>

                  {/* Affordability Fit Card */}
                  <div className="card card--pad" style={{ background: 'var(--navy-tint)', marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px', color: 'var(--navy)' }}>
                      Affordability Check
                    </h3>
                    <div className="row" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                      <span>Monthly Rent</span>
                      <b>{formatRand(property.price)}</b>
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', padding: '12px 0' }}>
                      <span>Your Budget Profile</span>
                      <b>{formatRand(profile.budget)}</b>
                    </div>
                    <div className="pill pill--green mt-12" style={{ display: 'block', textAlign: 'center' }}>
                      {property.price <= profile.budget ? "Fits your stated budget ✓" : `R${property.price - profile.budget} above your preferred budget`}
                    </div>
                  </div>

                  {/* About */}
                  <div style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px' }}>About this property</h3>
                    <p style={{ lineHeight: 1.6, color: 'var(--ink)' }}>{property.about}</p>
                  </div>

                  {/* Verification Audit Checklist */}
                  <div className="card card--pad" style={{ marginBottom: '28px', borderLeft: '4px solid var(--green)' }}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--navy)' }}>
                        Why this property is trusted
                      </h3>
                      <span className="tiny muted">{property.passedChecks}/6 Checks Verified</span>
                    </div>
                      <div className="detail-checks-grid">
                        {property.checks.map(c => (
                          <div key={c.id} className="row" style={{ gap: '8px', alignItems: 'flex-start' }}>
                            <span style={{ color: c.ok ? 'var(--green-ink)' : 'var(--amber-ink)', fontWeight: 'bold' }}>
                              {c.ok ? '✓' : '○'}
                            </span>
                            <div>
                              <b style={{ fontSize: '13px', display: 'block' }}>{c.name}</b>
                              <span className="tiny muted">{c.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Security Features */}
                    <div style={{ marginBottom: '28px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>Security & Safety</h3>
                      <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                        {property.security.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Sticky Action Side Card */}
                  <aside className="card card--pad" style={{ position: 'sticky', top: '90px', background: '#fff' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <b style={{ fontSize: '28px', color: 'var(--navy)' }}>{formatRand(property.price)}</b>
                        <span className="tiny muted">/month</span>
                      </div>
                      <ScoreRing score={score} size={54} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <b style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Why this match?</b>
                      <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                        {reasons.map((r, i) => (
                          <li key={i} style={{ color: r.ok ? 'inherit' : 'var(--amber-ink)' }}>{r.text}</li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={`/apply/${property.id}`}
                      className="btn btn--green"
                      style={{ width: '100%', textAlign: 'center', textDecoration: 'none', padding: '14px 0', fontSize: '16px', marginBottom: '10px' }}
                    >
                      Apply Now
                    </Link>
                    <button
                      className="btn btn--ghost"
                      style={{ width: '100%' }}
                      onClick={() => addToCompare(property.id)}
                    >
                      {isCompared ? "✓ In Comparison Tray" : "Add to Compare"}
                    </button>
                  </aside>
                </div>
              </div>
              );
};

