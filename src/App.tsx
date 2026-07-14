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
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

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

