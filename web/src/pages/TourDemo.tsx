import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_PROPERTIES } from '../data/mockData';

const sample = INITIAL_PROPERTIES[0];
const imageLabels = ['Building exterior', 'Interior photo 1', 'Interior photo 2', 'Interior photo 3'];
const steps = ['Select images', 'Quality check', 'Review actual images', 'Student listing'];

const SourceImageViewer: React.FC = () => {
  const [imageIndex, setImageIndex] = useState(0);
  const image = sample.images[imageIndex];

  return <div className="demo-source-viewer">
    <div className="demo-source-stage">
      <img src={image} alt={`${imageLabels[imageIndex]} from the sample listing`} />
      <span className="demo-source-counter">Source image {imageIndex + 1} of {sample.images.length}</span>
    </div>
    <div className="demo-source-controls">
      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setImageIndex(index => (index + sample.images.length - 1) % sample.images.length)}>← Previous photo</button>
      <strong>{imageLabels[imageIndex]}</strong>
      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setImageIndex(index => (index + 1) % sample.images.length)}>Next photo →</button>
    </div>
    <div className="demo-source-thumbs" aria-label="Choose a source image">
      {sample.images.map((src, index) => <button key={src} type="button" className={index === imageIndex ? 'is-active' : ''} onClick={() => setImageIndex(index)} aria-label={`View ${imageLabels[index]}`} aria-pressed={index === imageIndex}><img src={src} alt="" /></button>)}
    </div>
  </div>;
};

export const TourDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  return <div className="wrap capture-page tour-demo-page">
    <Link to="/provider/tours" className="tiny tour-back">← Back to Create 3D tour</Link>
    <div className="demo-title-row"><div><h1>Try the 3D tour flow</h1><p>See how StaySure handles the existing sample listing images.</p></div><span className="pill pill--amber">Sample images · no 3D reconstruction</span></div>
    <div className="demo-stepper" aria-label="Demo progress">
      {steps.map((label, index) => <span key={label} className={step === index ? 'is-current' : step > index ? 'is-done' : ''}>{index + 1}. {label}</span>)}
    </div>

    {step === 0 && <section className="card card--pad demo-panel">
      <h2>1. Provider selects room images</h2>
      <p>These are the four actual image files in the sample listing for <b>{sample.name}</b>. The provider would need to upload a continuous video or 20–80 overlapping images of the same room to request reconstruction.</p>
      <div className="demo-photo-grid">{sample.images.map((src, index) => <figure key={src}><img src={src} alt={imageLabels[index]} /><figcaption>{imageLabels[index]}</figcaption></figure>)}</div>
      <button type="button" className="btn btn--green" onClick={() => setStep(1)}>Check these images →</button>
    </section>}

    {step === 1 && <section className="card card--pad demo-panel">
      <h2>2. Capture check stops generation</h2>
      <div className="demo-checks"><div>✓ Four image files are available to preview</div><div className="is-warning">⚠ Only four images; the image upload flow requires at least 20.</div><div className="is-warning">⚠ The set includes a building exterior and different room layouts. It does not show overlapping views of one continuous space.</div></div>
      <p className="demo-warning"><b>3D generation blocked.</b> The app cannot reconstruct the photographed room from this set. A provider must recapture one space before a Nerfstudio job can run.</p>
      <div className="row row--wrap demo-actions"><button type="button" className="btn btn--navy" onClick={() => setStep(2)}>Review the actual images →</button><Link className="btn btn--ghost" to="/provider/tours">See capture instructions</Link></div>
    </section>}

    {step === 2 && <section className="card card--pad demo-panel">
      <h2>3. Reviewer sees the source images</h2>
      <p>Use the arrows or thumbnails to inspect what was supplied. This is an image viewer, not a 3D scene; there is no generated scene to approve.</p>
      <SourceImageViewer />
      <p className="demo-warning">StaySure would request a new capture of one room. The review and publish controls become available only after a real processing job produces a scene.</p>
      <button type="button" className="btn btn--navy" onClick={() => setStep(3)}>See the student listing →</button>
    </section>}

    {step === 3 && <section className="card card--pad demo-panel">
      <h2>4. Student sees listing photos only</h2>
      <div className="row row--wrap" style={{ gap: 10, marginBottom: 16 }}><b>{sample.name}</b><span className="muted">R{sample.price.toLocaleString('en-ZA')}/month</span><span className="pill pill--amber">3D tour unavailable</span></div>
      <SourceImageViewer />
      <p>Once a real capture has been reconstructed and approved, StaySure can replace this photo-only experience with the generated tour and show a 3D tour badge.</p>
      <div className="row row--wrap demo-actions"><button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>Restart demo</button><Link className="btn btn--navy" to={`/detail/${sample.id}`}>View actual listing</Link></div>
    </section>}
  </div>;
};
