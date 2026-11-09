import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyCard } from '../components/PropertyCard';
import { getProperties, seedPropertiesToFirestore } from '../services/propertyService';
import { Property } from '../types';
import { isFirebaseConfigured } from '../firebase/config';

export const Landing: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    getProperties().then(setProperties);
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    const res = await seedPropertiesToFirestore();
    if (res.error) {
      setSeedMsg(`Seed failed: ${res.error}`);
    } else {
      setSeedMsg(`Successfully uploaded ${res.count} listings to your Firestore database!`);
      const updated = await getProperties();
      setProperties(updated);
    }
    setSeeding(false);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(180deg, var(--navy-tint) 0%, #fff 100%)', padding: '64px 0 48px' }}>
        <div className="wrap" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: '720px' }}>
            <span className="pill pill--green" style={{ marginBottom: '16px', display: 'inline-block' }}>
              Now live for Wits students · Johannesburg
            </span>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
              Find accommodation you can <span style={{ color: 'var(--green-ink)' }}>trust.</span>
            </h1>
            <p className="sub" style={{ fontSize: '18px', color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 28px' }}>
              Search, compare and verify student accommodation around Wits, based on your budget, location and needs.
            </p>

            <div className="row row--wrap" style={{ gap: '12px' }}>
              <Link to="/search" className="btn btn--green" style={{ textDecoration: 'none', padding: '14px 28px' }}>
                Find My Accommodation →
              </Link>
              <Link to="/search" className="btn btn--ghost" style={{ textDecoration: 'none', padding: '14px 24px' }}>
                Explore All Places
              </Link>
            </div>
          </div>

          {/* Quick Features Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
            <div className="card card--pad" style={{ background: '#fff' }}>
              <b style={{ color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>Verified Listings</b>
              <p className="tiny muted">Independently inspected by the StaySure team. Checked for security and true distance to campus.</p>
            </div>
            <div className="card card--pad" style={{ background: '#fff' }}>
              <b style={{ color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>Budget-Friendly Options</b>
              <p className="tiny muted">Total monthly cost calculations including transport and utilities, not just rent.</p>
            </div>
            <div className="card card--pad" style={{ background: '#fff' }}>
              <b style={{ color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>Student-Focused Support</b>
              <p className="tiny muted">NSFAS compatibility indicators and side-by-side comparison for informed decision making.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section style={{ padding: '48px 0', maxWidth: '1160px', margin: '0 auto' }}>
        <div className="wrap" style={{ padding: '0 24px' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                Featured Accommodation Near Campus
              </h2>
              <span className="tiny muted">Verified residences and apartments within walking distance of Wits</span>
            </div>
            <Link to="/search" className="btn btn--sm btn--ghost" style={{ textDecoration: 'none' }}>
              View all ({properties.length})
            </Link>
          </div>

          {isFirebaseConfigured && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--navy-tint)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="tiny">
                <b>Firebase Connected:</b> Sync listings to your Firestore collection.
              </span>
              <button className="btn btn--sm btn--navy" onClick={handleSeed} disabled={seeding}>
                {seeding ? "Syncing..." : "Seed to Firestore"}
              </button>
            </div>
          )}
          {seedMsg && <div className="pill pill--green mb-18">{seedMsg}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {properties.slice(0, 3).map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

