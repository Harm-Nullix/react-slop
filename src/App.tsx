import { useState, useEffect, useRef } from 'react';

const translations = {
  en: {
    appTitle: 'SoilPulse',
    tagline: 'Urban Balcony Soil Health Tracker',
    addBed: 'Add Bed',
    bedName: 'Bed Name',
    bedSize: 'Size (liters)',
    soilAge: 'Soil Age (months)',
    lastFertilized: 'Last Fertilized (days ago)',
    lastAerated: 'Last Aerated (days ago)',
    save: 'Save',
    cancel: 'Cancel',
    health: 'Health',
    actions: 'Recommended Actions',
    fertilize: '🌿 Fertilize now',
    aerate: '🪝 Aerate soil',
    replace: '🔄 Replace soil',
    waterCheck: '💧 Check moisture',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',
    noBeds: 'No beds yet. Add your first growing bed!',
    delete: 'Delete',
    markFertilized: 'Mark Fertilized',
    markAerated: 'Mark Aerated',
    liters: 'L',
    months: 'mo',
    days: 'd',
    editBed: 'Edit Bed',
    update: 'Update',
    soilTip: 'Soil Tip',
    tips: [
      'Urban soil compacts quickly — aerate every 3–4 weeks for best results.',
      'Coffee grounds are a free nitrogen boost. Mix in a thin layer monthly.',
      'Worm castings outperform chemical fertilizers for container plants.',
      'Balcony wind dries soil 2x faster than ground beds. Water more often.',
      'Replace potting mix fully after 2 growing seasons for optimal yield.'
    ]
  },
  nl: {
    appTitle: 'SoilPulse',
    tagline: 'Balkon Grondgezondheid Tracker',
    addBed: 'Bed Toevoegen',
    bedName: 'Bednaam',
    bedSize: 'Formaat (liter)',
    soilAge: 'Grondleeftijd (maanden)',
    lastFertilized: 'Laatste bemesting (dagen geleden)',
    lastAerated: 'Laatste beluchting (dagen geleden)',
    save: 'Opslaan',
    cancel: 'Annuleren',
    health: 'Gezondheid',
    actions: 'Aanbevolen Acties',
    fertilize: '🌿 Nu bemesten',
    aerate: '🪝 Grond beluchten',
    replace: '🔄 Grond vervangen',
    waterCheck: '💧 Vocht controleren',
    excellent: 'Uitstekend',
    good: 'Goed',
    fair: 'Matig',
    poor: 'Slecht',
    critical: 'Kritiek',
    noBeds: 'Nog geen bedden. Voeg je eerste groeibak toe!',
    delete: 'Verwijderen',
    markFertilized: 'Bemest markeren',
    markAerated: 'Belucht markeren',
    liters: 'L',
    months: 'mnd',
    days: 'd',
    editBed: 'Bed Bewerken',
    update: 'Bijwerken',
    soilTip: 'Grondtip',
    tips: [
      'Stedelijke grond verdicht snel — belucht elke 3–4 weken voor optimale resultaten.',
      'Koffiedik is een gratis stikstofboost. Meng maandelijks een dunne laag door de grond.',
      'Wormenmest presteert beter dan kunstmest voor kamerplanten.',
      'Balkonwind droogt grond 2x sneller dan grondbedden. Geef vaker water.',
      'Vervang potgrond volledig na 2 groeiseizoenen voor optimale opbrengst.'
    ]
  }
};

type Lang = 'en' | 'nl';

interface Bed {
  id: string;
  name: string;
  size: number;
  soilAge: number;
  lastFertilized: number;
  lastAerated: number;
}

function getHealthScore(bed: Bed): number {
  let score = 100;
  if (bed.lastFertilized > 21) score -= 30;
  else if (bed.lastFertilized > 14) score -= 15;
  if (bed.lastAerated > 28) score -= 25;
  else if (bed.lastAerated > 21) score -= 10;
  if (bed.soilAge > 24) score -= 35;
  else if (bed.soilAge > 18) score -= 20;
  else if (bed.soilAge > 12) score -= 10;
  return Math.max(0, score);
}

function getHealthLabel(score: number, t: typeof translations['en']) {
  if (score >= 85) return { label: t.excellent, color: '#4ade80', bg: 'rgba(74,222,128,0.15)' };
  if (score >= 65) return { label: t.good, color: '#a3e635', bg: 'rgba(163,230,53,0.15)' };
  if (score >= 45) return { label: t.fair, color: '#facc15', bg: 'rgba(250,204,21,0.15)' };
  if (score >= 25) return { label: t.poor, color: '#fb923c', bg: 'rgba(251,146,60,0.15)' };
  return { label: t.critical, color: '#f87171', bg: 'rgba(248,113,113,0.15)' };
}

function getActions(bed: Bed, t: typeof translations['en']): string[] {
  const actions: string[] = [];
  if (bed.lastFertilized > 14) actions.push(t.fertilize);
  if (bed.lastAerated > 21) actions.push(t.aerate);
  if (bed.soilAge > 20) actions.push(t.replace);
  if (bed.lastFertilized > 7 && bed.lastFertilized <= 14) actions.push(t.waterCheck);
  if (actions.length === 0) actions.push(t.waterCheck);
  return actions;
}

function AnimatedBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${width}%`,
        background: `linear-gradient(90deg, ${color}99, ${color})`,
        borderRadius: 99,
        transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: `0 0 12px ${color}88`
      }} />
    </div>
  );
}

function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        animation: 'pulseRing 1.6s ease-out infinite'
      }} />
      <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: color }} />
    </span>
  );
}

export default function App() {
  const lang: Lang = (navigator.language || 'en').startsWith('nl') ? 'nl' : 'en';
  const t = translations[lang];

  const [beds, setBeds] = useState<Bed[]>(() => {
    try { return JSON.parse(localStorage.getItem('soilpulse_beds') || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', size: 20, soilAge: 6, lastFertilized: 7, lastAerated: 14 });
  const [tipIndex] = useState(() => Math.floor(Math.random() * t.tips.length));
  const [animIn, setAnimIn] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${t.appTitle} – ${t.tagline}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t.tagline);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = t.tagline;
      document.head.appendChild(m);
    }
  }, [t]);

  useEffect(() => {
    localStorage.setItem('soilpulse_beds', JSON.stringify(beds));
  }, [beds]);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => setAnimIn(true), 10);
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } else {
      setAnimIn(false);
    }
  }, [showForm]);

  const openAdd = () => {
    setForm({ name: '', size: 20, soilAge: 6, lastFertilized: 7, lastAerated: 14 });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (bed: Bed) => {
    setForm({ name: bed.name, size: bed.size, soilAge: bed.soilAge, lastFertilized: bed.lastFertilized, lastAerated: bed.lastAerated });
    setEditId(bed.id);
    setShowForm(true);
  };

  const saveBed = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setBeds(prev => prev.map(b => b.id === editId ? { ...b, ...form } : b));
    } else {
      setBeds(prev => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setShowForm(false);
    setEditId(null);
  };

  const deleteBed = (id: string) => setBeds(prev => prev.filter(b => b.id !== id));

  const markFertilized = (id: string) => setBeds(prev => prev.map(b => b.id === id ? { ...b, lastFertilized: 0 } : b));
  const markAerated = (id: string) => setBeds(prev => prev.map(b => b.id === id ? { ...b, lastAerated: 0 } : b));

  const style = {
    root: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1a0e 40%, #0a1512 100%)',
      color: '#e8f5e9',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '0 0 60px'
    } as React.CSSProperties,
    header: {
      background: 'linear-gradient(180deg, rgba(20,40,20,0.95) 0%, rgba(10,20,10,0.85) 100%)',
      backdropFilter: 'blur(20px)',
      padding: '24px 20px 20px',
      textAlign: 'center' as const,
      borderBottom: '1px solid rgba(74,222,128,0.1)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 100,
    },
    logo: {
      fontSize: 32,
      fontWeight: 800,
      background: 'linear-gradient(135deg, #4ade80, #86efac, #a3e635)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px',
      marginBottom: 4
    },
    tagline: {
      fontSize: 12,
      color: 'rgba(163,230,53,0.6)',
      letterSpacing: 2,
      textTransform: 'uppercase' as const
    },
    container: {
      maxWidth: 600,
      margin: '0 auto',
      padding: '20px 16px'
    },
    card: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(74,222,128,0.12)',
      borderRadius: 20,
      padding: '20px',
      marginBottom: 16,
      backdropFilter: 'blur(10px)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    },
    addBtn: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(163,230,53,0.1))',
      border: '1.5px dashed rgba(74,222,128,0.4)',
      borderRadius: 16,
      color: '#4ade80',
      fontSize: 15,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      marginBottom: 20,
      letterSpacing: 0.5
    },
    input: {
      width: '100%',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(74,222,128,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#e8f5e9',
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s'
    },
    label: {
      display: 'block',
      fontSize: 11,
      color: 'rgba(163,230,53,0.7)',
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      marginBottom: 5,
      marginTop: 12
    },
    btnRow: {
      display: 'flex',
      gap: 10,
      marginTop: 18
    },
    btnPrimary: {
      flex: 1,
      padding: '12px',
      background: 'linear-gradient(135deg, #4ade80, #a3e635)',
      border: 'none',
      borderRadius: 12,
      color: '#0a0f0a',
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'transform 0.15s, box-shadow 0.15s'
    },
    btnSecondary: {
      flex: 1,
      padding: '12px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      color: '#aaa',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'all 0.15s'
    },
    actionChip: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 99,
      fontSize: 12,
      background: 'rgba(74,222,128,0.1)',
      border: '1px solid rgba(74,222,128,0.2)',
      color: '#86efac',
      marginRight: 6,
      marginTop: 6
    },
    tipBox: {
      background: 'linear-gradient(135deg, rgba(163,230,53,0.07), rgba(74,222,128,0.05))',
      border: '1px solid rgba(163,230,53,0.15)',
      borderRadius: 16,
      padding: '14px 16px',
      marginBottom: 20,
      fontSize: 13,
      color: 'rgba(163,230,53,0.8)',
      lineHeight: 1.6
    },
    smallBtn: {
      padding: '5px 11px',
      borderRadius: 8,
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.15s',
      letterSpacing: 0.3
    }
  };

  return (
    <div style={style.root}>
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bed-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 40px rgba(74,222,128,0.1) !important; }
        .add-btn:hover { background: linear-gradient(135deg, rgba(74,222,128,0.25), rgba(163,230,53,0.18)) !important; transform: scale(1.01); }
        .primary-btn:hover { transform: scale(1.03); box-shadow: 0 4px 20px rgba(74,222,128,0.4); }
        .secondary-btn:hover { background: rgba(255,255,255,0.1) !important; color: #ddd !important; }
        .small-btn-green:hover { background: rgba(74,222,128,0.25) !important; }
        .small-btn-red:hover { background: rgba(248,113,113,0.2) !important; }
        input[type=range] { accent-color: #4ade80; }
        * { box-sizing: border-box; }
      `}</style>

      <header style={style.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28, animation: 'floatY 3s ease-in-out infinite' }}>🌱</span>
          <div style={style.logo}>{t.appTitle}</div>
          <span style={{ fontSize: 28, animation: 'floatY 3s ease-in-out infinite 1.5s' }}>🌿</span>
        </div>
        <div style={style.tagline}>{t.tagline}</div>
      </header>

      <div style={style.container}>
        <div style={{ ...style.tipBox, animation: 'fadeSlideIn 0.6s ease 0.1s both' }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>💡 {t.soilTip}:</span>
          {t.tips[tipIndex]}
        </div>

        <button
          className="add-btn"
          style={style.addBtn}
          onClick={openAdd}
        >
          + {t.addBed}
        </button>

        {showForm && (
          <div
            ref={formRef}
            style={{
              background: 'rgba(20,35,20,0.95)',
              border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: 20,
              padding: '20px',
              marginBottom: 20,
              backdropFilter: 'blur(20px)',
              opacity: animIn ? 1 : 0,
              transform: animIn ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
              transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#86efac' }}>
              {editId ? t.editBed : t.addBed}
            </div>

            <label style={style.label}>{t.bedName}</label>
            <input
              style={style.input}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Tomato Box"
            />

            <label style={style.label}>{t.bedSize}: {form.size}{t.liters}</label>
            <input type="range" min={5} max={200} value={form.size}
              onChange={e => setForm(f => ({ ...f, size: +e.target.value }))}
              style={{ width: '100%', marginTop: 6 }}
            />

            <label style={style.label}>{t.soilAge}: {form.soilAge}{t.months}</label>
            <input type="range" min={1} max={36} value={form.soilAge}
              onChange={e => setForm(f => ({ ...f, soilAge: +e.target.value }))}
              style={{ width: '100%', marginTop: 6 }}
            />

            <label style={style.label}>{t.lastFertilized}: {form.lastFertilized}{t.days}</label>
            <input type="range" min={0} max={60} value={form.lastFertilized}
              onChange={e => setForm(f => ({ ...f, lastFertilized: +e.target.value }))}
              style={{ width: '100%', marginTop: 6 }}
            />

            <label style={style.label}>{t.lastAerated}: {form.lastAerated}{t.days}</label>
            <input type="range" min={0} max={60} value={form.lastAerated}
              onChange={e => setForm(f => ({ ...f, lastAerated: +e.target.value }))}
              style={{ width: '100%', marginTop: 6 }}
            />

            <div style={style.btnRow}>
              <button
                className="primary-btn"
                style={style.btnPrimary}
                onClick={saveBed}
              >
                {editId ? t.update : t.save}
              </button>
              <button
                className="secondary-btn"
                style={style.btnSecondary}
                onClick={() => { setShowForm(false); setEditId(null); }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        {beds.length === 0 && !showForm && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(163,230,53,0.35)',
            fontSize: 14,
            padding: '40px 20px',
            animation: 'fadeSlideIn 0.5s ease both'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🪴</div>
            {t.noBeds}
          </div>
        )}

        {beds.map((bed, i) => {
          const score = getHealthScore(bed);
          const { label, color, bg } = getHealthLabel(score, t);
          const actions = getActions(bed, t);
          return (
            <div
              key={bed.id}
              className="bed-card"
              style={{
                ...style.card,
                animation: `fadeSlideIn 0.4s ease ${i * 0.08}s both`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{bed.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(163,230,53,0.5)' }}>
                    {bed.size}{t.liters} · {bed.soilAge}{t.months} old · F:{bed.lastFertilized}{t.days} A:{bed.lastAerated}{t.days}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: bg,
                  border: `1px solid ${color}44`,
                  borderRadius: 99,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color
                }}>
                  <Pulse color={color} />
                  {label}
                </div>
              </div>

              <AnimatedBar score={score} color={color} />

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: 'rgba(163,230,53,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                  {t.actions}
                </div>
                <div>
                  {actions.map((a, j) => (
                    <span key={j} style={style.actionChip}>{a}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' as const }}>
                <button
                  className="small-btn-green"
                  style={{ ...style.smallBtn, background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
                  onClick={() => markFertilized(bed.id)}
                >
                  🌿 {t.markFertilized}
                </button>
                <button
                  className="small-btn-green"
                  style={{ ...style.smallBtn, background: 'rgba(163,230,53,0.1)', color: '#a3e635', border: '1px solid rgba(163,230,53,0.22)' }}
                  onClick={() => markAerated(bed.id)}
                >
                  🪝 {t.markAerated}
                </button>
                <button
                  className="small-btn-green"
                  style={{ ...style.smallBtn, background: 'rgba(255,255,255,0.05)', color: '#86efac', border: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => openEdit(bed)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="small-btn-red"
                  style={{ ...style.smallBtn, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', marginLeft: 'auto' }}
                  onClick={() => deleteBed(bed.id)}
                >
                  🗑 {t.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}