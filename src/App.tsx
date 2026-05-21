import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type State = "pre" | "w1" | "mid" | "w2" | "done";

interface Windows {
  wake: number;
  corEnd: number;
  w1s: number;
  w1e: number;
  w2s: number;
  w2e: number;
  cut: number;
  sleep: number;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (min: number): string => {
  const safe = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

const pct = (min: number): string => `${((min / 1440) * 100).toFixed(3)}%`;

const nowMin = (): number => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

const fmtCountdown = (m: number, nl: boolean): string => {
  if (m <= 0) return nl ? "Nu!" : "Now!";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${String(mm).padStart(2, "0")}m` : `${mm}m`;
};

const calcWindows = (wake: number): Windows => ({
  wake,
  corEnd: wake + 90,
  w1s: wake + 90,
  w1e: wake + 120,
  w2s: wake + 7 * 60,
  w2e: wake + 9 * 60,
  cut: wake + 10 * 60,
  sleep: wake + 16 * 60,
});

/* ─────────────────────────────────────────────
   Translations
───────────────────────────────────────────── */
const translations = (nl: boolean) => ({
  headline: nl
    ? ["Drink koffie op het", "juiste moment."]
    : ["Drink coffee at the", "right moment."],
  subtitle: nl
    ? "Op basis van je cortisolcyclus berekenen we je optimale koffievensters voor vandaag — onderbouwd door neurowetenschappen."
    : "Based on your cortisol cycle, we calculate your optimal coffee windows for today — backed by neuroscience.",
  tags: nl
    ? ["☕ Cortisolwetenschap", "⚡ Circadiaans ritme", "🔬 Neurowetenschappen"]
    : ["☕ Cortisol science", "⚡ Circadian rhythm", "🔬 Neuroscience"],
  inputLabel: nl ? "Hoe laat ben je wakker geworden?" : "What time did you wake up?",
  timeSuffix: nl ? "wektijd" : "wake time",
  tlLabel: nl ? "JOUW CAFEÏNEKAART VANDAAG" : "TODAY'S CAFFEINE MAP",
  legend: nl
    ? ["Cortisolpiek (vermijd koffie)", "Venster 1 — ideaal", "Venster 2 — middag", "Afbouwen"]
    : ["Cortisol peak (avoid coffee)", "Window 1 — ideal", "Window 2 — afternoon", "Taper zone"],
  w1Label: nl ? "VENSTER 1" : "WINDOW 1",
  w1Note: nl
    ? "Na de cortisolpiek. Koffie versterkt nu echt de alertheid i.p.v. tolerantie op te bouwen."
    : "After cortisol peaks. Coffee now amplifies alertness instead of building tolerance.",
  w2Label: nl ? "VENSTER 2" : "WINDOW 2",
  w2Note: nl
    ? "Middagdip door adenosine. Tweede kop helpt zonder slaap te verstoren."
    : "Afternoon adenosine dip. A second cup helps without disrupting sleep.",
  cutLabel: nl ? "LAATSTE KOFFIE" : "LAST COFFEE",
  cutNote: nl
    ? "Na dit tijdstip heeft cafeïne nog uren effect — ook al voel je het niet."
    : "After this, caffeine still acts for hours — even if you feel fine.",
  status: {
    pre: nl ? "Cortisolpiek actief — wacht even" : "Cortisol peak active — hold off",
    w1: nl ? "Venster 1 is open ☕" : "Window 1 is open ☕",
    mid: nl ? "Tussenfase — drink water" : "Between windows — drink water",
    w2: nl ? "Venster 2 is open ☕" : "Window 2 is open ☕",
    done: nl ? "Voorbij de koffiedrempel" : "Past the caffeine cutoff",
  } as Record<State, string>,
  cdNext: nl ? "Volgend venster over" : "Next window in",
  cdClose: nl ? "Dit venster sluit over" : "Window closes in",
  science: nl
    ? ["Gebaseerd op circadiaans cortisolonderzoek van ", "Dr. Andrew Huberman", " & ", "Dr. Satchin Panda", ".\nCortisol piekt 30–45 min na het wakker worden — koffie dan bouwt tolerantie op, geen energie.\nCafeïne heeft een halfwaardetijd van ~5–6 uur."]
    : ["Based on circadian cortisol research by ", "Dr. Andrew Huberman", " & ", "Dr. Satchin Panda", ".\nCortisol peaks 30–45 min after waking — coffee then builds tolerance, not energy.\nCaffeine has a half-life of ~5–6 hours."],
});

/* ─────────────────────────────────────────────
   Global CSS (injected once)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Outfit:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #07080f;
  --surface: rgba(255,255,255,0.034);
  --surface-hover: rgba(255,255,255,0.055);
  --border: rgba(255,255,255,0.075);
  --border-strong: rgba(255,255,255,0.14);
  --amber: #F59E0B;
  --amber-soft: #FBBF24;
  --amber-dim: rgba(245,158,11,0.12);
  --amber-glow: rgba(245,158,11,0.28);
  --cyan: #22D3EE;
  --cyan-dim: rgba(34,211,238,0.12);
  --cyan-glow: rgba(34,211,238,0.25);
  --red: #F87171;
  --red-dim: rgba(248,113,113,0.12);
  --green: #34D399;
  --green-dim: rgba(52,211,153,0.12);
  --green-glow: rgba(52,211,153,0.25);
  --text: #F1F5F9;
  --text-muted: rgba(241,245,249,0.48);
  --text-faint: rgba(241,245,249,0.22);
  --grid: rgba(255,255,255,0.025);
  --font-display: 'Syne', sans-serif;
  --font-body: 'Outfit', sans-serif;
}

html, body, #root {
  height: 100%;
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* Orbs */
.cs-orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
}
.cs-orb-1 {
  width: 320px; height: 320px;
  background: rgba(245,158,11,0.06);
  top: -80px; left: -80px;
  animation: orbFloat 12s ease-in-out infinite;
}
.cs-orb-2 {
  width: 240px; height: 240px;
  background: rgba(34,211,238,0.05);
  bottom: 10%; right: -60px;
  animation: orbFloat 12s ease-in-out infinite;
  animation-delay: -6s;
}
@keyframes orbFloat {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(20px,30px) scale(1.1); }
}

/* Particles */
.cs-particle {
  position: fixed;
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  animation: particleFloat linear infinite;
}
@keyframes particleFloat {
  0%   { transform: translateY(100vh) translateX(0); opacity: 0; }
  8%   { opacity: 0.5; }
  92%  { opacity: 0.5; }
  100% { transform: translateY(-40px) translateX(var(--dx)); opacity: 0; }
}

/* Animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes logoGlow {
  0%,100% { box-shadow: 0 0 0 0 var(--amber-glow); }
  50%      { box-shadow: 0 0 18px 2px var(--amber-glow); }
}
@keyframes pulseDot {
  0%,100% { transform: scale(1);   opacity: 1; }
  50%      { transform: scale(1.7); opacity: 0.45; }
}

/* Time input */
input[type='time'].cs-time-input {
  appearance: none;
  background: transparent;
  border: none;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 8vw, 4rem);
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.03em;
  cursor: pointer;
  outline: none;
  transition: color 0.3s;
}
input[type='time'].cs-time-input:focus { color: var(--amber-soft); }
input[type='time'].cs-time-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.25;
  cursor: pointer;
  transition: opacity 0.2s;
}
input[type='time'].cs-time-input:hover::-webkit-calendar-picker-indicator { opacity: 0.5; }

/* Card focus glow */
.cs-input-card:focus-within { border-color: var(--amber-glow) !important; }

/* Window card hover */
.cs-window-card:hover {
  background: var(--surface-hover) !important;
  transform: translateY(-3px);
}
.cs-window-card { transition: transform 0.25s, background 0.25s, border-color 0.25s, box-shadow 0.25s; }
`;

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function PulseDot({ live = false }: { live?: boolean }) {
  return (
    <div
      style={{
        width: 10, height: 10,
        borderRadius: "50%",
        background: "currentColor",
        marginBottom: 12,
        animation: live ? "pulseDot 1.5s ease-in-out infinite" : undefined,
      }}
    />
  );
}

interface TimelineSegProps {
  left: number; right: number; color: string;
}
function TimelineSeg({ left, right, color }: TimelineSegProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0, height: "100%",
        left: pct(Math.max(0, left)),
        width: pct(Math.max(0, Math.min(1440, right) - Math.max(0, left))),
        background: color,
        transition: "left 0.7s cubic-bezier(0.34,1.56,0.64,1), width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Main App
───────────────────────────────────────────── */
export default function App() {
  const isNL = navigator.language.startsWith("nl");
  const T = translations(isNL);

  const [wakeTime, setWakeTime] = useState("07:00");
  const [now, setNow] = useState(nowMin());

  // Inject global CSS + Google Fonts once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);


  useEffect(() => {
    document.title = T.headline.join(' ');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', T.subtitle);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = T.subtitle;
      document.head.appendChild(m);
    }
  }, [T]);

  // Live clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(nowMin()), 30_000);
    return () => clearInterval(id);
  }, []);

  const w = calcWindows(toMin(wakeTime));

  const getState = useCallback((): State => {
    if (now < w.w1s) return "pre";
    if (now <= w.w1e) return "w1";
    if (now < w.w2s) return "mid";
    if (now <= w.w2e) return "w2";
    return "done";
  }, [now, w]);

  const state = getState();

  const badgeStyle: Record<State, { bg: string; border: string; color: string }> = {
    pre:  { bg: "var(--red-dim)",           border: "rgba(248,113,113,0.3)",   color: "var(--red)" },
    w1:   { bg: "var(--green-dim)",          border: "var(--green-glow)",       color: "var(--green)" },
    mid:  { bg: "rgba(100,116,139,0.1)",     border: "rgba(100,116,139,0.2)",   color: "#94A3B8" },
    w2:   { bg: "var(--cyan-dim)",           border: "var(--cyan-glow)",        color: "var(--cyan)" },
    done: { bg: "rgba(100,116,139,0.08)",    border: "rgba(100,116,139,0.15)",  color: "#64748B" },
  };
  const bs = badgeStyle[state];

  const countdownMins = (): number | null => {
    if (state === "pre")  return w.w1s - now;
    if (state === "w1")   return w.w1e - now;
    if (state === "mid")  return w.w2s - now;
    if (state === "w2")   return w.w2e - now;
    return null;
  };
  const cdMins = countdownMins();
  const cdLabel = (state === "w1" || state === "w2") ? T.cdClose : T.cdNext;

  // Particles (generated once)
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 1.5 + 1,
    color: i % 4 === 0 ? "#22D3EE" : "#F59E0B",
    duration: `${Math.random() * 12 + 10}s`,
    delay: `-${Math.random() * 20}s`,
    dx: `${(Math.random() - 0.5) * 120}px`,
  }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParticles = useState(particles)[0];

  /* ── Render ── */
  return (
    <>
      {/* Orbs */}
      <div className="cs-orb cs-orb-1" />
      <div className="cs-orb cs-orb-2" />

      {/* Particles */}
      {stableParticles.map((p) => (
        <div
          key={p.id}
          className="cs-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            ["--dx" as string]: p.dx,
          }}
        />
      ))}

      {/* Main container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 660,
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            animation: "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {/* Logo */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.75rem" }}>
            <div
              style={{
                width: 38, height: 38,
                background: "var(--amber-dim)",
                border: "1px solid var(--amber-glow)",
                borderRadius: 11,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17,
                animation: "logoGlow 3s ease-in-out infinite",
              }}
            >
              ☕
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--amber-soft)" }}>
              CaffeineSync
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.1rem, 6vw, 3.2rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: "1rem" }}>
            {T.headline[0]}
            <br />
            <span style={{ color: "var(--amber)" }}>{T.headline[1]}</span>
          </h1>

          <p style={{ fontSize: "0.97rem", color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 400, margin: "0 auto", fontWeight: 300 }}>
            {T.subtitle}
          </p>

          {/* Tags */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem" }}>
            {T.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.3rem 0.75rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 100,
                  fontSize: "0.7rem",
                  color: "var(--text-faint)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* ── Wake time input ── */}
        <div
          className="cs-input-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "1.5rem 1.75rem",
            marginBottom: "1.25rem",
            transition: "border-color 0.35s",
            animation: "fadeUp 0.7s 0.12s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "1rem" }}>
            {T.inputLabel}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <input
              type="time"
              className="cs-time-input"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
            <span style={{ fontSize: "0.9rem", color: "var(--text-faint)", fontWeight: 300 }}>
              {T.timeSuffix}
            </span>
          </div>
        </div>

        {/* ── Status badge ── */}
        <div
          style={{
            display: "flex", justifyContent: "center",
            marginBottom: "1.25rem",
            animation: "fadeUp 0.7s 0.24s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.45rem 1.1rem",
              borderRadius: 100,
              fontSize: "0.82rem", fontWeight: 500,
              background: bs.bg,
              border: `1px solid ${bs.border}`,
              color: bs.color,
              transition: "background 0.4s, border-color 0.4s, color 0.4s",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", animation: "pulseDot 1.8s ease-in-out infinite" }} />
            {T.status[state]}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "1.5rem 1.75rem",
            marginBottom: "1.25rem",
            animation: "fadeUp 0.7s 0.3s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "1.25rem" }}>
            {T.tlLabel}
          </div>

          {/* Bar */}
          <div style={{ position: "relative", height: 48, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.025)", marginBottom: "0.6rem" }}>
            <TimelineSeg left={0}       right={w.wake}  color="rgba(71,85,105,0.18)" />
            <TimelineSeg left={w.wake}  right={w.corEnd} color="rgba(248,113,113,0.22)" />
            <TimelineSeg left={w.w1s}   right={w.w1e}   color="rgba(52,211,153,0.32)" />
            <TimelineSeg left={w.w1e}   right={w.w2s}   color="rgba(71,85,105,0.08)" />
            <TimelineSeg left={w.w2s}   right={w.w2e}   color="rgba(34,211,238,0.32)" />
            <TimelineSeg left={w.w2e}   right={w.cut}   color="rgba(251,191,36,0.18)" />
            <TimelineSeg left={w.cut}   right={w.sleep} color="rgba(71,85,105,0.12)" />
            <TimelineSeg left={w.sleep} right={1440}    color="rgba(71,85,105,0.18)" />
            {/* Now marker */}
            <div
              style={{
                position: "absolute",
                top: 0, height: "100%",
                left: pct(now),
                width: 2,
                background: "white",
                borderRadius: 1,
                transition: "left 0.7s ease",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -5, left: "50%", transform: "translateX(-50%)",
                  width: 10, height: 10,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 0 8px 2px rgba(255,255,255,0.4)",
                }}
              />
            </div>
          </div>

          {/* Time labels */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.67rem", color: "var(--text-faint)", padding: "0 2px" }}>
            {["00:00", "06:00", "12:00", "18:00", "24:00"].map((t) => <span key={t}>{t}</span>)}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.2rem", marginTop: "1rem" }}>
            {[
              ["rgba(248,113,113,0.5)", T.legend[0]],
              ["rgba(52,211,153,0.6)",  T.legend[1]],
              ["rgba(34,211,238,0.6)",  T.legend[2]],
              ["rgba(251,191,36,0.5)",  T.legend[3]],
            ].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "var(--text-faint)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color as string, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Window cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
            animation: "fadeUp 0.7s 0.4s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {/* Window 1 */}
          <div
            className="cs-window-card"
            style={{
              background: "var(--surface)",
              border: state === "w1" ? "1px solid var(--green)" : "1px solid var(--border)",
              borderRadius: 18,
              padding: "1.25rem",
              color: "var(--green)",
              boxShadow: state === "w1" ? "0 0 20px -4px var(--green)" : "none",
              cursor: "default",
            }}
          >
            <PulseDot live={state === "w1"} />
            <div style={{ fontSize: "0.67rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6, marginBottom: "0.3rem" }}>{T.w1Label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "inherit", marginBottom: "0.55rem", transition: "all 0.4s" }}>
              {toHHMM(w.w1s)} – {toHHMM(w.w1e)}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.45 }}>{T.w1Note}</div>
          </div>

          {/* Window 2 */}
          <div
            className="cs-window-card"
            style={{
              background: "var(--surface)",
              border: state === "w2" ? "1px solid var(--cyan)" : "1px solid var(--border)",
              borderRadius: 18,
              padding: "1.25rem",
              color: "var(--cyan)",
              boxShadow: state === "w2" ? "0 0 20px -4px var(--cyan)" : "none",
              cursor: "default",
            }}
          >
            <PulseDot live={state === "w2"} />
            <div style={{ fontSize: "0.67rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6, marginBottom: "0.3rem" }}>{T.w2Label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "inherit", marginBottom: "0.55rem", transition: "all 0.4s" }}>
              {toHHMM(w.w2s)} – {toHHMM(w.w2e)}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.45 }}>{T.w2Note}</div>
          </div>

          {/* Cutoff */}
          <div
            className="cs-window-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "1.25rem",
              color: "#64748B",
              cursor: "default",
            }}
          >
            <PulseDot />
            <div style={{ fontSize: "0.67rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6, marginBottom: "0.3rem" }}>{T.cutLabel}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "inherit", marginBottom: "0.55rem" }}>
              {toHHMM(w.cut)}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.45 }}>{T.cutNote}</div>
          </div>
        </div>

        {/* ── Countdown ── */}
        {cdMins !== null && cdMins > 0 && (
          <div
            style={{
              background: "var(--amber-dim)",
              border: "1px solid var(--amber-glow)",
              borderRadius: 18,
              padding: "1.2rem 1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1.25rem",
              animation: "fadeUp 0.7s 0.5s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--amber)", opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>
                {cdLabel}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2.1rem", fontWeight: 800, color: "var(--amber-soft)", letterSpacing: "-0.03em" }}>
                {fmtCountdown(cdMins, isNL)}
              </div>
            </div>
            <div style={{ fontSize: "2rem", opacity: 0.7 }}>⏱</div>
          </div>
        )}

        {/* ── Science footnote ── */}
        <div
          style={{
            fontSize: "0.73rem",
            color: "var(--text-faint)",
            textAlign: "center",
            lineHeight: 1.65,
            animation: "fadeUp 0.7s 0.6s cubic-bezier(0.22,1,0.36,1) both",
            whiteSpace: "pre-line",
          }}
        >
          {T.science[0]}
          <span style={{ color: "var(--amber)", opacity: 0.75 }}>{T.science[1]}</span>
          {T.science[2]}
          <span style={{ color: "var(--amber)", opacity: 0.75 }}>{T.science[3]}</span>
          {T.science[4]}
        </div>
      </div>
    </>
  );
}
