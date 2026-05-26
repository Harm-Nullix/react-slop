import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';

type Lang = 'nl' | 'en';

const translations = {
  nl: {
    appTitle: 'VocalAge – Stem Biomarker Leeftijdsschatting',
    tagline: 'Ontdek de biologische leeftijd van jouw stem',
    subtitle: 'Voor zangers, logopedisten en stemcoaches',
    startAnalysis: 'Begin Analyse',
    recordVoice: 'Neem stem op',
    stopRecording: 'Stop opname',
    analyzing: 'Analyseren...',
    vocalAge: 'Stemleeftijd',
    years: 'jaar',
    yourAge: 'Jouw leeftijd',
    pitchRange: 'Toonhoogtebereik',
    breathSupport: 'Ademondersteuning',
    resonance: 'Resonantie',
    articulation: 'Articulatie',
    consistency: 'Consistentie',
    history: 'Geschiedenis',
    noHistory: 'Nog geen opnames',
    tips: 'Stemtips',
    tip1: 'Adem vanuit het diafragma voor betere stemondersteuning',
    tip2: 'Hydratie is cruciaal: drink minimaal 2L water per dag',
    tip3: 'Warm je stem op voor intensief gebruik',
    tip4: 'Vermijd schreeuwen en fluisteren bij stemproblemen',
    excellent: 'Uitstekend',
    good: 'Goed',
    average: 'Gemiddeld',
    belowAverage: 'Onder gemiddeld',
    clearHistory: 'Geschiedenis wissen',
    scoreLabel: 'Stem Score',
    ageGap: 'Leeftijdsverschil',
    younger: 'jonger dan kalenderleeftijd',
    older: 'ouder dan kalenderleeftijd',
    same: 'gelijk aan kalenderleeftijd',
    enterAge: 'Voer uw leeftijd in',
    ageYears: 'jaar',
    recordingTip: 'Spreek duidelijk in de microfoon voor 5 seconden',
    permissionDenied: 'Microfoon toegang geweigerd',
    manualMode: 'Handmatige modus',
    manualDesc: 'Stel parameters handmatig in als u geen microfoon heeft',
    calculate: 'Bereken stemleeftijd',
    low: 'Laag',
    high: 'Hoog',
  },
  en: {
    appTitle: 'VocalAge – Voice Biomarker Age Estimator',
    tagline: 'Discover the biological age of your voice',
    subtitle: 'For singers, speech therapists and voice coaches',
    startAnalysis: 'Start Analysis',
    recordVoice: 'Record voice',
    stopRecording: 'Stop recording',
    analyzing: 'Analyzing...',
    vocalAge: 'Vocal Age',
    years: 'years',
    yourAge: 'Your age',
    pitchRange: 'Pitch Range',
    breathSupport: 'Breath Support',
    resonance: 'Resonance',
    articulation: 'Articulation',
    consistency: 'Consistency',
    history: 'History',
    noHistory: 'No recordings yet',
    tips: 'Voice Tips',
    tip1: 'Breathe from the diaphragm for better voice support',
    tip2: 'Hydration is crucial: drink at least 2L of water daily',
    tip3: 'Warm up your voice before intensive use',
    tip4: 'Avoid shouting and whispering when having voice issues',
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    belowAverage: 'Below Average',
    clearHistory: 'Clear history',
    scoreLabel: 'Voice Score',
    ageGap: 'Age difference',
    younger: 'younger than calendar age',
    older: 'older than calendar age',
    same: 'same as calendar age',
    enterAge: 'Enter your age',
    ageYears: 'years',
    recordingTip: 'Speak clearly into the microphone for 5 seconds',
    permissionDenied: 'Microphone access denied',
    manualMode: 'Manual mode',
    manualDesc: 'Set parameters manually if you don\'t have a microphone',
    calculate: 'Calculate vocal age',
    low: 'Low',
    high: 'High',
  }
};

interface VocalReading {
  id: string;
  date: string;
  vocalAge: number;
  calendarAge: number;
  score: number;
  pitchRange: number;
  breathSupport: number;
  resonance: number;
  articulation: number;
  consistency: number;
}

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(Math.round(value));
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, (duration * 1000) / steps);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display}</span>;
}

function RadialProgress({ value, size = 120, strokeWidth = 8, color = '#a78bfa' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ParamSlider({ label, value, onChange, lang }: { label: string; value: number; onChange: (v: number) => void; lang: Lang }) {
  const t = translations[lang];
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs" style={{ color: 'rgba(196,181,253,0.7)' }}>
        <span>{label}</span>
        <span style={{ color: '#a78bfa' }}>{value}%</span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'rgba(139,92,246,0.2)' }}>
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', width: `${value}%` }}
          layout
          transition={{ type: 'spring', stiffness: 300 }}
        />
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 2 }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
        <span>{t.low}</span>
        <span>{t.high}</span>
      </div>
    </div>
  );
}

const SCORE_COLORS = {
  excellent: '#4ade80',
  good: '#a3e635',
  average: '#fbbf24',
  belowAverage: '#f87171',
};

function getScoreLabel(score: number, t: typeof translations['en']) {
  if (score >= 80) return { label: t.excellent, color: SCORE_COLORS.excellent };
  if (score >= 60) return { label: t.good, color: SCORE_COLORS.good };
  if (score >= 40) return { label: t.average, color: SCORE_COLORS.average };
  return { label: t.belowAverage, color: SCORE_COLORS.belowAverage };
}

function computeVocalAge(calendarAge: number, params: { pitchRange: number; breathSupport: number; resonance: number; articulation: number; consistency: number }): { vocalAge: number; score: number } {
  const avg = (params.pitchRange + params.breathSupport + params.resonance + params.articulation + params.consistency) / 5;
  const score = Math.round(avg);
  // Higher score = younger vocal age relative to calendar age
  const deviation = (50 - avg) / 5;
  const vocalAge = Math.max(18, Math.min(90, Math.round(calendarAge + deviation)));
  return { vocalAge, score };
}

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {bars.map(i => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 3, background: 'linear-gradient(180deg, #a78bfa, #7c3aed)' }}
          animate={active ? {
            height: [4, Math.random() * 28 + 8, 4],
          } : { height: 4 }}
          transition={active ? {
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.04,
            ease: 'easeInOut',
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const lang: Lang = typeof navigator !== 'undefined' && navigator.language?.startsWith('nl') ? 'nl' : 'en';
  const t = translations[lang];

  useEffect(() => {
    document.title = t.appTitle;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', t.tagline);
  }, [lang]);

  const [step, setStep] = useState<'intro' | 'input' | 'result'>('intro');
  const [calendarAge, setCalendarAge] = useState(35);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const [micError, setMicError] = useState(false);
  const [params, setParams] = useState({ pitchRange: 60, breathSupport: 65, resonance: 55, articulation: 70, consistency: 60 });
  const [result, setResult] = useState<VocalReading | null>(null);
  const [history, setHistory] = useState<VocalReading[]>(() => {
    try { return JSON.parse(localStorage.getItem('vocalage-history') || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const recTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const saveHistory = useCallback((readings: VocalReading[]) => {
    localStorage.setItem('vocalage-history', JSON.stringify(readings));
    setHistory(readings);
  }, []);

  const startRecording = async () => {
    setMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      setIsRecording(true);
      // Simulate 5s recording then analyze
      recTimeout.current = setTimeout(() => {
        stopRecording(true);
      }, 5000);
    } catch {
      setMicError(true);
      setUseManual(true);
    }
  };

  const stopRecording = useCallback((auto = false) => {
    if (recTimeout.current) clearTimeout(recTimeout.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    setIsRecording(false);
    if (auto || !useManual) {
      // Simulate audio analysis with randomized but plausible params
      setIsAnalyzing(true);
      setTimeout(() => {
        const simParams = {
          pitchRange: Math.round(40 + Math.random() * 50),
          breathSupport: Math.round(40 + Math.random() * 50),
          resonance: Math.round(35 + Math.random() * 55),
          articulation: Math.round(45 + Math.random() * 50),
          consistency: Math.round(40 + Math.random() * 50),
        };
        setParams(simParams);
        finalizeResult(simParams);
      }, 2200);
    }
  }, [useManual, calendarAge]);

  const finalizeResult = (p = params) => {
    const { vocalAge, score } = computeVocalAge(calendarAge, p);
    const reading: VocalReading = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      vocalAge,
      calendarAge,
      score,
      ...p,
    };
    setResult(reading);
    const updated = [reading, ...history].slice(0, 20);
    saveHistory(updated);
    setIsAnalyzing(false);
    setStep('result');
  };

  const ageGap = result ? result.calendarAge - result.vocalAge : 0;

  const particlePositions = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 3,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0d3d 40%, #0d1a35 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {particlePositions.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              background: 'rgba(167,139,250,0.4)',
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1], y: [0, -15, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute rounded-full"
          style={{ width: 400, height: 400, top: '10%', left: '5%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: 350, height: 350, bottom: '10%', right: '5%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd' }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            {t.subtitle}
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #e9d5ff 0%, #a78bfa 50%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>VocalAge</h1>
          <p className="text-sm md:text-base" style={{ color: 'rgba(196,181,253,0.7)' }}>{t.tagline}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* INTRO STEP */}
          {step === 'intro' && (
            <motion.div key="intro"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md flex flex-col items-center gap-6"
            >
              {/* Central orb */}
              <motion.div className="relative" style={{ width: 180, height: 180 }}>
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute inset-4 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 60px rgba(124,58,237,0.6)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(167,139,250,0.3), transparent, rgba(167,139,250,0.3))' }} />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                      <path d="M30 10 C30 10 20 20 20 30 C20 40 25 45 30 50 C35 45 40 40 40 30 C40 20 30 10 30 10Z" fill="rgba(233,213,255,0.9)" />
                      <ellipse cx="30" cy="28" rx="6" ry="8" fill="rgba(124,58,237,0.8)" />
                      <path d="M20 32 Q18 35 16 32" stroke="rgba(233,213,255,0.6)" strokeWidth="1.5" fill="none" />
                      <path d="M40 32 Q42 35 44 32" stroke="rgba(233,213,255,0.6)" strokeWidth="1.5" fill="none" />
                      <path d="M24 40 Q30 44 36 40" stroke="rgba(233,213,255,0.6)" strokeWidth="1.5" fill="none" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>

              <div className="text-center px-4">
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(196,181,253,0.8)' }}>
                  {lang === 'nl'
                    ? 'Analyseer de biomarkers van jouw stem en ontdek of je vocale leeftijd overeenkomt met je kalenderleeftijd. Ideaal voor zangers, logopedisten en stemcoaches.'
                    : 'Analyze your voice biomarkers and discover if your vocal age matches your calendar age. Ideal for singers, speech therapists and voice coaches.'}
                </p>
              </div>

              <motion.button
                onClick={() => setStep('input')}
                className="px-8 py-4 rounded-2xl font-semibold text-white text-base relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 30px rgba(124,58,237,0.5)' }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 40px rgba(124,58,237,0.7)' }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />
                {t.startAnalysis}
              </motion.button>

              {history.length > 0 && (
                <motion.button
                  onClick={() => setShowHistory(true)}
                  className="text-sm underline"
                  style={{ color: 'rgba(167,139,250,0.7)' }}
                  whileHover={{ color: '#a78bfa' }}
                >
                  {t.history} ({history.length})
                </motion.button>
              )}
            </motion.div>
          )}

          {/* INPUT STEP */}
          {step === 'input' && (
            <motion.div key="input"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md flex flex-col gap-5"
            >
              {/* Age input */}
              <motion.div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.2)', backdropFilter: 'blur(20px)' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                <label className="block text-sm mb-3 font-medium" style={{ color: '#c4b5fd' }}>{t.enterAge}</label>
                <div className="flex items-center gap-3">
                  <motion.button onClick={() => setCalendarAge(a => Math.max(18, a - 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ background: 'rgba(124,58,237,0.3)', color: '#e9d5ff' }}
                    whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.5)' }}
                    whileTap={{ scale: 0.9 }}>−</motion.button>
                  <div className="flex-1 text-center">
                    <motion.span className="text-4xl font-bold" style={{ color: '#e9d5ff' }}
                      key={calendarAge}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >{calendarAge}</motion.span>
                    <span className="text-sm ml-2" style={{ color: 'rgba(196,181,253,0.6)' }}>{t.ageYears}</span>
                  </div>
                  <motion.button onClick={() => setCalendarAge(a => Math.min(90, a + 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ background: 'rgba(124,58,237,0.3)', color: '#e9d5ff' }}
                    whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.5)' }}
                    whileTap={{ scale: 0.9 }}>+</motion.button>
                </div>
                <input type="range" min={18} max={90} value={calendarAge}
                  onChange={e => setCalendarAge(Number(e.target.value))}
                  className="w-full mt-3" style={{ accentColor: '#7c3aed' }} />
              </motion.div>

              {/* Recording section */}
              {!useManual && (
                <motion.div
                  className="rounded-2xl p-5 flex flex-col items-center gap-4"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.2)', backdropFilter: 'blur(20px)' }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-center" style={{ color: 'rgba(196,181,253,0.6)' }}>{t.recordingTip}</p>
                  <Waveform active={isRecording} />
                  {isAnalyzing ? (
                    <motion.div className="flex items-center gap-2" style={{ color: '#a78bfa' }}
                      animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>
                      <motion.div className="w-4 h-4 border-2 rounded-full" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      {t.analyzing}
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={isRecording ? () => stopRecording(true) : startRecording}
                      className="px-6 py-3 rounded-2xl font-semibold text-white relative overflow-hidden"
                      style={{
                        background: isRecording
                          ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                          : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        boxShadow: isRecording ? '0 4px 20px rgba(220,38,38,0.4)' : '0 4px 20px rgba(124,58,237,0.4)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isRecording ? (
                        <motion.span className="flex items-center gap-2">
                          <motion.div className="w-3 h-3 rounded-full bg-white"
                            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                          {t.stopRecording}
                        </motion.span>
                      ) : t.recordVoice}
                    </motion.button>
                  )}
                  {micError && (
                    <p className="text-xs text-center" style={{ color: '#f87171' }}>{t.permissionDenied}</p>
                  )}
                </motion.div>
              )}

              {/* Manual toggle */}
              <motion.button
                onClick={() => setUseManual(m => !m)}
                className="text-xs underline text-center"
                style={{ color: 'rgba(167,139,250,0.6)' }}
                whileHover={{ color: '#a78bfa' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              >
                {t.manualMode}
              </motion.button>

              {/* Manual params */}
              <AnimatePresence>
                {useManual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl p-5 flex flex-col gap-4 overflow-hidden"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(167,139,250,0.15)', backdropFilter: 'blur(20px)' }}
                  >
                    <p className="text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>{t.manualDesc}</p>
                    <ParamSlider label={t.pitchRange} value={params.pitchRange} onChange={v => setParams(p => ({...p, pitchRange: v}))} lang={lang} />
                    <ParamSlider label={t.breathSupport} value={params.breathSupport} onChange={v => setParams(p => ({...p, breathSupport: v}))} lang={lang} />
                    <ParamSlider label={t.resonance} value={params.resonance} onChange={v => setParams(p => ({...p, resonance: v}))} lang={lang} />
                    <ParamSlider label={t.articulation} value={params.articulation} onChange={v => setParams(p => ({...p, articulation: v}))} lang={lang} />
                    <ParamSlider label={t.consistency} value={params.consistency} onChange={v => setParams(p => ({...p, consistency: v}))} lang={lang} />
                    <motion.button
                      onClick={() => finalizeResult()}
                      className="mt-2 py-3 rounded-xl font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >{t.calculate}</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* RESULT STEP */}
          {step === 'result' && result && (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
              className="w-full max-w-md flex flex-col gap-5"
            >
              {/* Main result card */}
              <motion.div
                className="rounded-3xl p-6 text-center relative overflow-hidden"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(167,139,250,0.3)', backdropFilter: 'blur(30px)' }}
              >
                <motion.div className="absolute inset-0 rounded-3xl"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.15), transparent 60%)' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }} />
                
                <p className="text-sm mb-1 relative z-10" style={{ color: 'rgba(196,181,253,0.7)' }}>{t.vocalAge}</p>
                <motion.div
                  className="text-7xl font-bold mb-2 relative z-10"
                  style={{ background: 'linear-gradient(135deg, #e9d5ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <AnimatedNumber value={result.vocalAge} />
                  <span className="text-2xl ml-1">{t.years}</span>
                </motion.div>

                {ageGap !== 0 && (
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 relative z-10"
                    style={{
                      background: ageGap > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                      border: `1px solid ${ageGap > 0 ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
                      color: ageGap > 0 ? '#4ade80' : '#f87171',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span>{ageGap > 0 ? '↑' : '↓'} {Math.abs(ageGap)} {t.years}</span>
                    <span style={{ opacity: 0.8 }}>{ageGap > 0 ? t.younger : t.older}</span>
                  </motion.div>
                )}

                {/* Score ring */}
                <div className="flex items-center justify-center gap-6 relative z-10 mt-2">
                  <div className="relative">
                    <RadialProgress value={result.score} color={getScoreLabel(result.score, t).color} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold" style={{ color: getScoreLabel(result.score, t).color }}>
                        <AnimatedNumber value={result.score} />
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>{t.scoreLabel}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <motion.div
                      className="text-lg font-semibold"
                      style={{ color: getScoreLabel(result.score, t).color }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    >
                      {getScoreLabel(result.score, t).label}
                    </motion.div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.6)' }}>
                      {t.yourAge}: {result.calendarAge} {t.years}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Param breakdown */}
              <motion.div
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(167,139,250,0.15)', backdropFilter: 'blur(20px)' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              >
                {[
                  { label: t.pitchRange, value: result.pitchRange },
                  { label: t.breathSupport, value: result.breathSupport },
                  { label: t.resonance, value: result.resonance },
                  { label: t.articulation, value: result.articulation },
                  { label: t.consistency, value: result.consistency },
                ].map((p, i) => (
                  <motion.div key={p.label} className="flex flex-col gap-1"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                    <div className="flex justify-between text-xs" style={{ color: 'rgba(196,181,253,0.7)' }}>
                      <span>{p.label}</span>
                      <span style={{ color: '#a78bfa' }}>{p.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(139,92,246,0.2)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, #7c3aed, ${p.value > 70 ? '#4ade80' : p.value > 50 ? '#a78bfa' : '#f87171'})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.value}%` }}
                        transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Tips toggle */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <motion.button
                  onClick={() => setShowTips(s => !s)}
                  className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-between px-5"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd' }}
                  whileHover={{ background: 'rgba(124,58,237,0.2)' }}
                >
                  <span>{t.tips}</span>
                  <motion.span animate={{ rotate: showTips ? 180 : 0 }} transition={{ duration: 0.3 }}>▼</motion.span>
                </motion.button>
                <AnimatePresence>
                  {showTips && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(167,139,250,0.1)' }}>
                        {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
                          <motion.div key={i} className="flex gap-3 text-sm"
                            initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                            <span style={{ color: '#a78bfa' }}>✦</span>
                            <span style={{ color: 'rgba(196,181,253,0.8)' }}>{tip}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Actions */}
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                <motion.button
                  onClick={() => { setStep('intro'); setResult(null); setUseManual(false); setMicError(false); }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >← {lang === 'nl' ? 'Terug' : 'Back'}</motion.button>
                <motion.button
                  onClick={() => setShowHistory(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >{t.history}</motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
                onClick={() => setShowHistory(false)} />
              <motion.div
                className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(15,10,30,0.98), rgba(26,13,61,0.98))', border: '1px solid rgba(167,139,250,0.3)', maxHeight: '80vh', overflowY: 'auto' }}
                initial={{ y: 80, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 80, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold" style={{ color: '#e9d5ff' }}>{t.history}</h2>
                  <div className="flex gap-3">
                    {history.length > 0 && (
                      <motion.button onClick={() => { saveHistory([]); setShowHistory(false); }}
                        className="text-xs" style={{ color: '#f87171' }}
                        whileHover={{ scale: 1.05 }}>{t.clearHistory}</motion.button>
                    )}
                    <motion.button onClick={() => setShowHistory(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                      style={{ background: 'rgba(167,139,250,0.2)', color: '#c4b5fd' }}
                      whileHover={{ scale: 1.1 }}>✕</motion.button>
                  </div>
                </div>
                {history.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>{t.noHistory}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {history.map((h, i) => (
                      <motion.div key={h.id}
                        className="rounded-2xl p-4"
                        style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.15)' }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.5)' }}>{h.date}</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold" style={{ color: '#a78bfa' }}>{h.vocalAge}</span>
                              <span className="text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>{t.vocalAge}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold" style={{ color: getScoreLabel(h.score, t).color }}>{getScoreLabel(h.score, t).label}</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.5)' }}>{t.yourAge}: {h.calendarAge}</div>
                          </div>
                        </div>
                        <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(139,92,246,0.2)' }}>
                          <motion.div className="h-full rounded-full" style={{ background: getScoreLabel(h.score, t).color, width: `${h.score}%` }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}