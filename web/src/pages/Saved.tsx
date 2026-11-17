import React from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { PropertyCard } from '../components/PropertyCard';
import { INITIAL_PROPERTIES } from '../data/mockData';
import researchProperties from '../data/researchProperties.json';
import { useResearchSelection } from '../data/researchSelection';
import { researchImages, researchFallbackImage } from '../data/researchMedia';
import { researchPriceSummary } from '../data/researchPricing';

export const Saved: React.FC = () => {
  const { savedIds } = useCompare();
  const researchSaved = useResearchSelection('saved');
  const researchCompared = useResearchSelection('compare');
  const researched = researchSaved.ids.map(id => researchProperties.find(item => item.id === id)).filter((item): item is (typeof researchProperties)[number] => Boolean(item));

  const savedProps = savedIds.map(id => INITIAL_PROPERTIES.find(p => p.id === id)).filter(Boolean);

  return (
    <div className="wrap" style={{ maxWidth: '1160px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>
          Saved Accommodation ({researched.length + savedProps.length})
        </h1>
        <span className="tiny muted">Your researched shortlist and original demo saves</span>
      </div>

      {researched.length > 0 && <section style={{ marginBottom: '32px' }}><h2 style={{ color: 'var(--navy)' }}>Researched properties</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>{researched.map(item => <article key={item.id} className="card research-teaser"><div className="research-teaser-media"><img src={researchImages(item.id)[0]} onError={event => { event.currentTarget.src = researchFallbackImage; }} alt={`Illustrative accommodation image for ${item.name}`} /><span className="research-photo-label">Illustrative image</span></div><div className="research-teaser-content"><span className="pill pill--amber">Research record</span><h3>{item.name}</h3><p className="research-teaser-price">{researchPriceSummary(item.advertisedPrice)?.label ?? 'Price not listed'} <small>{researchPriceSummary(item.advertisedPrice) ? 'advertised; confirm basis' : 'ask provider for rent'}</small></p><p className="tiny muted">{item.address}, {item.locality}</p><div className="research-card-actions"><Link to={`/research/${item.id}`} className="rail-card-details-btn">View details <span className="arrow-glyph">→</span></Link><button type="button" className="btn btn--sm btn--ghost" onClick={() => researchCompared.toggle(item.id)} disabled={!researchCompared.ids.includes(item.id) && researchCompared.ids.length >= 3}>{researchCompared.ids.includes(item.id) ? '✓ Comparing' : 'Compare'}</button><button type="button" className="btn btn--sm btn--ghost" onClick={() => researchSaved.toggle(item.id)}>Remove</button></div></div></article>)}</div><p><Link to="/compare">View comparison ({researchCompared.ids.length}) →</Link></p></section>}

      {savedProps.length === 0 && researched.length === 0 ? (
        <div className="card card--pad tc">
          <h3>You haven't saved any accommodation yet</h3>
          <p className="tiny muted mt-6">Click the heart icon on any listing to save it here for later.</p>
          <Link to="/search" className="btn btn--navy mt-16" style={{ textDecoration: 'none' }}>
            Find Accommodation
          </Link>
        </div>
      ) : savedProps.length > 0 ? (
        <section><h2 style={{ color: 'var(--navy)' }}>Original demo listings</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {savedProps.map(p => (
            <PropertyCard key={p!.id} property={p!} />
          ))}
        </div></section>
      ) : (
        null
      )}
    </div>
  );
};

