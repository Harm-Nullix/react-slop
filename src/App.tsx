import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = 'nl' | 'en';
type Intensity = 'low' | 'medium' | 'high';
type Session = {
  id: string;
  date: string;
  durationMin: number;
  intensity: Intensity;
  fatigue: number; // 0-100
  recoveryMin: number;
  notes: string;
};
type RecoveryPhase = 'ready' | 'recovering' | 'peak';

// ─── i18n ─────────────────────────────────────────────────────────────────────
const t: Record<string, Record<Lang, string>> = {
  appName: { nl: 'EmbouSync', en: 'EmbouSync' },
  tagline: { nl: 'Embouchure Herstel Tracker', en: 'Embouchure Recovery Tracker' },
  infoTitle: { nl: 'Wat is EmbouSync?', en: 'What is EmbouSync?' },
  infoBody: {
    nl: 'Voor de ~80 miljoen professionele blaasmuzikanten wereldwijd: log je oefensessies, meet je embouchure-vermoeidheid en ontvang een gepersonaliseerd herstelprotocol. Embouchure-vermoeidheid is een onderschat beroepsrisico bij trompettisten, hoornspelers, fluitisten en glasblazers.',
    en: 'For the ~80 million professional wind instrument players worldwide: log your practice sessions, measure your embouchure fatigue, and receive a personalized recovery protocol. Embouchure fatigue is an underestimated occupational risk for trumpet, horn, flute players, and glass blowers.',
  },
  newSession: { nl: 'Nieuwe Sessie', en: 'New Session' },
  duration: { nl: 'Speelduur (min)', en: 'Duration (min)' },
  intensity: { nl: 'Intensiteit', en: 'Intensity' },
  low: { nl: 'Laag', en: 'Low' },
  medium: { nl: 'Middel', en: 'Medium' },
  high: { nl: 'Hoog', en: 'High' },
  fatigue: { nl: 'Vermoeidheidsgevoel', en: 'Fatigue Level' },
  notes: { nl: 'Notities', en: 'Notes' },
  save: { nl: 'Opslaan', en: 'Save' },
  cancel: { nl: 'Annuleren', en: 'Cancel' },
  history: { nl: 'Sessiegeschiedenis', en: 'Session History' },
  noSessions: { nl: 'Nog geen sessies gelogd.', en: 'No sessions logged yet.' },
  recoveryTime: { nl: 'Hersteladvies', en: 'Recovery Advice' },
  minutes: { nl: 'min rust aanbevolen', en: 'min rest recommended' },
  readyToPlay: { nl: 'Klaar om te spelen!', en: 'Ready to play!' },
  recovering: { nl: 'Herstellende…', en: 'Recovering…' },
  peakState: { nl: 'Piek staat!', en: 'Peak state!' },
  timerStart: { nl: 'Start Timer', en: 'Start Timer' },
  timerStop: { nl: 'Stop', en: 'Stop' },
  timerReset: { nl: 'Reset', en: 'Reset' },
  liveSession: { nl: 'Live Sessie', en: 'Live Session' },
  weekOverview: { nl: 'Week Overzicht', en: 'Week Overview' },
  totalMinutes: { nl: 'Totale minuten', en: 'Total minutes' },
  avgFatigue: { nl: 'Gem. vermoeidheid', en: 'Avg fatigue' },
  sessions: { nl: 'sessies', en: 'sessions' },
  delete: { nl: 'Verwijder', en: 'Delete' },
  embouchureScore: { nl: 'Embouchure Score', en: 'Embouchure Score' },
  today: { nl: 'Vandaag', en: 'Today' },
  placeholder_notes: { nl: 'Bijv. hoge noten waren zwaar...', en: 'E.g. high notes felt heavy...' },
};

// ─── Utils ────────────────────────────────────────────────────────────────────
const getLang = (): Lang => {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.startsWith('nl') ? 'nl' : 'en';
};

const calcRecovery = (durationMin: number, intensity: Intensity, fatigue: number): number => {
  const base = intensity === 'high' ? 1.8 : intensity === 'medium' ? 1.2 : 0.7;
  return Math.round((durationMin * base * (fatigue / 60)) + 10);
};

const scoreColor = (score: number) => {
  if (score >= 80) return '#22d3ee';
  if (score >= 55) return '#a78bfa';
  if (score >= 30) return '#fb923c';
  return '#f43f5e';
};

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// ─── Radial Score Ring ────────────────────────────────────────────────────────
const ScoreRing = ({ score, color, label }: { score: number; color: string; label: string }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-black"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >{score}</motion.span>
        <span className="text-xs text-white/50 mt-0.5">{label}</span>
      </div>
    </div>
  );
};

// ─── Fatigue Slider ───────────────────────────────────────────────────────────
const FatigueSlider = ({ value, onChange, lang }: { value: number; onChange: (v: number) => void; lang: Lang }) => {
  const colors = ['#22d3ee', '#a78bfa', '#fb923c', '#f43f5e'];
  const idx = Math.floor((value / 100) * (colors.length - 1));
  const color = colors[Math.min(idx, colors.length - 1)];
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/40 mb-2">
        <span>0</span>
        <span style={{ color }} className="font-bold text-sm">{value}</span>
        <span>100</span>
      </div>
      <div className="relative h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="absolute h-3 rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, #6366f1, ${color})`, boxShadow: `0 0 12px ${color}80` }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
          style={{ zIndex: 2 }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2"
          style={{ left: `calc(${value}% - 10px)`, background: color, borderColor: '#1e1b4b', boxShadow: `0 0 12px ${color}` }}
          animate={{ left: `calc(${value}% - 10px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
};

// ─── Waveform Visualizer ──────────────────────────────────────────────────────
const WaveVisualizer = ({ active, intensity }: { active: boolean; intensity: Intensity }) => {
  const bars = 32;
  const amps: Record<Intensity, number> = { low: 0.3, medium: 0.6, high: 1.0 };
  return (
    <div className="flex items-center justify-center gap-0.5 h-14">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ background: 'linear-gradient(180deg, #818cf8, #6366f1)' }}
          animate={active ? {
            height: [
              4,
              Math.random() * 40 * amps[intensity] + 4,
              Math.random() * 30 * amps[intensity] + 4,
              4,
            ],
            opacity: [0.5, 1, 0.8, 0.5],
          } : { height: 4, opacity: 0.3 }}
          transition={active ? {
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: 'mirror',
            delay: i * 0.02,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
};

// ─── Recovery Timeline ────────────────────────────────────────────────────────
const RecoveryTimeline = ({ minutes, lang }: { minutes: number; lang: Lang }) => {
  const phases = [
    { pct: 0, label: lang === 'nl' ? 'Stop' : 'Stop' },
    { pct: 30, label: lang === 'nl' ? 'Ontspanning' : 'Relax' },
    { pct: 60, label: lang === 'nl' ? 'Herstel' : 'Recovery' },
    { pct: 100, label: lang === 'nl' ? 'Klaar' : 'Ready' },
  ];
  return (
    <div className="w-full relative mt-4">
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #6366f1, #22d3ee)' }}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {phases.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: '#818cf8' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
            />
            <span className="text-xs text-white/40 mt-1">{p.label}</span>
            {i > 0 && <span className="text-xs text-white/30">{Math.round((p.pct / 100) * minutes)}m</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Particle Background ──────────────────────────────────────────────────────
const ParticleBg = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
    {Array.from({ length: 18 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: Math.random() * 4 + 1,
          height: Math.random() * 4 + 1,
          background: i % 3 === 0 ? '#818cf8' : i % 3 === 1 ? '#22d3ee' : '#a78bfa',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: 0.15 + Math.random() * 0.2,
        }}
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 6 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 4, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang] = useState<Lang>(getLang());
  const [sessions, setSessions] = useState<Session[]>(() => {
    try { return JSON.parse(localStorage.getItem('embousync_sessions') || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timer' | 'history'>('dashboard');

  // Form state
  const [formDuration, setFormDuration] = useState(30);
  const [formIntensity, setFormIntensity] = useState<Intensity>('medium');
  const [formFatigue, setFormFatigue] = useState(50);
  const [formNotes, setFormNotes] = useState('');

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMs, setTimerMs] = useState(0);
  const [timerIntensity, setTimerIntensity] = useState<Intensity>('medium');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const accRef = useRef<number>(0);

  // Page title
  useEffect(() => {
    document.title = `EmbouSync – ${t.tagline[lang]}`;
  }, [lang]);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('embousync_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimerMs(accRef.current + Date.now() - startRef.current);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      accRef.current = timerMs;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerMs(0);
    accRef.current = 0;
  };

  const handleTimerSave = () => {
    const durationMin = Math.max(1, Math.round(timerMs / 60000));
    const fatigue = timerIntensity === 'high' ? 75 : timerIntensity === 'medium' ? 50 : 25;
    const s: Session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationMin,
      intensity: timerIntensity,
      fatigue,
      recoveryMin: calcRecovery(durationMin, timerIntensity, fatigue),
      notes: '',
    };
    setSessions(prev => [s, ...prev]);
    handleTimerReset();
    setActiveTab('dashboard');
  };

  const handleSaveSession = () => {
    const s: Session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationMin: formDuration,
      intensity: formIntensity,
      fatigue: formFatigue,
      recoveryMin: calcRecovery(formDuration, formIntensity, formFatigue),
      notes: formNotes,
    };
    setSessions(prev => [s, ...prev]);
    setShowForm(false);
    setFormDuration(30); setFormIntensity('medium'); setFormFatigue(50); setFormNotes('');
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Dashboard metrics
  const last7 = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 7 * 24 * 3600 * 1000;
  });
  const totalMin = last7.reduce((a, s) => a + s.durationMin, 0);
  const avgFatigue = last7.length ? Math.round(last7.reduce((a, s) => a + s.fatigue, 0) / last7.length) : 0;
  const embScore = Math.max(0, 100 - avgFatigue - Math.min(40, totalMin / 10));
  const lastSession = sessions[0];
  const recoveryPhase: RecoveryPhase = lastSession
    ? embScore >= 75 ? 'peak' : embScore >= 40 ? 'recovering' : 'ready'
    : 'ready';

  const intensityColors: Record<Intensity, string> = { low: '#22d3ee', medium: '#a78bfa', high: '#f43f5e' };

  const tabs = [
    { id: 'dashboard', icon: '◉', label: lang === 'nl' ? 'Dashboard' : 'Dashboard' },
    { id: 'timer', icon: '▶', label: lang === 'nl' ? 'Timer' : 'Timer' },
    { id: 'history', icon: '≡', label: lang === 'nl' ? 'Geschiedenis' : 'History' },
  ] as const;

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #0d1117 100%)' }}>
      <ParticleBg />
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="relative" style={{ zIndex: 1, maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <motion.header
          className="px-5 pt-8 pb-4 flex items-center justify-between"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
                whileHover={{ rotate: 15, scale: 1.1 }}
              >𝄞</motion.div>
              <h1 className="text-xl font-black text-white tracking-tight">{t.appName[lang]}</h1>
            </div>
            <p className="text-xs text-white/40 mt-0.5 ml-10">{t.tagline[lang]}</p>
          </div>
          <motion.button
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.95 }}
          >?</motion.button>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 px-5 pb-28">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                {/* Score card */}
                <motion.div
                  className="rounded-3xl p-6 mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(129,140,248,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-white/40 mb-1">{t.embouchureScore[lang]}</p>
                      <motion.div
                        className="text-5xl font-black"
                        style={{ color: scoreColor(embScore), textShadow: `0 0 20px ${scoreColor(embScore)}60` }}
                        key={embScore}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >{embScore}</motion.div>
                      <div className="flex items-center gap-2 mt-2">
                        <motion.div
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: recoveryPhase === 'peak' ? 'rgba(34,211,238,0.15)' : recoveryPhase === 'recovering' ? 'rgba(167,139,250,0.15)' : 'rgba(34,197,94,0.15)',
                            color: recoveryPhase === 'peak' ? '#22d3ee' : recoveryPhase === 'recovering' ? '#a78bfa' : '#22c55e',
                            border: `1px solid ${recoveryPhase === 'peak' ? 'rgba(34,211,238,0.3)' : recoveryPhase === 'recovering' ? 'rgba(167,139,250,0.3)' : 'rgba(34,197,94,0.3)'}`,
                          }}
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {recoveryPhase === 'peak' ? t.peakState[lang] : recoveryPhase === 'recovering' ? t.recovering[lang] : t.readyToPlay[lang]}
                        </motion.div>
                      </div>
                    </div>
                    <ScoreRing score={embScore} color={scoreColor(embScore)} label={t.today[lang]} />
                  </div>
                </motion.div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: t.totalMinutes[lang], value: totalMin, unit: 'min', color: '#818cf8' },
                    { label: t.avgFatigue[lang], value: avgFatigue, unit: '%', color: scoreColor(100 - avgFatigue) },
                    { label: t.sessions[lang], value: last7.length, unit: '/ 7d', color: '#22d3ee' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      className="rounded-2xl p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.07)' }}
                    >
                      <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-white/30" style={{ fontSize: 10 }}>{stat.unit}</div>
                      <div className="text-xs text-white/40 mt-0.5" style={{ fontSize: 10, lineHeight: 1.2 }}>{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Last session recovery */}
                {lastSession && (
                  <motion.div
                    className="rounded-3xl p-5 mb-4"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <p className="text-xs text-white/40 mb-1 font-semibold uppercase tracking-widest">{t.recoveryTime[lang]}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black" style={{ color: '#a78bfa' }}>{lastSession.recoveryMin}</span>
                      <span className="text-sm text-white/40">{t.minutes[lang]}</span>
                    </div>
                    <RecoveryTimeline minutes={lastSession.recoveryMin} lang={lang} />
                  </motion.div>
                )}

                {/* Log session CTA */}
                <motion.button
                  onClick={() => setShowForm(true)}
                  className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <span style={{ fontSize: 18 }}>+</span> {t.newSession[lang]}
                </motion.button>
              </motion.div>
            )}

            {activeTab === 'timer' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div
                  className="rounded-3xl p-6 mb-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-xs text-white/40 mb-4 font-semibold uppercase tracking-widest text-center">{t.liveSession[lang]}</p>
                  <WaveVisualizer active={timerRunning} intensity={timerIntensity} />
                  <motion.div
                    className="text-center my-6"
                    animate={timerRunning ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="text-6xl font-black tabular-nums" style={{ color: timerRunning ? '#818cf8' : 'rgba(255,255,255,0.6)', textShadow: timerRunning ? '0 0 30px rgba(129,140,248,0.5)' : 'none', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(timerMs)}
                    </span>
                  </motion.div>

                  {/* Intensity selector */}
                  <div className="flex gap-2 mb-5 justify-center">
                    {(['low', 'medium', 'high'] as Intensity[]).map(inten => (
                      <motion.button
                        key={inten}
                        onClick={() => setTimerIntensity(inten)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold"
                        style={{
                          background: timerIntensity === inten ? `${intensityColors[inten]}25` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${timerIntensity === inten ? intensityColors[inten] : 'rgba(255,255,255,0.08)'}`,
                          color: timerIntensity === inten ? intensityColors[inten] : 'rgba(255,255,255,0.4)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                      >{t[inten][lang]}</motion.button>
                    ))}
                  </div>

                  {/* Timer controls */}
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      onClick={() => setTimerRunning(r => !r)}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                      style={{ background: timerRunning ? 'rgba(244,63,94,0.2)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: timerRunning ? '1px solid rgba(244,63,94,0.4)' : 'none', color: 'white', boxShadow: timerRunning ? '0 0 20px rgba(244,63,94,0.2)' : '0 8px 24px rgba(99,102,241,0.35)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >{timerRunning ? t.timerStop[lang] : t.timerStart[lang]}</motion.button>
                    <motion.button
                      onClick={handleTimerReset}
                      className="px-4 py-3.5 rounded-2xl font-bold text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >{t.timerReset[lang]}</motion.button>
                  </div>

                  {timerMs > 30000 && !timerRunning && (
                    <motion.button
                      onClick={handleTimerSave}
                      className="w-full mt-3 py-3 rounded-2xl font-bold text-sm"
                      style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >{t.save[lang]}</motion.button>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-xs text-white/40 mb-4 font-semibold uppercase tracking-widest">{t.history[lang]}</p>
                {sessions.length === 0 ? (
                  <motion.div
                    className="rounded-2xl p-8 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-4xl mb-3">𝄞</div>
                    <p className="text-white/30 text-sm">{t.noSessions[lang]}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s, i) => (
                      <motion.div
                        key={s.id}
                        className="rounded-2xl p-4"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.06)' }}
                        layout
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold text-sm">{s.durationMin} min</span>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: `${intensityColors[s.intensity]}20`, color: intensityColors[s.intensity], border: `1px solid ${intensityColors[s.intensity]}40` }}
                              >{t[s.intensity][lang]}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/40">
                              <span>{new Date(s.date).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              <span>↻ {s.recoveryMin}min</span>
                              <span style={{ color: scoreColor(100 - s.fatigue) }}>⚡ {s.fatigue}%</span>
                            </div>
                            {s.notes && <p className="text-xs text-white/30 mt-1 italic">{s.notes}</p>}
                          </div>
                          <motion.button
                            onClick={() => deleteSession(s.id)}
                            className="ml-2 w-7 h-7 rounded-xl flex items-center justify-center text-xs"
                            style={{ background: 'rgba(244,63,94,0.1)', color: 'rgba(244,63,94,0.6)' }}
                            whileHover={{ scale: 1.1, background: 'rgba(244,63,94,0.2)' }}
                            whileTap={{ scale: 0.9 }}
                          >×</motion.button>
                        </div>
                        {/* Fatigue bar */}
                        <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <motion.div
                            className="h-1 rounded-full"
                            style={{ background: `linear-gradient(90deg, #6366f1, ${scoreColor(100 - s.fatigue)})` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.fatigue}%` }}
                            transition={{ delay: i * 0.06 + 0.2, duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full pb-6 px-5" style={{ maxWidth: 480, zIndex: 10 }}>
          <motion.div
            className="rounded-2xl flex overflow-hidden"
            style={{ background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.3 }}
          >
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3.5 flex flex-col items-center gap-1 text-xs font-medium relative"
                style={{ color: activeTab === tab.id ? '#818cf8' : 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: 'rgba(99,102,241,0.1)' }}
                    layoutId="navActive"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span style={{ fontSize: 16, position: 'relative' }}>{tab.icon}</span>
                <span style={{ position: 'relative', fontSize: 10 }}>{tab.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </nav>
      </div>

      {/* Log Session Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 flex items-end justify-center"
            style={{ zIndex: 50 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowForm(false)} />
            <motion.div
              className="relative w-full rounded-t-3xl p-6 pb-10"
              style={{ maxWidth: 480, background: 'linear-gradient(180deg, #1a1040 0%, #0f0c29 100%)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 250, damping: 28 }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <h2 className="text-lg font-bold text-white mb-5">{t.newSession[lang]}</h2>

              {/* Duration */}
              <div className="mb-5">
                <label className="text-xs text-white/40 block mb-2">{t.duration[lang]}: <span className="text-white font-bold">{formDuration}</span></label>
                <div className="relative h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="absolute h-3 rounded-full" style={{ width: `${(formDuration / 180) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} animate={{ width: `${(formDuration / 180) * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  <input type="range" min={5} max={180} step={5} value={formDuration} onChange={e => setFormDuration(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-3" style={{ zIndex: 2 }} />
                </div>
              </div>

              {/* Intensity */}
              <div className="mb-5">
                <label className="text-xs text-white/40 block mb-2">{t.intensity[lang]}</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as Intensity[]).map(inten => (
                    <motion.button
                      key={inten}
                      onClick={() => setFormIntensity(inten)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{
                        background: formIntensity === inten ? `${intensityColors[inten]}25` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${formIntensity === inten ? intensityColors[inten] : 'rgba(255,255,255,0.08)'}`,
                        color: formIntensity === inten ? intensityColors[inten] : 'rgba(255,255,255,0.4)',
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >{t[inten][lang]}</motion.button>
                  ))}
                </div>
              </div>

              {/* Fatigue */}
              <div className="mb-5">
                <label className="text-xs text-white/40 block mb-2">{t.fatigue[lang]}</label>
                <FatigueSlider value={formFatigue} onChange={setFormFatigue} lang={lang} />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-xs text-white/40 block mb-2">{t.notes[lang]}</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder={t.placeholder_notes[lang]}
                  rows={2}
                  className="w-full rounded-xl p-3 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', outline: 'none' }}
                />
              </div>

              {/* Recovery preview */}
              <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <p className="text-xs text-white/40">{t.recoveryTime[lang]}: <span className="text-purple-300 font-bold">{calcRecovery(formDuration, formIntensity, formFatigue)} {t.minutes[lang]}</span></p>
              </div>

              <div className="flex gap-3">
                <motion.button onClick={() => setShowForm(false)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }} whileTap={{ scale: 0.97 }}>{t.cancel[lang]}</motion.button>
                <motion.button onClick={handleSaveSession} className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>{t.save[lang]}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center px-5"
            style={{ zIndex: 50 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }} onClick={() => setShowInfo(false)} />
            <motion.div
              className="relative w-full rounded-3xl p-7"
              style={{ maxWidth: 440, background: 'linear-gradient(135deg, rgba(26,16,64,0.98) 0%, rgba(15,12,41,0.98) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 250 }}
            >
              <div className="text-4xl mb-4 text-center">𝄞</div>
              <h2 className="text-xl font-black text-white mb-3 text-center">{t.infoTitle[lang]}</h2>
              <p className="text-sm text-white/60 leading-relaxed mb-6">{t.infoBody[lang]}</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { icon: '🎺', label: lang === 'nl' ? 'Koper' : 'Brass' },
                  { icon: '🪈', label: lang === 'nl' ? 'Hout' : 'Wind' },
                  { icon: '🏺', label: lang === 'nl' ? 'Glasblazen' : 'Glass' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="rounded-2xl p-3 text-center"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.08, type: 'spring' }}
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs text-white/50">{item.label}</div>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={() => setShowInfo(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >{lang === 'nl' ? 'Begrepen!' : 'Got it!'}</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
