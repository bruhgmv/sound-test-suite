import React from 'react';
import { Activity, Headphones, Mic, Volume2, Music4, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import type { Tab } from '../types';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Header({ activeTab, setActiveTab, theme, toggleTheme }: HeaderProps) {
  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'speaker', label: 'Speaker Test', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'left-right', label: 'Left/Right Speaker', icon: <Music4 className="w-4 h-4" /> },
    { id: 'headphones', label: 'Headphone Test', icon: <Headphones className="w-4 h-4" /> },
    { id: 'microphone', label: 'Microphone Test', icon: <Mic className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-canvas/80 backdrop-blur-md border-b border-hairline h-16">
      <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <button 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded bg-ink overflow-hidden transition-transform duration-200 group-hover:scale-105 border border-hairline">
            <img 
              src="/logo.jpg" 
              alt="Sound Test Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="font-sans font-semibold tracking-tight text-ink text-sm block leading-tight">Sound Test</span>
            <span className="font-mono text-[10px] text-hairline-strong uppercase tracking-wider block">Diagnostics</span>
          </div>
        </button>

        {/* Centered Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative px-3 py-1.5 rounded-full font-sans text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none flex items-center gap-1.5 text-body hover:text-ink"
              >
                {isActive && (
                  <motion.div
                    layoutId="header-active-pill"
                    className="absolute inset-0 bg-canvas-soft-2 border border-hairline rounded-full z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.icon}
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right aligned CTA & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink transition-all duration-150 cursor-pointer focus:outline-none"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-brand-cyan" />
            ) : (
              <Moon className="w-4 h-4 text-brand-violet" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('microphone')}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-semibold cursor-pointer border transition-all duration-200 focus:outline-none ${
              activeTab === 'microphone'
                ? 'bg-ink text-canvas border-ink hover:bg-ink/90'
                : 'bg-ink text-canvas border-ink hover:bg-ink/90 shadow-sm'
            }`}
          >
            Test Microphone
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex md:hidden bg-canvas border-b border-hairline px-4 py-2 overflow-x-auto gap-2 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full font-sans text-xs font-medium flex items-center gap-1.5 border transition-all ${
                isActive
                  ? 'bg-ink text-canvas border-ink'
                  : 'bg-canvas-soft text-body border-hairline hover:text-ink'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
