import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Info,
  Save,
  RotateCcw,
  Type,
  Music,
  Check,
  Globe,
  Layers,
  Sliders,
  Palette
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    title: "ChromaPhon // Synesthetic Palette Designer",
    tagline: "Translate orthography into customized sensory-rich color fields and ambient microtonal acoustics.",
    subtitle: "Built for the 1% of the population experiencing Grapheme-Color Synesthesia.",
    inputPlaceholder: "Type a word, name, or phrase to synthesize color & sound...",
    tabVisualizer: "Chroma Canvas",
    tabMapping: "Orthography Map",
    tabSynthesizer: "Acoustic Synth",
    paletteTitle: "Active Color Palette",
    mappingTitle: "Map Characters to Senses",
    freqChart: "Spectral Frequency Analysis",
    btnPlay: "Synthesize Ambient Wave",
    btnStop: "Mute Atmosphere",
    btnSave: "Save Mapping",
    btnReset: "Reset Defaults",
    langLabel: "Nederlands",
    savedMsg: "Custom Synesthetic Map Saved!",
    resetMsg: "Defaults Restored.",
    charHeader: "Character",
    colorHeader: "Color Profile",
    frequencyHeader: "Tonal Pitch",
    emptyPalette: "Type above to populate your spectrum",
    modalTitle: "About Grapheme-Color Synesthesia",
    modalBody: "Grapheme-color synesthesia is a neurological phenomenon where letters, numbers, and words are inherently experienced as highly specific colors. ChromaPhon empowers synesthetes to map their unique inner alphabet, generate beautiful custom color palettes directly from text, and instantly compose spatial drone-scapes tuned to the exact 'vibe' of their favorite words."
  },
  nl: {
    title: "ChromaPhon // Synesthetische Palet Ontwerper",
    tagline: "Vertaal spelling naar op maat gemaakte, zintuiglijke kleurvelden en microtonale omgevingsakoestiek.",
    subtitle: "Gebouwd voor de 1% van de wereldbevolking die grafeem-kleursynesthesie ervaart.",
    inputPlaceholder: "Typ een woord, naam of zin om kleur & geluid te synthetiseren...",
    tabVisualizer: "Chroma Canvas",
    tabMapping: "Letterkaart",
    tabSynthesizer: "Akoestische Synth",
    paletteTitle: "Actief Kleurenpalet",
    mappingTitle: "Koppel Tekens aan Zintuigen",
    freqChart: "Spectrale Frequentie Analyse",
    btnPlay: "Synthetiseer Geluidsgolf",
    btnStop: "Demp Geluid",
    btnSave: "Kaart Opslaan",
    btnReset: "Standaard Instellingen",
    langLabel: "English",
    savedMsg: "Synesthetische kaart opgeslagen!",
    resetMsg: "Standaardinstellingen hersteld.",
    charHeader: "Teken",
    colorHeader: "Kleurprofiel",
    frequencyHeader: "Toonhoogte",
    emptyPalette: "Typ hierboven om je spectrum te vullen",
    modalTitle: "Over Grafeem-Kleursynesthesie",
    modalBody: "Grafeem-kleursynesthesie is een neurologisch fenomeen waarbij letters, cijfers en woorden inherent worden ervaren als zeer specifieke kleuren. ChromaPhon stelt synestheten in staat om hun unieke innerlijke alfabet in kaart te brengen, prachtige kleurenpaletten te genereren direct uit tekst, en direct ruimtelijke ambient-scapes te componeren die zijn afgestemd op de exacte 'vibe' van hun favoriete woorden."
  }
};

// --- DEFAULT COLOR & FREQUENCY CONFIG (A-Z) ---
const DEFAULT_MAP = {
  A: { color: "#E53935", freq: 220.00 }, // Low A
  B: { color: "#D81B60", freq: 246.94 }, // B
  C: { color: "#8E24AA", freq: 261.63 }, // Middle C
  D: { color: "#5E35B1", freq: 293.66 }, 
  E: { color: "#3949AB", freq: 329.63 }, 
  F: { color: "#1E88E5", freq: 349.23 }, 
  G: { color: "#00ACC1", freq: 392.00 }, 
  H: { color: "#00897B", freq: 440.00 }, 
  I: { color: "#43A047", freq: 493.88 }, 
  J: { color: "#7CB342", freq: 523.25 }, 
  K: { color: "#C0CA33", freq: 587.33 }, 
  L: { color: "#FDD835", freq: 659.25 }, 
  M: { color: "#FFB300", freq: 698.46 }, 
  N: { color: "#F57C00", freq: 783.99 }, 
  O: { color: "#E65100", freq: 880.00 }, 
  P: { color: "#D84315", freq: 987.77 }, 
  Q: { color: "#4E342E", freq: 1046.50 }, 
  R: { color: "#455A64", freq: 1174.66 }, 
  S: { color: "#37474F", freq: 1318.51 }, 
  T: { color: "#8D6E63", freq: 1396.91 }, 
  U: { color: "#78909C", freq: 1567.98 }, 
  V: { color: "#EC407A", freq: 1760.00 }, 
  W: { color: "#AB47BC", freq: 1975.53 }, 
  X: { color: "#26A69A", freq: 2093.00 }, 
  Y: { color: "#9CCC65", freq: 2349.32 }, 
  Z: { color: "#D4E157", freq: 2637.02 } 
};

export default function App() {
  // Language Handling
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  
  useEffect(() => {
    const browserLang = navigator.language.substring(0, 2);
    if (browserLang === 'nl') {
      setLang('nl');
    } else {
      setLang('en');
    }
  }, []);

  const t = TRANSLATIONS[lang];

  // Dynamic Document Title based on language
  useEffect(() => {
    document.title = t.title;
  }, [lang, t]);

  // State
  const [textInput, setTextInput] = useState('ChromaPhon');
  const [charMap, setCharMap] = useState<Record<string, { color: string; freq: number }>>(() => {
    const saved = localStorage.getItem('chromaphon_mapping');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_MAP; }
    }
    return DEFAULT_MAP;
  });
  const [activeTab, setActiveTab] = useState<'canvas' | 'mapping' | 'synth'>('canvas');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCharDetail, setSelectedCharDetail] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  // Audio API Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<Record<string, { osc: OscillatorNode; gain: GainNode }>>({});
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Toast feedback trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle mapping updates
  const updateCharProp = (char: string, field: 'color' | 'freq', value: string | number) => {
    setCharMap(prev => {
      const updated = {
        ...prev,
        [char]: {
          ...prev[char],
          [field]: value
        }
      };
      return updated;
    });
  };

  // LocalStorage Persistence
  const handleSaveMap = () => {
    localStorage.setItem('chromaphon_mapping', JSON.stringify(charMap));
    triggerToast(t.savedMsg);
  };

  const handleResetMap = () => {
    setCharMap(DEFAULT_MAP);
    localStorage.removeItem('chromaphon_mapping');
    triggerToast(t.resetMsg);
  };

  // Computed text properties
  const lettersInText = useMemo(() => {
    return textInput.toUpperCase().split('').filter(c => charMap[c]);
  }, [textInput, charMap]);

  // Spectral distribution for Recharts visualization
  const spectralData = useMemo(() => {
    return lettersInText.map((char, index) => ({
      name: char,
      frequency: charMap[char]?.freq || 220,
      color: charMap[char]?.color || '#ffffff',
      index: index + 1
    }));
  }, [lettersInText, charMap]);

  // Synth Control Logic (Pure Web Audio Ambient Engine)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      // Setup signal chain: Oscillators -> Custom Lowpass Resonance Filter -> Delay Line -> Master Gain -> Destination
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 2;

      const delay = ctx.createDelay();
      delay.delayTime.value = 0.4;

      const delayGain = ctx.createGain();
      delayGain.gain.value = 0.3;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.0; // Start muted

      // Patch routing
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(filter); // feedback loop

      filter.connect(masterGain);
      delayGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      filterNodeRef.current = filter;
    }
  };

  useEffect(() => {
    if (isPlaying) {
      initAudio();
      const ctx = audioCtxRef.current!;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Ramp up master gain smoothly to prevent clipping
      masterGainRef.current!.gain.setTargetAtTime(0.18, ctx.currentTime, 0.4);

      // Start oscillators for each unique letter in the string
      const uniqueActiveChars = Array.from(new Set(lettersInText));
      
      // Stop nodes that are no longer in active chars list
      Object.keys(oscNodesRef.current).forEach(char => {
        if (!uniqueActiveChars.includes(char)) {
          oscNodesRef.current[char].gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
          setTimeout(() => {
            try {
              oscNodesRef.current[char]?.osc.stop();
            } catch(e) {}
            delete oscNodesRef.current[char];
          }, 500);
        }
      });

      // Create or update active nodes
      uniqueActiveChars.forEach((char, idx) => {
        const mapped = charMap[char];
        if (!mapped) return;

        if (!oscNodesRef.current[char]) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          // Mix waveforms for organic, rich texture (Triangle + Sine combo simulation)
          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(mapped.freq, ctx.currentTime);
          
          oscGain.gain.setValueAtTime(0, ctx.currentTime);
          
          osc.connect(oscGain);
          oscGain.connect(filterNodeRef.current!);
          
          osc.start();
          oscNodesRef.current[char] = { osc, gain: oscGain };
        }

        // Dynamic modulation - adjust pitch if mapping changed
        oscNodesRef.current[char].osc.frequency.setTargetAtTime(mapped.freq, ctx.currentTime, 0.1);
        
        // Distribute gain among active oscillators
        const individualGain = 0.5 / uniqueActiveChars.length;
        oscNodesRef.current[char].gain.gain.setTargetAtTime(individualGain, ctx.currentTime, 0.5);
      });

    } else {
      // Fade-out master gain smoothly to avoid audio pops
      if (masterGainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        
        // Complete tear-down after delay
        setTimeout(() => {
          Object.values(oscNodesRef.current).forEach(node => {
            try { node.osc.stop(); } catch(e) {}
          });
          oscNodesRef.current = {};
        }, 500);
      }
    }
  }, [isPlaying, lettersInText, charMap]);

  // Trigger real-time sound update on mapping tuning
  const handleTonalAdjustment = (char: string, freq: number) => {
    updateCharProp(char, 'freq', freq);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      
      {/* DYNAMIC SHADOWY AMBIENT BACKDROP */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute -top-[40%] -left-[20%] w-[100%] h-[100%] rounded-full opacity-20 blur-[150px] transition-all duration-1000 ease-in-out"
          style={{
            background: lettersInText.length > 0 
              ? `radial-gradient(circle, ${charMap[lettersInText[0]]?.color || '#5E35B1'} 0%, transparent 70%)` 
              : 'radial-gradient(circle, #8E24AA 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute -bottom-[30%] -right-[10%] w-[80%] h-[80%] rounded-full opacity-15 blur-[120px] transition-all duration-1000 ease-in-out"
          style={{
            background: lettersInText.length > 1 
              ? `radial-gradient(circle, ${charMap[lettersInText[lettersInText.length - 1]]?.color || '#00ACC1'} 0%, transparent 70%)` 
              : 'radial-gradient(circle, #1E88E5 0%, transparent 70%)'
          }}
        />
      </div>

      {/* HEADER SECTION */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                ChromaPhon
              </h1>
              <p className="text-xs text-zinc-400 font-medium hidden sm:block">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(true)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Information"
            >
              <Info className="w-5 h-5" />
            </button>

            <button
              onClick={() => setLang(l => l === 'en' ? 'nl' : 'en')}
              className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:text-white transition-all flex items-center gap-2 font-medium cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              {t.langLabel}
            </button>
          </div>
        </div>
      </header>

      {/* HERO HERO SECTION (INPUT CONTROL) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8 relative z-10">
        <section className="text-center max-w-2xl mx-auto flex flex-col gap-3 mt-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t.tagline}
          </h2>
          <div className="relative mt-4 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl flex items-center p-1 focus-within:border-zinc-700">
              <div className="pl-3 text-zinc-500">
                <Type className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value.slice(0, 48))}
                placeholder={t.inputPlaceholder}
                className="w-full bg-transparent border-0 outline-none focus:ring-0 py-3 px-3 text-white text-lg font-semibold tracking-wide placeholder-zinc-600"
              />
              {textInput && (
                <button
                  onClick={() => setTextInput('')}
                  className="p-2 text-zinc-500 hover:text-white mr-2 text-xs font-semibold hover:bg-zinc-900 rounded-lg cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </section>

        {/* NAVIGATION / CONTROLS & SYNTH TOGGLE */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-850 pb-2">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'canvas' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {t.tabVisualizer}
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'mapping' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {t.tabMapping}
            </button>
            <button
              onClick={() => setActiveTab('synth')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'synth' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              {t.tabSynthesizer}
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold tracking-wide text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 animate-pulse' 
                : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white shadow-purple-500/25'
            }`}
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isPlaying ? t.btnStop : t.btnPlay}
          </button>
        </div>

        {/* MAIN VIEWS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* TAB 1: CANVAS VISUALIZATION */}
          {activeTab === 'canvas' && (
            <div className="lg:col-span-3 space-y-6">
              {/* ORTHOGRAPHIC SPECTRUM ROW */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm min-h-[180px] flex flex-col justify-center">
                <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4">
                  {t.paletteTitle}
                </h3>
                {lettersInText.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center italic py-8">{t.emptyPalette}</p>
                ) : (
                  <div className="flex flex-wrap gap-3 items-center justify-center">
                    <AnimatePresence mode="popLayout">
                      {textInput.split('').map((char, index) => {
                        const upperChar = char.toUpperCase();
                        const mapped = charMap[upperChar];
                        
                        if (!mapped) {
                          return (
                            <motion.span 
                              key={`${char}-${index}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 0.3, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="text-2xl sm:text-4xl font-black text-zinc-700 px-1 select-none"
                            >
                              {char}
                            </motion.span>
                          );
                        }

                        return (
                          <motion.div
                            key={`${char}-${index}`}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0, 
                              scale: 1,
                              boxShadow: `0 4px 20px -2px ${mapped.color}35` 
                            }}
                            whileHover={{ 
                              scale: 1.15, 
                              y: -4,
                              boxShadow: `0 8px 24px -1px ${mapped.color}65` 
                            }}
                            onClick={() => setSelectedCharDetail(upperChar)}
                            className="relative flex flex-col items-center justify-center w-14 h-20 sm:w-18 sm:h-24 rounded-xl border border-white/10 overflow-hidden cursor-pointer transition-shadow duration-300 select-none"
                            style={{
                              background: `linear-gradient(135deg, ${mapped.color}25, ${mapped.color}05)`,
                            }}
                          >
                            <div 
                              className="absolute inset-x-0 bottom-0 h-1.5 transition-all"
                              style={{ backgroundColor: mapped.color }}
                            />
                            <span 
                              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                              style={{ color: mapped.color }}
                            >
                              {char}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-1">
                              {Math.round(mapped.freq)}Hz
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* GENERATIVE FLUID WAVE CANVAS COMPONENT */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
                <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4">
                  Generative Chrono-Fluid Field
                </h3>
                <div className="h-64 sm:h-80 w-full flex items-center justify-center relative rounded-xl bg-zinc-950 border border-zinc-900 overflow-hidden">
                  {lettersInText.length === 0 ? (
                    <div className="text-zinc-600 text-sm italic">Waiting for semantic feedback...</div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex gap-1 items-end h-48 w-full px-8 justify-between opacity-70">
                        {lettersInText.map((char, index) => {
                          const color = charMap[char]?.color || '#ffffff';
                          const freq = charMap[char]?.freq || 300;
                          return (
                            <motion.div
                              key={index}
                              animate={{
                                height: isPlaying 
                                  ? ["20%", "95%", "40%", "80%", "20%"] 
                                  : ["30%", "40%", "30%"]
                              }}
                              transition={{
                                duration: Math.max(1, 5 - (freq / 400)),
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.12
                              }}
                              className="w-full max-w-[12px] rounded-full"
                              style={{
                                background: `linear-gradient(0deg, ${color}20 0%, ${color}CC 100%)`,
                                boxShadow: `0 0 15px ${color}30`
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORTHOGRAPHY MAPPING TABLE */}
          {activeTab === 'mapping' && (
            <div className="lg:col-span-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{t.mappingTitle}</h3>
                  <p className="text-xs text-zinc-500">Click color to shift properties.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleResetMap}
                    className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t.btnReset}
                  </button>
                  <button
                    onClick={handleSaveMap}
                    className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/10"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {t.btnSave}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar border border-zinc-900 rounded-xl bg-zinc-950/80">
                <table className="w-full text-left text-sm text-zinc-400 border-collapse">
                  <thead className="bg-zinc-900 text-zinc-300 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-4 border-b border-zinc-850">{t.charHeader}</th>
                      <th className="p-4 border-b border-zinc-850">{t.colorHeader}</th>
                      <th className="p-4 border-b border-zinc-850">{t.frequencyHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(charMap).map(([char, data]) => (
                      <tr 
                        key={char} 
                        className={`border-b border-zinc-900/40 hover:bg-zinc-900/30 transition-colors ${
                          textInput.toUpperCase().includes(char) ? 'bg-purple-950/10 text-white font-medium' : ''
                        }`}
                      >
                        <td className="p-4 font-black text-lg">
                          {char}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={data.color}
                              onChange={(e) => updateCharProp(char, 'color', e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none"
                            />
                            <span className="font-mono text-xs text-zinc-500 uppercase">{data.color}</span>
                          </div>
                        </td>
                        <td className="p-4 w-1/2 min-w-[200px]">
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="110"
                              max="2000"
                              step="1"
                              value={data.freq}
                              onChange={(e) => handleTonalAdjustment(char, parseFloat(e.target.value))}
                              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                            />
                            <span className="font-mono text-xs text-zinc-500 min-w-[60px] text-right">
                              {Math.round(data.freq)} Hz
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACOUSTIC SYNTHESIZER & CHART */}
          {activeTab === 'synth' && (
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">{t.freqChart}</h3>
                    <p className="text-xs text-zinc-500">Realtime frequency nodes mapping active keys.</p>
                  </div>
                </div>

                <div className="h-72 w-full bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/60">
                  {spectralData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">
                      {t.emptyPalette}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={spectralData}>
                        <defs>
                          <linearGradient id="spectralGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8E24AA" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8E24AA" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="name" 
                          stroke="#52525b" 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#52525b" 
                          tickLine={false}
                          axisLine={false}
                          domain={[100, 2200]}
                          unit="Hz"
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                          itemStyle={{ color: '#a1a1aa' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="frequency" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#spectralGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ADDITIONAL SYNTH PARAMETERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-white mb-3">Ambient Resonator Frequency</h4>
                  <p className="text-xs text-zinc-500 mb-4">
                    Alters the core filter sweep mapped to the soundscape for deeper, wetter atmosphere.
                  </p>
                  <input
                    type="range"
                    min="100"
                    max="4000"
                    defaultValue="1200"
                    onChange={(e) => {
                      if (filterNodeRef.current && audioCtxRef.current) {
                        filterNodeRef.current.frequency.setTargetAtTime(parseFloat(e.target.value), audioCtxRef.current.currentTime, 0.2);
                      }
                    }}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>

                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-white mb-3">Generative Spatial Decay</h4>
                  <p className="text-xs text-zinc-500 mb-4">
                    Generates unique visual feedback trails dynamically linked to letters.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Smooth', 'Complex', 'Liquid', 'Ambient'].map((mode, i) => (
                      <span 
                        key={mode} 
                        className={`text-xs px-3 py-1 rounded-full border border-zinc-800 transition-all font-medium cursor-pointer ${
                          i === 0 ? 'bg-purple-950/40 border-purple-500/50 text-purple-300' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER METADATA */}
      <footer className="border-t border-zinc-900 mt-12 bg-zinc-950/30 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 ChromaPhon. Synthesized with Grapheme Neuro-Mapping Core.</p>
          <p className="flex items-center gap-2">
            <span>Precision microtonal filter</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/55 animate-pulse" />
            <span>Active and calibrated</span>
          </p>
        </div>
      </footer>

      {/* TOAST FEEDBACK NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-2xl"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: NEURO-DIVERSE INFORMATION */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAbout(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-[50%] -left-[20%] w-[100%] h-[100%] rounded-full opacity-10 blur-[80px] bg-purple-500 pointer-events-none" />
              <h3 className="text-lg font-bold text-white mb-2">{t.modalTitle}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">{t.modalBody}</p>
              <button
                onClick={() => setShowAbout(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Close / Sluiten
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
