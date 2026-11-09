import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'provider'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseConfigured) {
      setError("Firebase keys are not configured yet. Add them in web/.env to enable live authentication.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, role);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isFirebaseConfigured) {
      setError("Firebase keys are not configured yet. Add them in web/.env to enable live authentication.");
      return;
    }

    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card card--pad"
        style={{ width: '100%', maxWidth: '420px', background: '#fff', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
        >
          ×
        </button>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>
          {isSignUp ? "Create a StaySure Account" : "Sign In to StaySure"}
        </h2>
        <p className="tiny muted" style={{ marginBottom: '20px' }}>
          {isSignUp ? "Save favourites, track applications and get personalised matches." : "Welcome back to your accommodation hub."}
        </p>

        {error && (
          <div style={{ background: 'var(--red-soft, #fde8e8)', color: 'var(--red-ink, #9b1c1c)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignUp && (
            <div className="field">
              <label>I am a:</label>
              <div className="row" style={{ gap: '10px' }}>
                <button
                  type="button"
                  className={`btn btn--sm ${role === 'student' ? 'btn--navy' : 'btn--ghost'}`}
                  onClick={() => setRole('student')}
                  style={{ flex: 1 }}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`btn btn--sm ${role === 'provider' ? 'btn--navy' : 'btn--ghost'}`}
                  onClick={() => setRole('provider')}
                  style={{ flex: 1 }}
                >
                  Accommodation Provider
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="input"
              required
              placeholder="e.g. name@students.wits.ac.za"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="input"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn--green" disabled={loading} style={{ width: '100%', marginTop: '6px' }}>
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleGoogle}
            disabled={loading}
            style={{ width: '100%' }}
          >
            Continue with Google
          </button>
        </form>

        <div className="tc mt-18 tiny muted">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}
          >
            {isSignUp ? "Sign In" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};

