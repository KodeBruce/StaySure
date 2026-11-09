import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { getPropertyById } from '../services/propertyService';
import { Property } from '../types';
import { formatRand, formatKm } from '../data/matchScore';

export const Compare: React.FC = () => {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(compareIds.map(id => getPropertyById(id))).then(results => {
      setProperties(results.filter(Boolean) as Property[]);
      setLoading(false);
    });
  }, [compareIds]);

  if (loading) {
    return <div className="wrap card card--pad tc mt-32">Loading comparison...</div>;
  }

  if (properties.length === 0) {
    return (
      <div className="wrap card card--pad tc mt-32" style={{ maxWidth: '600px' }}>
        <h2 style={{ color: 'var(--navy)' }}>No properties selected for comparison</h2>
        <p className="tiny muted mt-6">Select 2 or 3 properties from search results to compare their price, facilities, and distance.</p>
        <Link to="/search" className="btn btn--navy mt-16" style={{ textDecoration: 'none' }}>
          Explore Places
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: '1160px', margin: '32px auto', padding: '0 24px' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>
            Compare Accommodation ({properties.length}/3)
          </h1>
          <span className="tiny muted">Side-by-side decision support for Wits students</span>
        </div>
        <button className="btn btn--sm btn--ghost" onClick={clearCompare}>
          Clear All
        </button>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '18px', border: '1px solid var(--line)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '20px', width: '220px', borderBottom: '2px solid var(--line)', background: 'var(--navy-tint)' }}>
                Feature
              </th>
              {properties.map(p => (
                <th key={p.id} style={{ padding: '20px', borderBottom: '2px solid var(--line)', minWidth: '240px' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      style={{ position: 'absolute', top: '-10px', right: 0, background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                      title="Remove"
                    >
                      ×
                    </button>
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '120px', borderRadius: '10px', objectFit: 'cover' }} />
                    <h4 style={{ margin: '10px 0 4px', fontSize: '16px', color: 'var(--navy)' }}>{p.name}</h4>
                    <span className="tiny muted">{p.area}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid var(--line)', background: 'var(--navy-tint)' }}>Monthly Rent</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', fontWeight: 800, color: 'var(--navy)', fontSize: '18px' }}>
                  {formatRand(p.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid var(--line)', background: 'var(--navy-tint)' }}>Distance to Wits</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                  {formatKm(p.distanceKm)} ({p.walkMin} min walk)
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid var(--line)', background: 'var(--navy-tint)' }}>Verification</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                  {p.verified ? (
                    <span className="pill pill--green">StaySure Verified ✓</span>
                  ) : (
                    <span className="pill pill--amber">Pending ({p.passedChecks}/6)</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid var(--line)', background: 'var(--navy-tint)' }}>NSFAS Compatible</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                  {p.nsfas ? "Yes ✓" : "Self-funded only"}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid var(--line)', background: 'var(--navy-tint)' }}>Room Type</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                  {p.type}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid var(--line)', background: 'var(--navy-tint)' }}>Facilities</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                  <div className="row row--wrap" style={{ gap: '4px' }}>
                    {p.facilities.map(f => (
                      <span key={f} className="chip" style={{ fontSize: '11px' }}>{f}</span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '20px', background: 'var(--navy-tint)' }}>Action</td>
              {properties.map(p => (
                <td key={p.id} style={{ padding: '20px' }}>
                  <Link to={`/apply/${p.id}`} className="btn btn--green btn--sm" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    Apply Here
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

