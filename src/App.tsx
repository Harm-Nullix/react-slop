import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';

const STORAGE_KEY = 'tinnitusMapper_v1';

type Lang = 'en' | 'nl';

const t: Record<string, Record<Lang, string>> = {
  appName: { en: 'TinnitusMapper', nl: 'TinnitusMapper' },
  tagline: { en: 'Map. Mask. Manage your tinnitus.', nl: 'Breng. Maskeer. Beheer je tinnitus.' },
  infoTitle: { en: 'About this app', nl: 'Over deze app' },
  infoBody: {
    en: 'TinnitusMapper is built for the ~80 million people worldwide with chronic tinnitus. Using the Web Audio API, you can precisely locate your tinnitus frequency (100–14000 Hz), test masking sounds, log daily triggers, and track patterns — all locally, no server, no data sharing.',
    nl: 'TinnitusMapper is gebouwd voor de ~80 miljoen mensen wereldwijd met chronisch tinnitus. Via de Web Audio API kun je je tinnitus-frequentie precies lokaliseren (100–14000 Hz), masking-geluiden testen, dagelijkse triggers loggen en patronen bijhouden — volledig lokaal, geen server, geen data-deling.',
  },
  tabFreq: { en: 'Frequency', nl: 'Frequentie' },
  tabMask: { en: 'Masking', nl: 'Maskering' },
  tabLog: { en: 'Journal', nl: 'Dagboek' },
  tabStats: { en: 'Insights', nl: 'Inzichten' },
  freqTitle: { en: 'Find Your Tinnitus Frequency', nl: 'Vind je Tinnitus-frequentie' },
  freqDesc: { en: 'Drag the slider until the tone matches your tinnitus. Use headphones for best results.', nl: 'Sleep de slider totdat de toon overeenkomt met je tinnitus. Gebruik koptelefoon voor beste resultaten.' },
  playTone: { en: 'Play Tone', nl: 'Speel toon' },
  stopTone: { en: 'Stop Tone', nl: 'Stop toon' },
  saveFreq: { en: 'Save this frequency', nl: 'Frequentie opslaan' },
  savedFreq: { en: 'Saved frequency', nl: 'Opgeslagen frequentie' },
  volume: { en: 'Volume', nl: 'Volume' },
  maskTitle: { en: 'Masking Sounds', nl: 'Masking-geluiden' },
  maskDesc: { en: 'Play noise types to mask your tinnitus. Adjust volume and mix.', nl: 'Speel ruistypes af om je tinnitus te maskeren. Pas volume en mix aan.' },
  logTitle: { en: 'Daily Journal', nl: 'Dagelijks Dagboek' },
  logDesc: { en: 'Log your tinnitus intensity and triggers.', nl: 'Log je tinnitus-intensiteit en triggers.' },
  intensity: { en: 'Intensity today', nl: 'Intensiteit vandaag' },
  triggers: { en: 'Triggers', nl: 'Triggers' },
  notes: { en: 'Notes', nl: 'Notities' },
  saveLog: { en: 'Save Entry', nl: 'Opslaan' },
  saved: { en: 'Saved!', nl: 'Opgeslagen!' },
  statsTitle: { en: 'Your Insights', nl: 'Jouw Inzichten' },
  avgIntensity: { en: 'Avg intensity (7d)', nl: 'Gem. intensiteit (7d)' },
  topTrigger: { en: 'Top trigger', nl: 'Belangrijkste trigger' },
  entries: { en: 'Journal entries', nl: 'Dagboek-vermeldingen' },
  noData: { en: 'No data yet. Start logging!', nl: 'Nog geen data. Begin met loggen!' },
  warning: { en: '⚠️ Keep volume low. Stop immediately if uncomfortable.', nl: '⚠️ Houd volume laag. Stop direct als het oncomfortabel is.' },
  close: { en: 'Close', nl: 'Sluiten' },
  hz: { en: 'Hz', nl: 'Hz' },
};

const TRIGGER_OPTIONS: Record<Lang, string[]> = {
  en: ['Stress', 'Caffeine', 'Alcohol', 'Loud noise', 'Poor sleep', 'Medication', 'Exercise', 'Diet'],
  nl: ['Stress', 'Cafeïne', 'Alcohol', 'Luid geluid', 'Slechte slaap', 'Medicatie', 'Bewegen', 'Dieet'],
};

const MASKERS = [
  { id: 'white', label: { en: 'White Noise', nl: 'Witte Ruis' }, color: '#e2e8f0', type: 'white' },
  { id: 'pink', label: { en: 'Pink Noise', nl: 'Roze Ruis' }, color: '#f9a8d4', type: 'pink' },
  { id: 'brown', label: { en: 'Brown Noise', nl: 'Bruine Ruis' }, color: '#a78bfa', type: 'brown' },
  { id: 'notch', label: { en: 'Notched Noise', nl: 'Genotchte Ruis' }, color: '#6ee7b7', type: 'notch' },
];

interface JournalEntry {
  date: string;
  intensity: number;
  triggers: string[];
  notes: string;
  frequency?: number;
}

interface AppState {
  savedFrequency: number | null;
  journal: JournalEntry[];
}

function useLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return nav.startsWith('nl') ? 'nl' : 'en';
}

function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AppState;
    } catch {}
    return { savedFrequency: null, journal: [] };
  });

  const update = useCallback((patch: Partial<AppState> | ((prev: AppState) => AppState)) => {
    setState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return [state, update] as const;
}

// --- Audio Engine ---
class AudioEngine {
  ctx: AudioContext | null = null;
  toneOsc: OscillatorNode | null = null;
  toneGain: GainNode | null = null;
  maskerSources: Map<string, { source: AudioBufferSourceNode | AudioWorkletNode; gain: GainNode }> = new Map();
  noiseBuffers: Map<string, AudioBuffer> = new Map();

  ensureCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  generateNoise(type: string): AudioBuffer {
    const ctx = this.ensureCtx();
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    if (type === 'white' || type === 'notch') {
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < bufSize; i++) {
        const wh = Math.random() * 2 - 1;
        b0=0.99886*b0+wh*0.0555179; b1=0.99332*b1+wh*0.0750759;
        b2=0.96900*b2+wh*0.1538520; b3=0.86650*b3+wh*0.3104856;
        b4=0.55000*b4+wh*0.5329522; b5=-0.7616*b5-wh*0.0168980;
        data[i]=(b0+b1+b2+b3+b4+b5+b6+wh*0.5362)*0.11;
        b6=wh*0.115926;
      }
    } else if (type === 'brown') {
      let last=0;
      for (let i = 0; i < bufSize; i++) {
        const wh = Math.random() * 2 - 1;
        last = (last + 0.02 * wh) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buf;
  }

  playTone(freq: number, vol: number) {
    this.stopTone();
    const ctx = this.ensureCtx();
    this.toneGain = ctx.createGain();
    this.toneGain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
    this.toneOsc = ctx.createOscillator();
    this.toneOsc.type = 'sine';
    this.toneOsc.frequency.setValueAtTime(freq, ctx.currentTime);
    this.toneOsc.connect(this.toneGain);
    this.toneGain.connect(ctx.destination);
    this.toneOsc.start();
  }

  updateToneFreq(freq: number) {
    if (this.toneOsc && this.ctx) {
      this.toneOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    }
  }

  stopTone() {
    try { this.toneOsc?.stop(); } catch {}
    this.toneOsc?.disconnect();
    this.toneGain?.disconnect();
    this.toneOsc = null;
    this.toneGain = null;
  }

  startMasker(id: string, type: string, vol: number, notchFreq?: number) {
    this.stopMasker(id);
    const ctx = this.ensureCtx();
    let buf = this.noiseBuffers.get(type);
    if (!buf) { buf = this.generateNoise(type); this.noiseBuffers.set(type, buf); }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    if (type === 'notch' && notchFreq) {
      const notch = ctx.createBiquadFilter();
      notch.type = 'notch';
      notch.frequency.value = notchFreq;
      notch.Q.value = 10;
      source.connect(notch);
      notch.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(ctx.destination);
    source.start();
    this.maskerSources.set(id, { source, gain });
  }

  stopMasker(id: string) {
    const m = this.maskerSources.get(id);
    if (m) {
      try { (m.source as AudioBufferSourceNode).stop(); } catch {}
      m.source.disconnect();
      m.gain.disconnect();
      this.maskerSources.delete(id);
    }
  }

  updateMaskerVol(id: string, vol: number) {
    const m = this.maskerSources.get(id);
    if (m && this.ctx) m.gain.gain.setTargetAtTime(vol * 0.4, this.ctx.currentTime, 0.05);
  }

  stopAll() {
    this.stopTone();
    for (const id of this.maskerSources.keys()) this.stopMasker(id);
  }
}

const engine = new AudioEngine();

// --- Components ---

function InfoModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative z-10 max-w-md w-full rounded-3xl p-8 shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)' }}
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'rgba(167,139,250,0.3)' }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >🔊</motion.div>
          <h2 className="text-white font-bold text-xl">{t.infoTitle[lang]}</h2>
        </div>
        <p className="text-purple-200 text-sm leading-relaxed mb-6">{t.infoBody[lang]}</p>
        <div className="text-yellow-300 text-xs mb-6 bg-yellow-900/30 rounded-xl p-3">{t.warning[lang]}</div>
        <motion.button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        >{t.close[lang]}</motion.button>
      </motion.div>
    </motion.div>
  );
}

function FreqVisualizer({ freq, isPlaying }: { freq: number; isPlaying: boolean }) {
  const bars = 32;
  return (
    <div className="flex items-end justify-center gap-0.5 h-16 mb-4">
      {Array.from({ length: bars }).map((_, i) => {
        const relIdx = i / bars;
        const wave = Math.sin(relIdx * Math.PI * 3 + (freq / 1000)) * 0.5 + 0.5;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              background: `hsl(${260 + relIdx * 80}, 80%, 65%)`,
            }}
            animate={isPlaying ? {
              height: [4, (wave * 48 + 8), 4],
              opacity: [0.5, 1, 0.5],
            } : { height: 4, opacity: 0.3 }}
            transition={{
              duration: 0.6 + relIdx * 0.3,
              repeat: Infinity,
              delay: i * 0.02,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

function FreqTab({ lang, state, update }: { lang: Lang; state: AppState; update: (p: Partial<AppState>) => void }) {
  const [freq, setFreq] = useState(state.savedFrequency ?? 4000);
  const [vol, setVol] = useState(0.3);
  const [playing, setPlaying] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  const logFreq = Math.log10(freq);
  const minLog = Math.log10(100);
  const maxLog = Math.log10(14000);
  const sliderVal = ((logFreq - minLog) / (maxLog - minLog)) * 100;

  const handleSlider = (v: number) => {
    const newFreq = Math.round(Math.pow(10, minLog + (v / 100) * (maxLog - minLog)));
    setFreq(newFreq);
    if (playing) engine.updateToneFreq(newFreq);
  };

  const togglePlay = () => {
    if (playing) { engine.stopTone(); setPlaying(false); }
    else { engine.playTone(freq, vol); setPlaying(true); }
  };

  const handleVol = (v: number) => {
    setVol(v);
    if (playing && engine.toneGain && engine.ctx) {
      engine.toneGain.gain.setTargetAtTime(v * 0.3, engine.ctx.currentTime, 0.05);
    }
  };

  const saveFreq = () => {
    update({ savedFrequency: freq });
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  useEffect(() => () => { engine.stopTone(); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h2 className="text-white font-bold text-lg mb-1">{t.freqTitle[lang]}</h2>
      <p className="text-purple-300 text-sm mb-4">{t.freqDesc[lang]}</p>

      <FreqVisualizer freq={freq} isPlaying={playing} />

      <div className="text-center mb-6">
        <motion.span
          key={freq}
          className="text-5xl font-black"
          style={{ background: 'linear-gradient(90deg,#a78bfa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
        >{freq.toLocaleString()}</motion.span>
        <span className="text-purple-400 text-xl ml-1">{t.hz[lang]}</span>
      </div>

      <div className="mb-6">
        <input
          type="range" min={0} max={100} step={0.1} value={sliderVal}
          onChange={e => handleSlider(Number(e.target.value))}
          className="w-full accent-violet-400 h-3 rounded-full cursor-pointer"
          style={{ accentColor: '#a78bfa' }}
        />
        <div className="flex justify-between text-purple-500 text-xs mt-1">
          <span>100 Hz</span><span>14,000 Hz</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-2 block">{t.volume[lang]}</label>
        <input
          type="range" min={0} max={1} step={0.01} value={vol}
          onChange={e => handleVol(Number(e.target.value))}
          className="w-full accent-violet-400 h-2 rounded-full cursor-pointer"
          style={{ accentColor: '#6ee7b7' }}
        />
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={togglePlay}
          className="flex-1 py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
          style={{ background: playing ? 'linear-gradient(90deg,#dc2626,#f87171)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <motion.span animate={playing ? { scale: [1, 1.3, 1] } : {}} transition={{ repeat: Infinity, duration: 0.8 }}>
            {playing ? '⏹' : '▶'}
          </motion.span>
          {playing ? t.stopTone[lang] : t.playTone[lang]}
        </motion.button>
        <motion.button
          onClick={saveFreq}
          className="px-5 py-4 rounded-2xl font-bold text-white"
          style={{ background: saveFlash ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#374151,#4b5563)' }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        >
          {saveFlash ? '✓' : '💾'}
        </motion.button>
      </div>

      {state.savedFrequency && (
        <motion.div
          className="mt-4 rounded-2xl p-4 text-center"
          style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <span className="text-purple-300 text-sm">{t.savedFreq[lang]}: </span>
          <span className="text-white font-bold">{state.savedFrequency.toLocaleString()} Hz</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function MaskTab({ lang, state }: { lang: Lang; state: AppState }) {
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [vols, setVols] = useState<Record<string, number>>({ white: 0.4, pink: 0.4, brown: 0.4, notch: 0.4 });

  const toggle = (id: string, type: string) => {
    if (active[id]) {
      engine.stopMasker(id);
      setActive(p => ({ ...p, [id]: false }));
    } else {
      engine.startMasker(id, type, vols[id], state.savedFrequency ?? 4000);
      setActive(p => ({ ...p, [id]: true }));
    }
  };

  const setVol = (id: string, v: number) => {
    setVols(p => ({ ...p, [id]: v }));
    if (active[id]) engine.updateMaskerVol(id, v);
  };

  useEffect(() => () => { for (const id of MASKERS.map(m=>m.id)) engine.stopMasker(id); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h2 className="text-white font-bold text-lg mb-1">{t.maskTitle[lang]}</h2>
      <p className="text-purple-300 text-sm mb-5">{t.maskDesc[lang]}</p>
      <div className="space-y-4">
        {MASKERS.map((m, i) => (
          <motion.div
            key={m.id}
            className="rounded-2xl p-5"
            style={{ background: active[m.id] ? `linear-gradient(135deg,${m.color}22,${m.color}11)` : 'rgba(255,255,255,0.05)', border: `1px solid ${active[m.id] ? m.color + '66' : 'rgba(255,255,255,0.1)'}` }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-8 h-8 rounded-full"
                  style={{ background: m.color }}
                  animate={active[m.id] ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="text-white font-semibold">{m.label[lang]}</span>
                {m.id === 'notch' && state.savedFrequency && (
                  <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">notch @ {state.savedFrequency}Hz</span>
                )}
              </div>
              <motion.button
                onClick={() => toggle(m.id, m.type)}
                className="px-4 py-2 rounded-xl font-bold text-sm"
                style={{ background: active[m.id] ? m.color + 'aa' : 'rgba(255,255,255,0.1)', color: active[m.id] ? '#000' : '#fff' }}
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
              >{active[m.id] ? '⏹ Stop' : '▶ Play'}</motion.button>
            </div>
            <input
              type="range" min={0} max={1} step={0.01} value={vols[m.id]}
              onChange={e => setVol(m.id, Number(e.target.value))}
              className="w-full h-2 rounded-full cursor-pointer"
              style={{ accentColor: m.color }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function LogTab({ lang, state, update }: { lang: Lang; state: AppState; update: (p: Partial<AppState>) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = state.journal.find(e => e.date === today);
  const [intensity, setIntensity] = useState(existing?.intensity ?? 5);
  const [triggers, setTriggers] = useState<string[]>(existing?.triggers ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [flash, setFlash] = useState(false);
  const opts = TRIGGER_OPTIONS[lang];

  const toggleTrigger = (t: string) => {
    setTriggers(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  };

  const save = () => {
    const entry: JournalEntry = { date: today, intensity, triggers, notes, frequency: state.savedFrequency ?? undefined };
    const filtered = state.journal.filter(e => e.date !== today);
    update({ journal: [...filtered, entry].sort((a, b) => a.date < b.date ? 1 : -1) });
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const intensityColor = `hsl(${120 - intensity * 12}, 70%, 55%)`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h2 className="text-white font-bold text-lg mb-1">{t.logTitle[lang]}</h2>
      <p className="text-purple-300 text-sm mb-5">{t.logDesc[lang]}</p>

      <div className="mb-6">
        <label className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3 block">{t.intensity[lang]}: <span style={{ color: intensityColor }} className="text-2xl font-black">{intensity}</span>/10</label>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
            <motion.button
              key={v}
              onClick={() => setIntensity(v)}
              className="w-10 h-10 rounded-xl font-bold text-sm"
              style={{
                background: v === intensity ? intensityColor : 'rgba(255,255,255,0.08)',
                color: v === intensity ? '#000' : '#fff',
                boxShadow: v === intensity ? `0 0 16px ${intensityColor}88` : 'none',
              }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              animate={v === intensity ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.4 }}
            >{v}</motion.button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3 block">{t.triggers[lang]}</label>
        <div className="flex flex-wrap gap-2">
          {opts.map(opt => (
            <motion.button
              key={opt}
              onClick={() => toggleTrigger(opt)}
              className="px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                background: triggers.includes(opt) ? 'linear-gradient(90deg,#7c3aed,#a78bfa)' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                boxShadow: triggers.includes(opt) ? '0 0 12px rgba(167,139,250,0.5)' : 'none',
              }}
              whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
            >{opt}</motion.button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-2 block">{t.notes[lang]}</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full rounded-2xl p-4 text-white text-sm resize-none outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.3)', minHeight: 80 }}
          rows={3}
        />
      </div>

      <motion.button
        onClick={save}
        className="w-full py-4 rounded-2xl font-bold text-white text-lg"
        style={{ background: flash ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      >
        <AnimatePresence mode="wait">
          <motion.span key={flash ? 'saved' : 'save'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {flash ? t.saved[lang] : t.saveLog[lang]}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {state.journal.length > 0 && (
        <div className="mt-6 space-y-3">
          {state.journal.slice(0, 5).map((entry, i) => (
            <motion.div
              key={entry.date}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-purple-400 text-xs">{entry.date}</span>
                <span className="font-bold" style={{ color: `hsl(${120 - entry.intensity * 12}, 70%, 55%)` }}>{entry.intensity}/10</span>
              </div>
              {entry.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.triggers.map(tr => <span key={tr} className="text-xs px-2 py-0.5 rounded-lg bg-purple-900/40 text-purple-300">{tr}</span>)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatsTab({ lang, state }: { lang: Lang; state: AppState }) {
  const journal = state.journal;
  const last7 = journal.filter(e => {
    const d = new Date(e.date);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  });
  const avg7 = last7.length ? (last7.reduce((s, e) => s + e.intensity, 0) / last7.length).toFixed(1) : null;

  const allTriggers: Record<string, number> = {};
  journal.forEach(e => e.triggers.forEach(tr => { allTriggers[tr] = (allTriggers[tr] || 0) + 1; }));
  const topTrigger = Object.entries(allTriggers).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const last14 = [...journal].reverse().slice(0, 14);
  const maxI = 10;

  if (journal.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20">
        <motion.div className="text-6xl mb-4" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>📊</motion.div>
        <p className="text-purple-400 text-center">{t.noData[lang]}</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h2 className="text-white font-bold text-lg mb-5">{t.statsTitle[lang]}</h2>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t.entries[lang], value: journal.length, icon: '📝', color: '#a78bfa' },
          { label: t.avgIntensity[lang], value: avg7 ?? '—', icon: '📈', color: '#f9a8d4' },
          { label: t.topTrigger[lang], value: topTrigger ?? '—', icon: '⚡', color: '#6ee7b7' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="rounded-2xl p-4 flex flex-col items-center text-center"
            style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}33` }}
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.04, boxShadow: `0 0 20px ${stat.color}44` }}
          >
            <span className="text-2xl mb-1">{stat.icon}</span>
            <span className="text-white font-black text-lg leading-none">{stat.value}</span>
            <span className="text-xs mt-1" style={{ color: stat.color }}>{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {last14.length > 1 && (
        <div>
          <label className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3 block">Trend (14d)</label>
          <div className="flex items-end gap-1 h-24 px-2">
            {last14.map((entry, i) => {
              const h = (entry.intensity / maxI) * 80;
              const col = `hsl(${120 - entry.intensity * 12}, 70%, 55%)`;
              return (
                <motion.div
                  key={entry.date}
                  className="flex-1 rounded-t-lg relative group cursor-default"
                  style={{ background: col, height: h, minWidth: 8 }}
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                  whileHover={{ opacity: 0.8 }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white hidden group-hover:block bg-black/70 px-1 rounded">{entry.intensity}</div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-between text-purple-600 text-xs mt-1 px-2">
            <span>{last14[0]?.date?.slice(5)}</span>
            <span>{last14[last14.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>
      )}

      {state.savedFrequency && (
        <motion.div
          className="mt-6 rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}
            animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >Hz</motion.div>
          <div>
            <div className="text-white font-bold text-lg">{state.savedFrequency.toLocaleString()} Hz</div>
            <div className="text-purple-400 text-xs">{t.savedFreq[lang]}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const TABS = ['tabFreq', 'tabMask', 'tabLog', 'tabStats'] as const;
type TabKey = typeof TABS[number];

export default function App() {
  const lang = useLang();
  const [state, update] = useAppState();
  const [tab, setTab] = useState<TabKey>('tabFreq');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    document.title = 'TinnitusMapper';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', lang === 'nl' ? 'Breng je tinnitus in kaart, maskeer het, en houd je dagboek bij.' : 'Map, mask, and journal your tinnitus.');
  }, [lang]);

  const tabIcons: Record<TabKey, string> = { tabFreq: '🎵', tabMask: '🔊', tabLog: '📝', tabStats: '📊' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#0f0a1e,#1a0933,#0a1628)', fontFamily: "'Inter',sans-serif" }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent)', top: '-10%', left: '-5%' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#0891b2,transparent)', bottom: '10%', right: '-5%' }}
          animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#059669,transparent)', top: '50%', left: '40%' }}
          animate={{ x: [0, 20, -20, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe pt-6 pb-4">
        <div>
          <motion.h1
            className="text-white font-black text-2xl tracking-tight"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          >
            <span style={{ background: 'linear-gradient(90deg,#a78bfa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tinnitus</span>
            <span className="text-white">Mapper</span>
          </motion.h1>
          <motion.p className="text-purple-400 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {t.tagline[lang]}
          </motion.p>
        </div>
        <motion.button
          onClick={() => setShowInfo(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)' }}
          whileHover={{ scale: 1.15, rotate: 15, boxShadow: '0 0 20px rgba(167,139,250,0.5)' }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >ℹ️</motion.button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 px-4 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'tabFreq' && <FreqTab key="freq" lang={lang} state={state} update={update} />}
          {tab === 'tabMask' && <MaskTab key="mask" lang={lang} state={state} />}
          {tab === 'tabLog' && <LogTab key="log" lang={lang} state={state} update={update} />}
          {tab === 'tabStats' && <StatsTab key="stats" lang={lang} state={state} />}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex gap-1 px-4 pb-safe pb-4 pt-3"
        style={{ background: 'linear-gradient(to top, rgba(15,10,30,0.98) 70%, transparent)', backdropFilter: 'blur(20px)' }}
      >
        {TABS.map((tabKey, i) => (
          <motion.button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl relative overflow-hidden"
            style={{ background: tab === tabKey ? 'rgba(167,139,250,0.2)' : 'transparent' }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          >
            {tab === tabKey && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(167,139,250,0.1))' }}
                layoutId="tabBg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <motion.span
              className="text-xl relative z-10"
              animate={tab === tabKey ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.3 }}
            >{tabIcons[tabKey]}</motion.span>
            <span
              className="text-xs font-semibold relative z-10"
              style={{ color: tab === tabKey ? '#a78bfa' : '#6b7280' }}
            >{t[tabKey][lang]}</span>
          </motion.button>
        ))}
      </div>

      {/* Info modal */}
      <AnimatePresence>
        {showInfo && <InfoModal lang={lang} onClose={() => setShowInfo(false)} />}
      </AnimatePresence>
    </div>
  );
}
