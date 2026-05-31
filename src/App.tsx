import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useAnimation,
  LayoutGroup
} from 'framer-motion';
import {
  Eye,
  Moon,
  Sun,
  Activity,
  Info,
  RotateCcw,
  Camera,
  Compass,
  Check,
  X,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Translations dict
const TRANSLATIONS = {
  en: {
    title: "NoxEquilibrium",
    subtitle: "Tactical Rhodopsin Dark-Adaptation & Exposure Matrix",
    tagline: "Built for the 1% of extreme deep-sky observers and astrophotographers.",
    explanationTitle: "The Science of NoxEquilibrium",
    explanationBody: "Human rod cells (responsible for night vision) require up to 45 minutes of absolute darkness to fully synthesize rhodopsin. A single glance at a white or blue light source instantly bleaches this chemical, resetting hours of physiological adjustment. NoxEquilibrium operates purely in the 650nm+ deep-red spectrum, maintaining absolute retinal sensitivity while providing high-precision planning tools.",
    bortleTitle: "Ambient Bortle Scale",
    bortleDesc: "Micro-level calibration based on sky brightness.",
    startAdaptation: "Initiate Rhodopsin Calibration",
    resetBleach: "Simulate Light Bleach (Reset)",
    currentRhodopsin: "Rhodopsin Synthesis State",
    timeToMax: "Est. Full Adaptation Remaining",
    minutesShort: "min",
    secondsShort: "sec",
    fullyAdapted: "Fully Dark-Adapted",
    exposureCalcTitle: "Nox Exposure Matrix",
    focalLength: "Focal Length",
    aperture: "Aperture",
    sensorType: "Sensor Type",
    calcResult: "Nox-Limit (No Star Trails)",
    bortleLevel: "Bortle Level",
    logTitle: "Adapting Log History",
    clearLogs: "Clear History",
    pacerTitle: "Ocular Respiration Pacer",
    pacerSubtitle: "Match breathing with the glow to accelerate retinal blood-flow and rhodopsin synthesis.",
    lastBleach: "Last bleach event recorded:",
    customPresets: "Sensory Presets",
    tacticalView: "Tactical Monochromatic Mode",
    tacticalDesc: "Filters out any stray colored glows to keep maximum night sensitivity."
  },
  nl: {
    title: "NoxEquilibrium",
    subtitle: "Tactische Rhodopsine Donker-Adaptatie & Belichtingsmatrix",
    tagline: "Gemaakt voor de 1% extreme diep-heelal waarnemers en astrofotografen.",
    explanationTitle: "De Wetenschap achter NoxEquilibrium",
    explanationBody: "Menselijke staafjes (verantwoordelijk voor nachtzicht) hebben tot 45 minuten absolute duisternis nodig om rhodopsine volledig te synthetiseren. Eén blik op wit of blauw licht bleekt deze chemische stof direct, wat uren aan biologische aanpassing tenietdoet. NoxEquilibrium werkt uitsluitend in het 650nm+ dieprode spectrum om retinale gevoeligheid te beschermen tijdens precisie-observaties.",
    bortleTitle: "Omgevings-Bortle-schaal",
    bortleDesc: "Micro-kalibratie gebaseerd op hemelhelderheid.",
    startAdaptation: "Start Rhodopsine Kalibratie",
    resetBleach: "Simuleer Lichtbleking (Reset)",
    currentRhodopsin: "Rhodopsine Synthese Status",
    timeToMax: "Resterende Tijd tot Volledig Nachtzicht",
    minutesShort: "min",
    secondsShort: "sec",
    fullyAdapted: "Volledig Donker-Aangepast",
    exposureCalcTitle: "Nox Belichtingsmatrix",
    focalLength: "Brandpuntsafstand",
    aperture: "Diafragma",
    sensorType: "Sensor Type",
    calcResult: "Nox-Limiet (Geen Sterrensporen)",
    bortleLevel: "Bortle Schaal",
    logTitle: "Adaptatie Logboek",
    clearLogs: "Geschiedenis Wissen",
    pacerTitle: "Zintuigelijke Ademhaling Begeleider",
    pacerSubtitle: "Stem je ademhaling af op de gloed om retinale doorbloeding en rhodopsine-synthese te versnellen.",
    lastBleach: "Laatste lichtbleking geregistreerd:",
    customPresets: "Zintuigelijke Voorinstellingen",
    tacticalView: "Tactische Monochromatische Modus",
    tacticalDesc: "Filtert alle ongewenste kleurgloeden om maximale nachtgevoeligheid te behouden."
  }
};

export default function App() {
  // Language logic
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  
  useEffect(() => {
    const userLang = navigator.language.startsWith('nl') ? 'nl' : 'en';
    setLang(userLang);
  }, []);

  const t = TRANSLATIONS[lang];

  // Document Title
  useEffect(() => {
    document.title = `${t.title} | ${t.subtitle}`;
  }, [lang, t.title, t.subtitle]);

  // Core States & LocalStorage Sync
  const [bortle, setBortle] = useState<number>(() => {
    const saved = localStorage.getItem('nox_bortle');
    return saved ? parseInt(saved, 10) : 4;
  });
  
  const [adaptationStart, setAdaptationStart] = useState<number | null>(() => {
    const saved = localStorage.getItem('nox_adaptation_start');
    return saved ? parseInt(saved, 10) : null;
  });

  const [logs, setLogs] = useState<{ id: string; time: string; event: string }[]>(() => {
    const saved = localStorage.getItem('nox_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Camera Specs States
  const [focalLength, setFocalLength] = useState<number>(24);
  const [aperture, setAperture] = useState<number>(1.8);
  const [sensorType, setSensorType] = useState<'full' | 'apsc' | 'mft'>('full');

  // UI states
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isTacticalMode, setIsTacticalMode] = useState(true);

  // Keep time ticking for adaptation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist values
  useEffect(() => {
    localStorage.setItem('nox_bortle', bortle.toString());
  }, [bortle]);

  useEffect(() => {
    if (adaptationStart) {
      localStorage.setItem('nox_adaptation_start', adaptationStart.toString());
    } else {
      localStorage.removeItem('nox_adaptation_start');
    }
  }, [adaptationStart]);

  useEffect(() => {
    localStorage.setItem('nox_logs', JSON.stringify(logs));
  }, [logs]);

  // Real-time Rhodopsin Synthesis Mathematics
  // Rhodopsin regeneration follows a exponential curve: R(t) = 100 * (1 - e^(-t / tau))
  // For human rod cells, tau is roughly 400-500 seconds (~8 minutes for 63%, ~40 mins for >99%)
  // Adjusted slightly based on local light pollution (Bortle Scale)
  const getRhodopsinState = () => {
    if (!adaptationStart) return 0;
    const elapsedSeconds = Math.max(0, (currentTime - adaptationStart) / 1000);
    // Adjust tau based on Bortle scale (stray light slows down max potential adaptation)
    const adjustedTau = 450 + (bortle * 12); 
    const maxPotential = Math.max(70, 100 - (bortle * 2.5));
    const percentage = maxPotential * (1 - Math.exp(-elapsedSeconds / adjustedTau));
    return Math.min(100, Math.round(percentage * 10) / 10);
  };

  const currentRhodopsin = getRhodopsinState();
  const isFullyAdapted = currentRhodopsin >= (100 - (bortle * 2.5));

  const getRemainingSeconds = () => {
    if (!adaptationStart) return 0;
    const maxPotential = Math.max(70, 100 - (bortle * 2.5));
    if (currentRhodopsin >= maxPotential - 1) return 0;
    const adjustedTau = 450 + (bortle * 12);
    // Solve for t: currentRhodopsin = maxPotential * (1 - e^(-t / tau))
    const elapsedSeconds = (currentTime - adaptationStart) / 1000;
    const targetProgress = 0.99; // target 99% of max potential
    const totalRequiredSeconds = -adjustedTau * Math.log(1 - targetProgress);
    return Math.max(0, Math.round(totalRequiredSeconds - elapsedSeconds));
  };

  const remainingSeconds = getRemainingSeconds();

  // Camera Exposure calculation (Classic NPF Rule for sharp stars without trailing)
  // NPF rule formula simplified: Exposure (secs) = (35 * Aperture + 30 * PixelPitch) / FocalLength
  const calculateExposure = () => {
    let cropFactor = 1.0;
    if (sensorType === 'apsc') cropFactor = 1.5;
    if (sensorType === 'mft') cropFactor = 2.0;
    
    // Elegant heuristic representation of pixel pitch mapping for high-end night bodies
    const basePixelPitch = 4.5; 
    const calculatedSecs = ((35 * aperture) + (30 * basePixelPitch)) / (focalLength * cropFactor);
    return Math.round(calculatedSecs * 100) / 100;
  };

  const handleStartAdaptation = () => {
    const now = Date.now();
    setAdaptationStart(now);
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      event: lang === 'en' ? 'Adaptation process engaged.' : 'Adaptatieproces gestart.'
    };
    setLogs(prev => [newLog, ...prev].slice(0, 15));
  };

  const handleBleachReset = () => {
    setAdaptationStart(null);
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      event: lang === 'en' ? 'Rod-cell bleach detected! Retinal resets.' : 'Lichtbleking gedetecteerd! Netvlies gereset.'
    };
    setLogs(prev => [newLog, ...prev].slice(0, 15));
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Chart simulation data
  const generateChartData = () => {
    const data = [];
    const adjustedTau = 450 + (bortle * 12);
    const maxPotential = Math.max(70, 100 - (bortle * 2.5));
    for (let m = 0; m <= 45; m += 3) {
      const tSecs = m * 60;
      const percent = maxPotential * (1 - Math.exp(-tSecs / adjustedTau));
      data.push({
        minute: m,
        Synthesis: Math.min(100, Math.round(percent))
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className={`min-h-screen ${isTacticalMode ? 'bg-black text-red-600 selection:bg-red-900 selection:text-red-100' : 'bg-stone-950 text-orange-500 selection:bg-orange-950 selection:text-orange-100'} font-sans transition-colors duration-1000 overflow-x-hidden relative`}>
      
      {/* Celestial Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-600 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-rose-950 rounded-full blur-[200px]" />
      </div>

      {/* Header Container */}
      <header className="border-b border-red-950/40 backdrop-blur-xl bg-black/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <Eye className={`w-8 h-8 ${isTacticalMode ? 'text-red-500' : 'text-orange-500'} filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]`} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
                {t.title}
                <span className="text-[10px] font-mono border border-red-900 px-1 py-0.5 rounded tracking-normal uppercase text-red-400">
                  v3.4 Pure
                </span>
              </h1>
              <p className="text-[11px] opacity-70 tracking-wide font-mono hidden md:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Top Controls */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'nl' : 'en')}
              className="px-2.5 py-1 text-xs font-mono border border-red-900/50 hover:border-red-600 rounded bg-red-950/20 hover:bg-red-950/50 transition-all cursor-pointer"
            >
              {lang.toUpperCase()}
            </button>

            {/* Tactical Filter Switch */}
            <button
              onClick={() => setIsTacticalMode(!isTacticalMode)}
              className={`px-3 py-1 text-xs font-mono border rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                isTacticalMode 
                  ? 'bg-red-950/40 border-red-500 text-red-400' 
                  : 'bg-stone-900/40 border-stone-800 text-stone-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mono</span>
            </button>

            {/* Information Hub Trigger */}
            <button
              onClick={() => setIsExplanationOpen(true)}
              className="p-2 text-red-500 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-full border border-red-900/40 transition-all cursor-pointer"
              title="Concept & Science Explanation"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Upper Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Main Adaptive Driver (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-black/80 border border-red-950/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
              
              {/* Calibration Glow Arc */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-radial-gradient from-red-600/10 to-transparent pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <span className="text-[11px] font-mono tracking-widest text-red-400 uppercase">
                    Retinal Simulation Engine
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight mt-1">
                    {t.currentRhodopsin}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartAdaptation}
                    className={`px-4 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      adaptationStart
                        ? 'bg-red-950/30 text-red-500 border border-red-900/50'
                        : 'bg-red-600 hover:bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    {t.startAdaptation}
                  </button>

                  {adaptationStart && (
                    <button
                      onClick={handleBleachReset}
                      className="p-2.5 bg-neutral-900 hover:bg-red-950/30 border border-red-900 text-red-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                      title={t.resetBleach}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Adaptive Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-4">
                <div className="md:col-span-4 flex flex-col items-center justify-center relative py-6">
                  {/* Circular visual progress and calibration guide */}
                  <svg className="w-44 h-44 transform -rotate-90">
                    <circle
                      cx="88"
                      cy="88"
                      r="78"
                      className="stroke-neutral-900 fill-none"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="88"
                      cy="88"
                      r="78"
                      className={`fill-none ${isTacticalMode ? 'stroke-red-600' : 'stroke-orange-500'}`}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 78}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 78 * (1 - currentRhodopsin / 100)
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <motion.span 
                      key={currentRhodopsin}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-extrabold tracking-tight"
                    >
                      {currentRhodopsin}%
                    </motion.span>
                    <span className="text-[10px] font-mono opacity-60 uppercase mt-1">
                      Rhodopsin
                    </span>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  {/* Dynamic Time Remaining and descriptive text */}
                  <div className="bg-red-950/10 border border-red-950/40 rounded-xl p-4">
                    <p className="text-xs font-mono text-red-400 uppercase">
                      {t.timeToMax}
                    </p>
                    <div className="text-2xl font-bold tracking-wider mt-1 font-mono">
                      {adaptationStart ? (
                        remainingSeconds > 0 ? (
                          <span className="flex items-baseline gap-1">
                            {Math.floor(remainingSeconds / 60)}
                            <span className="text-xs font-normal opacity-60">{t.minutesShort}</span>
                            {remainingSeconds % 60}
                            <span className="text-xs font-normal opacity-60">{t.secondsShort}</span>
                          </span>
                        ) : (
                          <span className="text-green-500 flex items-center gap-2">
                            <Check className="w-5 h-5 animate-bounce" /> {t.fullyAdapted}
                          </span>
                        )
                      ) : (
                        <span className="opacity-40 font-normal text-sm">
                          [Waiting for calibration initiation]
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro Bortle calibration slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span>{t.bortleTitle}</span>
                      <span className="text-red-400 font-bold">Class {bortle} (Bortle)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="9"
                      value={bortle}
                      onChange={(e) => setBortle(parseInt(e.target.value, 10))}
                      className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] opacity-60 leading-relaxed font-mono">
                      {t.bortleDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive graph mapping adaptation curve */}
              <div className="h-40 w-full mt-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rhodopsinColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isTacticalMode ? "#dc2626" : "#ea580c"} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isTacticalMode ? "#dc2626" : "#ea580c"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="minute" stroke="#991b1b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#991b1b" fontSize={10} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{
                        background: '#000', 
                        borderColor: '#991b1b', 
                        color: '#f87171', 
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Synthesis" 
                      stroke={isTacticalMode ? "#ef4444" : "#f97316"} 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#rhodopsinColor)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EXPOSURE CALCULATOR PANEL */}
            <div className="bg-black/80 border border-red-950/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
              <h3 className="text-lg font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {t.exposureCalcTitle}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Focal length input */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase text-red-400">
                    {t.focalLength} (mm)
                  </label>
                  <input
                    type="number"
                    value={focalLength}
                    onChange={(e) => setFocalLength(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-neutral-900 border border-red-950 rounded-lg px-3 py-2 text-sm text-red-500 font-mono focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>

                {/* Aperture input */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase text-red-400">
                    {t.aperture} (f/)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={aperture}
                    onChange={(e) => setAperture(Math.max(0.5, parseFloat(e.target.value) || 0))}
                    className="w-full bg-neutral-900 border border-red-950 rounded-lg px-3 py-2 text-sm text-red-500 font-mono focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>

                {/* Sensor selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase text-red-400">
                    {t.sensorType}
                  </label>
                  <select
                    value={sensorType}
                    onChange={(e: any) => setSensorType(e.target.value)}
                    className="w-full bg-neutral-900 border border-red-950 rounded-lg px-3 py-2 text-sm text-red-500 font-mono focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                  >
                    <option value="full">Full Frame (1.0x)</option>
                    <option value="apsc">APS-C (1.5x)</option>
                    <option value="mft">Micro Four Thirds (2.0x)</option>
                  </select>
                </div>
              </div>

              <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-red-400 uppercase">{t.calcResult}</p>
                  <p className="text-[11px] opacity-60 leading-normal font-mono mt-1">
                    Recommended threshold to keep pinpoint-sharp stellar fields.
                  </p>
                </div>
                <motion.div 
                  layout
                  className="text-3xl font-black font-mono tracking-widest text-red-500 bg-black border border-red-950/80 px-4 py-2 rounded-lg"
                >
                  {calculateExposure()} <span className="text-xs font-normal opacity-60">S</span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Respiration Pacer & Tactical Log (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sensory Respiration Pacer */}
            <div className="bg-black/80 border border-red-950/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl text-center">
              <h3 className="text-xs font-mono text-red-400 uppercase tracking-widest mb-2">
                {t.pacerTitle}
              </h3>
              <p className="text-[10px] opacity-70 leading-relaxed font-mono max-w-xs mx-auto mb-6">
                {t.pacerSubtitle}
              </p>

              {/* Animated Glowing Breathing Orb */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.2, 0.7, 0.2]
                  }}
                  transition={{
                    duration: 6, // 6 seconds breath cycle
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute w-20 h-20 rounded-full bg-red-600/30 blur-xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-14 h-14 rounded-full border border-red-500/80 bg-red-950/30 flex items-center justify-center text-xs font-mono text-red-400"
                >
                  <motion.span
                    animate={{
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    STAY
                  </motion.span>
                </motion.div>
              </div>
            </div>

            {/* Tactical Adaptation Logs */}
            <div className="bg-black/80 border border-red-950/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono text-red-400 uppercase tracking-widest">
                  {t.logTitle}
                </h3>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-[9px] font-mono hover:text-red-400 opacity-60 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    {t.clearLogs}
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-950">
                <AnimatePresence initial={false}>
                  {logs.length === 0 ? (
                    <div className="text-xs opacity-40 font-mono text-center py-6">
                      [No dark-adaptation logs yet]
                    </div>
                  ) : (
                    logs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="border-l-2 border-red-900 bg-neutral-900/30 p-2.5 rounded-r text-[11px] font-mono flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="opacity-50 text-[9px]">{log.time}</span>
                          <p className="mt-0.5 text-red-300">{log.event}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Science Presets Selector */}
            <div className="bg-black/80 border border-red-950/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
              <h3 className="text-xs font-mono text-red-400 uppercase tracking-widest mb-3">
                {t.customPresets}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <button
                  onClick={() => {
                    setBortle(1);
                    handleStartAdaptation();
                  }}
                  className="p-2 bg-neutral-900 hover:bg-red-950/40 rounded border border-red-950 hover:border-red-800 transition-all text-left cursor-pointer"
                >
                  🌌 Bortle 1 (True Dark)
                </button>
                <button
                  onClick={() => {
                    setBortle(4);
                    handleStartAdaptation();
                  }}
                  className="p-2 bg-neutral-900 hover:bg-red-950/40 rounded border border-red-950 hover:border-red-800 transition-all text-left cursor-pointer"
                >
                  🏡 Bortle 4 (Suburban)
                </button>
                <button
                  onClick={() => {
                    setBortle(8);
                    handleStartAdaptation();
                  }}
                  className="p-2 bg-neutral-900 hover:bg-red-950/40 rounded border border-red-950 hover:border-red-800 transition-all text-left cursor-pointer"
                >
                  🏢 Bortle 8 (City Sky)
                </button>
                <button
                  onClick={handleBleachReset}
                  className="p-2 bg-neutral-900 hover:bg-red-950/40 rounded border border-red-950 hover:border-red-800 transition-all text-left text-red-500 cursor-pointer"
                >
                  💥 Retinal Bleach
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* CONCEPT DESCRIPTION POPUP (MODAL) */}
      <AnimatePresence>
        {isExplanationOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-neutral-950 border border-red-900/80 rounded-2xl max-w-lg w-full p-6 text-red-500 font-sans shadow-[0_0_30px_rgba(239,68,68,0.25)] relative"
            >
              <button
                onClick={() => setIsExplanationOpen(false)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-full p-1.5 border border-red-900/40 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold uppercase tracking-wider">
                  {t.explanationTitle}
                </h3>
              </div>

              <div className="space-y-4 text-sm font-mono leading-relaxed text-red-400">
                <p>{t.explanationBody}</p>
                <div className="border-t border-red-900/40 pt-4 text-xs opacity-75">
                  <p className="font-bold uppercase text-red-300 mb-1">Target Audience (1%):</p>
                  <p>Deep-sky researchers, military tactical operators, extreme night-sky observers, and astrophotographers looking to squeeze the highest quantum efficiency out of their organic biological vision.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}