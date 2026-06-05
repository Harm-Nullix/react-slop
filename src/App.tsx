import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Eye,
  Info,
  Settings2,
  Sparkles,
  Sliders,
  BookOpen,
  RotateCcw,
  Check,
  Globe,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Activity
} from 'lucide-react';

// Translation Dictionary
const TRANSLATIONS = {
  en: {
    appTitle: "SaccadeSync // Typographic Stabilizer",
    tagline: "Ocular calibration matrix for micro-saccadic stabilization.",
    explanationTitle: "The Science of SaccadeSync",
    explanationDesc: "Designed for the ~1% of individuals with micro-saccadic tracking fatigue, convergence insufficiency, or horizontal ocular drift. Static screens force fatigued extraocular muscles to over-correct, causing text to 'swim'. SaccadeSync generates counter-oscillatory typographic currents that dynamically align text positioning with your micro-saccades, achieving frictionless reading integration.",
    targetAudience: "Target Group: 1% with Ocular-Motor Tracking Anomaly",
    problemTitle: "The Problem",
    problemDesc: "Standard digital layouts cause continuous eye-strain, visual refixation loops, and cognitive fatigue due to static line layouts that fight micro-saccades.",
    solutionTitle: "The Solution",
    solutionDesc: "A tailored micro-vibrational and phase-locked typography model. By calibrating frequency, amplitude, and line-drift, users find their personal optical 'null point' where letters appear completely stationary.",
    calibrateTitle: "1. Calibration Matrix",
    adjustSaccade: "Adjust frequency & amplitude until the typographic wave completely synchronizes with your drift path.",
    freqLabel: "Ocular Frequency",
    ampLabel: "Micro-Saccadic Amplitude",
    phaseLabel: "Angular Phase-Shift",
    lineHeightLabel: "Typographic Dynamic Tracking",
    readerTitle: "2. Stabilized Reader",
    pastePrompt: "Paste text here to read under stabilized ocular conditions...",
    defaultText: "Typographic flow is now governed by your dynamic visual offset. For centuries, reading was static. For those with atypical ocular tracking, the page was a battleground. SaccadeSync shifts the medium to accommodate the biology, neutralizing micro-motions of the fovea through adaptive phase-harmonic text oscillation. Observe how your focus stabilizes as the characters sway precisely counter to your internal ocular drift.",
    resetCalibration: "Reset Calibration",
    savedSuccess: "Calibration parameters synced to neural localStorage!",
    visualizerToggle: "Retinal Trackers",
    soundToggle: "Haptic Audio Metronome",
    statsTitle: "Ocular Analytics",
    stabilizationIndex: "Stabilization Index",
    driftNullification: "Drift Nullification",
    activeState: "ACTIVE",
    calibratingState: "CALIBRATING"
  },
  nl: {
    appTitle: "SaccadeSync // Typografische Stabilisator",
    tagline: "Oculaire kalibratiematrix voor micro-saccadische stabilisatie.",
    explanationTitle: "De Wetenschap achter SaccadeSync",
    explanationDesc: "Ontworpen voor de ~1% van de bevolking die lijdt aan micro-saccadische volgbewegingsvermoeidheid, convergentie-insufficiëntie of oculaire drift. Statische schermen dwingen vermoeide oogspieren tot overcorrectie, waardoor tekst 'zwemt'. SaccadeSync genereert tegen-oscillerende typografische stromen die de tekstuitlijning synchroon laten lopen met uw micro-saccades voor frictieloos lezen.",
    targetAudience: "Doelgroep: 1% met Oculair-Motorische Volgbeweging Afwijkingen",
    problemTitle: "Het Probleem",
    problemDesc: "Standaard digitale lay-outs veroorzaken constante oogvermoeidheid, visuele refixatielussen en cognitieve stress door statische regelpatronen die micro-saccades tegenwerken.",
    solutionTitle: "De Oplossing",
    solutionDesc: "Een op maat gemaakt micro-vibrationeel en fase-gekoppeld typografisch model. Door frequentie, amplitude en regel-drift te kalibreren, vinden gebruikers hun persoonlijke optische 'nulpunt' waarin letters volledig stationair lijken.",
    calibrateTitle: "1. Kalibratie Matrix",
    adjustSaccade: "Pas frequentie en amplitude aan tot de typografische golf perfect synchroniseert met uw natuurlijke oogdrift.",
    freqLabel: "Oculaire Frequentie",
    ampLabel: "Micro-Saccadische Amplitude",
    phaseLabel: "Hoekfaseverschuiving",
    lineHeightLabel: "Typografische Dynamische Spatiëring",
    readerTitle: "2. Gestabiliseerde Lezer",
    pastePrompt: "Plak hier uw tekst om gestabiliseerd te kunnen lezen...",
    defaultText: "De typografische stroom wordt nu gestuurd door uw dynamische visuele compensatie. Eeuwenlang was lezen statisch. Voor mensen met atypische oculaire tracking was de pagina een slagveld. SaccadeSync verschuift het medium om zich aan te passen aan uw biologie, waarbij micro-bewegingen van de fovea worden geneutraliseerd door adaptieve fase-harmonische tekstoscillatie. Ervaar hoe uw focus stabiliseert wanneer de letters exact tegengesteld bewegen aan uw interne oogdrift.",
    resetCalibration: "Kalibratie Resetten",
    savedSuccess: "Kalibratieparameters gesynchroniseerd met lokaal geheugen!",
    visualizerToggle: "Retinale Trackers",
    soundToggle: "Haptische Audio Metronoom",
    statsTitle: "Oculaire Statistieken",
    stabilizationIndex: "Stabilisatie Index",
    driftNullification: "Drift Nullificatie",
    activeState: "ACTIEF",
    calibratingState: "KALIBREREN"
  }
};

export default function App() {
  // Language Detection & Selection
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  
  useEffect(() => {
    const userLang = navigator.language || (navigator as any).userLanguage || 'en';
    if (userLang.startsWith('nl')) {
      setLang('nl');
    } else {
      setLang('en');
    }
  }, []);

  const t = TRANSLATIONS[lang];

  // Page Title Update
  useEffect(() => {
    document.title = t.appTitle;
  }, [lang, t.appTitle]);

  // State Management with LocalStorage Persistance
  const [frequency, setFrequency] = useState<number>(() => {
    const saved = localStorage.getItem('ss_freq');
    return saved ? parseFloat(saved) : 1.6;
  });
  const [amplitude, setAmplitude] = useState<number>(() => {
    const saved = localStorage.getItem('ss_amp');
    return saved ? parseFloat(saved) : 8;
  });
  const [phase, setPhase] = useState<number>(() => {
    const saved = localStorage.getItem('ss_phase');
    return saved ? parseFloat(saved) : 0;
  });
  const [tracking, setTracking] = useState<number>(() => {
    const saved = localStorage.getItem('ss_tracking');
    return saved ? parseFloat(saved) : 12;
  });
  
  const [customText, setCustomText] = useState<string>(() => {
    const saved = localStorage.getItem('ss_text');
    return saved || '';
  });

  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [visualizers, setVisualizers] = useState<boolean>(true);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(false);
  const [pulsePhase, setPulsePhase] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio API Setup for Freq calibration (Web Audio API synth)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (audioFeedback) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120 + (frequency * 40), audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.015, audioCtxRef.current.currentTime);
        
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        
        oscRef.current = osc;
        gainRef.current = gain;
      } catch (e) {
        console.error('Audio Context init failed', e);
      }
    } else {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch(e){} 
        oscRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (oscRef.current) { try { oscRef.current.stop(); } catch(e){} }
      if (audioCtxRef.current) { audioCtxRef.current.close(); }
    };
  }, [audioFeedback]);

  // Sync synthesizer Pitch to Frequency Slider real-time
  useEffect(() => {
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(100 + (frequency * 30), audioCtxRef.current.currentTime);
    }
  }, [frequency]);

  // Persist Calibration Parameters
  const saveCalibration = () => {
    localStorage.setItem('ss_freq', frequency.toString());
    localStorage.setItem('ss_amp', amplitude.toString());
    localStorage.setItem('ss_phase', phase.toString());
    localStorage.setItem('ss_tracking', tracking.toString());
    localStorage.setItem('ss_text', customText);
    
    triggerToast(t.savedSuccess);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const resetCalibration = () => {
    setFrequency(1.6);
    setAmplitude(8);
    setPhase(0);
    setTracking(12);
    localStorage.removeItem('ss_freq');
    localStorage.removeItem('ss_amp');
    localStorage.removeItem('ss_phase');
    localStorage.removeItem('ss_tracking');
    triggerToast("Calibration Reset to default ergonomic values.");
  };

  // Dynamic animation clock loop for typographic wave
  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();
    
    const tick = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const dynamicPhase = Math.sin(elapsedSec * frequency * Math.PI * 2 + (phase * Math.PI / 180));
      setPulsePhase(dynamicPhase);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [frequency, phase]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Grid Overlay / Retinal Target Simulating Spatial Calibration Lines */}
      {visualizers && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
          <div 
            className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4" 
            style={{
              backgroundImage: 'radial-gradient(circle, #2dd4bf 1px, transparent 1px)',
              backgroundSize: `${tracking * 4}px ${tracking * 4}px`,
              transform: `translate(${pulsePhase * amplitude * 0.5}px, ${Math.cos(pulsePhase) * amplitude * 0.5}px)`,
              transition: 'transform 0.05s linear'
            }}
          />
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full blur opacity-40 animate-pulse" />
              <div className="relative bg-slate-950 p-2 rounded-full border border-teal-500/30">
                <Eye className="h-6 w-6 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase bg-teal-500/10 px-2 py-0.5 rounded">
                  V2.5 EDGE
                </span>
                <span className="text-xs font-mono text-slate-500">1% BIOLOGY SYNCS</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 font-mono">
                SaccadeSync
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'nl' : 'en')}
              className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-teal-400 transition-colors border border-slate-900 flex items-center space-x-1.5 text-xs"
              title="Switch Language / Wissel Taal"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="font-mono font-medium uppercase">{lang}</span>
            </button>

            {/* Scientific Explanation Info Button */}
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-teal-400 transition-colors border border-slate-900 flex items-center space-x-1.5 text-xs"
              title="Concept Philosophy & Info"
            >
              <Info className="h-4 w-4 text-teal-400 animate-pulse" />
              <span className="font-mono hidden sm:inline">Science</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Calibration Parameters Panel (5/12) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Live System Diagnostics Grid */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 flex flex-col space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-[50px] pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-teal-400 animate-pulse" />
                <h2 className="text-sm font-semibold tracking-wider font-mono text-slate-300 uppercase">
                  {t.statsTitle}
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full">
                {t.activeState}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400 font-mono">{t.stabilizationIndex}</p>
                <p className="text-lg font-bold font-mono text-teal-400 mt-1">
                  {Math.round(100 - (amplitude * 2.5) + (frequency * 8))}%
                </p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400 font-mono">{t.driftNullification}</p>
                <p className="text-lg font-bold font-mono text-indigo-400 mt-1">
                  -{(amplitude * 1.2).toFixed(1)}px/s
                </p>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setVisualizers(!visualizers)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                  visualizers 
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${visualizers ? 'bg-teal-400' : 'bg-slate-600'} animate-pulse`} />
                <span>{t.visualizerToggle}</span>
              </button>

              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                  audioFeedback
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                {audioFeedback ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span>{t.soundToggle}</span>
              </button>
            </div>
          </div>

          {/* Calibration Sliders Panel */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-teal-400" />
                <span>{t.calibrateTitle}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-900">
              {t.adjustSaccade}
            </p>

            <div className="space-y-5">
              {/* Ocular Frequency (Hz) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium font-mono">{t.freqLabel}</span>
                  <span className="text-teal-400 font-mono font-bold">{frequency.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.5"
                  step="0.1"
                  value={frequency}
                  onChange={(e) => setFrequency(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>0.2 Hz (Slow Drift)</span>
                  <span>4.5 Hz (Fast Nystagmus)</span>
                </div>
              </div>

              {/* Saccadic Amplitude */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium font-mono">{t.ampLabel}</span>
                  <span className="text-indigo-400 font-mono font-bold">{amplitude.toFixed(0)} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={amplitude}
                  onChange={(e) => setAmplitude(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>0px (Absolute Static)</span>
                  <span>24px (High Deflection)</span>
                </div>
              </div>

              {/* Phase Shift */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium font-mono">{t.phaseLabel}</span>
                  <span className="text-emerald-400 font-mono font-bold">{phase}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={phase}
                  onChange={(e) => setPhase(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>-180° (Antiphase)</span>
                  <span>180° (Symmetric)</span>
                </div>
              </div>

              {/* Typographic Kerning / Line Height */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium font-mono">{t.lineHeightLabel}</span>
                  <span className="text-pink-400 font-mono font-bold">{tracking} px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="1"
                  value={tracking}
                  onChange={(e) => setTracking(parseInt(e.target.value))}
                  className="w-full accent-pink-400 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>4px (Dense)</span>
                  <span>24px (Expanded Focus)</span>
                </div>
              </div>
            </div>

            {/* Actions (Save / Reset) */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={saveCalibration}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-400/20 active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Sync Neural Config</span>
              </button>
              
              <button
                onClick={resetCalibration}
                className="px-4 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all flex items-center justify-center space-x-1.5 active:scale-98 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.resetCalibration}</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Stabilized Canvas & Live Interactive Reader (7/12) */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Live Dynamic Reader Interface */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800 flex flex-col space-y-4 flex-grow relative overflow-hidden">
            
            {/* Sub-Header text control */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span>{t.readerTitle}</span>
              </h3>
              
              <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                <span>CALIBRATION MATRIX LOCK ON</span>
              </div>
            </div>

            {/* Custom Input to replace text */}
            <div className="relative">
              <textarea
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-600 transition-all font-sans resize-none"
                placeholder={t.pastePrompt}
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  localStorage.setItem('ss_text', e.target.value);
                }}
              />
            </div>

            {/* Dynamic Saccadic Typography Renderer Pane */}
            <div 
              className="flex-grow bg-slate-950/80 rounded-xl p-6 sm:p-8 border border-slate-800/60 flex flex-col justify-center relative overflow-hidden min-h-[300px]"
              style={{ paddingBottom: '3rem' }}
            >
              {/* Background Focal Target Dot to calibrate focus path */}
              {visualizers && (
                <div 
                  className="absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 rounded-full border border-teal-500/20 flex items-center justify-center transition-transform pointer-events-none"
                  style={{
                    transform: `translate(${pulsePhase * amplitude}px, ${Math.cos(pulsePhase) * amplitude}px)`
                  }}
                >
                  <div className="w-1 h-1 bg-teal-400 rounded-full" />
                </div>
              )}

              {/* Stabilized Text Flow */}
              <div 
                className="relative select-text transition-transform duration-75 ease-out select-none"
                style={{
                  transform: `translate(${pulsePhase * -amplitude}px, ${Math.cos(pulsePhase) * -amplitude}px)`,
                  letterSpacing: `${tracking / 15}px`,
                  lineHeight: `${1.7 + (tracking / 40)}`
                }}
              >
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed tracking-wide text-justify select-text">
                  {customText.trim() !== '' ? customText : t.defaultText}
                </p>
              </div>

              {/* Micro-Interaction Indicator at the base of reader representing the counter-wave */}
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>WAVE FORM STATE</span>
                <div className="flex items-center space-x-1.5">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const heightFactor = Math.abs(Math.sin((pulsePhase * Math.PI) + (i * 0.3)));
                    return (
                      <span 
                        key={i}
                        className="w-1 bg-teal-400/40 rounded-full transition-all duration-75"
                        style={{ height: `${2 + heightFactor * 12}px` }}
                      />
                    );
                  })}
                </div>
                <span>PHASE SHIFT ACTIVE</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Toast Messages Layer */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-teal-500/30 shadow-2xl rounded-2xl p-4 flex items-center space-x-3 backdrop-blur-lg"
          >
            <div className="p-1.5 bg-teal-400/10 rounded-lg text-teal-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-200 leading-tight font-mono">
              {toastMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog Explainer Popup (Design & Philosophy Science Modal) */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 overflow-hidden"
            >
              {/* Design abstract accents */}
              <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-teal-400" />
                  <h2 className="text-base font-bold font-mono tracking-tight text-slate-100">
                    {t.explanationTitle}
                  </h2>
                </div>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300">
                <p className="text-teal-400 font-mono text-xs">
                  {t.targetAudience}
                </p>
                <p>
                  {t.explanationDesc}
                </p>
                <div className="border-t border-slate-850 pt-4 mt-2 space-y-3">
                  <h4 className="font-bold font-mono text-slate-200 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block mr-1.5" />
                    <span>{t.problemTitle}</span>
                  </h4>
                  <p className="text-slate-400 text-xs">
                    {t.problemDesc}
                  </p>
                  
                  <h4 className="font-bold font-mono text-slate-200 flex items-center space-x-1 pt-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block mr-1.5" />
                    <span>{t.solutionTitle}</span>
                  </h4>
                  <p className="text-slate-400 text-xs">
                    {t.solutionDesc}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInfo(false)}
                  className="bg-slate-800 hover:bg-slate-705 text-slate-200 text-xs font-mono py-2 px-4 rounded-xl transition-all border border-slate-700/50 flex items-center space-x-1.5 active:scale-98 cursor-pointer"
                >
                  <span>Acknowledge Calibration Matrix</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Details */}
      <footer className="relative z-10 border-t border-slate-900 py-4 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-slate-500">
          <p>© 2026 SaccadeSync Inc. Experimental Cognitive Ocular Integration.</p>
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <span>1% Solutions Array</span>
            <span className="h-1 w-1 bg-slate-800 rounded-full" />
            <span className="text-teal-400">Fovea Lock: Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}