import { useState, useEffect, useRef, useCallback } from "react";

const LANG = typeof navigator !== "undefined"
  ? (navigator.language?.startsWith("nl") ? "nl" : "en")
  : "en";

const T = {
  en: {
    appName: "MycoTimer", tagline: "Mushroom Colonization Calculator",
    badge: "For the 1% who grow their own fungi",
    step1: "01 — Choose your species", step2: "02 — Set your conditions",
    spawnRate: "Spawn Rate", spawnHint: "% of dry substrate weight",
    temperature: "Temperature (°C)", substrateWeight: "Substrate dry weight (g)",
    calculate: "Calculate Timeline", results: "03 — Your Growth Timeline",
    colonization: "Full Colonization", pinning: "Pins Appear", harvest: "First Harvest",
    yieldLabel: "Est. yield", today: "Today",
    tempWarn: "Outside optimal range — slower growth expected",
    tempGood: "Optimal temperature range", optimal: "Optimal",
    reset: "New Calculation", days: "days", grams: "g",
    efficiency: "Growth Efficiency", totalDays: "Total days to harvest",
    tip: "Pro tip", tips: {
      pearl_oyster: "Maintain >85% humidity after colonization. Mist the walls, never the block.",
      pink_oyster: "Keep it warm! This tropical species hates temperatures below 20°C.",
      lions_mane: "Avoid contamination triggers — no direct light during colonization.",
      shiitake: "Cold-shock the bag after colonization to trigger pinning. 4°C for 12 hours.",
      reishi: "Harvest before the white pore surface darkens. Dry immediately.",
      chestnut: "Prolific producer — expect 3–4 flushes from a well-managed block.",
    },
  },
  nl: {
    appName: "MycoTimer", tagline: "Paddenstoel Kolonisatie Rekentool",
    badge: "Voor de 1% die eigen fungi kweken",
    step1: "01 — Kies je soort", step2: "02 — Stel condities in",
    spawnRate: "Spawn Ratio", spawnHint: "% van droog substraatgewicht",
    temperature: "Temperatuur (°C)", substrateWeight: "Substraat drooggewicht (g)",
    calculate: "Bereken Tijdlijn", results: "03 — Jouw Groeitijdlijn",
    colonization: "Volledig gekoloniseerd", pinning: "Pins verschijnen", harvest: "Eerste oogst",
    yieldLabel: "Verwachte opbrengst", today: "Vandaag",
    tempWarn: "Buiten optimaal bereik — verwacht langzamere groei",
    tempGood: "Optimale temperatuurrange", optimal: "Optimaal",
    reset: "Nieuwe berekening", days: "dagen", grams: "g",
    efficiency: "Groei-efficiëntie", totalDays: "Totaal dagen tot oogst",
    tip: "Pro tip", tips: {
      pearl_oyster: "Houd >85% luchtvochtigheid na kolonisatie. Sproei de wanden, nooit het blok.",
      pink_oyster: "Houd het warm! Deze tropische soort haat temperaturen onder 20°C.",
      lions_mane: "Vermijd contamtinatietriggers — geen direct licht tijdens kolonisatie.",
      shiitake: "Koud-schok de zak na kolonisatie om pinvorming te triggeren. 4°C gedurende 12 uur.",
      reishi: "Oogst voordat het witte poriënoppervlak donker wordt. Droog direct.",
      chestnut: "Productieve soort — verwacht 3-4 flushes van een goed beheerd blok.",
    },
  },
};

const SPECIES = [
  { id: "pearl_oyster",  icon: "🦪", en: "Pearl Oyster",   nl: "Parel Oesterzwam", colonize: [14,21], pin: [3,7],   flush: [5,10],  temp:{min:18,max:24}, yield:{min:15,max:25}, color:"#00e5a0", glow:"rgba(0,229,160,0.3)",  desc:{en:"Fast · Beginner-friendly",    nl:"Snel · Geschikt voor beginners"} },
  { id: "pink_oyster",   icon: "🌸", en: "Pink Oyster",    nl: "Roze Oesterzwam",  colonize: [10,16], pin: [3,5],   flush: [4,8],   temp:{min:24,max:30}, yield:{min:10,max:20}, color:"#ff82b3", glow:"rgba(255,130,179,0.3)", desc:{en:"Tropical · Very fast",         nl:"Tropisch · Zeer snel"} },
  { id: "lions_mane",    icon: "🦁", en: "Lion's Mane",    nl: "Pruikzwam",        colonize: [14,21], pin: [5,10],  flush: [5,10],  temp:{min:18,max:22}, yield:{min:10,max:15}, color:"#f7d070", glow:"rgba(247,208,112,0.3)", desc:{en:"Medicinal · Brain health",     nl:"Medicinaal · Hersenhealth"} },
  { id: "shiitake",      icon: "🍄", en: "Shiitake",       nl: "Shiitake",         colonize: [40,70], pin: [7,14],  flush: [7,14],  temp:{min:10,max:18}, yield:{min:10,max:20}, color:"#c88c50", glow:"rgba(200,140,80,0.3)",  desc:{en:"Gourmet · Slow & rewarding",  nl:"Gastronomisch · Langzaam"} },
  { id: "reishi",        icon: "🎋", en: "Reishi",         nl: "Reishi",           colonize: [30,60], pin: [10,20], flush: [14,28], temp:{min:24,max:28}, yield:{min:5,max:10},  color:"#e06060", glow:"rgba(224,96,96,0.3)",   desc:{en:"Medicinal · Very patient",    nl:"Medicinaal · Veel geduld"} },
  { id: "chestnut",      icon: "🌰", en: "Chestnut",       nl: "Kastanjecap",      colonize: [14,28], pin: [5,10],  flush: [5,10],  temp:{min:16,max:22}, yield:{min:15,max:25}, color:"#b07840", glow:"rgba(176,120,64,0.3)",  desc:{en:"Nutty · Prolific producer",   nl:"Nootachtig · Erg productief"} },
];

const avg = a => (a[0] + a[1]) / 2;

function calcTimeline(sp, spawnRate, temp, sub) {
  const mid = (sp.temp.min + sp.temp.max) / 2;
  const halfRange = (sp.temp.max - sp.temp.min) / 2;
  const dist = Math.abs(temp - mid);
  const tf = dist <= halfRange ? 1.0 : Math.max(0.35, 1.0 - (dist - halfRange) * 0.1);
  const sf = Math.min(1.45, 0.72 + (spawnRate / 10) * 0.13);
  const total = tf * sf;
  const cd = Math.round(avg(sp.colonize) / total);
  const pd = Math.round(cd + avg(sp.pin));
  const hd = Math.round(pd + avg(sp.flush));
  const yg = Math.round(sub * avg(sp.yield) / 100);
  return { cd, pd, hd, yg, efficiency: Math.min(100, Math.round(total * 100)), isOptimal: tf > 0.88 };
}

function addDaysLabel(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString(LANG === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "short" });
}

function MyceliumBg() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, nodes = [], t = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const n = Math.min(55, Math.floor(canvas.width * canvas.height / 16000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.4, pulse: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    const tick = () => {
      t += 0.007; ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.012;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 130) {
            const a = (1 - d / 130) * 0.07;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            const cx = (nodes[i].x+nodes[j].x)/2 + Math.sin(t+i)*6;
            const cy = (nodes[i].y+nodes[j].y)/2 + Math.cos(t+j)*6;
            ctx.quadraticCurveTo(cx, cy, nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0,210,140,${a})`;
            ctx.lineWidth = 0.55; ctx.stroke();
          }
        }
        const p = (Math.sin(nodes[i].pulse)+1)/2;
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r+p*0.8, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0,210,140,${0.12+p*0.22})`; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, width:"100%", height:"100%", zIndex:0, pointerEvents:"none" }} />;
}

function SpeciesCard({ sp, selected, onSelect, index }) {
  const [hovered, setHovered] = useState(false);
  const active = selected === sp.id;
  return (
    <button
      onClick={() => onSelect(sp.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6,
        padding: "16px 14px", borderRadius: 20, border: `1.5px solid`,
        borderColor: active ? sp.color : hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
        background: active
          ? `linear-gradient(135deg, ${sp.glow} 0%, rgba(8,20,14,0.9) 100%)`
          : hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        boxShadow: active ? `0 0 28px ${sp.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : "none",
        transform: active ? "scale(1.02)" : hovered ? "scale(1.01)" : "scale(1)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        animation: `fadeSlideUp 0.45s cubic-bezier(0.34,1.2,0.64,1) both`,
        animationDelay: `${index * 0.06}s`,
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{sp.icon}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: active ? sp.color : "#c8e8d4", fontFamily:"'Syne', sans-serif", lineHeight:1.2 }}>
        {LANG === "nl" ? sp.nl : sp.en}
      </span>
      <span style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)", letterSpacing:"0.02em" }}>
        {LANG === "nl" ? sp.desc.nl : sp.desc.en}
      </span>
      <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
        <span style={{ fontSize:10, color: sp.color, opacity:0.8 }}>⌀ {Math.round(avg(sp.colonize))} d</span>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{sp.temp.min}–{sp.temp.max}°C</span>
      </div>
    </button>
  );
}

function Slider({ label, hint, value, min, max, step, unit, onChange, accentColor="#00e5a0" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <label style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.55)", letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" }}>
          {label}
        </label>
        <span style={{ fontSize:22, fontWeight:700, color: accentColor, fontFamily:"'Syne',sans-serif", transition:"color 0.3s" }}>
          {value}<span style={{ fontSize:13, fontWeight:400, marginLeft:2, color:"rgba(255,255,255,0.4)" }}>{unit}</span>
        </span>
      </div>
      {hint && <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"0.02em" }}>{hint}</p>}
      <div style={{ position:"relative", height:32, display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", left:0, right:0, height:4, borderRadius:2, background:"rgba(255,255,255,0.08)" }} />
        <div style={{ position:"absolute", left:0, width:`${pct}%`, height:4, borderRadius:2, background:`linear-gradient(90deg, rgba(0,229,160,0.4), ${accentColor})`, transition:"width 0.1s" }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position:"absolute", left:0, right:0, width:"100%", height:"100%",
            appearance:"none", background:"transparent", cursor:"pointer", outline:"none", margin:0,
          }}
        />
      </div>
    </div>
  );
}

function TimelineBar({ result, sp }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const id = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(id); }, [result]);

  const milestones = [
    { label: T[LANG].today,        day: 0,        color:"rgba(255,255,255,0.5)", icon:"◎", date: addDaysLabel(0) },
    { label: T[LANG].colonization, day: result.cd, color: sp.color, icon:"✦", date: addDaysLabel(result.cd) },
    { label: T[LANG].pinning,      day: result.pd, color:"#7dd4fc", icon:"✦", date: addDaysLabel(result.pd) },
    { label: T[LANG].harvest,      day: result.hd, color:"#86efac", icon:"★", date: addDaysLabel(result.hd) },
  ];
  const total = result.hd;

  return (
    <div style={{ position:"relative", padding:"24px 0 8px" }}>
      <div style={{ position:"relative", height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, margin:"0 0 32px" }}>
        {[
          { from: 0, to: result.cd / total, color: sp.color },
          { from: result.cd / total, to: result.pd / total, color:"#7dd4fc" },
          { from: result.pd / total, to: 1, color:"#86efac" },
        ].map((seg, i) => (
          <div key={i} style={{
            position:"absolute", top:0, height:"100%", borderRadius:3,
            left:`${seg.from * 100}%`,
            width: animated ? `${(seg.to - seg.from) * 100}%` : "0%",
            background: seg.color, opacity:0.7,
            transition: `width 0.9s cubic-bezier(0.25,1,0.5,1) ${i*0.18}s`,
          }} />
        ))}
        {milestones.map((m, i) => {
          const pct = (m.day / total) * 100;
          return (
            <div key={i} style={{
              position:"absolute", top:"50%", left:`${pct}%`,
              transform:"translate(-50%,-50%)",
              width:14, height:14, borderRadius:"50%",
              background: m.color === "rgba(255,255,255,0.5)" ? "#1a2e22" : "#080f0c",
              border:`2px solid ${m.color}`,
              boxShadow: `0 0 12px ${m.color}`,
              transition:`box-shadow 0.4s ${i*0.18}s`,
              zIndex:2,
            }} />
          );
        })}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
        {milestones.map((m, i) => (
          <div key={i} style={{
            display:"flex", flexDirection:"column", gap:4, alignItems: i===0?"flex-start": i===3?"flex-end":"center",
            animation:`fadeSlideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) both`,
            animationDelay: `${0.3 + i*0.12}s`,
          }}>
            <span style={{ fontSize:10, fontWeight:600, color:m.color, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Syne',sans-serif" }}>
              {m.label}
            </span>
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", fontFamily:"'Syne',sans-serif" }}>
              {m.day === 0 ? m.date : `+${m.day}d`}
            </span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{m.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color, delay=0 }) {
  return (
    <div style={{
      padding:"16px 20px", borderRadius:16,
      background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
      animation:`fadeSlideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) both`,
      animationDelay:`${delay}s`,
    }}>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
        <span style={{ fontSize:28, fontWeight:700, color: color || "#00e5a0", fontFamily:"'Syne',sans-serif" }}>{value}</span>
        {unit && <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [spawnRate, setSpawnRate] = useState(15);
  const [temperature, setTemperature] = useState(21);
  const [substrate, setSubstrate] = useState(1000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef(null);

  const sp = SPECIES.find(s => s.id === selectedId);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #060d09; }
      @keyframes fadeSlideUp {
        from { opacity:0; transform:translateY(18px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      @keyframes spin { to{transform:rotate(360deg)} }
      @keyframes shimmer {
        0%{background-position:200% 0}
        100%{background-position:-200% 0}
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
        background:#00e5a0; border:2px solid rgba(0,229,160,0.4);
        box-shadow:0 0 16px rgba(0,229,160,0.6); cursor:pointer;
        transition:box-shadow 0.2s, transform 0.15s;
      }
      input[type=range]::-webkit-slider-thumb:hover {
        box-shadow:0 0 24px rgba(0,229,160,0.9); transform:scale(1.1);
      }
      input[type=range]::-moz-range-thumb {
        width:20px; height:20px; border-radius:50%;
        background:#00e5a0; border:2px solid rgba(0,229,160,0.4);
        box-shadow:0 0 16px rgba(0,229,160,0.6); cursor:pointer;
      }
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(0,229,160,0.2);border-radius:2px}
      .calc-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }
      .calc-btn:hover:not(:disabled) { transform: scale(1.02) !important; box-shadow: 0 8px 40px rgba(0,229,160,0.4) !important; }
      .calc-btn:active:not(:disabled) { transform: scale(0.97) !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleCalculate = useCallback(() => {
    if (!sp) return;
    setLoading(true);
    setTimeout(() => {
      setResult(calcTimeline(sp, spawnRate, temperature, substrate));
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    }, 700);
  }, [sp, spawnRate, temperature, substrate]);

  const tempInRange = sp && temperature >= sp.temp.min && temperature <= sp.temp.max;

  return (
    <div style={{ minHeight:"100vh", background:"#060d09", fontFamily:"'DM Sans', sans-serif", color:"#d4ede0", position:"relative" }}>
      <MyceliumBg />

      <div style={{ position:"relative", zIndex:1, maxWidth:820, margin:"0 auto", padding:"0 20px 80px" }}>

        {/* Header */}
        <header style={{ padding:"48px 0 40px", animation:"fadeSlideUp 0.6s cubic-bezier(0.34,1.2,0.64,1) both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{
              padding:"4px 12px", borderRadius:100,
              background:"rgba(0,229,160,0.08)", border:"1px solid rgba(0,229,160,0.2)",
              fontSize:11, fontWeight:500, color:"rgba(0,229,160,0.8)", letterSpacing:"0.08em", textTransform:"uppercase",
            }}>🍄 {T[LANG].badge}</div>
          </div>
          <h1 style={{ fontSize:"clamp(38px,7vw,72px)", fontWeight:800, fontFamily:"'Syne',sans-serif", lineHeight:0.95, letterSpacing:"-0.03em", color:"#f0fff8" }}>
            {T[LANG].appName}
          </h1>
          <p style={{ fontSize:16, color:"rgba(255,255,255,0.45)", marginTop:10, fontWeight:300 }}>{T[LANG].tagline}</p>
        </header>

        {/* Step 1: Species */}
        <section style={{ marginBottom:40 }}>
          <h2 style={{
            fontSize:12, fontWeight:600, fontFamily:"'Syne',sans-serif",
            color:"rgba(0,229,160,0.7)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:16,
          }}>{T[LANG].step1}</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
            {SPECIES.map((s, i) => (
              <SpeciesCard key={s.id} sp={s} selected={selectedId} onSelect={setSelectedId} index={i} />
            ))}
          </div>
        </section>

        {/* Step 2: Conditions */}
        <section style={{
          padding:"28px 28px 32px", borderRadius:24,
          background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
          marginBottom:28, backdropFilter:"blur(12px)",
          animation:"fadeSlideUp 0.6s cubic-bezier(0.34,1.2,0.64,1) 0.2s both",
        }}>
          <h2 style={{
            fontSize:12, fontWeight:600, fontFamily:"'Syne',sans-serif",
            color:"rgba(0,229,160,0.7)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:28,
          }}>{T[LANG].step2}</h2>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:32 }}>
            <Slider
              label={T[LANG].spawnRate} hint={T[LANG].spawnHint}
              value={spawnRate} min={5} max={30} step={1} unit="%"
              onChange={setSpawnRate}
            />
            <Slider
              label={T[LANG].temperature}
              value={temperature} min={5} max={35} step={1} unit="°C"
              onChange={setTemperature}
              accentColor={sp ? (tempInRange ? sp.color : "#ff8c70") : "#00e5a0"}
            />
            <Slider
              label={T[LANG].substrateWeight}
              value={substrate} min={100} max={5000} step={50} unit="g"
              onChange={setSubstrate}
            />
          </div>

          {sp && (
            <div style={{
              marginTop:20, padding:"10px 16px", borderRadius:12,
              background: tempInRange ? "rgba(0,229,160,0.06)" : "rgba(255,140,112,0.08)",
              border: `1px solid ${tempInRange ? "rgba(0,229,160,0.2)" : "rgba(255,140,112,0.25)"}`,
              display:"flex", alignItems:"center", gap:10, transition:"all 0.3s",
            }}>
              <span style={{ fontSize:16 }}>{tempInRange ? "✓" : "⚠"}</span>
              <span style={{ fontSize:13, color: tempInRange ? "rgba(0,229,160,0.85)" : "#ff9f88" }}>
                {tempInRange ? T[LANG].tempGood : T[LANG].tempWarn}
                {" "}<span style={{ opacity:0.6 }}>({T[LANG].optimal}: {sp.temp.min}–{sp.temp.max}°C)</span>
              </span>
            </div>
          )}
        </section>

        {/* Calculate button */}
        <button
          className="calc-btn"
          onClick={handleCalculate}
          disabled={!selectedId || loading}
          style={{
            width:"100%", padding:"18px 32px", borderRadius:20, border:"none",
            background: selectedId
              ? (sp ? `linear-gradient(135deg, ${sp.color}22 0%, rgba(0,229,160,0.12) 100%)` : "rgba(0,229,160,0.12)")
              : "rgba(255,255,255,0.04)",
            color: selectedId ? (sp?.color || "#00e5a0") : "rgba(255,255,255,0.25)",
            fontSize:16, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:"0.04em",
            cursor: selectedId ? "pointer" : "not-allowed",
            boxShadow: selectedId ? `0 4px 24px ${sp?.glow || "rgba(0,229,160,0.2)"}` : "none",
            border: `1.5px solid ${selectedId ? (sp?.color || "#00e5a0") + "44" : "rgba(255,255,255,0.06)"}`,
            transition:"all 0.25s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:12,
            animation:"fadeSlideUp 0.6s cubic-bezier(0.34,1.2,0.64,1) 0.3s both",
          }}
        >
          {loading
            ? <><span style={{ display:"inline-block", width:18, height:18, borderRadius:"50%", border:"2px solid currentColor", borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} /> {LANG==="nl"?"Berekenen...":"Calculating..."}</>
            : <>{selectedId ? sp.icon : "🍄"} {T[LANG].calculate}</>
          }
        </button>

        {/* Results */}
        {result && sp && !loading && (
          <div ref={resultsRef} style={{ marginTop:40 }}>
            <h2 style={{
              fontSize:12, fontWeight:600, fontFamily:"'Syne',sans-serif",
              color:"rgba(0,229,160,0.7)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:24,
              animation:"fadeSlideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) both",
            }}>{T[LANG].results}</h2>

            {/* Main timeline card */}
            <div style={{
              padding:"28px 28px 24px", borderRadius:24,
              background:"rgba(255,255,255,0.025)", border:`1px solid ${sp.color}30`,
              backdropFilter:"blur(12px)",
              boxShadow:`0 0 60px ${sp.glow}`,
              marginBottom:16, overflow:"hidden",
              animation:"fadeSlideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) 0.05s both",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <span style={{ fontSize:24 }}>{sp.icon}</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.9)", fontFamily:"'Syne',sans-serif" }}>
                    {LANG==="nl" ? sp.nl : sp.en}
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>
                    {spawnRate}% spawn · {temperature}°C · {substrate}g
                  </div>
                </div>
              </div>
              <TimelineBar result={result} sp={sp} />
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:16 }}>
              <StatCard label={T[LANG].totalDays}  value={result.hd}  unit={T[LANG].days}  color={sp.color}   delay={0.15} />
              <StatCard label={T[LANG].yieldLabel}  value={result.yg} unit={T[LANG].grams} color="#86efac"    delay={0.22} />
              <StatCard label={T[LANG].efficiency}  value={result.efficiency} unit="%" color={result.efficiency>80?"#86efac":result.efficiency>60?"#fde68a":"#fca5a5"} delay={0.29} />
            </div>

            {/* Pro tip */}
            <div style={{
              padding:"18px 22px", borderRadius:16,
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
              animation:"fadeSlideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) 0.36s both",
            }}>
              <div style={{ fontSize:11, fontWeight:600, fontFamily:"'Syne',sans-serif", color:"rgba(0,229,160,0.6)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
                💡 {T[LANG].tip}
              </div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>
                {T[LANG].tips[sp.id]}
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setResult(null); setSelectedId(null); window.scrollTo({top:0,behavior:"smooth"}); }}
              style={{
                all:"unset", cursor:"pointer", display:"block", width:"100%", textAlign:"center",
                marginTop:24, padding:"12px", borderRadius:12,
                color:"rgba(255,255,255,0.3)", fontSize:13, fontFamily:"'Syne',sans-serif",
                border:"1px solid rgba(255,255,255,0.06)", transition:"all 0.2s",
                animation:"fadeSlideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) 0.42s both",
              }}
              onMouseEnter={e => { e.target.style.color="rgba(255,255,255,0.6)"; e.target.style.borderColor="rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { e.target.style.color="rgba(255,255,255,0.3)"; e.target.style.borderColor="rgba(255,255,255,0.06)"; }}
            >
              ↑ {T[LANG].reset}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
