import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPropertyById } from '../services/propertyService';
import { submitApplication, uploadStudentDoc } from '../services/applicationService';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatRand } from '../data/matchScore';

export const Apply: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [studentName, setStudentName] = useState(profile.name || '');
  const [studentNumber, setStudentNumber] = useState('');
  const [course, setCourse] = useState('');
  const [fundingType, setFundingType] = useState(profile.funding || 'nsfas');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [regFile, setRegFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (id) {
      getPropertyById(id).then(p => {
        setProperty(p);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <div className="wrap card card--pad tc mt-32">Loading application...</div>;
  }

  if (!property) {
    return <div className="wrap card card--pad tc mt-32">Property not found</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please agree to the POPIA data processing terms before submitting.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const studentId = user ? user.uid : "guest_" + Date.now();
      let idUrl = '';
      let regUrl = '';

      // Upload documents if selected
      if (idFile) {
        idUrl = await uploadStudentDoc(studentId, 'id_copy', idFile);
      }
      if (regFile) {
        regUrl = await uploadStudentDoc(studentId, 'proof_of_reg', regFile);
      }

      // Submit application record to Firestore
      const created = await submitApplication({
        propertyId: property.id,
        propertyName: property.name,
        studentId: studentId,
        studentName: studentName || "Student",
        documents: {
          idCopy: idUrl,
          proofOfReg: regUrl
        },
        notes: `Course: ${course}, Student No: ${studentNumber}, Funding: ${fundingType}`
      });

      navigate(`/applications?submitted=${created.ref}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
      setSubmitting(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: '680px', margin: '32px auto', padding: '0 24px' }}>
      <div className="card card--pad" style={{ background: '#fff' }}>
        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
          <span className="tiny muted">Application for</span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0' }}>
            {property.name}
          </h1>
          <span className="pill pill--navy">{formatRand(property.price)} /month · {property.type}</span>
        </div>

        {error && (
          <div style={{ background: '#fde8e8', color: '#9b1c1c', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label htmlFor="fullname">Full Legal Name</label>
            <input
              id="fullname"
              type="text"
              className="input"
              required
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="e.g. Thabo Molefe"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label htmlFor="studentno">Wits Student Number</label>
              <input
                id="studentno"
                type="text"
                className="input"
                required
                value={studentNumber}
                onChange={e => setStudentNumber(e.target.value)}
                placeholder="e.g. 2194821"
              />
            </div>
            <div className="field">
              <label htmlFor="course">Degree / Field of Study</label>
              <input
                id="course"
                type="text"
                className="input"
                required
                value={course}
                onChange={e => setCourse(e.target.value)}
                placeholder="e.g. BSc Computer Science"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="funding">Funding Method</label>
            <select
              id="funding"
              className="input"
              value={fundingType}
              onChange={e => setFundingType(e.target.value as any)}
            >
              <option value="nsfas">NSFAS (National Student Financial Aid Scheme)</option>
              <option value="university">University Bursary / Scholarship</option>
              <option value="self">Self-Funded / Family</option>
              <option value="other">Private Bursary / Sponsor</option>
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
              Required Documents (Stored securely in Cloud Storage)
            </h3>
            <p className="tiny muted" style={{ marginBottom: '14px' }}>
              Uploaded files are encrypted at rest and accessible only by the verified property manager and StaySure auditors.
            </p>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label htmlFor="idfile">Certified ID or Passport Copy (PDF / Image)</label>
              <input
                id="idfile"
                type="file"
                accept=".pdf,image/*"
                onChange={e => setIdFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            <div className="field">
              <label htmlFor="regfile">Proof of Registration at Wits (PDF / Image)</label>
              <input
                id="regfile"
                type="file"
                accept=".pdf,image/*"
                onChange={e => setRegFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          </div>

          <div style={{ background: 'var(--navy-tint)', padding: '14px', borderRadius: '12px' }}>
            <label className="row" style={{ gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={{ marginTop: '2px' }}
              />
              <span>
                I consent to StaySure processing my personal information and transmitting my documents to the verified landlord for accommodation vetting in accordance with the <b>Protection of Personal Information Act (POPIA)</b>.
              </span>
            </label>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', marginTop: '10px' }}>
            <Link to={`/detail/${property.id}`} className="btn btn--ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn--green" disabled={submitting}>
              {submitting ? "Uploading Documents..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

