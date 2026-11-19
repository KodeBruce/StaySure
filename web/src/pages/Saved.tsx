import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyCard } from '../components/PropertyCard';
import { INITIAL_PROPERTIES } from '../data/mockData';
import researchPropertiesJson from '../data/researchProperties.json';
import { useResearchSelection } from '../data/researchSelection';
import { researchImages, researchFallbackImage } from '../data/researchMedia';
import { researchPriceSummary } from '../data/researchPricing';
import { Heart } from 'lucide-react';
import { MapPropertySheet } from './ResearchMapSearch';
import { matchResearchProperty, useSearchCriteria } from '../data/researchMatch';
import { resolveAnyProperty } from './Research';

export const Saved: React.FC = () => {
  // Single source of truth for both save and compare state
  const researchSaved = useResearchSelection('saved');
  const researchCompared = useResearchSelection('compare');
  const criteria = useSearchCriteria();
  const [detailId, setDetailId] = useState<string | null>(null);

  // Split saved IDs into two buckets: research JSON props vs mock props
  const researchItems = researchSaved.ids
    .map(id => researchPropertiesJson.find(item => item.id === id))
    .filter((item): item is (typeof researchPropertiesJson)[number] => Boolean(item));

  const mockItems = researchSaved.ids
    .map(id => INITIAL_PROPERTIES.find(p => p.id === id))
    .filter((p): p is (typeof INITIAL_PROPERTIES)[number] => Boolean(p));

  const totalSaved = researchItems.length + mockItems.length;

  return (
        <div className="wrap" style={{ maxWidth: '1160px', margin: '32px auto', padding: '0 24px 80px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Heart size={22} fill="currentColor" color="var(--green-ink)" />
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                Saved Accommodation
                {totalSaved > 0 && (
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-2)', marginLeft: '8px' }}>
                    ({totalSaved})
                  </span>
                )}
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', margin: 0 }}>
              Your shortlist — heart any property to save it here
            </p>
          </div>

                {/* Empty state */}
                {totalSaved === 0 && (
                  <div className="card card--pad" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <Heart size={36} color="var(--line-2)" style={{ marginBottom: '14px' }} />
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
                      Nothing saved yet
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', margin: '0 0 20px' }}>
                      Tap the heart icon on any listing to save it here for later comparison.
                    </p>
                    <Link to="/search" className="btn btn--navy" style={{ textDecoration: 'none' }}>
                      Find Accommodation
                    </Link>
                  </div>
      )}

                {/* Research JSON properties */}
                {researchItems.length > 0 && (
                  <section style={{ marginBottom: '36px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                        Researched properties
                      </h2>
                      {researchCompared.ids.length > 0 && (
                        <Link to="/compare" style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                          View comparison ({researchCompared.ids.length}) →
                        </Link>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {researchItems.map(item => {
                        const price = researchPriceSummary(item.advertisedPrice);
                        const isComparing = researchCompared.ids.includes(item.id);
                        const canAddMore = researchCompared.ids.length < 3;
                        return (
                          <article key={item.id} style={{
                            background: '#fff',
                            borderRadius: '16px',
                            border: '1px solid var(--line)',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            {/* Thumbnail */}
                            <div style={{ height: '180px', background: 'var(--navy-tint)', position: 'relative' }}>
                              <button type="button" onClick={() => setDetailId(item.id)} aria-label={`Preview ${item.name}`} style={{ position: 'absolute', inset: 0, zIndex: 1, border: 0, background: 'transparent', cursor: 'pointer' }} />
                              <img
                                src={researchImages(item.id)[0]}
                                onError={e => { e.currentTarget.src = researchFallbackImage; }}
                                alt={`Illustrative image for ${item.name}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                              <span style={{
                                position: 'absolute', bottom: '10px', left: '10px',
                                background: 'rgba(19,35,79,.88)', color: '#fff',
                                borderRadius: '999px', padding: '4px 9px',
                                fontSize: '10.5px', fontWeight: 700
                              }}>Illustrative image</span>
                              {/* Remove heart */}
                              <button
                                type="button"
                                title="Remove from saved"
                                aria-label="Remove from saved"
                                onClick={() => researchSaved.toggle(item.id)}
                                style={{
                                  position: 'absolute', top: '10px', right: '10px', zIndex: 2,
                                  background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%',
                                  width: '34px', height: '34px', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', cursor: 'pointer', color: '#ef4444'
                                }}
                              >
                                <Heart size={15} fill="currentColor" />
                              </button>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{
                                display: 'inline-block', background: 'var(--amber-soft)', color: 'var(--amber-ink)',
                                borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700,
                                marginBottom: '2px', alignSelf: 'flex-start'
                              }}>Research record</span>
                              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: 0, lineHeight: 1.25 }}><button type="button" onClick={() => setDetailId(item.id)} style={{ padding: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>{item.name}</button></h3>
                              <p style={{ fontSize: '13px', color: 'var(--green-ink)', fontWeight: 600, margin: 0 }}>
                                {price?.label ?? 'Price not listed'}
                                {price && <small style={{ fontSize: '11px', color: 'var(--ink-3)', fontWeight: 400, marginLeft: '4px' }}>advertised; confirm basis</small>}
                              </p>
                              <p style={{ fontSize: '12px', color: 'var(--ink-2)', margin: 0 }}>
                                {item.address}, {item.locality}
                              </p>
                              {/* Actions */}
                              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setDetailId(item.id)}
                                  className="btn btn--sm btn--ghost"
                                  style={{ textDecoration: 'none', flex: '1 1 auto', textAlign: 'center' }}
                                >
                                  View details →
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn--sm ${isComparing ? 'btn--navy' : 'btn--ghost'}`}
                                  onClick={() => researchCompared.toggle(item.id)}
                                  disabled={!isComparing && !canAddMore}
                                  style={{ flex: '1 1 auto' }}
                                >
                                  {isComparing ? '✓ Comparing' : 'Compare'}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
                {detailId && (() => {
                  const item = resolveAnyProperty(detailId);
                  const mock = INITIAL_PROPERTIES.find(property => property.id === detailId);
                  return item ? <MapPropertySheet key={detailId} item={item} image={mock?.images[0]} match={matchResearchProperty(item, criteria)} saved={researchSaved} compared={researchCompared} onExited={() => setDetailId(null)} /> : null;
                })()}

                {/* Mock / demo properties */}
                {mockItems.length > 0 && (
                  <section>
                    {researchItems.length > 0 && (
                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 14px' }}>
                        Other saved listings
                      </h2>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {mockItems.map(p => (
                        <PropertyCard key={p.id} property={p} onOpen={setDetailId} />
                      ))}
                    </div>
                  </section>
                )}
            </div>
          );
};
