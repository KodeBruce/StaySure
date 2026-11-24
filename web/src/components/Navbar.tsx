import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { useResearchSelection } from '../data/researchSelection';
import { House, Search as SearchIcon, GitCompareArrows, ClipboardList, Heart, User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const researchCompared = useResearchSelection('compare');
  const researchSaved = useResearchSelection('saved');
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="topnav" id="topnav">
        <div className="wrap topnav-inner">
          <Link to="/" className="logo brand" aria-label="StaySure home">
            <svg width="38" height="38" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <rect width="100" height="100" rx="24" fill="#13234f" />
              <path d="M 25 47 L 50 24 L 75 47 M 33 46 V 70 H 67 V 46"
                stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 35 70.5 L 48.5 78.5 L 68 61.5"
                stroke="#249f60" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="brand-word">Stay<em>Sure</em></span>
          </Link>

          <nav className="desktop-links" aria-label="Primary navigation">
            <NavLink to="/" end data-walkthrough-tab="home">
              <House size={16} aria-hidden="true" />
              <span>Home</span>
            </NavLink>
            <NavLink to="/search" data-walkthrough-tab="search">
              <SearchIcon size={16} aria-hidden="true" />
              <span>Search</span>
            </NavLink>
            <NavLink to="/compare" data-walkthrough-tab="compare">
              <GitCompareArrows size={16} aria-hidden="true" />
              <span>Compare</span>
              {researchCompared.ids.length > 0 && <span className="desktop-nav-count">{researchCompared.ids.length}</span>}
            </NavLink>
            <NavLink to="/applications" data-walkthrough-tab="applications">
              <ClipboardList size={16} aria-hidden="true" />
              <span>Applications</span>
            </NavLink>
            <NavLink to="/saved" data-walkthrough-tab="saved">
              <Heart size={16} aria-hidden="true" />
              <span>Saved</span>
              {researchSaved.ids.length > 0 && <span className="desktop-nav-count">{researchSaved.ids.length}</span>}
            </NavLink>
          </nav>

          <div className="nav-right">
            <button
              type="button"
              className="nav-action nav-person-btn"
              onClick={user ? () => signOut() : () => setShowAuth(true)}
              title={user ? (user.email || profile.name || 'Sign out') : 'Sign in'}
              aria-label={user ? 'Sign out' : 'Sign in'}
            >
              {user ? <LogOut size={16} aria-hidden="true" /> : <User size={18} aria-hidden="true" />}
              <span>{user ? 'Sign out' : 'Sign in'}</span>
            </button>
          </div>
        </div>
      </header>

      {createPortal(
        <nav className="app-floating-nav" aria-label="Primary navigation">
          <NavLink to="/" end data-walkthrough-tab="home" className={({ isActive }) => (isActive ? 'active' : '')}>
            <House size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" data-walkthrough-tab="search" className={({ isActive }) => (isActive ? 'active' : '')}>
            <SearchIcon size={20} />
            <span>Search</span>
          </NavLink>
          <NavLink to="/compare" data-walkthrough-tab="compare" className={({ isActive }) => (isActive ? 'active' : '')}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitCompareArrows size={20} />
              {researchCompared.ids.length > 0 && <span className="nav-badge">{researchCompared.ids.length}</span>}
            </div>
            <span>Compare</span>
          </NavLink>
          <NavLink to="/applications" data-walkthrough-tab="applications" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ClipboardList size={20} />
            <span>Applications</span>
          </NavLink>
          <NavLink to="/saved" data-walkthrough-tab="saved" className={({ isActive }) => (isActive ? 'active' : '')}>
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

