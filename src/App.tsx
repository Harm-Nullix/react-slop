import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

type Lang = 'en' | 'nl';

const translations = {
  en: {
    title: 'GlacierGaze',
    subtitle: 'Crevasse Stress Cartography',
    tap: 'Tap to log ice density',
    instruction: 'Tap rhythmically on the ice field. Each pulse records density. The waveform predicts structural integrity.',
    integrity: 'Structural Integrity',
    samples: 'Density Samples',
    risk: 'Crevasse Risk',
    low: 'Stable',
    med: 'Caution',
    high: 'Critical',
    sessions: 'Field Sessions',
    save: 'Archive Session',
    clear: 'Clear Field',
    depth: 'Predicted Depth',
    meters: 'm',
    new: 'New Session',
    noSessions: 'No archived sessions yet',
    location: 'Location tag',
    locPlaceholder: 'e.g. Mer de Glace, NW face',
    analysis: 'Live Analysis',
    frequency: 'Tap Frequency',
    hz: 'Hz',
    coherence: 'Signal Coherence'
  },
  nl: {
    title: 'GlacierGaze',
    subtitle: 'Gletsjerspleet Stresskartering',
    tap: 'Tik om ijsdichtheid vast te leggen',
    instruction: 'Tik ritmisch op het ijsveld. Elke puls registreert dichtheid. De golfvorm voorspelt structurele integriteit.',
    integrity: 'Structurele Integriteit',
    samples: 'Dichtheidsmonsters',
    risk: 'Spleetrisico',
    low: 'Stabiel',
    med: 'Voorzichtig',
    high: 'Kritiek',
    sessions: 'Veldsessies',
    save: 'Sessie Archiveren',
    clear: 'Veld Wissen',
    depth: 'Voorspelde Diepte',
    meters: 'm',
    new: 'Nieuwe Sessie',
    noSessions: 'Nog geen gearchiveerde sessies',
    location: 'Locatie tag',
    locPlaceholder: 'bv. Mer de Glace, NW wand',
    analysis: 'Live Analyse',
    frequency: 'Tikfrequentie',
    hz: 'Hz',
    coherence: 'Signaalcoherentie'
  }
};

interface Tap {
  t: number;
  x: number;
  y: number;
  intensity: number;
}

interface Session {
  id: string;
  location: string;
  timestamp: number;
  taps: Tap[];
  integrity: number;
  depth: number;
}

export default function App() {
  const lang: Lang = typeof navigator !== 'undefined' && navigator.language.startsWith('nl') ? 'nl' : 'en';
  const t = translations[lang];

  const [taps, setTaps] = useState<Tap[]>([]);
  const [location, setLocation] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const glowX = useTransform(sx, v => `${v}px`);
  const glowY = useTransform(sy, v => `${v}px`);

  useEffect(() => {
    document.title = `${t.title} — ${t.subtitle}`;
    const stored = localStorage.getItem('glaciergaze-sessions');
    if (stored) setSessions(JSON.parse(stored));
  }, [t.title, t.subtitle]);

  useEffect(() => {
    localStorage.setItem('glaciergaze-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Derived metrics
  const integrity = useCallback(() => {
    if (taps.length < 2) return 100;
    const intervals: number[] = [];
    for (let i = 1; i < taps.length; i++) intervals.push(taps[i].t - taps[i - 1].t);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean;
    const coherence = Math.max(0, 1 - cv);
    const density = Math.min(1, taps.length / 30);
    return Math.round((coherence * 0.6 + density * 0.4) * 100);
  }, [taps]);

  const frequency = useCallback(() => {
    if (taps.length < 2) return 0;
    const span = (taps[taps.length - 1].t - taps[0].t) / 1000;
    return span > 0 ? taps.length / span : 0;
  }, [taps]);

  const depth = useCallback(() => {
    const integ = integrity();
    const freq = frequency();
    return Math.round((100 - integ) * 0.8 + freq * 12);
  }, [integrity, frequency]);

  const integ = integrity();
  const freq = frequency();
  const dep = depth();
  const riskLevel = integ > 70 ? 'low' : integ > 40 ? 'med' : 'high';
  const riskColor = riskLevel === 'low' ? '#5eead4' : riskLevel === 'med' ? '#fbbf24' : '#f87171';

  const handleTap = (e: React.PointerEvent) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const intensity = 0.5 + Math.random() * 0.5;
    setTaps(prev => [...prev, { t: Date.now(), x, y, intensity }]);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const saveSession = () => {
    if (taps.length === 0) return;
    const session: Session = {
      id: crypto.randomUUID(),
      location: location || '—',
      timestamp: Date.now(),
      taps,
      integrity: integ,
      depth: dep
    };
    setSessions(prev => [session, ...prev]);
    setTaps([]);
    setLocation('');
  };

  const clearField = () => {
    setTaps([]);
  };

  // Waveform generation
  const generateWave = () => {
    if (taps.length === 0) return '';
    const width = 600;
    const height = 80;
    const points: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * width;
      let y = height / 2;
      taps.forEach((tap, idx) => {
        const phase = (idx / taps.length) * Math.PI * 4;
        const amp = tap.intensity * 20;
        const decay = Math.exp(-Math.abs(i / 100 - idx / taps.length) * 8);
        y += Math.sin(i / 100 * Math.PI * 8 + phase) * amp * decay;
      });
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative" style={{
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 60%, #000 100%)',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    }}>
      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
          animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{ background: riskColor, boxShadow: `0 0 20px ${riskColor}` }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <h1 className="text-2xl md:text-4xl font-light tracking-[0.3em] text-cyan-50">
                {t.title.toUpperCase()}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-cyan-200/50 tracking-widest uppercase">{t.subtitle}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowArchive(!showArchive)}
            className="text-xs text-cyan-200/70 border border-cyan-200/20 rounded-full px-4 py-2 hover:border-cyan-200/60 transition-colors backdrop-blur-sm"
          >
            {t.sessions} ({sessions.length})
          </motion.button>
        </motion.header>

        {/* Metrics row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: t.integrity, value: integ, unit: '%', color: riskColor },
            { label: t.depth, value: dep, unit: t.meters, color: '#a5f3fc' },
            { label: t.frequency, value: freq.toFixed(2), unit: t.hz, color: '#c4b5fd' },
            { label: t.samples, value: taps.length, unit: '', color: '#fde68a' }
          ].map((m, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-white/[0.02] p-4"
            >
              <div className="text-[10px] tracking-widest uppercase text-white/40 mb-2">{m.label}</div>
              <div className="flex items-baseline gap-1">
                <motion.span
                  key={String(m.value)}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl md:text-3xl font-light tabular-nums"
                  style={{ color: m.color }}
                >
                  {m.value}
                </motion.span>
                <span className="text-xs text-white/40">{m.unit}</span>
              </div>
              <motion.div
                className="absolute bottom-0 left-0 h-[2px]"
                style={{ background: m.color }}
                animate={{ width: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Ice Field - the main interaction */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          ref={fieldRef}
          onPointerDown={handleTap}
          onPointerMove={handleMove}
          className="relative h-[340px] md:h-[420px] rounded-3xl overflow-hidden cursor-crosshair border border-cyan-200/10 select-none"
          style={{
            background: 'linear-gradient(180deg, rgba(165,243,252,0.05) 0%, rgba(2,6,23,0.8) 100%)',
            touchAction: 'none'
          }}
        >
          {/* Crystalline grid */}
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <defs>
              <pattern id="hex" width="40" height="35" patternUnits="userSpaceOnUse">
                <path d="M20,0 L40,11 L40,24 L20,35 L0,24 L0,11 Z" fill="none" stroke="#67e8f9" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex)" />
          </svg>

          {/* Cursor glow */}
          <motion.div
            className="absolute pointer-events-none w-40 h-40 rounded-full blur-2xl"
            style={{
              left: glowX,
              top: glowY,
              x: '-50%',
              y: '-50%',
              background: 'radial-gradient(circle, rgba(103,232,249,0.3) 0%, transparent 70%)'
            }}
          />

          {/* Tap pulses */}
          <AnimatePresence>
            {taps.map((tap, i) => (
              <motion.div
                key={`${tap.t}-${i}`}
                className="absolute pointer-events-none"
                style={{ left: `${tap.x}%`, top: `${tap.y}%` }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 3, 5], opacity: [1, 0.6, 0] }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
              >
                <div
                  className="w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    border: `1px solid ${riskColor}`,
                    boxShadow: `0 0 30px ${riskColor}`
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Persistent dots */}
          {taps.map((tap, i) => (
            <motion.div
              key={`dot-${tap.t}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${tap.x}%`,
                top: `${tap.y}%`,
                background: '#a5f3fc',
                boxShadow: '0 0 8px #67e8f9'
              }}
            />
          ))}

          {/* Connecting lines between taps */}
          {taps.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {taps.slice(1).map((tap, i) => {
                const prev = taps[i];
                return (
                  <motion.line
                    key={`line-${tap.t}`}
                    x1={`${prev.x}%`} y1={`${prev.y}%`}
                    x2={`${tap.x}%`} y2={`${tap.y}%`}
                    stroke="#67e8f9"
                    strokeWidth="0.5"
                    strokeDasharray="2 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    transition={{ duration: 0.6 }}
                  />
                );
              })}
            </svg>
          )}

          {/* Instruction overlay */}
          {taps.length === 0 && (
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 text-center"
            >
              <div>
                <div className="text-xs tracking-widest uppercase text-cyan-200/60 mb-2">{t.tap}</div>
                <div className="text-[10px] text-cyan-200/40 max-w-xs">{t.instruction}</div>
              </div>
            </motion.div>
          )}

          {/* Risk indicator corner */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{t.risk}</div>
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-medium tracking-wider"
              style={{ color: riskColor }}
            >
              {t[riskLevel as 'low' | 'med' | 'high']}
            </motion.div>
          </div>
        </motion.div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/[0.02] p-4"
        >
          <div className="text-[10px] tracking-widest uppercase text-white/40 mb-2">{t.analysis}</div>
          <svg viewBox="0 0 600 80" className="w-full h-16" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#a5f3fc" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <line x1="0" y1="40" x2="600" y2="40" stroke="#ffffff10" strokeDasharray="2 4" />
            {taps.length > 0 && (
              <motion.path
                d={generateWave()}
                fill="none"
                stroke="url(#waveGrad)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            )}
          </svg>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4 flex flex-col md:flex-row gap-3"
        >
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={t.locPlaceholder}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cyan-50 placeholder:text-white/30 focus:outline-none focus:border-cyan-200/40 transition-colors backdrop-blur-sm"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveSession}
            disabled={taps.length === 0}
            className="px-6 py-3 rounded-xl text-sm font-medium tracking-wide text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #67e8f9, #a5f3fc)' }}
          >
            {t.save}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearField}
            disabled={taps.length === 0}
            className="px-6 py-3 rounded-xl text-sm border border-white/10 text-white/70 hover:border-white/30 disabled:opacity-30 transition-colors"
          >
            {t.clear}
          </motion.button>
        </motion.div>

        {/* Archive overlay */}
        <AnimatePresence>
          {showArchive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowArchive(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/90 p-6"
              >
                <h2 className="text-lg font-light tracking-widest uppercase text-cyan-50 mb-4">{t.sessions}</h2>
                {sessions.length === 0 ? (
                  <div className="text-white/40 text-sm text-center py-12">{t.noSessions}</div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm text-cyan-100">{s.location}</div>
                          <div className="text-[10px] text-white/40 tracking-wider mt-1">
                            {new Date(s.timestamp).toLocaleString(lang)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/60">{s.integrity}% / {s.depth}m</div>
                          <div className="text-[10px] text-white/30">{s.taps.length} {t.samples.toLowerCase()}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-[10px] text-white/20 tracking-widest uppercase">
          For glaciologists & ice climbers · v1.0
        </div>
      </div>
    </div>
  );
}
