import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

const TRANSLATIONS = {
  en: {
    appTitle: 'OsmoTrack',
    appSubtitle: 'Hypertonic Fluid & Salt Architect',
    infoTitle: 'About OsmoTrack',
    infoText: 'For the ~80 million endurance athletes worldwide who risk hyponatremia — dangerously low sodium from over-hydration during long efforts. OsmoTrack calculates your personal sweat rate, sodium loss, and rehydration protocol based on your unique physiology and conditions. All data saved locally.',
    tabProfile: 'Profile',
    tabSession: 'Session',
    tabProtocol: 'Protocol',
    tabHistory: 'History',
    weightBefore: 'Weight Before (kg)',
    weightAfter: 'Weight After (kg)',
    duration: 'Duration (min)',
    fluidConsumed: 'Fluid Consumed (L)',
    temp: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    intensity: 'Intensity',
    intensityLow: 'Low',
    intensityMed: 'Medium',
    intensityHigh: 'High',
    calculate: 'Calculate Protocol',
    sweatRate: 'Sweat Rate',
    sodiumLoss: 'Sodium Loss',
    fluidNeeded: 'Rehydration Target',
    sodiumNeeded: 'Sodium Target',
    perHour: '/hr',
    mgTotal: 'mg total',
    litersTotal: 'L total',
    protocol: 'Your Protocol',
    drinkEvery: 'Drink every',
    minutes: 'min',
    sodiumPer: 'Sodium per serving',
    saveSession: 'Save Session',
    saved: 'Session saved!',
    noHistory: 'No sessions yet',
    clearHistory: 'Clear History',
    bodyWeight: 'Body Weight (kg)',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    saveProfile: 'Save Profile',
    profileSaved: 'Profile saved!',
    saltType: 'Salt Sensitivity',
    saltLow: 'Low Sweater',
    saltMed: 'Moderate Sweater',
    saltHigh: 'Heavy / Salty Sweater',
    hypoRisk: 'Hyponatremia Risk',
    low: 'Low',
    moderate: 'Moderate',
    high: 'HIGH',
    warning: '⚠ High risk detected — prioritize electrolytes over plain water',
    lperhr: 'L/hr',
    sessionsLogged: 'sessions logged',
    avgSweatRate: 'Avg Sweat Rate',
    trend: 'Trend',
    stable: 'Stable',
    increasing: 'Increasing',
    decreasing: 'Decreasing',
  },
  nl: {
    appTitle: 'OsmoTrack',
    appSubtitle: 'Hypertonisch Vocht & Zout Architect',
    infoTitle: 'Over OsmoTrack',
    infoText: 'Voor de ~80 miljoen duursporters wereldwijd die risico lopen op hyponatriëmie — gevaarlijk laag natrium door te veel water drinken tijdens lange inspanning. OsmoTrack berekent jouw persoonlijke zweettempo, natriumverlies en rehydratieprotocol op basis van jouw unieke fysiologie. Alle data lokaal opgeslagen.',
    tabProfile: 'Profiel',
    tabSession: 'Sessie',
    tabProtocol: 'Protocol',
    tabHistory: 'Geschiedenis',
    weightBefore: 'Gewicht voor (kg)',
    weightAfter: 'Gewicht na (kg)',
    duration: 'Duur (min)',
    fluidConsumed: 'Gedronken vocht (L)',
    temp: 'Temperatuur (°C)',
    humidity: 'Luchtvochtigheid (%)',
    intensity: 'Intensiteit',
    intensityLow: 'Laag',
    intensityMed: 'Gemiddeld',
    intensityHigh: 'Hoog',
    calculate: 'Bereken Protocol',
    sweatRate: 'Zweettempo',
    sodiumLoss: 'Natriumverlies',
    fluidNeeded: 'Rehydratiedoel',
    sodiumNeeded: 'Natriumdoel',
    perHour: '/uur',
    mgTotal: 'mg totaal',
    litersTotal: 'L totaal',
    protocol: 'Jouw Protocol',
    drinkEvery: 'Drink elke',
    minutes: 'min',
    sodiumPer: 'Natrium per portie',
    saveSession: 'Sessie opslaan',
    saved: 'Sessie opgeslagen!',
    noHistory: 'Nog geen sessies',
    clearHistory: 'Geschiedenis wissen',
    bodyWeight: 'Lichaamsgewicht (kg)',
    age: 'Leeftijd',
    gender: 'Geslacht',
    male: 'Man',
    female: 'Vrouw',
    other: 'Anders',
    saveProfile: 'Profiel opslaan',
    profileSaved: 'Profiel opgeslagen!',
    saltType: 'Zoutgevoeligheid',
    saltLow: 'Weinig zweter',
    saltMed: 'Gemiddeld zweter',
    saltHigh: 'Zware / zoute zweter',
    hypoRisk: 'Hyponatriëmie risico',
    low: 'Laag',
    moderate: 'Matig',
    high: 'HOOG',
    warning: '⚠ Hoog risico — prioriteer elektrolyten boven gewoon water',
    lperhr: 'L/uur',
    sessionsLogged: 'sessies gelogd',
    avgSweatRate: 'Gem. zweettempo',
    trend: 'Trend',
    stable: 'Stabiel',
    increasing: 'Stijgend',
    decreasing: 'Dalend',
  },
};

type Lang = 'en' | 'nl';
type Tab = 'profile' | 'session' | 'protocol' | 'history';

interface Profile {
  weight: number;
  age: number;
  gender: string;
  saltSensitivity: 'low' | 'medium' | 'high';
}

interface SessionInput {
  weightBefore: number;
  weightAfter: number;
  duration: number;
  fluidConsumed: number;
  temp: number;
  humidity: number;
  intensity: 'low' | 'medium' | 'high';
}

interface SessionResult {
  sweatRate: number;
  sodiumLossTotal: number;
  fluidNeeded: number;
  sodiumNeeded: number;
  hypoRisk: 'low' | 'moderate' | 'high';
  drinkInterval: number;
  sodiumPerServing: number;
}

interface SavedSession {
  date: string;
  input: SessionInput;
  result: SessionResult;
}

const SODIUM_RATES = { low: 600, medium: 900, high: 1200 };

function calcSession(input: SessionInput, profile: Profile): SessionResult {
  const weightLoss = Math.max(0, input.weightBefore - input.weightAfter);
  const totalSweat = weightLoss + input.fluidConsumed;
  const hours = input.duration / 60;
  const sweatRate = hours > 0 ? totalSweat / hours : 0;

  const baseNa = SODIUM_RATES[profile.saltSensitivity];
  const tempFactor = 1 + Math.max(0, (input.temp - 20)) * 0.02;
  const humidFactor = 1 + Math.max(0, (input.humidity - 50)) * 0.005;
  const intensityFactor = input.intensity === 'high' ? 1.3 : input.intensity === 'medium' ? 1.0 : 0.75;

  const sodiumPerLiter = baseNa * tempFactor * humidFactor * intensityFactor;
  const sodiumLossTotal = totalSweat * sodiumPerLiter;
  const fluidNeeded = weightLoss * 1.5;
  const sodiumNeeded = Math.round(sodiumLossTotal);

  let hypoRisk: 'low' | 'moderate' | 'high' = 'low';
  const ratioFluidToSweat = input.fluidConsumed / (totalSweat || 1);
  if (ratioFluidToSweat > 0.9 && input.duration > 90) hypoRisk = 'high';
  else if (ratioFluidToSweat > 0.7 && input.duration > 60) hypoRisk = 'moderate';

  const servingSize = 0.25;
  const drinkInterval = sweatRate > 0 ? Math.round((servingSize / (sweatRate / 60))) : 20;
  const sodiumPerServing = Math.round(sodiumPerLiter * servingSize);

  return { sweatRate: +sweatRate.toFixed(2), sodiumLossTotal: +sodiumLossTotal.toFixed(0), fluidNeeded: +fluidNeeded.toFixed(2), sodiumNeeded, hypoRisk, drinkInterval: Math.max(10, Math.min(30, drinkInterval)), sodiumPerServing };
}

function useLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('nl') ? 'nl' : 'en';
}

const ParticleField = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsla(${180 + Math.random() * 60}, 80%, 65%, 0.4)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

const RippleButton = ({ onClick, children, className = '', disabled = false }: { onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean }) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { x, y, id }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 700);
    onClick?.();
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden select-none ${className}`}
    >
      {ripples.map(r => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 10, opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      ))}
      {children}
    </button>
  );
};

const GlowCard = ({ children, className = '', glow = 'cyan' }: { children: React.ReactNode; className?: string; glow?: string }) => {
  const glowColors: Record<string, string> = {
    cyan: 'shadow-[0_0_30px_rgba(34,211,238,0.15)] border-cyan-500/20',
    teal: 'shadow-[0_0_30px_rgba(20,184,166,0.15)] border-teal-500/20',
    orange: 'shadow-[0_0_30px_rgba(251,146,60,0.15)] border-orange-500/20',
    red: 'shadow-[0_0_30px_rgba(239,68,68,0.2)] border-red-500/30',
  };
  return (
    <motion.div
      className={`bg-white/5 backdrop-blur-md border rounded-2xl ${glowColors[glow] || glowColors.cyan} ${className}`}
      whileHover={{ scale: 1.005, boxShadow: '0 0 40px rgba(34,211,238,0.25)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {children}
    </motion.div>
  );
};

const StatPill = ({ label, value, unit, color = 'cyan' }: { label: string; value: string | number; unit?: string; color?: string }) => {
  const colors: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-teal-500/20 border-cyan-400/30 text-cyan-300',
    teal: 'from-teal-500/20 to-emerald-500/20 border-teal-400/30 text-teal-300',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-400/30 text-orange-300',
    red: 'from-red-500/20 to-rose-500/20 border-red-400/30 text-red-300',
  };
  return (
    <motion.div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3 flex flex-col gap-0.5`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <span className="text-xs text-white/50 font-medium tracking-wide uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <motion.span
          className={`text-2xl font-bold ${colors[color].split(' ').pop()}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
        >
          {value}
        </motion.span>
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
    </motion.div>
  );
};

const AnimatedInput = ({ label, value, onChange, type = 'number', min, max, step }: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.label
        className="block text-xs font-semibold tracking-wider uppercase mb-1.5"
        animate={{ color: focused ? '#22d3ee' : 'rgba(255,255,255,0.5)' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      <div className="relative">
        <motion.input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step || 0.1}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
          style={{ borderColor: focused ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.1)' }}
          whileFocus={{ backgroundColor: 'rgba(34,211,238,0.05)' }}
        />
        <AnimatePresence>
          {focused && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ boxShadow: '0 0 20px rgba(34,211,238,0.15)' }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const RiskMeter = ({ risk, t }: { risk: 'low' | 'moderate' | 'high'; t: typeof TRANSLATIONS.en }) => {
  const levels = { low: 1, moderate: 2, high: 3 };
  const colors = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444' };
  const level = levels[risk];

  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50 uppercase tracking-wider">{t.hypoRisk}</span>
        <motion.span
          className="text-sm font-bold"
          animate={{ color: colors[risk] }}
          style={{ color: colors[risk] }}
        >
          {t[risk]}
        </motion.span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="h-2 flex-1 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: 1,
              backgroundColor: i <= level ? colors[risk] : 'rgba(255,255,255,0.1)',
            }}
            transition={{ duration: 0.4, delay: i * 0.1, type: 'spring' }}
            style={{ originX: 0 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

const WaterDropSVG = ({ fill = 0 }: { fill: number }) => {
  const springFill = useSpring(fill, { stiffness: 80, damping: 20 });
  const y = useTransform(springFill, [0, 1], [60, 0]);

  return (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
      <defs>
        <clipPath id="drop">
          <path d="M30 5 C30 5 5 35 5 52 C5 65 16.2 75 30 75 C43.8 75 55 65 55 52 C55 35 30 5 30 5Z" />
        </clipPath>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d="M30 5 C30 5 5 35 5 52 C5 65 16.2 75 30 75 C43.8 75 55 65 55 52 C55 35 30 5 30 5Z" fill="rgba(255,255,255,0.05)" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
      <motion.rect
        x="5" width="50" height="70"
        fill="url(#waterGrad)"
        clipPath="url(#drop)"
        style={{ y }}
      />
    </svg>
  );
};

export default function App() {
  const lang = useLang();
  const t = TRANSLATIONS[lang];
  const [tab, setTab] = useState<Tab>('session');
  const [showInfo, setShowInfo] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');

  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const s = localStorage.getItem('osmotrack_profile');
      return s ? JSON.parse(s) : { weight: 70, age: 30, gender: 'male', saltSensitivity: 'medium' };
    } catch { return { weight: 70, age: 30, gender: 'male', saltSensitivity: 'medium' }; }
  });

  const [session, setSession] = useState<SessionInput>({
    weightBefore: profile.weight,
    weightAfter: profile.weight - 0.5,
    duration: 60,
    fluidConsumed: 0.5,
    temp: 20,
    humidity: 50,
    intensity: 'medium',
  });

  const [result, setResult] = useState<SessionResult | null>(null);
  const [history, setHistory] = useState<SavedSession[]>(() => {
    try {
      const s = localStorage.getItem('osmotrack_history');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  useEffect(() => {
    document.title = 'OsmoTrack — Hypertonic Fluid Architect';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Personalized sweat rate & sodium rehydration protocol for endurance athletes');
  }, []);

  const flash = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(''), 2000);
  };

  const handleCalculate = () => {
    const r = calcSession(session, profile);
    setResult(r);
    setTab('protocol');
  };

  const handleSaveProfile = () => {
    localStorage.setItem('osmotrack_profile', JSON.stringify(profile));
    flash(t.profileSaved);
  };

  const handleSaveSession = () => {
    if (!result) return;
    const newSession: SavedSession = { date: new Date().toISOString(), input: session, result };
    const updated = [newSession, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('osmotrack_history', JSON.stringify(updated));
    flash(t.saved);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('osmotrack_history');
  };

  const avgSweatRate = history.length > 0
    ? (history.reduce((a, b) => a + b.result.sweatRate, 0) / history.length).toFixed(2)
    : null;

  const tabs: Tab[] = ['session', 'protocol', 'profile', 'history'];
  const tabLabels: Record<Tab, string> = {
    session: t.tabSession,
    protocol: t.tabProtocol,
    profile: t.tabProfile,
    history: t.tabHistory,
  };

  return (
    <div className="min-h-screen bg-[#050c15] text-white font-sans relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', top: '-200px', left: '-200px' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #0891b2, transparent)', bottom: '-100px', right: '-100px' }}
          animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <ParticleField />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-start justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                className="w-8 h-8"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <WaterDropSVG fill={result ? result.sweatRate / 3 : 0.5} />
              </motion.div>
              <motion.h1
                className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                {t.appTitle}
              </motion.h1>
            </div>
            <p className="text-xs text-white/40 tracking-widest uppercase">{t.appSubtitle}</p>
          </div>
          <RippleButton
            onClick={() => setShowInfo(true)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors text-sm font-bold"
          >
            ?
          </RippleButton>
        </motion.div>

        {/* Flash message */}
        <AnimatePresence>
          {flashMsg && (
            <motion.div
              className="mb-4 bg-cyan-500/20 border border-cyan-400/30 rounded-xl px-4 py-2.5 text-cyan-300 text-sm text-center font-medium"
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
            >
              {flashMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-2xl p-1 mb-6">
          {tabs.map(t2 => (
            <RippleButton
              key={t2}
              onClick={() => setTab(t2)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                tab === t2
                  ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <motion.span
                animate={{ scale: tab === t2 ? 1 : 0.95 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="block"
              >
                {tabLabels[t2]}
              </motion.span>
            </RippleButton>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'session' && (
            <motion.div
              key="session"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <GlowCard className="p-5 space-y-4">
                <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-3">
                  {t.tabSession}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <AnimatedInput label={t.weightBefore} value={session.weightBefore} onChange={v => setSession(s => ({ ...s, weightBefore: v }))} min={30} max={200} />
                  <AnimatedInput label={t.weightAfter} value={session.weightAfter} onChange={v => setSession(s => ({ ...s, weightAfter: v }))} min={30} max={200} />
                  <AnimatedInput label={t.duration} value={session.duration} onChange={v => setSession(s => ({ ...s, duration: v }))} min={10} max={600} step={5} />
                  <AnimatedInput label={t.fluidConsumed} value={session.fluidConsumed} onChange={v => setSession(s => ({ ...s, fluidConsumed: v }))} min={0} max={10} />
                  <AnimatedInput label={t.temp} value={session.temp} onChange={v => setSession(s => ({ ...s, temp: v }))} min={-10} max={50} step={1} />
                  <AnimatedInput label={t.humidity} value={session.humidity} onChange={v => setSession(s => ({ ...s, humidity: v }))} min={0} max={100} step={5} />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2 text-white/50">{t.intensity}</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((lvl) => (
                      <RippleButton
                        key={lvl}
                        onClick={() => setSession(s => ({ ...s, intensity: lvl }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          session.intensity === lvl
                            ? 'bg-gradient-to-r from-cyan-500/40 to-teal-500/40 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <motion.span
                          animate={{ scale: session.intensity === lvl ? 1.05 : 1 }}
                          className="block"
                        >
                          {lvl === 'low' ? t.intensityLow : lvl === 'medium' ? t.intensityMed : t.intensityHigh}
                        </motion.span>
                      </RippleButton>
                    ))}
                  </div>
                </div>
              </GlowCard>

              <RippleButton
                onClick={handleCalculate}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all"
              >
                <motion.span
                  className="flex items-center justify-center gap-2"
                  whileHover={{ letterSpacing: '0.15em' }}
                  transition={{ duration: 0.2 }}
                >
                  ⚡ {t.calculate}
                </motion.span>
              </RippleButton>
            </motion.div>
          )}

          {tab === 'protocol' && (
            <motion.div
              key="protocol"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {!result ? (
                <GlowCard className="p-8 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl mb-3"
                  >
                    💧
                  </motion.div>
                  <p className="text-white/40 text-sm">
                    {lang === 'nl' ? 'Bereken eerst je sessie' : 'Calculate your session first'}
                  </p>
                </GlowCard>
              ) : (
                <>
                  <GlowCard className="p-5 space-y-4">
                    <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-3">
                      {t.protocol}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <StatPill label={t.sweatRate} value={result.sweatRate} unit={t.lperhr} color="cyan" />
                      <StatPill label={t.sodiumLoss} value={result.sodiumLossTotal} unit={t.mgTotal} color="teal" />
                      <StatPill label={t.fluidNeeded} value={result.fluidNeeded} unit={t.litersTotal} color="teal" />
                      <StatPill label={t.sodiumNeeded} value={result.sodiumNeeded} unit="mg" color="orange" />
                    </div>
                    <RiskMeter risk={result.hypoRisk} t={t} />
                    {result.hypoRisk === 'high' && (
                      <motion.div
                        className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-xs leading-relaxed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {t.warning}
                      </motion.div>
                    )}
                  </GlowCard>

                  <GlowCard className="p-5 space-y-3" glow="teal">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t.protocol}</h3>
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="flex-shrink-0"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <WaterDropSVG fill={Math.min(1, result.sweatRate / 2.5)} />
                      </motion.div>
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-white/50">{t.drinkEvery}</span>
                          <motion.span
                            className="text-lg font-bold text-cyan-400"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            {result.drinkInterval} {t.minutes}
                          </motion.span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-white/50">{t.sodiumPer}</span>
                          <motion.span
                            className="text-lg font-bold text-orange-400"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                          >
                            {result.sodiumPerServing} mg
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </GlowCard>

                  <RippleButton
                    onClick={handleSaveSession}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm hover:bg-white/10 hover:border-cyan-400/30 hover:text-cyan-300 transition-all"
                  >
                    💾 {t.saveSession}
                  </RippleButton>
                </>
              )}
            </motion.div>
          )}

          {tab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <GlowCard className="p-5 space-y-4">
                <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-3">
                  {t.tabProfile}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <AnimatedInput label={t.bodyWeight} value={profile.weight} onChange={v => setProfile(p => ({ ...p, weight: v }))} min={30} max={200} />
                  <AnimatedInput label={t.age} value={profile.age} onChange={v => setProfile(p => ({ ...p, age: v }))} min={10} max={100} step={1} />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2 text-white/50">{t.gender}</label>
                  <div className="flex gap-2">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <RippleButton
                        key={g}
                        onClick={() => setProfile(p => ({ ...p, gender: g }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          profile.gender === g
                            ? 'bg-gradient-to-r from-cyan-500/40 to-teal-500/40 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        {g === 'male' ? t.male : g === 'female' ? t.female : t.other}
                      </RippleButton>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2 text-white/50">{t.saltType}</label>
                  <div className="flex flex-col gap-2">
                    {(['low', 'medium', 'high'] as const).map(lvl => (
                      <RippleButton
                        key={lvl}
                        onClick={() => setProfile(p => ({ ...p, saltSensitivity: lvl }))}
                        className={`py-2.5 px-4 rounded-xl text-xs font-semibold text-left transition-all ${
                          profile.saltSensitivity === lvl
                            ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 text-teal-300 border border-teal-400/40'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        <motion.span animate={{ x: profile.saltSensitivity === lvl ? 4 : 0 }} className="block">
                          {lvl === 'low' ? `🟢 ${t.saltLow} (~600mg/L)` : lvl === 'medium' ? `🟡 ${t.saltMed} (~900mg/L)` : `🔴 ${t.saltHigh} (~1200mg/L)`}
                        </motion.span>
                      </RippleButton>
                    ))}
                  </div>
                </div>
              </GlowCard>

              <RippleButton
                onClick={handleSaveProfile}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.5)] transition-all"
              >
                ✓ {t.saveProfile}
              </RippleButton>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {history.length > 0 && (
                <GlowCard className="p-4" glow="teal">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <motion.div
                        className="text-2xl font-black text-cyan-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {history.length}
                      </motion.div>
                      <div className="text-xs text-white/40">{t.sessionsLogged}</div>
                    </div>
                    <div className="text-center">
                      <motion.div
                        className="text-2xl font-black text-teal-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                      >
                        {avgSweatRate}
                      </motion.div>
                      <div className="text-xs text-white/40">{t.avgSweatRate} L/hr</div>
                    </div>
                    <div className="text-center">
                      <motion.div
                        className="text-2xl font-black text-orange-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                      >
                        {history.filter(h => h.result.hypoRisk === 'high').length}
                      </motion.div>
                      <div className="text-xs text-white/40">{lang === 'nl' ? 'hoog risico' : 'high risk'}</div>
                    </div>
                  </div>
                </GlowCard>
              )}

              {history.length === 0 ? (
                <GlowCard className="p-8 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl mb-3"
                  >
                    📊
                  </motion.div>
                  <p className="text-white/40 text-sm">{t.noHistory}</p>
                </GlowCard>
              ) : (
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GlowCard
                        className="p-4"
                        glow={h.result.hypoRisk === 'high' ? 'red' : h.result.hypoRisk === 'moderate' ? 'orange' : 'cyan'}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-white/40">
                            {new Date(h.date).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <motion.span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              h.result.hypoRisk === 'high' ? 'bg-red-500/20 text-red-400' :
                              h.result.hypoRisk === 'moderate' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            {h.result.hypoRisk === 'high' ? t.high : h.result.hypoRisk === 'moderate' ? t.moderate : t.low}
                          </motion.span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div><span className="text-white/30 text-xs">{t.sweatRate} </span><span className="text-cyan-300 font-bold">{h.result.sweatRate} L/hr</span></div>
                          <div><span className="text-white/30 text-xs">{t.duration} </span><span className="text-white/70 font-medium">{h.input.duration}min</span></div>
                          <div><span className="text-white/30 text-xs">{t.temp} </span><span className="text-white/70 font-medium">{h.input.temp}°C</span></div>
                        </div>
                      </GlowCard>
                    </motion.div>
                  ))}
                  <RippleButton
                    onClick={handleClearHistory}
                    className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400/70 font-semibold text-xs hover:bg-red-500/20 hover:text-red-400 transition-all"
                  >
                    🗑 {t.clearHistory}
                  </RippleButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowInfo(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative z-10 w-full max-w-md bg-[#0a1628] border border-cyan-500/20 rounded-3xl p-6 shadow-[0_0_60px_rgba(34,211,238,0.15)]"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-black text-cyan-300">{t.infoTitle}</h3>
                <RippleButton
                  onClick={() => setShowInfo(false)}
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center text-sm"
                >
                  ✕
                </RippleButton>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{t.infoText}</p>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
                {[['💧', lang === 'nl' ? 'Zweettempo' : 'Sweat Rate'], ['🧂', lang === 'nl' ? 'Natrium' : 'Sodium'], ['⚡', lang === 'nl' ? 'Protocol' : 'Protocol']].map(([icon, label]) => (
                  <motion.div
                    key={label}
                    className="text-center p-2 bg-white/5 rounded-xl"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-xs text-white/50">{label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}