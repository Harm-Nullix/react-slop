import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';

const TRANSLATIONS = {
  en: {
    title: 'ThermoScribe',
    subtitle: 'Wildfire Evacuation Wind Planner',
    tagline: 'Your offline fire escape compass',
    addRoute: 'Add Escape Route',
    routeName: 'Route Name',
    routeDesc: 'Description / Landmarks',
    windDir: 'Current Wind Direction',
    windSpeed: 'Wind Speed (km/h)',
    safeDir: 'Safe Evacuation Directions',
    saveRoute: 'Save Route',
    savedRoutes: 'Saved Routes',
    noRoutes: 'No routes saved yet.',
    deleteRoute: 'Delete',
    danger: 'DANGER ZONE',
    safe: 'SAFE ZONE',
    windNote: 'Evacuate perpendicular or against the wind. Never downwind.',
    compassLabel: 'Wind Compass',
    lastUpdated: 'Last updated',
    now: 'just now',
    placeholder_name: 'e.g. North Forest Road',
    placeholder_desc: 'e.g. Turn left at old barn, uphill towards lake',
    deg: '°',
    kmh: 'km/h',
    north: 'N', south: 'S', east: 'E', west: 'W',
    ne: 'NE', nw: 'NW', se: 'SE', sw: 'SW',
    firePosition: 'Estimated Fire Position',
    fireNote: 'Set approximate fire bearing to visualize danger sector',
    toast_saved: 'Route saved!',
    toast_deleted: 'Route deleted.',
    emergencyTip: '🚨 Emergency Tip',
    emergencyText: 'If trapped: move to already-burned areas, avoid canyons & chimneys. Lie face-down in a ditch if necessary.',
    settings: 'Settings',
    language: 'Language',
    theme: 'Dark Mode',
  },
  nl: {
    title: 'ThermoScribe',
    subtitle: 'Bosbrand Evacuatie Windplanner',
    tagline: 'Jouw offline vluchtkompas',
    addRoute: 'Vluchtroute Toevoegen',
    routeName: 'Routenaam',
    routeDesc: 'Beschrijving / Oriëntatiepunten',
    windDir: 'Huidige Windrichting',
    windSpeed: 'Windsnelheid (km/u)',
    safeDir: 'Veilige Evacuatierichtingen',
    saveRoute: 'Route Opslaan',
    savedRoutes: 'Opgeslagen Routes',
    noRoutes: 'Nog geen routes opgeslagen.',
    deleteRoute: 'Verwijder',
    danger: 'GEVARENZONE',
    safe: 'VEILIGE ZONE',
    windNote: 'Evacueer loodrecht of tegen de wind in. Nooit met de wind mee.',
    compassLabel: 'Windkompas',
    lastUpdated: 'Laatst bijgewerkt',
    now: 'zojuist',
    placeholder_name: 'bijv. Noordelijk Bospad',
    placeholder_desc: 'bijv. Links afslaan bij oude schuur, bergop richting meer',
    deg: '°',
    kmh: 'km/u',
    north: 'N', south: 'Z', east: 'O', west: 'W',
    ne: 'NO', nw: 'NW', se: 'ZO', sw: 'ZW',
    firePosition: 'Geschatte Brandpositie',
    fireNote: 'Stel de brandrichting in om de gevarenzone te visualiseren',
    toast_saved: 'Route opgeslagen!',
    toast_deleted: 'Route verwijderd.',
    emergencyTip: '🚨 Noodtip',
    emergencyText: 'Als je klem zit: ga naar al-verbrande gebieden, vermijd ravijnen. Ga plat in een greppel als het moet.',
    settings: 'Instellingen',
    language: 'Taal',
    theme: 'Donkere Modus',
  }
};

type Lang = 'en' | 'nl';
type Route = { id: string; name: string; desc: string; bearing: number; createdAt: number };
type Toast = { id: string; msg: string; type: 'success' | 'error' };

function getBrowserLang(): Lang {
  const l = navigator.language?.slice(0, 2);
  return l === 'nl' ? 'nl' : 'en';
}

function bearingToCardinal(deg: number, t: typeof TRANSLATIONS['en']) {
  const dirs = [
    t.north, t.ne, t.east, t.se, t.south, t.sw, t.west, t.nw
  ];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

function getSafeDirections(windDeg: number, fireDeg: number) {
  // Safe = roughly opposite wind direction and away from fire
  const wind = ((windDeg % 360) + 360) % 360;
  const fire = ((fireDeg % 360) + 360) % 360;
  // perpendicular to wind, on the side away from fire
  const perp1 = (wind + 90) % 360;
  const perp2 = (wind + 270) % 360;
  const against = (wind + 180) % 360;
  // Score by distance from fire bearing
  const dist = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
  return [perp1, perp2, against].sort((a, b) => dist(b, fire) - dist(a, fire));
}

const COMPASS_LABELS = [
  { label: 'N', deg: 0 }, { label: 'NE', deg: 45 }, { label: 'E', deg: 90 },
  { label: 'SE', deg: 135 }, { label: 'S', deg: 180 }, { label: 'SW', deg: 225 },
  { label: 'W', deg: 270 }, { label: 'NW', deg: 315 },
];

function Compass({ windDeg, fireDeg, safeDirs, t }: { windDeg: number; fireDeg: number; safeDirs: number[]; t: typeof TRANSLATIONS['en'] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;

  const toXY = (deg: number, radius: number) => ({
    x: cx + radius * Math.sin((deg * Math.PI) / 180),
    y: cy - radius * Math.cos((deg * Math.PI) / 180),
  });

  const fireArc = (startDeg: number, endDeg: number) => {
    const start = toXY(startDeg, r);
    const end = toXY(endDeg, r);
    const large = ((endDeg - startDeg + 360) % 360) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
  };

  const windTip = toXY(windDeg, r - 10);
  const windBase = toXY((windDeg + 180) % 360, r - 10);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
      {/* Background rings */}
      {[r, r * 0.66, r * 0.33].map((radius, i) => (
        <circle key={i} cx={cx} cy={cy} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}

      {/* Fire danger arc (60 deg around fire bearing) */}
      <motion.path
        d={fireArc((fireDeg - 50 + 360) % 360, (fireDeg + 50) % 360)}
        fill="rgba(255,80,0,0.18)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      />

      {/* Safe direction arcs */}
      {safeDirs.slice(0, 2).map((sd, i) => (
        <motion.path key={i}
          d={fireArc((sd - 25 + 360) % 360, (sd + 25) % 360)}
          fill={i === 0 ? 'rgba(34,197,94,0.22)' : 'rgba(34,197,94,0.10)'}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
        />
      ))}

      {/* Compass tick marks */}
      {Array.from({ length: 36 }).map((_, i) => {
        const deg = i * 10;
        const inner = toXY(deg, r + 4);
        const outer = toXY(deg, r + (deg % 90 === 0 ? 14 : deg % 45 === 0 ? 10 : 6));
        return (
          <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke={deg % 90 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
            strokeWidth={deg % 90 === 0 ? 1.5 : 0.8} />
        );
      })}

      {/* Cardinal labels */}
      {COMPASS_LABELS.map(({ label, deg }) => {
        const pos = toXY(deg, r + 22);
        return (
          <text key={deg} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={deg % 90 === 0 ? 11 : 8}
            fontWeight={deg % 90 === 0 ? '700' : '400'}
            fill={deg % 90 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}>
            {label}
          </text>
        );
      })}

      {/* Fire position indicator */}
      <motion.g
        animate={{ rotate: fireDeg }}
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
      >
        {(() => {
          const tip = toXY(0, r - 8);
          return (
            <>
              <circle cx={tip.x} cy={tip.y} r={7} fill="rgba(255,80,0,0.9)" />
              <text x={tip.x} y={tip.y} textAnchor="middle" dominantBaseline="middle" fontSize="9">🔥</text>
            </>
          );
        })()}
      </motion.g>

      {/* Wind arrow */}
      <motion.g
        animate={{ rotate: windDeg }}
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      >
        {/* Arrow shaft */}
        <line x1={cx} y1={cy + (r - 18)} x2={cx} y2={cy - (r - 18)}
          stroke="#60a5fa" strokeWidth={2.5} strokeLinecap="round" />
        {/* Arrowhead pointing in wind direction (upward = north = 0) */}
        <polygon
          points={`${cx},${cy - (r - 10)} ${cx - 7},${cy - (r - 24)} ${cx + 7},${cy - (r - 24)}`}
          fill="#60a5fa" />
        {/* Tail feathers */}
        <line x1={cx} y1={cy + (r - 18)} x2={cx - 8} y2={cy + (r - 30)}
          stroke="#60a5fa" strokeWidth={1.5} />
        <line x1={cx} y1={cy + (r - 18)} x2={cx + 8} y2={cy + (r - 30)}
          stroke="#60a5fa" strokeWidth={1.5} />
      </motion.g>

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={5} fill="white" opacity={0.9} />

      {/* Safe direction arrows */}
      {safeDirs.slice(0, 1).map((sd, i) => {
        const tip2 = toXY(sd, r - 20);
        return (
          <motion.g key={i}
            animate={{ rotate: sd }}
            style={{ originX: `${cx}px`, originY: `${cy}px` }}
            transition={{ type: 'spring', stiffness: 50, damping: 12 }}
          >
            <polygon
              points={`${cx},${cy - (r - 20)} ${cx - 5},${cy - (r - 30)} ${cx + 5},${cy - (r - 30)}`}
              fill="#22c55e" opacity={0.9}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}

function ToastNotif({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl pointer-events-auto ${
              t.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function WindParticles({ windDeg }: { windDeg: number }) {
  const count = 18;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
      {Array.from({ length: count }).map((_, i) => {
        const delay = (i / count) * 3;
        const top = `${5 + Math.random() * 90}%`;
        const left = `${Math.random() * 100}%`;
        const dur = 2 + Math.random() * 2;
        const rad = (windDeg * Math.PI) / 180;
        const dx = Math.sin(rad) * 80;
        const dy = -Math.cos(rad) * 40;
        return (
          <motion.div key={i}
            style={{ top, left, position: 'absolute' }}
            animate={{ x: [0, dx], y: [0, dy], opacity: [0, 0.5, 0] }}
            transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
            className="w-8 h-[1px] bg-blue-300/40 rounded-full"
          />
        );
      })}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>(getBrowserLang);
  const t = TRANSLATIONS[lang];
  const [dark, setDark] = useState(() => {
    const s = localStorage.getItem('ts_dark');
    return s !== null ? s === '1' : true;
  });
  const [windDeg, setWindDeg] = useState(() => Number(localStorage.getItem('ts_wind') || 45));
  const [windSpeed, setWindSpeed] = useState(() => Number(localStorage.getItem('ts_windspeed') || 30));
  const [fireDeg, setFireDeg] = useState(() => Number(localStorage.getItem('ts_fire') || 135));
  const [routes, setRoutes] = useState<Route[]>(() => {
    try { return JSON.parse(localStorage.getItem('ts_routes') || '[]'); } catch { return []; }
  });
  const [routeName, setRouteName] = useState('');
  const [routeDesc, setRouteDesc] = useState('');
  const [routeBearing, setRouteBearing] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'compass'|'routes'|'tips'>('compass');
  const [draggingWind, setDraggingWind] = useState(false);
  const compassRef = useRef<HTMLDivElement>(null);

  const safeDirs = getSafeDirections(windDeg, fireDeg);

  // Persist settings
  useEffect(() => { localStorage.setItem('ts_wind', String(windDeg)); }, [windDeg]);
  useEffect(() => { localStorage.setItem('ts_windspeed', String(windSpeed)); }, [windSpeed]);
  useEffect(() => { localStorage.setItem('ts_fire', String(fireDeg)); }, [fireDeg]);
  useEffect(() => { localStorage.setItem('ts_dark', dark ? '1' : '0'); }, [dark]);
  useEffect(() => { localStorage.setItem('ts_routes', JSON.stringify(routes)); }, [routes]);

  // Set document title & meta
  useEffect(() => {
    document.title = `${t.title} – ${t.subtitle}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); (meta as HTMLMetaElement).name = 'description'; document.head.appendChild(meta); }
    (meta as HTMLMetaElement).content = t.tagline;
  }, [lang, t]);

  const addToast = useCallback((msg: string, type: 'success'|'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 2500);
  }, []);

  const saveRoute = () => {
    if (!routeName.trim()) return;
    const r: Route = { id: Date.now().toString(), name: routeName.trim(), desc: routeDesc.trim(), bearing: routeBearing, createdAt: Date.now() };
    setRoutes(p => [r, ...p]);
    setRouteName(''); setRouteDesc(''); setRouteBearing(0);
    setShowAdd(false);
    addToast(t.toast_saved);
  };

  const deleteRoute = (id: string) => {
    setRoutes(p => p.filter(r => r.id !== id));
    addToast(t.toast_deleted);
  };

  const dangerLevel = windSpeed > 60 ? 'extreme' : windSpeed > 30 ? 'high' : 'moderate';
  const dangerColor = dangerLevel === 'extreme' ? 'text-red-400' : dangerLevel === 'high' ? 'text-orange-400' : 'text-yellow-400';
  const dangerBg = dangerLevel === 'extreme' ? 'from-red-900/30' : dangerLevel === 'high' ? 'from-orange-900/20' : 'from-yellow-900/10';

  const bg = dark
    ? 'bg-[#0a0e1a] text-white'
    : 'bg-[#f0f4ff] text-gray-900';
  const card = dark
    ? 'bg-white/5 border-white/10'
    : 'bg-white/80 border-gray-200';
  const input = dark
    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-blue-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500';
  const label = dark ? 'text-white/60' : 'text-gray-500';
  const tabActive = dark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white';
  const tabInactive = dark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600';

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-500 font-sans`}>
      <ToastNotif toasts={toasts} onRemove={id => setToasts(p => p.filter(x => x.id !== id))} />

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-orange-500 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500 blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl"
              >🌬️</motion.span>
              <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${dark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                BETA
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${label}`}>{t.tagline}</p>
          </div>
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-2 rounded-xl border transition-all ${card} hover:scale-105 active:scale-95`}
          >
            <motion.span animate={{ rotate: showSettings ? 180 : 0 }} className="text-lg block">⚙️</motion.span>
          </button>
        </motion.div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 rounded-2xl border ${card} overflow-hidden`}
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${label}`}>{t.language}</span>
                  <div className="flex gap-2">
                    {(['en', 'nl'] as Lang[]).map(l => (
                      <button key={l} onClick={() => setLang(l)}
                        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                          lang === l ? tabActive : `${dark ? 'bg-white/10 text-white/50' : 'bg-gray-100 text-gray-400'} hover:scale-105`
                        }`}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${label}`}>{t.theme}</span>
                  <button onClick={() => setDark(d => !d)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      dark ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                    <motion.div
                      animate={{ x: dark ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Danger Badge */}
        <motion.div
          animate={{ scale: dangerLevel === 'extreme' ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`mb-4 rounded-2xl border ${card} bg-gradient-to-r ${dangerBg} to-transparent p-3 flex items-center gap-3`}
        >
          <span className="text-2xl">{dangerLevel === 'extreme' ? '🔴' : dangerLevel === 'high' ? '🟠' : '🟡'}</span>
          <div>
            <span className={`text-xs font-black tracking-widest uppercase ${dangerColor}`}>
              {dangerLevel === 'extreme' ? t.danger : dangerLevel === 'high' ? 'HIGH WIND' : 'MODERATE'}
            </span>
            <p className={`text-xs ${label} mt-0.5`}>{windSpeed} {t.kmh} · {bearingToCardinal(windDeg, t)}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-2xl border mb-4 ${card}`}>
          {(['compass', 'routes', 'tips'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab ? tabActive : tabInactive
              }`}>
              {tab === 'compass' ? '🧭' : tab === 'routes' ? '🗺️' : '💡'}
              <span className="ml-1 hidden sm:inline">{tab}</span>
            </button>
          ))}
        </div>

        {/* COMPASS TAB */}
        <AnimatePresence mode="wait">
          {activeTab === 'compass' && (
            <motion.div key="compass"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }} className="flex flex-col gap-4"
            >
              {/* Compass */}
              <div ref={compassRef} className={`relative rounded-3xl border ${card} flex flex-col items-center py-6 overflow-hidden`}>
                <WindParticles windDeg={windDeg} />
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${label}`}>{t.compassLabel}</p>
                <Compass windDeg={windDeg} fireDeg={fireDeg} safeDirs={safeDirs} t={t} />
                <div className={`mt-3 text-center`}>
                  <p className="text-xs">
                    <span className="text-blue-400 font-bold">💨 {t.windDir}:</span>
                    <span className={`ml-1 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                      {windDeg}{t.deg} ({bearingToCardinal(windDeg, t)})
                    </span>
                  </p>
                  <p className="text-xs mt-1">
                    <span className="text-orange-400 font-bold">🔥 {t.firePosition}:</span>
                    <span className={`ml-1 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                      {fireDeg}{t.deg} ({bearingToCardinal(fireDeg, t)})
                    </span>
                  </p>
                  <p className="text-xs mt-1">
                    <span className="text-green-400 font-bold">✅ {t.safeDir}:</span>
                    <span className={`ml-1 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                      {safeDirs.slice(0, 2).map(d => `${d}${t.deg}`).join(', ')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Wind Controls */}
              <div className={`rounded-2xl border ${card} p-4 flex flex-col gap-4`}>
                <div>
                  <label className={`text-xs font-semibold mb-2 flex justify-between ${label}`}>
                    <span>💨 {t.windDir}</span>
                    <span className="text-blue-400 font-bold">{windDeg}{t.deg}</span>
                  </label>
                  <div className="relative">
                    <input type="range" min={0} max={359} value={windDeg}
                      onChange={e => setWindDeg(Number(e.target.value))}
                      className="w-full accent-blue-500 h-2 rounded-full cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-semibold mb-2 flex justify-between ${label}`}>
                    <span>⚡ {t.windSpeed}</span>
                    <span className={`font-bold ${dangerColor}`}>{windSpeed} {t.kmh}</span>
                  </label>
                  <input type="range" min={0} max={120} value={windSpeed}
                    onChange={e => setWindSpeed(Number(e.target.value))}
                    className="w-full accent-orange-500 h-2 rounded-full cursor-pointer"
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold mb-1 flex justify-between ${label}`}>
                    <span>🔥 {t.firePosition}</span>
                    <span className="text-orange-400 font-bold">{fireDeg}{t.deg}</span>
                  </label>
                  <p className={`text-xs mb-2 ${label}`}>{t.fireNote}</p>
                  <input type="range" min={0} max={359} value={fireDeg}
                    onChange={e => setFireDeg(Number(e.target.value))}
                    className="w-full accent-red-500 h-2 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Wind note */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className={`rounded-xl border ${card} p-3 flex gap-2`}
              >
                <span className="text-lg">ℹ️</span>
                <p className={`text-xs leading-relaxed ${label}`}>{t.windNote}</p>
              </motion.div>
            </motion.div>
          )}

          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <motion.div key="routes"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }} className="flex flex-col gap-4"
            >
              <button onClick={() => setShowAdd(s => !s)}
                className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  dark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}>
                <motion.span animate={{ rotate: showAdd ? 45 : 0 }} className="text-lg">+</motion.span>
                {t.addRoute}
              </button>

              <AnimatePresence>
                {showAdd && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-2xl border ${card} overflow-hidden`}
                  >
                    <div className="p-4 flex flex-col gap-3">
                      <input
                        value={routeName} onChange={e => setRouteName(e.target.value)}
                        placeholder={t.placeholder_name}
                        className={`w-full px-3 py-2 rounded-xl border text-sm transition-all outline-none ${input}`}
                      />
                      <textarea
                        value={routeDesc} onChange={e => setRouteDesc(e.target.value)}
                        placeholder={t.placeholder_desc} rows={3}
                        className={`w-full px-3 py-2 rounded-xl border text-sm resize-none transition-all outline-none ${input}`}
                      />
                      <div>
                        <label className={`text-xs mb-1 flex justify-between ${label}`}>
                          <span>🧭 Route Bearing</span>
                          <span className="text-green-400 font-bold">{routeBearing}{t.deg} ({bearingToCardinal(routeBearing, t)})</span>
                        </label>
                        <input type="range" min={0} max={359} value={routeBearing}
                          onChange={e => setRouteBearing(Number(e.target.value))}
                          className="w-full accent-green-500 h-2 rounded-full cursor-pointer"
                        />
                      </div>
                      <button onClick={saveRoute}
                        className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20">
                        {t.saveRoute}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${label}`}>{t.savedRoutes} ({routes.length})</p>
                {routes.length === 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`text-sm text-center py-8 ${label}`}>{t.noRoutes}</motion.p>
                )}
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {routes.map((r, i) => {
                      const isSafe = safeDirs.slice(0, 2).some(sd => Math.abs(((r.bearing - sd + 540) % 360) - 180) < 40);
                      return (
                        <motion.div key={r.id}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: i * 0.05 }}
                          className={`rounded-2xl border ${card} p-3 flex items-start gap-3`}
                        >
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            <span className="text-xl">{isSafe ? '✅' : '⚠️'}</span>
                            <span className={`text-xs font-black ${ isSafe ? 'text-green-400' : 'text-orange-400'}`}>
                              {r.bearing}{t.deg}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{r.name}</p>
                            {r.desc && <p className={`text-xs mt-0.5 line-clamp-2 ${label}`}>{r.desc}</p>}
                            <p className={`text-xs mt-1 ${label}`}>
                              {bearingToCardinal(r.bearing, t)} · {isSafe ? t.safe : t.danger}
                            </p>
                          </div>
                          <button onClick={() => deleteRoute(r.id)}
                            className={`text-xs px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95 ${
                              dark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}>
                            ✕
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* TIPS TAB */}
          {activeTab === 'tips' && (
            <motion.div key="tips"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }} className="flex flex-col gap-3"
            >
              {[
                { icon: '🚨', title: t.emergencyTip, text: t.emergencyText, color: 'red' },
                { icon: '🌬️', title: lang === 'en' ? 'Wind Behavior' : 'Windgedrag', text: lang === 'en' ? 'Wildfires move 3x faster uphill. Wind can shift suddenly at canyon mouths. Always check local terrain features.' : 'Bosbranden bewegen 3x sneller bergopwaarts. Wind kan plotseling draaien bij ravijnen. Controleer altijd lokale terreinkenmerken.', color: 'blue' },
                { icon: '🗺️', title: lang === 'en' ? 'Route Planning' : 'Routeplanning', text: lang === 'en' ? 'Pre-plan at least 2 routes at 90° angles. Always include a water body route if available. Share your plan with someone not evacuating.' : 'Plan vooraf minimaal 2 routes op 90° hoek. Neem altijd een waterweg op indien beschikbaar. Deel je plan met iemand die niet evacuéert.', color: 'green' },
                { icon: '📱', title: lang === 'en' ? 'Offline First' : 'Offline Eerst', text: lang === 'en' ? 'This app works fully offline. All routes are saved locally. No internet needed during emergency evacuation.' : 'Deze app werkt volledig offline. Alle routes worden lokaal opgeslagen. Geen internet nodig bij noodevacuatie.', color: 'purple' },
                { icon: '🔥', title: lang === 'en' ? 'Fire Spotting' : 'Branddetectie', text: lang === 'en' ? 'Spot fires can jump 1km+ ahead of main fire front. Multiple smoke columns = multiple fronts. Never assume one direction is safe without verification.' : 'Vonkbranden kunnen 1km+ voor het hoofdvuurfront springen. Meerdere rookkolommen = meerdere fronten. Ga nooit blind van één veilige richting uit.', color: 'orange' },
              ].map(({ icon, title, text, color }, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border ${card} p-4`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className={`font-bold text-sm mb-1 ${
                        color === 'red' ? 'text-red-400' :
                        color === 'blue' ? 'text-blue-400' :
                        color === 'green' ? 'text-green-400' :
                        color === 'purple' ? 'text-purple-400' : 'text-orange-400'
                      }`}>{title}</p>
                      <p className={`text-xs leading-relaxed ${label}`}>{text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className={`rounded-2xl border ${card} p-4 text-center`}
              >
                <p className={`text-xs ${label}`}>
                  {lang === 'en'
                    ? '⚠️ ThermoScribe is a planning aid only. Always follow official evacuation orders from local authorities.'
                    : '⚠️ ThermoScribe is uitsluitend een planningshulpmiddel. Volg altijd officiële evacuatieopdrachten van lokale autoriteiten.'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className={`mt-6 text-center text-xs ${label}`}
        >
          {t.title} · {lang === 'en' ? 'Offline · No data collected' : 'Offline · Geen data verzameld'}
        </motion.div>
      </div>
    </div>
  );
}