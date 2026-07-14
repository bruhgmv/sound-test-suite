import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RefreshCw, VolumeX, Volume2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function SpeakerTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceType, setSourceType] = useState<'sweep' | 'noise'>('sweep');
  const [frequency, setFrequency] = useState<number>(440);
  const [noiseType, setNoiseType] = useState<'white' | 'pink' | 'brown'>('white');
  const [volume, setVolume] = useState<number>(0.3);
  const [sweepSpeed, setSweepSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [isSweeping, setIsSweeping] = useState(false);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sweepIntervalRef = useRef<number | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize Audio Context on demand
  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const gainNode = ctx.createGain();
    const analyser = ctx.createAnalyser();

    analyser.fftSize = 2048;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    // Chain: Source -> Analyser -> Gain -> Destination
    analyser.connect(gainNode);
    gainNode.connect(ctx.destination);

    audioCtxRef.current = ctx;
    gainNodeRef.current = gainNode;
    analyserRef.current = analyser;
  };

  // Adjust volume smoothly
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.01);
    }
  }, [volume]);

  // Handle source changes or toggle play/pause
  useEffect(() => {
    if (isPlaying) {
      startSource(sourceType, noiseType);
    } else {
      stopSource();
    }
    return () => {
      stopSource();
    };
  }, [isPlaying, sourceType, noiseType]);

  // Adjust oscillator frequency
  useEffect(() => {
    if (oscillatorRef.current && sourceType === 'sweep' && audioCtxRef.current) {
      oscillatorRef.current.frequency.setTargetAtTime(frequency, audioCtxRef.current.currentTime, 0.01);
    }
  }, [frequency, sourceType]);

  // Handle sweep animation
  useEffect(() => {
    if (isSweeping && isPlaying && sourceType === 'sweep') {
      const stepDuration = sweepSpeed === 'slow' ? 40 : sweepSpeed === 'medium' ? 20 : 10;
      let startFreq = frequency;
      if (startFreq >= 20000) {
        startFreq = 20;
      }

      let current = startFreq;
      const interval = setInterval(() => {
        current = Math.min(20000, current * 1.02 + 1); // logarithmic-like feel
        setFrequency(Math.round(current));

        if (current >= 20000) {
          setIsSweeping(false);
          clearInterval(interval);
        }
      }, stepDuration);

      sweepIntervalRef.current = window.setInterval(() => {}, 1000); // dummy for type safeties
      return () => {
        clearInterval(interval);
      };
    } else {
      setIsSweeping(false);
    }
  }, [isSweeping, isPlaying, sourceType, sweepSpeed]);

  const togglePlay = () => {
    initAudio();
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (nextPlaying) {
      startSource(sourceType, noiseType);
    } else {
      stopSource();
    }
  };

  const startSource = (type = sourceType, noise = noiseType) => {
    initAudio();
    const ctx = audioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Stop current nodes first
    cleanupNodes();

    if (type === 'sweep') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.connect(analyser);
      osc.start();
      oscillatorRef.current = osc;
    } else {
      // Create noise buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of buffer
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (noise === 'white') {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      } else if (noise === 'pink') {
        // Paul Kellet's refined pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          output[i] = pink * 0.11; // Gain compensation
        }
      } else if (noise === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSource.connect(analyser);
      noiseSource.start();
      noiseSourceRef.current = noiseSource;
    }

    // Start drawing oscilloscope
    startOscilloscope();
  };

  const stopSource = () => {
    cleanupNodes();
    setIsSweeping(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
  };

  const cleanupNodes = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch (e) {}
      noiseSourceRef.current = null;
    }
  };

  // Oscilloscope drawing logic
  const startOscilloscope = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Dark canvas theme matching Vercel's slate background
      canvasCtx.fillStyle = '#171717';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw faint grid markings
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      canvasCtx.lineWidth = 1;
      
      // Vertical grid lines
      const gridSpacing = 40;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, 0);
        canvasCtx.lineTo(x, canvas.height);
        canvasCtx.stroke();
      }
      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, y);
        canvasCtx.lineTo(canvas.width, y);
        canvasCtx.stroke();
      }

      // Draw horizontal center reference line in bright cyan
      canvasCtx.strokeStyle = 'rgba(80, 227, 194, 0.15)';
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      // Draw glow waveform curve
      canvasCtx.lineWidth = 2.5;
      canvasCtx.strokeStyle = '#50e3c2'; // Vercel Cyan Glow
      canvasCtx.shadowBlur = 8;
      canvasCtx.shadowColor = '#50e3c2';

      canvasCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
      canvasCtx.shadowBlur = 0; // Reset glow
    };

    draw();
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <div className="mb-10 text-center md:text-left">
        <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
          Diagnostic Tool
        </span>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink mb-3">
          Speaker Pitch & Noise Test
        </h1>
        <p className="font-sans text-xs sm:text-sm text-body max-w-xl">
          Test your speakers with continuous pitch tones (bass to treble) and relaxing background noise options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Controls column */}
        <div className="lg:col-span-1 bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md flex flex-col gap-6">
          {/* Signal Source Selector */}
          <div>
            <label className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2.5">
              Sound Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-canvas-soft-2 p-1 rounded">
              <button
                onClick={() => {
                  setSourceType('sweep');
                  setIsSweeping(false);
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                  sourceType === 'sweep'
                    ? 'bg-canvas text-ink shadow-sm'
                    : 'text-body hover:text-ink'
                }`}
              >
                Pitch Sweep
              </button>
              <button
                onClick={() => {
                  setSourceType('noise');
                  setIsSweeping(false);
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                  sourceType === 'noise'
                    ? 'bg-canvas text-ink shadow-sm'
                    : 'text-body hover:text-ink'
                }`}
              >
                Noise Color
              </button>
            </div>
          </div>

          {sourceType === 'sweep' ? (
            /* Sweep Controls */
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider">
                    Pitch Frequency
                  </label>
                  <span className="font-mono text-xs font-bold text-ink">
                    {frequency} <span className="text-[10px] text-hairline-strong">Hz</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="1"
                  value={frequency}
                  onChange={(e) => {
                    setFrequency(Number(e.target.value));
                    setIsSweeping(false);
                  }}
                  className="w-full h-1 bg-canvas-soft-2 rounded-lg appearance-none cursor-pointer accent-ink"
                />
                <div className="flex justify-between text-[9px] font-mono text-hairline-strong mt-1">
                  <span>20 Hz (Low Bass)</span>
                  <span>1 kHz</span>
                  <span>10 kHz</span>
                  <span>20 kHz (High Treble)</span>
                </div>
              </div>

              {/* Automation Speed */}
              <div>
                <label className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2.5">
                  Auto Sweep Speed
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-canvas-soft-2 p-1 rounded">
                  {(['slow', 'medium', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSweepSpeed(speed)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                        sweepSpeed === speed
                          ? 'bg-canvas text-ink shadow-sm'
                          : 'text-body hover:text-ink'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweep Automation Toggle */}
              <button
                disabled={!isPlaying}
                onClick={() => setIsSweeping(!isSweeping)}
                className={`w-full py-2 border rounded font-sans text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                  !isPlaying
                    ? 'opacity-40 cursor-not-allowed border-hairline text-hairline-strong bg-canvas-soft-2'
                    : isSweeping
                    ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan hover:bg-brand-cyan/20'
                    : 'bg-canvas border-hairline hover:border-hairline-strong text-ink'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
                {isSweeping ? 'Pause Auto Sweep' : 'Start Auto Sweep'}
              </button>
            </div>
          ) : (
            /* Noise Controls */
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2.5">
                  Noise Option
                </label>
                <div className="flex flex-col gap-2">
                  {(['white', 'pink', 'brown'] as const).map((noise) => (
                    <button
                      key={noise}
                      onClick={() => setNoiseType(noise)}
                      className={`w-full py-2 px-3 border rounded text-left font-sans text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                        noiseType === noise
                          ? 'border-brand-violet/50 bg-brand-violet/5 text-ink'
                          : 'border-hairline hover:border-hairline-strong text-body hover:text-ink'
                      }`}
                    >
                      <span className="capitalize">{noise} Noise</span>
                      <span className="font-mono text-[9px] text-hairline-strong">
                        {noise === 'white' ? 'Flat TV Static' : noise === 'pink' ? 'Soft Rainfall' : 'Deep Waterfall'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Volume Control */}
          <div className="border-t border-hairline pt-5">
            <div className="flex justify-between items-center mb-2">
              <label className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider flex items-center gap-1.5">
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-body" /> : <Volume2 className="w-3.5 h-3.5 text-body" />}
                Volume
              </label>
              <span className="font-mono text-xs font-semibold text-ink">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-canvas-soft-2 rounded-lg appearance-none cursor-pointer accent-ink"
            />
          </div>

          {/* Primary Play Button */}
          <button
            onClick={togglePlay}
            className={`w-full py-3 rounded-full font-sans text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isPlaying
                ? 'bg-ink text-canvas border border-ink hover:bg-ink/90'
                : 'bg-brand-cyan text-ink border border-brand-cyan hover:bg-brand-cyan/90 font-semibold'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                Stop Sound
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Play Sound
              </>
            )}
          </button>
        </div>

        {/* Oscilloscope column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider">
                Live Soundwave Graph
              </span>
              <span className="font-mono text-[9px] bg-canvas-soft-2 px-1.5 py-0.5 border border-hairline rounded text-body flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-brand-cyan animate-pulse' : 'bg-hairline-strong'}`} />
                {isPlaying ? 'SOUND ON' : 'STANDBY'}
              </span>
            </div>

            <div className="relative aspect-video w-full rounded overflow-hidden border border-hairline bg-[#171717] premium-shadow-sm">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-full block"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/95 text-center p-6 backdrop-blur-[1px]">
                  <Volume2 className="w-10 h-10 text-hairline-strong/60 mb-3 animate-pulse" />
                  <p className="font-sans text-xs text-hairline-strong max-w-xs leading-relaxed">
                    Click "Play Sound" to hear audio and see your live soundwave graph.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-canvas-soft border border-hairline p-5 rounded-lg flex gap-3.5 items-start">
            <ShieldAlert className="w-5 h-5 text-brand-violet mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-sans font-semibold text-xs text-ink block mb-0.5">
                Safe Listening Tip
              </span>
              <p className="font-sans text-[11px] text-body leading-relaxed">
                Please turn down your volume before playing extremely high pitches. Avoid listening at maximum volume for too long to protect your hearing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
