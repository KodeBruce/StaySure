import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { INITIAL_PROPERTIES } from '../data/mockData';

export const CompareTray: React.FC = () => {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const location = useLocation();

  const isVisible = compareIds.length > 0 && !/^\/(search|compare)\/?$/.test(location.pathname);

  React.useEffect(() => {
    document.body.classList.toggle('has-compare-tray', isVisible);
    return () => {
      document.body.classList.remove('has-compare-tray');
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const comparedProps = compareIds.map(id => INITIAL_PROPERTIES.find(p => p.id === id)).filter(Boolean);

  return (
    <div
      className="compare-tray"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 850,
        background: 'var(--navy)',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        width: 'min(500px, calc(100vw - 20px))'
      }}
    >
      <div className="row" style={{ gap: '10px' }}>
        {comparedProps.map(p => (
          <div key={p!.id} style={{ position: 'relative' }}>
            <img
              src={p!.images[0]}
              alt={p!.name}
              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <button
              onClick={() => removeFromCompare(p!.id)}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#fff',
                color: '#13234F',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: 3 - compareIds.length }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: '2px dashed rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)'
            }}
          >
            +
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>
          {compareIds.length} of 3 selected
        </div>
        <div className="tiny" style={{ opacity: 0.7 }}>
          {compareIds.length < 2 ? "Select at least 2 to compare" : "Ready to compare"}
        </div>
      </div>

      <div className="row" style={{ gap: '8px' }}>
        <button
          onClick={clearCompare}
          className="btn btn--sm"
          style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Clear
        </button>
        {compareIds.length < 2 ? <button type="button" className="btn btn--sm btn--green" disabled>Compare Now</button> :
          <Link to="/compare" className="btn btn--sm btn--green" style={{ textDecoration: 'none' }}>Compare Now</Link>}
      </div>
    </div>
  );
};

