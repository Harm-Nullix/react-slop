import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [isNl, setIsNl] = useState(false);
  const [mode, setMode] = useState('idle'); // 'idle' | 'ascent' | 'descent'
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [action, setAction] = useState('ready'); // 'swallow' | 'yawn' | 'valsalva' | 'ready'
  const [estimatedAltitude, setEstimatedAltitude] = useState(0); // in meters
  const [pressure, setPressure] = useState(1013.25); // in hPa
  
  // Audio context for dynamic bio-acoustic tones
  const audioCtxRef = useRef(null);

  // Detect language setting
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsNl(navigator.language.startsWith('nl'));
    }
  }, []);

  // Translations
  const t = isNl ? {
    title: "BaroPace | Lift Druk Sync",
    subtitle: "Verticale Transit Evenwicht",
    desc: "Ontworpen voor bewoners en professionals in superhoge wolkenkrabbers (>300m). Synchroniseer de druk in je buis van Eustachius feilloos met snelle verticale barometrische verschuivingen.",
    ascent: "Stijgen (Omhoog)",
    descent: "Dalen (Omlaag)",
    start: "Start Sync Provisie",
    stop: "Beëindig Transit",
    swallow: "SLIK NU",
    yawn: "BEWEEG JE KAAK / GEEUW",
    valsalva: "PERS LICHT (BLAAS MET DICHTE NEUS)",
    ready: "Gereed voor transit",
    altitude: "Geschatte Hoogte",
    pressure: "Luchtdruk",
    completed: "Synchronisatie voltooid!",
    rate: "Stijgsnelheid",
    tip: "Tip: Volg de pulserende cirkel om oorpijn te voorkomen tijdens de lift-rit."
  } : {
    title: "BaroPace | Elevator Pressure Sync",
    subtitle: "Vertical Transit Equilibrium",
    desc: "Engineered for urbanites living or working in supertall structures (>300m). Flawlessly synchronize your Eustachian tubes with high-speed vertical barometric shifts.",
    ascent: "Ascent (Going Up)",
    descent: "Descent (Going Down)",
    start: "Start Sync Provision",
    stop: "Terminate Transit",
    swallow: "SWALLOW NOW",
    yawn: "SHIFT JAW / YAWN",
    valsalva: "GENTLE EXHALATION (VALSALVA)",
    ready: "Ready for transit",
    altitude: "Estimated Altitude",
    pressure: "Atmospheric Pressure",
    completed: "Equalization completed!",
    rate: "Transit Rate",
    tip: "Tip: Match your biological actions with the breathing ring to avoid ear barotrauma."
  };

  // Modify page title dynamically
  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

  // Handle dynamic synthesized audio triggers for cues
  const playTone = (frequency, duration, type = 'sine') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio might fail silently due to lack of initial user gesture interaction
    }
  };

  // Run the dynamic elevator barometric simulator loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const step = 1.25; // 20-second dynamic ride duration
          const next = prev + step;
          
          if (next >= 100) {
            setIsPlaying(false);
            setMode('idle');
            setAction('ready');
            playTone(880, 0.5, 'triangle');
            return 100;
          }

          // Generate simulated altitude and barometric data
          const maxAltitude = 520;
          let currentAlt = 0;
          if (mode === 'ascent') {
            currentAlt = Math.round((next / 100) * maxAltitude);
          } else {
            currentAlt = Math.round(((100 - next) / 100) * maxAltitude);
          }
          setEstimatedAltitude(currentAlt);
          
          const simulatedPressure = 1013.25 * Math.exp(-currentAlt / 8500);
          setPressure(Number(simulatedPressure.toFixed(2)));

          // Cycle equalization actions based on altitude progress
          const currentSegment = Math.floor(next % 30);
          let newAction = 'swallow';
          if (currentSegment < 10) {
            newAction = 'swallow';
          } else if (currentSegment < 20) {
            newAction = 'yawn';
          } else {
            newAction = mode === 'ascent' ? 'yawn' : 'valsalva';
          }

          if (newAction !== action) {
            setAction(newAction);
            if (newAction === 'swallow') playTone(523.25, 0.2, 'sine');
            if (newAction === 'yawn') playTone(392.00, 0.3, 'sine');
            if (newAction === 'valsalva') playTone(261.63, 0.4, 'triangle');
          }

          return next;
        });
      }, 250);
    } else {
      setProgress(0);
      setEstimatedAltitude(mode === 'ascent' ? 0 : 520);
      setPressure(mode === 'ascent' ? 1013.25 : 952.41);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, mode, action]);

  const handleStart = () => {
    if (mode === 'idle') return;
    setIsPlaying(true);
    setProgress(0);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    playTone(659.25, 0.3, 'sine');
  };

  const handleStop = () => {
    setIsPlaying(false);
    setMode('idle');
    setAction('ready');
    setProgress(0);
    playTone(329.63, 0.2, 'sawtooth');
  };

  return (
    <div className="bp-wrapper">
      <style>{`
        /* Self-contained Custom CSS Stylesheet for robust rendering */
        .bp-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'Outfit', sans-serif;
          background-color: #07090f;
          color: #dde8f2;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .bp-wrapper *, .bp-wrapper *::before, .bp-wrapper *::after {
          box-sizing: border-box;
        }

        .bp-grid-glow {
          position: absolute;
          inset: 0;
          background-size: 24px 24px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          pointer-events: none;
          z-index: 0;
        }

        .bp-radial-blur {
          position: absolute;
          top: 25%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24rem;
          height: 24rem;
          background-color: rgba(20, 184, 166, 0.08);
          border-radius: 9999px;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }

        .bp-card {
          max-width: 28rem;
          width: 100%;
          background-color: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 2.25rem;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          position: relative;
          overflow: hidden;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 580px;
          animation: float-slow 6s infinite ease-in-out;
        }

        .bp-badge {
          display: inline-flex;
          align-items: center;
          align-self: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          background-color: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.8);
          font-size: 10px;
          color: #2dd4bf;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 1.25rem;
          font-weight: 600;
        }

        .bp-badge-dot {
          width: 6px;
          height: 6px;
          background-color: #2dd4bf;
          border-radius: 9999px;
          position: relative;
        }
        
        .bp-badge-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          background-color: #2dd4bf;
          border-radius: 9999px;
          animation: ping-pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .bp-title {
          font-size: 2.25rem;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #2dd4bf 0%, #e2e8f0 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          text-align: center;
        }

        .bp-subtitle {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 700;
          margin-top: 0.5rem;
          opacity: 0.8;
          text-align: center;
        }

        .bp-desc {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.85);
          margin-top: 1rem;
          line-height: 1.6;
          font-weight: 400;
          text-align: center;
          padding: 0 0.5rem;
        }

        .bp-modes-grid {
          display: grid;
          grid-template-cols: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          width: 100%;
          margin-bottom: 1.25rem;
        }

        .bp-btn-mode {
          padding: 1.25rem 0.75rem;
          border-radius: 1.25rem;
          border: 1px solid rgba(51, 65, 85, 0.6);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background-color: rgba(2, 6, 23, 0.3);
          color: #94a3b8;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
        }

        .bp-btn-mode svg {
          transition: transform 0.3s ease;
        }

        .bp-btn-mode:hover {
          border-color: rgba(148, 163, 184, 0.5);
          color: #f1f5f9;
        }

        .bp-btn-mode:hover svg {
          transform: translateY(var(--hover-translate, 0px));
        }

        .bp-btn-mode.active-ascent {
          background-color: rgba(45, 212, 191, 0.1);
          border-color: #2dd4bf;
          color: #99f6e4;
          box-shadow: 0 10px 15px -3px rgba(45, 212, 191, 0.1);
        }

        .bp-btn-mode.active-descent {
          background-color: rgba(6, 182, 212, 0.1);
          border-color: #06b6d4;
          color: #afeefb;
          box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.1);
        }

        .bp-btn-start {
          width: 100%;
          padding: 1.1rem;
          border-radius: 1.25rem;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          color: white;
          transition: all 0.3s ease;
          font-family: 'Outfit', sans-serif;
        }

        .btn-start-ascent {
          background: linear-gradient(135deg, #14b8a6, #059669);
          box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.3);
        }

        .btn-start-descent {
          background: linear-gradient(135deg, #06b6d4, #0284c7);
          box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.3);
        }

        .bp-btn-start:disabled {
          background: linear-gradient(135deg, #334155, #1e293b);
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }

        .bp-pacing-ring {
          width: 11rem;
          height: 11rem;
          border-radius: 9999px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.5s ease-in-out;
          border-width: 2px;
          border-style: solid;
          animation: pulse-ring 2.5s infinite ease-in-out;
        }

        .ring-swallow {
          background-color: rgba(45, 212, 191, 0.1);
          border-color: #2dd4bf;
          box-shadow: 0 0 30px rgba(45, 212, 191, 0.2);
        }

        .ring-yawn {
          background-color: rgba(6, 182, 212, 0.1);
          border-color: #06b6d4;
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.2);
        }

        .ring-valsalva {
          background-color: rgba(245, 158, 11, 0.1);
          border-color: #f59e0b;
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
        }

        .bp-sensor-box {
          width: 100%;
          background-color: #020617;
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 1rem;
          padding: 1rem;
          display: grid;
          grid-template-cols: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 1.5rem;
        }

        .bp-sensor-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .bp-sensor-item:first-child {
          border-right: 1px solid rgba(51, 65, 85, 0.4);
        }

        .bp-sensor-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .bp-sensor-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #e2e8f0;
        }

        .bp-progress-wrapper {
          width: 100%;
          margin-top: 1.25rem;
        }

        .bp-progress-bg {
          width: 100%;
          background-color: rgba(2, 6, 23, 0.8);
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 9999px;
          height: 0.5rem;
          overflow: hidden;
          padding: 1px;
        }

        .bp-progress-bar {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease-out;
        }

        .bar-ascent {
          background: linear-gradient(to right, #14b8a6, #34d399);
        }

        .bar-descent {
          background: linear-gradient(to right, #06b6d4, #38bdf8);
        }

        .bp-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 0.5rem;
        }

        .bp-btn-stop {
          margin-top: 1.5rem;
          padding: 0.625rem 1.5rem;
          border-radius: 0.75rem;
          background-color: #020617;
          border: 1px solid rgba(51, 65, 85, 0.5);
          color: #94a3b8;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Outfit', sans-serif;
        }

        .bp-btn-stop:hover {
          background-color: #0f172a;
          color: #f87171;
          border-color: rgba(248, 113, 113, 0.4);
        }

        .bp-footer {
          margin-top: 1.5rem;
          border-top: 1px solid rgba(51, 65, 85, 0.4);
          padding-top: 1rem;
          text-align: center;
        }

        .bp-tip {
          font-size: 11px;
          color: rgba(148, 163, 184, 0.65);
          line-height: 1.5;
        }

        /* Keyframe animations */
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(0.25deg); }
        }

        @keyframes ping-pulse {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Background aesthetics */}
      <div className="bp-grid-glow" />
      <div className="bp-radial-blur" />

      {/* Main glassmorphism container */}
      <div className="bp-card">
        
        {/* Dynamic high-tech header */}
        <header style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="bp-badge">
            <span className="bp-badge-dot" />
            {isNl ? 'BAROMETRISCH' : 'BAROMETRIC'} SENSOR ACTIVE
          </div>
          
          <h1 className="bp-title">
            {t.title.split(' | ')[0]}
          </h1>
          <p className="bp-subtitle">
            {t.subtitle}
          </p>
          <p className="bp-desc">
            {t.desc}
          </p>
        </header>

        {/* Dynamic Equalization action controls */}
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0', position: 'relative', zIndex: 10 }}>
          {!isPlaying ? (
            <div style={{ width: '100%' }}>
              <div className="bp-modes-grid">
                <button 
                  onClick={() => setMode('ascent')}
                  className={`bp-btn-mode ${mode === 'ascent' ? 'active-ascent' : ''}`}
                  style={{ '--hover-translate': '-4px' }}
                >
                  <svg className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem', color: mode === 'ascent' ? '#2dd4bf' : '#64748b' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"/>
                  </svg>
                  <span>{t.ascent.split(' ')[0]}</span>
                </button>
                
                <button 
                  onClick={() => setMode('descent')}
                  className={`bp-btn-mode ${mode === 'descent' ? 'active-descent' : ''}`}
                  style={{ '--hover-translate': '4px' }}
                >
                  <svg className="w-6 h-6" style={{ width: '1.5rem', height: '1.5rem', color: mode === 'descent' ? '#06b6d4' : '#64748b' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"/>
                  </svg>
                  <span>{t.descent.split(' ')[0]}</span>
                </button>
              </div>

              <button
                disabled={mode === 'idle'}
                onClick={handleStart}
                className={`bp-btn-start ${mode === 'ascent' ? 'btn-start-ascent' : 'btn-start-descent'}`}
              >
                {t.start}
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Animated pacing ring */}
              <div className={`bp-pacing-ring ${
                action === 'swallow' ? 'ring-swallow' : 
                action === 'yawn' ? 'ring-yawn' : 
                'ring-valsalva'
              }`}>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '0.5rem' }}>
                  {mode === 'ascent' ? t.ascent.split(' ')[0] : t.descent.split(' ')[0]}
                </span>
                
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  lineHeight: 1.4,
                  color: action === 'swallow' ? '#5eead4' : action === 'yawn' ? '#67e8f9' : '#fcd34d'
                }}>
                  {action === 'swallow' ? t.swallow : action === 'yawn' ? t.yawn : t.valsalva}
                </span>
              </div>

              {/* Dynamic barometric simulated telemetry */}
              <div className="bp-sensor-box">
                <div className="bp-sensor-item">
                  <div className="bp-sensor-label">{t.altitude}</div>
                  <div className="bp-sensor-value">{estimatedAltitude} m</div>
                </div>
                <div className="bp-sensor-item">
                  <div className="bp-sensor-label">{t.pressure}</div>
                  <div className="bp-sensor-value" style={{ color: '#2dd4bf' }}>{pressure} hPa</div>
                </div>
              </div>

              {/* Dynamic progress bar */}
              <div className="bp-progress-wrapper">
                <div className="bp-progress-bg">
                  <div 
                    className={`bp-progress-bar ${mode === 'ascent' ? 'bar-ascent' : 'bar-descent'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="bp-progress-labels">
                  <span>{mode === 'ascent' ? '0m' : '520m'}</span>
                  <span style={{ color: '#2dd4bf' }}>{t.rate}: 26 m/s</span>
                  <span>{mode === 'ascent' ? '520m' : '0m'}</span>
                </div>
              </div>

              {/* Cancellation trigger */}
              <button onClick={handleStop} className="bp-btn-stop">
                {t.stop}
              </button>
            </div>
          )}
        </main>

        {/* Dynamic Instructional Tips */}
        <footer className="bp-footer">
          <p className="bp-tip">
            {t.tip}
          </p>
        </footer>

      </div>
    </div>
  );
}