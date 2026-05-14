import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LAMP_POINTS_PER_COUNT = [0, 10, 18, 25, 30, 34, 38, 42, 60];
const LAMP_DURATION = 30;
const TOTAL_LAMPS   = 8;
const TEAM_COLORS   = ["#f97316","#3b82f6","#22c55e","#a855f7","#ec4899","#14b8a6"];
const TEAM_NAMES    = ["Rood","Blauw","Groen","Paars","Roze","Cyaan"];

// ─── BALANCE METHODS ──────────────────────────────────────────────────────────
const METHODS = {
  none: {
    label: "Geen balancering", short: "Basis", color: "#64748b",
    desc: "Punten puur op basis van lampen. Rijken worden rijker.",
    getMultiplier: () => 1,
    getFlatBonus:  () => 0,
  },
  fewer_points: {
    label: "Minder punten per lamp", short: "Minder punten", color: "#f59e0b",
    desc: "Lampwaarden ×0.5. Iedereen verdient minder, verhouding blijft gelijk.",
    getMultiplier: () => 0.5,
    getFlatBonus:  () => 0,
  },
  flat_bonus: {
    label: "Vaste bonus achterhoede", short: "Vaste bonus", color: "#06b6d4",
    desc: "+20/s voor de laatste, aflopend naar 0 voor de koploper.",
    getMultiplier: () => 1,
    getFlatBonus:  (rank, total) => Math.round((rank / Math.max(total - 1, 1)) * 20),
  },
  multiplier: {
    label: "Positie multiplier ×0.7–×1.5", short: "Multiplier", color: "#a855f7",
    desc: "Koploper ×0.7, hekkensluiter ×1.5. Schaalt dynamisch mee met de stand.",
    getMultiplier: (rank, total) => 0.7 + (rank / Math.max(total - 1, 1)) * 0.8,
    getFlatBonus:  () => 0,
  },
};

const SKILL_PRESETS = {
  varied:       { label: "Gevarieerd (realistisch)", values: (n) => Array.from({ length: n }, (_, i) => n > 1 ? 0.35 + (i / (n - 1)) * 0.65 : 0.65) },
  equal:        { label: "Gelijkwaardig",            values: (n) => Array.from({ length: n }, () => 0.65) },
  one_dominant: { label: "Één dominant team",        values: (n) => Array.from({ length: n }, (_, i) => i === 0 ? 1.0 : 0.35) },
};

// ─── SIMULATION ───────────────────────────────────────────────────────────────
function runSimulation(numTeams, gameDuration, skills, method) {
  const m     = METHODS[method];
  const teams = Array.from({ length: numTeams }, (_, i) => ({ id: i, score: 0, claimedLamps: [] }));
  const snapshots = [], gapHistory = [];

  for (let t = 1; t <= gameDuration; t++) {
    teams.forEach(team => {
      team.claimedLamps = team.claimedLamps.filter(l => t - l.claimedAt < LAMP_DURATION);
    });

    const taken        = new Set(teams.flatMap(team => team.claimedLamps.map(l => l.lampId)));
    const shuffledFree = Array.from({ length: TOTAL_LAMPS }, (_, i) => i)
      .filter(id => !taken.has(id)).sort(() => Math.random() - 0.5);

    teams.forEach((team, i) => {
      if (shuffledFree.length > 0 && Math.random() < skills[i] * 0.12) {
        const lampId = shuffledFree.pop();
        if (lampId !== undefined) team.claimedLamps.push({ lampId, claimedAt: t });
      }
    });

    const ranked = [...teams].sort((a, b) => b.score - a.score);
    const rankOf = {};
    ranked.forEach((team, idx) => { rankOf[team.id] = idx; });

    teams.forEach(team => {
      const rank  = rankOf[team.id];
      const base  = LAMP_POINTS_PER_COUNT[Math.min(team.claimedLamps.length, 8)];
      team.score += base * m.getMultiplier(rank, numTeams) + m.getFlatBonus(rank, numTeams);
    });

    if (t % 10 === 0 || t === gameDuration) {
      const snap = { t };
      teams.forEach(team => { snap[`t${team.id}`] = Math.round(team.score); });
      snapshots.push(snap);
      const sc = teams.map(tm => tm.score).sort((a, b) => b - a);
      gapHistory.push({
        t,
        gap:    Math.round(sc[0] - sc[sc.length - 1]),
        gapPct: sc[0] > 0 ? Math.round(((sc[0] - sc[sc.length - 1]) / sc[0]) * 100) : 0,
      });
    }
  }
  return { snapshots, gapHistory };
}

function runAveraged(numTeams, gameDuration, skills, method, runs = 8) {
  const all = Array.from({ length: runs }, () => runSimulation(numTeams, gameDuration, skills, method));
  const avgSnapshots = all[0].snapshots.map((_, idx) => {
    const snap = { t: all[0].snapshots[idx].t };
    for (let i = 0; i < numTeams; i++)
      snap[`t${i}`] = Math.round(all.reduce((s, r) => s + r.snapshots[idx][`t${i}`], 0) / runs);
    return snap;
  });
  const avgGap = all[0].gapHistory.map((_, idx) => ({
    t:      all[0].gapHistory[idx].t,
    gap:    Math.round(all.reduce((s, r) => s + r.gapHistory[idx].gap,    0) / runs),
    gapPct: Math.round(all.reduce((s, r) => s + r.gapHistory[idx].gapPct, 0) / runs),
  }));
  return { snapshots: avgSnapshots, gapHistory: avgGap };
}

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── SHARED UI PRIMITIVES ────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 12, padding: 18, ...style }}>
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function CtrlBox({ label, children }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {children}
    </div>
  );
}

function ScoreBar({ name, score, max, color, rank }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ width: 18, fontSize: 11, color: "#6b7280", textAlign: "right" }}>#{rank}</span>
      <span style={{ width: 40, fontSize: 12, fontWeight: 700, color, fontFamily: "monospace" }}>{name}</span>
      <div style={{ flex: 1, height: 22, background: "#1a1a2e", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, opacity: 0.85, transition: "width 0.5s ease" }} />
        <span style={{ position: "absolute", right: 6, top: 4, fontSize: 10, color: "#e2e8f0", fontFamily: "monospace" }}>
          {score.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

const SEL_STYLE = { background: "transparent", color: "#c9d1e0", border: "none", fontSize: 12, width: "100%", cursor: "pointer" };

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DominionSim() {
  const isMobile = useIsMobile();

  const [method,      setMethod]      = useState("multiplier");
  const [numTeams,    setNumTeams]    = useState(4);
  const [durationMin, setDurationMin] = useState(15);
  const [skillPreset, setSkillPreset] = useState("varied");
  const [data,        setData]        = useState(null);
  const [tab,         setTab]         = useState("scores");

  const simulate = useCallback(() => {
    const skills = SKILL_PRESETS[skillPreset].values(numTeams);
    setData(runAveraged(numTeams, durationMin * 60, skills, method));
  }, [method, numTeams, durationMin, skillPreset]);

  useEffect(() => { setData(null); simulate(); }, [simulate]);

  const finalSnap   = data?.snapshots[data.snapshots.length - 1];
  const dataIsValid = finalSnap != null && `t${numTeams - 1}` in finalSnap;
  const finalScores = dataIsValid
    ? Array.from({ length: numTeams }, (_, i) => ({ id: i, score: finalSnap[`t${i}`] ?? 0 }))
        .sort((a, b) => b.score - a.score)
    : [];
  const maxScore = finalScores[0]?.score ?? 1;
  const gapAbs   = maxScore - (finalScores[finalScores.length - 1]?.score ?? 0);
  const gapPct   = maxScore > 0 ? ((gapAbs / maxScore) * 100).toFixed(0) : 0;
  const isGood   = parseInt(gapPct) < 35;

  const chartH = isMobile ? 190 : 260;

  return (
    <div style={{
      fontFamily: "'DM Mono','Fira Code',monospace",
      background: "#080c14", minHeight: "100vh", color: "#c9d1e0",
      padding: isMobile ? "14px 12px" : "28px 24px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{ marginBottom: isMobile ? 14 : 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{
            fontSize: isMobile ? 20 : 26, fontWeight: 800,
            fontFamily: "'Syne',sans-serif", color: "#f0f4ff", margin: 0, letterSpacing: "-0.5px",
          }}>DOMINION</h1>
          <span style={{ fontSize: 10, color: "#4b5563", letterSpacing: 3, textTransform: "uppercase" }}>
            Spelbalans Simulator
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#4b5563" }}>Gemiddelde van 8 simulatieruns</p>
      </div>

      {/* ── CONTROLS ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
        gap: 10, marginBottom: 12,
      }}>
        <CtrlBox label="Methode">
          <select value={method} onChange={e => setMethod(e.target.value)} style={SEL_STYLE}>
            {Object.entries(METHODS).map(([k, v]) =>
              <option key={k} value={k}>{isMobile ? v.short : v.label}</option>
            )}
          </select>
        </CtrlBox>
        <CtrlBox label={`Teams: ${numTeams}`}>
          <input type="range" min={3} max={6} value={numTeams}
            onChange={e => setNumTeams(+e.target.value)}
            style={{ width: "100%", accentColor: "#6366f1" }} />
        </CtrlBox>
        <CtrlBox label={`Speeltijd: ${durationMin}m`}>
          <input type="range" min={5} max={25} step={5} value={durationMin}
            onChange={e => setDurationMin(+e.target.value)}
            style={{ width: "100%", accentColor: "#6366f1" }} />
        </CtrlBox>
        <CtrlBox label="Teamvariatie">
          <select value={skillPreset} onChange={e => setSkillPreset(e.target.value)} style={SEL_STYLE}>
            {Object.entries(SKILL_PRESETS).map(([k, v]) =>
              <option key={k} value={k}>{v.label}</option>
            )}
          </select>
        </CtrlBox>
      </div>

      {/* ── VERDICT ── */}
      {dataIsValid && (
        <div style={{
          background: isGood ? "#052e16" : "#2d0f0f",
          border: `1px solid ${isGood ? "#166534" : "#7f1d1d"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
          display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between", gap: 4,
        }}>
          <span style={{ fontSize: 12, color: isGood ? "#4ade80" : "#f87171" }}>
            {isGood ? "✓ Competitief" : "✗ Groot gat"} — {gapAbs.toLocaleString()} punten ({gapPct}%)
          </span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            {isGood ? "Spannend tot het einde" : "Koploper wint te dominant"}
          </span>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {[["scores","Puntsontwikkeling"],["gap","Gapanalyse"],["why","Onderbouwing"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: isMobile ? "7px 12px" : "6px 16px",
            fontSize: isMobile ? 10 : 11, borderRadius: 6, border: "none",
            cursor: "pointer", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap",
            background: tab === key ? "#1e2530" : "transparent",
            color:      tab === key ? "#c9d1e0" : "#4b5563",
          }}>{label}</button>
        ))}
      </div>

      {/* Loading */}
      {!dataIsValid && (
        <div style={{ textAlign: "center", color: "#4b5563", fontSize: 12, padding: "48px 0" }}>
          Simuleren…
        </div>
      )}

      {/* ── TAB: SCORES ── */}
      {tab === "scores" && dataIsValid && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
          gap: 14,
        }}>
          <Card>
            <CardLabel>Punten over tijd</CardLabel>
            <ResponsiveContainer width="100%" height={chartH}>
              <LineChart data={data.snapshots} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                <XAxis dataKey="t" tickFormatter={v => `${Math.floor(v/60)}m`} stroke="#2d3748" tick={{ fontSize: 9, fill: "#4b5563" }} />
                <YAxis stroke="#2d3748" tick={{ fontSize: 9, fill: "#4b5563" }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} width={36} />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={v => `${Math.floor(v/60)}m ${v%60}s`}
                  formatter={(val, name) => [val.toLocaleString(), TEAM_NAMES[parseInt(name.slice(1))]]}
                />
                <Legend formatter={name => TEAM_NAMES[parseInt(name.slice(1))]} wrapperStyle={{ fontSize: 10 }} />
                {Array.from({ length: numTeams }, (_, i) => (
                  <Line key={i} type="monotone" dataKey={`t${i}`} name={`t${i}`}
                    stroke={TEAM_COLORS[i]} dot={false} strokeWidth={2} strokeOpacity={0.9} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardLabel>Eindstand</CardLabel>
            {finalScores.map((s, rank) => (
              <ScoreBar key={s.id} name={TEAM_NAMES[s.id]} score={s.score}
                max={maxScore} color={TEAM_COLORS[s.id]} rank={rank + 1} />
            ))}
            <div style={{ marginTop: 16, padding: 12, background: "#080c14", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 8 }}>
                {method === "multiplier" ? "MULTIPLIER PER POSITIE"
                 : method === "flat_bonus" ? "BONUS PER POSITIE"
                 : "ACTIEVE METHODE"}
              </div>
              {method === "multiplier" && Array.from({ length: numTeams }, (_, i) => {
                const mult = (0.7 + (i / Math.max(numTeams - 1, 1)) * 0.8).toFixed(2);
                const lbl  = i === 0 ? "Koploper" : i === numTeams - 1 ? "Achterste" : `Pos. ${i+1}`;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                    <span style={{ color: "#6b7280" }}>#{i+1} {lbl}</span>
                    <span style={{ color: parseFloat(mult) < 1 ? "#f97316" : parseFloat(mult) > 1 ? "#4ade80" : "#c9d1e0", fontWeight: 700 }}>×{mult}</span>
                  </div>
                );
              })}
              {method === "flat_bonus" && Array.from({ length: numTeams }, (_, i) => {
                const bonus = Math.round((i / Math.max(numTeams - 1, 1)) * 20);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                    <span style={{ color: "#6b7280" }}>#{i+1}</span>
                    <span style={{ color: bonus > 0 ? "#4ade80" : "#6b7280" }}>+{bonus}/s</span>
                  </div>
                );
              })}
              {method === "fewer_points" && <div style={{ fontSize: 11, color: "#f59e0b" }}>Alle lamppunten ×0.5</div>}
              {method === "none"          && <div style={{ fontSize: 11, color: "#6b7280" }}>Geen aanpassing</div>}
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB: GAP ── */}
      {tab === "gap" && dataIsValid && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <Card>
              <CardLabel>Absoluut puntenverschil (1e vs. laatste)</CardLabel>
              <div style={{ fontSize: 10, color: "#374151", marginBottom: 12 }}>Hoe lager, hoe competitiever</div>
              <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
                <AreaChart data={data.gapHistory} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                  <XAxis dataKey="t" tickFormatter={v => `${Math.floor(v/60)}m`} stroke="#2d3748" tick={{ fontSize: 9, fill: "#4b5563" }} />
                  <YAxis stroke="#2d3748" tick={{ fontSize: 9, fill: "#4b5563" }} width={36} />
                  <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 8, fontSize: 11 }}
                    labelFormatter={v => `${Math.floor(v/60)}m ${v%60}s`} />
                  <Area type="monotone" dataKey="gap" name="Puntenverschil"
                    stroke={METHODS[method].color} fill={`${METHODS[method].color}22`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardLabel>Procentueel gat (%)</CardLabel>
              <div style={{ fontSize: 10, color: "#374151", marginBottom: 12 }}>Onafhankelijk van absolute scores</div>
              <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
                <AreaChart data={data.gapHistory} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                  <XAxis dataKey="t" tickFormatter={v => `${Math.floor(v/60)}m`} stroke="#2d3748" tick={{ fontSize: 9, fill: "#4b5563" }} />
                  <YAxis stroke="#2d3748" tick={{ fontSize: 9, fill: "#4b5563" }} tickFormatter={v => `${v}%`} width={36} />
                  <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 8, fontSize: 11 }}
                    formatter={(v) => [`${v}%`, "% gat"]}
                    labelFormatter={v => `${Math.floor(v/60)}m ${v%60}s`} />
                  <Area type="monotone" dataKey="gapPct" name="% gat"
                    stroke="#f97316" fill="#f9731622" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div style={{ background: "#080c14", border: "1px solid #1e2530", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: METHODS[method].color, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              ▸ Analyse: {METHODS[method].label}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.8 }}>
              {method === "none"         && "Zonder balancering groeit het gat rechtevenredig. Een sterk team loopt snel weg en het spel is al vroeg beslist."}
              {method === "fewer_points" && "Minder punten verlaagt absolute scores maar het procentuele gat blijft exact gelijk. Wiskundig equivalent aan geen balancering — alleen trager."}
              {method === "flat_bonus"   && "De vaste bonus helpt vroeg, maar verliest waarde naarmate scores groeien. Bij hoge eindscores is +20/s een druppel op een gloeiende plaat."}
              {method === "multiplier"   && "De multiplier schaalt altijd mee: de koploper verdient structureel minder per lamp dan de hekkensluiter — ongeacht spelduur of absolute scores."}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WHY ── */}
      {tab === "why" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Math argument */}
          <Card>
            <div style={{ fontSize: isMobile ? 13 : 14, fontFamily: "'Syne',sans-serif", color: "#f0f4ff", marginBottom: 14 }}>
              Waarom "minder punten" wiskundig niet werkt
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#080c14", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 10, fontWeight: 700 }}>
                  Team A = 4 lampen · Team B = 1 lamp
                </div>
                {[
                  ["Zonder aanpassing", "30/s vs 10/s", "3:1"],
                  ["Punten ×0.5",       "15/s vs 5/s",  "3:1"],
                  ["Punten ×0.1",       "3/s vs 1/s",   "3:1"],
                ].map(([lbl, val, ratio]) => (
                  <div key={lbl} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: 11, color: "#6b7280", marginBottom: 7, gap: 8, flexWrap: "wrap",
                  }}>
                    <span>{lbl}</span>
                    <span>{val}</span>
                    <span style={{ color: "#f87171", fontWeight: 700 }}>→ {ratio}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 11, color: "#4ade80" }}>
                  ✓ De verhouding verandert nooit, ongeacht de schaal.
                </div>
              </div>

              <div style={{ background: "#080c14", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#a855f7", marginBottom: 10, fontWeight: 700 }}>
                  Met positie multiplier
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 2.1 }}>
                  <div>A staat 1e → ×0.7 → <span style={{ color: "#a855f7", fontWeight: 700 }}>21/s</span></div>
                  <div>B staat 2e → ×1.5 → <span style={{ color: "#4ade80", fontWeight: 700 }}>15/s</span></div>
                  <div style={{ marginTop: 6 }}>
                    Ratio: <span style={{ color: "#4ade80", fontWeight: 700 }}>1.4:1</span> (was 3:1)
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#4ade80" }}>
                  ✓ Gat verkleind zonder willekeurig te zijn.
                </div>
              </div>
            </div>
          </Card>

          {/* Comparison table — horizontally scrollable on mobile */}
          <Card>
            <div style={{ fontSize: isMobile ? 13 : 14, fontFamily: "'Syne',sans-serif", color: "#f0f4ff", marginBottom: 14 }}>
              Vergelijking methoden
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Criterium", "Geen", "Minder punten", "Vaste bonus", "Multiplier"].map((h, i) => (
                      <th key={h} style={{
                        padding: "8px 10px", background: "#080c14", textAlign: "left",
                        color: i === 4 ? "#a855f7" : "#4b5563", fontWeight: 700,
                        borderBottom: "1px solid #1e2530", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Helpt achterste team",  "✗ Nee", "✗ Nee", "~ Deels",   "✓ Altijd"],
                    ["Straft koploper",        "✗ Nee", "✗ Nee", "✗ Nee",     "✓ Ja"],
                    ["Schaalt met spelduur",   "—",     "—",     "✗ Nee",     "✓ Ja"],
                    ["Relevant late game",     "—",     "—",     "✗ Verliest","✓ Altijd"],
                    ["Verhouding verandert",   "✗ Nee", "✗ Nee", "~ Deels",   "✓ Ja"],
                    ["Uitlegbaar",             "✓ Ja",  "✓ Ja",  "✓ Ja",      "~ Tabel"],
                    ["Mario Kart gevoel",      "✗",     "✗",     "~",         "✓"],
                  ].map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          padding: "7px 10px",
                          background: ri % 2 === 0 ? "#0a0e18" : "#080c14",
                          color: cell.startsWith("✓") ? "#4ade80"
                               : cell.startsWith("✗") ? "#f87171"
                               : cell.startsWith("~") ? "#f59e0b"
                               : "#c9d1e0",
                          borderBottom: "1px solid #1a1f2e",
                          fontWeight: ci === 4 ? 700 : 400,
                          whiteSpace: "nowrap",
                        }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recommendation */}
          <div style={{ background: "#0d1118", border: "1px solid #3b0764", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: isMobile ? 13 : 14, fontFamily: "'Syne',sans-serif", color: "#a855f7", marginBottom: 10 }}>
              ✓ Aanbeveling: Positie multiplier
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.8 }}>
              Enige methode die het gat <em>procentueel</em> verkleint, ongeacht spelduur of absolute scores.
              Goed spelen loont nog steeds — maar de kloof groeit niet onbeperkt.
            </div>
            <div style={{
              marginTop: 12, padding: 12, background: "#080c14", borderRadius: 8,
              fontSize: 11, color: "#e2e8f0", fontFamily: "monospace",
              lineHeight: 2.2, overflowX: "auto", display: "flex", flexWrap: "wrap", gap: "4px 16px",
            }}>
              {Array.from({ length: numTeams }, (_, i) => {
                const mult  = (0.7 + (i / Math.max(numTeams - 1, 1)) * 0.8).toFixed(2);
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🔴";
                return <span key={i}>{ medal} #{i+1} → ×{mult}</span>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
