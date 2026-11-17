import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyCard } from '../components/PropertyCard';
import { getProperties, seedPropertiesToFirestore } from '../services/propertyService';
import { Property } from '../types';
import { isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import researchProperties from '../data/researchProperties.json';
import { ResearchBrowseSections } from './Research';

export const Landing: React.FC = () => {
  const { role } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [homeQuery, setHomeQuery] = useState('');
  const matchingResearch = researchProperties.filter(item => {
    const needle = homeQuery.trim().toLocaleLowerCase();
    return !needle || [item.name, item.provider, item.address, item.locality, item.region].some(value => value.toLocaleLowerCase().includes(needle));
  });

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
              <a href="#places" className="btn btn--ghost" style={{ textDecoration: 'none', padding: '14px 24px' }}>
                Explore All Places
              </a>
            </div>
          </div>

          {/* Quick Features Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
            <div className="card card--pad" style={{ background: '#fff' }}>
              <b style={{ color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>Research with sources</b>
              <p className="tiny muted">Read provider claims alongside source links, verification notes and unresolved gaps.</p>
            </div>
            <div className="card card--pad" style={{ background: '#fff' }}>
              <b style={{ color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>Advertised prices</b>
              <p className="tiny muted">See the original room and price basis, then confirm current rates with the provider.</p>
            </div>
            <div className="card card--pad" style={{ background: '#fff' }}>
              <b style={{ color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>Location confidence</b>
              <p className="tiny muted">Map points show coordinate precision; unlocated properties remain searchable by address.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="places" className="home-research-section">
        <div className="home-research-intro">
          <div><span className="pill pill--amber">Res Data · Gauteng</span><h2>Find your place</h2><p>Explore {researchProperties.length} researched accommodation records. Confirm prices, availability and funding with the provider before applying.</p></div>
          <Link to="/search" className="btn btn--ghost">Open map search →</Link>
        </div>
        <label className="home-research-filter">Search by name, provider or area<input value={homeQuery} onChange={event => setHomeQuery(event.target.value)} placeholder="Try Braamfontein or Campus Africa" /></label>
        <p className="research-count">{matchingResearch.length} matching properties · <Link to="/compare">Compare selected →</Link></p>
        <ResearchBrowseSections key={homeQuery} items={matchingResearch} initialCount={12} />
      </section>

      <section style={{ padding: '0 0 48px', maxWidth: '1160px', margin: '0 auto' }}>
        <div className="wrap" style={{ padding: '0 24px' }}>
          <h2 style={{ fontSize: '22px', color: 'var(--navy)' }}>Original demo listings</h2>
          <p className="tiny muted">These sample listings are fictional and show how StaySure's booking features work.</p>

          {isFirebaseConfigured && role === 'admin' && (
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '20px' }}>
            {properties.slice(0, 3).map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

