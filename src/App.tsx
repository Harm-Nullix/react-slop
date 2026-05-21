import { useEffect, useState, useRef } from 'react';

const translations = {
  en: {
    title: 'RootSync',
    subtitle: 'Edible Wild Plant Calendar',
    tagline: 'Know what grows. Know when to harvest.',
    currentMonth: 'Current Harvest Window',
    allPlants: 'All Plants',
    searchPlaceholder: 'Search plants...',
    harvestNow: 'Ready Now',
    upcoming: 'Upcoming',
    passed: 'Passed',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    fullMonths: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    ediblePart: 'Edible Part',
    taste: 'Taste',
    habitat: 'Habitat',
    tip: 'Forager Tip',
    caution: 'Caution',
    filterAll: 'All',
    filterReady: 'Ready',
    filterSoon: 'Soon',
    footer: 'Always verify with a local expert before consuming wild plants.',
    monthLabel: 'Month',
    harvestWindow: 'Harvest Window',
  },
  nl: {
    title: 'RootSync',
    subtitle: 'Eetbare Wilde Planten Kalender',
    tagline: 'Weet wat groeit. Weet wanneer te oogsten.',
    currentMonth: 'Huidig Oogstvenster',
    allPlants: 'Alle Planten',
    searchPlaceholder: 'Zoek planten...',
    harvestNow: 'Nu Oogstbaar',
    upcoming: 'Binnenkort',
    passed: 'Voorbij',
    months: ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'],
    fullMonths: ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'],
    ediblePart: 'Eetbaar Deel',
    taste: 'Smaak',
    habitat: 'Habitat',
    tip: 'Forager Tip',
    caution: 'Let Op',
    filterAll: 'Alle',
    filterReady: 'Klaar',
    filterSoon: 'Binnenkort',
    footer: 'Verifieer altijd met een lokale expert voor consumptie van wilde planten.',
    monthLabel: 'Maand',
    harvestWindow: 'Oogstvenster',
  }
};

const plants = [
  {
    id: 1,
    nameEn: 'Stinging Nettle',
    nameNl: 'Brandnetel',
    emoji: '🌿',
    color: '#4ade80',
    glow: '#16a34a',
    harvestMonths: [2,3,4,5],
    ediblePartEn: 'Young leaves & shoots',
    ediblePartNl: 'Jonge blaadjes & scheuten',
    tasteEn: 'Earthy, spinach-like',
    tasteNl: 'Aards, spinazie-achtig',
    habitatEn: 'Roadsides, gardens, riverbanks',
    habitatNl: 'Wegkanten, tuinen, rivierovers',
    tipEn: 'Blanching removes the sting. Perfect in soups and pesto.',
    tipNl: 'Blancheren verwijdert de prik. Perfect in soep en pesto.',
    cautionEn: 'Wear gloves when harvesting raw.',
    cautionNl: 'Draag handschoenen bij oogsten.',
    rarity: 'common',
  },
  {
    id: 2,
    nameEn: 'Elderflower',
    nameNl: 'Vlierbloesom',
    emoji: '🌸',
    color: '#f9a8d4',
    glow: '#ec4899',
    harvestMonths: [5,6],
    ediblePartEn: 'Flowers & berries (cooked)',
    ediblePartNl: 'Bloemen & bessen (gekookt)',
    tasteEn: 'Floral, sweet, musky',
    tasteNl: 'Bloemig, zoet, muskusachtig',
    habitatEn: 'Woodland edges, hedgerows',
    habitatNl: 'Bosranden, hagen',
    tipEn: 'Make cordial or fritters. Harvest in morning for best aroma.',
    tipNl: 'Maak siroop of beignets. Oogst in de ochtend voor beste aroma.',
    cautionEn: 'Raw berries are toxic. Never eat raw.',
    cautionNl: 'Rauwe bessen zijn giftig. Nooit rauw eten.',
    rarity: 'common',
  },
  {
    id: 3,
    nameEn: 'Wild Garlic',
    nameNl: 'Daslook',
    emoji: '🧄',
    color: '#a78bfa',
    glow: '#7c3aed',
    harvestMonths: [3,4,5],
    ediblePartEn: 'Leaves, flowers, bulbs',
    ediblePartNl: 'Bladeren, bloemen, bollen',
    tasteEn: 'Mild garlic, fresh',
    tasteNl: 'Milde knoflook, fris',
    habitatEn: 'Moist woodland floors',
    habitatNl: 'Vochtige bosbodem',
    tipEn: 'Smells unmistakably of garlic. Great in butter or oil.',
    tipNl: 'Ruikt onmiskenbaar naar knoflook. Geweldig in boter of olie.',
    cautionEn: 'Confusable with Lily of the Valley – always smell first!',
    cautionNl: 'Verwarbaar met Lelietje-van-dalen – altijd eerst ruiken!',
    rarity: 'seasonal',
  },
  {
    id: 4,
    nameEn: 'Hawthorn',
    nameNl: 'Meidoorn',
    emoji: '🫐',
    color: '#f87171',
    glow: '#dc2626',
    harvestMonths: [9,10,11],
    ediblePartEn: 'Berries (haws)',
    ediblePartNl: 'Bessen (vruchten)',
    tasteEn: 'Tart, apple-like',
    tasteNl: 'Zuur, appelachtig',
    habitatEn: 'Hedgerows, woodland margins',
    habitatNl: 'Hagen, bosranden',
    tipEn: 'Best after first frost. Use for jellies, ketchup or wine.',
    tipNl: 'Beste na eerste vorst. Gebruik voor gelei, ketchup of wijn.',
    cautionEn: 'Remove seeds – they contain cyanogenic compounds.',
    cautionNl: 'Verwijder zaden – bevatten cyanogene verbindingen.',
    rarity: 'common',
  },
  {
    id: 5,
    nameEn: 'Blackberry',
    nameNl: 'Braam',
    emoji: '🫐',
    color: '#818cf8',
    glow: '#4f46e5',
    harvestMonths: [7,8,9,10],
    ediblePartEn: 'Berries, young shoots',
    ediblePartNl: 'Bessen, jonge scheuten',
    tasteEn: 'Sweet-tart, juicy',
    tasteNl: 'Zoetzuur, sappig',
    habitatEn: 'Hedgerows, forest edges, waste ground',
    habitatNl: 'Hagen, bosranden, braakliggende grond',
    tipEn: 'Harvest before Michaelmas (Sept 29) for best flavor.',
    tipNl: 'Oogst voor Mikaëlsdag (29 sept) voor beste smaak.',
    cautionEn: 'Avoid roadside plants due to pollution.',
    cautionNl: 'Vermijd planten langs drukke wegen (vervuiling).',
    rarity: 'common',
  },
  {
    id: 6,
    nameEn: 'Dandelion',
    nameNl: 'Paardenbloem',
    emoji: '🌼',
    color: '#fbbf24',
    glow: '#d97706',
    harvestMonths: [3,4,5,6,7,8,9],
    ediblePartEn: 'Leaves, flowers, roots',
    ediblePartNl: 'Bladeren, bloemen, wortels',
    tasteEn: 'Bitter, nutty',
    tasteNl: 'Bitter, nootachtig',
    habitatEn: 'Meadows, lawns, roadsides',
    habitatNl: 'Weiden, gazons, wegkanten',
    tipEn: 'Young leaves less bitter. Roasted roots make coffee substitute.',
    tipNl: 'Jonge blaadjes minder bitter. Geroosterde wortels als koffievervanger.',
    cautionEn: 'Avoid heavily fertilized lawns.',
    cautionNl: 'Vermijd sterk bemeste gazons.',
    rarity: 'common',
  },
  {
    id: 7,
    nameEn: 'Rosehip',
    nameNl: 'Rozenbottel',
    emoji: '🌹',
    color: '#fb923c',
    glow: '#ea580c',
    harvestMonths: [9,10,11],
    ediblePartEn: 'Fruits (hips)',
    ediblePartNl: 'Vruchten',
    tasteEn: 'Sweet-tart, floral',
    tasteNl: 'Zoetzuur, bloemig',
    habitatEn: 'Hedgerows, coastal cliffs',
    habitatNl: 'Hagen, kustrotsen',
    tipEn: 'Extremely high in Vitamin C. Make syrup, jam or tea.',
    tipNl: 'Extreem hoog Vitamine C-gehalte. Maak siroop, jam of thee.',
    cautionEn: 'Remove hairs inside fruit – they cause itching.',
    cautionNl: 'Verwijder haartjes binnenin – veroorzaken jeuk.',
    rarity: 'common',
  },
  {
    id: 8,
    nameEn: 'Chickweed',
    nameNl: 'Vogelmuur',
    emoji: '🌱',
    color: '#34d399',
    glow: '#059669',
    harvestMonths: [1,2,3,10,11,12],
    ediblePartEn: 'Leaves, stems, flowers',
    ediblePartNl: 'Bladeren, stelen, bloemen',
    tasteEn: 'Mild, pea-like',
    tasteNl: 'Mild, erwtenachtig',
    habitatEn: 'Gardens, cultivated ground',
    habitatNl: 'Tuinen, gekultiveerde grond',
    tipEn: 'Winter forager\'s staple. Excellent raw in salads.',
    tipNl: 'Winterfoerageerbasis. Uitstekend rauw in salades.',
    cautionEn: 'Mild laxative in large quantities.',
    cautionNl: 'Licht laxerend in grote hoeveelheden.',
    rarity: 'common',
  },
];

function getLang(): 'en' | 'nl' {
  const lang = navigator.language || 'en';
  return lang.startsWith('nl') ? 'nl' : 'en';
}

function getCurrentMonth(): number {
  return new Date().getMonth();
}

function getPlantStatus(plant: typeof plants[0], currentMonth: number): 'ready' | 'soon' | 'passed' {
  if (plant.harvestMonths.includes(currentMonth)) return 'ready';
  const nextHarvest = plant.harvestMonths.find(m => m > currentMonth);
  if (nextHarvest !== undefined && nextHarvest - currentMonth <= 2) return 'soon';
  return 'passed';
}

export default function App() {
  const lang = getLang();
  const t = translations[lang];
  const currentMonth = getCurrentMonth();
  const [selectedPlant, setSelectedPlant] = useState<typeof plants[0] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'soon'>('all');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'RootSync – ' + t.subtitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', t.tagline);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = t.tagline;
      document.head.appendChild(m);
    }
  }, [t]);

  useEffect(() => {
    if (selectedPlant) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPlant]);

  const filteredPlants = plants.filter(p => {
    const name = lang === 'nl' ? p.nameNl : p.nameEn;
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const status = getPlantStatus(p, currentMonth);
    if (filter === 'ready') return matchSearch && status === 'ready';
    if (filter === 'soon') return matchSearch && status === 'soon';
    return matchSearch;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1a0e 40%, #0a1020 100%)',
      color: '#e8f5e9',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px var(--glow), 0 0 20px var(--glow)33; }
          50% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow)55; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes leaf-sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes month-fill {
          from { width: 0%; }
          to { width: var(--fill-width); }
        }
        .plant-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
          animation: fadeInUp 0.5s ease both;
        }
        .plant-card:hover {
          transform: translateY(-6px) scale(1.02);
        }
        .filter-btn {
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          transform: scale(1.05);
        }
        .month-bar {
          transition: all 0.3s ease;
        }
        .month-bar:hover {
          transform: scaleY(1.2);
        }
        .modal-backdrop {
          animation: fadeInUp 0.1s ease;
        }
        .modal-content {
          animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .search-input:focus {
          outline: none;
          border-color: #4ade80 !important;
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.15);
        }
        .emoji-float {
          animation: float 3s ease-in-out infinite;
          display: inline-block;
        }
        .status-badge-ready {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #4ade8055; border-radius: 2px; }
      `}</style>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, #16a34a15 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, #7c3aed15 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', animation: 'float 10s ease-in-out infinite reverse',
      }} />

      {/* Header */}
      <header style={{
        padding: '2rem 1.5rem 1rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(74,222,128,0.1)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,15,10,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <span className="emoji-float" style={{ fontSize: '2rem', animationDelay: '0s' }}>🌿</span>
          <h1 style={{
            margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800,
            background: 'linear-gradient(90deg, #4ade80, #86efac, #4ade80)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}>{t.title}</h1>
          <span className="emoji-float" style={{ fontSize: '2rem', animationDelay: '1.5s' }}>🌱</span>
        </div>
        <p style={{ margin: 0, color: '#86efac99', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {t.tagline}
        </p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        {/* Month indicator */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(74,222,128,0.15)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          backdropFilter: 'blur(10px)',
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4ade8088' }}>
            {t.currentMonth} — {t.fullMonths[currentMonth]}
          </p>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px' }}>
            {t.months.map((m, i) => {
              const isNow = i === currentMonth;
              const plantsThisMonth = plants.filter(p => p.harvestMonths.includes(i)).length;
              const height = Math.max(20, (plantsThisMonth / plants.length) * 100);
              return (
                <div key={i} className="month-bar" style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transformOrigin: 'bottom',
                }}>
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    background: isNow
                      ? 'linear-gradient(180deg, #4ade80, #16a34a)'
                      : i < currentMonth
                      ? 'rgba(74,222,128,0.2)'
                      : 'rgba(74,222,128,0.4)',
                    borderRadius: '4px 4px 2px 2px',
                    boxShadow: isNow ? '0 0 12px #4ade8066' : 'none',
                    transition: 'all 0.3s ease',
                  }} />
                  <span style={{
                    fontSize: '0.55rem',
                    color: isNow ? '#4ade80' : '#4ade8055',
                    fontWeight: isNow ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '180px', padding: '0.65rem 1rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '12px', color: '#e8f5e9', fontSize: '0.9rem',
              transition: 'all 0.3s ease',
            }}
          />
          {(['all', 'ready', 'soon'] as const).map(f => (
            <button
              key={f}
              className="filter-btn"
              onClick={() => setFilter(f)}
              style={{
                padding: '0.65rem 1.1rem',
                background: filter === f ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === f ? '#4ade80' : 'rgba(74,222,128,0.15)'}`,
                borderRadius: '12px', color: filter === f ? '#4ade80' : '#86efac88',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: filter === f ? 600 : 400,
              }}>
              {f === 'all' ? t.filterAll : f === 'ready' ? t.filterReady : t.filterSoon}
            </button>
          ))}
        </div>

        {/* Plant grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {filteredPlants.map((plant, idx) => {
            const status = getPlantStatus(plant, currentMonth);
            const name = lang === 'nl' ? plant.nameNl : plant.nameEn;
            const isHovered = hoveredId === plant.id;
            return (
              <div
                key={plant.id}
                className="plant-card"
                onClick={() => setSelectedPlant(plant)}
                onMouseEnter={() => setHoveredId(plant.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  animationDelay: `${idx * 0.07}s`,
                  background: isHovered
                    ? `linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.05))`
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${status === 'ready' ? plant.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '16px',
                  padding: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden',
                  ['--glow' as any]: plant.glow,
                  boxShadow: status === 'ready' && isHovered ? `0 8px 30px ${plant.color}33` : 'none',
                }}
              >
                {status === 'ready' && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${plant.color}, transparent)`,
                    animation: 'shimmer 2s linear infinite',
                    backgroundSize: '200% auto',
                  }} />
                )}
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', animation: isHovered ? 'float 2s ease-in-out infinite' : 'none' }}>
                  {plant.emoji}
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>
                  {name}
                </h3>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className={status === 'ready' ? 'status-badge-ready' : ''} style={{
                    fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 600,
                    background: status === 'ready' ? plant.color + '33' : status === 'soon' ? '#fbbf2433' : 'rgba(255,255,255,0.08)',
                    color: status === 'ready' ? plant.color : status === 'soon' ? '#fbbf24' : '#ffffff55',
                    border: `1px solid ${status === 'ready' ? plant.color + '55' : status === 'soon' ? '#fbbf2455' : 'transparent'}`,
                    ['--glow' as any]: plant.glow,
                  }}>
                    {status === 'ready' ? '● ' + t.harvestNow : status === 'soon' ? '◐ ' + t.upcoming : '○ ' + t.passed}
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '3px' }}>
                  {Array.from({ length: 12 }).map((_, mi) => (
                    <div key={mi} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: plant.harvestMonths.includes(mi)
                        ? mi === currentMonth ? plant.color : plant.color + '55'
                        : 'rgba(255,255,255,0.08)',
                      transition: 'all 0.3s ease',
                    }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPlants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#4ade8044' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
            <p style={{ margin: 0 }}>No plants found</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '0.75rem 1rem',
        background: 'rgba(10,15,10,0.95)',
        borderTop: '1px solid rgba(74,222,128,0.1)',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        fontSize: '0.72rem',
        color: '#4ade8055',
        zIndex: 5,
      }}>
        ⚠️ {t.footer}
      </footer>

      {/* Modal */}
      {selectedPlant && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setSelectedPlant(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            ref={modalRef}
            className="modal-content"
            style={{
              background: 'linear-gradient(135deg, #0d1a0e, #0a1020)',
              border: `1px solid ${selectedPlant.color}44`,
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '480px', width: '100%',
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: `0 20px 60px ${selectedPlant.color}22, 0 0 0 1px ${selectedPlant.color}22`,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedPlant(null)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: '#fff', width: '32px', height: '32px', borderRadius: '50%',
                cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >✕</button>

            <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'float 3s ease-in-out infinite' }}>
              {selectedPlant.emoji}
            </div>

            <h2 style={{
              margin: '0 0 0.25rem',
              background: `linear-gradient(90deg, ${selectedPlant.color}, #f0fdf4)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontSize: '1.6rem', fontWeight: 800,
            }}>
              {lang === 'nl' ? selectedPlant.nameNl : selectedPlant.nameEn}
            </h2>

            {/* Month timeline */}
            <div style={{ margin: '1rem 0', display: 'flex', gap: '3px', alignItems: 'center' }}>
              {t.months.map((m, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: '8px', borderRadius: '4px', marginBottom: '3px',
                    background: selectedPlant.harvestMonths.includes(i)
                      ? i === currentMonth ? selectedPlant.color : selectedPlant.color + '66'
                      : 'rgba(255,255,255,0.08)',
                    boxShadow: i === currentMonth && selectedPlant.harvestMonths.includes(i)
                      ? `0 0 8px ${selectedPlant.color}` : 'none',
                  }} />
                  <span style={{ fontSize: '0.5rem', color: i === currentMonth ? selectedPlant.color : '#ffffff33' }}>
                    {m}
                  </span>
                </div>
              ))}
            </div>

            {[
              { label: t.ediblePart, value: lang === 'nl' ? selectedPlant.ediblePartNl : selectedPlant.ediblePartEn, icon: '🌿' },
              { label: t.taste, value: lang === 'nl' ? selectedPlant.tasteNl : selectedPlant.tasteEn, icon: '👅' },
              { label: t.habitat, value: lang === 'nl' ? selectedPlant.habitatNl : selectedPlant.habitatEn, icon: '🗺️' },
              { label: t.tip, value: lang === 'nl' ? selectedPlant.tipNl : selectedPlant.tipEn, icon: '💡' },
              { label: t.caution, value: lang === 'nl' ? selectedPlant.cautionNl : selectedPlant.cautionEn, icon: '⚠️', isWarning: true },
            ].map(({ label, value, icon, isWarning }) => (
              <div key={label} style={{
                background: isWarning ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isWarning ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '0.85rem 1rem',
                marginBottom: '0.6rem',
              }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: isWarning ? '#f87171' : selectedPlant.color + 'aa', marginBottom: '0.25rem' }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: '0.9rem', color: isWarning ? '#fca5a5' : '#e8f5e9cc' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
