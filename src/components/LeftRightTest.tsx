import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LeftRightTest() {
  const [activeSpeaker, setActiveSpeaker] = useState<'none' | 'left' | 'right'>('none');
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const isLoopingRef = useRef(false);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.connect(ctx.destination);

    audioCtxRef.current = ctx;
    gainNodeRef.current = gainNode;
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.01);
    }
  }, [volume]);

  // Clean up loops on unmount
  useEffect(() => {
    return () => {
      isLoopingRef.current = false;
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, []);

  const playPannedArpeggio = (side: 'left' | 'right') => {
    initAudio();
    const ctx = audioCtxRef.current;
    const gainNode = gainNodeRef.current;
    if (!ctx || !gainNode) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    setActiveSpeaker(side);

    // Create stereo panner
    const panner = ctx.createStereoPanner();
    const panVal = side === 'left' ? -1.0 : 1.0;
    panner.pan.setValueAtTime(panVal, ctx.currentTime);
    panner.connect(gainNode);

    // Arpeggio details
    const notes = side === 'left' 
      ? [261.63, 329.63, 392.00] // C4, E4, G4 (Rising)
      : [392.00, 329.63, 261.63]; // G4, E4, C4 (Falling)

    const now = ctx.currentTime;
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);

      noteGain.gain.setValueAtTime(0, now + index * 0.15);
      noteGain.gain.linearRampToValueAtTime(0.25, now + index * 0.15 + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.55);

      osc.connect(noteGain);
      noteGain.connect(panner);

      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.6);
    });

    // Reset speaker ring highlight after sound finishes
    setTimeout(() => {
      setActiveSpeaker('none');
    }, 1000);
  };

  const triggerStereoSequence = () => {
    initAudio();
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    isLoopingRef.current = true;
    setIsLooping(true);
    
    const playNext = (index: number) => {
      if (!isLoopingRef.current) return;
      const targetSide = index % 2 === 0 ? 'left' : 'right';
      playPannedArpeggio(targetSide);
      
      loopTimeoutRef.current = window.setTimeout(() => {
        playNext(index + 1);
      }, 1500);
    };

    playNext(0);
  };

  const stopStereoSequence = () => {
    isLoopingRef.current = false;
    setIsLooping(false);
    setActiveSpeaker('none');
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <div className="mb-10 text-center md:text-left">
        <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
          Diagnostic Tool
        </span>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink mb-3">
          Left & Right Speaker Test
        </h1>
        <p className="font-sans text-xs sm:text-sm text-body max-w-xl">
          Click Left or Right to test your speakers separately. If your headphones or speakers are connected correctly, the sound should come out of only that side.
        </p>
      </div>

      {/* Main Speakers Canvas */}
      <div className="bg-canvas border border-hairline p-8 rounded-lg premium-shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center justify-center">
          
          {/* LEFT Speaker Panel */}
          <div className="flex flex-col items-center p-6 bg-canvas-soft border border-hairline rounded-lg relative overflow-hidden">
            {/* Pulsing Visualizer Rings */}
            {activeSpeaker === 'left' && (
              <>
                <div className="absolute w-44 h-44 rounded-full border border-brand-cyan/20 speaker-ring pointer-events-none" />
                <div className="absolute w-56 h-54 rounded-full border border-brand-cyan/10 speaker-ring pointer-events-none [animation-delay:0.3s]" />
              </>
            )}

            <div className={`relative z-10 w-32 h-32 flex flex-col justify-center items-center mb-6 transition-transform duration-200 ${activeSpeaker === 'left' ? 'scale-105' : ''}`}>
              {/* Speaker Box Vector Visual representation */}
              <div className={`w-16 h-28 border-2 rounded bg-ink relative flex flex-col items-center justify-between py-4 shadow ${activeSpeaker === 'left' ? 'border-brand-cyan' : 'border-ink'}`}>
                {/* Tweeter */}
                <div className={`w-8 h-8 rounded-full border-2 bg-canvas-soft-2 flex items-center justify-center ${activeSpeaker === 'left' ? 'border-brand-cyan' : 'border-hairline-strong'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full ${activeSpeaker === 'left' ? 'bg-brand-cyan' : 'bg-hairline-strong'}`} />
                </div>
                {/* Woofer */}
                <div className={`w-10 h-10 rounded-full border-2 bg-canvas-soft-2 flex items-center justify-center ${activeSpeaker === 'left' ? 'border-brand-cyan' : 'border-hairline-strong'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${activeSpeaker === 'left' ? 'border-brand-cyan/30' : 'border-hairline'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${activeSpeaker === 'left' ? 'bg-brand-cyan' : 'bg-hairline-strong'}`} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => playPannedArpeggio('left')}
              className={`px-5 py-2 rounded-full font-sans text-xs font-semibold cursor-pointer border transition-all ${
                activeSpeaker === 'left'
                  ? 'bg-brand-cyan border-brand-cyan text-ink font-bold'
                  : 'bg-canvas border-hairline hover:border-hairline-strong text-ink'
              }`}
            >
              Test Left Speaker
            </button>
            <span className="font-mono text-[10px] text-hairline-strong uppercase tracking-wider mt-3">
              Rising Notes (Low to High)
            </span>
          </div>

          {/* RIGHT Speaker Panel */}
          <div className="flex flex-col items-center p-6 bg-canvas-soft border border-hairline rounded-lg relative overflow-hidden">
            {/* Pulsing Visualizer Rings */}
            {activeSpeaker === 'right' && (
              <>
                <div className="absolute w-44 h-44 rounded-full border border-brand-violet/20 speaker-ring pointer-events-none" />
                <div className="absolute w-56 h-54 rounded-full border border-brand-violet/10 speaker-ring pointer-events-none [animation-delay:0.3s]" />
              </>
            )}

            <div className={`relative z-10 w-32 h-32 flex flex-col justify-center items-center mb-6 transition-transform duration-200 ${activeSpeaker === 'right' ? 'scale-105' : ''}`}>
              {/* Speaker Box Vector Visual representation */}
              <div className={`w-16 h-28 border-2 rounded bg-ink relative flex flex-col items-center justify-between py-4 shadow ${activeSpeaker === 'right' ? 'border-brand-violet' : 'border-ink'}`}>
                {/* Tweeter */}
                <div className={`w-8 h-8 rounded-full border-2 bg-canvas-soft-2 flex items-center justify-center ${activeSpeaker === 'right' ? 'border-brand-violet' : 'border-hairline-strong'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full ${activeSpeaker === 'right' ? 'bg-brand-violet' : 'bg-hairline-strong'}`} />
                </div>
                {/* Woofer */}
                <div className={`w-10 h-10 rounded-full border-2 bg-canvas-soft-2 flex items-center justify-center ${activeSpeaker === 'right' ? 'border-brand-violet' : 'border-hairline-strong'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${activeSpeaker === 'right' ? 'border-brand-violet/30' : 'border-hairline'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${activeSpeaker === 'right' ? 'bg-brand-violet' : 'bg-hairline-strong'}`} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => playPannedArpeggio('right')}
              className={`px-5 py-2 rounded-full font-sans text-xs font-semibold cursor-pointer border transition-all ${
                activeSpeaker === 'right'
                  ? 'bg-brand-violet border-brand-violet text-canvas font-bold'
                  : 'bg-canvas border-hairline hover:border-hairline-strong text-ink'
              }`}
            >
              Test Right Speaker
            </button>
            <span className="font-mono text-[10px] text-hairline-strong uppercase tracking-wider mt-3">
              Falling Notes (High to Low)
            </span>
          </div>

        </div>
      </div>

      {/* Looping Automation and Volume panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Loop Trigger Card */}
        <div className="md:col-span-2 bg-canvas border border-hairline p-5 rounded-lg flex items-center justify-between premium-shadow-sm">
          <div>
            <span className="font-sans font-bold text-xs text-ink block mb-0.5">
              Hands-Free Auto Test
            </span>
            <p className="font-sans text-[11px] text-body max-w-sm leading-relaxed">
              Play a continuous test that automatically switches between Left and Right sides every 1.5 seconds.
            </p>
          </div>
          <div>
            {isLooping ? (
              <button
                onClick={stopStereoSequence}
                className="px-4 py-2 bg-ink text-canvas border border-ink rounded-full font-sans text-xs font-semibold cursor-pointer hover:bg-ink/90 flex items-center gap-1.5"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Stop Auto Test
              </button>
            ) : (
              <button
                onClick={triggerStereoSequence}
                className="px-4 py-2 bg-canvas text-ink border border-hairline hover:border-hairline-strong rounded-full font-sans text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Auto Test
              </button>
            )}
          </div>
        </div>

        {/* Volume controls card */}
        <div className="md:col-span-1 bg-canvas border border-hairline p-5 rounded-lg premium-shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Volume
            </span>
            <span className="font-mono text-xs font-semibold text-ink">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-canvas-soft-2 rounded-lg appearance-none cursor-pointer accent-ink"
          />
        </div>
      </div>

      {/* Helpful Instructions callout */}
      <div className="mt-8 bg-canvas border border-hairline p-5 rounded-lg flex gap-3.5 items-start">
        <AlertTriangle className="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-sans font-semibold text-xs text-ink block mb-0.5">
            Having trouble isolating sound?
          </span>
          <p className="font-sans text-[11px] text-body leading-relaxed">
            If left speaker sounds leak into your right ear (or vice versa), check if your computer has "Mono Audio" enabled. On Windows, go to Settings &gt; Accessibility &gt; Audio &gt; Mono Audio. On Mac, check Settings &gt; Accessibility &gt; Audio &gt; Play stereo audio as mono.
          </p>
        </div>
      </div>
    </div>
  );
}
