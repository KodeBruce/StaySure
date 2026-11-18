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

  const isVisible =
    compareIds.length > 0 &&
    !/^\/(search|compare|research)(\/|$)/.test(location.pathname);

  React.useEffect(() => {
    document.body.classList.toggle('has-compare-tray', isVisible);
    return () => {
      document.body.classList.remove('has-compare-tray');
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const comparedProps = compareIds
    .map(id => {
      const research = (researchProperties as any[]).find(p => p.id === id);
      if (research) {
        return {
          id: research.id,
          name: research.name,
          image: researchImages(research.id)[0] || researchFallbackImage,
        };
      }
      const mock = INITIAL_PROPERTIES.find(p => p.id === id);
      if (mock) {
        return {
          id: mock.id,
          name: mock.name,
          image: mock.images[0] || researchFallbackImage,
        };
      }
      return null;
    })
    .filter((p): p is { id: string; name: string; image: string } => Boolean(p));

  const canCompare = comparedProps.length >= 2;

  return (
    <div className="compare-tray" role="region" aria-label="Compare accommodation">
      {/* Thumbnail slots */}
      <div className="compare-tray-slots">
        {comparedProps.map(p => (
          <div key={p.id} className="compare-tray-slot">
            <img
              src={p.image}
              alt={p.name}
              onError={e => {
                e.currentTarget.src = researchFallbackImage;
              }}
            />
            <button
              type="button"
              className="compare-tray-remove"
              onClick={() => removeFromCompare(p.id)}
              aria-label={`Remove ${p.name} from comparison`}
              title={`Remove ${p.name}`}
            >
              <X size={9} strokeWidth={2.8} />
            </button>
          </div>
        ))}
        {Array.from({ length: 3 - comparedProps.length }).map((_, i) => (
          <div
            key={i}
            className="compare-tray-slot compare-tray-slot--empty"
            aria-hidden="true"
          >
            +
          </div>
        ))}
      </div>

      {/* Count + hint */}
      <div className="compare-tray-info">
        <div className="compare-tray-count">{comparedProps.length} of 3</div>
        <div className="compare-tray-hint">
          {canCompare ? 'Ready to compare' : 'Add 1 more to compare'}
        </div>
      </div>

      {/* Action buttons */}
      <div className="compare-tray-actions">
        <button
          type="button"
          className="compare-tray-btn-clear"
          onClick={clearCompare}
        >
          Clear
        </button>
        {canCompare ? (
          <Link to="/compare" className="compare-tray-btn-compare">
            Compare
          </Link>
        ) : (
          <button
            type="button"
            className="compare-tray-btn-compare"
            disabled
          >
            Compare
          </button>
        )}
      </div>
    </div>
  );
};
