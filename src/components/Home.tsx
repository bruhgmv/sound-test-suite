import React, { useState } from 'react';
import { Volume2, Music4, Headphones, Mic, Sparkles, Check, ChevronDown, ShieldAlert, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Tab, FAQItem } from '../types';

interface HomeProps {
  setActiveTab: (tab: Tab) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isPlayingQuickTest, setIsPlayingQuickTest] = useState(false);

  const tools: { id: Tab; label: string; description: string; detail: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'speaker',
      label: 'Speaker Pitch Test',
      description: 'Test Pitch & Volume Limit',
      detail: 'Play different sound pitches from low bass to high treble to check your speaker limits and view live waveforms.',
      icon: <Volume2 className="w-5 h-5" />,
      color: 'hover:border-brand-cyan/40 group-hover:text-brand-cyan',
    },
    {
      id: 'left-right',
      label: 'Left/Right Speaker Balance',
      description: 'Check Left & Right Sound',
      detail: 'Play sounds through only the left or right speaker to make sure both sides are working equally.',
      icon: <Music4 className="w-5 h-5" />,
      color: 'hover:border-brand-violet/40 group-hover:text-brand-violet',
    },
    {
      id: 'headphones',
      label: 'Headphone Spatial Test',
      description: 'Check Balance & 3D Radar',
      detail: 'Test if your headphones have correct wiring (phase check) and play with interactive 3D sound panning.',
      icon: <Headphones className="w-5 h-5" />,
      color: 'hover:border-brand-pink/40 group-hover:text-brand-pink',
    },
    {
      id: 'microphone',
      label: 'Microphone Tester',
      description: 'Record & Check Voice Stream',
      detail: 'Record your voice for up to 10 seconds, play it back, check microphone specs, and see your live soundwave.',
      icon: <Mic className="w-5 h-5" />,
      color: 'hover:border-brand-cyan/40 group-hover:text-brand-cyan',
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'Is my microphone recording private?',
      answer: 'Yes. Sound Test is a 100% private, client-side utility built using the HTML5 Web Audio API. Your browser captures mic streams and synthesizes audio entirely within your machine’s processor. No server uploads ever take place.',
    },
    {
      question: 'How does the Phase alignment check work?',
      answer: 'Our phase test plays audio in two modes. "In Phase" duplicates a synchronized signal in both channels, making the sound feel centered. "Out of Phase" inverts the right channel waveform by 180 degrees. If your wiring is correct, Out of Phase audio will sound distinctly hollow, wide, and lateral.',
    },
    {
      question: 'Why doesn\'t the high-frequency sweep sound loud?',
      answer: 'Human hearing spans roughly 20 Hz to 20,000 Hz, but our sensitivity falls off sharply at extreme ends. Higher frequencies require better speakers/headphones and highly attentive ears. Be sure to turn your system volume down to comfortable levels first to avoid hearing stress!',
    },
    {
      question: 'Does this work on mobile browsers?',
      answer: 'Yes, it works beautifully on Safari, Chrome, and Firefox on iOS and Android. Mobile devices require manual screen interaction (like clicking the play button) to grant permissions and let the browser initiate the audio session.',
    },
  ];

  const playQuickArpeggio = () => {
    if (isPlayingQuickTest) return;
    setIsPlayingQuickTest(true);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        setIsPlayingQuickTest(false);
        return;
      }
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Play C4, E4, G4, C5 arpeggio chime sequence
      const freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High quality triangle and sine blend
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        // Smooth amplitude envelopes
        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, now + index * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.6);
      });

      setTimeout(() => {
        setIsPlayingQuickTest(false);
      }, 950);
    } catch (e) {
      console.error(e);
      setIsPlayingQuickTest(false);
    }
  };

  return (
    <div className="flex-1 w-full">
      {/* Hero Section & Mesh Backdrop */}
      <section className="relative mesh-gradient py-20 px-6 border-b border-hairline overflow-hidden">
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-hairline bg-canvas-soft premium-shadow-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider">
              Diagnostic Suite
            </span>
          </div>

          <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink mb-6 max-w-3xl mx-auto leading-tight">
            Verify your sound. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ink via-body to-hairline-strong">
              Period.
            </span>
          </h1>

          <p className="font-sans text-sm sm:text-base text-body max-w-xl mx-auto mb-10 leading-relaxed">
            Privacy-first audio diagnostic workstation. Test speakers, spatial headphones, channels, and microphones with clean signal sweeps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('speaker')}
              className="w-full sm:w-auto px-6 py-3 rounded-full font-sans text-xs font-semibold bg-ink text-canvas border border-ink hover:bg-ink/90 transition-all duration-150 shadow-sm cursor-pointer"
            >
              Launch Suite Workspace
            </button>

            {/* Quick Test Widget */}
            <div className="w-full sm:w-auto flex items-center justify-center">
              <button
                onClick={playQuickArpeggio}
                disabled={isPlayingQuickTest}
                className="w-full sm:w-auto px-6 py-3 rounded-full font-sans text-xs font-semibold bg-canvas text-ink border border-hairline hover:border-hairline-strong transition-all duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <div className={`w-2 h-2 rounded-full bg-brand-cyan ${isPlayingQuickTest ? 'animate-ping' : ''}`} />
                {isPlayingQuickTest ? 'Synthesizing...' : 'Quick Chime Test'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Selection */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="mb-12">
          <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
            Workstation Tools
          </span>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            A comprehensive suite for diagnostic clarity.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={`group bg-canvas border border-hairline p-6 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer flex flex-col justify-between ${tool.color}`}
            >
              <div>
                <div className="w-10 h-10 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center mb-5 transition-colors group-hover:bg-ink group-hover:text-canvas">
                  {tool.icon}
                </div>
                <h3 className="font-sans text-base font-semibold tracking-tight text-ink group-hover:translate-x-0.5 transition-transform duration-200">
                  {tool.label}
                </h3>
                <p className="font-mono text-[11px] text-hairline-strong uppercase tracking-wider mb-3">
                  {tool.description}
                </p>
                <p className="font-sans text-xs text-body leading-relaxed">
                  {tool.detail}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 font-sans text-xs font-semibold text-ink group-hover:underline">
                Open Utility →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Competitor Improvements & Privacy Section */}
      <section className="py-16 px-6 bg-canvas-soft border-t border-b border-hairline">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
              Privacy & Performance
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-6">
              Clean, accurate testing. Free from advertising clutter.
            </h2>
            <p className="font-sans text-sm text-body leading-relaxed mb-8">
              Most diagnostic tools are loaded with flashing ads, auto-playing video popups, and obscure server-bound file uploads. Sound Test establishes an eye-safe, zero-clutter developer aesthetic.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-ink text-canvas flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <div className="font-sans text-xs text-body">
                  <span className="font-semibold text-ink block">Zero Server Overhead</span>
                  Local oscillators trigger instantly.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-ink text-canvas flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <div className="font-sans text-xs text-body">
                  <span className="font-semibold text-ink block">Ad-Free Workspace</span>
                  Stark minimalist view for audio focus.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-ink text-canvas flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <div className="font-sans text-xs text-body">
                  <span className="font-semibold text-ink block">Full Spec Logs</span>
                  In-depth sample rate diagnostic readouts.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-ink text-canvas flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <div className="font-sans text-xs text-body">
                  <span className="font-semibold text-ink block">Safe Envelopes</span>
                  Frequency curves are clamped to prevent pops.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center text-brand-violet">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="font-sans font-semibold text-sm text-ink">Client-Side Architecture</span>
              </div>
              <p className="font-sans text-xs text-body leading-relaxed">
                By utilizing browser-native Web Audio AudioContext engines, we bypass network transfers completely. This guarantees absolute compliance for corporate, workspace, and professional device setup audits.
              </p>
            </div>

            <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center text-brand-cyan">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-sans font-semibold text-sm text-ink">Professional Precision</span>
              </div>
              <p className="font-sans text-xs text-body leading-relaxed">
                Render signals on dedicated vector-based HTML5 canvas grids. Measure the purity of microphone feedback with realtime Fast Fourier Transform (FFT) analysis matrices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
            Answering Inquiries
          </span>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Frequently Asked Questions.
          </h2>
        </div>

        <div className="border border-hairline rounded-lg bg-canvas divide-y divide-hairline premium-shadow-sm overflow-hidden">
          {faqs.map((faq, i) => {
            const isOpen = activeFAQ === i;
            return (
              <div key={i} className="font-sans">
                <button
                  onClick={() => setActiveFAQ(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-sm text-ink bg-canvas hover:bg-canvas-soft transition-colors duration-150 cursor-pointer focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-hairline-strong transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-xs text-body leading-relaxed bg-canvas border-t border-hairline/40">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
