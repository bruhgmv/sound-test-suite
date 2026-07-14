import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Mic, Circle, Trash2, Download, AlertCircle } from 'lucide-react';
import type { DeviceSpec } from '../types';

export default function MicrophoneTest() {
  const [status, setStatus] = useState<'uninitiated' | 'requesting' | 'active' | 'denied'>('uninitiated');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [specs, setSpecs] = useState<DeviceSpec | null>(null);

  // Recorder State
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [recordTimer, setRecordTimer] = useState<number>(0); // tenths of seconds
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>('');
  const [isPlayingPlayback, setIsPlayingPlayback] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Web Audio Refs
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Recorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);

  // Audio Playback Element Ref
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Fetch device list on start
  const getMicrophones = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const mics = allDevices.filter((d) => d.kind === 'audioinput');
      setDevices(mics);
      if (mics.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(mics[0].deviceId);
      }
    } catch (e) {
      console.warn('Failed to enumerate devices', e);
    }
  };

  // Trigger mic connection
  const requestMicPermission = async () => {
    setStatus('requesting');
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Initialize analyzer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaStreamAudioSource(stream);
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 1024;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      sourceNodeRef.current = source;
      analyserRef.current = analyser;

      // Extract Device Specs
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();

      setSpecs({
        name: track.label || 'Default Microphone',
        sampleRate: settings.sampleRate ? `${settings.sampleRate} Hz` : 'Standard Quality',
        channels: settings.channelCount ? `${settings.channelCount}` : 'Mono (1)',
        echoCancellation: settings.echoCancellation ? 'Active' : 'Off',
        noiseSuppression: settings.noiseSuppression ? 'Active' : 'Off',
        autoGainControl: settings.autoGainControl ? 'Active' : 'Off',
      });

      setStatus('active');
      getMicrophones(); // refresh lists with label access granted
      startWaveform();
    } catch (e) {
      console.error(e);
      setStatus('denied');
    }
  };

  // Release microphone and context
  const releaseMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    setStatus('uninitiated');
    setSpecs(null);
  };

  // Re-connect mic when device changes
  useEffect(() => {
    if (status === 'active') {
      releaseMic();
      requestMicPermission();
    }
  }, [selectedDeviceId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, []);

  // Live Oscilloscope Visualizer
  const startWaveform = () => {
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

      // Dark theme background
      canvasCtx.fillStyle = '#171717';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal center line
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      canvasCtx.lineWidth = 1;
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      // Plot wavy cyan curve
      canvasCtx.strokeStyle = '#50e3c2'; // Vercel Cyan Glow
      canvasCtx.lineWidth = 2;
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
    };

    draw();
  };

  // Recording triggers
  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedBlob(null);
    setPlaybackUrl('');

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      setRecordedBlob(blob);
      setPlaybackUrl(URL.createObjectURL(blob));
      setRecordingState('recorded');
    };

    mediaRecorder.start();
    setRecordingState('recording');
    setRecordTimer(0);

    // Track elapsed time up to 10 seconds (100 ticks of 100ms)
    const interval = window.setInterval(() => {
      setRecordTimer((prev) => {
        if (prev >= 100) {
          // Auto Stop at 10.0 seconds
          stopRecording();
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    recordIntervalRef.current = interval;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  };

  // Custom playback actions
  const togglePlayback = () => {
    const audio = audioPlaybackRef.current;
    if (!audio) return;

    if (isPlayingPlayback) {
      audio.pause();
      setIsPlayingPlayback(false);
    } else {
      audio.play();
      setIsPlayingPlayback(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioPlaybackRef.current;
    if (!audio) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    setPlaybackProgress(progress);
    if (audio.currentTime >= audio.duration) {
      setIsPlayingPlayback(false);
      setPlaybackProgress(0);
    }
  };

  const resetRecording = () => {
    setRecordingState('idle');
    setRecordedBlob(null);
    setPlaybackUrl('');
    setRecordTimer(0);
    setIsPlayingPlayback(false);
    setPlaybackProgress(0);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <div className="mb-10 text-center md:text-left">
        <span className="font-mono text-[11px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2">
          Diagnostic Tool
        </span>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink mb-3">
          Microphone Test
        </h1>
        <p className="font-sans text-xs sm:text-sm text-body max-w-xl">
          Test your microphone, see a live wave graph of your voice, and record a short clip to hear how you sound.
        </p>
      </div>

      {status === 'uninitiated' && (
        <div className="bg-canvas border border-hairline p-12 text-center rounded-lg premium-shadow-md max-w-xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center text-brand-cyan mb-5">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="font-sans text-lg font-semibold tracking-tight text-ink mb-2">
            Microphone Locked
          </h3>
          <p className="font-sans text-xs text-body mb-6 leading-relaxed max-w-sm">
            To test your microphone and see your live voice waveform, please grant microphone permission when prompted by your browser.
          </p>
          <button
            onClick={requestMicPermission}
            className="px-6 py-2.5 rounded-full font-sans text-xs font-semibold bg-ink text-canvas border border-ink hover:bg-ink/90 cursor-pointer shadow-sm"
          >
            Enable Microphone
          </button>
        </div>
      )}

      {status === 'requesting' && (
        <div className="bg-canvas border border-hairline p-12 text-center rounded-lg premium-shadow-md max-w-xl mx-auto flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin mb-5" />
          <p className="font-mono text-xs text-body uppercase tracking-wider">
            Connecting to Microphone...
          </p>
        </div>
      )}

      {status === 'denied' && (
        <div className="bg-canvas border border-hairline p-12 text-center rounded-lg premium-shadow-md max-w-xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-sm bg-brand-pink/5 border border-brand-pink flex items-center justify-center text-brand-pink mb-5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-sans text-lg font-semibold tracking-tight text-ink mb-2">
            Microphone Permission Denied
          </h3>
          <p className="font-sans text-xs text-body mb-6 leading-relaxed max-w-sm">
            Your browser blocked microphone access. Click the lock icon in your browser's address bar to allow microphone access, then try again.
          </p>
          <button
            onClick={requestMicPermission}
            className="px-6 py-2.5 rounded-full font-sans text-xs font-semibold bg-ink text-canvas border border-ink hover:bg-ink/90 cursor-pointer"
          >
            Try Connecting Again
          </button>
        </div>
      )}

      {status === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left spec and dropdown column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
              <label className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider block mb-2.5">
                Select Microphone
              </label>
              
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-canvas border border-hairline text-xs rounded-sm p-2 mb-4 font-sans text-ink focus:outline-none focus:border-hairline-strong cursor-pointer"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                  </option>
                ))}
              </select>

              <button
                onClick={releaseMic}
                className="w-full py-2 bg-canvas-soft border border-hairline hover:border-hairline-strong rounded font-sans text-xs font-semibold text-body hover:text-ink cursor-pointer transition-colors"
              >
                Turn Off Microphone
              </button>
            </div>

            {/* Hardware Specifications Table */}
            {specs && (
              <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
                <span className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider block mb-4">
                  Microphone Details
                </span>
                
                <div className="divide-y divide-hairline">
                  <div className="py-2.5 flex justify-between items-center gap-4 text-xs">
                    <span className="font-sans text-body">Quality (Sample Rate)</span>
                    <span className="font-mono text-ink font-semibold">{specs.sampleRate}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center gap-4 text-xs">
                    <span className="font-sans text-body">Audio Channels</span>
                    <span className="font-mono text-ink font-semibold">{specs.channels}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center gap-4 text-xs">
                    <span className="font-sans text-body">Echo Cancellation</span>
                    <span className="font-mono text-ink font-semibold">{specs.echoCancellation}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center gap-4 text-xs">
                    <span className="font-sans text-body">Noise Suppression</span>
                    <span className="font-mono text-ink font-semibold">{specs.noiseSuppression}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center gap-4 text-xs">
                    <span className="font-sans text-body">Automatic Volume Control</span>
                    <span className="font-mono text-ink font-semibold">{specs.autoGainControl}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Oscilloscope and Recorder column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Realtime Canvas Osc */}
            <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
              <span className="font-mono text-[10px] font-semibold text-hairline-strong uppercase tracking-wider block mb-4">
                Live Voice Waveform
              </span>
              <div className="aspect-video w-full rounded overflow-hidden border border-hairline bg-[#171717] relative">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full block"
                />
              </div>
            </div>

            {/* Audio Loop Recorder Tool */}
            <div className="bg-canvas border border-hairline p-6 rounded-lg premium-shadow-md">
              <div className="flex justify-between items-center mb-4">
                <span className="font-sans font-bold text-xs text-ink">
                  Record & Listen Test
                </span>
                <span className="font-mono text-[10px] text-hairline-strong uppercase tracking-wider">
                  Up to 10 Seconds
                </span>
              </div>

              <p className="font-sans text-xs text-body mb-6 leading-relaxed">
                Record a quick 10-second clip of your voice, then play it back to hear exactly how you sound.
              </p>

              {/* Recorder UI State Machine */}
              {recordingState === 'idle' && (
                <button
                  onClick={startRecording}
                  className="w-full py-3 bg-brand-pink text-canvas border border-brand-pink hover:bg-brand-pink/90 rounded-full font-sans text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Circle className="w-4 h-4 fill-current animate-pulse text-canvas" />
                  Start Recording
                </button>
              )}

              {recordingState === 'recording' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-canvas-soft border border-hairline p-4 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-brand-pink animate-ping" />
                      <span className="font-mono text-xs font-bold text-ink">Recording Voice...</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-brand-pink">
                      {(recordTimer / 10).toFixed(1)}s / 10.0s
                    </span>
                  </div>

                  <div className="w-full h-1 bg-canvas-soft-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${recordTimer}%` }} 
                      className="h-full bg-brand-pink transition-all duration-100"
                    />
                  </div>

                  <button
                    onClick={stopRecording}
                    className="w-full py-3 bg-ink text-canvas border border-ink hover:bg-ink/90 rounded-full font-sans text-xs font-semibold cursor-pointer"
                  >
                    Stop Recording
                  </button>
                </div>
              )}

              {recordingState === 'recorded' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-canvas-soft-2 border border-hairline p-4 rounded flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlayback}
                        className="w-8 h-8 rounded-full bg-ink text-canvas flex items-center justify-center hover:bg-ink/90 cursor-pointer focus:outline-none"
                      >
                        {isPlayingPlayback ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                      <div>
                        <span className="font-sans font-semibold text-xs text-ink block">
                          Your Recorded Voice
                        </span>
                        <span className="font-sans text-[11px] text-body block">
                          Length: {(recordTimer / 10).toFixed(1)}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={playbackUrl}
                        download={`microphone_test_recording.webm`}
                        className="p-2 border border-hairline hover:border-hairline-strong rounded bg-canvas text-body hover:text-ink cursor-pointer focus:outline-none"
                        title="Download Recording file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={resetRecording}
                        className="p-2 border border-hairline hover:border-brand-pink rounded bg-canvas text-body hover:text-brand-pink cursor-pointer focus:outline-none"
                        title="Delete Capture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Playback timeline slider */}
                  <div className="w-full h-1 bg-canvas-soft-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${playbackProgress}%` }}
                      className="h-full bg-brand-cyan transition-all duration-75"
                    />
                  </div>

                  <audio
                    ref={audioPlaybackRef}
                    src={playbackUrl}
                    onTimeUpdate={handleAudioTimeUpdate}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
