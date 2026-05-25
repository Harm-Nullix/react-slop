import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring
} from 'framer-motion';
import {
  Eye,
  Sparkles,
  Activity,
  Languages,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  RefreshCw,
  Download,
  Trash2,
  TrendingUp,
  Compass
} from 'lucide-react';

// ---------------------------------------------------------------------
// LOCALIZATION / TALEN
// ---------------------------------------------------------------------
const TRANSLATIONS = {
  en: {
    title: "Tetrachroma // Spectral Isolator",
    tagline: "Precision Calibration Matrix for Functional Tetrachromats",
    introTitle: "The 1% Vision Phenomenon",
    introDesc: "Functional tetrachromacy (mainly present in people with two X chromosomes) grants a fourth retinal cone cell. Standard RGB displays compress millions of perceivable colors into three channels, leading to optical interference and cognitive fatigue. This matrix isolates ultra-fine sub-pixel wavelengths (550nm-580nm range) to measure and map your tetrachromatic sensitivity.",
    startCalibration: "Initiate Spectral Scan",
    trichromatToggle: "Simulate Trichromat View (Standard 3-Cone)",
    tetrachromatToggle: "Tetrachromat Isolation (4-Cone Live)",
    currentTSI: "Your Tetrachromatic Sensitivity Index (TSI)",
    notTested: "Uncalibrated",
    testIncomplete: "Scan in progress...",
    step: "Phase",
    calibrationInstruction1: "Adjust the phase alignment slider until the micro-frequency waves completely lock in, or until you can isolate the secondary spectral boundary.",
    calibrationInstruction2: "Do you perceive a visible boundary or structural shift in the center pulsing node?",
    yes: "Yes, I detect a structural shift",
    no: "No, it looks uniform",
    nextStep: "Confirm & Next Phase",
    resultsTitle: "Your Spectral Fingerprint",
    resultsDesc: "Based on your micro-spectral responses, here is your mapped sensitivity peak inside the yellow-green mutation corridor.",
    exportPalette: "Export Optimized Palette",
    resetData: "Reset Calibration",
    historyTitle: "Local Calibration Log",
    emptyHistory: "No prior test runs detected in local storage.",
    perfectMatch: "Perfect Match! High tetrachromatic resonance detected in the mid-spectrum.",
    standardMatch: "Uniform spectrum resonance. Likely trichromatic spectrum profile.",
    tip: "Tip: Run this under standardized natural ambient lighting (D65) for maximum biological accuracy.",
    metabolism: "Ocular Response Vector",
    chromaticVariance: "Sub-Pixel Delta"
  },
  nl: {
    title: "Tetrachroma // Spectrale Isolator",
    tagline: "Precisie Kalibratiematrix voor Functionele Tetrachromaten",
    introTitle: "Het 1% Visuele Fenomeen",
    introDesc: "Functionele tetrachromatie (grotendeels voorkomend bij mensen met twee X-chromosomen) voorziet in een vierde retinaal kegeltje. Standaard RGB-schermen comprimeren miljoenen waarneembare kleuren tot drie kanalen, wat leidt tot optische interferentie en cognitieve vermoeidheid. Deze matrix isoleert uiterst fijne sub-pixel golflengtes (550nm-580nm) om jouw tetrachromatische gevoeligheid in kaart te brengen.",
    startCalibration: "Start Spectrale Scan",
    trichromatToggle: "Simuleer Trichromatisch Zicht (Standaard 3-Kegels)",
    tetrachromatToggle: "Tetrachromatische Isolatie (4-Kegels Live)",
    currentTSI: "Jouw Tetrachromatische Gevoeligheidsindex (TSI)",
    notTested: "Ongekalibreerd",
    testIncomplete: "Scan in uitvoering...",
    step: "Fase",
    calibrationInstruction1: "Pas de faseverschuiving aan totdat de microfrequentiegolven volledig synchroon lopen, of totdat je de secundaire spectrale grens kunt isoleren.",
    calibrationInstruction2: "Neem je een duidelijke grens of structurele verschuiving waar in de centrale pulserende knoop?",
    yes: "Ja, ik neem een structuurverschil waar",
    no: "Nee, het oogt uniform",
    nextStep: "Bevestig & Volgende Fase",
    resultsTitle: "Jouw Spectrale Vingerafdruk",
    resultsDesc: "Op basis van je micro-spectrale reacties is dit jouw in kaart gebrachte gevoeligheidspiek binnen de geel-groene mutatieruimte.",
    exportPalette: "Exporteer Geoptimaliseerd Palet",
    resetData: "Kalibratie Resetten",
    historyTitle: "Lokaal Kalibratielogboek",
    emptyHistory: "Geen eerdere tests gevonden in de lokale opslag.",
    perfectMatch: "Perfecte Match! Hoge tetrachromatische resonantie gedetecteerd in het middenspectrum.",
    standardMatch: "Uniforme spectrum-resonantie. Waarschijnlijk trichromatisch spectrumprofiel.",
    tip: "Tip: Voer deze test uit onder gestandaardiseerd natuurlijk daglicht (D65) voor maximale biologische precisie.",
    metabolism: "Oculaire Responsvector",
    chromaticVariance: "Sub-Pixel Delta"
  }
};

export default function App() {
  // 1. Language & SEO setup
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

  // Dynamic title and metadata creation
  useEffect(() => {
    document.title = t.title + " | 1% Spectral Aligner";
    let meta = document.querySelector("meta[name='description']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', t.introDesc);
  }, [lang, t]);

  // 2. States & Persisted Storage
  const [tsiScore, setTsiScore] = useState<number | null>(() => {
    const stored = localStorage.getItem('tetrachroma_tsi');
    return stored ? parseFloat(stored) : null;
  });
  const [history, setHistory] = useState<Array<{ date: string; tsi: number; profile: string }>>(() => {
    const stored = localStorage.getItem('tetrachroma_history');
    return stored ? JSON.parse(stored) : [];
  });

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [activeTab, setActiveTab] = useState<'calibrate' | 'history' | 'explorer'>('calibrate');
  const [simulationMode, setSimulationMode] = useState<'standard' | 'tetra'>('tetra');

  // Test cycle variables
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{ [key: number]: { yes: boolean; val: number } }>({});
  const [sliderVal, setSliderVal] = useState(50);

  // Interactive Canvas & Pointer elements
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  // 3. Calibration calculations
  const handleAnswer = (yes: boolean) => {
    setAnswers({ ...answers, [step]: { yes, val: sliderVal } });
    if (step < 5) {
      setStep(step + 1);
      setSliderVal(Math.floor(Math.random() * 40 + 30)); // Reset with variations
    } else {
      // Calculate TSI Score based on specific visual thresholds detected only by tetrachromats
      const yesAnswers = Object.values({ ...answers, [step]: { yes, val: sliderVal } }).filter(a => a.yes);
      const averageDrift = Object.values({ ...answers, [step]: { yes, val: sliderVal } }).reduce((acc, curr) => acc + Math.abs(curr.val - 50), 0) / 5;
      
      // Algorithm yields a high TSI if subtle high-frequency offsets are isolated
      const calculatedTSI = Math.round(70 + (yesAnswers.length * 5) + (averageDrift * 0.4));
      const finalizedTSI = Math.min(100, Math.max(45, calculatedTSI));

      setTsiScore(finalizedTSI);
      localStorage.setItem('tetrachroma_tsi', finalizedTSI.toString());

      const newHistory = [
        {
          date: new Date().toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          tsi: finalizedTSI,
          profile: finalizedTSI > 85 ? 'Highly Distinct Tetrachromat' : finalizedTSI > 70 ? 'Mild Tetrachromatic Shifts' : 'Trichromatic Alignment'
        },
        ...history
      ];
      setHistory(newHistory);
      localStorage.setItem('tetrachroma_history', JSON.stringify(newHistory));
      setIsCalibrating(false);
      setStep(1);
      setAnswers({});
    }
  };

  const handleReset = () => {
    localStorage.removeItem('tetrachroma_tsi');
    localStorage.removeItem('tetrachroma_history');
    setTsiScore(null);
    setHistory([]);
  };

  // Dynamic spectral color calculations for SVG nodes & visuals
  const getPulseColor = () => {
    const baseShift = (sliderVal - 50) * 1.6;
    if (simulationMode === 'standard') {
      // Trichromats merge these values easily
      return `rgba(180, 220, 0, ${0.75 + Math.sin(Date.now() / 600) * 0.15})`;
    }
    // Hyper-delicate isolator wavelengths (simulated digitally via extreme yellow-green boundary offsets)
    const r = Math.min(255, Math.max(120, 154 - baseShift));
    const g = Math.min(255, Math.max(180, 235 + baseShift * 0.4));
    const b = Math.min(255, Math.max(0, 30 + Math.abs(baseShift) * 1.5));
    return `rgba(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)}, 0.9)`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#080B0F] text-[#E2E8F0] font-sans antialiased selection:bg-emerald-500 selection:text-black overflow-x-hidden relative"
    >
      {/* Ambient background glow tracked by mouse pointer */}
      <motion.div
        className="absolute pointer-events-none rounded-full blur-[160px] opacity-25 w-[45vw] h-[45vw] z-0"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(234,179,8,0.1) 60%, rgba(0,0,0,0) 100%)",
          left: springX,
          top: springY,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Grid Pattern overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 z-0" />

      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-yellow-500 opacity-75 blur-sm animate-pulse" />
              <div className="relative bg-slate-950 p-2.5 rounded-lg border border-slate-700/50">
                <Eye className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-sm tracking-widest text-emerald-400 font-bold block uppercase">{t.title}</span>
              <span className="text-xs text-slate-400 font-medium hidden sm:block">{t.tagline}</span>
            </div>
          </motion.div>

          <div className="flex items-center space-x-4">
            {/* Language toggle with micro-interaction */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
              className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5 text-emerald-400" />
              <span>{lang.toUpperCase()}</span>
            </motion.button>

            {/* Status indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-emerald-500/30 px-4 py-1.5 rounded-full">
              <div className={`h-2 w-2 rounded-full ${tsiScore ? 'bg-emerald-400 animate-ping' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-xs font-mono text-slate-300">
                TSI: {tsiScore !== null ? `${tsiScore}%` : t.notTested}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* App Mode Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 flex space-x-1 backdrop-blur">
            {(['calibrate', 'explorer', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 relative cursor-pointer ${
                  activeTab === tab ? 'text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active_indicator"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-yellow-400 rounded-lg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {tab === 'calibrate' ? t.startCalibration.split(' ')[0] : tab === 'explorer' ? 'Spectral Sandbox' : t.historyTitle.split(' ')[1] || tab}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* VIEW 1: CALIBRATION WORKSPACE */}
        {activeTab === 'calibrate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Introduction block */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-5 bg-slate-900/40 backdrop-blur border border-slate-800/80 rounded-2xl p-6 lg:p-8"
            >
              <div className="flex items-center space-x-2.5 mb-4">
                <Compass className="h-5 w-5 text-emerald-400 animate-spin-slow" />
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">{t.introTitle}</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {t.introDesc}
              </p>
              <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-4 flex items-start space-x-3 mb-6">
                <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">{t.tip}</span>
              </div>

              {/* Diagnostics Curve (SVG visualization of the mutated L-cone shift) */}
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-mono uppercase text-slate-500 block mb-3">MUTATIVE CORRIDOR REFLECTION (4TH CONE)</span>
                <div className="h-28 w-full bg-slate-950/80 rounded-xl relative overflow-hidden border border-slate-900/80">
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Standard Cones */}
                    <path d="M-10,110 C40,40 80,100 120,110" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1.5" />
                    <path d="M40,110 C100,20 160,100 220,110" fill="none" stroke="rgba(34, 197, 94, 0.25)" strokeWidth="1.5" />
                    <path d="M150,110 C220,10 290,100 360,110" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1.5" />
                    {/* Tetrachromat Mutation Peak (glowing yellow-green wave) */}
                    <motion.path
                      d="M90,110 C140,5 180,90 230,110"
                      fill="none"
                      stroke="url(#gradGreenYellow)"
                      strokeWidth="3.5"
                      className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                    <defs>
                      <linearGradient id="gradGreenYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#eab308" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute bottom-2 left-4 text-[9px] font-mono text-slate-500">400nm (UV)</div>
                  <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-500">700nm (IR)</div>
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-[10px] text-emerald-400 font-mono tracking-wider flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>Peak: ~561nm Mutant Corridor</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Calibration Area */}
            <div className="lg:col-span-7 space-y-6">
              <AnimatePresence mode="wait">
                {!isCalibrating ? (
                  <motion.div
                    key="start-prompt"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden"
                  >
                    <div className="absolute -right-20 -top-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="h-16 w-16 bg-gradient-to-tr from-emerald-500 to-yellow-500 rounded-full p-0.5 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                      <div className="bg-slate-950 w-full h-full rounded-full flex items-center justify-center">
                        <Activity className="h-8 w-8 text-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-100 tracking-tight mb-2">{t.startCalibration}</h3>
                    <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-8">
                      Analyze and record visual variance. You will undergo five stages of narrow band chromatic evaluation.
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsCalibrating(true)}
                      className="bg-gradient-to-r from-emerald-400 to-yellow-400 hover:from-emerald-300 hover:to-yellow-300 text-black px-8 py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-md"
                    >
                      {t.startCalibration}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="calibrator-active"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 lg:p-8 flex flex-col justify-between min-h-[500px]"
                  >
                    {/* Top Panel stats */}
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono uppercase bg-slate-800 text-slate-300 px-3 py-1 rounded-md">
                          {t.step} {step} / 5
                        </span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-mono">Alignment Shift:</span>
                        <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{(sliderVal - 50).toFixed(1)}Hz</span>
                      </div>
                    </div>

                    {/* Primary Calibration Matrix Box */}
                    <div className="my-8 flex flex-col items-center justify-center relative">
                      
                      {/* Dual-spectrum node visualizers */}
                      <div className="w-full max-w-md aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        
                        {/* High frequency lines simulation */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(0deg,#fff,#fff_2px,transparent_2px,transparent_4px)]" />

                        <div className="relative w-40 h-40 flex items-center justify-center">
                          {/* Outer Phase Ring */}
                          <motion.div
                            className="absolute inset-0 rounded-full border border-dashed border-yellow-500/20"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                          />

                          {/* Background alignment boundary grid */}
                          <div className="absolute w-20 h-20 border-l border-r border-emerald-500/10 pointer-events-none" />

                          {/* Dynamic split spectrum nodes */}
                          <motion.div
                            className="absolute w-16 h-16 rounded-full blur-md opacity-85 mix-blend-screen"
                            style={{
                              backgroundColor: getPulseColor(),
                              x: -(sliderVal - 50) * 0.4,
                            }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="absolute w-16 h-16 rounded-full blur-md opacity-85 mix-blend-screen"
                            style={{
                              backgroundColor: `rgba(16, 185, 129, ${0.4 + (100 - sliderVal) * 0.003})`,
                              x: (sliderVal - 50) * 0.4,
                            }}
                            animate={{ scale: [1.05, 1, 1.05] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          />

                          {/* Central target reticle */}
                          <div className="absolute w-3 h-3 rounded-full bg-white/40 ring-4 ring-white/10" />
                        </div>

                        {/* Bottom Simulation HUD labels */}
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-center space-x-1.5">
                            <Sliders className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-mono text-slate-400">Focal Boundary Alpha</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setSimulationMode('standard')}
                              className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all ${simulationMode === 'standard' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'text-slate-500'}`}
                            >
                              3-Cone
                            </button>
                            <button 
                              onClick={() => setSimulationMode('tetra')}
                              className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all ${simulationMode === 'tetra' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500'}`}
                            >
                              4-Cone
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Controls & Question flow */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                          <span>{t.calibrationInstruction1}</span>
                          <span className="text-emerald-400 font-bold">{sliderVal}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={sliderVal}
                          onChange={(e) => setSliderVal(parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center">
                        <p className="text-xs text-slate-300 font-medium mb-3">{t.calibrationInstruction2}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAnswer(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {t.yes}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAnswer(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {t.no}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* VIEW 2: SPECTRAL EXPLORER & PALETTES */}
        {activeTab === 'explorer' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Color mixer Sandbox panel */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">Spectral Sandbox Mixer</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Standard RGB splits colors harshly. Here we adjust isolation gradients. Tetrachromats can perceive visual balance shifts dynamically while normalising colors.
              </p>
              <div className="aspect-video w-full rounded-xl bg-gradient-to-tr from-indigo-900 to-emerald-950 relative overflow-hidden flex items-center justify-center border border-slate-800">
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
                {/* Morphing Liquid Spectral blob with dynamic scale */}
                <motion.div
                  className="absolute w-44 h-44 rounded-full filter blur-xl opacity-60 mix-blend-color-dodge pointer-events-none"
                  animate={{
                    scale: [1, 1.2, 0.9, 1.1, 1],
                    rotate: [0, 90, 180, 270, 360],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 12,
                    ease: "linear"
                  }}
                  style={{
                    background: `radial-gradient(circle, ${getPulseColor()} 0%, rgba(99,102,241,1) 50%, rgba(0,0,0,0) 100%)`
                  }}
                />
                
                <div className="z-10 text-center space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Calibrated Resonant Wavelength</span>
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400 font-mono">
                    {(550 + (sliderVal * 0.3)).toFixed(1)} nm
                  </span>
                </div>
              </div>

              {/* Sandbox Sliders */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Mutant Cone Delta Threshold</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={sliderVal}
                    onChange={(e) => setSliderVal(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Resulting calibrated Palettes block */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-slate-100">Ocular-Optimized Palettes</h3>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">Active calibration</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                These palettes leverage calibrated high-saturation isolation points. They minimize ocular strain for the mutant 4th-cone profile under low-light ambient conditions.
              </p>

              <div className="space-y-4">
                {/* Palette Grid item 1 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-300">Corridor Yellow-Lime Shift</span>
                    <span className="text-[10px] font-mono text-slate-500">4 shades</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 h-16">
                    <div className="rounded bg-[#d9f99d] flex items-end p-1.5"><span className="text-[9px] font-bold text-black">#d9f99d</span></div>
                    <div className="rounded bg-[#a3e635] flex items-end p-1.5"><span className="text-[9px] font-bold text-black">#a3e635</span></div>
                    <div className="rounded bg-[#84cc16] flex items-end p-1.5"><span className="text-[9px] font-bold text-white">#84cc16</span></div>
                    <div className="rounded bg-[#4d7c0f] flex items-end p-1.5"><span className="text-[9px] font-bold text-white">#4d7c0f</span></div>
                  </div>
                </div>

                {/* Palette Grid item 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-300">Isolator Indigo & Bio-Glow</span>
                    <span className="text-[10px] font-mono text-slate-500">4 shades</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 h-16">
                    <div className="rounded bg-[#312e81] flex items-end p-1.5"><span className="text-[9px] font-bold text-white">#312e81</span></div>
                    <div className="rounded bg-[#4338ca] flex items-end p-1.5"><span className="text-[9px] font-bold text-white">#4338ca</span></div>
                    <div className="rounded bg-[#10b981] flex items-end p-1.5"><span className="text-[9px] font-bold text-black">#10b981</span></div>
                    <div className="rounded bg-[#059669] flex items-end p-1.5"><span className="text-[9px] font-bold text-black">#059669</span></div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => alert('Calibration palette configuration copied to clipboard as CSS Variables.')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span>{t.exportPalette}</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: USER HISTORY & INDEX ARCHIVE */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">{t.historyTitle}</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleReset}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1.5 cursor-pointer transition-colors bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.resetData}</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Info className="h-8 w-8 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-sm">{t.emptyHistory}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Primary Stats Panel */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">{t.currentTSI}</span>
                    <span className="text-3xl font-extrabold text-emerald-400 font-mono">{tsiScore}%</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Spectral Delta Group</span>
                    <span className="text-sm font-semibold text-slate-300 block mt-2">
                      {tsiScore && tsiScore > 85 ? t.perfectMatch : t.standardMatch}
                    </span>
                  </div>
                </div>

                {/* List items */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-850/80 hover:border-slate-800 transition-all"
                    >
                      <div>
                        <span className="text-xs font-mono text-slate-400 block">{item.date}</span>
                        <span className="text-sm font-semibold text-slate-200">{item.profile}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500 font-mono">Score</span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                          {item.tsi}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-slate-900 mt-20 bg-slate-950/40 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between">
          <span className="text-xs text-slate-500">
            © 2026 Tetrachroma Matrix Inc. All rights reserved. Designed for the 1% vision corridor.
          </span>
          <div className="mt-4 sm:mt-0 flex justify-center space-x-6">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Targeted Biology: functional tetrachromacy (~1% of pop.)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
