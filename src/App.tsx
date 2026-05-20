import React, { useState, useEffect } from 'react';

interface CognitiveState {
  load: number;
  timestamp: Date;
  focusStreak: number;
  lastBreak: Date;
}

const App: React.FC = () => {
  const [cognitiveLoad, setCognitiveLoad] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [breakTime, setBreakTime] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showStats, setShowStats] = useState(false);
  const [sessions, setSessions] = useState<CognitiveState[]>([]);

  useEffect(() => {
    document.title = language === 'nl' ? 'BrewMind - Cognitieve Belasting Monitor' : 'BrewMind - Cognitive Load Monitor';
    const browserLang = navigator.language.toLowerCase();
    setLanguage(browserLang.startsWith('nl') ? 'nl' : 'en');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusMinutes(m => m + 1);
      setCognitiveLoad(prev => {
        const newLoad = Math.min(100, prev + (Math.random() * 3));
        return newLoad;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (focusMinutes > 0 && focusMinutes % 25 === 0 && focusMinutes > 0) {
      setBreakTime(true);
      setCognitiveLoad(prev => Math.max(0, prev - 30));
    }
  }, [focusMinutes]);

  const getLoadColor = () => {
    if (cognitiveLoad < 30) return 'from-green-400 to-emerald-500';
    if (cognitiveLoad < 60) return 'from-yellow-400 to-amber-500';
    if (cognitiveLoad < 85) return 'from-orange-400 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  const getLoadMessage = () => {
    if (language === 'nl') {
      if (cognitiveLoad > 85) return { text: 'KRITIEK', subtext: 'Onmiddellijke pauze nodig!' };
      if (cognitiveLoad > 60) return { text: 'HOOG', subtext: 'Pauze aanbevolen' };
      if (cognitiveLoad > 30) return { text: 'MATIG', subtext: 'Goed alert' };
      return { text: 'LAAG', subtext: 'Optimaal moment voor werk' };
    } else {
      if (cognitiveLoad > 85) return { text: 'CRITICAL', subtext: 'Take a break immediately!' };
      if (cognitiveLoad > 60) return { text: 'HIGH', subtext: 'Break recommended' };
      if (cognitiveLoad > 30) return { text: 'MODERATE', subtext: 'Good focus' };
      return { text: 'LOW', subtext: 'Optimal work window' };
    }
  };

  const handleBreakComplete = () => {
    setBreakTime(false);
    setFocusMinutes(0);
    setSessions([...sessions, { load: cognitiveLoad, timestamp: new Date(), focusStreak: focusMinutes, lastBreak: new Date() }]);
  };

  const translations = {
    en: {
      title: 'BrewMind',
      subtitle: 'Cognitive Load Intelligence',
      focusLabel: 'Focus Time',
      minutes: 'min',
      breakRecommended: 'Break Recommended',
      completeBreak: 'Break Complete',
      stats: 'Daily Stats',
      sessions: 'Sessions',
      avgLoad: 'Avg Load',
      dismissBreak: 'Dismiss',
      microBreakTip: 'Try: Eye palming, neck rolls, or 10 deep breaths',
    },
    nl: {
      title: 'BrewMind',
      subtitle: 'Cognitieve Belasting Monitor',
      focusLabel: 'Focustijd',
      minutes: 'min',
      breakRecommended: 'Pauze Aanbevolen',
      completeBreak: 'Pauze Voltooid',
      stats: 'Dagelijkse Statistieken',
      sessions: 'Sessies',
      avgLoad: 'Gem. Belasting',
      dismissBreak: 'Sluiten',
      microBreakTip: 'Probeer: Ogen palm, nekrollen, of 10 diepe ademhalingen',
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;
  const message = getLoadMessage();
  const avgLoad = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.load, 0) / sessions.length) : 0;

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }} className="flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); } 50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); } }
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .rotate-dial { animation: rotateDial 20s linear infinite; }
        @keyframes rotateDial { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="w-full max-w-md" style={{ animation: 'slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#e2e8f0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-2px', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.title}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>{t.subtitle}</p>
        </div>

        {/* Main Load Circle */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{
            width: '240px',
            height: '240px',
            margin: '0 auto',
            background: `conic-gradient(from 0deg, #8b5cf6 0deg, #60a5fa ${cognitiveLoad * 3.6}deg, #334155 ${cognitiveLoad * 3.6}deg)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 40px rgba(139, 92, 246, ${cognitiveLoad / 100})`,
            transition: 'all 0.3s ease',
          }} className="pulse-glow">
            <div style={{
              width: '200px',
              height: '200px',
              background: '#0f172a',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: '#e2e8f0' }}>
                {Math.round(cognitiveLoad)}%
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#a78bfa' }}>{message.text}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{message.subtext}</div>
            </div>
          </div>
        </div>

        {/* Focus Time */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{t.focusLabel}</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#60a5fa' }}>{focusMinutes} {t.minutes}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Recommended break at 25 min</div>
        </div>

        {/* Break Alert */}
        {breakTime && (
          <div style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
              ⏱️ {t.breakRecommended}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#fef3c7', marginBottom: '1rem' }}>{t.microBreakTip}</div>
            <button
              onClick={handleBreakComplete}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#fff',
                color: '#ea580c',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {t.completeBreak}
            </button>
          </div>
        )}

        {/* Stats Button */}
        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#a78bfa',
            borderRadius: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.875rem',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)')}
        >
          {showStats ? '✕ Close' : '📊 ' + t.stats}
        </button>

        {/* Stats Expanded */}
        {showStats && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginTop: '1rem',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(96, 165, 250, 0.1)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{t.sessions}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#60a5fa', marginTop: '0.5rem' }}>{sessions.length}</div>
              </div>
              <div style={{ background: 'rgba(167, 139, 250, 0.1)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{t.avgLoad}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#a78bfa', marginTop: '0.5rem' }}>{avgLoad}%</div>
              </div>
            </div>
            {sessions.length === 0 && <div style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No sessions yet</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;