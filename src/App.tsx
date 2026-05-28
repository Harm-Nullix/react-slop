import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Sun,
  Play,
  RotateCcw,
  Activity,
  Sparkles,
  Volume2,
  VolumeX,
  HelpCircle,
  Languages,
  Layers,
  Gauge,
  History
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

// Translations
const TRANSLATIONS = {
  en: {
    title: "RETINA_RESET",
    subtitle: "Photoreceptor Equilibrium Calibrator",
    desc: "Designed for micro-surgeons, watchmakers, and micro-assembly specialists experiencing localized retinal bleaching and chromatic fatigue.",
    sourceSelect: "Select Exposure Source (Bleaching Spectrum)",
    cyanLaser: "Cyan/Blue Laser Curing (450-480nm)",
    greenSolder: "Green Micro-Solder Laser (532nm)",
    halogenWarm: "Intense Microscope Halogen (3000K)",
    sodiumMonochrome: "Monochromatic Sodium Glow (589nm)",
    exposureDuration: "Exposure Duration",
    minutes: "minutes",
    fatigueRating: "Subjective Ocular Strain Index",
    initiate: "Initiate Calibration Cycle",
    calibrating: "Calibration Active... Focus on Target",
    complete: "Equilibrium Restored",
    analyticsTitle: "Chromatic Recovery Logs",
    noLogs: "No recovery runs logged yet. Calibrate to record data.",
    receptorsSaved: "Photoreceptors Balanced",
    instructionsTitle: "How it Works",
    instruction1: "Choose the light spectrum you have been staring at under the lens.",
    instruction2: "Select duration and rate your current focal eye-fatigue.",
    instruction3: "Stare directly at the moving saccadic dot. The background pulse generates exact mathematical complementary wavelengths to neutralize bleached retinal cones.",
    instruction4: "Keep blinking naturally. Audio binaural sweeps will facilitate spatial optical relaxation.",
    restorationStatus: "Foveal Adaptation Recovery Curve",
    audioToggle: "Binaural Auditory Sync",
    recoveryIndex: "Reset Index",
    averageFatigue: "Average Micro-Strain",
    language: "Taal",
    resetSession: "Clear History",
    close: "Exit",
    completedMsg: "Calibrating sequence finished. Your foveal cone receptors have been recalibrated. Stare at standard ambient light for 10 seconds."
  },
  nl: {
    title: "RETINA_RESET",
    subtitle: "Fotoreceptor Evenwicht Kalibrator",
    desc: "Ontworpen voor micro-chirurgen, horlogemakers en micro-assemblage specialisten die last hebben van lokale retinale overbelasting en chromatische vermoeidheid.",
    sourceSelect: "Selecteer Blootstellingsbron (Overbelastingsspectrum)",
    cyanLaser: "Cyaan/Blauw Laseruitharding (450-480nm)",
    greenSolder: "Groene Micro-Soldeer Laser (532nm)",
    halogenWarm: "Intense Microscoop Halogeen (3000K)",
    sodiumMonochrome: "Monochromatische Natriumgloed (589nm)",
    exposureDuration: "Blootstellingsduur",
    minutes: "minuten",
    fatigueRating: "Subjectieve Oogvermoeidheidsindex",
    initiate: "Start Kalibratie Cyclus",
    calibrating: "Kalibratie Actief... Focus op het Doel",
    complete: "Evenwicht Hersteld",
    analyticsTitle: "Chromatische Herstellogboeken",
    noLogs: "Nog geen herstelsessies opgeslagen. Kalibreer om gegevens te loggen.",
    receptorsSaved: "Fotoreceptoren Uitgebalanceerd",
    instructionsTitle: "Hoe het Werkt",
    instruction1: "Kies het lichtspectrum waarnaar u door de lens hebt zitten staren.",
    instruction2: "Selecteer de duur en beoordeel uw huidige oogvermoeidheid.",
    instruction3: "Staar rechtstreeks naar de bewegende saccadische stip. De achtergrondpuls genereert exacte complementaire golflengten om vermoeide kegeltjes te neutraliseren.",
    instruction4: "Blijf natuurlijk knipperen. Binaurale audio-sweeps ondersteunen optische ontspanning.",
    restorationStatus: "Foveale Aanpassings-Herstelcurve",
    audioToggle: "Binaurale Audio-Sync",
    recoveryIndex: "Reset Index",
    averageFatigue: "Gemiddelde Micro-Belasting",
    language: "Language",
    resetSession: "Wis Geschiedenis",
    close: "Sluit",
    completedMsg: "Kalibratiesequentie voltooid. Uw foveale kegelreceptoren zijn opnieuw gecalibreerd. Staar 10 seconden naar normaal omgevingslicht."
  }
};

interface SessionLog {
  id: string;
  timestamp: string;
  spectrum: string;
  duration: number;
  fatigueBefore: number;
  restorationScore: number;
}

export default function App() {
  // Language Handling
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  
  useEffect(() => {
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === 'nl') {
      setLang('nl');
    } else {
      setLang('en');
    }
  }, []);

  const t = TRANSLATIONS[lang];

  // Page Title Update
  useEffect(() => {
    document.title = `${t.title} // ${t.subtitle}`;
  }, [lang, t.title, t.subtitle]);

  // State variables
  const [spectrum, setSpectrum] = useState<'cyan' | 'green' | 'halogen' | 'sodium'>('cyan');
  const [duration, setDuration] = useState<number>(30);
  const [fatigue, setFatigue] = useState<number>(6);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [history, setHistory] = useState<SessionLog[]>([]);
  
  // Saccade target animation coordinates
  const [targetCoords, setTargetCoords] = useState({ x: 50, y: 50 });
  const targetIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  // Load History from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('retina_reset_logs');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Dynamic spectrum details
  const spectrums = {
    cyan: {
      name: t.cyanLaser,
      // Complementary of cyan/blue is deep Amber-Orange
      color: 'rgb(251, 146, 60)', 
      pulseGradient: 'from-orange-500 via-amber-600 to-amber-900',
      waveFreq: 280
    },
    green: {
      name: t.greenSolder,
      // Complementary of green is Magenta-Pink
      color: 'rgb(244, 63, 94)',
      pulseGradient: 'from-rose-500 via-pink-600 to-purple-900',
      waveFreq: 330
    },
    halogen: {
      name: t.halogenWarm,
      // Complementary of warm amber-white is crisp blue-cyan
      color: 'rgb(14, 165, 233)',
      pulseGradient: 'from-sky-500 via-indigo-600 to-slate-900',
      waveFreq: 190
    },
    sodium: {
      name: t.sodiumMonochrome,
      // Complementary of deep yellow is bright indigo-royal blue
      color: 'rgb(99, 102, 241)',
      pulseGradient: 'from-indigo-600 via-blue-700 to-violet-950',
      waveFreq: 220
    }
  };

  // Audio generator (Synthesized Ocular-relaxing sound matrix)
  const startAudio = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Left ear slow modulator (alpha brainwave sync for visual relaxation)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const merger = ctx.createChannelMerger(2);

      const baseFreq = spectrums[spectrum].waveFreq;

      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc2.frequency.setValueAtTime(baseFreq + 8, ctx.currentTime); // 8Hz binaural differential

      // LFO for periodic retinal pulsing sync
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.5, ctx.currentTime); 
      lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      osc1.connect(merger, 0, 0);
      osc2.connect(merger, 0, 1);
      merger.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc1.start();
      osc2.start();
      lfo.start();

      oscillatorsRef.current = [osc1, osc2, lfo];
    } catch (e) {
      console.warn("Audio synthesis blocked or unsupported.", e);
    }
  };

  const stopAudio = () => {
    if (audioContextRef.current) {
      oscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      audioContextRef.current.close();
      audioContextRef.current = null;
      oscillatorsRef.current = [];
    }
  };

  // Handle Saccadic Target Movement during calibration
  const updateSaccadeTarget = () => {
    // Micro-movements optimized for retinal recovery positioning
    const angle = Math.random() * Math.PI * 2;
    // Keep target concentrated near center but with slight offsets
    const distance = 15 + Math.random() * 25;
    const x = 50 + Math.cos(angle) * distance;
    const y = 50 + Math.sin(angle) * distance;
    setTargetCoords({ x, y });
  };

  // Begin calibration loop
  const handleStartCalibration = () => {
    setIsCalibrating(true);
    setProgress(0);
    startAudio();

    // Trigger saccadic target movements every 1.5s
    targetIntervalRef.current = setInterval(updateSaccadeTarget, 1300);
  };

  // Increment progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCalibrating && progress < 100) {
      timer = setTimeout(() => {
        setProgress(prev => prev + 1);
      }, 250); // 25 seconds total calibration sequence
    } else if (isCalibrating && progress >= 100) {
      handleCompleteCalibration();
    }
    return () => clearTimeout(timer);
  }, [isCalibrating, progress]);

  const handleCompleteCalibration = () => {
    setIsCalibrating(false);
    stopAudio();
    if (targetIntervalRef.current) {
      clearInterval(targetIntervalRef.current);
    }

    // Calculate precise mathematical Recovery Score
    const recoveryFactor = Math.min(100, Math.round(((duration * 1.5) + (fatigue * 8)) * (1.1)));
    
    // Add log to storage
    const newLog: SessionLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(lang === 'nl' ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      spectrum: spectrum,
      duration: duration,
      fatigueBefore: fatigue,
      restorationScore: recoveryFactor
    };

    const updatedLogs = [newLog, ...history].slice(0, 10);
    setHistory(updatedLogs);
    localStorage.setItem('retina_reset_logs', JSON.stringify(updatedLogs));
  };

  const handleAbort = () => {
    setIsCalibrating(false);
    stopAudio();
    if (targetIntervalRef.current) {
      clearInterval(targetIntervalRef.current);
    }
  };

  const clearLogs = () => {
    setHistory([]);
    localStorage.removeItem('retina_reset_logs');
  };

  // Chart helper
  const chartData = history.slice().reverse().map(log => ({
    time: log.timestamp,
    'Reset Index': log.restorationScore,
    'Fatigue': log.fatigueBefore * 10
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-orange-500/30 selection:text-orange-300 relative overflow-hidden">
      
      {/* Cosmic background glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Header */}
      <header className="border-b border-zinc-800/80 backdrop-blur-md bg-zinc-950/70 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-indigo-500 rounded-lg blur opacity-70 animate-pulse" />
              <div className="relative bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <Eye className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold tracking-widest text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-slate-200 to-indigo-300">
                {t.title}
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle button with absolute sound indicator */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted) {
                  stopAudio();
                }
              }}
              className={`p-2 rounded-lg border transition-all duration-300 flex items-center gap-2 text-xs font-mono ${
                !isMuted
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
              title={t.audioToggle}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
              <span className="hidden md:inline">BINAURAL</span>
            </button>

            {/* Info toggle */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2 text-xs font-mono"
            >
              <Languages className="w-4 h-4 text-indigo-400" />
              <span className="uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Configurator Card (Left column) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-full"
          >
            {/* Tech line elements */}
            <div className="absolute top-0 right-0 w-32 h-[1px] bg-gradient-to-l from-orange-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-indigo-500/50 to-transparent" />

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase mb-3 tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                <span>Parameters Matrix</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                {t.desc}
              </p>

              {/* Exposure Selector */}
              <div className="mb-6">
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2 tracking-wide">
                  {t.sourceSelect}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(spectrums) as Array<keyof typeof spectrums>).map((key) => {
                    const active = spectrum === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSpectrum(key)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                          active 
                            ? 'bg-zinc-800/90 border-orange-500/50 text-white shadow-lg shadow-orange-950/10'
                            : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                        }`}
                      >
                        {active && (
                          <motion.div 
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-indigo-500"
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ 
                              backgroundColor: spectrums[key].color,
                              boxShadow: `0 0 10px ${spectrums[key].color}` 
                            }}
                          />
                          <span className="text-xs font-medium md:text-sm">{spectrums[key].name}</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">
                          {spectrums[key].waveFreq} Hz
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exposure duration slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono uppercase text-zinc-400 tracking-wide">
                    {t.exposureDuration}
                  </label>
                  <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                    {duration} {t.minutes}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="180" 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-ew-resize bg-zinc-800 rounded-lg h-1.5"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
                  <span>5m</span>
                  <span>90m</span>
                  <span>180m</span>
                </div>
              </div>

              {/* Fatigue slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono uppercase text-zinc-400 tracking-wide">
                    {t.fatigueRating}
                  </label>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Lv. {fatigue} / 10
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={fatigue}
                  onChange={(e) => setFatigue(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-ew-resize bg-zinc-800 rounded-lg h-1.5"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>

            {/* Call to action launch buttons */}
            <div className="pt-4">
              <button
                onClick={handleStartCalibration}
                className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 hover:from-orange-400 hover:to-indigo-500 text-white transition-all duration-300 shadow-xl shadow-orange-950/20 hover:shadow-orange-500/10 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute -inset-y-0 w-12 bg-white/10 skew-x-12 translate-x-[-150%] group-hover:animate-shimmer" />
                <Play className="w-5 h-5 fill-white" />
                <span className="tracking-wide">{t.initiate}</span>
              </button>
            </div>

          </motion.div>
        </section>

        {/* Main Display Hub (Right Column) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between h-full min-h-[450px] relative"
          >
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Live Dynamic Interceptor
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                  System Ready
                </span>
              </div>
            </div>

            {/* Simulation Canvas area */}
            <div className="relative flex-grow flex items-center justify-center bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden p-8 h-80">
              
              {/* Soft background grid lines for visual scale */}
              <div className="absolute inset-0 grid grid-cols-12 gap-1 opacity-5 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="border-l border-white h-full" />
                ))}
              </div>
              
              {/* Concentric orbital rings */}
              <div className="absolute w-64 h-64 border border-zinc-900/80 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border border-zinc-900/50 rounded-full flex items-center justify-center">
                  <div className="w-28 h-28 border border-zinc-800/30 rounded-full flex items-center justify-center" />
                </div>
              </div>

              {/* Passive Glow inside canvas representing selected spectral light source complementary color */}
              <div 
                className="absolute w-44 h-44 rounded-full filter blur-[60px] opacity-10 transition-colors duration-500"
                style={{ backgroundColor: spectrums[spectrum].color }}
              />

              {/* Neutral point marker */}
              <div className="absolute w-1.5 h-1.5 bg-zinc-800 rounded-full" />

              {/* Floating micro animations showing alignment indicators */}
              <div className="absolute bottom-4 left-4 flex gap-1 items-center">
                <span className="text-[9px] font-mono text-zinc-600">FOV: ~12.5°</span>
              </div>

              <div className="text-center z-10">
                <Sun className="w-12 h-12 text-zinc-700/80 mx-auto mb-4 stroke-[1.5]" />
                <p className="text-xs font-mono text-zinc-500 max-w-xs uppercase tracking-wide leading-relaxed">
                  Calibration matrix deactivated. Feed exposure profile values & activate system loop.
                </p>
              </div>
            </div>

            {/* Bottom mini panel showing active calibration status */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Complementary Output
                </span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: spectrums[spectrum].color }} 
                  />
                  <span className="text-zinc-200 capitalize font-medium">{spectrum} spectral reset</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Eye Tracker Targeting
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Saccadic Sync Active
                </span>
              </div>
            </div>

          </motion.div>
        </section>
      </main>

      {/* Logs and Analytics section */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase mb-3 tracking-widest">
                <History className="w-3.5 h-3.5" />
                <span>{t.analyticsTitle}</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Review optical restoration history to monitor chronic retinal photostress over surgical shifts or micro-assembly sessions.
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={clearLogs}
                className="self-start text-[10px] font-mono uppercase tracking-widest text-rose-400/70 hover:text-rose-400 border border-rose-900/30 hover:border-rose-800/60 px-3 py-1.5 rounded-lg transition-all bg-rose-950/10"
              >
                {t.resetSession}
              </button>
            )}
          </div>

          <div className="md:col-span-7 min-h-[200px] flex items-center justify-center bg-zinc-950/60 rounded-xl border border-zinc-900 p-4">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <Gauge className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-500">{t.noLogs}</p>
              </div>
            ) : (
              <div className="w-full h-full">
                <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3 text-right">
                  {t.restorationStatus}
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFatigue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(244, 63, 94)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="rgb(244, 63, 94)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} 
                        labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Area type="monotone" dataKey="Reset Index" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReset)" />
                      <Area type="monotone" dataKey="Fatigue" stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorFatigue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-600">
          <p className="text-center md:text-left">
            RETINA_RESET © {new Date().getFullYear()} — Calibration specifications aligned for precision fovea adaptation.
          </p>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 border border-zinc-800 rounded bg-zinc-900 text-zinc-500">
              COGNITIVE LEVEL 1
            </span>
            <span className="text-indigo-500/80">ISO-8980 CALIBRATION</span>
          </div>
        </div>
      </footer>

      {/* FULLSCREEN CALIBRATION SEQUENCE MODAL */}
      <AnimatePresence>
        {isCalibrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between p-6 bg-gradient-to-b ${spectrums[spectrum].pulseGradient} transition-all duration-700`}
          >
            {/* Floating geometric guidelines to assist focus */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-[70vw] h-[70vw] border-[4px] border-white rounded-full animate-ping duration-1000" />
              <div className="w-[50vw] h-[50vw] border-[2px] border-white rounded-full animate-pulse" />
              <div className="absolute w-[1px] h-full bg-white" />
              <div className="absolute h-[1px] w-full bg-white" />
            </div>

            {/* Top Stats HUD */}
            <div className="flex justify-between items-center z-10">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-white/50 block uppercase">
                  Retinal Equilibrium Alignment
                </span>
                <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  {spectrums[spectrum].name}
                </h3>
              </div>
              <button
                onClick={handleAbort}
                className="bg-black/30 backdrop-blur-md hover:bg-black/60 text-white/90 border border-white/20 text-xs font-mono uppercase px-4 py-2 rounded-xl transition-all"
              >
                {t.close}
              </button>
            </div>

            {/* Active Saccadic Tracking Target (Central area) */}
            <div className="relative flex-grow flex items-center justify-center z-10">
              
              {/* Outer visual guidance ring */}
              <div 
                className="absolute w-96 h-96 border border-white/15 rounded-full flex items-center justify-center pointer-events-none"
                style={{ transform: `scale(${1 + Math.sin(progress / 2) * 0.15})` }}
              >
                <div className="absolute w-72 h-72 border border-white/20 rounded-full animate-spin duration-1000" style={{ borderStyle: 'dashed' }} />
                <div className="absolute w-48 h-48 border border-white/10 rounded-full" />
              </div>

              {/* Floating Dynamic Target - Users must follow this dot with their eyes */}
              <motion.div
                animate={{
                  left: `${targetCoords.x}%`,
                  top: `${targetCoords.y}%`,
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              >
                {/* Glowing target halo */}
                <span className="absolute w-12 h-12 bg-white rounded-full filter blur-md animate-ping opacity-30" />
                <span className="absolute w-8 h-8 border border-white rounded-full animate-pulse opacity-60" />
                {/* Solid high-contrast point */}
                <div className="w-4 h-4 bg-white rounded-full shadow-2xl relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
              </motion.div>

              <div className="absolute bottom-8 text-center">
                <p className="text-white/80 font-mono text-sm uppercase tracking-widest mb-2 animate-pulse">
                  {t.calibrating}
                </p>
                <span className="text-xs text-white/50 font-mono">
                  Blink naturally. Let your central vision follow the moving point.
                </span>
              </div>
            </div>

            {/* Progress indicator bottom bar */}
            <div className="z-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-xs font-mono text-white/70 mb-2">
                <span>EQUILIBRIUM COGNITION PROGRESS</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <motion.div 
                  className="bg-white h-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP / INSTRUCTIONS DRAWER MODAL */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-lg w-full relative"
            >
              <div className="flex items-center gap-2 text-orange-400 uppercase font-mono tracking-widest text-sm mb-4">
                <HelpCircle className="w-5 h-5" />
                <span>{t.instructionsTitle}</span>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-zinc-300 leading-relaxed font-sans mb-8">
                <p className="border-l-2 border-indigo-500 pl-3 py-1 bg-indigo-950/20 rounded-r">
                  <strong>Photoreceptor adaptation</strong> is the rapid fatigue of human fovea cones when exposed to micro-beams of intense singular wavelengths.
                </p>
                <ol className="list-decimal pl-5 space-y-3 font-medium">
                  <li>{t.instruction1}</li>
                  <li>{t.instruction2}</li>
                  <li>{t.instruction3}</li>
                  <li>{t.instruction4}</li>
                </ol>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-mono uppercase text-xs rounded-xl tracking-widest transition-colors"
              >
                {t.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}