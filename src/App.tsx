import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Shield, Info, MapPin, Zap, RefreshCw, AlertTriangle, Moon } from 'lucide-react';

// --- Translations ---
const I18N = {
  en: {
    title: "LumenSentry",
    subtitle: "Photo-Sensitivity Safety Engine",
    skinType: "Skin Sensitivity (Fitzpatrick)",
    environment: "Surrounding Surface (Albedo)",
    uvIndex: "Local UV Index",
    calculate: "Calculate Safe Window",
    safeTime: "Safe Exposure Window",
    minutes: "minutes",
    warning: "Extreme risk: Reflective surfaces increase UV intake by up to 80%.",
    surfaces: {
      grass: "Grass / Soil (Low)",
      asphalt: "Asphalt / Concrete (Med)",
      sand: "Dry Sand (High)",
      water: "Open Water (High)",
      snow: "Fresh Snow (Critical)"
    },
    types: {
      t1: "Type I: Always burns, never tans",
      t2: "Type II: Burns easily, tans minimally",
      t3: "Type III: Sometimes burns, tans slowly"
    }
  },
  nl: {
    title: "LumenSentry",
    subtitle: "Lichtgevoeligheid Veiligheidsmotor",
    skinType: "Huidgevoeligheid (Fitzpatrick)",
    environment: "Omgevingsreflectie (Albedo)",
    uvIndex: "Lokale UV Index",
    calculate: "Bereken Veiligheidsvenster",
    safeTime: "Veilig Blootstellingsvenster",
    minutes: "minuten",
    warning: "Extreem risico: Reflecterende oppervlakken verhogen UV-inname tot 80%.",
    surfaces: {
      grass: "Gras / Grond (Laag)",
      asphalt: "Asfalt / Beton (Gemiddeld)",
      sand: "Droog Zand (Hoog)",
      water: "Open Water (Hoog)",
      snow: "Verse Sneeuw (Kritiek)"
    },
    types: {
      t1: "Type I: Verbrandt altijd, bruint nooit",
      t2: "Type II: Verbrandt snel, bruint minimaal",
      t3: "Type III: Verbrandt soms, bruint langzaam"
    }
  }
};

// --- Constants ---
const ALBEDO_FACTORS = {
  grass: 0.05,
  asphalt: 0.12,
  sand: 0.25,
  water: 0.30,
  snow: 0.85
};

const SKIN_CONSTANTS = {
  t1: 200,
  t2: 300,
  t3: 500
};

export default function App() {
  const [lang, setLang] = useState('en');
  const [uv, setUv] = useState(5);
  const [surface, setSurface] = useState('grass');
  const [skin, setSkin] = useState('t1');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'nl') setLang('nl');
  }, []);

  const t = I18N[lang as keyof typeof I18N];

  const calculateSafeTime = () => {
    // Formula: (Skin Constant) / (UV * (1 + Albedo))
    // This is a simplified safety model for high-risk individuals
    const albedo = ALBEDO_FACTORS[surface as keyof typeof ALBEDO_FACTORS];
    const skinConst = SKIN_CONSTANTS[skin as keyof typeof SKIN_CONSTANTS];
    const effectiveUV = uv * (1 + albedo);
    const time = Math.round(skinConst / (effectiveUV * 2)); // Conservative divisor for safety
    setResult(time);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e2e2e6] font-sans p-4 md:p-8 flex items-center justify-center select-none">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-[#1a1c22]/80 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <motion.div 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="flex items-center gap-2 text-blue-400 mb-1"
            >
              <Shield size={18} className="animate-pulse" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">{t.title}</span>
            </motion.div>
            <h1 className="text-2xl font-light tracking-tight italic">{t.subtitle}</h1>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
            className="px-3 py-1 rounded-full border border-white/10 text-xs hover:bg-white/5 transition-colors"
          >
            {lang.toUpperCase()}
          </button>
        </div>

        {/* Main Interface */}
        <div className="p-8 pt-4 space-y-8">
          
          {/* Skin Type Selection */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-3 block italic">{t.skinType}</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(t.types).map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSkin(key)}
                  className={`p-4 rounded-2xl text-left transition-all border ${skin === key ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}`}
                >
                  <span className="text-sm font-medium">{t.types[key as keyof typeof t['types']]}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Environment Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-3 block italic">{t.environment}</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(t.surfaces).map((key) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSurface(key)}
                    className={`px-4 py-2 rounded-full text-xs transition-all ${surface === key ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/60'}`}
                  >
                    {t.surfaces[key as keyof typeof t['surfaces']]}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* UV Index Slider */}
            <div className="col-span-2">
              <div className="flex justify-between items-end mb-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 italic">{t.uvIndex}</label>
                <span className="text-2xl font-mono text-blue-400">{uv}</span>
              </div>
              <input 
                type="range" min="1" max="12" value={uv} 
                onChange={(e) => setUv(parseInt(e.target.value))} 
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={calculateSafeTime}
            className="w-full bg-blue-600 text-white py-5 rounded-[20px] font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
          >
            <Zap size={18} fill="currentColor" />
            {t.calculate}
          </motion.button>

          {/* Result Display */}
          <AnimatePresence mode="wait">
            {result !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-4 p-8 rounded-[24px] bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-400/20 relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-xs text-blue-300/60 uppercase tracking-widest mb-1">{t.safeTime}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">{result}</span>
                    <span className="text-sm text-white/40 font-medium italic">{t.minutes}</span>
                  </div>
                  {surface === 'snow' || surface === 'water' ? (
                    <div className="mt-4 flex gap-2 items-center text-orange-400/80 bg-orange-500/10 px-4 py-2 rounded-full">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-medium leading-tight">{t.warning}</span>
                    </div>
                  ) : null}
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] opacity-10">
                  <Sun size={150} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-white/5">
          <p className="text-[9px] text-white/20 tracking-widest uppercase">
            Designed for 1% – Clinical Precision Monitoring System
          </p>
        </div>
      </motion.div>

      {/* Style overrides for the slider */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          transition: all 0.2s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
