import React, { useEffect, useRef, useState } from 'react';
import { Play, Headphones, Volume2, AlertCircle } from 'lucide-react';

export default function HeadphoneTest() {
  const [isPlayingBalance, setIsPlayingBalance] = useState(false);
  const [balance, setBalance] = useState<number>(0); // -1 to 1

  const [isPlayingPhase, setIsPlayingPhase] = useState(false);
  const [phaseMode, setPhaseMode] = useState<'in' | 'out'>('in');

  const [isPlayingSpatial, setIsPlayingSpatial] = useState(false);
  const [spatialAngle, setSpatialAngle] = useState<number>(0); // In radians, 0 to 2*PI
  const [isSpatialAuto, setIsSpatialAuto] = useState(true);

  // Web Audio Context & Nodes Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const balanceOscRef = useRef<OscillatorNode | null>(null);
  const balancePannerRef = useRef<StereoPannerNode | null>(null);
  const balanceGainRef = useRef<GainNode | null>(null);

  const phaseOscRef = useRef<OscillatorNode | null>(null);
  const phaseGainLeftRef = useRef<GainNode | null>(null);
  const phaseGainRightRef = useRef<GainNode | null>(null);

  const spatialOscRef = useRef<OscillatorNode | null>(null);
  const spatialPannerRef = useRef<StereoPannerNode | null>(null);
  const spatialIntervalRef = useRef<number | null>(null);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtxRef.current = new AudioContextClass();
  };

  // Clean up all audio nodes on unmount
  useEffect(() => {
    return () => {
      stopBalanceTone();
      stopPhaseTone();
      stopSpatialTone();
    };
  }, []);

  // Update balance panner in real-time
  useEffect(() => {
    if (balancePannerRef.current && audioCtxRef.current) {
      balancePannerRef.current.pan.setTargetAtTime(balance, audioCtxRef.current.currentTime, 0.01);
    }
  }, [balance]);

  // Adjust panner value in real-time when angle changes
  useEffect(() => {
    if (spatialPannerRef.current && audioCtxRef.current) {
      const panVal = Math.sin(spatialAngle);
      spatialPannerRef.current.pan.setTargetAtTime(panVal, audioCtxRef.current.currentTime, 0.015);
    }
  }, [spatialAngle]);

  // Manage auto-rotation clock
  useEffect(() => {
    if (spatialIntervalRef.current) {
      clearInterval(spatialIntervalRef.current);
      spatialIntervalRef.current = null;
    }

    if (isPlayingSpatial && isSpatialAuto) {
      let angle = spatialAngle;
      spatialIntervalRef.current = window.setInterval(() => {
        angle = (angle + 0.05) % (2 * Math.PI);
        setSpatialAngle(angle);
      }, 30);
    }

    return () => {
      if (spatialIntervalRef.current) {
        clearInterval(spatialIntervalRef.current);
        spatialIntervalRef.current = null;
      }
    };
  }, [isPlayingSpatial, isSpatialAuto]);

  const stopBalanceTone = () => {
    if (balanceOscRef.current) {
      try {
        balanceOscRef.current.stop();
        balanceOscRef.current.disconnect();
      } catch (e) {}
      balanceOscRef.current = null;
    }
    setIsPlayingBalance(false);
  };

  const stopPhaseTone = () => {
    if (phaseOscRef.current) {
      try {
        phaseOscRef.current.stop();
        phaseOscRef.current.disconnect();
      } catch (e) {}
      phaseOscRef.current = null;
    }
    setIsPlayingPhase(false);
  };

  const stopSpatialTone = () => {
    if (spatialOscRef.current) {
      try {
        spatialOscRef.current.stop();
        spatialOscRef.current.disconnect();
      } catch (e) {}
      spatialOscRef.current = null;
    }
    if (spatialIntervalRef.current) {
      clearInterval(spatialIntervalRef.current);
      spatialIntervalRef.current = null;
    }
    setIsPlayingSpatial(false);
  };

  // Toggle buttons called directly inside user click gesture stack
  const toggleBalanceTone = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlayingBalance) {
      stopBalanceTone();
    } else {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop others to avoid noise overlap
      stopPhaseTone();
      stopSpatialTone();

      const osc = ctx.createOscillator();
      const panner = ctx.createStereoPanner();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Warm central pitch

      panner.pan.setValueAtTime(balance, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      osc.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      balanceOscRef.current = osc;
      balancePannerRef.current = panner;
      balanceGainRef.current = gain;
      setIsPlayingBalance(true);
    }
  };

  const togglePhaseTone = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlayingPhase) {
      stopPhaseTone();
    } else {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop others
      stopBalanceTone();
      stopSpatialTone();

      const osc = ctx.createOscillator();
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);

      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      const masterGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime); // Low hum is excellent for phase check

      osc.connect(splitter);
      splitter.connect(gainL, 0);
      splitter.connect(gainR, 0);

      gainL.connect(merger, 0, 0);
      gainR.connect(merger, 0, 1);

      gainL.gain.setValueAtTime(0.25, ctx.currentTime);
      gainR.gain.setValueAtTime(phaseMode === 'in' ? 0.25 : -0.25, ctx.currentTime);

      masterGain.gain.setValueAtTime(0.3, ctx.currentTime);

      merger.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start();

      phaseOscRef.current = osc;
      phaseGainLeftRef.current = gainL;
      phaseGainRightRef.current = gainR;
      setIsPlayingPhase(true);
    }
  };

  const handleSetPhaseMode = (mode: 'in' | 'out') => {
    setPhaseMode(mode);
    if (isPlayingPhase && phaseGainRightRef.current && audioCtxRef.current) {
      phaseGainRightRef.current.gain.setTargetAtTime(mode === 'in' ? 0.25 : -0.25, audioCtxRef.current.currentTime, 0.01);
    }
  };

  const toggleSpatialTone = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlayingSpatial) {
      stopSpatialTone();
    } else {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop others
      stopBalanceTone();
      stopPhaseTone();

      const osc = ctx.createOscillator();
      const panner = ctx.createStereoPanner();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, ctx.currentTime);

      const panVal = Math.sin(spatialAngle);
      panner.pan.setValueAtTime(panVal, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);

      osc.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      spatialOscRef.current = osc;
      spatialPannerRef.current = panner;
      setIsPlayingSpatial(true);
    }
  };

  const handleMapInteract = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    let angle = Math.atan2(y, x) + Math.PI / 2; // offset so 12 o'clock is 0
    if (angle < 0) angle += 2 * Math.PI;

    setSpatialAngle(angle);
    setIsSpatialAuto(false);

    // If spatial tone is not playing yet, start it upon user manual dragging
    if (!isPlayingSpatial) {
      // Small timeout to let state stabilize
      setTimeout(() => {
        initAudio();
        const ctx = audioCtxRef.current;
        if (ctx) {
          if (ctx.state === 'suspended') ctx.resume();
          toggleSpatialTone();
        }
      }, 50);
    }
  };

  const getOrbitPosition = () => {
    const radius = 64; // orbital circle visual radius
    const x = 50 + (radius / 1.5) * Math.sin(spatialAngle);
    const y = 50 - (radius / 1.5) * Math.cos(spatialAngle);
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <div className="mb-10 text-center md:text-left">
        <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
          Diagnostic Tool
        </span>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink mb-3">
          Headphone & 3D Spatial Test
        </h1>
        <p className="font-sans text-xs sm:text-sm text-body max-w-xl">
          Test if your headphone speakers are balanced, verify if they are wired correctly, and experience immersive 3D surround sound.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. BALANCE & PHASE PANEL */}
        <div className="flex flex-col gap-6">
          {/* Slider balance test */}
          <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans font-bold text-xs text-ink">
                Left & Right Balance Slider
              </span>
            </div>

            <p className="font-sans text-xs text-body mb-5 leading-relaxed">
              Play a continuous tone and slide left or right to make sure your headphones play equally loud on both sides.
            </p>

            {/* High-visibility Action Button */}
            <button
              onClick={toggleBalanceTone}
              className={`w-full py-3 mb-5 rounded-full font-sans text-xs font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 border transition-all duration-200 hover:scale-[1.01] ${
                isPlayingBalance
                  ? 'bg-ink text-canvas border-ink hover:bg-ink/90 shadow-sm'
                  : 'bg-brand-cyan text-ink border-brand-cyan hover:bg-brand-cyan/95 shadow-md'
              }`}
            >
              {isPlayingBalance ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-brand-pink animate-ping" />
                  Mute Balance Tone
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-ink" />
                  Play Balance Tone
                </>
              )}
            </button>

            <div className="bg-canvas-soft p-4 rounded border border-hairline flex flex-col gap-3">
              <input
                disabled={!isPlayingBalance}
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full h-1 bg-canvas-soft-2 rounded-lg appearance-none cursor-pointer accent-ink disabled:opacity-40"
              />
              <div className="flex justify-between font-mono text-[9px] text-hairline-strong">
                <span className={balance < -0.1 ? 'text-ink font-semibold' : ''}>LEFT</span>
                <span className={Math.abs(balance) <= 0.1 ? 'text-ink font-semibold' : ''}>CENTER</span>
                <span className={balance > 0.1 ? 'text-ink font-semibold' : ''}>RIGHT</span>
              </div>
            </div>
          </div>

          {/* Wiring Phase check */}
          <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans font-bold text-xs text-ink">
                Headphone Wiring Test (Phase)
              </span>
            </div>

            <p className="font-sans text-xs text-body mb-5 leading-relaxed">
              Normally wired headphones sound focused and solid on <span className="font-bold text-ink">In Phase</span>. When toggled to <span className="font-bold text-ink">Out of Phase</span>, it should sound hollow and wide.
            </p>

            {/* High-visibility Action Button */}
            <button
              onClick={togglePhaseTone}
              className={`w-full py-3 mb-5 rounded-full font-sans text-xs font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 border transition-all duration-200 hover:scale-[1.01] ${
                isPlayingPhase
                  ? 'bg-ink text-canvas border-ink hover:bg-ink/90 shadow-sm'
                  : 'bg-brand-cyan text-ink border-brand-cyan hover:bg-brand-cyan/95 shadow-md'
              }`}
            >
              {isPlayingPhase ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-brand-pink animate-ping" />
                  Mute Phase Hum
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-ink" />
                  Play Phase Hum
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3 bg-canvas-soft-2 p-1.5 rounded border border-hairline">
              <button
                onClick={() => handleSetPhaseMode('in')}
                className={`py-2 px-3 rounded font-sans text-xs font-semibold cursor-pointer text-center flex flex-col gap-0.5 transition-colors ${
                  phaseMode === 'in'
                    ? 'bg-canvas text-ink shadow-sm'
                    : 'text-body hover:text-ink'
                }`}
              >
                <span>In Phase</span>
                <span className="font-mono text-[9px] text-hairline-strong font-normal">Normal Sound</span>
              </button>
              <button
                onClick={() => handleSetPhaseMode('out')}
                className={`py-2 px-3 rounded font-sans text-xs font-semibold cursor-pointer text-center flex flex-col gap-0.5 transition-colors ${
                  phaseMode === 'out'
                    ? 'bg-canvas text-ink shadow-sm'
                    : 'text-body hover:text-ink'
                }`}
              >
                <span>Out of Phase</span>
                <span className="font-mono text-[9px] text-hairline-strong font-normal">Hollow/Wide Sound</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. SPATIAL 3D COMPASS MAP */}
        <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans font-bold text-xs text-ink">
                3D Spatial Sound Radar
              </span>
            </div>

            <p className="font-sans text-xs text-body mb-6 leading-relaxed">
              Experience the sound panning fully in a 360-degree circle around your ears. You can click and drag anywhere on the radar below to manually move the sound.
            </p>

            {/* High-visibility primary action button */}
            <button
              onClick={toggleSpatialTone}
              className={`w-full py-3 mb-6 rounded-full font-sans text-xs font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 border transition-all duration-200 hover:scale-[1.01] ${
                isPlayingSpatial
                  ? 'bg-ink text-canvas border-ink hover:bg-ink/90 shadow-sm'
                  : 'bg-brand-pink text-canvas border-brand-pink hover:bg-brand-pink/95 shadow-md'
              }`}
            >
              {isPlayingSpatial ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                  Stop Spatial Orbit
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-canvas" />
                  Begin 3D Spatial Orbit
                </>
              )}
            </button>
          </div>

          {/* Interactive Map Grid Frame */}
          <div className="flex flex-col items-center justify-center my-4">
            <div 
              onMouseMove={(e) => {
                if (e.buttons === 1) handleMapInteract(e);
              }}
              onMouseDown={handleMapInteract}
              className="relative w-48 h-44 rounded-full border border-hairline bg-canvas-soft-2 flex items-center justify-center cursor-crosshair premium-shadow-sm select-none"
            >
              {/* Compass Rings */}
              <div className="absolute w-36 h-36 rounded-full border border-hairline/60 border-dashed" />
              <div className="absolute w-24 h-24 rounded-full border border-hairline/40 border-dashed" />

              {/* Head representation */}
              <div className="relative w-12 h-12 bg-ink text-canvas rounded-full flex flex-col items-center justify-center shadow-md border border-ink z-10">
                <Headphones className="w-5 h-5 text-brand-cyan" />
                <span className="font-mono text-[7px] text-hairline-strong mt-0.5">YOU</span>
              </div>

              {/* Orbital Tracking Dot */}
              <div 
                style={getOrbitPosition()}
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-brand-cyan shadow border border-canvas flex items-center justify-center pointer-events-none transition-all duration-75"
              >
                <div className="w-2.5 h-2.5 bg-ink rounded-full" />
              </div>
            </div>

            {/* Orbit automation buttons */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsSpatialAuto(!isSpatialAuto)}
                className={`px-3 py-1 rounded font-sans text-xs font-semibold cursor-pointer border ${
                  isSpatialAuto
                    ? 'bg-canvas-soft border-hairline-strong text-ink font-bold'
                    : 'bg-canvas border-hairline text-body hover:text-ink'
                }`}
              >
                {isSpatialAuto ? 'Auto Orbit' : 'Manual Move'}
              </button>
              <span className="font-mono text-[10px] text-hairline-strong uppercase">
                PAN VALUE: <span className="font-bold text-ink">{Math.sin(spatialAngle).toFixed(2)}</span>
              </span>
            </div>
          </div>

          <div className="bg-canvas-soft-2 p-3.5 border border-hairline rounded flex gap-2.5 mt-4">
            <AlertCircle className="w-4 h-4 text-brand-violet mt-0.5 flex-shrink-0" />
            <span className="font-sans text-[11px] text-body leading-tight">
              Tip: Over-ear headphones will give you the most immersive 3D surround feel!
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
