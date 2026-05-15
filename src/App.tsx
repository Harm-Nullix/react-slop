import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Zap, 
  Info 
} from 'lucide-react';

/**
 * Micro-Chore Tracker
 * Een "Self-Styling" React component.
 * Geoptimaliseerd voor betrouwbare rendering bij de eerste load.
 */

const App = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Water the snake plant', category: 'home', completed: false },
    { id: 2, text: 'Bril schoonmaken', category: 'personal', completed: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('en');
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

    const browserLang = navigator.language.split('-');
    setLanguage(browserLang === 'nl' ? 'nl' : 'en');
  }, []);

  const translations = {
    en: {
      title: 'Micro-Chore',
      subtitle: 'For the 1% who optimize every second.',
      placeholder: 'Add a 2-minute task...',
      add: 'Focus',
      empty: 'No micro-tasks. You are optimized.',
      stats: 'Efficiency',
      tasksDone: 'Cleared',
      langToggle: 'NL'
    },
    nl: {
      title: 'Micro-Klus',
      subtitle: 'Voor de 1% die elke seconde optimaliseert.',
      placeholder: 'Taak van 2 min toevoegen...',
      add: 'Focus',
      empty: 'Geen micro-klusjes. Je bent optimaal.',
      stats: 'Efficiëntie',
      tasksDone: 'Voltooid',
      langToggle: 'EN'
    }
  };

  const t = translations[language];

  const addTask = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newTask = {
      id: Date.now(),
      text: inputValue,
      completed: false
    };
    setTasks([newTask, ...tasks]);
    setInputValue('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  // Render een basis-layout tijdens het laden om "verspringen" te voorkomen
  if (!isLoaded) {
    return (
      <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Futuristisch achtergrond decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-24">
        
        {/* Header met Micro-animaties */}
        <header className="flex justify-between items-start mb-12 animate-[fadeIn_1s_ease-out]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-2xl shadow-purple-500/20 transform hover:rotate-12 transition-transform duration-500">
                <Zap size={22} className="text-white fill-current" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
                {t.title}
              </h1>
            </div>
            <p className="text-slate-500 text-sm md:text-base font-medium tracking-wide">
              {t.subtitle}
            </p>
          </div>
          
          <button 
            onClick={() => setLanguage(l => l === 'en' ? 'nl' : 'en')}
            className="group flex items-center gap-2 px-4 py-2 bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700/50 rounded-full transition-all duration-300 backdrop-blur-xl"
          >
            <Globe size={14} className="text-slate-400 group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-xs font-bold tracking-widest text-slate-300">{t.langToggle}</span>
          </button>
        </header>

        {/* Input Sectie (Material 3 stijl) */}
        <section className="mb-10 animate-[slideUp_0.7s_ease-out_0.2s_both]">
          <form onSubmit={addTask} className="relative group">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholder}
              className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-purple-500/50 focus:ring-8 focus:ring-purple-500/5 rounded-2xl py-5 px-6 outline-none transition-all duration-500 placeholder:text-slate-600 backdrop-blur-md text-lg"
            />
            <button 
              type="submit"
              className="absolute right-3 top-3 bottom-3 px-6 bg-white text-black font-bold rounded-xl hover:bg-purple-50 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-white/5"
            >
              <Plus size={20} />
              <span className="hidden sm:inline text-xs uppercase tracking-widest">{t.add}</span>
            </button>
          </form>
        </section>

        {/* Dashboards / Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10 animate-[slideUp_0.7s_ease-out_0.3s_both]">
          <div className="bg-slate-900/20 border border-slate-800/40 p-5 rounded-3xl backdrop-blur-sm group hover:border-blue-500/30 transition-colors">
            <div className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-2">{t.stats}</div>
            <div className="text-3xl font-mono font-bold text-blue-400">
              {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </div>
          </div>
          <div className="bg-slate-900/20 border border-slate-800/40 p-5 rounded-3xl backdrop-blur-sm group hover:border-purple-500/30 transition-colors">
            <div className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-2">{t.tasksDone}</div>
            <div className="text-3xl font-mono font-bold text-purple-400">
              {completedCount} <span className="text-slate-700 text-lg">/ {tasks.length}</span>
            </div>
          </div>
        </div>

        {/* Task List */}
        <section className="space-y-4">
          {tasks.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-800/30 rounded-[2rem] animate-[fadeIn_1s]">
              <Info className="mx-auto mb-4 text-slate-800" size={40} />
              <p className="text-slate-600 italic font-light tracking-wide">{t.empty}</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div 
                key={task.id}
                style={{ animationDelay: `${index * 80}ms` }}
                className={`
                  group flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-700 animate-[slideInRight_0.5s_ease-out_both]
                  ${task.completed 
                    ? 'bg-slate-900/10 border-slate-800/20 opacity-50 scale-[0.98]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:translate-x-1 shadow-xl'
                  }
                `}
              >
                <div className="flex items-center gap-5 flex-1">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`
                      relative w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500
                      ${task.completed 
                        ? 'bg-green-500/20 border-green-500/50 scale-110' 
                        : 'border-slate-700 group-hover:border-purple-500/50'
                      }
                    `}
                  >
                    {task.completed && <CheckCircle2 size={16} className="text-green-400" />}
                    <div className={`absolute inset-0 rounded-full bg-purple-500/10 scale-0 transition-transform duration-500 ${!task.completed && 'group-hover:scale-150'}`} />
                  </button>
                  <span className={`text-base font-medium transition-all duration-500 ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/30">
                    <Clock size={12} className="text-blue-400" />
                    2M
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Futuristische Footer Status */}
        <footer className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-900/40 border border-slate-800/50 rounded-full text-[10px] text-slate-500 uppercase tracking-[0.3em] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Quantum Sync Active
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        
        body { margin: 0; padding: 0; background-color: #0f1115; font-family: sans-serif; color: #e2e8f0; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default App;
