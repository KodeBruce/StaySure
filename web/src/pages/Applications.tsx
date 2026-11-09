import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getStudentApplications } from '../services/applicationService';
import { Application } from '../types';
import { useAuth } from '../context/AuthContext';

const STAGES = [
  { label: "Submitted", desc: "Your application details have been received." },
  { label: "Under Review", desc: "Provider is reviewing your student credentials." },
  { label: "Document Verification", desc: "Checking registration and funding letters." },
  { label: "Approved", desc: "Congratulations! Your room has been provisionally reserved." },
  { label: "Lease Confirmed", desc: "Deposit paid and lease agreement executed." }
];

export const Applications: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const submittedRef = searchParams.get('submitted');

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = user ? user.uid : "guest";
    getStudentApplications(studentId).then(list => {
      setApplications(list);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="wrap" style={{ maxWidth: '820px', margin: '32px auto', padding: '0 24px' }}>
      {submittedRef && (
        <div className="card card--pad tc mb-24" style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
          <h2 style={{ color: 'var(--green-ink)', margin: '0 0 6px' }}>Application Submitted Successfully!</h2>
          <p className="tiny" style={{ color: 'var(--green-ink)' }}>
            Your tracking reference is <b>{submittedRef}</b>. The property provider has been notified.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>
          My Applications
        </h1>
        <span className="tiny muted">Real-time status tracking for student accommodation</span>
      </div>

      {loading ? (
        <div className="card card--pad tc muted">Loading application timeline...</div>
      ) : applications.length === 0 ? (
        <div className="card card--pad tc">
          <h3>No applications yet</h3>
          <p className="tiny muted mt-6">You haven't submitted any accommodation applications yet.</p>
          <Link to="/search" className="btn btn--navy mt-16" style={{ textDecoration: 'none' }}>
            Browse Accommodation
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {applications.map(app => (
            <div key={app.id} className="card card--pad" style={{ background: '#fff' }}>
              <div className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--navy)' }}>
                    {app.propertyName || "Accommodation Application"}
                  </h3>
                  <span className="tiny muted">Ref: <b>{app.ref}</b> · Submitted {new Date(app.date).toLocaleDateString('en-ZA')}</span>
                </div>
                <span className="pill pill--navy" style={{ fontWeight: 700 }}>
                  {STAGES[app.stage]?.label || "Processing"}
                </span>
              </div>

              {/* Step Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '16px' }}>
                {STAGES.map((s, idx) => {
                  const isDone = idx <= app.stage;
                  const isCurrent = idx === app.stage;
                  return (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isDone ? 'var(--green)' : 'var(--line)',
                          color: isDone ? '#fff' : 'var(--ink-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          outline: isCurrent ? '3px solid var(--navy-soft)' : 'none'
                        }}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--navy)' : 'var(--ink-2)' }}>
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '16px', background: 'var(--navy-tint)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: 'var(--ink-2)' }}>
                <b>Current Stage:</b> {STAGES[app.stage]?.desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

