import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Sparkles,
  Sliders,
  Languages,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Volume2,
  Type,
  Heart,
  HelpCircle,
  Keyboard,
  SlidersHorizontal,
  Eye,
  Moon,
  Check
} from 'lucide-react';

// --- MULTILINGUAL TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    title: "Synestro // Grapheme-Color Aligner",
    tagline: "Calibrate your neurological color-grapheme map to bypass cognitive dissonance during deep focus.",
    subtitle: "A bespoke workspace for the 1% who see language in color.",
    mapTab: "Palette Calibration",
    readTab: "Harmonic Workspace",
    statsTab: "Spectral Analysis",
    helpTab: "Neurological Context",
    resetBtn: "Restore Default Spectrum",
    copyBtn: "Copy Formatted HTML",
    exportBtn: "Export Config",
    importBtn: "Import Config",
    placeholderText: "Type or paste your text here to experience cognitive visual harmony. Every character glows with your neurological truth...",
    helpTitle: "About Synesthesia & Synestro",
    helpParagraph1: "Grapheme-color synesthesia is a neurological phenomenon where letters and numbers trigger involuntary, highly consistent color sensations. Standard monochrome text can cause a subtle, persistent cognitive fatigue for synesthetes when standard text clashes with their internal color maps.",
    helpParagraph2: "Synestro solves this cognitive friction. By customizing your precise mapping, you can parse texts, visualize letters harmoniously, and generate calibrated reading environments that match your neurological blue-print.",
    statsTitle: "Spectral Density Distribution",
    statsSubtitle: "The active balance of visual weight across your calibrated character palette.",
    savedMsg: "Spectrum configuration saved!",
    loadedMsg: "Configuration loaded successfully!",
    copiedMsg: "Formatted HTML copied to clipboard!",
    resetMsg: "Palette reset to standard spectrum.",
    activeChar: "Calibrating Character",
    hue: "Hue",
    saturation: "Saturation",
    lightness: "Lightness",
    presets: "Try Palettes",
    neonPreset: "Neo-Chroma",
    pastelPreset: "Soft Velvet",
    darkPreset: "Obsidian Depths",
    visualPurity: "Reading Contrast Mode"
  },
  nl: {
    title: "Synestro // Grafeem-Kleur Afstemmer",
    tagline: "Kalibreer je neurologische kleur-grafeem map om cognitieve dissonantie te verminderen tijdens diepe focus.",
    subtitle: "Een op maat gemaakte werkruimte voor de 1% die taal in kleur ziet.",
    mapTab: "Palet Kalibratie",
    readTab: "Harmonische Werkruimte",
    statsTab: "Spectrale Analyse",
    helpTab: "Neurologische Context",
    resetBtn: "Herstel Standaard Spectrum",
    copyBtn: "Kopieer Geformatteerde HTML",
    exportBtn: "Exporteer Config",
    importBtn: "Importeer Config",
    placeholderText: "Typ of plak je tekst hier om cognitieve visuele harmonie te ervaren. Elk karakter straalt met jouw neurologische waarheid...",
    helpTitle: "Over Synesthesie & Synestro",
    helpParagraph1: "Grafeem-kleur synesthesie is een neurologisch fenomeen waarbij letters en cijfers onvrijwillige, zeer consistente kleurwaarnemingen oproepen. Standaard zwart-wit tekst kan subtiele, aanhoudende cognitieve vermoeidheid veroorzaken wanneer de tekst botst met de interne kleurkaarten.",
    helpParagraph2: "Synestro lost deze cognitieve wrijving op. Door jouw exacte map te kalibreren kun je teksten verwerken, letters harmonieus visualiseren en leesomgevingen genereren die aansluiten bij jouw neurologische blauwdruk.",
    statsTitle: "Spectrale Dichtheidsverdeling",
    statsSubtitle: "De actieve balans van visueel gewicht over je gekalibreerde karakterpalet.",
    savedMsg: "Spectrum configuratie opgeslagen!",
    loadedMsg: "Configuratie succesvol geladen!",
    copiedMsg: "Geformatteerde HTML gekopieerd!",
    resetMsg: "Palet gereset naar standaard spectrum.",
    activeChar: "Karakter Kalibreren",
    hue: "Tint (Hue)",
    saturation: "Verzadiging",
    lightness: "Helderheid",
    presets: "Probeer Paletten",
    neonPreset: "Neo-Chroma",
    pastelPreset: "Zacht Fluweel",
    darkPreset: "Obsidiaan Dieptes",
    visualPurity: "Leescontrast Modus"
  }
};

// --- DEFAULT PALETTE GENERATORS ---
const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

const getChromaSpectrum = () => {
  const spectrum: Record<string, { h: number; s: number; l: number }> = {};
  DEFAULT_ALPHABET.forEach((char, idx) => {
    // Create a rich distributed spectrum of colors initially
    const h = Math.round((idx / DEFAULT_ALPHABET.length) * 360);
    spectrum[char] = { h, s: 85, l: 65 };
  });
  return spectrum;
};

const PASTEL_SPECTRUM = () => {
  const spectrum: Record<string, { h: number; s: number; l: number }> = {};
  DEFAULT_ALPHABET.forEach((char, idx) => {
    const h = Math.round((idx / DEFAULT_ALPHABET.length) * 360);
    spectrum[char] = { h, s: 60, l: 80 };
  });
  return spectrum;
};

const DARK_SPECTRUM = () => {
  const spectrum: Record<string, { h: number; s: number; l: number }> = {};
  DEFAULT_ALPHABET.forEach((char, idx) => {
    const h = Math.round((idx / DEFAULT_ALPHABET.length) * 360);
    spectrum[char] = { h, s: 90, l: 45 };
  });
  return spectrum;
};

export default function App() {
  // Language detector
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  useEffect(() => {
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === 'nl') setLang('nl');
  }, []);

  const t = TRANSLATIONS[lang];

  // State
  const [palette, setPalette] = useState<Record<string, { h: number; s: number; l: number }>>(() => {
    const saved = localStorage.getItem('synestro-palette');
    return saved ? JSON.parse(saved) : getChromaSpectrum();
  });
  
  const [inputText, setInputText] = useState<string>(() => {
    return localStorage.getItem('synestro-text') || "SYNTHESIS OF VISUAL COGNITION 2026";
  });

  const [activeTab, setActiveTab] = useState<'calibrate' | 'workspace' | 'stats' | 'info'>('workspace');
  const [selectedChar, setSelectedChar] = useState<string>('A');
  const [contrastMode, setContrastMode] = useState<'full' | 'glow' | 'minimal'>('full');
  const [notification, setNotification] = useState<string | null>(null);
  const [focusedCharIndex, setFocusedCharIndex] = useState<number | null>(null);

  // Dynamic Browser Title
  useEffect(() => {
    document.title = `${t.title} | ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
  }, [activeTab, lang]);

  // Auto Save to localStorage
  useEffect(() => {
    localStorage.setItem('synestro-palette', JSON.stringify(palette));
  }, [palette]);

  useEffect(() => {
    localStorage.setItem('synestro-text', inputText);
  }, [inputText]);

  // Helpers
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateColor = (property: 'h' | 's' | 'l', value: number) => {
    setPalette(prev => ({
      ...prev,
      [selectedChar]: {
        ...prev[selectedChar],
        [property]: value
      }
    }));
  };

  const getHSLStr = (char: string, customL?: number) => {
    const upper = char.toUpperCase();
    const color = palette[upper];
    if (!color) return 'inherit';
    return `hsl(${color.h}, ${color.s}%, ${customL !== undefined ? customL : color.l}%)`;
  };

  const resetPalette = () => {
    setPalette(getChromaSpectrum());
    triggerNotification(t.resetMsg);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(palette, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "synestro-spectrum.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (typeof parsed === 'object') {
            setPalette(parsed);
            triggerNotification(t.loadedMsg);
          }
        } catch (err) {
          triggerNotification("Error importing spectrum file!");
        }
      };
    }
  };

  const copyFormattedHTML = () => {
    const container = document.createElement('div');
    inputText.split("").forEach(char => {
      const span = document.createElement('span');
      span.innerText = char;
      if (palette[char.toUpperCase()]) {
        span.style.color = getHSLStr(char.toUpperCase());
        span.style.fontWeight = 'bold';
      }
      container.appendChild(span);
    });
    navigator.clipboard.writeText(container.innerHTML);
    triggerNotification(t.copiedMsg);
  };

  // Dynamic Interactive Interactive Mouse Gradient Background
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const springX = useSpring(bgX, { stiffness: 100, damping: 30 });
  const springY = useSpring(bgY, { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    bgX.set(e.clientX - rect.left);
    bgY.set(e.clientY - rect.top);
  };

  // Advanced statistical weight analysis for standard user visualization
  const spectralData = useMemo(() => {
    const distribution: Record<string, number> = {};
    DEFAULT_ALPHABET.forEach(c => distribution[c] = 0);
    let counted = 0;
    inputText.toUpperCase().split("").forEach(char => {
      if (distribution[char] !== undefined) {
        distribution[char]++;
        counted++;
      }
    });
    return Object.entries(distribution).map(([char, count]) => ({
      char,
      percentage: counted > 0 ? Math.round((count / counted) * 100) : 0,
      color: getHSLStr(char)
    }));
  }, [inputText, palette]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen relative overflow-x-hidden bg-[#0a0c16] text-slate-100 font-sans selection:bg-violet-500/30 selection:text-white transition-colors duration-500 pb-12"
    >
      {/* Interactive Micro Gradient Grid Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-15 bg-gradient-to-r from-violet-600 to-fuchsia-500"
          style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Sticky Header with Controls */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0c16]/75 border-b border-white/5 px-4 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand area with micro interaction */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-teal-500 via-indigo-500 to-pink-500 opacity-70 blur group-hover:opacity-100 transition duration-300" />
              <div className="relative bg-slate-950 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                <span className="font-mono font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-pink-300">SYNESTRO</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">Cognitive Phase Aligner</p>
            </div>
          </motion.div>

          {/* Custom Tabs with spring transitions */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/5">
            {([
              { id: 'workspace', icon: Type, label: t.readTab },
              { id: 'calibrate', icon: Sliders, label: t.mapTab },
              { id: 'stats', icon: Keyboard, label: t.statsTab },
              { id: 'info', icon: HelpCircle, label: t.helpTab }
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer"
                  style={{ color: isSelected ? '#fff' : '#94a3b8' }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-header-tab"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/40 rounded-lg"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Global Utility Controls */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setLang(prev => prev === 'en' ? 'nl' : 'en')}
              className="p-2 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 flex items-center gap-1.5 text-xs font-mono"
            >
              <Languages className="w-4 h-4 text-violet-400" />
              <span>{lang.toUpperCase()}</span>
            </motion.button>

            {/* Presets dropdown style quick setup */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/60 border border-white/5 rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">{t.presets}:</span>
              <button 
                onClick={() => { setPalette(getChromaSpectrum()); triggerNotification("Neo-Chroma Loaded"); }}
                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/5 font-semibold text-teal-300" 
              >
                {t.neonPreset}
              </button>
              <button 
                onClick={() => { setPalette(PASTEL_SPECTRUM()); triggerNotification("Soft Velvet Loaded"); }}
                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/5 font-semibold text-violet-300" 
              >
                {t.pastelPreset}
              </button>
              <button 
                onClick={() => { setPalette(DARK_SPECTRUM()); triggerNotification("Obsidian Loaded"); }}
                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/5 font-semibold text-rose-300" 
              >
                {t.darkPreset}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Notification Toast Component */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-12 pt-8 relative z-10">
        
        {/* Intro Hero Section */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400"
          >
            {t.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-slate-400 mt-1 max-w-3xl"
          >
            {t.tagline} <span className="text-indigo-400 font-semibold">{t.subtitle}</span>
          </motion.p>
        </div>

        {/* Active Tab Interfaces */}
        <AnimatePresence mode="wait">
          
          {/* 1. WORKSPACE TAB */}
          {activeTab === 'workspace' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Input Area (Left / Column 7) */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col h-[400px]">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Source Input</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setInputText("")}
                        className="text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t.placeholderText}
                    className="w-full flex-1 bg-slate-950/50 rounded-xl p-4 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-white/5 resize-none shadow-inner leading-relaxed"
                  />
                </div>

                {/* Output Modifiers */}
                <div className="bg-slate-900/30 rounded-xl p-3 border border-white/5 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">{t.visualPurity}:</span>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                      {(['full', 'glow', 'minimal'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setContrastMode(mode)}
                          className={`text-[10px] px-2.5 py-1 rounded transition-all capitalize font-mono ${contrastMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyFormattedHTML}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-white rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer border border-white/10"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy HTML</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Synesthetic Output Renderer (Right / Column 6) */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-6 flex flex-col flex-1 min-h-[400px] justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
                  
                  <div>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                        Harmonized Grapheme Stream
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{inputText.length} characters</span>
                    </div>

                    {/* Text block where each character is individual mapped and animated */}
                    <div className="font-sans text-lg tracking-wide leading-relaxed whitespace-pre-wrap select-text selection:bg-slate-800 break-words">
                      {inputText.length === 0 ? (
                        <span className="text-slate-600 italic text-sm">No active input spectrum stream...</span>
                      ) : (
                        inputText.split("").map((char, index) => {
                          const charUpper = char.toUpperCase();
                          const hasColor = palette[charUpper];
                          const style = hasColor
                            ? {
                                color: getHSLStr(charUpper, contrastMode === 'minimal' ? 85 : undefined),
                                textShadow: contrastMode === 'glow' ? `0 0 12px ${getHSLStr(charUpper, 60)}` : 'none',
                                transition: 'color 0.2s ease, text-shadow 0.2s ease',
                                fontWeight: '700'
                              }
                            : {};

                          return (
                            <motion.span
                              key={index}
                              style={style}
                              onMouseEnter={() => setFocusedCharIndex(index)}
                              onMouseLeave={() => setFocusedCharIndex(null)}
                              className="inline-block transition-transform duration-150 transform hover:scale-135 hover:mx-0.5 cursor-crosshair"
                              animate={focusedCharIndex === index ? { y: -3 } : { y: 0 }}
                            >
                              {char}
                            </motion.span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Dynamic character feedback footer based on hover */}
                  <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    {focusedCharIndex !== null && inputText[focusedCharIndex] && palette[inputText[focusedCharIndex].toUpperCase()] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Focal Node:</span>
                        <span className="font-bold text-white px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                          {inputText[focusedCharIndex]}
                        </span>
                        <span className="text-slate-500">
                          HSL({palette[inputText[focusedCharIndex].toUpperCase()].h}, {palette[inputText[focusedCharIndex].toUpperCase()].s}%, {palette[inputText[focusedCharIndex].toUpperCase()].l}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Hover characters to inspect micro spectral frequency.</span>
                    )}
                    <span className="text-indigo-400/80 animate-pulse">Synesthetic Sync v1.4</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. CALIBRATE TAB */}
          {activeTab === 'calibrate' && (
            <motion.div
              key="calibrate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Character grid selection (Column 7) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Select Character Node</span>
                    <button
                      onClick={resetPalette}
                      className="text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {t.resetBtn}
                    </button>
                  </div>

                  {/* Alphabet & Numbers Grid */}
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                    {DEFAULT_ALPHABET.map((char) => {
                      const isSelected = selectedChar === char;
                      const colorStr = getHSLStr(char);
                      return (
                        <motion.button
                          key={char}
                          onClick={() => setSelectedChar(char)}
                          className={`relative h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-sm transition-all duration-300 select-none cursor-pointer overflow-hidden ${
                            isSelected ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-105' : 'bg-slate-950/40 hover:bg-slate-900/40 border-white/5'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span style={{ color: colorStr }}>{char}</span>
                          
                          {/* Underline or indicator of color value representation */}
                          <div 
                            className="absolute bottom-1 w-5 h-1 rounded-full transition-all"
                            style={{ backgroundColor: colorStr }}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Backup & Synchronizing section */}
                <div className="bg-slate-900/30 rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="text-xs text-slate-400 font-sans">
                    Keep your calibrated mappings safely backed up.
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleExport}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/10"
                    >
                      <Download className="w-3 h-3" />
                      {t.exportBtn}
                    </button>
                    <label className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/10 text-center">
                      <Upload className="w-3 h-3" />
                      <span>{t.importBtn}</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Controls and Sliders panel (Column 5) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-6 flex flex-col flex-1 shadow-2xl justify-between relative overflow-hidden">
                  <div>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                        {t.activeChar}: {selectedChar}
                      </span>
                      <div 
                        className="w-8 h-8 rounded-full border border-white/10 shadow-lg flex items-center justify-center font-bold text-sm"
                        style={{ backgroundColor: getHSLStr(selectedChar), color: palette[selectedChar]?.l > 60 ? '#000' : '#fff' }}
                      >
                        {selectedChar}
                      </div>
                    </div>

                    {/* Color display panel with rich gradients and micro adjustments */}
                    <div className="mb-6 p-6 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col items-center justify-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-extrabold shadow-inner relative overflow-hidden"
                        style={{ 
                          backgroundColor: getHSLStr(selectedChar), 
                          color: palette[selectedChar]?.l > 60 ? '#111827' : '#f9fafb',
                          boxShadow: `0 10px 30px -10px ${getHSLStr(selectedChar, 50)}`
                        }}
                      >
                        {selectedChar}
                      </motion.div>
                    </div>

                    {/* Sliders loop */}
                    <div className="space-y-6">
                      {/* HUE SLIDER */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">{t.hue}</span>
                          <span className="text-indigo-300 font-semibold">{palette[selectedChar]?.h}°</span>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={palette[selectedChar]?.h || 0}
                            onChange={(e) => updateColor('h', parseInt(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500"
                          />
                        </div>
                      </div>

                      {/* SATURATION SLIDER */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">{t.saturation}</span>
                          <span className="text-indigo-300 font-semibold">{palette[selectedChar]?.s}%</span>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={palette[selectedChar]?.s || 0}
                            onChange={(e) => updateColor('s', parseInt(e.target.value))}
                            style={{ 
                              background: `linear-gradient(to right, hsl(${palette[selectedChar]?.h}, 0%, ${palette[selectedChar]?.l}%), hsl(${palette[selectedChar]?.h}, 100%, ${palette[selectedChar]?.l}%))` 
                            }}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* LIGHTNESS SLIDER */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">{t.lightness}</span>
                          <span className="text-indigo-300 font-semibold">{palette[selectedChar]?.l}%</span>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            min="15"
                            max="85"
                            value={palette[selectedChar]?.l || 0}
                            onChange={(e) => updateColor('l', parseInt(e.target.value))}
                            style={{ 
                              background: `linear-gradient(to right, hsl(${palette[selectedChar]?.h}, ${palette[selectedChar]?.s}%, 15%), hsl(${palette[selectedChar]?.h}, ${palette[selectedChar]?.s}%, 85%))` 
                            }}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Direct keyboard access note */}
                  <div className="mt-8 text-[10px] font-mono text-slate-500 text-center">
                    Tip: Select character nodes quickly to build perfect physical gradients.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. SPECTRUM STATS TAB */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-2xl"
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                  {t.statsTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t.statsSubtitle}</p>
              </div>

              {/* Character metrics visualizer grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {spectralData.filter(d => d.percentage > 0).map((data) => (
                  <div 
                    key={data.char} 
                    className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between items-center relative overflow-hidden group hover:border-white/10 transition-colors"
                  >
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="text-3xl font-extrabold font-mono mt-2" style={{ color: data.color }}>
                      {data.char}
                    </span>
                    <div className="mt-4 flex flex-col items-center">
                      <span className="text-xs font-semibold text-slate-300">{data.percentage}%</span>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">Frequency</span>
                    </div>
                  </div>
                ))}
                {spectralData.filter(d => d.percentage > 0).length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 text-sm font-mono">
                    Type some characters in the workspace to calculate real-time spectral analytics.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. INFORMATION TAB */}
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-8 max-w-3xl mx-auto shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-r from-teal-500/10 to-violet-500/10 rounded-full filter blur-2xl pointer-events-none" />
              
              <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                {t.helpTitle}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {t.helpParagraph1}
              </p>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {t.helpParagraph2}
              </p>
              
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                <h4 className="text-xs font-mono font-bold uppercase text-indigo-300 mb-2">Synesthesia quick statistics:</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                  <li>Estimated to affect 1% to 2% of the global population.</li>
                  <li>Highly consistent over decades; individuals mapped to the same spectrum in tests spaced years apart.</li>
                  <li>Genetically linked, often passing down through generations of creative professionals.</li>
                  <li>Can significantly assist sensory categorization, deep learning, and photographic memory retention.</li>
                </ul>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}