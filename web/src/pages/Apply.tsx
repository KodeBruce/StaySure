import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPropertyById } from '../services/propertyService';
import { submitApplication, uploadStudentDoc } from '../services/applicationService';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatRand } from '../data/matchScore';
import { CustomSelect } from '../components/CustomSelect';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
    return (
      <div className="wrap" style={{ maxWidth: '680px', margin: '48px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="card card--pad" style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '15px', color: 'var(--ink-2)', fontWeight: 600 }}>Loading application details...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="wrap" style={{ maxWidth: '680px', margin: '48px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="card card--pad" style={{ padding: '48px 24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>Property Not Found</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            We couldn't retrieve accommodation records for reference ID <code>{id}</code>. Please return to Compare or Search to select a verified residence.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/compare" className="btn btn--navy">Back to Compare</Link>
            <Link to="/search" className="btn btn--ghost">Browse Accommodation Map</Link>
          </div>
        </div>
      </div>
    );
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
      setError("We couldn't submit your application at the moment. Please try again shortly.");
      setSubmitting(false);
    }
  };

  return (
        <div className="wrap" style={{ maxWidth: '680px', margin: '32px auto', padding: '0 24px 80px' }}>
          {/* Top back navigation */}
          <div style={{ marginBottom: '16px' }}>
            <Link
              to="/compare"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--navy)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
              <span>Back to Compare</span>
            </Link>
          </div>

          <div className="card card--pad" style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="tiny muted">Application for Student Accommodation</span>
                  <span className="pill pill--green" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    <ShieldCheck size={12} strokeWidth={2.4} /> Verified Direct Flow
                  </span>
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0 8px' }}>
                  {property.name}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span className="pill pill--navy" style={{ fontWeight: 700 }}>
                    {formatRand(property.price)} / month
                  </span>
                  <span className="pill pill--ghost">
                    {property.type}
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--ink-2)' }}>
                    {property.area}
                  </span>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fde8e8', color: '#9b1c1c', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="field">
                        <label htmlFor="studentno">Student / University Number</label>
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
                      <CustomSelect
                        value={fundingType}
                        onChange={val => setFundingType(val as any)}
                        options={[
                          { value: 'nsfas', label: 'NSFAS (National Student Financial Aid Scheme)' },
                          { value: 'university', label: 'University Bursary / Scholarship' },
                          { value: 'self', label: 'Self-Funded / Family' },
                          { value: 'other', label: 'Private Bursary / Sponsor' }
                        ]}
                        ariaLabel="Funding Method"
                      />
                    </div>

                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
                          Supporting Documents
                        </h3>
                          <p className="tiny muted" style={{ marginBottom: '14px', lineHeight: 1.4 }}>
                            Uploaded files are stored encrypted and accessible only by verified property managers for accommodation vetting.
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
                            <label htmlFor="regfile">Proof of Registration / Acceptance Letter (PDF / Image)</label>
                            <input
                              id="regfile"
                              type="file"
                              accept=".pdf,image/*"
                              onChange={e => setRegFile(e.target.files ? e.target.files[0] : null)}
                            />
                          </div>
                        </div>

                        <div style={{ background: 'var(--navy-tint)', padding: '14px', borderRadius: '12px' }}>
                            <label className="row" style={{ gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '12.5px', color: 'var(--ink)' }}>
                              <input
                                type="checkbox"
                                checked={consent}
                                onChange={e => setConsent(e.target.checked)}
                                style={{ marginTop: '2px' }}
                              />
                              <span>
                                I consent to StaySure processing my personal information and transmitting my application documents to the verified accommodation provider in accordance with the <b>Protection of Personal Information Act (POPIA)</b>.
                              </span>
                            </label>
                        </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', gap: '12px' }}>
                              <Link to="/compare" className="btn btn--ghost">
                                Cancel
                              </Link>
                                <button
                                  type="submit"
                                  className="btn btn--green"
                                  disabled={submitting}
                                  style={{ minWidth: '180px', justifyContent: 'center' }}
                                >
                                  {submitting ? "Uploading Documents..." : "Submit Application →"}
                                </button>
                            </div>
                          </form>
                        </div>
                    </div>
                    );
};

