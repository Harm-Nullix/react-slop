import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Wind,
  Grid,
  Cpu,
  History,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Info,
  Trash2,
  Award,
  CheckCircle
} from 'lucide-react';

// --- TRANSLATION DICTIONARY ---
const TRANSLATIONS = {
  en: {
    title: "MyoSync // Micro-Tremor Calibrator",
    subtitle: "Neurological calibration for microsurgeons, watchmakers & precision specialists.",
    intro: "Calibrate your autonomic nervous system before high-precision tasks. Utilize visual-motor alignment loops to achieve optimal fine-motor control.",
    startBtn: "Initialize Matrix",
    secBreath: "1. Respiratory Alignment (HRV)",
    breathDesc: "Synchronize your breath with the expanding cosmic torus to down-regulate your sympathetic nervous system.",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    secTrace: "2. Neuro-Motor Target Tracking",
    traceDesc: "Trace the dynamic orbital node with your cursor. Keep it centered as closely as possible to analyze micro-deviations.",
    score: "Tremor Coefficient",
    steadyScore: "Steady Score",
    calibrating: "Measuring micro-deflection...",
    secGrid: "3. Tactile Decelerator Grid",
    gridDesc: "Gently glide across the kinetic cells. Vector variance and speed translate into calming, microtonal feedback chimes.",
    history: "Calibration Logs",
    noLogs: "No calibration metrics recorded yet today.",
    clear: "Wipe Memory",
    tips: "Neurological Stability Protocol",
    tip1: "Avoid exogenous stimulants (such as caffeine or nicotine) 180 minutes prior to micro-assembly.",
    tip2: "Exhale smoothly; release the final 20% of breath and pause motor input during actual execution.",
    audioToggle: "Synth Audio",
    statusSteady: "Surgical Quality",
    statusModerate: "Nominal Variance",
    statusHigh: "High Deviation / Rest Required",
    saved: "Calibration saved successfully!"
  },
  nl: {
    title: "MyoSync // Micro-Tremor Kalibrator",
    subtitle: "Neurologische kalibratie voor microchirurgen, horlogemakers & precisiespecialisten.",
    intro: "Kalibreer je autonome zenuwstelsel voorafgaand aan micro-precisietaken. Gebruik visueel-motorische lussen om optimale fijne motoriek te bereiken.",
    startBtn: "Matrix Initialiseren",
    secBreath: "1. Ademhalingssynchronisatie (HRV)",
    breathDesc: "Synchroniseer je ademhaling met de uitdijende kosmische torus om je sympathische zenuwstelsel te kalmeren.",
    inhale: "Inademen",
    hold: "Vasthouden",
    exhale: "Uitademen",
    secTrace: "2. Neuro-Motorische Doelvolging",
    traceDesc: "Volg de bewegende orbitale node met je cursor. Houd deze zo perfect mogelijk gecentreerd om micro-afwijkingen te meten.",
    score: "Trillingscoëfficiënt",
    steadyScore: "Stabiliteitsscore",
    calibrating: "Micro-afwijking meten...",
    secGrid: "3. Tactiele Vertragingsmatrix",
    gridDesc: "Beweeg soepel over de kinetische cellen. Snelheidsverschillen en vectoren worden omgezet in rustgevende microtonale klanken.",
    history: "Kalibratielogboeken",
    noLogs: "Nog geen kalibratiemetringen geregistreerd vandaag.",
    clear: "Wipe Geheugen",
    tips: "Neurologisch Stabiliteitsprotocol",
    tip1: "Vermijd exogene stimulerende middelen (zoals cafeïne) 180 minuten voor micro-assemblage.",
    tip2: "Adem rustig uit; laat de laatste 20% lucht ontsnappen en pauzeer motorische invoer tijdens de actie.",
    audioToggle: "Synth Audio",
    statusSteady: "Chirurgische Kwaliteit",
    statusModerate: "Nominale Variantie",
    statusHigh: "Hoge Afwijking / Rust Vereist",
    saved: "Kalibratie succesvol opgeslagen!"
  }
};

export default function App() {
  // Language setup
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  useEffect(() => {
    const userLang = navigator.language || '';
    if (userLang.startsWith('nl')) {
      setLang('nl');
    } else {
      setLang('en');
    }
  }, []);

  const t = TRANSLATIONS[lang];

  // Dynamically set Document Title
  useEffect(() => {
    document.title = t.title;
  }, [lang, t.title]);

  // Audio Synthesis Setup (Web Audio API)
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playMicrotone = (frequency: number, type: 'sine' | 'triangle' = 'sine', duration: number = 0.5, volume: number = 0.08) => {
    if (!audioEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Smooth exponential envelope to avoid clicks and offer visual-sensory pleasure
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio Synthesis Error:", e);
    }
  };

  // State Management
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCounter, setBreathCounter] = useState(0);
  const [calibrationHistory, setCalibrationHistory] = useState<Array<{ id: string; score: number; status: string; date: string }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myosync_logs');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Trace State
  const [isTracing, setIsTracing] = useState(false);
  const [tremorScore, setTremorScore] = useState<number | null>(null);
  const [liveDeviation, setLiveDeviation] = useState<number>(0);
  const [saveToast, setSaveToast] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackingPos = useRef({ x: 150, y: 150 });
  const mousePos = useRef({ x: 150, y: 150 });
  const traceHistory = useRef<number[]>([]);
  const animationRef = useRef<number | null>(null);

  // Breathing Cycle loop
  useEffect(() => {
    const intervals = {
      inhale: 4000,
      hold: 4000,
      exhale: 4000
    };

    const runBreathCycle = () => {
      setBreathPhase(prev => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    };

    const currentDuration = intervals[breathPhase];
    const timer = setTimeout(() => {
      runBreathCycle();
      setBreathCounter(c => c + 1);
      // Sound sync with breathing intervals
      if (breathPhase === 'inhale') playMicrotone(220, 'sine', 1.5, 0.04);
      if (breathPhase === 'hold') playMicrotone(330, 'sine', 0.8, 0.03);
      if (breathPhase === 'exhale') playMicrotone(165, 'sine', 2.0, 0.05);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [breathPhase, breathCounter]);

  // Lissajous curve movement for visual tracing target
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.015;
      const width = canvas.width;
      const height = canvas.height;
      
      // Lissajous knot parameters for highly unpredictable, complex micro-paths
      const A = width * 0.35;
      const B = height * 0.35;
      const a = 3;
      const b = 4;
      const delta = Math.PI / 2;

      const targetX = width / 2 + A * Math.sin(a * time + delta);
      const targetY = height / 2 + B * Math.sin(b * time);

      trackingPos.current = { x: targetX, y: targetY };

      // Clear canvas with subtle transparency for high-end organic trails
      ctx.fillStyle = 'rgba(9, 9, 11, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Render fine background alignment target grids
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Calculate exact distance/deviation between cursor & target
      const dx = mousePos.current.x - targetX;
      const dy = mousePos.current.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (isTracing) {
        setLiveDeviation(dist);
        traceHistory.current.push(dist);
        // Synthesize dynamic microtonal oscillation depending on current tracking deviation
        if (Math.random() < 0.1) {
          const fq = Math.max(100, Math.min(1200, 440 - dist * 2));
          playMicrotone(fq, 'triangle', 0.25, 0.02);
        }
      }

      // Draw user cursor path traces (smooth neon cybernetic aura)
      ctx.beginPath();
      ctx.arc(mousePos.current.x, mousePos.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isTracing ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)';
      ctx.shadowBlur = isTracing ? 15 : 0;
      ctx.shadowColor = '#38bdf8';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw target orbital node (expanding and contracting visually)
      ctx.beginPath();
      const pulseRadius = 14 + Math.sin(time * 5) * 4;
      ctx.arc(targetX, targetY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isTracing ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw inner target pinhead
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isTracing ? '#10b981' : '#f59e0b';
      ctx.fill();

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isTracing]);

  // Handle Canvas Tracing Events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Account for high-density displays if needed, simple mapping here
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    mousePos.current = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const startTracing = () => {
    initAudio();
    setIsTracing(true);
    setTremorScore(null);
    traceHistory.current = [];
    playMicrotone(523.25, 'sine', 0.4, 0.08); // high C
  };

  const stopTracing = () => {
    setIsTracing(false);
    if (traceHistory.current.length > 0) {
      // Calculate standard deviation formula for micro-precision evaluation
      const sum = traceHistory.current.reduce((a, b) => a + b, 0);
      const avg = sum / traceHistory.current.length;
      // Score is mapped so that lower deviation equals higher score (max 100)
      const rawScore = Math.max(0, Math.min(100, Math.round(100 - avg * 1.5)));
      
      let status = t.statusSteady;
      if (rawScore < 85) status = t.statusModerate;
      if (rawScore < 65) status = t.statusHigh;

      setTremorScore(rawScore);

      // Persist results automatically into elegant localStorage
      const newLog = {
        id: Math.random().toString(36).substring(2, 9),
        score: rawScore,
        status,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      const updatedLogs = [newLog, ...calibrationHistory].slice(0, 5);
      setCalibrationHistory(updatedLogs);
      localStorage.setItem('myosync_logs', JSON.stringify(updatedLogs));
      
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);

      // Play success audio sequences based on accuracy achieved
      if (rawScore >= 85) {
        playMicrotone(523.25, 'sine', 0.3, 0.05);
        setTimeout(() => playMicrotone(659.25, 'sine', 0.3, 0.05), 150);
        setTimeout(() => playMicrotone(783.99, 'sine', 0.5, 0.05), 300);
      } else {
        playMicrotone(440, 'triangle', 0.5, 0.06);
      }
    }
  };

  const clearLogs = () => {
    setCalibrationHistory([]);
    localStorage.removeItem('myosync_logs');
    playMicrotone(150, 'triangle', 0.6, 0.08);
  };

  // Decelerator Tactile Cells
  const tactileCells = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => {
      const note = 200 + (i * 24); // Sweet microtonal dynamic frequencies
      return { id: i, freq: note };
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* TOP HEADER STATUS PANEL */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Glowing Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg blur opacity-40 animate-pulse" />
              <div className="relative bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">{t.subtitle}</p>
            </div>
          </div>

          {/* Control Cluster */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle button */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                playMicrotone(440, 'sine', 0.1);
              }}
              className={`p-2 rounded-lg border flex items-center gap-2 text-xs transition-all duration-300 ${
                audioEnabled
                  ? 'bg-slate-900 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline font-mono uppercase">{t.audioToggle}</span>
            </button>

            {/* Language Switcher Button */}
            <div className="bg-slate-900/50 p-0.5 rounded-lg border border-slate-800 flex">
              <button
                onClick={() => { setLang('en'); playMicrotone(600, 'sine', 0.05); }}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  lang === 'en' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => { setLang('nl'); playMicrotone(600, 'sine', 0.05); }}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  lang === 'nl' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                NL
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN SYSTEM CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-grow">
        
        {/* INTRO SPECS (Full Span on small screens) */}
        <div className="lg:col-span-12 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5 justify-between shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-950/50 rounded-xl border border-cyan-900/40 text-cyan-400 mt-1">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">SYSTEM CORE v2.8</span>
              <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                {t.intro}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950 text-slate-400 text-xs font-mono">
              Hz-Resolution: 60fps
            </div>
            <div className="px-3 py-1.5 rounded-full border border-emerald-900/30 bg-emerald-950/20 text-emerald-400 text-xs font-mono">
              Active Feedback: Multi-Sensory
            </div>
          </div>
        </div>

        {/* COLUMN LEFT: INTERACTIVE RESPIRATORY PACING (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between h-full min-h-[400px]">
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wind className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h2 className="font-bold tracking-tight text-slate-100">{t.secBreath}</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.breathDesc}</p>
            </div>

            {/* Gorgeous Interactive Breathing Torus Circle */}
            <div className="flex flex-col items-center justify-center my-8 relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
              
              {/* Outer boundary indicator */}
              <div className="w-48 h-48 rounded-full border border-slate-800 flex items-center justify-center relative">
                
                {/* Pacer Ring utilizing smooth scale interpolation */}
                <motion.div
                  animate={{
                    scale: breathPhase === 'inhale' ? [1, 1.35] : breathPhase === 'hold' ? 1.35 : [1.35, 1]
                  }}
                  transition={{
                    duration: 4,
                    ease: "easeInOut"
                  }}
                  className="absolute w-32 h-32 rounded-full border-2 border-emerald-400 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                />

                {/* Steady inner core */}
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center z-10">
                  <Activity className="w-5 h-5 text-emerald-400/80" />
                </div>
              </div>

              {/* Breath Status Indicators */}
              <div className="mt-8 text-center min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={breathPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-xl font-bold tracking-wide font-mono text-emerald-400 uppercase">
                      {t[breathPhase]}
                    </span>
                    <span className="text-[10px] text-slate-500 tracking-wider font-mono">
                      4.0s Interval Protocol
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Interactive instructions card */}
            <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl">
              <p className="text-[11px] text-slate-400 leading-relaxed text-center font-mono">
                Optimal HRV alignment reached when respiration matches target pulse cycle.
              </p>
            </div>

          </div>
        </section>

        {/* COLUMN MIDDLE: HIGH-PRECISION TRACING INTERFACE (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between h-full">
            
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-bold tracking-tight text-slate-100">{t.secTrace}</h2>
                </div>
                
                {/* Quick Instruction indicator badge */}
                <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isTracing ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  {isTracing ? 'ACTIVE' : 'READY'}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.traceDesc}</p>
            </div>

            {/* Active Tracing Canvas Container with customized cursor lock */}
            <div className="my-6 flex justify-center relative">
              <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/10 to-transparent rounded-2xl blur-lg opacity-30" />
              
              <canvas
                ref={canvasRef}
                width={380}
                height={280}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative bg-slate-950 border border-slate-800/80 rounded-2xl cursor-none shadow-2xl touch-none w-full max-w-[380px]"
              />

              {/* Tracking Guide Overlays */}
              {!isTracing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-4 text-center border border-slate-800 m-[1px]">
                  <Sparkles className="w-10 h-10 text-cyan-400 mb-3 animate-pulse" />
                  <p className="text-xs text-slate-300 max-w-xs mb-4 font-mono leading-relaxed">
                    Steady your arm. Place pointer inside tracking canvas and trigger alignment analysis matrix.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(6,182,212,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startTracing}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg transition-all"
                  >
                    {t.startBtn}
                  </motion.button>
                </div>
              )}

              {isTracing && (
                <button
                  onClick={stopTracing}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-xl border border-emerald-400/20 z-10 transition-colors"
                >
                  Analyze Calibration
                </button>
              )}
            </div>

            {/* Real-time Bio-Metrics Readout board */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">{t.score}</span>
                <span className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {isTracing ? `${Math.round(liveDeviation)}px` : tremorScore !== null ? `${tremorScore}/100` : '--'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Status</span>
                <span className="text-xs font-bold font-mono text-slate-300 mt-1.5 truncate">
                  {isTracing ? t.calibrating : tremorScore !== null ? (tremorScore >= 85 ? t.statusSteady : tremorScore >= 65 ? t.statusModerate : t.statusHigh) : '--'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* COLUMN RIGHT: SENSORY DECELERATOR & LOGS (3 Cols) */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Kinetic Decelerator Grid */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Grid className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold tracking-tight text-slate-100">{t.secGrid}</h2>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{t.gridDesc}</p>
            </div>

            {/* Grid of Micro-Tactile Interactive Nodes */}
            <div className="grid grid-cols-8 gap-1.5 my-2">
              {tactileCells.map((cell) => (
                <motion.div
                  key={cell.id}
                  whileHover={{
                    scale: 1.15,
                    backgroundColor: '#a855f7',
                    boxShadow: '0 0 10px rgba(168,85,247,0.8)'
                  }}
                  onMouseEnter={() => playMicrotone(cell.freq, 'sine', 0.4, 0.05)}
                  onTouchStart={() => playMicrotone(cell.freq, 'sine', 0.4, 0.05)}
                  className="aspect-square rounded-[4px] bg-slate-950 border border-slate-800/80 cursor-crosshair transition-colors duration-300 flex items-center justify-center"
                />
              ))} 
            </div>
          </div>

          {/* Calibration Log Register */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 backdrop-blur-md flex-grow flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">{t.history}</h2>
                </div>
                {calibrationHistory.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="text-[10px] text-rose-400/80 hover:text-rose-400 font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t.clear}
                  </button>
                )}
              </div>

              {/* List of Previous Sessions */}
              <div className="space-y-2 mt-2 max-h-[160px] overflow-y-auto pr-1">
                {calibrationHistory.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-850 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-mono">{t.noLogs}</p>
                  </div>
                ) : (
                  calibrationHistory.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-850/50 text-[11px] font-mono hover:border-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.score >= 85 ? 'bg-emerald-500' : log.score >= 65 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        <span className="text-slate-400">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">{log.status}</span>
                        <span className="font-bold text-cyan-400">{log.score}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tiny Neurological Alignment Tips Card */}
            <div className="mt-4 pt-4 border-t border-slate-900">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-cyan-400/80" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.tips}</span>
              </div>
              <ul className="space-y-1.5 text-[10px] text-slate-500 list-disc list-inside leading-relaxed">
                <li>{t.tip1}</li>
                <li>{t.tip2}</li>
              </ul>
            </div>

          </div>

        </section>

      </main>

      {/* TOAST SYSTEM SAVED FEEDBACK */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-mono text-xs font-bold shadow-2xl"
          >
            <CheckCircle className="w-4 h-4" />
            {t.saved}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER METRICS SYSTEM BRAND */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <span>MyoSync Fine Motorics Laboratory Inc. © 2026</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Telemetry Shield: Active</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Nerve Node calibration v2</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
