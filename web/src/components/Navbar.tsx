import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { useResearchSelection } from '../data/researchSelection';
import { House, Search as SearchIcon, GitCompareArrows, ClipboardList, Heart } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, profile, signOut } = useAuth();
  const researchCompared = useResearchSelection('compare');
  const researchSaved = useResearchSelection('saved');
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="topnav" id="topnav">
        <div className="wrap row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div className="row" style={{ gap: '20px' }}>
            <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="StaySure logo" role="img" style={{ flexShrink: 0 }}>
                  {/* Deep navy rounded square icon base */}
                  <rect width="100" height="100" rx="24" fill="#13234f" />
                  {/* House roof outline — thick white stroke */}
                  <path
                    d="M 25 47 L 50 24 L 75 47"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* House walls and floor outline — thick white stroke */}
                  <path
                    d="M 33 46 V 70 H 67 V 46"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Green checkmark at bottom */}
                  <path
                    d="M 35 70.5 L 48.5 78.5 L 68 61.5"
                    stroke="#249f60"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#13234f', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    Stay<span style={{ color: '#249f60' }}>Sure</span>
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
                    {researchCompared.ids.length > 0 && <span className="chip" style={{ background: 'var(--green-soft)', color: 'var(--green-ink)', marginLeft: '4px' }}>{researchCompared.ids.length}</span>}
                  </NavLink>
                  <NavLink to="/applications" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                    <ClipboardList size={16} />
                    <span>Applications</span>
                  </NavLink>
                  <NavLink to="/saved" className={({ isActive }) => `pill ${isActive ? 'pill--navy' : 'pill--ghost'}`}>
                    <Heart size={16} />
                    <span>Saved</span>
                    {researchSaved.ids.length > 0 && <span className="chip" style={{ marginLeft: '4px' }}>{researchSaved.ids.length}</span>}
                  </NavLink>
                </nav>
              </div>

              <div className="row" style={{ gap: '10px' }}>
                <Link to="/provider/tours" className="btn btn--sm btn--ghost hide-mobile" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {user && (role === 'provider' || role === 'admin') ? 'Create 3D tour' : '3D tours'}
                </Link>

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
              {researchCompared.ids.length > 0 && <span className="nav-badge">{researchCompared.ids.length}</span>}
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
              {researchSaved.ids.length > 0 && <span className="nav-badge">{researchSaved.ids.length}</span>}
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

