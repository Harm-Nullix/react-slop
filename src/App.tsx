import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- i18n ----------
const getLang = () => (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en');

const T = {
  nl: {
    title: 'Aurora Knit',
    subtitle: 'Lace Chart Tension Architect',
    about: 'Over deze app',
    aboutBody: 'Voor de ~80 miljoen kant-breiers wereldwijd. Complexe lace-patronen mislukken vaak doordat de garenspanning per rij subtiel verschuift — yarn-overs worden te los, decreases te strak. Aurora Knit laat je per rij je spanning loggen, visualiseert de balans live, en geeft een ritmische pacer zodat je hand-tempo constant blijft. Alles wordt lokaal opgeslagen.',
    newRow: 'Rij voltooien',
    tension: 'Spanning',
    loose: 'Los',
    balanced: 'Gebalanceerd',
    tight: 'Strak',
    rowCount: 'Rij',
    stitches: 'Steken deze rij',
    pacer: 'Ritme-pacer',
    bpm: 'tikken/min',
    start: 'Start',
    stop: 'Stop',
    reset: 'Project wissen',
    projectName: 'Projectnaam',
    log: 'Logboek',
    empty: 'Nog geen rijen gelogd. Brei een rij en leg je spanning vast.',
    avg: 'Gem. spanning',
    drift: 'Spanningsdrift',
    stable: 'Stabiel',
    drifting: 'Driftend — let op je consistentie',
    confirmReset: 'Weet je zeker dat je dit project wist?',
    yarns: 'steken totaal'
  },
  en: {
    title: 'Aurora Knit',
    subtitle: 'Lace Chart Tension Architect',
    about: 'About this app',
    aboutBody: 'For the ~80 million lace knitters worldwide. Complex lace patterns often fail because yarn tension subtly shifts row to row — yarn-overs get too loose, decreases too tight. Aurora Knit lets you log your tension per row, visualises the balance live, and gives a rhythmic pacer to keep your hand-tempo constant. Everything is saved locally.',
    newRow: 'Complete row',
    tension: 'Tension',
    loose: 'Loose',
    balanced: 'Balanced',
    tight: 'Tight',
    rowCount: 'Row',
    stitches: 'Stitches this row',
    pacer: 'Rhythm pacer',
    bpm: 'beats/min',
    start: 'Start',
    stop: 'Stop',
    reset: 'Clear project',
    projectName: 'Project name',
    log: 'Log',
    empty: 'No rows logged yet. Knit a row and record your tension.',
    avg: 'Avg. tension',
    drift: 'Tension drift',
    stable: 'Stable',
    drifting: 'Drifting — watch your consistency',
    confirmReset: 'Are you sure you want to clear this project?',
    yarns: 'stitches total'
  }
};

const STORE = 'auroraknit.v1';

type Row = { id: number; tension: number; stitches: number; ts: number };
type State = { project: string; rows: Row[] };

const load = (): State => {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { project: '', rows: [] };
};

export default function App() {
  const lang = getLang();
  const t = T[lang];
  const [state, setState] = useState<State>({ project: '', rows: [] });
  const [tension, setTension] = useState(50);
  const [stitches, setStitches] = useState(24);
  const [showAbout, setShowAbout] = useState(false);
  const [bpm, setBpm] = useState(72);
  const [pacing, setPacing] = useState(false);
  const [pulse, setPulse] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => { setState(load()); }, []);
  useEffect(() => { document.title = `${t.title} — ${t.subtitle}`; }, [t]);
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {}
  }, [state]);

  // pacer
  useEffect(() => {
    if (!pacing) return;
    const interval = 60000 / bpm;
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 120);
      try {
        if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioRef.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 660;
        o.type = 'sine';
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.13);
      } catch {}
    }, interval);
    return () => clearInterval(id);
  }, [pacing, bpm]);

  const addRow = useCallback(() => {
    setState(s => ({ ...s, rows: [...s.rows, { id: Date.now(), tension, stitches, ts: Date.now() }] }));
  }, [tension, stitches]);

  const reset = () => {
    if (window.confirm(t.confirmReset)) setState(s => ({ ...s, rows: [] }));
  };

  const stats = useMemo(() => {
    const r = state.rows;
    if (!r.length) return { avg: 0, drift: 0, total: 0 };
    const avg = r.reduce((a, b) => a + b.tension, 0) / r.length;
    const total = r.reduce((a, b) => a + b.stitches, 0);
    let drift = 0;
    for (let i = 1; i < r.length; i++) drift += Math.abs(r[i].tension - r[i - 1].tension);
    drift = r.length > 1 ? drift / (r.length - 1) : 0;
    return { avg, drift, total };
  }, [state.rows]);

  const tensionLabel = tension < 38 ? t.loose : tension > 62 ? t.tight : t.balanced;
  const tensionColor = tension < 38 ? '#67e8f9' : tension > 62 ? '#f0abfc' : '#a3e635';

  const maxRows = Math.max(state.rows.length, 1);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 10%, #1e1b4b 0%, #0f172a 45%, #020617 100%)', color: '#e2e8f0', fontFamily: 'ui-sans-serif, system-ui, sans-serif', overflowX: 'hidden', position: 'relative' }}>
      {/* aurora bg */}
      {[0,1,2].map(i => (
        <motion.div key={i} aria-hidden style={{ position: 'fixed', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.35, pointerEvents: 'none', width: 380, height: 380, background: ['#7c3aed','#06b6d4','#db2777'][i] }}
          animate={{ x: [0, 120 * (i+1) % 200, -60, 0], y: [0, -80, 100, 0], scale: [1, 1.3, 0.9, 1] }}
          transition={{ duration: 18 + i * 5, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ left: `${i*30}%`, top: `${i*20}%` }} />
      ))}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 18px 80px', position: 'relative', zIndex: 1 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} style={{ width: 34, height: 34, borderRadius: 10, background: 'conic-gradient(from 0deg, #7c3aed, #06b6d4, #db2777, #7c3aed)' }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(90deg,#a5f3fc,#f5d0fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.title}</h1>
            </div>
            <p style={{ margin: '4px 0 0 44px', fontSize: 13, color: '#94a3b8', letterSpacing: 1 }}>{t.subtitle}</p>
          </motion.div>
          <motion.button whileHover={{ scale: 1.12, rotate: 8 }} whileTap={{ scale: 0.9 }} onClick={() => setShowAbout(true)} aria-label={t.about}
            style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 20, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>?</motion.button>
        </header>

        {/* project name */}
        <motion.input initial={{ opacity: 0 }} animate={{ opacity: 1 }} value={state.project} onChange={e => setState(s => ({ ...s, project: e.target.value }))}
          placeholder={t.projectName}
          style={{ marginTop: 24, width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 14, border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: '#f1f5f9', fontSize: 15, outline: 'none' }} />

        {/* tension control */}
        <motion.div layout style={{ marginTop: 20, padding: 22, borderRadius: 20, background: 'rgba(15,23,42,0.55)', border: '1px solid #1e293b', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{t.tension}</span>
            <AnimatePresence mode='wait'>
              <motion.span key={tensionLabel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                style={{ fontSize: 15, fontWeight: 700, color: tensionColor }}>{tensionLabel}</motion.span>
            </AnimatePresence>
          </div>
          <input type='range' min={0} max={100} value={tension} onChange={e => setTension(+e.target.value)}
            style={{ width: '100%', marginTop: 14, accentColor: tensionColor as string }} />
          <motion.div style={{ height: 6, borderRadius: 3, marginTop: 6, background: `linear-gradient(90deg,#67e8f9,#a3e635,#f0abfc)` }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 110 }}>{t.stitches}</span>
            <button onClick={() => setStitches(s => Math.max(1, s - 1))} style={btnSm}>−</button>
            <motion.span key={stitches} initial={{ scale: 1.3 }} animate={{ scale: 1 }} style={{ fontSize: 18, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{stitches}</motion.span>
            <button onClick={() => setStitches(s => s + 1)} style={btnSm}>+</button>
          </div>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={addRow}
            style={{ marginTop: 20, width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#0f172a', background: 'linear-gradient(90deg,#67e8f9,#f0abfc)' }}>
            {t.newRow} →
          </motion.button>
        </motion.div>

        {/* pacer */}
        <motion.div layout style={{ marginTop: 16, padding: 22, borderRadius: 20, background: 'rgba(15,23,42,0.55)', border: '1px solid #1e293b', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <motion.div animate={{ scale: pulse ? 1.5 : 1, boxShadow: pulse ? '0 0 30px #f0abfc' : '0 0 6px #475569' }} transition={{ duration: 0.12 }}
            style={{ width: 50, height: 50, borderRadius: '50%', background: pacing ? 'radial-gradient(circle,#f0abfc,#7c3aed)' : '#334155', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{t.pacer}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input type='range' min={40} max={140} value={bpm} onChange={e => setBpm(+e.target.value)} style={{ flex: 1, accentColor: '#f0abfc' }} />
              <span style={{ fontSize: 13, minWidth: 70, color: '#cbd5e1' }}>{bpm} {t.bpm}</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPacing(p => !p)}
            style={{ padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, color: '#0f172a', background: pacing ? '#fca5a5' : '#a3e635' }}>
            {pacing ? t.stop : t.start}
          </motion.button>
        </motion.div>

        {/* stats */}
        {state.rows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12 }}>
            <Stat label={t.avg} value={stats.avg.toFixed(0) + '%'} color='#a3e635' />
            <Stat label={t.drift} value={stats.drift.toFixed(1)} color={stats.drift < 10 ? '#67e8f9' : '#f0abfc'} sub={stats.drift < 10 ? t.stable : t.drifting} />
            <Stat label={t.yarns} value={String(stats.total)} color='#f5d0fe' />
          </motion.div>
        )}

        {/* log + chart */}
        <motion.div layout style={{ marginTop: 16, padding: 22, borderRadius: 20, background: 'rgba(15,23,42,0.55)', border: '1px solid #1e293b', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{t.log}</span>
            {state.rows.length > 0 && <button onClick={reset} style={{ ...btnSm, fontSize: 12, padding: '6px 12px', width: 'auto', borderRadius: 10 }}>{t.reset}</button>}
          </div>

          {state.rows.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 16 }}>{t.empty}</p>
          ) : (
            <>
              {/* sparkline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, marginTop: 16 }}>
                {state.rows.map((r, i) => (
                  <motion.div key={r.id} initial={{ height: 0 }} animate={{ height: `${(r.tension / 100) * 80 + 6}px` }} transition={{ delay: i * 0.02, type: 'spring', stiffness: 200 }}
                    title={`Row ${i + 1}: ${r.tension}%`}
                    style={{ flex: 1, minWidth: 4, borderRadius: 4, background: r.tension < 38 ? '#67e8f9' : r.tension > 62 ? '#f0abfc' : '#a3e635' }} />
                ))}
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                <AnimatePresence>
                  {[...state.rows].reverse().map((r, idx) => {
                    const n = state.rows.length - idx;
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} layout
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: 12, color: '#64748b', minWidth: 50 }}>{t.rowCount} {n}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1e293b', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${r.tension}%` }} style={{ height: '100%', background: r.tension < 38 ? '#67e8f9' : r.tension > 62 ? '#f0abfc' : '#a3e635' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>{r.stitches} st</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* about modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAbout(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} onClick={e => e.stopPropagation()}
              style={{ maxWidth: 460, background: 'linear-gradient(160deg,#1e1b4b,#0f172a)', border: '1px solid #334155', borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <h2 style={{ margin: 0, fontSize: 20, background: 'linear-gradient(90deg,#a5f3fc,#f5d0fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.about}</h2>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#cbd5e1', marginTop: 14 }}>{t.aboutBody}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAbout(false)}
                style={{ marginTop: 20, padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, color: '#0f172a', background: 'linear-gradient(90deg,#67e8f9,#f0abfc)' }}>OK</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const btnSm: React.CSSProperties = { width: 38, height: 38, borderRadius: 10, border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 18, cursor: 'pointer' };

function Stat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} style={{ padding: 16, borderRadius: 16, background: 'rgba(15,23,42,0.55)', border: '1px solid #1e293b', backdropFilter: 'blur(12px)' }}>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  );
}
