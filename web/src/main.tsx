import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/screens.css';

// Links shared by the earlier static prototype used hash routes. Keep those
// links working when they open the React app, which uses browser routes.
if (window.location.pathname === '/' && /^#\/(search|results)(?:[/?]|$)/.test(window.location.hash)) {
  window.history.replaceState(null, '', '/search');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

