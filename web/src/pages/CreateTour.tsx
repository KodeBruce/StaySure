import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProperties } from '../services/propertyService';
import { getMyTourJobs, getReviewTourJobs, submitTourCapture } from '../services/tourService';
import { isFirebaseConfigured } from '../firebase/config';
import { Property, TourJob } from '../types';

const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

async function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function videoDimensions(file: File): Promise<{ width: number; height: number; duration: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
      video.onerror = () => reject(new Error('Could not read this video. Export it as MP4 or MOV.'));
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function validateCapture(mode: 'video' | 'images', files: File[]): Promise<string | null> {
  if (!files.length) return 'Choose a capture to upload.';
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) return 'Keep the total upload below 500 MB.';
  if (mode === 'video') {
    if (files.length !== 1 || !['video/mp4', 'video/quicktime'].includes(files[0].type)) return 'Choose one MP4 or MOV video.';
    const video = await videoDimensions(files[0]);
    if (video.width < 1280 || video.height < 720) return 'Record at least 720p; 1080p is recommended.';
    if (video.duration < 30) return 'Record at least 30 seconds so the room has enough overlapping views.';
  } else {
    if (files.length < 20 || files.length > 80) return 'Choose 20–80 overlapping photos for this pilot.';
    for (const file of files) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Photos must be JPEG or PNG.';
      if (file.size > MAX_IMAGE_BYTES) return `Keep each photo below 20 MB (${file.name}).`;
      const image = await imageDimensions(file);
      if (image.width < 1280 || image.height < 720) return `Use at least 1280 × 720 photos (${file.name}).`;
    }
  }
  return null;
}

export const CreateTour: React.FC = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [jobs, setJobs] = useState<TourJob[]>([]);
  const [reviewJobs, setReviewJobs] = useState<TourJob[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [mode, setMode] = useState<'video' | 'images'>('video');
  const [files, setFiles] = useState<File[]>([]);
  const [captureDate, setCaptureDate] = useState(new Date().toISOString().slice(0, 10));
  const [spaces, setSpaces] = useState('Bedroom');
  const [consent, setConsent] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const canCreate = Boolean(user && (role === 'provider' || role === 'admin'));

  useEffect(() => {
    if (!user || (role !== 'provider' && role !== 'admin')) return;
    getProperties().then(items => setProperties(items.filter(item => role === 'admin' || item.providerId === user.uid)));
    const refresh = () => {
      getMyTourJobs(user.uid).then(setJobs).catch(() => setMessage('Could not load capture jobs.'));
      if (role === 'admin') getReviewTourJobs().then(setReviewJobs).catch(() => setMessage('Could not load review jobs.'));
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [user, role]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setMessage('');
    setSubmitting(true);
    try {
      const issue = await validateCapture(mode, files);
      if (issue) throw new Error(issue);
      if (!propertyId || !properties.some(item => item.id === propertyId)) throw new Error('Choose a property you manage.');
      if (!consent) throw new Error('Confirm you have permission to capture and publish these spaces.');
      if (!captureReady) throw new Error('Complete the capture quality checklist before uploading.');
      if (captureDate > new Date().toISOString().slice(0, 10)) throw new Error('Capture date cannot be in the future.');
      const namedSpaces = spaces.split(',').map(item => item.trim()).filter(Boolean);
      if (!namedSpaces.length) throw new Error('Name at least one space shown in the capture.');
      const jobId = await submitTourCapture({ propertyId, ownerId: user.uid, mode, captureDate, spaces: namedSpaces }, files, setProgress);
      setMessage(`Capture uploaded. Generation job ${jobId} is queued.`);
      setFiles([]);
      setJobs(await getMyTourJobs(user.uid));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit this capture.');
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  return <div className="wrap capture-page">
    <Link to="/search" className="tiny tour-back">← Back to accommodation</Link>
    <h1>Create a 3D walkthrough</h1>
    <p className="muted">Capture the real property, upload it here, and follow its generation status. StaySure reviews each result before students see it.</p>
    <Link to="/provider/tours/demo" className="btn btn--navy" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 8 }}>Try the step-by-step demo →</Link>

    <div className="capture-grid">
      <section className="card card--pad">
        <h2>Capture guide</h2>
        <ol className="capture-guide">
          <li><b>Prepare the space.</b> Open doors, tidy rooms, use bright even lighting, and remove people, personal papers and mirrors where possible.</li>
          <li><b>Move slowly.</b> Walk a loop around each room, point toward surfaces from several angles, and overlap views through doorways. Avoid abrupt turns, zooming and blurry frames.</li>
          <li><b>Cover what students need to judge.</b> Show the bed, desk, windows, storage, floor, bathroom, kitchen and entrance if they are part of the listing.</li>
          <li><b>Check before upload.</b> Play the video or review every photo. Retake dark, blurred or missing areas. Do not substitute marketing photos of a different unit.</li>
        </ol>
        <p className="tiny muted">Recommended: one 1080p MP4/MOV video of 1–3 minutes, or 40–80 sharp, overlapping photos. The pilot accepts videos of at least 720p and 30 seconds, or 20–80 photos at 1280 × 720 or higher. These are upload checks, not a guarantee of 3D quality.</p>
      </section>

      {canCreate ? <form className="card card--pad capture-form" onSubmit={submit}>
        <h2>Upload capture</h2>
        {!isFirebaseConfigured && <p className="pill pill--amber">Firebase must be configured to upload and generate tours.</p>}
        <label>Property
          <select className="select" value={propertyId} onChange={event => setPropertyId(event.target.value)} required>
            <option value="">Select a property</option>
            {properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select>
        </label>
        {!properties.length && <p className="tiny muted">No properties are assigned to this account. A StaySure reviewer must set the listing’s provider ID first.</p>}
        <fieldset className="capture-mode"><legend>Capture format</legend>
          <label><input type="radio" checked={mode === 'video'} onChange={() => { setMode('video'); setFiles([]); }} /> Video</label>
          <label><input type="radio" checked={mode === 'images'} onChange={() => { setMode('images'); setFiles([]); }} /> Photos</label>
        </fieldset>
        <label>{mode === 'video' ? 'MP4 or MOV video' : '20–80 JPEG or PNG photos'}
          <input type="file" accept={mode === 'video' ? 'video/mp4,video/quicktime,.mp4,.mov' : 'image/jpeg,image/png,.jpg,.jpeg,.png'} multiple={mode === 'images'} onChange={event => setFiles(Array.from(event.target.files || []))} required />
        </label>
        {!!files.length && <p className="tiny muted">{files.length} file{files.length === 1 ? '' : 's'} selected · {(files.reduce((sum, file) => sum + file.size, 0) / 1048576).toFixed(1)} MB</p>}
        <label>Capture date<input className="input" type="date" value={captureDate} max={new Date().toISOString().slice(0, 10)} onChange={event => setCaptureDate(event.target.value)} required /></label>
        <label>Spaces shown, separated by commas<input className="input" value={spaces} onChange={event => setSpaces(event.target.value)} placeholder="Bedroom, bathroom, shared kitchen" required /></label>
        <label className="capture-consent"><input type="checkbox" checked={captureReady} onChange={event => setCaptureReady(event.target.checked)} /> I checked the capture: views overlap, rooms and doorways are covered, and there are no dark or blurry sections.</label>
        <label className="capture-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /> I have permission to capture and publish these spaces, and the capture shows this actual property.</label>
        {progress !== null && <div><progress value={progress} max={100} style={{ width: '100%' }} /><span className="tiny">Uploading {progress}%</span></div>}
        {message && <p role="status" className="capture-message">{message}</p>}
        <button className="btn btn--green" type="submit" disabled={submitting || !isFirebaseConfigured || !properties.length}>{submitting ? 'Checking and uploading…' : 'Upload and generate 3D tour'}</button>
      </form> : <section className="card card--pad">
        <h2>Ready to create a tour?</h2>
        <p>{authLoading ? 'Checking your account…' : 'Use Sign In at the top of the app with a property provider account to upload a capture. StaySure reviewers can also create a tour.'}</p>
        {!isFirebaseConfigured && <p className="tiny muted">This demo has no Firebase connection yet, so uploads and 3D generation are unavailable. You can still use this capture guide to prepare your room.</p>}
      </section>}
    </div>

    {canCreate && <section className="card card--pad capture-jobs"><h2>Your capture jobs</h2>
      {!jobs.length ? <p className="muted">No captures submitted yet.</p> : jobs.map(job => <div className="capture-job" key={job.id}><span>{properties.find(item => item.id === job.propertyId)?.name || job.propertyId}</span><b>{job.status}</b>{job.error && <small>{job.error}</small>}</div>)}
    </section>}
    {role === 'admin' && <section className="card card--pad capture-jobs"><h2>Ready for StaySure review</h2>
      {!reviewJobs.length ? <p className="muted">No generated tours awaiting review.</p> : reviewJobs.map(job => <div className="capture-job" key={job.id}>
        <span>{job.propertyId} · {job.spaces.join(', ')}</span>
        <div className="row" style={{ gap: 10 }}>
          <Link to={`/review/tour/${job.id}`} className="btn btn--sm btn--ghost">Inspect 3D scene</Link>
        </div>
      </div>)}
    </section>}
  </div>;
};
