import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Moon,
  Volume2,
  Activity,
  ShieldAlert,
  Sparkles,
  Sliders,
  Trash2,
  Languages,
  Play,
  Square,
  HelpCircle,
  CheckCircle2,
  Eye,
  RotateCcw,
  Clock
} from 'lucide-react';

// Typings & Interfaces
interface LogEntry {
  id: string;
  timestamp: string;
  duration: number;
  maxFocusScore: number;
  successRate: number;
  anchorFreq: number;
}

// Translations Dictionary
const t = {
  en: {
    title: 'SoporAnchor',
    subtitle: 'Hypnagogic Transition Safeguard',
    tagline: 'A cognitive & acoustic tether to navigate the fine line between wakefulness and hypnagogic hallucination.',
    disclaimer: 'Warning: This tool generates deep neuro-entrainment frequencies and cognitive feedback visual patterns. Designed for chronic sleep-onset transition sensitivity (~1% of population).',
    startAnchor: 'Engage Sensory Anchor',
    stopAnchor: 'Disengage Anchor',
    settings: 'Sensory Calibration',
    volume: 'Tether Volume',
    carrierFreq: 'Base Acoustic Pitch',
    binauralBeat: 'Binaural Delta Offset',
    pulseInterval: 'Acoustic Pulse Rhythm',
    driftCalibrator: 'Lucidity Drift Alignment',
    driftDesc: 'Place your cursor or finger directly over the drifting nexus. Restricting its freedom of movement keeps your sensory cortex tethered to physical reality.',
    currentFocus: 'Neuro-Lucidity Index',
    sessionHistory: 'Calibration Logs',
    noHistory: 'No anchor sessions logged yet.',
    saveLog: 'Log Dynamic Session',
    clearLog: 'Clear Logs',
    langToggle: 'Switch to NL',
    activeSession: 'Reality Anchor Active',
    durationSec: 'Duration',
    focusAchieved: 'Alignment Rate',
    freqLabel: 'Freq',
    helpText: 'How it works: SoporAnchor provides two essential reality metrics. First, a real-time synthesized binaural base frequency to calm the vestibular system. Second, a dynamic visual calibration target. By tracking the visual target, you maintain active task-oriented cortical firing, preventing rapid onset sleep-paralysis.'
  },
  nl: {
    title: 'SoporAnchor',
    subtitle: 'Hypnagogische Overgangsbeveiliging',
    tagline: 'Een cognitief & akoestisch anker om de dunne grens tussen waakstand en hypnagogische hallucinaties te navigeren.',
    disclaimer: 'Waarschuwing: Dit hulpmiddel genereert neuro-entrainment frequenties en cognitieve feedback-patronen. Ontworpen voor chronische gevoeligheid bij inslaap-overgang (~1% van de bevolking).',
    startAnchor: 'Activeer Zintuiglijk Anker',
    stopAnchor: 'Deactiveer Anker',
    settings: 'Zintuiglijke Kalibratie',
    volume: 'Anker Volume',
    carrierFreq: 'Akoestische Basisfrequentie',
    binauralBeat: 'Binaural Delta Verschil',
    pulseInterval: 'Akoestisch Pulsritme',
    driftCalibrator: 'Luciditeits-Afwijking',
    driftDesc: 'Plaats je vinger of cursor direct op de drijvende nexus. Door de beweging te beperken, blijft je sensorische cortex verankerd in de fysieke realiteit.',
    currentFocus: 'Neuro-Luciditeitsindex',
    sessionHistory: 'Kalibratielogboeken',
    noHistory: 'Nog geen ankersessies geregistreerd.',
    saveLog: 'Sessie Opslaan',
    clearLog: 'Logs Wissen',
    langToggle: 'Switch to EN',
    activeSession: 'Realiteitsanker Actief',
    durationSec: 'Duur',
    focusAchieved: 'Uitlijningspercentage',
    freqLabel: 'Freq',
    helpText: 'Hoe het werkt: SoporAnchor biedt twee essentiële realiteitsindicatoren. Eerst een real-time gesynthetiseerde binaurale basisfrequentie die het vestibulaire systeem kalmeert. Ten tweede een dynamisch visueel kalibratiedoel. Door dit doel te volgen, behoud je actieve taakgerichte hersenactiviteit en voorkom je snelle slaapparalyse.'
  }
};

export default function App() {
  // Language settings
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  
  // Detect user locale initially
  useEffect(() => {
    const userLang = navigator.language || (navigator as any).userLanguage;
    if (userLang && userLang.startsWith('nl')) {
      setLang('nl');
    }
  }, []);

  // Page title dynamic configuration
  useEffect(() => {
    document.title = lang === 'en' 
      ? 'SoporAnchor - Hypnagogic Reality Tether' 
      : 'SoporAnchor - Hypnagogisch Realiteitsanker';
  }, [lang]);

  const currentLang = t[lang];

  // App states
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [carrierFreq, setCarrierFreq] = useState(136.1); // Cosmic frequency / Earth vibration resonance
  const [deltaDiff, setDeltaDiff] = useState(4.0); // 4Hz delta wave
  const [pulseInterval, setPulseInterval] = useState(3.0); // every 3 seconds visual/audio pulse
  
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('soporan_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Session stats state
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [averageFocus, setAverageFocus] = useState(100);
  
  // Dynamic interactive tracker states
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [currentScore, setCurrentScore] = useState(100);
  const [showHelp, setShowHelp] = useState(false);

  // Web Audio Context Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const pulseGainRef = useRef<GainNode | null>(null);

  // Sync logs with localStorage
  useEffect(() => {
    localStorage.setItem('soporan_logs', JSON.stringify(logs));
  }, [logs]);

  // Session duration tick
  useEffect(() => {
    let interval: any;
    if (isActive && sessionStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
        setDuration(elapsed);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isActive, sessionStartTime]);

  // Visual drift system (Simulates real-time hypnagogic drifting target)
  useEffect(() => {
    let driftInterval: any;
    if (isActive) {
      driftInterval = setInterval(() => {
        // Random subtle physics-like micro-drift
        setTargetPos(prev => {
          const dx = (Math.random() - 0.5) * 15;
          const dy = (Math.random() - 0.5) * 15;
          return {
            x: Math.min(Math.max(prev.x + dx, 10), 90),
            y: Math.min(Math.max(prev.y + dy, 10), 90)
          };
        });
      }, 800);
    }
    return () => clearInterval(driftInterval);
  }, [isActive]);

  // Real-time calculation of focus score based on spatial offset
  useEffect(() => {
    if (isActive) {
      const dx = Math.abs(targetPos.x - cursorPos.x);
      const dy = Math.abs(targetPos.y - cursorPos.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Lower distance means perfect alignment (100% capacity)
      const instantScore = Math.max(0, Math.min(100, Math.round(100 - distance * 2.8)));
      setCurrentScore(instantScore);
      setFocusHistory(prev => [...prev.slice(-30), instantScore]);
    }
  }, [targetPos, cursorPos, isActive]);

  // Calculate aggregate score over time
  useEffect(() => {
    if (focusHistory.length > 0) {
      const sum = focusHistory.reduce((a, b) => a + b, 0);
      setAverageFocus(Math.round(sum / focusHistory.length));
    }
  }, [focusHistory]);

  // Interactive Tracking movement hook
  const handleDriftAreaMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    const relativeY = ((clientY - rect.top) / rect.height) * 100;
    
    setCursorPos({
      x: Math.min(Math.max(relativeX, 0), 100),
      y: Math.min(Math.max(relativeY, 0), 100)
    });
  };

  // Sound Architecture Initializer (Advanced Binaural Beat Synthesizer)
  const initAudio = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master gain node
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);

    // Create Left & Right oscillators for exact Binaural Beats
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    
    const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(carrierFreq - deltaDiff / 2, ctx.currentTime);

    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(carrierFreq + deltaDiff / 2, ctx.currentTime);

    if (pannerLeft && pannerRight) {
      pannerLeft.pan.setValueAtTime(-1, ctx.currentTime);
      pannerRight.pan.setValueAtTime(1, ctx.currentTime);

      oscLeft.connect(pannerLeft).connect(mainGain);
      oscRight.connect(pannerRight).connect(mainGain);
    } else {
      oscLeft.connect(mainGain);
      oscRight.connect(mainGain);
    }

    // Pulsative organic anchor sound
    const pulseGain = ctx.createGain();
    pulseGain.gain.setValueAtTime(0, ctx.currentTime);
    
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = 'triangle';
    pulseOsc.frequency.setValueAtTime(carrierFreq * 1.5, ctx.currentTime);
    pulseOsc.connect(pulseGain).connect(mainGain);

    mainGain.connect(ctx.destination);

    oscLeft.start();
    oscRight.start();
    pulseOsc.start();

    leftOscRef.current = oscLeft;
    rightOscRef.current = oscRight;
    leftGainRef.current = mainGain;
    pulseGainRef.current = pulseGain;

    // Pulsative loop timer
    let oscMultiplier = true;
    const schedulePulse = () => {
      if (!isActive) return;
      const now = ctx.currentTime;
      pulseGain.gain.cancelScheduledValues(now);
      pulseGain.gain.setValueAtTime(0, now);
      pulseGain.gain.linearRampToValueAtTime(0.3, now + 0.15);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + pulseInterval * 0.4);
    };

    schedulePulse();
    const pulseTimer = setInterval(schedulePulse, pulseInterval * 1000);
    (audioCtxRef as any).pulseTimer = pulseTimer;
  };

  // Real-time Audio Parameter Adjustments
  useEffect(() => {
    if (leftGainRef.current && audioCtxRef.current) {
      leftGainRef.current.gain.setValueAtTime(volume * 0.4, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    if (leftOscRef.current && rightOscRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      leftOscRef.current.frequency.setValueAtTime(carrierFreq - deltaDiff / 2, now);
      rightOscRef.current.frequency.setValueAtTime(carrierFreq + deltaDiff / 2, now);
    }
  }, [carrierFreq, deltaDiff]);

  // Stop dynamic sound node tree safely
  const killAudio = () => {
    if (audioCtxRef.current) {
      if ((audioCtxRef as any).pulseTimer) {
        clearInterval((audioCtxRef as any).pulseTimer);
      }
      try {
        leftOscRef.current?.stop();
        rightOscRef.current?.stop();
        audioCtxRef.current.close();
      } catch (e) {
        console.error(e);
      }
      audioCtxRef.current = null;
      leftOscRef.current = null;
      rightOscRef.current = null;
    }
  };

  // Primary Switch State Controller
  const toggleAnchor = () => {
    if (isActive) {
      killAudio();
      setIsActive(false);
    } else {
      setIsActive(true);
      setSessionStartTime(Date.now());
      setFocusHistory([]);
      setAverageFocus(100);
      setCurrentScore(100);
      setTimeout(() => {
        initAudio();
      }, 100);
    }
  };

  // Save logs dynamically to storage
  const saveCurrentSession = () => {
    if (duration < 3) return; // Prevent logging extremely brief accidental runs
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(lang === 'nl' ? 'nl-NL' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      duration,
      maxFocusScore: Math.max(...focusHistory, 100),
      successRate: averageFocus,
      anchorFreq: carrierFreq
    };
    setLogs(prev => [newLog, ...prev]);
    toggleAnchor();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-1000">
      
      {/* Ambient background decorative nodes glowing slightly */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl animate-pulse duration-5000" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-3xl animate-pulse duration-10000" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl animate-pulse duration-7000" />
      </div>

      {/* Top Header Panel */}
      <header className="border-b border-slate-900/80 backdrop-blur-md bg-slate-950/40 sticky top-0 z-50 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-teal-400 rounded-xl shadow-lg shadow-purple-500/10">
              <Moon className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-purple-100 via-indigo-200 to-teal-200 bg-clip-text text-transparent flex items-center gap-2">
                {currentLang.title}
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-400 bg-purple-500/5 font-semibold font-mono">
                  V1.2
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">{currentLang.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Info / Explanation toggle */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border border-transparent hover:border-slate-800"
              title="Information"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'nl' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{currentLang.langToggle}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Sensory Engine Interface */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:px-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Description & Interactive Controls Panel */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Explanatory Help Overlay */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-slate-300 text-xs leading-relaxed shadow-lg shadow-indigo-950/10 flex flex-col gap-2"
              >
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 
                  Neuroscience behind SoporAnchor
                </span>
                <p>{currentLang.helpText}</p>
                <button 
                  onClick={() => setShowHelp(false)} 
                  className="text-indigo-400 underline hover:text-indigo-300 text-left cursor-pointer mt-1"
                >
                  Dismiss info
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              {currentLang.tagline}
            </p>
            
            <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <p className="text-[11px] text-slate-400 leading-normal">
                {currentLang.disclaimer}
              </p>
            </div>

            {/* Calibration Controls */}
            <div className="border-t border-slate-800/60 pt-4 mt-2 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
                  {currentLang.settings}
                </h3>
              </div>

              {/* Volume Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{currentLang.volume}</span>
                  <span className="font-mono text-purple-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Carrier Frequency Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{currentLang.carrierFreq}</span>
                  <span className="font-mono text-purple-400">{carrierFreq.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="0.5"
                  value={carrierFreq}
                  onChange={(e) => setCarrierFreq(parseFloat(e.target.value))}
                  className="accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                  <span>Theta (60Hz)</span>
                  <span>Delta Anchor (240Hz)</span>
                </div>
              </div>

              {/* Binaural Delta Offset */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{currentLang.binauralBeat}</span>
                  <span className="font-mono text-teal-400">{deltaDiff.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.1"
                  value={deltaDiff}
                  onChange={(e) => setDeltaDiff(parseFloat(e.target.value))}
                  className="accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                  <span>Deep Delta (1.0Hz)</span>
                  <span>Transition State (8.0Hz)</span>
                </div>
              </div>

              {/* Pulse Interval Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{currentLang.pulseInterval}</span>
                  <span className="font-mono text-teal-400">{pulseInterval.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="6.0"
                  step="0.1"
                  value={pulseInterval}
                  onChange={(e) => setPulseInterval(parseFloat(e.target.value))}
                  className="accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Main Large Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleAnchor}
            className={`w-full py-4 px-6 rounded-2xl font-bold tracking-wide shadow-lg flex items-center justify-center gap-3 cursor-pointer transition-all border ${
              isActive
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-950/40 border-red-500'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-slate-100 shadow-purple-950/40 border-purple-500'
            }`}
          >
            {isActive ? (
              <>
                <Square className="w-5 h-5 fill-current animate-pulse" />
                <span>{currentLang.stopAnchor}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{currentLang.startAnchor}</span>
              </>
            )}
          </motion.button>

          {/* Real-time stats logging panel if active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/60 border border-teal-500/20 p-4 rounded-xl flex flex-col gap-3 shadow-lg shadow-teal-950/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-teal-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    {currentLang.activeSession}
                  </span>
                  <span className="font-mono text-sm text-slate-300 bg-slate-950 px-2 py-0.5 rounded">
                    {Math.floor(duration / 60).toString().padStart(2, '0')}:{(duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{currentLang.currentFocus}</span>
                    <span className="text-lg font-bold font-mono text-teal-300">{currentScore}%</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{currentLang.focusAchieved}</span>
                    <span className="text-lg font-bold font-mono text-purple-300">{averageFocus}%</span>
                  </div>
                </div>

                <button
                  onClick={saveCurrentSession}
                  className="mt-1 w-full py-2 bg-slate-950 border border-slate-800 hover:border-teal-500/30 text-teal-400 hover:text-teal-300 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {currentLang.saveLog}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Interactive Calibration Nexus Panel */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl p-5 rounded-3xl flex flex-col flex-grow min-h-[400px] shadow-2xl relative">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-teal-400" />
                <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
                  {currentLang.driftCalibrator}
                </h2>
              </div>
              
              <div className="flex gap-1.5">
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-800">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Target</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {currentLang.driftDesc}
            </p>

            {/* Interactive Canvas/Div Container for Cursor Drift Tracking */}
            <div
              onMouseMove={handleDriftAreaMove}
              onTouchMove={handleDriftAreaMove}
              className={`relative flex-grow rounded-2xl bg-slate-950/80 overflow-hidden border transition-all duration-300 flex items-center justify-center cursor-crosshair ${
                isActive 
                  ? 'border-purple-500/20 shadow-inner shadow-purple-950/40'
                  : 'border-slate-900 opacity-60 pointer-events-none'
              }`}
            >
              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center backdrop-blur-[2px]">
                  <div className="w-14 h-14 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950/80 text-slate-500 animate-pulse">
                    <Moon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
                    Activate the Sensory Anchor to calibrate the lucidity drift matrix.
                  </p>
                </div>
              )}

              {/* Floating Nexus Visual Element (Target to track) */}
              {isActive && (
                <motion.div
                  animate={{
                    left: `${targetPos.x}%`,
                    top: `${targetPos.y}%`,
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 60 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  {/* Inner glowing particle element */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <span className="absolute w-6 h-6 rounded-full bg-teal-500/20 animate-ping" />
                    <span className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg shadow-teal-500/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </motion.div>
              )}

              {/* Tracking Reticle (Cursor Pointer Response) */}
              {isActive && (
                <div
                  style={{
                    left: `${cursorPos.x}%`,
                    top: `${cursorPos.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-dashed border-purple-500/40 rounded-full z-10 flex items-center justify-center transition-all duration-75 pointer-events-none"
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400" />
                </div>
              )}

              {/* Background Atmospheric Waves pulsing with user interval */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.1, 0.5, 0.1]
                    }}
                    transition={{
                      duration: pulseInterval,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-48 h-48 border-2 border-purple-500/30 rounded-full flex items-center justify-center"
                  >
                    <div className="w-32 h-32 border border-teal-500/20 rounded-full" />
                  </motion.div>
                </div>
              )}

              {/* Real-time precision tracking HUD coordinates overlay */}
              {isActive && (
                <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800 rounded px-2 py-1 font-mono text-[9px] text-slate-500 flex gap-2 pointer-events-none">
                  <span>T: {targetPos.x.toFixed(0)},{targetPos.y.toFixed(0)}</span>
                  <span>A: {cursorPos.x.toFixed(0)},{cursorPos.y.toFixed(0)}</span>
                </div>
              )}
            </div>

            {/* Real-time wave graph simulation */}
            <div className="mt-4 h-12 flex gap-0.5 items-end justify-between bg-slate-950/40 p-2 rounded-xl border border-slate-900">
              {Array.from({ length: 48 }).map((_, i) => {
                const value = focusHistory[focusHistory.length - 48 + i] || 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: '5%' }}
                    animate={{ height: `${Math.max(5, value)}%` }}
                    className={`flex-grow rounded-sm transition-all ${
                      value > 75 
                        ? 'bg-gradient-to-t from-teal-500/30 to-teal-400/80'
                        : value > 40
                          ? 'bg-gradient-to-t from-purple-500/20 to-purple-400/60'
                          : 'bg-gradient-to-t from-rose-500/20 to-rose-400/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Persistent Session Log Archives bottom panel */}
      <footer className="border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-md px-4 py-6 sm:px-8 relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {currentLang.sessionHistory}
              </h2>
            </div>

            {logs.length > 0 && (
              <button
                onClick={clearLogs}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {currentLang.clearLog}
              </button>
            )}
          </div>

          {/* Logs container list view */}
          {logs.length === 0 ? (
            <div className="py-6 px-4 bg-slate-900/10 border border-dashed border-slate-900 rounded-2xl text-center">
              <p className="text-xs text-slate-500 font-medium">{currentLang.noHistory}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[160px] overflow-y-auto pr-1">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 bg-slate-900/30 border border-slate-900/80 rounded-xl flex flex-col gap-1.5 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                      <span className="text-[10px] text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/5 font-mono">
                        {log.anchorFreq.toFixed(1)}Hz
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-1">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">{currentLang.durationSec}</p>
                        <p className="text-xs font-bold font-mono text-slate-200">
                          {log.duration}s
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">{currentLang.focusAchieved}</p>
                        <p className="text-xs font-bold font-mono text-teal-400">
                          {log.successRate}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Subtle branding and license */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 border-t border-slate-900/50 pt-4 mt-2 gap-2">
            <p>© 2026 SoporAnchor Labs. Tailored for conscious sleep transitions.</p>
            <p>Designed for the 1% neuro-atypical sensitivity.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}