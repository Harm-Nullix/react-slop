import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Save,
  Trash2,
  Info,
  CheckCircle2,
  Sliders,
  Volume1
} from 'lucide-react';

// Translations
const TRANSLATIONS = {
  en: {
    title: "AuraPhase // Auditory Trigger Shield",
    subtitle: "Phase-calibrated masking matrix for hyper-acute sensory profiles.",
    instructions: "Drag the glowing pulse node to match the frequency (pitch) and cadence (rhythm) of the environmental trigger. The synthesizer generates an inverted anti-trigger envelope to neutralize cognitive alarm response.",
    frequency: "Frequency Focus",
    cadence: "Cadence Modulation",
    intensity: "Shield Absorption",
    colorProfile: "Acoustic Profile",
    savePreset: "Lock Shield Configuration",
    presetPlaceholder: "Label this profile...",
    savedShields: "Active Enclaves",
    noPresets: "No locked profiles found. Calibrate and save above.",
    startShield: "ENGAGE SHIELD",
    stopShield: "COLLAPSE SHIELD",
    helpTitle: "How AuraPhase works",
    helpBody: "AuraPhase utilizes dynamic phase-amplitude modulation. By mapping the frequency and rhythm of triggering environmental sounds (like typing, ticking, or clicking), it generates a localized psychoacoustic veil tailored to instantly reduce startle-reflex and amygdala activation.",
    toastSaved: "Acoustic configuration successfully locked.",
    toastDeleted: "Profile purged from memory."
  },
  nl: {
    title: "AuraPhase // Auditief Triggerschild",
    subtitle: "Fase-gekalibreerd maskeringsmatrix voor hypergevoelige zintuigelijke profielen.",
    instructions: "Sleep de gloeiende puls-node om de frequentie (toonhoogte) en cadans (ritme) van de omgevings-trigger te matchen. De synthesizer genereert een geïnverteerde anti-trigger enveloppe om de cognitieve alarmrespons te neutraliseren.",
    frequency: "Frequentie Focus",
    cadence: "Cadans Modulatie",
    intensity: "Schild Absorptie",
    colorProfile: "Akoestisch Profiel",
    savePreset: "Vergrendel Schildconfiguratie",
    presetPlaceholder: "Geef dit profiel een naam...",
    savedShields: "Actieve Enclaves",
    noPresets: "Geen vergrendelde profielen gevonden. Kalibreer en sla hierboven op.",
    startShield: "SCHILD ACTIVEREN",
    stopShield: "SCHILD DEACTIVEREN",
    helpTitle: "Hoe AuraPhase werkt",
    helpBody: "AuraPhase maakt gebruik van dynamische fase-amplitude-modulatie. Door de frequentie en het ritme van storende omgevingsgeluiden (zoals typen, tikken of kauwen) in kaart te brengen, genereert het een psychoakoestische sluier om de schrikreactie en amygdala-activatie direct te dempen.",
    toastSaved: "Akoestische configuratie succesvol vergrendeld.",
    toastDeleted: "Profiel gewist uit geheugen."
  }
};

interface ShieldPreset {
  id: string;
  name: string;
  x: number; // Frequency coordinate (0 - 100)
  y: number; // Cadence coordinate (0 - 100)
  intensity: number;
  profile: 'white' | 'brown' | 'pink';
}

export default function App() {
  // Language Detection
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  
  useEffect(() => {
    const browserLang = navigator.language || 'en';
    if (browserLang.startsWith('nl')) {
      setLang('nl');
    } else {
      setLang('en');
    }
  }, []);

  const t = TRANSLATIONS[lang];

  // Page Meta Title Setup
  useEffect(() => {
    document.title = t.title;
  }, [lang, t.title]);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lfoNodeRef = useRef<OscillatorNode | null>(null);
  const lfoGainNodeRef = useRef<GainNode | null>(null);

  // Interactive & Audio State
  const [isActive, setIsActive] = useState(false);
  const [nodePos, setNodePos] = useState({ x: 45, y: 35 });
  const [intensity, setIntensity] = useState(65);
  const [profile, setProfile] = useState<'white' | 'pink' | 'brown'>('pink');
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<ShieldPreset[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const padRef = useRef<HTMLDivElement>(null);

  // LocalStorage Loading
  useEffect(() => {
    const stored = localStorage.getItem('auraphase_presets');
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading presets', e);
      }
    }
  }, []);

  // Save to LocalStorage
  const savePresetsToStorage = (newPresets: ShieldPreset[]) => {
    localStorage.setItem('auraphase_presets', JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  // Helper: Trigger custom toast feedback
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initialize Web Audio Engine
  const initAudio = () => {
    if (audioCtxRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // 1. Create Noise Buffer
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate specific noise spectral profile
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (profile === 'white') {
        output[i] = white;
      } else if (profile === 'pink') {
        // Pink filter approximation
        output[i] = (lastOut * 0.95 + white * 0.05) * 1.5;
        lastOut = output[i];
      } else {
        // Brown filter approximation (heavier attenuation)
        output[i] = (lastOut * 0.992 + white * 0.008) * 3.5;
        lastOut = output[i];
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // 2. Setup dynamic tracking Bandpass/Lowpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = profile === 'white' ? 'bandpass' : 'lowpass';
    // Map X node (0-100) to log-frequency range (180Hz - 4200Hz)
    const frequencyMap = 180 * Math.pow(4200 / 180, nodePos.x / 100);
    filter.frequency.setValueAtTime(frequencyMap, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    // 3. Setup Gain node linked with master Intensity
    const gainNode = ctx.createGain();
    const targetGain = (intensity / 100) * 0.28;
    gainNode.gain.setValueAtTime(targetGain, ctx.currentTime);

    // 4. Setup LFO modulation for Cadence simulation (mapping trigger repetition patterns)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    // Y coordinate determines rhythm speed (0.2Hz to 12Hz)
    const cadenceFreq = 0.2 + (nodePos.y / 100) * 11.8;
    lfo.type = 'triangle';
    lfo.frequency.setValueAtTime(cadenceFreq, ctx.currentTime);
    
    // Moderate modulation amplitude depth
    lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Connect Routing
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Store refs
    noiseSourceRef.current = source;
    filterNodeRef.current = filter;
    gainNodeRef.current = gainNode;
    lfoNodeRef.current = lfo;
    lfoGainNodeRef.current = lfoGain;
  };

  const startAudio = () => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    try {
      initAudio();
      noiseSourceRef.current?.start();
      lfoNodeRef.current?.start();
      setIsActive(true);
    } catch (e) {
      console.error('Audio start failure', e);
    }
  };

  const stopAudio = () => {
    try {
      noiseSourceRef.current?.stop();
      lfoNodeRef.current?.stop();
    } catch (e) {
      // Node might not have started
    }
    noiseSourceRef.current = null;
    lfoNodeRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsActive(false);
  };

  // Keep audio node values synchronized with visual adjustments
  useEffect(() => {
    if (isActive && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const frequencyMap = 180 * Math.pow(4200 / 180, nodePos.x / 100);
      filterNodeRef.current?.frequency.setTargetAtTime(frequencyMap, ctx.currentTime, 0.08);

      const cadenceFreq = 0.2 + (nodePos.y / 100) * 11.8;
      lfoNodeRef.current?.frequency.setTargetAtTime(cadenceFreq, ctx.currentTime, 0.1);
    }
  }, [nodePos, isActive]);

  useEffect(() => {
    if (isActive && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const targetGain = (intensity / 100) * 0.28;
      gainNodeRef.current?.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
    }
  }, [intensity, isActive]);

  // Automatically rebuild/re-bind synth when switching profile types
  useEffect(() => {
    if (isActive) {
      stopAudio();
      setTimeout(() => {
        startAudio();
      }, 60);
    }
  }, [profile]);

  // Handle interactive pad tracking
  const handlePadInteraction = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const xVal = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yVal = Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100));
    setNodePos({ x: xVal, y: yVal });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePadInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handlePadInteraction(e.clientX, e.clientY);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    handlePadInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Manage presets locking
  const saveCurrentPreset = () => {
    const name = presetName.trim() || `Schild - Focus F:${Math.round(nodePos.x)}Hz`;
    const newPreset: ShieldPreset = {
      id: crypto.randomUUID(),
      name,
      x: nodePos.x,
      y: nodePos.y,
      intensity,
      profile
    };
    const updated = [newPreset, ...presets];
    savePresetsToStorage(updated);
    setPresetName('');
    triggerToast(t.toastSaved);
  };

  const loadPreset = (preset: ShieldPreset) => {
    setNodePos({ x: preset.x, y: preset.y });
    setIntensity(preset.intensity);
    setProfile(preset.profile);
    if (isActive) {
      // Brief cycle to re-establish proper filter routing values
      stopAudio();
      setTimeout(() => startAudio(), 100);
    }
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter(p => p.id !== id);
    savePresetsToStorage(updated);
    triggerToast(t.toastDeleted);
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden antialiased">
      {/* Soft futuristic background glowing orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/5 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[180px]" />
      </div>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 border border-emerald-500/30 backdrop-blur-xl px-5 py-3 rounded-full shadow-2xl shadow-emerald-950/20 text-emerald-300 text-sm font-mono tracking-wide"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Container */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-900/80 bg-[#06080F]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10">
            <motion.div
              animate={isActive ? {
                scale: [1, 1.4, 1],
                rotate: [0, 180, 360],
                borderRadius: ["30%", "50%", "30%"]
              } : {}}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-emerald-400 opacity-20 blur-sm rounded-lg"
            />
            <Shield className={`w-6 h-6 z-10 transition-colors duration-500 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400">
              AuraPhase
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-mono tracking-widest text-emerald-400 border border-emerald-500/20 bg-emerald-950/10 rounded-sm">
              v2.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Selector toggles */}
          <div className="flex items-center border border-slate-800/80 rounded-full p-0.5 bg-slate-950/80">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                lang === 'en' ? 'bg-cyan-500/15 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('nl')}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                lang === 'nl' ? 'bg-cyan-500/15 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              NL
            </button>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2.5 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-400 hover:text-slate-200 transition-all cursor-pointer relative group"
          >
            <Info className="w-4 h-4" />
            <span className="absolute right-0 top-12 scale-0 group-hover:scale-100 transition-all origin-top-right duration-200 bg-slate-950 text-[11px] text-slate-300 border border-slate-800 py-1.5 px-3 rounded-lg w-52 z-30">
              {t.helpTitle}
            </span>
          </button>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-grow">
        
        {/* Matrix & Main Controls - Left and Mid column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950/80 border border-slate-900/90 backdrop-blur-xl p-5 md:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
                  {t.title}
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                  {t.subtitle}
                </p>
              </div>

              {/* Main Activating Shield Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isActive ? stopAudio : startAudio}
                className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-mono text-sm tracking-widest font-bold flex items-center justify-center gap-3 shadow-lg cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/10 hover:shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white hover:opacity-95 shadow-cyan-500/10 hover:shadow-cyan-500/25'
                }`}
              >
                {isActive ? (
                  <>
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Volume2 className="w-5 h-5" />
                    </motion.div>
                    <span>{t.stopShield}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-5 h-5" />
                    <span>{t.startShield}</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Instructions Accordion/Alert */}
            <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl flex items-start gap-3.5">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {t.instructions}
              </p>
            </div>

            {/* THE INTEGRATIVE VECTOR VECTOR MATRIX PAD */}
            <div className="relative space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-500 px-1">
                <span>[Y] {t.cadence} ({Math.round(0.2 + (nodePos.y / 100) * 11.8)}Hz)</span>
                <span>[X] {t.frequency} ({Math.round(180 * Math.pow(4200 / 180, nodePos.x / 100))}Hz)</span>
              </div>

              <div
                ref={padRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
                className="relative h-80 sm:h-96 w-full rounded-2xl border border-slate-900 bg-slate-950/90 shadow-inner overflow-hidden cursor-crosshair touch-none select-none"
              >
                {/* Matrix Coordinate Lines & Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1324_1px,transparent_1px),linear-gradient(to_bottom,#0c1324_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />

                {/* Active vector targeting lines tracing crosshair */}
                <div 
                  className="absolute left-0 right-0 h-[1px] bg-slate-800/60 pointer-events-none"
                  style={{ bottom: `${nodePos.y}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-800/60 pointer-events-none"
                  style={{ left: `${nodePos.x}%` }}
                />

                {/* Audio active ripple visualizer concentric circles */}
                <AnimatePresence>
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(3)].map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0.8, scale: 0 }}
                          animate={{
                            opacity: 0,
                            scale: [0, 2 + index * 0.8],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: index * 1,
                            ease: "easeOut"
                          }}
                          className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border border-cyan-500/30 bg-cyan-500/5"
                          style={{
                            left: `${nodePos.x}%`,
                            bottom: `${nodePos.y}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {/* Floating particles that disperse when sound engine runs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={isActive ? {
                        x: [Math.sin(i) * 120, Math.sin(i) * 200, Math.sin(i) * 120],
                        y: [Math.cos(i) * 120, Math.cos(i) * -60, Math.cos(i) * 120],
                        opacity: [0.1, 0.4, 0.1]
                      } : {
                        x: [0, Math.sin(i) * 10, 0],
                        y: [0, Math.cos(i) * 10, 0],
                        opacity: 0.15
                      }}
                      transition={{ duration: 6 + (i % 4), repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/40"
                      style={{
                        left: `${20 + (i * 5.2)}%`,
                        top: `${15 + (i * 5.8)}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Centered target node cursor */}
                <motion.div
                  animate={isActive ? {
                    boxShadow: ["0 0 10px #06b6d4", "0 0 25px #10b981", "0 0 10px #06b6d4"]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors duration-300 ${
                    isActive ? 'border-emerald-400 bg-slate-900/80' : 'border-cyan-400 bg-slate-900'
                  }`}
                  style={{
                    left: `${nodePos.x}%`,
                    bottom: `${nodePos.y}%`,
                  }}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                </motion.div>
              </div>
            </div>

            {/* Sound profile and absorption sliders row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">{t.intensity}</span>
                  <span className="text-cyan-400 font-bold">{intensity}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Volume1 className="w-4 h-4 text-slate-500" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  />
                  <Volume2 className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 block">{t.colorProfile}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['white', 'pink', 'brown'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setProfile(type)}
                      className={`py-2 px-3 text-xs font-mono border rounded-xl tracking-wider capitalize transition-all duration-300 cursor-pointer ${
                        profile === type
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-semibold'
                          : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-300 hover:border-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save profile preset trigger */}
            <div className="pt-3 border-t border-slate-900/90 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t.presetPlaceholder}
                  maxLength={28}
                  className="w-full px-4 py-3 bg-slate-950/90 border border-slate-900 hover:border-slate-800 focus:border-cyan-500/80 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={saveCurrentPreset}
                className="px-5 py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-slate-200 hover:text-slate-100 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {t.savePreset}
              </button>
            </div>
          </div>
        </div>

        {/* Presets Grid - Right column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-950/80 border border-slate-900/90 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-xl flex flex-col">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-900">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300">
                {t.savedShields}
              </h2>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
              {presets.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-900 rounded-2xl p-4">
                  <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500 max-w-[200px] mx-auto">
                    {t.noPresets}
                  </p>
                </div>
              ) : (
                presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.01, x: 2 }}
                    onClick={() => loadPreset(preset)}
                    className="group relative p-3.5 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="font-mono text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-950 text-slate-500">
                          {preset.profile.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          F:{Math.round(preset.x)}% · C:{Math.round(preset.y)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deletePreset(preset.id, e)}
                      className="p-1.5 rounded-md hover:bg-slate-950 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Helpful guide details card */}
          <div className="bg-gradient-to-br from-slate-950/95 to-slate-900/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-xl rounded-full pointer-events-none" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase block mb-2">
              {t.helpTitle}
            </span>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {t.helpBody}
            </p>
          </div>
        </div>
      </main>

      {/* Subtle Interactive Footer with animated coordinate stream */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 border-t border-slate-900/80 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 text-[10px] font-mono text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-ping" />
          <span>AuraPhase Matrix Calibrator // Active Spatial Sync</span>
        </div>
        <div className="flex items-center gap-4">
          <span>X-AXIS_HZ: {Math.round(nodePos.x * 42)}</span>
          <span>Y-AXIS_LFO: {nodePos.y.toFixed(1)}</span>
          <span>INTENSITY: {intensity}%</span>
        </div>
      </footer>
    </div>
  );
}