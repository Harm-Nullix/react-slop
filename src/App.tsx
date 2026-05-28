import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

type Lang = 'nl' | 'en';

const T: Record<Lang, Record<string, string>> = {
  nl: {
    appTitle: 'PneumaLog',
    tagline: 'Adem-Protocol Architect voor Vrijduikers',
    tabProtocol: 'Protocol',
    tabSession: 'Sessie',
    tabHistory: 'Geschiedenis',
    tabSettings: 'Instellingen',
    co2Table: 'CO₂ Tolerantie Tabel',
    o2Table: 'O₂ Tolerantie Tabel',
    generate: 'Genereer Protocol',
    baseHold: 'Basis Holdtijd (sec)',
    cycles: 'Cycli',
    restRatio: 'Rust/Hold Ratio',
    holdTime: 'Hold',
    restTime: 'Rust',
    startSession: 'Start Sessie',
    stopSession: 'Stop',
    pauseSession: 'Pauze',
    resumeSession: 'Hervat',
    cycleOf: 'van',
    breathing: 'Ademhalen',
    holding: 'Vasthouden',
    inhale: 'Inademen',
    exhale: 'Uitademen',
    sessionComplete: 'Sessie Voltooid!',
    saveSession: 'Sessie Opslaan',
    totalTime: 'Totale Tijd',
    avgHold: 'Gem. Hold',
    bestHold: 'Beste Hold',
    noHistory: 'Geen sessie-geschiedenis gevonden.',
    clearHistory: 'Geschiedenis Wissen',
    settingsTitle: 'Instellingen',
    soundOn: 'Geluidssignalen',
    vibration: 'Vibratie',
    theme: 'Thema',
    dark: 'Donker',
    light: 'Licht',
    seconds: 'sec',
    minutes: 'min',
    co2Desc: 'Verkort rusttijd geleidelijk — bouwt CO₂-tolerantie op.',
    o2Desc: 'Verhoogt holdtijd geleidelijk — bouwt O₂-tolerantie op.',
    actualHold: 'Werkelijke hold',
    skip: 'Overslaan',
    ready: 'Klaar?',
    tapToStart: 'Tik om te starten',
    personal: 'Gepersonaliseerd',
    today: 'Vandaag',
    sessions: 'sessies',
    streak: 'Reeks',
    days: 'dagen',
  },
  en: {
    appTitle: 'PneumaLog',
    tagline: 'Breath Protocol Architect for Freedivers',
    tabProtocol: 'Protocol',
    tabSession: 'Session',
    tabHistory: 'History',
    tabSettings: 'Settings',
    co2Table: 'CO₂ Tolerance Table',
    o2Table: 'O₂ Tolerance Table',
    generate: 'Generate Protocol',
    baseHold: 'Base Hold Time (sec)',
    cycles: 'Cycles',
    restRatio: 'Rest/Hold Ratio',
    holdTime: 'Hold',
    restTime: 'Rest',
    startSession: 'Start Session',
    stopSession: 'Stop',
    pauseSession: 'Pause',
    resumeSession: 'Resume',
    cycleOf: 'of',
    breathing: 'Breathing',
    holding: 'Holding',
    inhale: 'Inhale',
    exhale: 'Exhale',
    sessionComplete: 'Session Complete!',
    saveSession: 'Save Session',
    totalTime: 'Total Time',
    avgHold: 'Avg Hold',
    bestHold: 'Best Hold',
    noHistory: 'No session history found.',
    clearHistory: 'Clear History',
    settingsTitle: 'Settings',
    soundOn: 'Sound Cues',
    vibration: 'Vibration',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    seconds: 'sec',
    minutes: 'min',
    co2Desc: 'Gradually reduces rest time — builds CO₂ tolerance.',
    o2Desc: 'Gradually increases hold time — builds O₂ tolerance.',
    actualHold: 'Actual hold',
    skip: 'Skip',
    ready: 'Ready?',
    tapToStart: 'Tap to start',
    personal: 'Personalized',
    today: 'Today',
    sessions: 'sessions',
    streak: 'Streak',
    days: 'days',
  },
};

function detectLang(): Lang {
  const l = navigator.language || 'en';
  return l.startsWith('nl') ? 'nl' : 'en';
}

interface ProtocolCycle {
  holdSec: number;
  restSec: number;
}

interface SessionRecord {
  id: string;
  date: string;
  type: 'co2' | 'o2' | 'custom';
  cycles: number;
  totalTimeSec: number;
  avgHoldSec: number;
  bestHoldSec: number;
  actualHolds: number[];
}

interface Settings {
  sound: boolean;
  vibration: boolean;
  theme: 'dark' | 'light';
}

function generateCO2Table(baseHold: number, cycles: number): ProtocolCycle[] {
  const table: ProtocolCycle[] = [];
  const maxRest = baseHold * 2;
  for (let i = 0; i < cycles; i++) {
    const rest = Math.max(30, Math.round(maxRest - (i * (maxRest - 30) / (cycles - 1))));
    table.push({ holdSec: baseHold, restSec: rest });
  }
  return table;
}

function generateO2Table(baseHold: number, cycles: number): ProtocolCycle[] {
  const table: ProtocolCycle[] = [];
  const baseRest = Math.round(baseHold * 2);
  for (let i = 0; i < cycles; i++) {
    const hold = Math.round(baseHold + (i * baseHold * 0.15));
    table.push({ holdSec: hold, restSec: baseRest });
  }
  return table;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const WaveOrb = ({ phase, progress }: { phase: 'breathe' | 'hold'; progress: number }) => {
  const scale = phase === 'hold' ? 1 + progress * 0.15 : 0.85 + progress * 0.15;
  const pulseOpacity = phase === 'hold' ? 0.3 + Math.sin(Date.now() / 500) * 0.1 : 0.2;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${100 + i * 40}px`,
            height: `${100 + i * 40}px`,
            background: phase === 'hold'
              ? `rgba(56,189,248,${0.08 - i * 0.015})`
              : `rgba(167,139,250,${0.08 - i * 0.015})`,
            border: `1px solid ${phase === 'hold' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
          }}
          animate={{
            scale: [1, 1.08 + i * 0.02, 1],
            opacity: [pulseOpacity, pulseOpacity + 0.1, pulseOpacity],
          }}
          transition={{
            duration: 2 + i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center"
        style={{
          width: '100px',
          height: '100px',
          background: phase === 'hold'
            ? 'radial-gradient(circle, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.7) 100%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.9) 0%, rgba(139,92,246,0.7) 100%)',
          boxShadow: phase === 'hold'
            ? '0 0 40px rgba(56,189,248,0.6), 0 0 80px rgba(56,189,248,0.3)'
            : '0 0 40px rgba(167,139,250,0.6), 0 0 80px rgba(167,139,250,0.3)',
        }}
        animate={{ scale: [scale, scale + 0.02, scale] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

const CircularProgress = ({ value, max, size = 200, strokeWidth = 8, color }: {
  value: number; max: number; size?: number; strokeWidth?: number; color: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = max > 0 ? (value / max) : 0;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="absolute top-0 left-0" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  );
};

export default function App() {
  const lang = detectLang();
  const t = T[lang];

  const [tab, setTab] = useState<'protocol' | 'session' | 'history' | 'settings'>('protocol');
  const [protocolType, setProtocolType] = useState<'co2' | 'o2'>('co2');
  const [baseHold, setBaseHold] = useState(60);
  const [cycles, setCycles] = useState(8);
  const [protocol, setProtocol] = useState<ProtocolCycle[]>([]);
  const [settings, setSettings] = useState<Settings>(() => {
    try { return JSON.parse(localStorage.getItem('pneumalog_settings') || '{}'); }
    catch { return { sound: true, vibration: true, theme: 'dark' }; }
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState<'breathe' | 'hold'>('breathe');
  const [phaseTimer, setPhaseTimer] = useState(0)
  const [phaseDuration, setPhaseDuration] = useState(0);
  const [actualHolds, setActualHolds] = useState<number[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('pneumalog_history') || '[]'); }
    catch { return []; }
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef(0);

  useEffect(() => {
    document.title = `${t.appTitle} — ${t.tagline}`;
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    (metaDesc as HTMLMetaElement).name = 'description';
    (metaDesc as HTMLMetaElement).content = t.tagline;
    if (!document.querySelector('meta[name="description"]')) document.head.appendChild(metaDesc);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('pneumalog_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pneumalog_history', JSON.stringify(history));
  }, [history]);

  const generateProtocol = useCallback(() => {
    const p = protocolType === 'co2'
      ? generateCO2Table(baseHold, cycles)
      : generateO2Table(baseHold, cycles);
    setProtocol(p);
  }, [protocolType, baseHold, cycles]);

  useEffect(() => { generateProtocol(); }, [generateProtocol]);

  const playBeep = useCallback((freq: number, dur: number) => {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
  }, [settings.sound]);

  const vibrateDevice = useCallback((pattern: number[]) => {
    if (!settings.vibration) return;
    try { navigator.vibrate?.(pattern); } catch {}
  }, [settings.vibration]);

  const startSession = useCallback(() => {
    if (protocol.length === 0) return;
    setSessionActive(true);
    setSessionPaused(false);
    setSessionDone(false);
    setCurrentCycle(0);
    setPhase('breathe');
    setActualHolds([]);
    setSessionStartTime(Date.now());
    const restTime = protocol[0].restSec;
    setPhaseDuration(restTime);
    setPhaseTimer(restTime);
    playBeep(440, 0.3);
    vibrateDevice([200]);
    setTab('session');
  }, [protocol, playBeep, vibrateDevice]);

  useEffect(() => {
    if (!sessionActive || sessionPaused || sessionDone) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionActive, sessionPaused, sessionDone, phase, currentCycle]);

  useEffect(() => {
    if (!sessionActive || sessionPaused || sessionDone) return;
    if (phaseTimer === 0 && phaseDuration > 0) {
      if (phase === 'breathe') {
        setPhase('hold');
        holdStartRef.current = Date.now();
        const holdTime = protocol[currentCycle]?.holdSec || 60;
        setPhaseDuration(holdTime);
        setPhaseTimer(holdTime);
        playBeep(660, 0.5);
        vibrateDevice([300, 100, 300]);
      } else {
        const actualHold = Math.round((Date.now() - holdStartRef.current) / 1000);
        setActualHolds(prev => [...prev, actualHold]);
        playBeep(880, 0.4);
        vibrateDevice([200]);
        const nextCycle = currentCycle + 1;
        if (nextCycle >= protocol.length) {
          setSessionDone(true);
          setSessionActive(false);
        } else {
          setCurrentCycle(nextCycle);
          setPhase('breathe');
          const restTime = protocol[nextCycle].restSec;
          setPhaseDuration(restTime);
          setPhaseTimer(restTime);
        }
      }
    }
  }, [phaseTimer]);

  const skipPhase = useCallback(() => {
    setPhaseTimer(1);
  }, []);

  const stopSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionActive(false);
    setSessionDone(false);
    setSessionPaused(false);
  }, []);

  const saveSession = useCallback(() => {
    if (actualHolds.length === 0) return;
    const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);
    const avg = Math.round(actualHolds.reduce((a, b) => a + b, 0) / actualHolds.length);
    const best = Math.max(...actualHolds);
    const record: SessionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: protocolType,
      cycles: actualHolds.length,
      totalTimeSec: totalTime,
      avgHoldSec: avg,
      bestHoldSec: best,
      actualHolds,
    };
    setHistory(prev => [record, ...prev].slice(0, 50));
    setSessionDone(false);
    setTab('history');
  }, [actualHolds, sessionStartTime, protocolType]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('pneumalog_history');
  }, []);

  const isDark = settings.theme === 'dark';

  const bgGradient = isDark
    ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'
    : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200';

  const cardBg = isDark
    ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
    : 'bg-white/70 border border-white/60 backdrop-blur-xl';

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-white/60' : 'text-slate-600';
  const textMuted = isDark ? 'text-white/30' : 'text-slate-400';

  const tabs = [
    { id: 'protocol', label: t.tabProtocol, icon: '⚗️' },
    { id: 'session', label: t.tabSession, icon: '🫧' },
    { id: 'history', label: t.tabHistory, icon: '📊' },
    { id: 'settings', label: t.tabSettings, icon: '⚙️' },
  ];

  const streak = (() => {
    if (history.length === 0) return 0;
    const dates = [...new Set(history.map(h => h.date.split('T')[0]))].sort().reverse();
    let s = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      if (dates[i] === expected) s++; else break;
    }
    return s;
  })();

  const todaySessions = history.filter(h => h.date.startsWith(new Date().toISOString().split('T')[0])).length;

  return (
    <div className={`min-h-screen ${bgGradient} ${textPrimary} font-sans overflow-x-hidden`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; width: 100%; }
        input[type=range]::-webkit-slider-track { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #60a5fa, #818cf8); cursor: pointer; margin-top: -8px; box-shadow: 0 0 10px rgba(96,165,250,0.5); }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pb-24 pt-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl"
            >🫁</motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <p className={`text-xs ${textSecondary} tracking-widest uppercase mt-0.5`}>{t.tagline}</p>
            </div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`flex justify-center gap-6 mt-4 ${cardBg} rounded-2xl px-6 py-3 inline-flex mx-auto`}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{todaySessions}</div>
              <div className={`text-xs ${textMuted}`}>{t.today}</div>
            </div>
            <div className={`w-px ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{streak}</div>
              <div className={`text-xs ${textMuted}`}>{t.streak} {t.days}</div>
            </div>
            <div className={`w-px ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{history.length}</div>
              <div className={`text-xs ${textMuted}`}>{t.sessions}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >

            {/* PROTOCOL TAB */}
            {tab === 'protocol' && (
              <div className="space-y-4">
                {/* Protocol Type */}
                <div className={`${cardBg} rounded-3xl p-5`}>
                  <div className="flex gap-2 mb-4">
                    {(['co2', 'o2'] as const).map(type => (
                      <motion.button
                        key={type}
                        onClick={() => setProtocolType(type)}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                          protocolType === type
                            ? type === 'co2'
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                            : `${isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`
                        }`}
                      >
                        {type === 'co2' ? `🫧 ${t.co2Table}` : `💎 ${t.o2Table}`}
                      </motion.button>
                    ))}
                  </div>
                  <p className={`text-xs ${textSecondary} text-center`}>
                    {protocolType === 'co2' ? t.co2Desc : t.o2Desc}
                  </p>
                </div>

                {/* Sliders */}
                <div className={`${cardBg} rounded-3xl p-5 space-y-5`}>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className={`text-sm font-medium ${textSecondary}`}>{t.baseHold}</label>
                      <motion.span
                        key={baseHold}
                        initial={{ scale: 1.3, color: '#60a5fa' }}
                        animate={{ scale: 1, color: isDark ? '#fff' : '#1e293b' }}
                        className="text-xl font-bold"
                      >{baseHold}{t.seconds}</motion.span>
                    </div>
                    <input type="range" min={20} max={300} step={5} value={baseHold}
                      onChange={e => setBaseHold(+e.target.value)}
                      className="w-full" />
                    <div className={`flex justify-between text-xs ${textMuted} mt-1`}>
                      <span>20s</span><span>5min</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className={`text-sm font-medium ${textSecondary}`}>{t.cycles}</label>
                      <motion.span
                        key={cycles}
                        initial={{ scale: 1.3, color: '#818cf8' }}
                        animate={{ scale: 1, color: isDark ? '#fff' : '#1e293b' }}
                        className="text-xl font-bold"
                      >{cycles}</motion.span>
                    </div>
                    <input type="range" min={4} max={16} step={1} value={cycles}
                      onChange={e => setCycles(+e.target.value)}
                      className="w-full" />
                    <div className={`flex justify-between text-xs ${textMuted} mt-1`}>
                      <span>4</span><span>16</span>
                    </div>
                  </div>
                </div>

                {/* Protocol Table */}
                {protocol.length > 0 && (
                  <div className={`${cardBg} rounded-3xl p-5`}>
                    <h3 className={`text-sm font-semibold ${textSecondary} mb-4 uppercase tracking-wider`}>{t.personal}</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {protocol.map((cycle, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-white'} ${textSecondary}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 flex gap-4">
                            <div className="text-center">
                              <div className="text-sm font-bold text-purple-400">{formatTime(cycle.holdSec)}</div>
                              <div className={`text-xs ${textMuted}`}>{t.holdTime}</div>
                            </div>
                            <div className={`w-px ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
                            <div className="text-center">
                              <div className="text-sm font-bold text-blue-400">{formatTime(cycle.restSec)}</div>
                              <div className={`text-xs ${textMuted}`}>{t.restTime}</div>
                            </div>
                          </div>
                          <div className="ml-auto">
                            <div className="h-2 w-20 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  background: 'linear-gradient(90deg, #818cf8, #60a5fa)',
                                  width: `${(cycle.holdSec / (protocol[protocol.length-1]?.holdSec || cycle.holdSec)) * 100}%`
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(cycle.holdSec / (protocol[protocol.length-1]?.holdSec || cycle.holdSec)) * 100}%` }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.button
                      onClick={startSession}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      className="w-full mt-4 py-4 rounded-2xl font-bold text-white text-lg"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                      }}
                    >
                      🌊 {t.startSession}
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {/* SESSION TAB */}
            {tab === 'session' && (
              <div className="space-y-4">
                {!sessionActive && !sessionDone && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${cardBg} rounded-3xl p-8 text-center`}
                  >
                    <div className="text-6xl mb-4">🌊</div>
                    <h2 className={`text-xl font-semibold ${textSecondary} mb-2`}>{t.ready}</h2>
                    <p className={`text-sm ${textMuted} mb-6`}>{t.tapToStart}</p>
                    <motion.button
                      onClick={startSession}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      className="px-8 py-4 rounded-2xl font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                      }}
                    >
                      {t.startSession}
                    </motion.button>
                  </motion.div>
                )}

                {sessionActive && (
                  <div className={`${cardBg} rounded-3xl p-6`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className={`text-xs ${textMuted} uppercase tracking-wider`}>
                          {t.cycleOf.split('').join('')} {currentCycle + 1} / {protocol.length}
                        </div>
                        <div className={`text-sm font-semibold mt-1 ${
                          phase === 'hold' ? 'text-cyan-400' : 'text-purple-400'
                        }`}>
                          {phase === 'hold' ? `💙 ${t.holding}` : `💜 ${t.breathing}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setSessionPaused(p => !p)}
                          whileTap={{ scale: 0.9 }}
                          className={`px-3 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}
                        >
                          {sessionPaused ? t.resumeSession : t.pauseSession}
                        </motion.button>
                        <motion.button
                          onClick={stopSession}
                          whileTap={{ scale: 0.9 }}
                          className="px-3 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          {t.stopSession}
                        </motion.button>
                      </div>
                    </div>

                    {/* Orb */}
                    <div className="flex items-center justify-center py-4">
                      <div className="relative w-64 h-64 flex items-center justify-center">
                        <CircularProgress
                          value={phaseDuration - phaseTimer}
                          max={phaseDuration}
                          size={256}
                          strokeWidth={4}
                          color={phase === 'hold' ? '#38bdf8' : '#a78bfa'}
                        />
                        <WaveOrb phase={phase} progress={phaseDuration > 0 ? (phaseDuration - phaseTimer) / phaseDuration : 0} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                          <motion.div
                            key={phaseTimer}
                            initial={{ scale: 1.2, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-5xl font-bold tracking-tight ${
                              phaseTimer <= 10 && phase === 'hold' ? 'text-red-400' : textPrimary
                            }`}
                          >
                            {formatTime(phaseTimer)}
                          </motion.div>
                          <div className={`text-xs ${textMuted} mt-1 uppercase tracking-widest`}>
                            {phase === 'hold' ? t.holding : t.breathing}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breathe guide */}
                    {phase === 'breathe' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center gap-4 mb-4"
                      >
                        {[t.inhale, t.exhale].map((label, i) => (
                          <motion.div
                            key={label}
                            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 2, ease: 'easeInOut' }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {i === 0 ? '↑' : '↓'} {label}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* Actual holds */}
                    {actualHolds.length > 0 && (
                      <div className="mt-4">
                        <div className={`text-xs ${textMuted} uppercase tracking-wider mb-2`}>{t.actualHold}</div>
                        <div className="flex gap-2 flex-wrap">
                          {actualHolds.map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                              style={{
                                background: h >= (protocol[i]?.holdSec || 0)
                                  ? 'rgba(34,197,94,0.2)'
                                  : 'rgba(239,68,68,0.2)',
                                color: h >= (protocol[i]?.holdSec || 0) ? '#4ade80' : '#f87171',
                              }}
                            >
                              <span className="font-bold">{h}s</span>
                              <span style={{ opacity: 0.6 }}>
                                {h >= (protocol[i]?.holdSec || 0) ? '✓' : '↓'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <motion.button
                      onClick={skipPhase}
                      whileTap={{ scale: 0.96 }}
                      className={`w-full mt-4 py-3 rounded-2xl text-sm font-medium ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-white/50' : 'bg-slate-200 hover:bg-slate-300 text-slate-500'
                      } transition-colors`}
                    >
                      {t.skip} →
                    </motion.button>
                  </div>
                )}

                {/* Session Complete */}
                {sessionDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`${cardBg} rounded-3xl p-8 text-center`}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: 3 }}
                      className="text-6xl mb-4"
                    >🏆</motion.div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                      {t.sessionComplete}
                    </h2>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: t.totalTime, value: formatTime(Math.round((Date.now() - sessionStartTime) / 1000)), color: 'text-blue-400' },
                        { label: t.avgHold, value: `${actualHolds.length > 0 ? Math.round(actualHolds.reduce((a,b)=>a+b,0)/actualHolds.length) : 0}s`, color: 'text-purple-400' },
                        { label: t.bestHold, value: `${actualHolds.length > 0 ? Math.max(...actualHolds) : 0}s`, color: 'text-cyan-400' },
                      ].map(stat => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`${isDark ? 'bg-white/5' : 'bg-slate-100'} rounded-2xl p-3`}
                        >
                          <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                          <div className={`text-xs ${textMuted} mt-0.5`}>{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={saveSession}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex-1 py-3 rounded-2xl font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', boxShadow: '0 8px 32px rgba(34,197,94,0.3)' }}
                      >
                        💾 {t.saveSession}
                      </motion.button>
                      <motion.button
                        onClick={() => { setSessionDone(false); setTab('protocol'); }}
                        whileTap={{ scale: 0.97 }}
                        className={`px-4 py-3 rounded-2xl font-medium ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}
                      >
                        ✕
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${cardBg} rounded-3xl p-12 text-center`}
                  >
                    <div className="text-5xl mb-4">📊</div>
                    <p className={textMuted}>{t.noHistory}</p>
                  </motion.div>
                ) : (
                  <>
                    {history.map((record, i) => {
                      const date = new Date(record.date);
                      const isToday = record.date.startsWith(new Date().toISOString().split('T')[0]);
                      return (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`${cardBg} rounded-2xl p-4`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  record.type === 'co2'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-cyan-500/20 text-cyan-400'
                                }`}>
                                  {record.type.toUpperCase()}
                                </span>
                                {isToday && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                                    {t.today}
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${textMuted} mt-1`}>
                                {date.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' '}{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold text-cyan-400`}>{record.bestHoldSec}s</div>
                              <div className={`text-xs ${textMuted}`}>{t.bestHold}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                              { label: t.cycles, value: record.cycles, color: 'text-blue-400' },
                              { label: t.avgHold, value: `${record.avgHoldSec}s`, color: 'text-purple-400' },
                              { label: t.totalTime, value: formatTime(record.totalTimeSec), color: 'text-green-400' },
                            ].map(s => (
                              <div key={s.label} className={`${isDark ? 'bg-white/5' : 'bg-slate-100'} rounded-xl p-2 text-center`}>
                                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                                <div className={`text-xs ${textMuted}`}>{s.label}</div>
                              </div>
                            ))}
                          </div>
                          {/* Mini sparkline */}
                          <div className="mt-3 flex items-end gap-1 h-8">
                            {record.actualHolds.map((h, j) => (
                              <motion.div
                                key={j}
                                initial={{ height: 0 }}
                                animate={{ height: `${(h / Math.max(...record.actualHolds)) * 100}%` }}
                                transition={{ delay: i * 0.05 + j * 0.03 }}
                                className="flex-1 rounded-sm"
                                style={{
                                  background: h >= record.avgHoldSec ? '#818cf8' : '#60a5fa',
                                  minHeight: '4px',
                                  opacity: 0.7,
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                    <motion.button
                      onClick={clearHistory}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-3 rounded-2xl text-sm font-medium mt-2 ${
                        isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-100 text-red-500 hover:bg-red-200'
                      } transition-colors`}
                    >
                      🗑 {t.clearHistory}
                    </motion.button>
                  </>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {tab === 'settings' && (
              <div className="space-y-4">
                <div className={`${cardBg} rounded-3xl p-5 space-y-4`}>
                  <h2 className={`text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>{t.settingsTitle}</h2>

                  {([
                    { key: 'sound', label: t.soundOn, icon: '🔔' },
                    { key: 'vibration', label: t.vibration, icon: '📳' },
                  ] as const).map(item => (
                    <motion.div
                      key={item.key}
                      className={`flex items-center justify-between p-3 rounded-2xl ${
                        isDark ? 'bg-white/5' : 'bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className={`text-sm font-medium`}>{item.label}</span>
                      </div>
                      <motion.button
                        onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key as keyof Settings] }))}
                        whileTap={{ scale: 0.95 }}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                          settings[item.key as keyof Settings]
                            ? 'bg-blue-500'
                            : isDark ? 'bg-white/20' : 'bg-slate-300'
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ left: settings[item.key as keyof Settings] ? '26px' : '2px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </motion.div>
                  ))}

                  <motion.div
                    className={`flex items-center justify-between p-3 rounded-2xl ${
                      isDark ? 'bg-white/5' : 'bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎨</span>
                      <span className={`text-sm font-medium`}>{t.theme}</span>
                    </div>
                    <div className="flex gap-2">
                      {(['dark', 'light'] as const).map(th => (
                        <motion.button
                          key={th}
                          onClick={() => setSettings(s => ({ ...s, theme: th }))}
                          whileTap={{ scale: 0.9 }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            settings.theme === th
                              ? 'bg-blue-500 text-white'
                              : isDark ? 'bg-white/10 text-white/50' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {th === 'dark' ? `🌙 ${t.dark}` : `☀️ ${t.light}`}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* About */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`${cardBg} rounded-3xl p-5`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🫁</div>
                    <h3 className={`text-sm font-bold mb-1`}>{t.appTitle}</h3>
                    <p className={`text-xs ${textMuted}`}>{t.tagline}</p>
                    <div className={`mt-3 pt-3 border-t ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    } text-xs ${textMuted}`}>
                      CO₂ & O₂ Freediving Table Generator
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40, delay: 0.2 }}
        className={`fixed bottom-0 left-0 right-0 ${
          isDark ? 'bg-slate-950/80 border-t border-white/10' : 'bg-white/80 border-t border-slate-200'
        } backdrop-blur-2xl px-4 pb-safe`}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(({ id, label, icon }) => (
            <motion.button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              whileTap={{ scale: 0.9 }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 ${
                tab === id
                  ? 'text-blue-400'
                  : `${textMuted} hover:text-white/50`
              }`}
            >
              <motion.span
                className="text-lg"
                animate={{ scale: tab === id ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                {icon}
              </motion.span>
              <span className={`text-xs font-medium`}>{label}</span>
              {tab === id && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-2 w-1 h-1 rounded-full bg-blue-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}