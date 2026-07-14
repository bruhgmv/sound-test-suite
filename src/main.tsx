// Patch window.fetch before any other libraries load to prevent "Cannot set property fetch of #<Window> which has only a getter" errors in sandboxed environments.
try {
  const originalFetch = window.fetch;
  if (originalFetch) {
    let currentFetch = originalFetch;
    try {
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      Object.defineProperty(window, 'fetch', {
        get() {
          return currentFetch;
        },
        set(v) {
          currentFetch = v;
        },
        configurable: true,
        enumerable: true
      });
    }
  }
} catch (err) {
  console.warn("Could not patch window.fetch:", err);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

