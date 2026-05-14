import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap, Brain, Coffee, Wind, Info, Globe } from 'lucide-react';

// --- Types & Translations ---
type MoodType = 'focus' | 'creative' | 'admin' | 'rest';

const TRANSLATIONS = {
  en: {
    title: "ChronosPulse",
    subtitle: "Bio-Rhythmic Task Aligner",
    energyLevel: "Current Energy Level",
    calculate: "Sync with My Rhythm",
    suggestion: "Optimal Task Type:",
    focus: "Deep Work & Logic",
    creative: "Ideation & Design",
    admin: "Email & Shallow Tasks",
    rest: "Recharge & Reflection",
    desc: "Your biological peak suggests:",
    locationNote: "Based on local solar time",
  },
  nl: {
    title: "ChronosPulse",
    subtitle: "Bio-Ritmische Taak-Aligner",
    energyLevel: "Huidig Energieniveau",
    calculate: "Synchroniseer met Ritme",
    suggestion: "Optimale Taaksoort:",
    focus: "Focus & Logica",
    creative: "Ideeën & Ontwerp",
    admin: "E-mail & Administratie",
    rest: "Rust & Reflectie",
    desc: "Je biologische piek suggereert:",
    locationNote: "Gebaseerd op lokale zonnetijd",
  }
};

// --- Main Component ---
export default function ChronosPulse() {
  const [energy, setEnergy] = useState(50);
  const [result, setResult] = useState<MoodType | null>(null);
  const [lang] = useState<'en' | 'nl'>(navigator.language.startsWith('nl') ? 'nl' : 'en');
  const t = TRANSLATIONS[lang];

  const currentTime = new Date().getHours();

  const calculateOptimalTask = () => {
    // Logica gebaseerd op circadiaanse pieken (kort door de bocht voor 1% niche)
    // Ochtend (7-11): Focus | Middag (11-15): Admin | Laat-middag (15-18): Creatief | Avond: Rust
    let task: MoodType = 'rest';
    
    if (currentTime >= 7 && currentTime < 11) task = energy > 40 ? 'focus' : 'admin';
    else if (currentTime >= 11 && currentTime < 15) task = 'admin';
    else if (currentTime >= 15 && currentTime < 19) task = energy > 60 ? 'creative' : 'rest';
    else task = 'rest';

    setResult(task);
  };

  const getIcon = (type: MoodType) => {
    switch (type) {
      case 'focus': return <Brain className="w-12 h-12 text-blue-400" />;
      case 'creative': return <Zap className="w-12 h-12 text-purple-400" />;
      case 'admin': return <Coffee className="w-12 h-12 text-amber-400" />;
      case 'rest': return <Wind className="w-12 h-12 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-100 flex items-center justify-center p-4 font-sans selection:bg-purple-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Card Container - Material 3 Glassmorphism */}
        <div className="bg-[#1c1f26]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden relative">
          
          {/* Header */}
          <header className="mb-10 text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Globe className="w-8 h-8 text-purple-500 opacity-50" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">{t.subtitle}</p>
          </header>

          {/* Input Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-400">{t.energyLevel}</span>
                <span className="text-purple-400 font-mono">{energy}%</span>
              </div>
              <input 
                type="range" 
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={calculateOptimalTask}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2"
            >
              <Sun className="w-5 h-5" />
              {t.calculate}
            </motion.button>
          </div>

          {/* Result Area */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-10 pt-10 border-t border-white/5 text-center"
              >
                <div className="flex justify-center mb-4 relative">
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-white/5 blur-2xl rounded-full"
                   />
                   {getIcon(result)}
                </div>
                <p className="text-gray-500 text-sm mb-1">{t.desc}</p>
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  {t[result]}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-600 uppercase tracking-tighter">
            <Info className="w-3 h-3" />
            {t.locationNote} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
