import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Active Unregistration and Cache Clearing to prevent browser caching of old website versions.
// This solves the issue where iPhones and desktop browsers display outdated code/data.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered stale service worker to ensure latest code is loaded.');
        }
      });
    }
  }).catch((err) => {
    console.warn('Error fetching service worker registrations:', err);
  });
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name).then(() => {
        console.log('Successfully deleted browser cache bucket:', name);
      });
    }
  }).catch((err) => {
    console.warn('Error clearing caches:', err);
  });
}

