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
        bottom: '24px',
        zIndex: 900,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#fff',
        padding: '7px 14px',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '14px',
        boxSizing: 'border-box',
        width: 'max-content',
        maxWidth: 'calc(100vw - 28px)',
        transition: 'bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {comparedProps.map(p => (
          <div
            key={p.id}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.08)'
            }}
          >
            <img
              src={p.image}
              alt={p.name}
              onError={e => { e.currentTarget.src = researchFallbackImage; }}
              style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', display: 'block' }}
            />
            <button
              type="button"
              onClick={() => removeFromCompare(p.id)}
              aria-label={`Remove ${p.name} from comparison`}
              title={`Remove ${p.name}`}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '16px',
                height: '16px',
                borderRadius: '0 0 0 6px',
                background: 'rgba(15, 23, 42, 0.88)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                margin: 0,
                zIndex: 2,
                transition: 'background 0.14s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.88)'; }}
            >
              <X size={10} strokeWidth={2.6} />
            </button>
          </div>
        ))}
        {Array.from({ length: 3 - comparedProps.length }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1.5px dashed rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.35)',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            +
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flexShrink: 0 }}>
        <div style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', lineHeight: 1.2, color: '#fff' }}>
          {comparedProps.length} of 3 selected
        </div>
        <div style={{ fontSize: '10.5px', whiteSpace: 'nowrap', lineHeight: 1.2, color: 'rgba(255,255,255,0.72)' }}>
          {comparedProps.length < 2 ? "Add 1 more to compare" : "Ready to compare"}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={clearCompare}
          style={{
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 600,
            padding: '5px 11px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          Clear
        </button>
        {comparedProps.length < 2 ? (
          <button
            type="button"
            disabled
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.35)',
              border: 'none',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 14px',
              cursor: 'not-allowed',
              whiteSpace: 'nowrap'
            }}
          >
            Compare
          </button>
        ) : (
          <Link
            to="/compare"
            style={{
              background: '#249f60',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 15px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(36, 159, 96, 0.35)',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s ease'
            }}
          >
            Compare
          </Link>
        )}
      </div>
    </div>
  );
};

