import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase/config';
import { getTourJob, publishTourJob, rejectTourJob } from '../services/tourService';
import { TourJob } from '../types';

export const ReviewTour: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [job, setJob] = useState<TourJob | null>(null);
  const [viewerUrl, setViewerUrl] = useState('');
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id || !user || role !== 'admin') return;
    getTourJob(id).then(async result => {
      setJob(result);
      if (result?.assetPath) {
        const url = await getDownloadURL(ref(storage, result.assetPath));
        setViewerUrl(`/tour-viewer/index.html?content=${encodeURIComponent(url)}`);
      }
    }).catch(() => setMessage('Could not load this tour.'));
  }, [id, user, role]);

  if (!user || role !== 'admin') return <div className="wrap card card--pad mt-32">StaySure reviewer access required.</div>;
  if (!job) return <div className="wrap card card--pad mt-32">{message || 'Loading review...'}</div>;

  return <div className="wrap tour-page">
    <Link className="tiny tour-back" to="/provider/tours">← Back to capture jobs</Link>
    <h1>Review 3D tour · {job.propertyId}</h1>
    <p>Captured {job.captureDate}. Spaces claimed: {job.spaces.join(', ')}.</p>
    <div className="tour-frame-wrap">{viewerUrl
      ? <iframe className="tour-frame" src={viewerUrl} title="3D scene awaiting StaySure review" allowFullScreen />
      : <p className="tour-frame-message">Loading scene…</p>}</div>
    <div className="card card--pad" style={{ marginTop: 18 }}>
      <label className="capture-consent"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} /> I inspected the full tour, confirmed it matches the actual listed unit and named spaces, and found no people or private information.</label>
      {message && <p role="status">{message}</p>}
      <button className="btn btn--green mt-12" disabled={!checked || job.status !== 'review'} onClick={async () => {
        try {
          await publishTourJob(job.id);
          setJob({ ...job, status: 'published' });
          setMessage('Tour published on the property listing.');
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Could not publish tour.');
        }
      }}>Publish tour to students</button>
      {job.status === 'review' && <div style={{ marginTop: 20 }}>
        <label>Request a better capture<input className="input" value={reason} onChange={event => setReason(event.target.value)} placeholder="For example: bathroom is missing or bedroom is too blurry" /></label>
        <button className="btn btn--ghost mt-12" disabled={!reason.trim()} onClick={async () => {
          try {
            await rejectTourJob(job.id, reason);
            setJob({ ...job, status: 'failed', error: reason });
            setMessage('Provider can see the recapture request.');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Could not reject tour.');
          }
        }}>Send back for recapture</button>
      </div>}
    </div>
  </div>;
};
