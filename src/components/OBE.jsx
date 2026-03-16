import { useState, useEffect, useRef, useCallback } from "react";

// ── Data ────────────────────────────────────────────────────────────────────

const INITIAL_SCORES = { Q1: 88, Q2: 68, Q3: 78, Q4: 58, Q5: 98 };

const ITEMS = [
  { id: "Q1", tags: ["Linear DS"], topics: ["Stack"], clos: ["CLO1"] },
  { id: "Q2", tags: ["Linear DS"], topics: ["Queue"], clos: ["CLO1"] },
  { id: "Q3", tags: ["Pointer Logic", "Memory Mgmt"], topics: ["Linked List"], clos: ["CLO2"] },
  { id: "Q4", tags: ["Algorithm Design", "Recursion"], topics: ["Recursion", "Sorting"], clos: ["CLO2", "CLO3"] },
  { id: "Q5", tags: ["Sorting Algo", "Algorithm Design"], topics: ["Sorting"], clos: ["CLO3"] },
];

const TAGS = {
  "Linear DS":       { items: ["Q1", "Q2"], group: "Core DS" },
  "Pointer Logic":   { items: ["Q3"],       group: "Core DS" },
  "Memory Mgmt":     { items: ["Q3"],       group: "Memory" },
  "Algorithm Design":{ items: ["Q4", "Q5"], group: "Algorithms" },
  "Recursion":       { items: ["Q4"],       group: "Problem Solving" },
  "Sorting Algo":    { items: ["Q5"],       group: "Algorithms" },
};

const GROUPS = {
  "Core DS":        { tags: ["Linear DS", "Pointer Logic"] },
  "Data Structures":{ tags: ["Linear DS", "Sorting Algo"] },
  "Memory":         { tags: ["Memory Mgmt", "Pointer Logic"] },
  "Systems":        { tags: ["Memory Mgmt"] },
  "Algorithms":     { tags: ["Algorithm Design", "Sorting Algo"] },
  "Problem Solving":{ tags: ["Algorithm Design", "Recursion"] },
};

const FAMILIES = {
  "Fundamentals":  { desc: "Core CS foundations",     groups: ["Core DS", "Data Structures", "Algorithms", "Problem Solving"] },
  "CS Essentials": { desc: "Cross-cutting CS skills",  groups: ["Core DS", "Memory", "Systems", "Algorithms"] },
  "Systems":       { desc: "Low-level systems skills", groups: ["Memory", "Systems"] },
};

const TOPICS = {
  "Stack":      { items: ["Q1"],       clos: ["CLO1"] },
  "Queue":      { items: ["Q2"],       clos: ["CLO1"] },
  "Linked List":{ items: ["Q3"],       clos: ["CLO2"] },
  "Recursion":  { items: ["Q4"],       clos: ["CLO2", "CLO3"] },
  "Sorting":    { items: ["Q4", "Q5"], clos: ["CLO2", "CLO3"] },
};

const CLOS = {
  CLO1: { desc: "Understand linear data structures (Stack, Queue) and their operations", items: ["Q1", "Q2"] },
  CLO2: { desc: "Apply linked list and pointer concepts to solve memory problems",        items: ["Q3", "Q4"] },
  CLO3: { desc: "Implement algorithmic problem-solving using Recursion and Sorting",      items: ["Q4", "Q5"] },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const avg = (arr) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);

const calcTag    = (t, sc) => avg(TAGS[t].items.map((i) => sc[i]));
const calcGroup  = (g, sc) => avg(GROUPS[g].tags.map((t) => calcTag(t, sc)));
const calcFamily = (f, sc) => avg(FAMILIES[f].groups.map((g) => calcGroup(g, sc)));
const calcTopic  = (t, sc) => avg(TOPICS[t].items.map((i) => sc[i]));
const calcCLO    = (c, sc) => avg(CLOS[c].items.map((i) => sc[i]));

const getColor  = (v) => (v >= 70 ? "#16A34A" : v >= 50 ? "#D97706" : "#DC2626");
const getBadge  = (v) => (v >= 70 ? "good"    : v >= 50 ? "mod"     : "bad");
const getBadgeLabel = (v) => (v >= 70 ? "Good" : v >= 50 ? "Moderate" : "Needs work");

const TAG_PILL_STYLE = {
  "Linear DS":        { bg: "#EEF2FF", color: "#4338CA" },
  "Pointer Logic":    { bg: "#F3E8FF", color: "#7C3AED" },
  "Memory Mgmt":      { bg: "#CCFBF1", color: "#0F766E" },
  "Algorithm Design": { bg: "#FFE4E6", color: "#BE123C" },
  "Recursion":        { bg: "#FEF3C7", color: "#92400E" },
  "Sorting Algo":     { bg: "#EEF2FF", color: "#4338CA" },
};

// ── Sub-components ───────────────────────────────────────────────────────────

const Pill = ({ label, style }) => (
  <span style={{
    display: "inline-flex", fontSize: 11, padding: "3px 8px",
    borderRadius: 20, fontWeight: 500, margin: 2,
    background: style.bg, color: style.color,
  }}>{label}</span>
);

const TopicPill = ({ label }) => (
  <span style={{ display:"inline-flex", fontSize:11, padding:"3px 8px", borderRadius:20, fontWeight:500, margin:2, background:"#F0FDF4", color:"#15803D" }}>{label}</span>
);

const CloPill = ({ label }) => (
  <span style={{ display:"inline-flex", fontSize:11, padding:"3px 8px", borderRadius:20, fontWeight:500, margin:2, background:"#FFF7ED", color:"#C2410C" }}>{label}</span>
);

const Badge = ({ value }) => {
  const b = getBadge(value);
  const styles = {
    good: { bg: "#DCFCE7", color: "#166534" },
    mod:  { bg: "#FEF3C7", color: "#92400E" },
    bad:  { bg: "#FEE2E2", color: "#991B1B" },
  };
  return (
    <span style={{
      display: "inline-flex", fontSize: 10, fontWeight: 600,
      padding: "2px 7px", borderRadius: 10, letterSpacing: ".5px",
      textTransform: "uppercase", marginLeft: 6,
      background: styles[b].bg, color: styles[b].color,
    }}>{getBadgeLabel(value)}</span>
  );
};

const AnimatedBar = ({ pct, color }) => (
  <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
    <div style={{
      height: "100%", borderRadius: 3,
      width: `${pct}%`, background: color,
      transition: "width .5s cubic-bezier(.4,0,.2,1), background .4s",
    }} />
  </div>
);

const AchCard = ({ name, pct, sub }) => (
  <div style={{
    background: "#fff", borderRadius: 14, border: ".5px solid rgba(0,0,0,.09)",
    padding: "1rem 1.1rem",
    transition: "transform .2s, box-shadow .2s",
  }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.08)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
  >
    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {name}<Badge value={pct} />
    </div>
    <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, lineHeight: 1.4 }}>{sub}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color: getColor(pct), marginBottom: 6, transition: "color .4s" }}>{pct}%</div>
    <AnimatedBar pct={pct} color={getColor(pct)} />
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9CA3AF", whiteSpace: "nowrap" }}>
      {children}
    </span>
    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,.08)" }} />
  </div>
);

const FlowNode = ({ label, sub, style }) => (
  <div style={{ borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 500, textAlign: "center", minWidth: 80, ...style }}>
    {label}
    <div style={{ fontSize: 10, opacity: .7 }}>{sub}</div>
  </div>
);

const MiniChart = ({ title, labels, values }) => {
  const max = 100;
  return (
    <div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
        {labels.map((lbl, i) => {
          const h = Math.round((values[i] / max) * 100);
          const color = getColor(values[i]);
          return (
            <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color }}>{values[i]}%</div>
              <div style={{
                width: "100%", height: `${h}%`, background: color,
                borderRadius: "4px 4px 0 0", minHeight: 4,
                transition: "height .5s cubic-bezier(.4,0,.2,1), background .4s",
              }} />
              <div style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center", lineHeight: 1.2 }}>{lbl}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function OBEAchievementCalculator() {
  const [scores, setScores] = useState({ ...INITIAL_SCORES });

  const updateScore = useCallback((id, val) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  }, []);

  // Computed values
  const tagVals    = Object.keys(TAGS).map((t) => ({ name: t, pct: calcTag(t, scores) }));
  const groupVals  = Object.keys(GROUPS).map((g) => ({ name: g, pct: calcGroup(g, scores) }));
  const familyVals = Object.keys(FAMILIES).map((f) => ({ name: f, pct: calcFamily(f, scores), desc: FAMILIES[f].desc }));
  const topicVals  = Object.keys(TOPICS).map((t) => ({ name: t, pct: calcTopic(t, scores) }));
  const cloVals    = Object.keys(CLOS).map((c) => ({ name: c, pct: calcCLO(c, scores), desc: CLOS[c].desc }));

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F3F4F6", minHeight: "100vh", padding: "0 0 60px" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)",
        padding: "2rem 2.5rem", marginBottom: "1.5rem",
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,.07)" }} />
        <div style={{ position:"absolute", bottom:-60, right:60, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />
        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:500, letterSpacing:.5, marginBottom:12, textTransform:"uppercase" }}>
            📐 CS Freshers · OBE Tutorial
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.2, marginBottom: 6 }}>
            Outcome Based Education<br />Achievement Calculator
          </h1>
          <p style={{ fontSize: 13, opacity: .8, maxWidth: 520, lineHeight: 1.6 }}>
            One item score propagates through two parallel hierarchies — Tags→Groups→Families (skill taxonomy) and Topics→CLOs (curriculum outcomes). Drag any slider to see live updates across all panels.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 1rem" }}>

        {/* Flow Diagram */}
        <div style={{ background:"#fff", borderRadius:16, border:".5px solid rgba(0,0,0,.09)", padding:"1.5rem", marginBottom:"1.5rem" }}>
          <SectionTitle>How achievement flows</SectionTitle>
          <div style={{ display:"flex", gap:"2rem", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:"#9CA3AF", marginBottom:8 }}>Hierarchy A — Skill Taxonomy</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <FlowNode label="Item" sub="score %" style={{ background:"#EEF2FF", color:"#4338CA", border:"1.5px solid #C7D2FE" }} />
                <span style={{ color:"#9CA3AF" }}>→</span>
                <FlowNode label="Tag" sub="avg(items)" style={{ background:"#F3E8FF", color:"#7C3AED", border:"1.5px solid #E9D5FF" }} />
                <span style={{ color:"#9CA3AF" }}>→</span>
                <FlowNode label="Group" sub="avg(tags)" style={{ background:"#FEF3C7", color:"#92400E", border:"1.5px solid #FDE68A" }} />
                <span style={{ color:"#9CA3AF" }}>→</span>
                <FlowNode label="Family" sub="avg(groups)" style={{ background:"#DCFCE7", color:"#166534", border:"1.5px solid #BBF7D0" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:"#9CA3AF", marginBottom:8 }}>Hierarchy B — Curriculum Outcomes</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <FlowNode label="Item" sub="score %" style={{ background:"#EEF2FF", color:"#4338CA", border:"1.5px solid #C7D2FE" }} />
                <span style={{ color:"#9CA3AF" }}>→</span>
                <FlowNode label="Topic" sub="avg(items)" style={{ background:"#F0FDF4", color:"#15803D", border:"1.5px solid #BBF7D0" }} />
                <span style={{ color:"#9CA3AF" }}>→</span>
                <FlowNode label="CLO" sub="avg(items)" style={{ background:"#FFF7ED", color:"#C2410C", border:"1.5px solid #FED7AA" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Items */}
        <div style={{ background:"#fff", borderRadius:16, border:".5px solid rgba(0,0,0,.09)", padding:"1.5rem", marginBottom:"1.5rem" }}>
          <SectionTitle>Assessment items — adjust scores</SectionTitle>

          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"48px 1fr 1fr 90px 70px 1fr", gap:12, paddingBottom:10, borderBottom:"1px solid rgba(0,0,0,.08)", marginBottom:4 }}>
            {["Item","Tags","Topics","CLOs","Score","Adjust"].map((h) => (
              <span key={h} style={{ fontSize:10, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:"#9CA3AF" }}>{h}</span>
            ))}
          </div>

          {ITEMS.map((item) => (
            <div key={item.id} style={{ display:"grid", gridTemplateColumns:"48px 1fr 1fr 90px 70px 1fr", alignItems:"center", gap:12, padding:"10px 0", borderBottom:".5px solid rgba(0,0,0,.06)" }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500, background:"#F5F3FF", borderRadius:8, padding:"4px 8px", textAlign:"center", color:"#4F46E5" }}>{item.id}</div>
              <div>{item.tags.map((t) => <Pill key={t} label={t} style={TAG_PILL_STYLE[t] || { bg:"#EEF2FF", color:"#4338CA" }} />)}</div>
              <div>{item.topics.map((t) => <TopicPill key={t} label={t} />)}</div>
              <div>{item.clos.map((c) => <CloPill key={c} label={c} />)}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, color: getColor(scores[item.id]), textAlign:"center", transition:"color .3s" }}>
                {scores[item.id]}%
              </div>
              <input
                type="range" min={0} max={100} step={1} value={scores[item.id]}
                onChange={(e) => updateScore(item.id, parseInt(e.target.value))}
                style={{ width:"100%", accentColor:"#4F46E5", cursor:"pointer" }}
              />
            </div>
          ))}
        </div>

        {/* Tag Achievement */}
        <SectionTitle>Tag achievement <span style={{ fontWeight:400, fontSize:12, textTransform:"none", letterSpacing:0, color:"#9CA3AF" }}>&nbsp;= avg of mapped items</span></SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:"1.5rem" }}>
          {tagVals.map(({ name, pct }) => (
            <AchCard key={name} name={name} pct={pct} sub={`Items: ${TAGS[name].items.join(", ")} · Group: ${TAGS[name].group}`} />
          ))}
        </div>

        {/* Group Achievement */}
        <SectionTitle>Group achievement <span style={{ fontWeight:400, fontSize:12, textTransform:"none", letterSpacing:0, color:"#9CA3AF" }}>&nbsp;= avg of its tags</span></SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:"1.5rem" }}>
          {groupVals.map(({ name, pct }) => (
            <AchCard key={name} name={name} pct={pct} sub={`Tags: ${GROUPS[name].tags.join(", ")}`} />
          ))}
        </div>

        {/* Family Achievement */}
        <SectionTitle>Family achievement <span style={{ fontWeight:400, fontSize:12, textTransform:"none", letterSpacing:0, color:"#9CA3AF" }}>&nbsp;= avg of its groups</span></SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:"1.5rem" }}>
          {familyVals.map(({ name, pct, desc }) => (
            <AchCard key={name} name={name} pct={pct} sub={desc} />
          ))}
        </div>

        {/* Topic Achievement */}
        <SectionTitle>Topic achievement <span style={{ fontWeight:400, fontSize:12, textTransform:"none", letterSpacing:0, color:"#9CA3AF" }}>&nbsp;= avg of mapped items</span></SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:"1.5rem" }}>
          {topicVals.map(({ name, pct }) => (
            <AchCard key={name} name={name} pct={pct} sub={`Items: ${TOPICS[name].items.join(", ")} · CLOs: ${TOPICS[name].clos.join(", ")}`} />
          ))}
        </div>

        {/* CLO Attainment */}
        <SectionTitle>CLO attainment <span style={{ fontWeight:400, fontSize:12, textTransform:"none", letterSpacing:0, color:"#9CA3AF" }}>&nbsp;= avg of mapped items</span></SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:"1.5rem" }}>
          {cloVals.map(({ name, pct, desc }) => (
            <AchCard key={name} name={name} pct={pct} sub={desc} />
          ))}
        </div>

        {/* Visual Comparison */}
        <div style={{ background:"#fff", borderRadius:16, border:".5px solid rgba(0,0,0,.09)", padding:"1.5rem" }}>
          <SectionTitle>Visual comparison</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
            <MiniChart
              title="Item scores"
              labels={ITEMS.map((i) => i.id)}
              values={ITEMS.map((i) => scores[i.id])}
            />
            <MiniChart
              title="Tag achievement"
              labels={tagVals.map((t) => t.name.split(" ")[0])}
              values={tagVals.map((t) => t.pct)}
            />
            <MiniChart
              title="Group achievement"
              labels={groupVals.map((g) => g.name.split(" ")[0])}
              values={groupVals.map((g) => g.pct)}
            />
            <MiniChart
              title="CLO attainment"
              labels={cloVals.map((c) => c.name)}
              values={cloVals.map((c) => c.pct)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}