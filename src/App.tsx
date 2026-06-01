import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

const translations = {
  en: {
    appName: 'ThermoHand',
    tagline: 'Raynaud\'s Attack Forecaster',
    infoTitle: 'About ThermoHand',
    infoText: 'Approximately 80 million people worldwide suffer from Raynaud\'s phenomenon — a condition where blood vessels overreact to cold or stress, causing fingers and toes to turn white, then blue, then red. ThermoHand helps you predict, prevent, and manage Raynaud\'s attacks by tracking your personal triggers, monitoring microclimatic conditions, and giving you real-time warming protocols tailored to your body.',
    riskLevel: 'Attack Risk',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    critical: 'Critical',
    temperature: 'Ambient Temp',
    stressLevel: 'Stress Level',
    activityLevel: 'Activity',
    logAttack: 'Log Attack',
    protocol: 'Warming Protocol',
    history: 'Attack History',
    noHistory: 'No attacks logged yet',
    triggers: 'Active Triggers',
    settings: 'Settings',
    bodyTemp: 'Fingers Cold?',
    windChill: 'Wind Chill',
    humidity: 'Humidity',
    protocolSteps: [
      'Move to a warm environment immediately',
      'Place hands under warm (not hot) running water',
      'Gently swing arms in circles to improve circulation',
      'Avoid caffeine and nicotine during recovery',
      'Apply chemical hand warmers to palms',
    ],
    attackLogged: 'Attack logged at',
    triggerCold: 'Cold temperature',
    triggerStress: 'High stress',
    triggerWind: 'Wind chill',
    triggerInactive: 'Low activity',
    unit: '°C',
    close: 'Close',
    today: 'Today',
    attacks: 'attacks',
  },
  nl: {
    appName: 'ThermoHand',
    tagline: 'Raynaud Aanval Voorspeller',
    infoTitle: 'Over ThermoHand',
    infoText: 'Ongeveer 80 miljoen mensen wereldwijd lijden aan het Raynaud-fenomeen — een aandoening waarbij bloedvaten overreageren op kou of stress, waardoor vingers en tenen wit, dan blauw en daarna rood worden. ThermoHand helpt je aanvallen te voorspellen, te voorkomen en te beheersen door je persoonlijke triggers bij te houden, microklimaatcondities te monitoren en je real-time verwarmingsprotocollen te geven die zijn afgestemd op jouw lichaam.',
    riskLevel: 'Aanvalsrisico',
    low: 'Laag',
    moderate: 'Matig',
    high: 'Hoog',
    critical: 'Kritiek',
    temperature: 'Omgevingstemperatuur',
    stressLevel: 'Stressniveau',
    activityLevel: 'Activiteit',
    logAttack: 'Aanval Loggen',
    protocol: 'Verwarmingsprotocol',
    history: 'Aanvalsgeschiedenis',
    noHistory: 'Nog geen aanvallen gelogd',
    triggers: 'Actieve Triggers',
    settings: 'Instellingen',
    bodyTemp: 'Vingers Koud?',
    windChill: 'Gevoelstemperatuur',
    humidity: 'Luchtvochtigheid',
    protocolSteps: [
      'Ga onmiddellijk naar een warme omgeving',
      'Houd handen onder warm (niet heet) stromend water',
      'Zwaai je armen zachtjes in cirkels om de circulatie te verbeteren',
      'Vermijd cafeïne en nicotine tijdens herstel',
      'Gebruik chemische handwarmers op je handpalmen',
    ],
    attackLogged: 'Aanval gelogd om',
    triggerCold: 'Lage temperatuur',
    triggerStress: 'Hoge stress',
    triggerWind: 'Gevoelstemperatuur',
    triggerInactive: 'Lage activiteit',
    unit: '°C',
    close: 'Sluiten',
    today: 'Vandaag',
    attacks: 'aanvallen',
  },
};

type Lang = 'en' | 'nl';
type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

interface AttackLog {
  id: string;
  timestamp: number;
  triggers: string[];
  temperature: number;
  stress: number;
}

const getRisk = (temp: number, stress: number, activity: number, fingersCold: boolean, wind: number): RiskLevel => {
  let score = 0;
  if (temp < 10) score += 3;
  else if (temp < 15) score += 2;
  else if (temp < 20) score += 1;
  if (stress > 7) score += 3;
  else if (stress > 5) score += 2;
  else if (stress > 3) score += 1;
  if (activity < 3) score += 2;
  else if (activity < 5) score += 1;
  if (fingersCold) score += 2;
  if (wind < -5) score += 2;
  else if (wind < 5) score += 1;
  if (score <= 2) return 'low';
  if (score <= 5) return 'moderate';
  if (score <= 8) return 'high';
  return 'critical';
};

const riskColors: Record<RiskLevel, { bg: string; glow: string; text: string; ring: string }> = {
  low: { bg: 'from-emerald-500 to-teal-400', glow: 'rgba(16,185,129,0.4)', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  moderate: { bg: 'from-amber-500 to-yellow-400', glow: 'rgba(245,158,11,0.4)', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  high: { bg: 'from-orange-500 to-red-400', glow: 'rgba(249,115,22,0.4)', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  critical: { bg: 'from-red-600 to-rose-500', glow: 'rgba(239,68,68,0.6)', text: 'text-red-400', ring: 'ring-red-500/40' },
};

const HandIcon = ({ risk, fingersCold }: { risk: RiskLevel; fingersCold: boolean }) => {
  const colors: Record<RiskLevel, string[]> = {
    low: ['#34d399', '#34d399', '#34d399', '#34d399', '#34d399'],
    moderate: ['#fbbf24', '#fbbf24', '#fde68a', '#fbbf24', '#fde68a'],
    high: ['#f97316', '#fb923c', '#f97316', '#fb923c', '#f97316'],
    critical: ['#ef4444', '#f87171', '#ef4444', '#f87171', '#ef4444'],
  };
  const fingerColor = fingersCold ? colors[risk] : ['#6ee7b7', '#6ee7b7', '#6ee7b7', '#6ee7b7', '#6ee7b7'];

  return (
    <svg viewBox="0 0 120 140" className="w-full h-full" fill="none">
      <motion.ellipse cx="60" cy="110" rx="42" ry="22"
        fill={fingerColor[0]}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {[0,1,2,3,4].map((i) => {
        const x = 20 + i * 20;
        const h = i === 0 ? 55 : i === 1 || i === 3 ? 65 : i === 2 ? 70 : 60;
        const y = 110 - h;
        return (
          <motion.rect
            key={i}
            x={x - 7}
            y={y}
            width={14}
            height={h}
            rx={7}
            fill={fingerColor[i] || fingerColor[0]}
            animate={fingersCold && risk === 'critical' ? {
              scaleY: [1, 0.97, 1],
              originY: '100%',
            } : {}}
            transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, delay: i * 0.1 }}
          />
        );
      })}
    </svg>
  );
};

const PulseRing = ({ risk }: { risk: RiskLevel }) => (
  <>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${riskColors[risk].bg} opacity-20`}
        animate={{ scale: [1, 1.3 + i * 0.15], opacity: [0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
      />
    ))}
  </>
);

export default function App() {
  const lang: Lang = (navigator.language || 'en').startsWith('nl') ? 'nl' : 'en';
  const t = translations[lang];

  const [temperature, setTemperature] = useState<number>(() => {
    const s = localStorage.getItem('th_temp');
    return s ? parseFloat(s) : 15;
  });
  const [stress, setStress] = useState<number>(() => {
    const s = localStorage.getItem('th_stress');
    return s ? parseFloat(s) : 4;
  });
  const [activity, setActivity] = useState<number>(() => {
    const s = localStorage.getItem('th_activity');
    return s ? parseFloat(s) : 5;
  });
  const [fingersCold, setFingersCold] = useState<boolean>(() => localStorage.getItem('th_fingers') === 'true');
  const [windChill, setWindChill] = useState<number>(() => {
    const s = localStorage.getItem('th_wind');
    return s ? parseFloat(s) : 10;
  });
  const [humidity, setHumidity] = useState<number>(() => {
    const s = localStorage.getItem('th_hum');
    return s ? parseFloat(s) : 60;
  });
  const [attackLog, setAttackLog] = useState<AttackLog[]>(() => {
    try { return JSON.parse(localStorage.getItem('th_log') || '[]'); } catch { return []; }
  });
  const [showInfo, setShowInfo] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'log'>('dashboard');

  const risk = getRisk(temperature, stress, activity, fingersCold, windChill);

  useEffect(() => { document.title = `ThermoHand – ${t.tagline}`; }, [t.tagline]);
  useEffect(() => { localStorage.setItem('th_temp', String(temperature)); }, [temperature]);
  useEffect(() => { localStorage.setItem('th_stress', String(stress)); }, [stress]);
  useEffect(() => { localStorage.setItem('th_activity', String(activity)); }, [activity]);
  useEffect(() => { localStorage.setItem('th_fingers', String(fingersCold)); }, [fingersCold]);
  useEffect(() => { localStorage.setItem('th_wind', String(windChill)); }, [windChill]);
  useEffect(() => { localStorage.setItem('th_hum', String(humidity)); }, [humidity]);
  useEffect(() => { localStorage.setItem('th_log', JSON.stringify(attackLog)); }, [attackLog]);

  const activeTriggers: string[] = [];
  if (temperature < 15) activeTriggers.push(t.triggerCold);
  if (stress > 6) activeTriggers.push(t.triggerStress);
  if (windChill < 8) activeTriggers.push(t.triggerWind);
  if (activity < 3) activeTriggers.push(t.triggerInactive);

  const logAttack = () => {
    const entry: AttackLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      triggers: [...activeTriggers],
      temperature,
      stress,
    };
    setAttackLog(prev => [entry, ...prev].slice(0, 50));
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  };

  const todayCount = attackLog.filter(a => {
    const d = new Date(a.timestamp);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;

  const SliderInput = ({ label, value, onChange, min, max, step = 1, unit = '', colorFn }: {
    label: string; value: number; onChange: (v: number) => void;
    min: number; max: number; step?: number; unit?: string;
    colorFn?: (v: number) => string;
  }) => {
    const pct = ((value - min) / (max - min)) * 100;
    const color = colorFn ? colorFn(value) : '#60a5fa';
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
          <motion.span
            key={value}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm font-bold"
            style={{ color }}
          >
            {value}{unit}
          </motion.span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-700/60">
          <motion.div
            className="absolute h-full rounded-full"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }}
            layoutId={`slider-fill-${label}`}
          />
          <input
            type="range"
            min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-900 shadow-lg"
            style={{ left: `calc(${pct}% - 8px)`, backgroundColor: color,
              boxShadow: `0 0 10px ${color}` }}
            whileHover={{ scale: 1.4 }}
            whileTap={{ scale: 1.2 }}
          />
        </div>
      </div>
    );
  };

  const riskLabel = t[risk];
  const rc = riskColors[risk];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; }
        input[type=range]::-moz-range-thumb { appearance: none; }
        .glass { background: rgba(15,23,42,0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); }
        .glow-text { text-shadow: 0 0 30px currentColor; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className={`absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br ${rc.bg} opacity-10 blur-3xl`}
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-tl ${rc.bg} opacity-10 blur-3xl`}
          animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <motion.h1
              className={`text-2xl font-black tracking-tight ${rc.text} glow-text`}
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {t.appName}
            </motion.h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium tracking-wide">{t.tagline}</p>
          </div>
          <div className="flex gap-2 items-center">
            {todayCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass rounded-full px-3 py-1 text-xs font-bold text-slate-300"
              >
                {todayCount} {t.attacks} {t.today}
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowInfo(true)}
              className="w-9 h-9 rounded-full glass flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </motion.button>
          </div>
        </motion.div>

        {/* Risk Orb */}
        <motion.div
          layout
          className="flex flex-col items-center mb-8"
        >
          <div className="relative w-48 h-48">
            <PulseRing risk={risk} />
            <motion.div
              className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${rc.bg} flex items-center justify-center shadow-2xl ring-4 ${rc.ring}`}
              style={{ boxShadow: `0 0 60px ${rc.glow}, 0 0 120px ${rc.glow}40` }}
              animate={{ boxShadow: [
                `0 0 40px ${rc.glow}, 0 0 80px ${rc.glow}30`,
                `0 0 70px ${rc.glow}, 0 0 140px ${rc.glow}50`,
                `0 0 40px ${rc.glow}, 0 0 80px ${rc.glow}30`,
              ]}}
              transition={{ duration: 2.5, repeat: Infinity }}
              layout
            >
              <div className="w-32 h-32">
                <HandIcon risk={risk} fingersCold={fingersCold} />
              </div>
            </motion.div>
          </div>
          <motion.div
            className="mt-4 text-center"
            layout
          >
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{t.riskLevel}</p>
            <motion.p
              key={risk}
              initial={{ scale: 0.8, opacity: 0, y: 5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`text-3xl font-black uppercase tracking-wider mt-1 ${rc.text} glow-text`}
            >
              {riskLabel}
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Triggers */}
        <AnimatePresence>
          {activeTriggers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">{t.triggers}</p>
                <div className="flex flex-wrap gap-2">
                  {activeTriggers.map((tr, i) => (
                    <motion.span
                      key={tr}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${rc.text} bg-white/5 border border-white/10`}
                    >
                      ⚠ {tr}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sliders */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 space-y-5 mb-5"
        >
          <SliderInput
            label={t.temperature}
            value={temperature}
            onChange={setTemperature}
            min={-20} max={40}
            unit={t.unit}
            colorFn={v => v < 5 ? '#ef4444' : v < 15 ? '#f97316' : v < 22 ? '#fbbf24' : '#34d399'}
          />
          <SliderInput
            label={t.windChill}
            value={windChill}
            onChange={setWindChill}
            min={-30} max={40}
            unit={t.unit}
            colorFn={v => v < 0 ? '#ef4444' : v < 10 ? '#f97316' : '#60a5fa'}
          />
          <SliderInput
            label={t.stressLevel}
            value={stress}
            onChange={setStress}
            min={0} max={10}
            colorFn={v => v > 7 ? '#ef4444' : v > 5 ? '#f97316' : v > 3 ? '#fbbf24' : '#34d399'}
          />
          <SliderInput
            label={t.activityLevel}
            value={activity}
            onChange={setActivity}
            min={0} max={10}
            colorFn={v => v < 3 ? '#ef4444' : v < 6 ? '#fbbf24' : '#34d399'}
          />
          <SliderInput
            label={t.humidity}
            value={humidity}
            onChange={setHumidity}
            min={0} max={100}
            unit="%"
            colorFn={() => '#818cf8'}
          />

          {/* Fingers toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.bodyTemp}</span>
            <motion.button
              onClick={() => setFingersCold(p => !p)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                fingersCold ? 'bg-blue-600' : 'bg-slate-700'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                animate={{ left: fingersCold ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={logAttack}
            className={`relative overflow-hidden rounded-2xl py-4 px-4 font-bold text-sm bg-gradient-to-br ${rc.bg} text-white shadow-lg`}
            style={{ boxShadow: `0 8px 32px ${rc.glow}` }}
          >
            <AnimatePresence mode="wait">
              {justLogged ? (
                <motion.span
                  key="logged"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="flex items-center gap-2 justify-center"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  ✓
                </motion.span>
              ) : (
                <motion.span key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v10m0 0l3-3m-3 3l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16v4a1 1 0 001 1h14a1 1 0 001-1v-4" strokeLinecap="round"/>
                  </svg>
                  {t.logAttack}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowProtocol(true)}
            className="rounded-2xl py-4 px-4 font-bold text-sm glass text-slate-200 hover:text-white hover:border-slate-600 transition-all"
          >
            🌡 {t.protocol}
          </motion.button>
        </div>

        {/* History button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHistory(true)}
          className="w-full glass rounded-2xl py-3.5 px-4 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors text-center"
        >
          📋 {t.history} ({attackLog.length})
        </motion.button>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass rounded-3xl p-7 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${rc.bg} flex items-center justify-center text-xl`}>🖐</div>
                <h2 className="text-lg font-black text-slate-100">{t.infoTitle}</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{t.infoText}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowInfo(false)}
                className={`mt-6 w-full rounded-2xl py-3 font-bold text-sm bg-gradient-to-br ${rc.bg} text-white`}
              >
                {t.close}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protocol Modal */}
      <AnimatePresence>
        {showProtocol && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProtocol(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass rounded-3xl p-7 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${rc.bg} flex items-center justify-center text-xl`}>🌡</div>
                <h2 className="text-lg font-black text-slate-100">{t.protocol}</h2>
              </div>
              <div className="space-y-3">
                {t.protocolSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3 items-start"
                  >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${rc.bg} flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5`}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                  </motion.div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProtocol(false)}
                className={`mt-6 w-full rounded-2xl py-3 font-bold text-sm bg-gradient-to-br ${rc.bg} text-white`}
              >
                {t.close}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass rounded-3xl p-6 max-w-sm w-full max-h-[70vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${rc.bg} flex items-center justify-center text-xl`}>📋</div>
                <h2 className="text-lg font-black text-slate-100">{t.history}</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {attackLog.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">{t.noHistory}</p>
                ) : attackLog.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl bg-slate-800/60 p-3 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-300">
                        {new Date(a.timestamp).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                        {' '}{new Date(a.timestamp).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-xs text-slate-500">{a.temperature}{t.unit}</span>
                    </div>
                    {a.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.triggers.map(tr => (
                          <span key={tr} className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">{tr}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowHistory(false)}
                className={`mt-4 w-full rounded-2xl py-3 font-bold text-sm bg-gradient-to-br ${rc.bg} text-white`}
              >
                {t.close}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}