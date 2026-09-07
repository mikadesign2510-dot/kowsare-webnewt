import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initErrorLogger } from './lib/errorLogger';


// Clean up deprecated source.unsplash.com URLs that cause "Rate exceeded" images
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value && value.includes('unsplash.com')) {
        const newValue = value.replace(/https:\/\/(?:images|source)\.unsplash\.com\/[^"'\\s\?}]+(?:\?[^"'\\s}]*)?/g, 'https://picsum.photos/seed/fallback/1200/800');
        localStorage.setItem(key, newValue);
      }
    }
  }
} catch (e) {
  console.error("Failed to clean up localStorage", e);
}

// Initialize global error logging

initErrorLogger();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
