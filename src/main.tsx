// Patch window.fetch before any other libraries load to prevent "Cannot set property fetch of #<Window> which has only a getter" errors in sandboxed environments.
try {
  const originalFetch = window.fetch;
  if (originalFetch) {
    let currentFetch = originalFetch;
    
    // We try to patch Window.prototype first because in modern browsers, fetch is defined on Window.prototype.
    // Overriding it there with a getter and setter allows downstream assignments (e.g. window.fetch = ...) to succeed.
    try {
      Object.defineProperty(Window.prototype, 'fetch', {
        get() {
          return currentFetch;
        },
        set(v) {
          currentFetch = v;
        },
        configurable: true,
        enumerable: true
      });
    } catch (e1) {
      // Fallback: try patching window directly with getter/setter
      try {
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
      } catch (e2) {
        // Fallback 2: try defining standard writable property on window
        Object.defineProperty(window, 'fetch', {
          value: originalFetch,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
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

