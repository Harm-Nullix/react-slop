import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Settings, Info, Play, Pause, RefreshCcw, BellOff, Bell } from 'lucide-react';

const OptiPulse = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalTime, setIntervalTime] = useState(4); // seconds
  const [showSettings, setShowSettings] = useState(false);
  const [lang, setLang] = useState('en');

  // Detection and Meta
  useEffect(() => {
    const userLang = navigator.language.startsWith('nl') ? 'nl' : 'en';
    setLang(userLang);
    document.title = userLang === 'nl' ? 'OptiPulse | Oog Gezondheid' : 'OptiPulse | Ocular Health';
  }, []);

  const content = {
    en: {
      title: 'OptiPulse',
      subtitle: 'Ocular Lubrication Pacer',
      description: 'Staring at screens reduces blink rate by 60%. OptiPulse uses rhythmic peripheral glows to trigger your natural blink reflex subconsciously.',
      start: 'Start Session',
      stop: 'Stop Session',
      settings: 'Blink Frequency',
      sec: 'seconds',
      target: 'Target: Screen-heavy professionals',
      problem: 'Digital Eye Strain & Dry Eye Syndrome.'
    },
    nl: {
      title: 'OptiPulse',
      subtitle: 'Oog-bevochtigingsritme',
      description: 'Staren naar schermen vermindert knipperen met 60%. OptiPulse gebruikt ritmische gloed om je natuurlijke knipperreflex onbewust te triggeren.',
      start: 'Start Sessie',
      stop: 'Stop Sessie',
      settings: 'Knipper Frequentie',
      sec: 'seconden',
      target: 'Doelgroep: Scherm-intensieve professionals',
      problem: 'Digitale oogvermoeidheid & Droge ogen.'
    }
  };

  const t = content[lang] || content.en;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      {/* Background Pulse Layer - This is the actual 'Ocular Guard' */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.15, 0], 
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              repeatDelay: intervalTime - 0.8,
              ease: "easeInOut"
            }}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ 
              background: 'radial-gradient(circle at center, transparent 30%, rgba(56, 189, 248, 0.4) 100%)' 
            }}
          />
        )}
      </AnimatePresence>

      {/* UI Layer */}
      <div className="z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/20 p-2 rounded-xl">
              <Eye className="text-sky-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <Settings className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
          </button>
        </header>

        <main className="space-y-8">
          <div className="relative h-48 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isPlaying ? (
                <motion.div 
                  key="idle"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-slate-400 text-sm leading-relaxed px-4">
                    {t.description}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="active"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ duration: intervalTime, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-2 border-sky-500/30 flex items-center justify-center"
                  >
                    <div className="w-4 h-4 bg-sky-400 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.8)]" />
                  </motion.div>
                  <p className="mt-4 text-sky-400 font-mono text-sm">{intervalTime}s Interval</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-800/50 p-4 rounded-2xl space-y-4">
                  <label className="flex justify-between text-sm">
                    <span>{t.settings}</span>
                    <span className="text-sky-400">{intervalTime} {t.sec}</span>
                  </label>
                  <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    step="0.5"
                    value={intervalTime} 
                    onChange={(e) => setIntervalTime(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
              isPlaying 
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                : 'bg-sky-500 text-white hover:bg-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.3)]'
            }`}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? t.stop : t.start}
          </button>
        </main>

        <footer className="mt-10 pt-6 border-t border-slate-800/50">
          <div className="flex flex-col gap-2 opacity-50 text-[10px] uppercase tracking-widest">
            <p>{t.target}</p>
            <p>{t.problem}</p>
          </div>
        </footer>
      </div>
      
      {/* Mobile Hint */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 text-slate-500 text-[10px]"
      >
        OptiPulse v1.0 • Designed for focus & longevity
      </motion.div>
    </div>
  );
};

export default OptiPulse;