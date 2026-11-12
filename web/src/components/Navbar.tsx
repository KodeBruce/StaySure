import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { AuthModal } from './AuthModal';
import { isFirebaseConfigured } from '../firebase/config';
import { House, Search as SearchIcon, GitCompareArrows, ClipboardList, Heart } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, profile, signOut } = useAuth();
  const { compareIds, savedIds } = useCompare();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="topnav" id="topnav">
        <div className="wrap row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div className="row" style={{ gap: '20px' }}>
            <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--navy)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>S</div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em' }}>
                Stay<span style={{ color: 'var(--green-ink)' }}>Sure</span>
              </span>
            </Link>

            <nav className="desktop-links row" style={{ gap: '6px' }}>
              <NavLink to="/" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>Home</NavLink>
              <NavLink to="/search" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>Search</NavLink>
              <NavLink to="/compare" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                Compare {compareIds.length > 0 && <span className="chip" style={{ background: 'var(--green-soft)', color: 'var(--green-ink)', marginLeft: '4px' }}>{compareIds.length}</span>}
              </NavLink>
              <NavLink to="/applications" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>Applications</NavLink>
              <NavLink to="/saved" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                Saved {savedIds.length > 0 && <span className="chip" style={{ marginLeft: '4px' }}>{savedIds.length}</span>}
              </NavLink>
            </nav>
          </div>

          <div className="row" style={{ gap: '12px' }}>
            <Link to="/provider/tours" className="btn btn--sm btn--ghost" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {user && (role === 'provider' || role === 'admin') ? 'Create 3D tour' : '3D tours'}
            </Link>
            {!isFirebaseConfigured && (
              <span className="pill pill--amber" title="Configure your .env file with Firebase credentials to enable live database persistence">
                Demo Mode
              </span>
            )}

            {user ? (
              <div className="row" style={{ gap: '8px' }}>
                <span className="tiny" style={{ fontWeight: 600 }}>{user.email || profile.name}</span>
                <button className="btn btn--sm btn--ghost" onClick={() => signOut()}>Sign Out</button>
              </div>
            ) : (
              <button className="btn btn--sm btn--navy" onClick={() => setShowAuth(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="app-floating-nav" aria-label="Primary navigation">
        <NavLink to="/" end><House size={21} /><span>Home</span></NavLink>
        <NavLink to="/search"><SearchIcon size={21} /><span>Search</span></NavLink>
        <NavLink to="/compare"><GitCompareArrows size={21} /><span>Compare</span></NavLink>
        <NavLink to="/applications"><ClipboardList size={21} /><span>Applications</span></NavLink>
        <NavLink to="/saved"><Heart size={21} /><span>Saved</span></NavLink>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};

