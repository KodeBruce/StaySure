import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { INITIAL_PROPERTIES } from '../data/mockData';
import researchProperties from '../data/researchProperties.json';
import { researchImages, researchFallbackImage } from '../data/researchMedia';
import { X } from 'lucide-react';

export const CompareTray: React.FC = () => {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const location = useLocation();

  const isVisible = compareIds.length > 0 && !/^\/(search|compare|research)(\/|$)/.test(location.pathname);

  React.useEffect(() => {
    document.body.classList.toggle('has-compare-tray', isVisible);
    return () => {
      document.body.classList.remove('has-compare-tray');
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const comparedProps = compareIds.map(id => {
    const research = (researchProperties as any[]).find(p => p.id === id);
    if (research) {
      return {
        id: research.id,
        name: research.name,
        image: researchImages(research.id)[0] || researchFallbackImage
      };
    }
    const mock = INITIAL_PROPERTIES.find(p => p.id === id);
    if (mock) {
      return {
        id: mock.id,
        name: mock.name,
        image: mock.images[0] || researchFallbackImage
      };
    }
    return null;
  }).filter((p): p is { id: string; name: string; image: string } => Boolean(p));

  return (
    <div
      className="compare-tray"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 850,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        width: 'min(520px, calc(100vw - 24px))'
      }}
    >
      <div className="row" style={{ gap: '8px' }}>
        {comparedProps.map(p => (
          <div key={p.id} style={{ position: 'relative' }}>
            <img
              src={p.image}
              alt={p.name}
              onError={e => { e.currentTarget.src = researchFallbackImage; }}
              style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <button
              onClick={() => removeFromCompare(p.id)}
              aria-label={`Remove ${p.name} from comparison`}
              title={`Remove ${p.name}`}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))',
                transition: 'transform 0.15s ease'
              }}
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        ))}
        {Array.from({ length: 3 - comparedProps.length }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px dashed rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)'
            }}
          >
            +
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {comparedProps.length} of 3 selected
        </div>
        <div className="tiny" style={{ opacity: 0.75, fontSize: '11px' }}>
          {comparedProps.length < 2 ? "Select at least 2 to compare" : "Ready to compare"}
        </div>
      </div>

      <div className="row" style={{ gap: '8px' }}>
        <button
          onClick={clearCompare}
          className="btn btn--sm"
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', fontSize: '12px', padding: '5px 12px' }}
        >
          Clear
        </button>
        {comparedProps.length < 2 ? (
          <button type="button" className="btn btn--sm btn--green" style={{ borderRadius: '999px', fontSize: '12px', padding: '5px 14px' }} disabled>
            Compare
          </button>
        ) : (
          <Link to="/compare" className="btn btn--sm btn--green" style={{ textDecoration: 'none', borderRadius: '999px', fontSize: '12px', padding: '5px 14px' }}>
            Compare
          </Link>
        )}
      </div>
    </div>
  );
};

