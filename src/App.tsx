import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, RefreshCw, BrainCircuit, Activity } from 'lucide-react';

// --- TRANSLATIONS ---
const dict = {
  en: {
    title: "ChronoSync",
    subtitle: "Calibrate your internal clock",
    instruction: "Close your eyes. Press and hold the orb until you feel exactly 10 seconds have passed.",
    holding: "Focus on the time...",
    release: "Release when 10s is up",
    resultTitle: "Calibration Complete",
    actualTime: "Actual time passed:",
    ratioTitle: "Distortion Ratio:",
    ratioDesc: "Your brain is running",
    faster: "faster than reality.",
    slower: "slower than reality.",
    perfect: "in perfect sync with reality.",
    calcLabel: "Real-world task duration (mins)",
    calcResult: "To you, this will feel like:",
    recalibrate: "Recalibrate"
  },
  nl: {
    title: "ChronoSync",
    subtitle: "Kalibreer je interne klok",
    instruction: "Sluit je ogen. Houd de bol ingedrukt tot je voor je gevoel exact 10 seconden verder bent.",
    holding: "Focus op de tijd...",
    release: "Laat los na 10 seconden",
    resultTitle: "Kalibratie Voltooid",
    actualTime: "Echt verstreken tijd:",
    ratioTitle: "Vervormingsratio:",
    ratioDesc: "Jouw brein loopt",
    faster: "sneller dan de realiteit.",
    slower: "langzamer dan de realiteit.",
    perfect: "perfect synchroon met de realiteit.",
    calcLabel: "Echte duur van een taak (minuten)",
    calcResult: "Voor jou voelt dit straks als:",
    recalibrate: "Opnieuw Kalibreren"
  }
};

type Language = 'en' | 'nl';
type Phase = 'idle' | 'holding' | 'result';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [phase, setPhase] = useState<Phase>('idle');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [taskMinutes, setTaskMinutes] = useState<number>(30);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect browser language
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('nl')) setLang('nl');
  }, []);

  const t = dict[lang];
  const TARGET_SECONDS = 10;
  
  // Ratio calculation: If you held for 8s thinking it was 10s, your clock is FAST (ratio 1.25).
  // A 60 min task will feel like 75 mins to you.
  const ratio = elapsed > 0 ? TARGET_SECONDS / elapsed : 1;
  const perceivedTaskTime = taskMinutes * ratio;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'idle') return;
    e.preventDefault(); // Prevent text selection/scrolling on mobile
    setPhase('holding');
    setStartTime(Date.now());
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (phase !== 'holding' || !startTime) return;
    e.preventDefault();
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    setElapsed(duration);
    setPhase('result');
    setStartTime(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Inject Tailwind CSS betrouwbaar
    const injectTailwind = () => {
      if (!document.getElementById('tailwind-cdn')) {
        const script = document.createElement('script');
        script.id = 'tailwind-cdn';
        script.src = 'https://cdn.tailwindcss.com';

        // Tailwind configuratie om onmiddellijke verwerking te forceren
        script.onload = () => {
          window.tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  slate: { 950: '#0f1115' }
                }
              }
            }
          };
          setIsLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    injectTailwind();
  }, []);
  if (!isLoaded) {
    return (
      <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans flex items-center justify-center p-4 selection:bg-cyan-500/30 overflow-hidden">
      
      {/* Futuristic Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <motion.div 
        layout
        className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative z-10"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <motion.div layout className="p-6 pb-2 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{t.title}</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">{t.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
            className="text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
          >
            {lang}
          </button>
        </motion.div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* IDLE / CALIBRATION PHASE */}
            {(phase === 'idle' || phase === 'holding') && (
              <motion.div 
                key="calibrate"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                className="flex flex-col items-center w-full"
              >
                <p className="text-center text-sm text-slate-300 mb-12 max-w-[280px] leading-relaxed">
                  {phase === 'idle' ? t.instruction : t.holding}
                </p>

                {/* The Orb - Interactive Area */}
                <motion.div
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="relative flex items-center justify-center w-48 h-48 cursor-pointer touch-none"
                  whileHover={phase === 'idle' ? { scale: 1.05 } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Outer glowing rings */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border border-cyan-500/30"
                    animate={phase === 'holding' ? {
                      scale: [1, 1.5],
                      opacity: 1,
                      borderWidth: ["2px", "8px"]
                    } : {
                      scale: 1, opacity: 0.5
                    }}
                    transition={{ duration: 1.5, repeat: phase === 'holding' ? Infinity : 0, ease: "easeOut" }}
                  />
                  
                  {/* Inner Orb */}
                  <motion.div 
                    className={`w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-colors duration-500 ${phase === 'holding' ? 'bg-cyan-500' : 'bg-slate-800 border border-white/10'}`}
                    animate={phase === 'holding' ? { scale: [1, 0.9, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Activity className={`w-10 h-10 ${phase === 'holding' ? 'text-white' : 'text-cyan-400'}`} />
                  </motion.div>
                </motion.div>

                <motion.p 
                  className="mt-12 text-xs text-cyan-400/80 font-mono uppercase tracking-widest"
                  animate={phase === 'holding' ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {t.release}
                </motion.p>
              </motion.div>
            )}

            {/* RESULT & CALCULATOR PHASE */}
            {phase === 'result' && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-full bg-black/20 rounded-2xl p-5 border border-white/5 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                  <p className="text-xs text-slate-400 mb-1">{t.actualTime}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-white font-mono">{elapsed.toFixed(2)}</span>
                    <span className="text-sm text-cyan-500 font-bold uppercase tracking-wider">SEC</span>
                  </div>
                </div>

                <div className="w-full mb-8">
                  <p className="text-sm text-slate-300 font-medium mb-2">{t.ratioTitle} <span className="font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md">{ratio.toFixed(2)}x</span></p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.ratioDesc} <strong className="text-slate-200">
                      {ratio > 1.1 ? t.faster : ratio < 0.9 ? t.slower : t.perfect}
                    </strong>
                  </p>
                </div>

                {/* Calculator M3 Card */}
                <div className="w-full bg-white/5 rounded-[24px] p-6 shadow-inner border border-white/10 mb-6">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {t.calcLabel}
                  </label>
                  <div className="flex items-center gap-4 mb-6">
                    <input 
                      type="range" 
                      min="5" max="120" step="5"
                      value={taskMinutes}
                      onChange={(e) => setTaskMinutes(Number(e.target.value))}
                      className="flex-1 accent-cyan-500 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-mono font-bold text-white w-12 text-right">{taskMinutes}</span>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-400 mb-2">{t.calcResult}</p>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono">
                        {Math.round(perceivedTaskTime)} min
                      </span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setPhase('idle'); setElapsed(0); }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.recalibrate}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
