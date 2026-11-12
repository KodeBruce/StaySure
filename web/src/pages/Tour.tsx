import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPropertyById } from '../services/propertyService';
import { Property } from '../types';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase/config';

export const Tour: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerError, setViewerError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!id) {
      setLoading(false);
      return;
    }
    getPropertyById(id).then(result => {
      if (active) {
        setProperty(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const assetPath = property?.tour?.assetPath;
    if (property?.tour?.status !== 'published' || !assetPath) return;
    const parts = assetPath.split('/');
    if (parts.length !== 4 || parts[0] !== 'tours' || parts[1] !== property.id || !/^[a-zA-Z0-9_-]+$/.test(parts[2]) || parts[3] !== 'scene.ply') {
      setViewerError('The tour asset path is invalid.');
      return;
    }
    getDownloadURL(ref(storage, assetPath))
      .then(url => setViewerUrl(`/tour-viewer/index.html?content=${encodeURIComponent(url)}`))
      .catch(() => setViewerError('The 3D scene could not be loaded. Please use the listing photos.'));
  }, [property]);

  if (loading) return <div className="wrap card card--pad tc mt-32">Loading tour...</div>;

  if (!property || property.tour?.status !== 'published' || !/^[a-zA-Z0-9_-]+$/.test(property.id)) {
    return (
      <div className="wrap card card--pad tc mt-32" style={{ maxWidth: 700 }}>
        <h1>Tour unavailable</h1>
        <p>This property does not have a published 3D tour yet.</p>
        <Link className="btn btn--navy" to={property ? `/detail/${property.id}` : '/search'}>Back to listing</Link>
      </div>
    );
  }

  const capturedDate = new Date(`${property.tour.capturedAt}T00:00:00`);
  const dateLabel = Number.isNaN(capturedDate.getTime())
    ? property.tour.capturedAt
    : capturedDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="wrap tour-page">
      <div className="tour-heading">
        <div>
          <Link to={`/detail/${property.id}`} className="tiny tour-back">← Back to {property.name}</Link>
          <h1>{property.name} · 3D tour</h1>
          <p>Captured {dateLabel}. Tour spaces: {property.tour.spaces.join(', ') || 'room interior'}.</p>
        </div>
        <Link to={`/detail/${property.id}`} className="btn btn--ghost">View listing details</Link>
      </div>
      <div className="tour-frame-wrap">
        {viewerError ? <p className="tour-frame-message">{viewerError}</p> : viewerUrl ? <iframe
          src={viewerUrl}
          title={`Interactive 3D tour of ${property.name}`}
          className="tour-frame"
          allow="fullscreen; xr-spatial-tracking"
          allowFullScreen
        /> : <p className="tour-frame-message">Loading the 3D scene…</p>}
      </div>
      <p className="tiny muted tour-help">
        Drag or swipe to look around. Use the viewer controls to move through the scene. If 3D does not load on your device, the listing photos remain available.
      </p>
    </div>
  );
};
