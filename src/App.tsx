/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Tab } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import SpeakerTest from './components/SpeakerTest';
import LeftRightTest from './components/LeftRightTest';
import HeadphoneTest from './components/HeadphoneTest';
import MicrophoneTest from './components/MicrophoneTest';

export default function App() {
  // Helper to resolve the correct tab based on current URL path
  const getTabFromPath = (): Tab => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (path === 'speaker' || path === 'left-right' || path === 'headphones' || path === 'microphone') {
      return path as Tab;
    }
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return getTabFromPath();
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  // Handle browser back/forward buttons (History API synchronization)
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state changes back to the browser URL pathname
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
      const targetPath = activeTab === 'home' ? '' : activeTab;
      
      if (currentPath !== targetPath) {
        window.history.pushState(null, '', `/${targetPath}`);
      }
    }
  }, [activeTab]);

  // Handle dynamic document metadata updates for SEO, Open Graph, Twitter, and JSON-LD Structured Data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const metadataMap: Record<Tab, {
      title: string;
      description: string;
      keywords: string;
      canonical: string;
      schema: object;
    }> = {
      home: {
        title: "Sound Test Suite - Professional Audio & Microphone Diagnostics",
        description: "A premium, private client-side audio diagnostic workstation for testing speakers, spatial panning headphones, stereo channels, and microphones.",
        keywords: "sound test, speaker test, microphone test, headphone test, audio test, left right sound test, stereo test, audio diagnostics",
        canonical: "https://onlinesoundtest.vercel.app/",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Sound Test Suite",
          "url": "https://onlinesoundtest.vercel.app/",
          "description": "Professional client-side audio diagnostic workstation for testing speakers, spatial panning headphones, stereo channels, and microphones.",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
          }
        }
      },
      speaker: {
        title: "Online Speaker Pitch & Frequency Test | Sound Test Suite",
        description: "Check your speaker frequency limits and volume clarity. Play low-end sub-bass sweeps up to high-frequency treble pitches with dynamic waveform rendering.",
        keywords: "speaker test, pitch test, speaker frequency test, sound frequency sweep, speaker diagnostics",
        canonical: "https://onlinesoundtest.vercel.app/speaker",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Online Speaker Pitch & Frequency Test",
          "url": "https://onlinesoundtest.vercel.app/speaker",
          "description": "Check your speaker frequency limits and volume clarity with high fidelity sweeps."
        }
      },
      'left-right': {
        title: "Stereo Left Right Sound Test & Balance | Sound Test Suite",
        description: "Verify your stereo audio balance. Test individual left and right audio channels to troubleshoot speaker or headphone balance issues.",
        keywords: "left right sound test, stereo test, speaker balance, audio balance test, sound channel test",
        canonical: "https://onlinesoundtest.vercel.app/left-right",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Stereo Left Right Sound Test & Balance",
          "url": "https://onlinesoundtest.vercel.app/left-right",
          "description": "Verify your stereo audio balance and test individual left and right audio channels."
        }
      },
      headphones: {
        title: "Spatial Headphone 3D Radar & Phase Test | Sound Test Suite",
        description: "Test spatial audio and wiring phase. Interactive 3D sound panning radar checks 360-degree acoustics and wiring alignment.",
        keywords: "headphone test, spatial audio test, 3d audio test, headphone phase test, sound balance",
        canonical: "https://onlinesoundtest.vercel.app/headphones",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Spatial Headphone 3D Radar & Phase Test",
          "url": "https://onlinesoundtest.vercel.app/headphones",
          "description": "Interactive 3D headphone panning and polarity/phase diagnostic sweep."
        }
      },
      microphone: {
        title: "Free Online Microphone Test & Recorder | Sound Test Suite",
        description: "Test your microphone recording quality and system specs. Secure browser-local recording with live Fast Fourier Transform (FFT) waveform analytics.",
        keywords: "microphone test, mic test online, record microphone, microphone frequency test, voice recorder",
        canonical: "https://onlinesoundtest.vercel.app/microphone",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Free Online Microphone Test & Recorder",
          "url": "https://onlinesoundtest.vercel.app/microphone",
          "description": "Secure online microphone test with live oscilloscope and local recording playback."
        }
      }
    };

    const meta = metadataMap[activeTab];
    if (!meta) return;

    // 1. Update Document Title
    document.title = meta.title;

    // 2. Helper function to create/update dynamic head meta tags
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMetaTag('meta[name="description"]', 'name', 'description', meta.description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', meta.keywords);

    // Open Graph Tags
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', meta.canonical);
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', meta.title);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', meta.description);

    // Twitter Tags
    updateMetaTag('meta[property="twitter:url"]', 'property', 'twitter:url', meta.canonical);
    updateMetaTag('meta[property="twitter:title"]', 'property', 'twitter:title', meta.title);
    updateMetaTag('meta[property="twitter:description"]', 'property', 'twitter:description', meta.description);

    // 3. Update Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', meta.canonical);

    // 4. Update Schema JSON-LD Script tag
    let schemaScript = document.getElementById('seo-structured-data');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'seo-structured-data');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.innerHTML = JSON.stringify(meta.schema, null, 2);

  }, [activeTab]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-soft text-ink font-sans antialiased selection:bg-ink selection:text-canvas">
      {/* Sticky Header Nav */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1 flex flex-col w-full"
          >
            {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
            {activeTab === 'speaker' && <SpeakerTest />}
            {activeTab === 'left-right' && <LeftRightTest />}
            {activeTab === 'headphones' && <HeadphoneTest />}
            {activeTab === 'microphone' && <MicrophoneTest />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Structured Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}

