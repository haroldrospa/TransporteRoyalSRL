
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Handle chunk load errors when a new version is deployed to production
window.addEventListener('vite:preloadError', (event) => {
  console.warn('⚡ Nueva versión detectada (preloadError). Recargando automáticamente...', event);
  const reloadKey = 'last_vite_preload_ts';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
    sessionStorage.setItem(reloadKey, now.toString());
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.href = `${cleanUrl}?_t=${now}`;
  }
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
