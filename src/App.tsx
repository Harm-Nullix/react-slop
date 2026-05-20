import React, { useState, useEffect, useMemo } from 'react';

/**
 * EchoStasis: AI Semantic Entropy Guard
 * 
 * Target: AI Researchers & Prompt Engineers (The 1% shaping the future of LLMs)
 * Problem: AI-generated data being reused for training leads to 'Model Collapse'.
 * Solution: This tool visualizes the 'Digital Decay' of a prompt over multiple generations.
 */

const TRANSLATIONS = {
  en: {
    title: "EchoStasis // Entropy Guard",
    subtitle: "Prevent Model Collapse by measuring semantic stability.",
    inputPlaceholder: "Enter your seed prompt here...",
    entropyLevel: "Entropy Coefficient",
    generations: "Generations",
    analyze: "Initiate Decay Simulation",
    stability: "Semantic Stability",
    warning: "CRITICAL DECAY DETECTED",
    safe: "STABLE SIGNAL",
    reset: "Reset Buffer",
    footer: "Proprietary algorithm for the 1% preserving human-originality in data."
  },
  nl: {
    title: "EchoStasis // Entropie Wacht",
    subtitle: "Voorkom Model-instorting door semantische stabiliteit te meten.",
    inputPlaceholder: "Voer hier je bron-prompt in...",
    entropyLevel: "Entropie Coëfficiënt",
    generations: "Generaties",
    analyze: "Start Verval Simulatie",
    stability: "Semantische Stabiliteit",
    warning: "KRITIEK VERVAL GEDETECTEERD",
    safe: "STABIEL SIGNAAL",
    reset: "Buffer Wissen",
    footer: "Proprietair algoritme voor de 1% die menselijke originaliteit in data bewaakt."
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'nl'>('en');
  const [input, setInput] = useState('');
  const [entropy, setEntropy] = useState(0.15);
  const [generations, setGenerations] = useState(5);
  const [results, setResults] = useState<{text: string, score: number}[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const browserLang = navigator.language.startsWith('nl') ? 'nl' : 'en';
    setLang(browserLang);
    document.title = TRANSLATIONS[browserLang].title;
  }, []);

  const t = TRANSLATIONS[lang];

  const simulateDecay = () => {
    setIsSimulating(true);
    setResults([]);
    
    let currentText = input;
    const newResults = [];
    const chars = "░▒▓█abc0123456789/?!@#$%^&*";

    for (let i = 0; i <= generations; i++) {
      const stabilityScore = Math.max(0, 100 - (i * entropy * 100));
      newResults.push({ text: currentText, score: stabilityScore });
      
      // Generate next decay level
      currentText = currentText.split('').map(char => {
        if (Math.random() < (entropy * (i / generations))) {
          return chars[Math.floor(Math.random() * chars.length)];
        }
        return char;
      }).join('');
    }

    setTimeout(() => {
      setResults(newResults);
      setIsSimulating(false);
    }, 800);
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
  if (isLoaded) {
    return (
      <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono selection:bg-cyan-500 selection:text-white p-4 md:p-8">
      {/* Tailwind Config Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scanline-effect {
          position: relative; overflow: hidden;
        }
        .scanline-effect::after {
          content: "";
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.1), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none;
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}} />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-2 border-l-4 border-cyan-500 pl-6 py-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
            {t.title}
          </h1>
          <p className="text-cyan-400/70 text-sm md:text-base">
            {t.subtitle}
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <section className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-widest">{t.inputPlaceholder}</label>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all h-32 resize-none text-cyan-50"
                  placeholder="e.g. A digital architect designing a zero-gravity cathedral..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <label className="uppercase text-slate-400">{t.entropyLevel}</label>
                  <span className="text-cyan-400">{(entropy * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.01" max="0.5" step="0.01"
                  value={entropy} onChange={(e) => setEntropy(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <label className="uppercase text-slate-400">{t.generations}</label>
                  <span className="text-cyan-400">{generations}x</span>
                </div>
                <input 
                  type="range" min="2" max="12" step="1"
                  value={generations} onChange={(e) => setGenerations(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <button 
                onClick={simulateDecay}
                disabled={!input || isSimulating}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/20 active:scale-95 uppercase tracking-widest text-sm"
              >
                {isSimulating ? "Calculating..." : t.analyze}
              </button>
            </div>

            <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/40 text-[10px] leading-relaxed text-slate-500">
              {t.footer}
            </div>
          </section>

          {/* Visualizer Column */}
          <section className="lg:col-span-7">
            <div className="scanline-effect glass-panel min-h-[400px] rounded-2xl p-6 border-cyan-900/30 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">Buffer Analysis</h2>
                <button onClick={() => setResults([])} className="text-[10px] text-slate-500 hover:text-white uppercase transition-colors">
                  [{t.reset}]
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {results.length === 0 && !isSimulating && (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-600 text-sm italic">Awaiting sequence input...</p>
                  </div>
                )}

                {results.map((res, idx) => (
                  <div 
                    key={idx} 
                    className="group relative p-4 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 transition-all transform hover:-translate-x-1"
                    style={{ opacity: 0, animation: `fadeIn 0.4s ease forwards ${idx * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Gen {idx}</span>
                      <span className={`text-[10px] font-bold ${res.score > 70 ? 'text-emerald-400' : res.score > 40 ? 'text-amber-400' : 'text-red-500'}`}>
                        {res.score > 40 ? t.safe : t.warning} — {res.score.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm break-all font-light leading-relaxed whitespace-pre-wrap">
                      {res.text}
                    </p>
                    <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${res.score > 70 ? 'bg-emerald-500' : res.score > 40 ? 'bg-amber-500' : 'bg-red-600'}`}
                        style={{ width: `${res.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
      `}} />
    </div>
  );
};

export default App;
