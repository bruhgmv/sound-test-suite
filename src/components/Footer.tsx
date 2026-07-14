import type { Tab } from '../types';
import { Activity } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/minimal_bw_sound_logo_1784013796271.jpg';

interface FooterProps {
  setActiveTab: (tab: Tab) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  return (
    <footer className="w-full bg-canvas border-t border-hairline py-12 px-6 mt-auto">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Tools */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold tracking-wider text-hairline-strong uppercase mb-4">
              Diagnostic Tools
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => setActiveTab('speaker')}
                  className="font-sans text-xs text-body hover:text-ink transition-colors cursor-pointer text-left focus:outline-none"
                >
                  Oscilloscope & Sweep Test
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('left-right')}
                  className="font-sans text-xs text-body hover:text-ink transition-colors cursor-pointer text-left focus:outline-none"
                >
                  Stereo Left & Right Channel
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('headphones')}
                  className="font-sans text-xs text-body hover:text-ink transition-colors cursor-pointer text-left focus:outline-none"
                >
                  Headphone Wiring & Phase
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('microphone')}
                  className="font-sans text-xs text-body hover:text-ink transition-colors cursor-pointer text-left focus:outline-none"
                >
                  Microphone Waveform & Recorder
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Privacy */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold tracking-wider text-hairline-strong uppercase mb-4">
              Security & Privacy
            </h4>
            <ul className="space-y-2.5">
              <li className="font-sans text-xs text-body">
                <span className="block font-medium text-ink">100% Client-Side</span>
                No audio data leaves your device. All rendering is local.
              </li>
              <li className="font-sans text-xs text-body">
                <span className="block font-medium text-ink">Zero Server Logs</span>
                We do not collect or monitor recordings or playbacks.
              </li>
            </ul>
          </div>

          {/* Column 3: Tech Info */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold tracking-wider text-hairline-strong uppercase mb-4">
              Developer Info
            </h4>
            <ul className="space-y-2.5">
              <li className="font-sans text-xs text-body">
                Built with <span className="font-mono text-[11px] bg-canvas-soft-2 px-1 py-0.5 rounded text-ink">Web Audio API</span>
              </li>
              <li className="font-sans text-xs text-body">
                Responsive canvas-drawn visualization grids
              </li>
              <li className="font-sans text-xs text-body">
                Fully offline-capable architecture
              </li>
            </ul>
          </div>

          {/* Column 4: Comparisons */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold tracking-wider text-hairline-strong uppercase mb-4">
              Why Sound Test?
            </h4>
            <ul className="space-y-2.5">
              <li className="font-sans text-xs text-body">
                <span className="text-ink font-medium">High Fidelity:</span> Advanced audio generation algorithms.
              </li>
              <li className="font-sans text-xs text-body">
                <span className="text-ink font-medium">Immediate Feed:</span> Realtime sample rates & phase toggles.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hairline pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-ink overflow-hidden flex items-center justify-center border border-hairline">
              <img 
                src="/logo.jpg" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.getAttribute('data-fallback')) {
                    target.setAttribute('data-fallback', 'true');
                    target.src = logoImg;
                  } else {
                    target.style.display = 'none';
                    const fb = target.nextElementSibling;
                    if (fb) fb.classList.remove('hidden');
                  }
                }}
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="logo-fallback hidden w-full h-full flex items-center justify-center bg-ink text-brand-cyan">
                <Activity className="w-3 h-3" />
              </div>
            </div>
            <span className="font-sans text-[11px] text-body">
              © {new Date().getFullYear()} Sound Test Suite. Inspired by elegant, performance-first aesthetics.
            </span>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-[10px] text-hairline-strong">V1.0.0-PRO</span>
            <span className="font-mono text-[10px] text-hairline-strong">CLIENT-ONLY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
