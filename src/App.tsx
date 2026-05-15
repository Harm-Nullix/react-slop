import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Zap, 
  ChevronRight,
  Info
} from 'lucide-react';

/**
 * @description
 * Micro-Chore Tracker: Een app voor de 1% die moeite heeft met kleine taken.
 * Design: Material 3 + Futuristisch / Cyber-minimalism.
 * Features: Meertalig, Micro-animaties, Responsive.
 */

const App = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Water the snake plant', lang: 'en', category: 'home', completed: false },
    { id: 2, text: 'Bril schoonmaken', lang: 'nl', category: 'personal', completed: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect browser language or default to 'en'
  useEffect(() => {
    const browserLang = navigator.language.split('-');
    setLanguage(browserLang === 'nl' ? 'nl' : 'en');
    setIsLoaded(true);
  }, []);

  const translations = {
    en: {
      title: 'Micro-Chore',
      subtitle: 'For the 1% who optimize the seconds.',
      placeholder: 'Add a 2-minute task...',
      add: 'Focus',
      empty: 'No micro-tasks. You are optimized.',
      stats: 'Efficiency',
      tasksDone: 'Tasks Cleared',
      langToggle: 'NL'
    },
    nl: {
      title: 'Micro-Klus',
      subtitle: 'Voor de 1% die de seconden optimaliseert.',
      placeholder: 'Voeg een taak van 2 min toe...',
      add: 'Focus',
      empty: 'Geen micro-klusjes. Je bent optimaal.',
      stats: 'Efficiëntie',
      tasksDone: 'Taken Voltooid',
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
      category: 'general',
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

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans selection:bg-purple-500/30">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-24">
        
        {/* Header Section */}
        <header className="flex justify-between items-start mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Zap size={18} className="text-white fill-current" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {t.title}
              </h1>
            </div>
            <p className="text-slate-500 text-sm md:text-base font-medium">
              {t.subtitle}
            </p>
          </div>
          
          <button 
            onClick={() => setLanguage(l => l === 'en' ? 'nl' : 'en')}
            className="group flex items-center gap-2 px-4 py-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 rounded-full transition-all duration-300 backdrop-blur-md"
          >
            <Globe size={14} className="text-slate-400 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold tracking-widest">{t.langToggle}</span>
          </button>
        </header>

        {/* Input Area */}
        <section className="mb-10 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <form onSubmit={addTask} className="relative">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholder}
              className="w-full bg-slate-900/50 border border-slate-800 hover:border-slate-700 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 rounded-2xl py-5 px-6 outline-none transition-all duration-500 placeholder:text-slate-600 backdrop-blur-sm"
            />
            <button 
              type="submit"
              className="absolute right-3 top-3 bottom-3 px-6 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="hidden md:inline text-sm uppercase tracking-wider">{t.add}</span>
            </button>
          </form>
        </section>

        {/* Stats / Dashboard */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-2xl backdrop-blur-sm">
            <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">{t.stats}</div>
            <div className="text-2xl font-mono font-bold text-blue-400">
              {Math.round((completedCount / (tasks.length || 1)) * 100)}%
            </div>
          </div>
          <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-2xl backdrop-blur-sm">
            <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">{t.tasksDone}</div>
            <div className="text-2xl font-mono font-bold text-purple-400">
              {completedCount} <span className="text-slate-700 text-sm">/ {tasks.length}</span>
            </div>
          </div>
        </div>

        {/* Task List */}
        <section className="space-y-3">
          {tasks.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-800/50 rounded-3xl">
              <Info className="mx-auto mb-3 text-slate-700" size={32} />
              <p className="text-slate-600 italic font-light">{t.empty}</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div 
                key={task.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`
                  group flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 animate-in fade-in slide-in-from-right-4
                  ${task.completed 
                    ? 'bg-slate-900/20 border-slate-800/30 opacity-60' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 shadow-xl shadow-black/10'
                  }
                `}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`
                      relative w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                      ${task.completed 
                        ? 'bg-green-500/20 border-green-500' 
                        : 'border-slate-700 group-hover:border-purple-500'
                      }
                    `}
                  >
                    {task.completed && <CheckCircle2 size={14} className="text-green-500" />}
                    <div className={`absolute inset-0 rounded-full bg-purple-500/20 scale-0 transition-transform duration-300 ${!task.completed && 'group-hover:scale-125'}`} />
                  </button>
                  <span className={`text-sm md:text-base font-medium transition-all duration-300 ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
                    <Clock size={10} />
                    2M
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Footer Info */}
        <footer className="mt-20 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] text-slate-500 uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            System Online: V1.0.2
          </div>
        </footer>
      </main>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-top-4 { from { transform: translateY(-1rem); } to { transform: translateY(0); } }
        @keyframes slide-in-from-bottom-4 { from { transform: translateY(1rem); } to { transform: translateY(0); } }
        @keyframes slide-in-from-right-4 { from { transform: translateX(1rem); } to { transform: translateX(0); } }
        
        .animate-in {
          animation-fill-mode: both;
          animation-duration: 500ms;
        }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-top-4 { animation-name: slide-in-from-top-4; }
        .slide-in-from-bottom-4 { animation-name: slide-in-from-bottom-4; }
        .slide-in-from-right-4 { animation-name: slide-in-from-right-4; }
      `}</style>
    </div>
  );
};

export default App;
