import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Localization ---
const i18n = {
  en: {
    title: 'LumePhase',
    subtitle: 'Circadian Optimizer',
    wakeTime: 'Target Wake Time',
    currentWake: 'Current Wake Time',
    calculate: 'Calculate Protocol',
    resultTitle: 'Exposure Window',
    instruction: 'Expose yourself to 10,000 lux light during this window to shift your biological clock.',
    shift: 'Calculated Phase Shift',
    hours: 'hours',
    minutes: 'minutes',
    impact: 'Effectiveness',
    high: 'High',
    footer: 'Designed for extreme latitudes & night shifts.'
  },
  nl: {
    title: 'LumePhase',
    subtitle: 'Circadiaanse Optimalisatie',
    wakeTime: 'Doel Ontwaaktijd',
    currentWake: 'Huidige Ontwaaktijd',
    calculate: 'Bereken Protocol',
    resultTitle: 'Lichtblootstelling Venster',
    instruction: 'Stel jezelf bloot aan 10.000 lux licht tijdens dit venster om je biologische klok te verschuiven.',
    shift: 'Berekende Fasenverschuiving',
    hours: 'uur',
    minutes: 'minuten',
    impact: 'Effectiviteit',
    high: 'Hoog',
    footer: 'Ontworpen voor extreme breedtegraden & nachtdiensten.'
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  const [targetWake, setTargetWake] = useState('07:00');
  const [currentWake, setCurrentWake] = useState('10:00');
  const [result, setResult] = useState<{ start: string; end: string; shift: number } | null>(null);

  useEffect(() => {
    const browserLang = navigator.language.startsWith('nl') ? 'nl' : 'en';
    setLang(browserLang);
  }, []);

  const t = i18n[lang];

  const calculateProtocol = () => {
    const [tH, tM] = targetWake.split(':').map(Number);
    const [cH, cM] = currentWake.split(':').map(Number);
    
    const targetMinutes = tH * 60 + tM;
    const currentMinutes = cH * 60 + cM;
    
    let diff = (targetMinutes - currentMinutes);
    // Protocol: Light exposure should start 30 mins after current biological wake-up to advance the phase
    const startTime = (currentMinutes + 30) % 1440;
    const endTime = (startTime + 120) % 1440;

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    setResult({
      start: formatTime(startTime),
      end: formatTime(endTime),
      shift: Math.abs(diff / 60)
    });
  };

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Inject Tailwind CSS betrouwbaar
    const injectTailwind = () => {
      if (!document.getElementById('tailwind-cdn')) {
        const script = document.createElement('script');
        script.id = 'tailwind-cdn';
        script.src = 'https://cdn.tailwindcss.com';

        // Tailwind configuratie om onmiddellijke verwerking te forceren
        script.onload = () => {
          window.tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  slate: { 950: '#0f1115' }
                }
              }
            }
          };
          setIsLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    injectTailwind();
  }, []);
  if (!isLoaded) {
    return (
      <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.card}
      >
        <header style={styles.header}>
          <motion.h1 
            animate={{ color: ['#fff', '#00e5ff', '#fff'] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={styles.title}
          >
            {t.title}
          </motion.h1>
          <p style={styles.subtitle}>{t.subtitle}</p>
        </header>

        <div style={styles.inputGroup}>
          <div style={styles.field}>
            <label style={styles.label}>{t.currentWake}</label>
            <input 
              type="time" 
              value={currentWake} 
              onChange={(e) => setCurrentWake(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{t.wakeTime}</label>
            <input 
              type="time" 
              value={targetWake} 
              onChange={(e) => setTargetWake(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={calculateProtocol}
          style={styles.button}
        >
          {t.calculate}
        </motion.button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.resultContainer}
            >
              <div style={styles.divider} />
              <h2 style={styles.resultTitle}>{t.resultTitle}</h2>
              <div style={styles.timeDisplay}>
                <span style={styles.timeValue}>{result.start}</span>
                <span style={styles.timeArrow}>→</span>
                <span style={styles.timeValue}>{result.end}</span>
              </div>
              <p style={styles.instruction}>{t.instruction}</p>
              <div style={styles.stats}>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>{t.shift}</span>
                  <span style={styles.statValue}>{result.shift.toFixed(1)} {t.hours}</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>{t.impact}</span>
                  <span style={{...styles.statValue, color: '#00ffa3'}}>{t.high}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer style={styles.footer}>
          {t.footer}
        </footer>
      </motion.main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh', 
    backgroundColor: '#0a0a0c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", system-ui, sans-serif',
    color: '#e0e0e0',
    padding: '20px',
    overflow: 'hidden',
    position: 'relative'
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '28px',
    padding: '32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    zIndex: 1
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-1px',
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: '0.9rem',
    opacity: 0.6,
    margin: '4px 0 0 0',
    letterSpacing: '2px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '24px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#888',
    paddingLeft: '4px'
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '1.1rem',
    outline: 'none',
    cursor: 'pointer'
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: '16px',
    border: 'none',
    background: 'linear-gradient(135deg, #00e5ff 0%, #007bff 100%)',
    color: '#000',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  resultContainer: {
    overflow: 'hidden'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    margin: '24px 0'
  },
  resultTitle: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '16px'
  },
  timeDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  timeValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#00e5ff'
  },
  timeArrow: {
    opacity: 0.4,
    fontSize: '1.5rem'
  },
  instruction: {
    fontSize: '0.85rem',
    lineHeight: '1.5',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: '24px',
    padding: '0 10px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  statBox: {
    background: 'rgba(255,255,255,0.03)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '0.7rem',
    opacity: 0.5,
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '0.9rem',
    fontWeight: 600
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    fontSize: '0.7rem',
    opacity: 0.3,
    letterSpacing: '0.5px'
  }
};
