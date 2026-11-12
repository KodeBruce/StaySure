import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
              <div style={{ width: '32px', height: '32px', background: 'var(--navy)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>S</div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em' }}>
                Stay<span style={{ color: 'var(--green-ink)' }}>Sure</span>
              </span>
            </Link>

            <nav className="desktop-links row" style={{ gap: '6px' }}>
              <NavLink to="/" end className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                <House size={16} />
                <span>Home</span>
              </NavLink>
              <NavLink to="/search" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                <SearchIcon size={16} />
                <span>Search</span>
              </NavLink>
              <NavLink to="/compare" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                <GitCompareArrows size={16} />
                <span>Compare</span>
                {compareIds.length > 0 && <span className="chip" style={{ background: 'var(--green-soft)', color: 'var(--green-ink)', marginLeft: '4px' }}>{compareIds.length}</span>}
              </NavLink>
              <NavLink to="/applications" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                <ClipboardList size={16} />
                <span>Applications</span>
              </NavLink>
              <NavLink to="/saved" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                <Heart size={16} />
                <span>Saved</span>
                {savedIds.length > 0 && <span className="chip" style={{ marginLeft: '4px' }}>{savedIds.length}</span>}
              </NavLink>
            </nav>
          </div>

              <div className="row" style={{ gap: '10px' }}>
                <Link to="/provider/tours" className="btn btn--sm btn--ghost hide-mobile" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {user && (role === 'provider' || role === 'admin') ? 'Create 3D tour' : '3D tours'}
                </Link>
                {!isFirebaseConfigured && (
                  <span className="pill pill--amber" title="Configure your .env file with Firebase credentials to enable live database persistence">
                    Demo Mode
                  </span>
                )}

                {user ? (
                  <div className="row" style={{ gap: '8px' }}>
                    <span className="tiny hide-mobile" style={{ fontWeight: 600 }}>{user.email || profile.name}</span>
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

      {createPortal(
        <nav className="app-floating-nav" aria-label="Primary navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <House size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>
            <SearchIcon size={20} />
            <span>Search</span>
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => (isActive ? 'active' : '')}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitCompareArrows size={20} />
              {compareIds.length > 0 && <span className="nav-badge">{compareIds.length}</span>}
            </div>
            <span>Compare</span>
          </NavLink>
          <NavLink to="/applications" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ClipboardList size={20} />
            <span>Applications</span>
          </NavLink>
          <NavLink to="/saved" className={({ isActive }) => (isActive ? 'active' : '')}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} />
              {savedIds.length > 0 && <span className="nav-badge">{savedIds.length}</span>}
            </div>
            <span>Saved</span>
          </NavLink>
        </nav>,
        document.body
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};

