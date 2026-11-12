import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import { Navbar } from './components/Navbar';
import { CompareTray } from './components/CompareTray';
import { Landing } from './pages/Landing';
import { Search } from './pages/Search';
import { Detail } from './pages/Detail';
import { Tour } from './pages/Tour';
import { CreateTour } from './pages/CreateTour';
import { ReviewTour } from './pages/ReviewTour';
import { TourDemo } from './pages/TourDemo';
import { Compare } from './pages/Compare';
import { Apply } from './pages/Apply';
import { Applications } from './pages/Applications';
import { Saved } from './pages/Saved';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isMapSearch = location.pathname === '/search';
  return (
      <AuthProvider>
        <CompareProvider>
          <div className={`app-root${isMapSearch ? ' is-map-search' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            <main className="view" style={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/search" element={<Search />} />
                <Route path="/detail/:id" element={<Detail />} />
                <Route path="/detail/:id/tour" element={<Tour />} />
                <Route path="/provider/tours" element={<CreateTour />} />
                <Route path="/provider/tours/demo" element={<TourDemo />} />
                <Route path="/review/tour/:id" element={<ReviewTour />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/apply/:id" element={<Apply />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/saved" element={<Saved />} />
              </Routes>
            </main>

            <CompareTray />

            <footer style={{ background: '#fff', borderTop: '1px solid var(--line)', padding: '32px 0', marginTop: '64px' }}>
              <div className="wrap tc" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px' }}>
                <p className="tiny muted" style={{ maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
                  StaySure is an independent decision-support platform for student accommodation. We are not officially affiliated with the University of the Witwatersrand (Wits) or the National Student Financial Aid Scheme (NSFAS). Funding indicators and match scores are indicative calculations.
                </p>
                <div className="tiny muted mt-12">© 2026 StaySure. All rights reserved.</div>
              </div>
            </footer>
          </div>
        </CompareProvider>
      </AuthProvider>
  );
};

export const App: React.FC = () => <BrowserRouter><AppContent /></BrowserRouter>;

export default App;

