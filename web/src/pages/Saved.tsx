import React from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { PropertyCard } from '../components/PropertyCard';
import { INITIAL_PROPERTIES } from '../data/mockData';

export const Saved: React.FC = () => {
  const { savedIds } = useCompare();

  const savedProps = savedIds.map(id => INITIAL_PROPERTIES.find(p => p.id === id)).filter(Boolean);

  return (
    <div className="wrap" style={{ maxWidth: '1160px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>
          Saved Accommodation ({savedProps.length})
        </h1>
        <span className="tiny muted">Your shortlisted properties around Wits</span>
      </div>

      {savedProps.length === 0 ? (
        <div className="card card--pad tc">
          <h3>You haven't saved any accommodation yet</h3>
          <p className="tiny muted mt-6">Click the heart icon on any listing to save it here for later.</p>
          <Link to="/search" className="btn btn--navy mt-16" style={{ textDecoration: 'none' }}>
            Find Accommodation
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {savedProps.map(p => (
            <PropertyCard key={p!.id} property={p!} />
          ))}
        </div>
      )}
    </div>
  );
};

