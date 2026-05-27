import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

const translations = {
  en: {
    title: 'VocalGuard',
    subtitle: 'Vocal Hydration & Temperature Guardian',
    tagline: 'Precision care for your most valuable instrument',
    tempLabel: 'Environment Temperature',
    humidLabel: 'Relative Humidity',
    speakLabel: 'Speaking Hours Today',
    activityLabel: 'Activity Level',
    activity: { low: 'Low', medium: 'Medium', high: 'High', performer: 'Performer' },
    waterNeeded: 'Water Needed',
    mlPerHour: 'ml/hour',
    mlTotal: 'ml total',
    vocalScore: 'Vocal Health Score',
    riskLevel: 'Risk Level',
    risk: { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' },
    recommendations: 'Smart Recommendations',
    history: 'Today\'s Hydration Log',
    logDrink: 'Log Drink',
    ml: 'ml',
    logLabel: 'Amount (ml)',
    reset: 'Reset Day',
    consumed: 'Consumed',
    remaining: 'Remaining',
    warmupTitle: 'Vocal Warm-up Timer',
    warmupStart: 'Start Warm-up',
    warmupStop: 'Stop',
    warmupDone: 'Warm-up Complete!',
    restTitle: 'Voice Rest Reminder',
    restDesc: 'Schedule a voice rest in:',
    restSet: 'Set Reminder',
    celsius: '°C',
    fahrenheit: '°F',
    toggleUnit: 'Toggle °F/°C',
    saved: 'Data saved locally',
    rec1: 'Sip water every 20 minutes during speaking sessions.',
    rec2: 'Avoid caffeine and alcohol — they dehydrate vocal cords.',
    rec3: 'Use a humidifier if humidity drops below 40%.',
    rec4: 'Steam inhalation for 10 min before performing.',
    rec5: 'Rest your voice for at least 1 hour after intense use.',
    rec6: 'Critical: Immediate vocal rest recommended.',
    rec7: 'High temperature detected — increase water intake significantly.',
    rec8: 'Low humidity detected — your vocal cords are at risk of drying out.',
    rec9: 'You\'re speaking a lot today — protect your cords with extra hydration.',
  },
  nl: {
    title: 'VocalGuard',
    subtitle: 'Stem Hydratatie & Temperatuur Bewaker',
    tagline: 'Precisiezorg voor je meest waardevolle instrument',
    tempLabel: 'Omgevingstemperatuur',
    humidLabel: 'Relatieve Luchtvochtigheid',
    speakLabel: 'Spreekuren Vandaag',
    activityLabel: 'Activiteitsniveau',
    activity: { low: 'Laag', medium: 'Gemiddeld', high: 'Hoog', performer: 'Performer' },
    waterNeeded: 'Water Nodig',
    mlPerHour: 'ml/uur',
    mlTotal: 'ml totaal',
    vocalScore: 'Stemgezondheid Score',
    riskLevel: 'Risiconiveau',
    risk: { low: 'Laag', moderate: 'Matig', high: 'Hoog', critical: 'Kritiek' },
    recommendations: 'Slimme Aanbevelingen',
    history: 'Hydratatie Log Vandaag',
    logDrink: 'Drank Loggen',
    ml: 'ml',
    logLabel: 'Hoeveelheid (ml)',
    reset: 'Reset Dag',
    consumed: 'Geconsumeerd',
    remaining: 'Resterend',
    warmupTitle: 'Stem Opwarmtimer',
    warmupStart: 'Start Opwarmen',
    warmupStop: 'Stop',
    warmupDone: 'Opwarmen Klaar!',
    restTitle: 'Stemrust Herinnering',
    restDesc: 'Plan een stemrust in:',
    restSet: 'Stel Herinnering In',
    celsius: '°C',
    fahrenheit: '°F',
    toggleUnit: 'Schakel °F/°C',
    saved: 'Data lokaal opgeslagen',
    rec1: 'Neem elke 20 minuten een slokje water tijdens spreeksessies.',
    rec2: 'Vermijd cafeïne en alcohol — ze drogen stembanden uit.',
    rec3: 'Gebruik een luchtbevochtiger als luchtvochtigheid onder 40% daalt.',
    rec4: 'Stoominhaling gedurende 10 min voor optreden.',
    rec5: 'Rust je stem minimaal 1 uur na intensief gebruik.',
    rec6: 'Kritiek: Onmiddellijke stemrust aanbevolen.',
    rec7: 'Hoge temperatuur gedetecteerd — verhoog waterinname aanzienlijk.',
    rec8: 'Lage luchtvochtigheid gedetecteerd — stembanden dreigen uit te drogen.',
    rec9: 'Je spreekt veel vandaag — bescherm je stembanden met extra hydratatie.',
  },
};

function getLang(): 'en' | 'nl' {
  const lang = navigator.language || 'en';
  return lang.startsWith('nl') ? 'nl' : 'en';
}

function calcHydration(tempC: number, humidity: number, speakHours: number, activity: string): { mlPerHour: number; mlTotal: number; score: number; risk: string } {
  const basePerHour = 250;
  const tempFactor = tempC > 25 ? 1 + (tempC - 25) * 0.04 : tempC < 15 ? 1 + (15 - tempC) * 0.02 : 1;
  const humidFactor = humidity < 40 ? 1 + (40 - humidity) * 0.015 : humidity > 70 ? 0.9 : 1;
  const actFactor = { low: 0.8, medium: 1.0, high: 1.3, performer: 1.6 }[activity] ?? 1.0;
  const speakFactor = 1 + speakHours * 0.12;
  const mlPerHour = Math.round(basePerHour * tempFactor * humidFactor * actFactor * speakFactor);
  const mlTotal = Math.round(mlPerHour * Math.max(speakHours, 1));
  let score = 100;
  if (tempC > 30) score -= 20;
  if (tempC > 35) score -= 15;
  if (humidity < 30) score -= 25;
  else if (humidity < 40) score -= 12;
  if (speakHours > 6) score -= 20;
  else if (speakHours > 4) score -= 10;
  if (activity === 'performer') score -= 15;
  else if (activity === 'high') score -= 8;
  score = Math.max(0, Math.min(100, score));
  let risk = 'low';
  if (score < 30) risk = 'critical';
  else if (score < 55) risk = 'high';
  else if (score < 75) risk = 'moderate';
  return { mlPerHour, mlTotal, score, risk };
}

const PARTICLE_COUNT = 18;

function WaterParticle({ delay, duration, x }: { delay: number; duration: number; x: number }) {
  return (
    <motion.div
      className="absolute bottom-0 rounded-full bg-cyan-400/30"
      style={{ left: `${x}%`, width: 6 + Math.random() * 8, height: 6 + Math.random() * 8 }}
      animate={{ y: [0, -220, -440], opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.3] }}
      transition={{ delay, duration, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

function VocalWaveform({ score }: { score: number }) {
  const amplitude = (100 - score) / 100 * 28 + 4;
  const points = Array.from({ length: 60 }, (_, i) => {
    const x = (i / 59) * 300;
    const y = 30 + Math.sin(i * 0.4) * amplitude * Math.sin(i * 0.15 + 1) + Math.cos(i * 0.25) * amplitude * 0.6;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 300 60" className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={points}
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -300] }}
        style={{ strokeDasharray: 300 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score / 100);
  const color = score > 75 ? '#34d399' : score > 55 ? '#fbbf24' : score > 30 ? '#f97316' : '#ef4444';
  return (
    <svg width="130" height="130" className="drop-shadow-lg">
      <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      <motion.circle
        cx="65" cy="65" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px', filter: `drop-shadow(0 0 8px ${color})` }}
      />
      <text x="65" y="62" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" fontFamily="monospace">{score}</text>
      <text x="65" y="78" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="sans-serif">/100</text>
    </svg>
  );
}

function HydrationBar({ consumed, total }: { consumed: number; total: number }) {
  const pct = Math.min(1, consumed / Math.max(1, total));
  const color = pct > 0.85 ? '#34d399' : pct > 0.5 ? '#818cf8' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  return (
    <div className="relative w-full h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 12px ${color}66` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.15))' }}
        animate={{ x: ['0%', '200%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function App() {
  const lang = getLang();
  const t = translations[lang];

  const [tempC, setTempC] = useState<number>(() => {
    const s = localStorage.getItem('vg_temp'); return s ? Number(s) : 22;
  });
  const [useFahrenheit, setUseFahrenheit] = useState<boolean>(() => {
    return localStorage.getItem('vg_unit') === 'f';
  });
  const [humidity, setHumidity] = useState<number>(() => {
    const s = localStorage.getItem('vg_humid'); return s ? Number(s) : 55;
  });
  const [speakHours, setSpeakHours] = useState<number>(() => {
    const s = localStorage.getItem('vg_speak'); return s ? Number(s) : 3;
  });
  const [activity, setActivity] = useState<string>(() => {
    return localStorage.getItem('vg_activity') || 'medium';
  });
  const [consumed, setConsumed] = useState<number>(() => {
    const s = localStorage.getItem('vg_consumed'); return s ? Number(s) : 0;
  });
  const [logAmount, setLogAmount] = useState<number>(250);
  const [logHistory, setLogHistory] = useState<{ time: string; amount: number }[]>(() => {
    try { const s = localStorage.getItem('vg_history'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [warmupActive, setWarmupActive] = useState(false);
  const [warmupSecs, setWarmupSecs] = useState(0);
  const [warmupDone, setWarmupDone] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const warmupRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const WARMUP_DURATION = 300;

  const displayTemp = useFahrenheit ? Math.round(tempC * 9 / 5 + 32) : tempC;

  const { mlPerHour, mlTotal, score, risk } = calcHydration(tempC, humidity, speakHours, activity);

  useEffect(() => { document.title = `${t.title} — ${t.subtitle}`; }, [lang]);

  useEffect(() => {
    localStorage.setItem('vg_temp', String(tempC));
    localStorage.setItem('vg_humid', String(humidity));
    localStorage.setItem('vg_speak', String(speakHours));
    localStorage.setItem('vg_activity', activity);
    localStorage.setItem('vg_unit', useFahrenheit ? 'f' : 'c');
    setSavedFlash(true);
    const t2 = setTimeout(() => setSavedFlash(false), 1200);
    return () => clearTimeout(t2);
  }, [tempC, humidity, speakHours, activity, useFahrenheit]);

  useEffect(() => {
    localStorage.setItem('vg_consumed', String(consumed));
    localStorage.setItem('vg_history', JSON.stringify(logHistory));
  }, [consumed, logHistory]);

  const handleTempInput = (val: number) => {
    const c = useFahrenheit ? Math.round((val - 32) * 5 / 9) : val;
    setTempC(c);
  };

  const startWarmup = () => {
    setWarmupActive(true); setWarmupSecs(0); setWarmupDone(false);
    warmupRef.current = setInterval(() => {
      setWarmupSecs(s => {
        if (s + 1 >= WARMUP_DURATION) {
          clearInterval(warmupRef.current!);
          setWarmupActive(false); setWarmupDone(true);
          return WARMUP_DURATION;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopWarmup = () => {
    if (warmupRef.current) clearInterval(warmupRef.current);
    setWarmupActive(false);
  };

  const logDrink = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    setConsumed(c => c + logAmount);
    setLogHistory(h => [{ time: timeStr, amount: logAmount }, ...h].slice(0, 12));
  };

  const resetDay = () => {
    setConsumed(0); setLogHistory([]);
  };

  const recs: string[] = [];
  if (risk === 'critical') recs.push(t.rec6);
  if (tempC > 30) recs.push(t.rec7);
  if (humidity < 40) recs.push(t.rec8);
  if (speakHours > 5) recs.push(t.rec9);
  recs.push(t.rec1, t.rec2);
  if (humidity < 45) recs.push(t.rec3);
  recs.push(t.rec4, t.rec5);
  const riskColor = { low: '#34d399', moderate: '#fbbf24', high: '#f97316', critical: '#ef4444' }[risk] || '#34d399';
  const riskLabel = t.risk[risk as keyof typeof t.risk] || risk;

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    delay: (i / PARTICLE_COUNT) * 4,
    duration: 3.5 + (i % 5) * 0.5,
    x: (i / PARTICLE_COUNT) * 95 + 2,
  }));

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 40%, #0f172a 70%, #0a0e1a 100%)',
        fontFamily: '\'Inter\', \'Segoe UI\', sans-serif',
      }}
    >
      {/* Ambient particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <WaterParticle key={i} {...p} />)}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}
            animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 20px rgba(6,182,212,0.3)', '0 0 0px rgba(6,182,212,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.span
              className="text-cyan-400 text-lg"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >🎙️</motion.span>
            <span className="text-cyan-300 text-xs font-semibold tracking-widest uppercase">VocalGuard</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">{t.subtitle}</h1>
          <p className="text-slate-400 text-sm">{t.tagline}</p>
          <AnimatePresence>
            {savedFlash && (
              <motion.p
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-xs text-emerald-400 mt-2"
              >✓ {t.saved}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Score + Risk */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center gap-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex flex-col items-center">
            <ScoreRing score={score} />
            <span className="text-slate-400 text-xs mt-2 tracking-wide">{t.vocalScore}</span>
          </div>
          <div className="flex-1 w-full">
            <VocalWaveform score={score} />
            <div className="flex items-center gap-3 mt-3">
              <motion.div
                className="px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ background: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}55` }}
                animate={{ boxShadow: [`0 0 0px ${riskColor}00`, `0 0 16px ${riskColor}55`, `0 0 0px ${riskColor}00`] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t.riskLevel}: {riskLabel}
              </motion.div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <div className="text-cyan-400 text-xl font-black">{mlPerHour}</div>
                <div className="text-slate-500 text-xs">{t.mlPerHour}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}>
                <div className="text-indigo-400 text-xl font-black">{mlTotal}</div>
                <div className="text-slate-500 text-xs">{t.mlTotal}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sliders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="rounded-2xl p-6 mb-6 space-y-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}
        >
          {/* Temp */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-300 text-sm font-semibold">{t.tempLabel}</label>
              <div className="flex items-center gap-2">
                <motion.span className="text-cyan-400 font-black text-lg" key={displayTemp} initial={{ scale: 0.7 }} animate={{ scale: 1 }}>{displayTemp}{useFahrenheit ? t.fahrenheit : t.celsius}</motion.span>
                <button
                  onClick={() => setUseFahrenheit(u => !u)}
                  className="text-xs text-slate-500 px-2 py-0.5 rounded-full hover:text-cyan-400 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >{t.toggleUnit}</button>
              </div>
            </div>
            <input type="range" min={useFahrenheit ? 32 : 0} max={useFahrenheit ? 113 : 45} value={displayTemp}
              onChange={e => handleTempInput(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>{useFahrenheit ? '32°F' : '0°C'}</span><span>{useFahrenheit ? '113°F' : '45°C'}</span>
            </div>
          </div>
          {/* Humidity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-300 text-sm font-semibold">{t.humidLabel}</label>
              <motion.span className="text-indigo-400 font-black text-lg" key={humidity} initial={{ scale: 0.7 }} animate={{ scale: 1 }}>{humidity}%</motion.span>
            </div>
            <input type="range" min={10} max={100} value={humidity}
              onChange={e => setHumidity(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>10%</span><span>100%</span></div>
          </div>
          {/* Speaking hours */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-300 text-sm font-semibold">{t.speakLabel}</label>
              <motion.span className="text-violet-400 font-black text-lg" key={speakHours} initial={{ scale: 0.7 }} animate={{ scale: 1 }}>{speakHours}h</motion.span>
            </div>
            <input type="range" min={0} max={12} step={0.5} value={speakHours}
              onChange={e => setSpeakHours(Number(e.target.value))}
              className="w-full accent-violet-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>0h</span><span>12h</span></div>
          </div>
          {/* Activity */}
          <div>
            <label className="text-slate-300 text-sm font-semibold mb-3 block">{t.activityLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low','medium','high','performer'] as const).map(lvl => (
                <motion.button
                  key={lvl}
                  onClick={() => setActivity(lvl)}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  className="py-2 px-1 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: activity === lvl ? 'linear-gradient(135deg, rgba(6,182,212,0.35), rgba(129,140,248,0.35))' : 'rgba(255,255,255,0.05)',
                    border: activity === lvl ? '1px solid rgba(6,182,212,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    color: activity === lvl ? '#e2e8f0' : '#64748b',
                    boxShadow: activity === lvl ? '0 0 14px rgba(6,182,212,0.25)' : 'none',
                  }}
                >{t.activity[lvl]}</motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Hydration tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">💧 {t.history}</h2>
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>{t.consumed}: <span className="text-cyan-400 font-bold">{consumed} ml</span></span>
            <span>{t.remaining}: <span className="text-indigo-400 font-bold">{Math.max(0, mlTotal - consumed)} ml</span></span>
          </div>
          <HydrationBar consumed={consumed} total={mlTotal} />
          <div className="mt-4 flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-slate-500 text-xs mb-1 block">{t.logLabel}</label>
              <div className="flex gap-2">
                {[100, 150, 250, 350, 500].map(amt => (
                  <motion.button
                    key={amt}
                    onClick={() => setLogAmount(amt)}
                    whileTap={{ scale: 0.88 }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: logAmount === amt ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.05)',
                      border: logAmount === amt ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: logAmount === amt ? '#67e8f9' : '#64748b',
                    }}
                  >{amt}</motion.button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              onClick={logDrink}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)', color: '#fff', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}
            >💧 {t.logDrink} ({logAmount}ml)</motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={resetDay}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >{t.reset}</motion.button>
          </div>
          {/* Log history */}
          <AnimatePresence>
            {logHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-1.5 overflow-hidden"
              >
                {logHistory.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex justify-between text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)' }}
                  >
                    <span className="text-slate-500">{entry.time}</span>
                    <span className="text-cyan-400 font-semibold">+{entry.amount} ml</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">✨ {t.recommendations}</h2>
          <div className="space-y-2">
            {recs.slice(0, 5).map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="flex gap-3 items-start text-sm text-slate-300 rounded-xl px-4 py-3"
                style={{ background: i === 0 && risk === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: i === 0 && risk === 'critical' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="mt-0.5 flex-shrink-0">{['💡','💧','🌊','🎵','😶'][i % 5]}</span>
                <span>{rec}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Vocal warmup timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">🎶 {t.warmupTitle}</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                <motion.circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - warmupSecs / WARMUP_DURATION) }}
                  transition={{ duration: 0.5 }}
                  style={{ filter: 'drop-shadow(0 0 6px #818cf8)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-indigo-300 font-black text-sm">
                  {Math.floor((WARMUP_DURATION - warmupSecs) / 60)}:{String((WARMUP_DURATION - warmupSecs) % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {warmupDone ? (
                  <motion.p key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-emerald-400 font-bold text-lg">{t.warmupDone}</motion.p>
                ) : (
                  <motion.button
                    key="btn"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={warmupActive ? stopWarmup : startWarmup}
                    className="px-6 py-3 rounded-xl font-bold text-sm"
                    style={{
                      background: warmupActive ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, rgba(129,140,248,0.3), rgba(6,182,212,0.3))',
                      border: warmupActive ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(129,140,248,0.4)',
                      color: warmupActive ? '#fca5a5' : '#c7d2fe',
                    }}
                  >{warmupActive ? t.warmupStop : t.warmupStart}</motion.button>
                )}
              </AnimatePresence>
              {warmupActive && (
                <motion.div
                  className="mt-3 flex gap-1"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full bg-indigo-400"
                      animate={{ height: [8, 20 + i * 4, 8] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2 }}
          className="text-center text-xs text-slate-600"
        >VocalGuard · {lang === 'nl' ? 'Voor professionele stemgebruikers' : 'For professional voice users'} · © 2026</motion.p>
      </div>
    </div>
  );
}