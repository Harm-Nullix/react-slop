import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  const [timeState, setTimeState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const userLang = navigator.language.startsWith('nl') ? 'nl' : 'en';
    setLang(userLang);
    document.title = userLang === 'nl' ? 'Fluida: Tijdsvolume' : 'Fluida: Temporal Volume';
  }, []);

  useEffect(() => {
    let timer: number;
    if (timeState === 'running' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimeState('finished');
    }
    return () => clearInterval(timer);
  }, [timeState, timeLeft]);

  const content = {
    en: {
      title: 'Fluida',
      subtitle: 'Perceive the flow, not the pressure.',
      start: 'Initiate Flow',
      reset: 'Evaporate',
      finished: 'Cycle Complete',
      instruction: 'Set your temporal volume (minutes)',
      back: 'Back to Calm'
    },
    nl: {
      title: 'Fluida',
      subtitle: 'Ervaar de stroom, niet de druk.',
      start: 'Start Stroom',
      reset: 'Verdampen',
      finished: 'Cyclus Voltooid',
      instruction: 'Stel je tijdsvolume in (minuten)',
      back: 'Terug naar Rust'
    }
  };

  const progress = timeLeft / (duration * 60);
  const t = content[lang];

  const addRipple = (e: React.MouseEvent | React.TouchEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 2000);
  };

  return (
    <div 
      onMouseDown={addRipple}
      className="fixed inset-0 overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center font-sans selection:bg-cyan-500/30"
      style={{ touchAction: 'none' }}
    >
      {/* Background Liquid Surface */}
      <motion.div 
        initial={false}
        animate={{ 
          height: `${progress * 100}%`,
          backgroundColor: timeState === 'finished' ? '#06b6d4' : '#171717'
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 opacity-40 blur-3xl"
      />

      {/* Animated Ripple Layer */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none border border-cyan-500/50 rounded-full"
            style={{ left: ripple.x, top: ripple.y, width: 100, height: 100, marginLeft: -50, marginTop: -50 }}
          />
        ))}
      </AnimatePresence>

      <main className="relative z-10 flex flex-col items-center px-6 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-6xl font-extralight tracking-tighter mb-2 italic">{t.title}</h1>
          <p className="text-neutral-500 font-light tracking-widest uppercase text-xs">{t.subtitle}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {timeState === 'idle' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center">
                <label className="text-neutral-400 text-sm mb-4">{t.instruction}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="90" 
                  value={duration} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setDuration(val);
                    setTimeLeft(val * 60);
                  }}
                  className="w-64 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="mt-4 text-4xl font-light text-cyan-400">{duration}m</span>
              </div>
              <button 
                onClick={() => setTimeState('running')}
                className="group relative px-8 py-3 overflow-hidden rounded-full border border-neutral-700 hover:border-cyan-500 transition-colors"
              >
                <span className="relative z-10">{t.start}</span>
                <motion.div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
            </motion.div>
          ) : timeState === 'running' ? (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-neutral-900"
                  />
                  <motion.circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray={754}
                    animate={{ strokeDashoffset: 754 * (1 - progress) }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="text-cyan-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="text-neutral-500 text-sm tracking-widest uppercase"
                   >
                    {Math.ceil(timeLeft / 60)}m
                   </motion.div>
                </div>
              </div>
              
              <button 
                onClick={() => { setTimeState('idle'); setTimeLeft(duration * 60); }}
                className="mt-12 text-neutral-600 hover:text-neutral-300 transition-colors text-xs tracking-widest uppercase"
              >
                {t.reset}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <h2 className="text-3xl font-light text-cyan-400 mb-8">{t.finished}</h2>
              <button 
                onClick={() => { setTimeState('idle'); setTimeLeft(duration * 60); }}
                className="px-8 py-3 rounded-full bg-neutral-100 text-neutral-950 font-medium"
              >
                {t.back}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Micro-interaction: Corner Language Switcher */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
          className="text-[10px] tracking-tighter text-neutral-600 hover:text-cyan-500 uppercase"
        >
          {lang === 'en' ? 'NL' : 'EN'}
        </button>
      </div>

      <footer className="fixed bottom-8 left-8 z-50 text-[10px] text-neutral-700 uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Fluida Labs
      </footer>
    </div>
  );
};

export default App;
