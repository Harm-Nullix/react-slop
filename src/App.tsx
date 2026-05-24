import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';

const TRANSLATIONS = {
  en: {
    appName: 'NocturnalShift',
    tagline: 'Night shift survival, optimized',
    setupTitle: 'Configure Your Shift',
    shiftStart: 'Shift Starts',
    shiftEnd: 'Shift Ends',
    sleepGoal: 'Daily Sleep Goal (hours)',
    saveSetup: 'Start Tracking',
    dashboard: 'Dashboard',
    sleepLog: 'Sleep Log',
    schedule: 'Optimal Schedule',
    sleepDebt: 'Sleep Debt',
    hoursOwed: 'hours owed',
    logSleep: 'Log Sleep Session',
    sleepStart: 'Fell Asleep',
    sleepEnd: 'Woke Up',
    addLog: 'Add Entry',
    noLogs: 'No sleep logged yet',
    optimalSleep: 'Optimal Sleep Window',
    avoidLight: 'Avoid Bright Light',
    eatWindow: 'Meal Window',
    melatoninWindow: 'Melatonin Timing',
    recoveryScore: 'Recovery Score',
    circadianPhase: 'Circadian Phase',
    shiftTonight: 'Shift Tonight',
    yes: 'Yes',
    no: 'No',
    reset: 'Reset',
    hours: 'h',
    mins: 'm',
    today: 'Today',
    yesterday: 'Yesterday',
    debtWarning: 'High sleep debt detected. Prioritize recovery.',
    debtGood: 'Sleep debt within manageable range.',
    debtCritical: 'Critical sleep debt! Recovery urgently needed.',
    lightExposure: 'Light Exposure Guide',
    avoidLightDesc: 'Wear blue-light blocking glasses',
    seekLight: 'Seek Bright Light',
    seekLightDesc: 'Get sunlight or use light therapy lamp',
    mealTip: 'Eat light, high-protein meals during shift',
    melatoninTip: 'Take 0.5mg melatonin 1h before sleep window',
    weeklyPattern: 'Weekly Sleep Pattern',
    editShift: 'Edit Shift',
    currentDebt: 'Current Debt',
    accumulated: 'Accumulated over',
    days: 'days',
    clearOld: 'Clear old entries',
    deleteEntry: 'Delete',
  },
  nl: {
    appName: 'NocturnalShift',
    tagline: 'Nachtdienst overleven, geoptimaliseerd',
    setupTitle: 'Configureer Je Dienst',
    shiftStart: 'Dienst Begint',
    shiftEnd: 'Dienst Eindigt',
    sleepGoal: 'Dageliks Slaapsdoel (uren)',
    saveSetup: 'Begin Bijhouden',
    dashboard: 'Dashboard',
    sleepLog: 'Slaaplog',
    schedule: 'Optimaal Schema',
    sleepDebt: 'Slaaptekort',
    hoursOwed: 'uur tekort',
    logSleep: 'Slaap Registreren',
    sleepStart: 'In Slaap Gevallen',
    sleepEnd: 'Wakker Geworden',
    addLog: 'Toevoegen',
    noLogs: 'Nog geen slaap geregistreerd',
    optimalSleep: 'Optimaal Slaapvenster',
    avoidLight: 'Vermijd Fel Licht',
    eatWindow: 'Eetvenster',
    melatoninWindow: 'Melatonine Timing',
    recoveryScore: 'Herstelscore',
    circadianPhase: 'Circadiaanse Fase',
    shiftTonight: 'Dienst Vanavond',
    yes: 'Ja',
    no: 'Nee',
    reset: 'Resetten',
    hours: 'u',
    mins: 'm',
    today: 'Vandaag',
    yesterday: 'Gisteren',
    debtWarning: 'Hoog slaaptekort gedetecteerd. Prioriteer herstel.',
    debtGood: 'Slaaptekort binnen beheersbare marge.',
    debtCritical: 'Kritiek slaaptekort! Herstel dringend nodig.',
    lightExposure: 'Lichtblootstelling Gids',
    avoidLightDesc: 'Draag blauwlicht-blokkerende bril',
    seekLight: 'Zoek Fel Licht',
    seekLightDesc: 'Zoek zonlicht of gebruik lichttherapielamp',
    mealTip: 'Eet lichte, eiwitrijke maaltijden tijdens dienst',
    melatoninTip: 'Neem 0,5mg melatonine 1u voor slaapvenster',
    weeklyPattern: 'Wekelijks Slaappatroon',
    editShift: 'Dienst Bewerken',
    currentDebt: 'Huidig Tekort',
    accumulated: 'Opgebouwd over',
    days: 'dagen',
    clearOld: 'Verwijder oude invoer',
    deleteEntry: 'Verwijderen',
  },
};

function getLang(): 'en' | 'nl' {
  const lang = navigator.language || 'en';
  return lang.startsWith('nl') ? 'nl' : 'en';
}

function formatTime(h: number, m: number = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + hours * 60;
  const nh = Math.floor((total / 60) % 24);
  const nm = total % 60;
  return formatTime(nh, nm);
}

function timeDiffHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

interface SleepEntry {
  id: string;
  start: string;
  end: string;
  duration: number;
  date: string;
}

interface ShiftConfig {
  shiftStart: string;
  shiftEnd: string;
  sleepGoal: number;
  hasShiftTonight: boolean;
}

const defaultConfig: ShiftConfig = {
  shiftStart: '22:00',
  shiftEnd: '06:00',
  sleepGoal: 7,
  hasShiftTonight: true,
};

function ParticleField() {
  const particles = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: `rgba(${120 + Math.random() * 80}, ${80 + Math.random() * 60}, ${200 + Math.random() * 55}, ${0.3 + Math.random() * 0.4})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 50, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function MoonPhaseIcon({ phase }: { phase: number }) {
  const rotation = useSpring(phase * 360, { stiffness: 50, damping: 20 });
  return (
    <motion.div
      className="relative w-16 h-16"
      animate={{ rotate: [0, 5, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-300 via-purple-400 to-indigo-900 shadow-lg shadow-purple-500/50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 shadow-inner" />
      </div>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/60"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 45}deg) translateX(36px)`,
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
    </motion.div>
  );
}

function SleepDebtGauge({ debt, goal }: { debt: number; goal: number }) {
  const percentage = Math.min(debt / (goal * 3), 1);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference * (1 - percentage);
  const color = debt < 2 ? '#22c55e' : debt < 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDash }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <motion.circle
          cx="70" cy="70" r="46"
          fill="rgba(255,255,255,0.03)"
          animate={{ r: [46, 48, 46] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-3xl font-bold"
          style={{ color }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {debt.toFixed(1)}h
        </motion.div>
        <div className="text-xs text-white/50 mt-0.5">debt</div>
      </div>
    </div>
  );
}

function TimelineBar({ config, t }: { config: ShiftConfig; t: typeof TRANSLATIONS.en }) {
  const sleepStart = addHours(config.shiftEnd, 1);
  const sleepEnd = addHours(sleepStart, config.sleepGoal);
  const avoidLightEnd = addHours(config.shiftEnd, 2);
  const mealStart = addHours(config.shiftEnd, 1.5);
  const mealEnd = addHours(mealStart, 1);
  const melatoninTime = addHours(sleepStart, -1);

  const blocks = [
    { label: t.avoidLight, time: `${config.shiftEnd} – ${avoidLightEnd}`, color: 'from-red-500/80 to-orange-500/80', icon: '🕶️' },
    { label: t.melatoninWindow, time: melatoninTime, color: 'from-purple-500/80 to-indigo-500/80', icon: '💊' },
    { label: t.optimalSleep, time: `${sleepStart} – ${sleepEnd}`, color: 'from-indigo-600/80 to-blue-600/80', icon: '😴' },
    { label: t.eatWindow, time: `${mealStart} – ${mealEnd}`, color: 'from-emerald-500/80 to-teal-500/80', icon: '🥗' },
    { label: t.seekLight, time: addHours(sleepEnd, 0.5), color: 'from-yellow-400/80 to-amber-500/80', icon: '☀️' },
  ];

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02, x: 4 }}
          className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${block.color} backdrop-blur-sm border border-white/10 cursor-default`}
        >
          <span className="text-xl">{block.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{block.label}</div>
            <div className="text-xs text-white/70">{block.time}</div>
          </div>
          <motion.div
            className="w-2 h-2 rounded-full bg-white/60"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function WeeklyChart({ logs, goal }: { logs: SleepEntry[]; goal: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const byDay = days.map(date => {
    const total = logs.filter(l => l.date === date).reduce((a, b) => a + b.duration, 0);
    return { date, hours: total };
  });

  const maxH = Math.max(goal * 1.2, ...byDay.map(d => d.hours));

  return (
    <div className="flex items-end justify-between gap-1 h-24">
      {byDay.map((day, i) => {
        const height = day.hours > 0 ? Math.max((day.hours / maxH) * 96, 8) : 4;
        const color = day.hours >= goal ? '#22c55e' : day.hours >= goal * 0.7 ? '#f59e0b' : day.hours > 0 ? '#ef4444' : '#ffffff15';
        const label = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
        return (
          <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-full rounded-t-md rounded-b-sm relative overflow-hidden"
              style={{ height, background: color, boxShadow: `0 0 8px ${color}60` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, repeatDelay: 3 }}
                style={{ skewX: -20 }}
              />
            </motion.div>
            <div className="text-[9px] text-white/40">{label.charAt(0)}</div>
          </div>
        );
      })}
    </div>
  );
}

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <motion.button
    onClick={onClick}
    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'text-white' : 'text-white/40 hover:text-white/70'
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-white/10 rounded-lg border border-white/20"
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />
    )}
    <span className="relative z-10">{children}</span>
  </motion.button>
);

export default function App() {
  const lang = getLang();
  const t = TRANSLATIONS[lang];
  const [tab, setTab] = useState<'dashboard' | 'log' | 'schedule'>('dashboard');
  const [config, setConfig] = useState<ShiftConfig | null>(null);
  const [logs, setLogs] = useState<SleepEntry[]>([]);
  const [setupForm, setSetupForm] = useState<ShiftConfig>(defaultConfig);
  const [logForm, setLogForm] = useState({ start: '08:00', end: '15:00' });
  const [showLogForm, setShowLogForm] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    document.title = t.appName + ' — ' + t.tagline;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t.tagline);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = t.tagline;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const storedConfig = localStorage.getItem('ns_config');
    const storedLogs = localStorage.getItem('ns_logs');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
      setIsSetup(true);
    }
    if (storedLogs) setLogs(JSON.parse(storedLogs));
  }, []);

  const saveConfig = () => {
    localStorage.setItem('ns_config', JSON.stringify(setupForm));
    setConfig(setupForm);
    setIsSetup(true);
  };

  const addSleepLog = () => {
    const duration = timeDiffHours(logForm.start, logForm.end);
    const today = new Date().toISOString().split('T')[0];
    const entry: SleepEntry = {
      id: Date.now().toString(),
      start: logForm.start,
      end: logForm.end,
      duration,
      date: today,
    };
    const newLogs = [entry, ...logs].slice(0, 60);
    setLogs(newLogs);
    localStorage.setItem('ns_logs', JSON.stringify(newLogs));
    setShowLogForm(false);
  };

  const deleteLog = (id: string) => {
    const newLogs = logs.filter(l => l.id !== id);
    setLogs(newLogs);
    localStorage.setItem('ns_logs', JSON.stringify(newLogs));
  };

  const sleepDebt = (() => {
    if (!config) return 0;
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const totalSlept = last7.reduce((sum, date) => {
      return sum + logs.filter(l => l.date === date).reduce((a, b) => a + b.duration, 0);
    }, 0);
    const expected = config.sleepGoal * 7;
    return Math.max(0, expected - totalSlept);
  })();

  const recoveryScore = config ? Math.max(0, Math.round(100 - (sleepDebt / (config.sleepGoal * 2)) * 100)) : 0;

  const formatEntry = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (date === today) return t.today;
    if (date === yesterday) return t.yesterday;
    return date;
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-4 relative overflow-hidden">
        <ParticleField />
        <div className="fixed inset-0 bg-gradient-radial from-indigo-950/40 via-transparent to-transparent" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(99,60,180,0.25) 0%, transparent 60%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <MoonPhaseIcon phase={0.3} />
            </motion.div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{t.appName}</h1>
            <p className="text-indigo-300/70 mt-2 text-sm">{t.tagline}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white">{t.setupTitle}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest">{t.shiftStart}</label>
                <input
                  type="time"
                  value={setupForm.shiftStart}
                  onChange={e => setSetupForm(p => ({ ...p, shiftStart: e.target.value }))}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-indigo-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest">{t.shiftEnd}</label>
                <input
                  type="time"
                  value={setupForm.shiftEnd}
                  onChange={e => setSetupForm(p => ({ ...p, shiftEnd: e.target.value }))}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-indigo-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest">{t.sleepGoal}</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={4}
                    max={10}
                    step={0.5}
                    value={setupForm.sleepGoal}
                    onChange={e => setSetupForm(p => ({ ...p, sleepGoal: Number(e.target.value) }))}
                    className="flex-1 accent-indigo-400"
                  />
                  <span className="text-white font-bold w-10 text-right">{setupForm.sleepGoal}h</span>
                </div>
              </div>
            </div>
            <motion.button
              onClick={saveConfig}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
            >
              {t.saveSetup}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white relative overflow-hidden">
      <ParticleField />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(99,60,180,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(30,64,180,0.15) 0%, transparent 50%)' }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-10 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.appName}</h1>
            <p className="text-white/40 text-xs mt-0.5">{config?.shiftStart} – {config?.shiftEnd}</p>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={() => { setIsSetup(false); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 text-xs"
            >
              {t.editShift}
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>{t.dashboard}</TabButton>
          <TabButton active={tab === 'log'} onClick={() => setTab('log')}>{t.sleepLog}</TabButton>
          <TabButton active={tab === 'schedule'} onClick={() => setTab('schedule')}>{t.schedule}</TabButton>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Sleep Debt + Recovery */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                  <SleepDebtGauge debt={sleepDebt} goal={config!.sleepGoal} />
                  <div className="text-center">
                    <div className="text-xs text-white/40 uppercase tracking-widest">{t.sleepDebt}</div>
                    <div className="text-xs text-white/30">{t.accumulated} 7 {t.days}</div>
                  </div>
                </div>
                <div className="col-span-1 flex flex-col gap-3">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1">
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{t.recoveryScore}</div>
                    <motion.div
                      className="text-3xl font-bold"
                      style={{ color: recoveryScore > 75 ? '#22c55e' : recoveryScore > 40 ? '#f59e0b' : '#ef4444' }}
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      {recoveryScore}<span className="text-lg">%</span>
                    </motion.div>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: recoveryScore > 75 ? '#22c55e' : recoveryScore > 40 ? '#f59e0b' : '#ef4444' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${recoveryScore}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1">
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{t.shiftTonight}</div>
                    <div className="flex gap-2 mt-2">
                      {[true, false].map(v => (
                        <motion.button
                          key={v.toString()}
                          onClick={() => {
                            const updated = { ...config!, hasShiftTonight: v };
                            setConfig(updated);
                            localStorage.setItem('ns_config', JSON.stringify(updated));
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            config!.hasShiftTonight === v
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                              : 'bg-white/5 text-white/40'
                          }`}
                        >
                          {v ? t.yes : t.no}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  sleepDebt >= 10
                    ? 'border-red-500/30 bg-red-500/10'
                    : sleepDebt >= 4
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-emerald-500/30 bg-emerald-500/10'
                }`}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl mt-0.5"
                >
                  {sleepDebt >= 10 ? '🚨' : sleepDebt >= 4 ? '⚠️' : '✅'}
                </motion.div>
                <p className="text-sm text-white/80">
                  {sleepDebt >= 10 ? t.debtCritical : sleepDebt >= 4 ? t.debtWarning : t.debtGood}
                </p>
              </motion.div>

              {/* Weekly Chart */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-4">{t.weeklyPattern}</div>
                <WeeklyChart logs={logs} goal={config!.sleepGoal} />
                <div className="flex justify-between mt-3">
                  {['goal', 'partial', 'low', 'none'].map((k, i) => (
                    <div key={k} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-sm ${
                        i === 0 ? 'bg-green-400' : i === 1 ? 'bg-amber-400' : i === 2 ? 'bg-red-400' : 'bg-white/10'
                      }`} />
                      <span className="text-[9px] text-white/30">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/40">{logs.length} entries</div>
                <motion.button
                  onClick={() => setShowLogForm(!showLogForm)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                >
                  + {t.logSleep}
                </motion.button>
              </div>

              <AnimatePresence>
                {showLogForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-widest">{t.sleepStart}</label>
                          <input
                            type="time"
                            value={logForm.start}
                            onChange={e => setLogForm(p => ({ ...p, start: e.target.value }))}
                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-400/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-widest">{t.sleepEnd}</label>
                          <input
                            type="time"
                            value={logForm.end}
                            onChange={e => setLogForm(p => ({ ...p, end: e.target.value }))}
                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-400/50"
                          />
                        </div>
                      </div>
                      <div className="text-center text-white/40 text-sm">
                        {timeDiffHours(logForm.start, logForm.end).toFixed(1)}h sleep
                      </div>
                      <motion.button
                        onClick={addSleepLog}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium"
                      >
                        {t.addLog}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {logs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-white/30"
                >
                  <div className="text-5xl mb-4">😴</div>
                  <div>{t.noLogs}</div>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {logs.slice(0, 20).map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ x: 4 }}
                        className="group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-lg">😴</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{entry.start} – {entry.end}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              entry.duration >= config!.sleepGoal ? 'bg-green-500/20 text-green-400' :
                              entry.duration >= config!.sleepGoal * 0.7 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>{entry.duration.toFixed(1)}h</span>
                          </div>
                          <div className="text-xs text-white/30">{formatEntry(entry.date)}</div>
                        </div>
                        <motion.button
                          onClick={() => deleteLog(entry.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs transition-opacity"
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{t.circadianPhase}</div>
                <div className="flex items-center gap-3 mt-3">
                  <MoonPhaseIcon phase={0.3} />
                  <div>
                    <div className="text-sm text-white/70">Delayed phase protocol</div>
                    <div className="text-xs text-white/30 mt-1">Based on {config!.shiftStart}–{config!.shiftEnd} schedule</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-4">{t.optimalSleep} & {t.lightExposure}</div>
                <TimelineBar config={config!} t={t} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: '🥗', title: t.eatWindow, desc: t.mealTip, color: 'emerald' },
                  { icon: '💊', title: t.melatoninWindow, desc: t.melatoninTip, color: 'purple' },
                  { icon: '☀️', title: t.seekLight, desc: t.seekLightDesc, color: 'amber' },
                ].map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className={`p-4 rounded-2xl bg-${tip.color}-500/10 border border-${tip.color}-500/20`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{tip.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{tip.title}</div>
                        <div className="text-xs text-white/50 mt-1">{tip.desc}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom glow */}
      <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(8,11,20,0.9), transparent)' }} />
    </div>
  );
}