'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const EchoApp = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState({ x: -999, y: -999 });
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const particlesRef = useRef<any[]>([]);
  const trailsRef = useRef<any[]>([]);
  const frameRef = useRef(0);
  const animationRef = useRef<number>();

  // ────── PARTICLE SYSTEM ──────
  const COLORS = ['107,77,255', '0,229,160', '255,90,135', '0,200,255'];

  class Particle {
    bx: number;
    by: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    o: number;
    c: string;

    constructor(w: number, h: number) {
      this.bx = Math.random() * w;
      this.by = Math.random() * h;
      this.x = this.bx;
      this.y = this.by;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.4 + 0.3;
      this.o = Math.random() * 0.5 + 0.08;
      this.c = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update(mx: number, my: number) {
      const dx = mx - this.x;
      const dy = my - this.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;

      if (d < 220) {
        const f = (220 - d) / 220;
        this.vx += (dx / d) * f * 0.45;
        this.vy += (dy / d) * f * 0.45;
      }

      this.vx += (this.bx - this.x) * 0.003;
      this.vy += (this.by - this.y) * 0.003;
      this.vx *= 0.93;
      this.vy *= 0.93;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.c},${this.o})`;
      ctx.fill();
    }
  }

  class Trail {
    x: number;
    y: number;
    o: number;
    r: number;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.o = 0.5;
      this.r = Math.random() * 2.5 + 0.5;
    }

    update() {
      this.o -= 0.022;
      this.r *= 0.96;
    }

    draw(ctx: CanvasRenderingContext2D) {
      if (this.o <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,229,160,${this.o * 0.28})`;
      ctx.fill();
    }
  }

  // ────── INITIALIZATION & ANIMATION ──────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = [];
      const n = Math.min(180, Math.floor((canvas.width * canvas.height) / 9000));
      for (let i = 0; i < n; i++) {
        particlesRef.current.push(new Particle(canvas.width, canvas.height));
      }
    };

    const drawLines = () => {
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 115) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(107,77,255,${(1 - d / 115) * 0.14})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameRef.current++;

      trailsRef.current = trailsRef.current.filter((t) => t.o > 0);
      trailsRef.current.forEach((t) => {
        t.update();
        t.draw(ctx);
      });

      drawLines();

      particlesRef.current.forEach((p) => {
        p.update(cursor.x, cursor.y);
        p.draw(ctx);
      });

      if (cursor.x > 0) {
        const g = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 160);
        g.addColorStop(0, 'rgba(0,229,160,.05)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animate();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [cursor]);

  // ────── CURSOR TRACKING ──────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
    if (frameRef.current % 3 === 0) {
      trailsRef.current.push(new Trail(e.clientX, e.clientY));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // ────── SCROLL REVEAL ──────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add((e.target as HTMLElement).id || 'unknown'));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ────── TEXT SCRAMBLE ──────
  const useScramble = (targetText: string, delay: number) => {
    const [display, setDisplay] = useState('');
    const CHARS = '!<>-_\\/[]{}=+*^?#@$~';

    useEffect(() => {
      const timer = setTimeout(() => {
        const len = targetText.length;
        const q = Array.from({ length: len }, (_, i) => ({
          to: targetText[i],
          start: Math.floor(Math.random() * 18),
          end: 0,
          ch: '',
        }));

        q.forEach((item) => {
          item.end = item.start + Math.floor(Math.random() * 12);
        });

        let f = 0;
        const step = () => {
          let out = '';
          let done = 0;

          for (let i = 0; i < q.length; i++) {
            const { to, start, end } = q[i];
            if (f >= end) {
              done++;
              out += to;
            } else if (f >= start) {
              if (!q[i].ch || Math.random() < 0.3) {
                q[i].ch = CHARS[Math.floor(Math.random() * CHARS.length)];
              }
              out += `<span style="color:#00E5A0;opacity:0.5">${q[i].ch}</span>`;
            } else {
              out += '\u00A0';
            }
          }
          setDisplay(out);
          f++;

          if (done < q.length) {
            requestAnimationFrame(step);
          }
        };
        step();
      }, delay);

      return () => clearTimeout(timer);
    }, [targetText]);

    return display;
  };

  const phrases = [
    'INITIALIZING COGNITIVE LAYER...',
    'MAPPING YOUR DECISION TOPOLOGY...',
    'RESONANCE FIELD CALIBRATED.',
    'TEMPORAL BUFFER: ±0.2ms',
    'SCAR MATRIX INHERITED FROM PRIOR SESSION.',
    'COLLECTIVE INTENT DOWNLOADED.',
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const scrambledText = useScramble(phrases[phraseIndex], 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhraseIndex((p) => (p + 1) % phrases.length);
    }, 3400);
    return () => clearTimeout(timer);
  }, [phraseIndex]);

  // ────── CURSOR ELEMENT STATE ──────
  const [cursorSize, setCursorSize] = useState({ width: 10, height: 10, ringWidth: 72, ringHeight: 72 });

  const handleElementHover = (hover: boolean) => {
    if (hover) {
      setCursorSize({ width: 18, height: 18, ringWidth: 110, ringHeight: 110 });
    } else {
      setCursorSize({ width: 10, height: 10, ringWidth: 72, ringHeight: 72 });
    }
  };

  // ────── COUNTER ANIMATION ──────
  const useCounter = (target: number, shouldCount: boolean) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
      if (!shouldCount) return;
      let n = 0;
      const dur = 1200;
      let start: number | null = null;

      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        n = Math.round(eased * target);
        setValue(n);
        if (p < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }, [shouldCount, target]);

    return value;
  };

  const specVisible = visibleElements.has('specs');
  const count200 = useCounter(200, specVisible);
  const count37 = useCounter(37, specVisible);
  const count1b = useCounter(1, specVisible);

  return (
    <div className="min-h-screen bg-[#02020A] text-[#D0D0E8] font-mono cursor-none overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@200;400;700;900&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        html { scroll-behavior: smooth; }
        
        body::after {
          content: '';
          position: fixed; inset: 0;
          opacity: 0.025;
          pointer-events: none;
          z-index: 9000;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes drift {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(60px,-40px) scale(1.15); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes shiftGrd {
          from { background-position: 0% 50%; }
          to { background-position: 100% 50%; }
        }

        .anim-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }

        .anim-fade-up.delay-1 { animation-delay: 0.3s; }
        .anim-fade-up.delay-2 { animation-delay: 0.45s; }
        .anim-fade-up.delay-3 { animation-delay: 0.65s; }
        .anim-fade-up.delay-4 { animation-delay: 0.8s; }
        .anim-fade-up.delay-5 { animation-delay: 1.1s; }

        .aurora-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(130px);
          pointer-events: none;
          z-index: 0;
          animation: drift 22s ease-in-out infinite alternate;
        }

        .blob-1 {
          width: 700px;
          height: 700px;
          background: #6B4DFF;
          top: 10%;
          left: 25%;
          opacity: 0.12;
        }

        .blob-2 {
          width: 500px;
          height: 500px;
          background: #00E5A0;
          top: 60%;
          left: 65%;
          opacity: 0.07;
          animation-duration: 30s;
          animation-delay: -8s;
        }

        .blob-3 {
          width: 400px;
          height: 400px;
          background: #FF5A87;
          top: 75%;
          left: 5%;
          opacity: 0.06;
          animation-duration: 35s;
          animation-delay: -16s;
        }

        .custom-cursor {
          position: fixed;
          background: #00E5A0;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 16px #00E5A0, 0 0 40px rgba(0, 229, 160, 0.25);
          mix-blend-mode: screen;
          transition: width 0.15s, height 0.15s;
        }

        .cursor-ring {
          position: fixed;
          border: 1px solid rgba(107, 77, 255, 0.35);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          transition: width 0.25s, height 0.25s;
        }

        .dot-pulse {
          animation: blink 2s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(125deg, #00E5A0 0%, #9B7DFF 50%, #00C8FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200%;
          animation: shiftGrd 5s ease-in-out infinite alternate;
        }

        .pillar-border {
          width: 0;
          height: 1px;
          position: absolute;
          top: 0;
          left: 0;
          background: #00E5A0;
          transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .pillar:hover .pillar-border {
          width: 100%;
        }

        .pillar:hover {
          background: #0C0C1C;
        }

        .spec-item:hover {
          background: #0C0C1C;
        }

        .spec-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, #6B4DFF, transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .spec-item:hover::before {
          opacity: 1;
        }

        .btn-primary {
          background: #00E5A0;
          color: #02020A;
          border: none;
          padding: 0.9rem 2.4rem;
          font-family: 'Unbounded', sans-serif;
          font-weight: 700;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: none;
          position: relative;
          overflow: hidden;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
          transition: box-shadow 0.3s;
        }

        .btn-primary:hover {
          box-shadow: 0 0 40px rgba(0, 229, 160, 0.4);
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }

        .btn-primary:hover::after {
          transform: translateX(100%);
        }

        .btn-ghost {
          background: transparent;
          color: #606080;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.9rem 2rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          cursor: none;
          transition: border-color 0.3s, color 0.3s;
        }

        .btn-ghost:hover {
          border-color: #6B4DFF;
          color: #fff;
        }

        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Aurora blobs */}
      <div className="aurora-blob blob-1"></div>
      <div className="aurora-blob blob-2"></div>
      <div className="aurora-blob blob-3"></div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Custom cursor */}
      <div
        className="custom-cursor"
        style={{ width: cursorSize.width, height: cursorSize.height, left: cursor.x, top: cursor.y }}
      />
      <div
        className="cursor-ring"
        style={{
          width: cursorSize.ringWidth,
          height: cursorSize.ringHeight,
          left: cursor.x,
          top: cursor.y,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-100 flex justify-between items-center px-16 py-7">
        <div className="font-bold text-lg tracking-tighter text-white" style={{ fontFamily: "'Unbounded', sans-serif" }}>
          ECH<span className="text-[#00E5A0]">O</span>
        </div>
        <ul className="flex gap-10 list-none text-xs tracking-widest text-[#606080] uppercase">
          <li>
            <a href="#pillars" className="hover:text-white transition-colors">
              Architecture
            </a>
          </li>
          <li>
            <a href="#manifesto" className="hover:text-white transition-colors">
              Manifesto
            </a>
          </li>
          <li>
            <a href="#specs" className="hover:text-white transition-colors">
              Specification
            </a>
          </li>
        </ul>
        <div className="text-xs text-[#00E5A0] border border-[rgba(0,229,160,0.25)] rounded-full px-4 py-1 tracking-wider">
          ALPHA · v0.∞
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative z-1 min-h-screen flex flex-col justify-center px-16 pt-20">
        <p className="anim-fade-up delay-1 text-xs tracking-widest text-[#606080] uppercase flex items-center gap-4 mb-9">
          <span className="block w-10 h-px bg-[#00E5A0]"></span>
          Post-Dimensional Interface Paradigm
        </p>

        <h1
          className="anim-fade-up delay-2 font-black text-[clamp(5.5rem,15vw,15rem)] leading-[0.88] tracking-tight text-white mb-4"
          style={{ fontFamily: "'Unbounded', sans-serif" }}
        >
          ECHO
          <div className="gradient-text">BEYOND</div>
        </h1>

        <p
          className="anim-fade-up delay-3 font-light text-[clamp(0.85rem,1.6vw,1.4rem)] text-[#606080] tracking-tight leading-relaxed max-w-lg mb-14"
          style={{ fontFamily: "'Unbounded', sans-serif" }}
        >
          The first interface that thinks before you do. No UI. No friction. Just intention made real.
        </p>

        <div className="anim-fade-up delay-4 flex gap-6 items-center mb-12">
          <button
            className="btn-primary"
            onMouseEnter={() => handleElementHover(true)}
            onMouseLeave={() => handleElementHover(false)}
          >
            Request Access
          </button>
          <button
            className="btn-ghost"
            onMouseEnter={() => handleElementHover(true)}
            onMouseLeave={() => handleElementHover(false)}
          >
            Read Manifesto →
          </button>
        </div>

        <div
          className="anim-fade-up delay-3 text-xs text-[#606080] tracking-widest font-mono min-h-5 mt-6"
          dangerouslySetInnerHTML={{ __html: scrambledText }}
        ></div>

        <div className="absolute bottom-12 right-16 flex flex-col items-end gap-2 anim-fade-up delay-5">
          <div className="text-xs text-[#606080] tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] dot-pulse"></span>
            CONSCIOUSNESS LAYER ACTIVE
          </div>
          <div className="text-xs text-[#606080] tracking-widest opacity-35">37,421 MINDS IN RESONANCE</div>
          <div className="text-xs text-[#606080] tracking-widest opacity-20">TEMPORAL DRIFT: +0.003ms</div>
        </div>

        <div className="absolute bottom-16 left-16 text-xs text-[#606080] tracking-widest writing-mode-vertical flex items-center gap-5 anim-fade-up delay-5">
          <div>SCROLL</div>
          <div className="w-px h-14 bg-gradient-to-b from-[#606080] to-transparent"></div>
        </div>
      </section>

      {/* Pillars Section */}
      <section
        id="pillars"
        className="grid grid-cols-3 gap-px bg-[rgba(107,77,255,0.14)] relative z-1"
        style={{ backgroundImage: 'repeating-linear-gradient(to right, rgba(107,77,255,0.14) 0px, rgba(107,77,255,0.14) 1px, transparent 1px, transparent 100%)' }}
      >
        <div className="absolute -top-1 left-16 text-xs text-[#606080] tracking-widest bg-[#02020A] px-4 z-10">
          [ CORE ARCHITECTURE ]
        </div>

        {[
          {
            num: '01 / COGNITION',
            title: 'Pre-Cognitive Field',
            desc: 'ECHO models your decision topology in real-time, surfacing actions 200ms before conscious awareness. The interface dissolves. Intent becomes reality.',
            tag: 'Temporal Prediction Engine',
            delay: '0s',
          },
          {
            num: '02 / MEMORY',
            title: 'Scar Architecture',
            desc: 'Every interaction leaves a permanent memory trace — a "scar" in the UI fabric. Your cognitive topology evolves, reshaping future layouts to match your unique pattern.',
            tag: 'Persistent Memory Lattice',
            delay: '0.12s',
          },
          {
            num: '03 / RESONANCE',
            title: 'Collective Resonance',
            desc: 'Anonymous intent patterns from millions of minds continuously reshape the gravitational field of your personal space. Singular. Yet plural. Zero identity exposed.',
            tag: 'Hive Topology / Zero-Identity',
            delay: '0.24s',
          },
        ].map((pillar, idx) => (
          <div
            key={idx}
            className="pillar bg-[#02020A] p-14 relative overflow-hidden hover:bg-[#0C0C1C] transition-all duration-500 reveal"
            style={{ transitionDelay: pillar.delay }}
            data-reveal={`pillar-${idx}`}
            onMouseEnter={() => handleElementHover(true)}
            onMouseLeave={() => handleElementHover(false)}
          >
            <div className="pillar-border"></div>
            <div
              className="absolute inset-0 bg-gradient-to-b from-[rgba(0,229,160,0.04)] to-transparent opacity-0 transition-opacity duration-500"
              style={{ pointerEvents: 'none' }}
            ></div>

            <div className="text-xs text-[#606080] tracking-widest mb-8 relative z-1">{pillar.num}</div>

            <h3
              className="text-xl font-bold text-white tracking-tight leading-snug mb-4 relative z-1 transition-all duration-500"
              style={{ fontFamily: "'Unbounded', sans-serif" }}
            >
              {pillar.title}
            </h3>

            <p className="text-sm text-[#606080] leading-relaxed relative z-1 mb-8">{pillar.desc}</p>

            <span className="inline-block text-xs tracking-widest uppercase px-3 py-1 border border-[rgba(107,77,255,0.14)] rounded-full bg-[rgba(107,77,255,0.06)] text-[#9B7DFF] relative z-1">
              {pillar.tag}
            </span>
          </div>
        ))}
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="relative z-1 py-44 px-16 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-radial from-[rgba(107,77,255,0.07)] to-transparent pointer-events-none"></div>

        <p className="text-xs text-[#00E5A0] tracking-widest uppercase mb-12 relative z-1">The Manifesto</p>

        <h2
          className="font-black text-[clamp(2rem,5.5vw,5.5rem)] leading-tight tracking-tight text-white max-w-3xl relative z-1 reveal"
          style={{ fontFamily: "'Unbounded', sans-serif" }}
          data-reveal="manifesto"
        >
          The best interface <br />
          is <span className="bg-gradient-to-r from-[#FF5A87] to-[#9B7DFF] bg-clip-text text-transparent">no interface.</span>
          <br />
          The next is one that <br />
          reads your <span className="bg-gradient-to-r from-[#FF5A87] to-[#9B7DFF] bg-clip-text text-transparent">mind.</span>
        </h2>

        <p
          className="text-sm text-[#606080] max-w-md leading-relaxed mt-14 relative z-1 reveal"
          style={{ transitionDelay: '0.18s' }}
          data-reveal="manifesto-sub"
        >
          We didn't build a better button. We dissolved the concept of interaction itself. ECHO is not a tool — it is an extension of cognition, woven into the fabric of your digital existence.
        </p>
      </section>

      {/* Divider */}
      <div className="relative z-1 bg-[rgba(107,77,255,0.14)] h-px">
        <span className="absolute -top-3 left-16 text-xs text-[#606080] tracking-widest bg-[#02020A] px-4">
          [ TECHNICAL SPECIFICATION ]
        </span>
      </div>

      {/* Specs */}
      <section
        id="specs"
        className="relative z-1 px-16 py-24"
        data-reveal="specs"
      >
        <div className="flex justify-between items-end mb-16">
          <h2
            className="text-5xl font-bold leading-tight tracking-tight reveal"
            style={{ fontFamily: "'Unbounded', sans-serif" }}
            data-reveal="specs-title"
          >
            System<br />Parameters
          </h2>
          <p className="text-sm text-[#606080] max-w-xs leading-relaxed text-right reveal" style={{ transitionDelay: '0.15s' }} data-reveal="specs-note">
            All figures represent theoretical performance bounds under controlled cognitive resonance conditions. Actual emergence may vary.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-px bg-[rgba(107,77,255,0.14)]">
          {[
            { value: `${count200}`, suffix: 'ms', label: 'Pre-Cognition Window', desc: 'Average lead time before conscious awareness of desired action', color: 'g', delay: '0s' },
            { value: `${count37}`, suffix: 'M+', label: 'Resonant Nodes', desc: 'Active minds contributing to collective topology in real-time', color: '', delay: '0.08s' },
            { value: '∞', suffix: '', label: 'Memory Depth', desc: 'Non-destructive scar accumulation with infinite history traversal', color: 'g', delay: '0.16s' },
            { value: '0', suffix: '', label: 'Identity Exposure', desc: 'Zero-knowledge resonance contribution. Your patterns, not your person.', color: 'r', delay: '0.24s' },
            { value: '4D', suffix: '', label: 'Spatial Model', desc: 'Three spatial axes plus temporal depth — each element exists across time', color: 'g', delay: '0.32s' },
            { value: '~0', suffix: '', label: 'Cognitive Load', desc: 'Asymptotically approaching frictionless interaction at scale', color: '', delay: '0.4s' },
            { value: `${count1b}`, suffix: 'B+', label: 'Topology Variations', desc: 'Possible UI emergence configurations per user per session', color: 'r', delay: '0.48s' },
            { value: 'v0.∞', suffix: '', label: 'Build Version', desc: 'A product without a final state. Perpetually becoming. Never shipped.', color: '', delay: '0.56s' },
          ].map((spec, idx) => (
            <div
              key={idx}
              className="spec-item bg-[#02020A] p-10 relative overflow-hidden hover:bg-[#0C0C1C] transition-all duration-500 reveal"
              style={{ transitionDelay: spec.delay }}
              data-reveal={`spec-${idx}`}
              onMouseEnter={() => handleElementHover(true)}
              onMouseLeave={() => handleElementHover(false)}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#6B4DFF] to-transparent opacity-0 transition-opacity duration-500"></div>

              <div
                className={`font-black text-4xl leading-tight tracking-tight transition-filter duration-300 ${
                  spec.color === 'g'
                    ? 'bg-gradient-to-br from-[#00E5A0] to-[#00C8FF] bg-clip-text text-transparent'
                    : spec.color === 'r'
                    ? 'bg-gradient-to-br from-[#FF5A87] to-[#9B7DFF] bg-clip-text text-transparent'
                    : 'bg-gradient-to-br from-white to-[#606080] bg-clip-text text-transparent'
                }`}
                style={{ fontFamily: "'Unbounded', sans-serif" }}
              >
                {spec.value}
                <span className="text-lg">{spec.suffix}</span>
              </div>

              <div className="text-xs text-[#606080] tracking-widest uppercase mt-1">{spec.label}</div>
              <p className="text-xs text-[#606080] mt-4 leading-relaxed opacity-65">{spec.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative z-1 py-44 px-16 flex flex-col items-center text-center">
        <div className="absolute w-96 h-96 bg-gradient-radial from-[rgba(107,77,255,0.1)] to-transparent rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <p className="text-xs text-[#00E5A0] tracking-widest uppercase mb-8 relative z-1">Join the Emergence</p>

        <h2
          className="font-black text-[clamp(3rem,7vw,7.5rem)] tracking-tight text-white leading-tight mb-8 relative z-1 reveal"
          style={{ fontFamily: "'Unbounded', sans-serif" }}
          data-reveal="cta-title"
        >
          The future<br />doesn't wait.
        </h2>

        <p className="text-sm text-[#606080] max-w-sm leading-relaxed mb-14 relative z-1 reveal" style={{ transitionDelay: '0.15s' }} data-reveal="cta-body">
          Access is granted in waves based on cognitive compatibility. Add your mind to the waiting topology.
        </p>

        <div className="flex gap-6 items-center relative z-1 reveal" style={{ transitionDelay: '0.3s' }} data-reveal="cta-actions">
          <button
            className="btn-primary"
            onMouseEnter={() => handleElementHover(true)}
            onMouseLeave={() => handleElementHover(false)}
          >
            Submit Your Mind
          </button>
          <button
            className="btn-ghost"
            onMouseEnter={() => handleElementHover(true)}
            onMouseLeave={() => handleElementHover(false)}
          >
            Why ECHO? ↗
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-1 border-t border-[rgba(107,77,255,0.14)] px-16 py-8 flex justify-between items-center">
        <div className="text-xs text-[#606080] tracking-wider leading-relaxed">
          ECHO / POST-DIMENSIONAL INTERFACE PARADIGM
          <br />
          <span className="opacity-40">© 2026 — BEYOND CORPORATION. REALITY RESERVED.</span>
        </div>
        <div className="text-xs text-[#606080] tracking-wider leading-relaxed text-right">
          SYSTEM STATUS: <span className="text-[#00E5A0]">RESONANT</span>
          <br />
          <span className="opacity-40">NODE CLUSTER: EARTH-PRIME / SECTOR 7</span>
        </div>
      </footer>
    </div>
  );
};

export default EchoApp;