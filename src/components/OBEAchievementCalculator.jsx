import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — your API base
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const api = {
  get:    (path)        => fetch(`${API_BASE}${path}`).then(r => { if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); }),
  post:   (path, body)  => fetch(`${API_BASE}${path}`, { method:"POST",   headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => { if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); }),
  put:    (path, body)  => fetch(`${API_BASE}${path}`, { method:"PUT",    headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r => { if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); }),
  delete: (path)        => fetch(`${API_BASE}${path}`, { method:"DELETE" }).then(r => { if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); }),
};

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────────────────────────────────────
const extractId  = (ref) => (typeof ref === "object" && ref !== null ? ref._id?.toString() : ref?.toString());
const extractIds = (arr) => (Array.isArray(arr) ? arr.map(extractId).filter(Boolean) : []);
const normalizeTag    = (t) => ({ ...t, _id: extractId(t._id) });
const normalizeGroup  = (g) => ({ ...g, _id: extractId(g._id), tags:   extractIds(g.tags   ?? g.tagIds   ?? []) });
const normalizeFamily = (f) => ({ ...f, _id: extractId(f._id), groups: extractIds(f.groups ?? f.groupIds ?? []) });

// Normalize an item coming from your MongoDB /api/items endpoint
// Adjust field names to match your actual Item schema
const normalizeItem = (item) => ({
  _id:    extractId(item._id),
  id:     item.itemCode ?? item.id ?? extractId(item._id), // display label like "Q1"
  label:  item.label ?? item.question ?? item.name ?? "Untitled",
  tagIds: extractIds(item.tags ?? item.tagIds ?? []),
  score:  item.score ?? 0,
});

// ─────────────────────────────────────────────────────────────────────────────
// SCORE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
const avg = (arr) => arr.length === 0 ? 0 : Math.round(arr.reduce((s,v) => s+v, 0) / arr.length);
const itemsForTag     = (tagId, items)                     => items.filter(i => i.tagIds.includes(tagId));
const calcTagScore    = (tagId, items, scores)             => { const its = itemsForTag(tagId, items); return its.length===0 ? null : avg(its.map(i => scores[i._id])); };
const calcGroupScore  = (group, items, scores)             => { const ts = group.tags.map(tid => calcTagScore(tid,items,scores)).filter(v=>v!==null); return ts.length===0 ? null : avg(ts); };
const calcFamilyScore = (family, items, scores, groupById) => { const gs = family.groups.map(gid=>groupById[gid]).filter(Boolean).map(g=>calcGroupScore(g,items,scores)).filter(v=>v!==null); return gs.length===0 ? null : avg(gs); };

// ─────────────────────────────────────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getColor      = (v) => v===null?"#9CA3AF":v>=70?"#16A34A":v>=50?"#D97706":"#DC2626";
const getBadgeStyle = (v) => v===null?{bg:"#F3F4F6",color:"#6B7280"}:v>=70?{bg:"#DCFCE7",color:"#166534"}:v>=50?{bg:"#FEF3C7",color:"#92400E"}:{bg:"#FEE2E2",color:"#991B1B"};
const getBadgeLabel = (v) => v===null?"No data":v>=70?"Good":v>=50?"Moderate":"Needs work";
const TAG_COLORS = [
  {bg:"#EEF2FF",color:"#4338CA"},{bg:"#F3E8FF",color:"#7C3AED"},
  {bg:"#CCFBF1",color:"#0F766E"},{bg:"#FFE4E6",color:"#BE123C"},
  {bg:"#FEF3C7",color:"#92400E"},{bg:"#F0FDF4",color:"#15803D"},
];

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const SectionTitle = ({children}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
    <span style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:"#9CA3AF",whiteSpace:"nowrap"}}>{children}</span>
    <div style={{flex:1,height:1,background:"rgba(0,0,0,.08)"}}/>
  </div>
);

const AnimatedBar = ({pct,color}) => (
  <div style={{height:5,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",borderRadius:3,width:pct===null?"0%":`${pct}%`,background:color,transition:"width .5s cubic-bezier(.4,0,.2,1),background .4s"}}/>
  </div>
);

const Badge = ({value}) => {
  const s=getBadgeStyle(value);
  return <span style={{display:"inline-flex",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:10,letterSpacing:".5px",textTransform:"uppercase",marginLeft:6,background:s.bg,color:s.color}}>{getBadgeLabel(value)}</span>;
};

const AchCard = ({name,score,sub,accent}) => (
  <div style={{background:"#fff",borderRadius:14,border:score!==null&&score>=70?"1.5px solid #BBF7D0":".5px solid rgba(0,0,0,.09)",padding:"1rem 1.1rem",transition:"transform .2s,box-shadow .2s"}}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,.08)"}}
    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}
  >
    {accent&&<div style={{width:24,height:4,borderRadius:2,background:accent,marginBottom:8}}/>}
    <div style={{fontSize:13,fontWeight:500,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}<Badge value={score}/></div>
    <div style={{fontSize:11,color:"#6B7280",marginBottom:8,lineHeight:1.5}}>{sub}</div>
    <div style={{fontSize:22,fontWeight:600,color:getColor(score),marginBottom:6,transition:"color .4s"}}>{score===null?"—":`${score}%`}</div>
    <AnimatedBar pct={score} color={getColor(score)}/>
  </div>
);

const SkeletonCard = () => (
  <div style={{background:"#fff",borderRadius:14,border:".5px solid rgba(0,0,0,.09)",padding:"1rem 1.1rem"}}>
    {[80,60,40,"100%"].map((w,i)=>(
      <div key={i} style={{height:i===3?5:12,width:typeof w==="number"?`${w}%`:w,background:"#F1F5F9",borderRadius:6,marginBottom:i===3?0:8,animation:"pulse 1.5s ease-in-out infinite"}}/>
    ))}
  </div>
);

const Spinner = () => (
  <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
);

// Inline edit on double-click
const InlineEdit = ({value, onSave, style}) => {
  const [editing,setEditing] = useState(false);
  const [val,setVal]         = useState(value);
  const ref                  = useRef();
  useEffect(()=>{ if(editing) ref.current?.focus(); },[editing]);
  useEffect(()=>setVal(value),[value]);
  if(!editing) return <span style={{cursor:"text",...style}} onDoubleClick={()=>setEditing(true)} title="Double-click to edit">{value||<em style={{color:"#9CA3AF"}}>Untitled</em>}</span>;
  return <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
    onBlur={()=>{onSave(val);setEditing(false);}}
    onKeyDown={e=>{if(e.key==="Enter"){onSave(val);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
    style={{border:"1.5px solid #4F46E5",borderRadius:6,padding:"2px 6px",fontSize:"inherit",fontFamily:"inherit",color:"inherit",outline:"none",width:"100%",...style}}
  />;
};

// Tag picker dropdown
const TagPicker = ({availableTags, selectedIds, onToggle, tagColorMap, onClose}) => {
  const ref = useRef();
  useEffect(()=>{
    const h = (e) => { if(ref.current&&!ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div ref={ref} style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:200,background:"#fff",border:"1px solid rgba(0,0,0,.12)",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",padding:"8px",minWidth:200,maxHeight:240,overflowY:"auto"}}>
      <div style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#9CA3AF",padding:"4px 6px 8px"}}>Select tags</div>
      {availableTags.length===0&&<div style={{fontSize:12,color:"#9CA3AF",padding:"6px"}}>No tags available</div>}
      {availableTags.map(tag=>{
        const tc=tagColorMap[tag._id]??TAG_COLORS[0];
        const checked=selectedIds.includes(tag._id);
        return (
          <div key={tag._id} onClick={()=>onToggle(tag._id)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,cursor:"pointer",background:checked?"#F5F3FF":"transparent",transition:"background .15s"}}
            onMouseEnter={e=>{if(!checked)e.currentTarget.style.background="#F9FAFB"}}
            onMouseLeave={e=>{if(!checked)e.currentTarget.style.background="transparent"}}
          >
            <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checked?"#4F46E5":"#D1D5DB"}`,background:checked?"#4F46E5":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {checked&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:12,padding:"2px 8px",borderRadius:20,background:tc.bg,color:tc.color,fontWeight:500}}>{tag.name}</span>
          </div>
        );
      })}
    </div>
  );
};

// Save status badge
const SaveStatus = ({status}) => {
  const map = {
    idle:    null,
    saving:  {bg:"#EEF2FF",color:"#4338CA",text:"Saving…"},
    saved:   {bg:"#DCFCE7",color:"#166534",text:"✓ Saved"},
    error:   {bg:"#FEE2E2",color:"#991B1B",text:"Save failed"},
  };
  const s = map[status];
  if(!s) return null;
  return <span style={{fontSize:11,fontWeight:500,padding:"3px 10px",borderRadius:20,background:s.bg,color:s.color,transition:"all .3s"}}>{s.text}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function OBEAchievementCalculator() {
  // ── taxonomy from API ──
  const [tags,     setTags]     = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [families, setFamilies] = useState([]);

  // ── items from API (persisted in MongoDB) ──
  const [items,   setItems]   = useState([]);
  const [scores,  setScores]  = useState({});

  // ── loading states ──
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [loadingItems,    setLoadingItems]    = useState(true);
  const [taxonomyError,   setTaxonomyError]   = useState(null);
  const [itemsError,      setItemsError]      = useState(null);

  // ── per-row save status ──
  const [saveStatus, setSaveStatus] = useState({}); // { [itemId]: "idle"|"saving"|"saved"|"error" }

  // ── picker open state ──
  const [pickerOpen, setPickerOpen] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH TAXONOMY (tags / groups / families)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchTaxonomy = useCallback(async () => {
    setLoadingTaxonomy(true); setTaxonomyError(null);
    try {
      const arr = (r) => Array.isArray(r) ? r : (r.data ?? []);
      const [rawT,rawG,rawF] = await Promise.all([
        api.get("/tags"),
        api.get("/groups"),
        api.get("/families"),
      ]);
      setTags(arr(rawT).map(normalizeTag));
      setGroups(arr(rawG).map(normalizeGroup));
      setFamilies(arr(rawF).map(normalizeFamily));
    } catch(e) { setTaxonomyError(e.message); }
    finally { setLoadingTaxonomy(false); }
  },[]);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH ITEMS from MongoDB  →  GET /api/items
  // ─────────────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoadingItems(true); setItemsError(null);
    try {
      const raw = await api.get("/items");
      const arr = Array.isArray(raw) ? raw : (raw.data ?? []);
      const normalized = arr.map(normalizeItem);
      setItems(normalized);
      setScores(Object.fromEntries(normalized.map(i=>[i._id, i.score])));
    } catch(e) { setItemsError(e.message); }
    finally { setLoadingItems(false); }
  },[]);

  useEffect(()=>{ fetchTaxonomy(); fetchItems(); },[fetchTaxonomy, fetchItems]);

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE HELPERS — debounced per item
  // ─────────────────────────────────────────────────────────────────────────
  const saveTimers = useRef({});

  const triggerSave = useCallback((item) => {
    const id = item._id;
    setSaveStatus(prev=>({...prev,[id]:"saving"}));
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      try {
        // PUT /api/items/:id  — send the full updated item back
        await api.put(`/items/${id}`, {
          label:  item.label,
          score:  item.score,
          tags:   item.tagIds,   // array of tag ObjectId strings
          itemCode: item.id,
        });
        setSaveStatus(prev=>({...prev,[id]:"saved"}));
        // Clear "saved" badge after 2s
        setTimeout(()=>setSaveStatus(prev=>({...prev,[id]:"idle"})), 2000);
      } catch(e) {
        setSaveStatus(prev=>({...prev,[id]:"error"}));
      }
    }, 600); // debounce 600ms — waits for user to stop dragging
  },[]);

  // ─────────────────────────────────────────────────────────────────────────
  // ITEM CRUD — each mutation calls the API and updates local state
  // ─────────────────────────────────────────────────────────────────────────

  // ADD — POST /api/items
  const handleAddItem = useCallback(async () => {
    const newItemData = { label:"New question", score:70, tags:[], itemCode:`Q${Date.now()}` };
    setSaveStatus(prev=>({...prev,_new:"saving"}));
    try {
      const created = await api.post("/items", newItemData);
      const normalized = normalizeItem(created.data ?? created);
      setItems(prev=>[...prev, normalized]);
      setScores(prev=>({...prev,[normalized._id]:normalized.score}));
      setSaveStatus(prev=>({...prev,_new:"idle"}));
    } catch(e) {
      setSaveStatus(prev=>({...prev,_new:"error"}));
      alert(`Failed to create item: ${e.message}`);
    }
  },[]);

  // UPDATE label — PUT /api/items/:id
  const handleLabelChange = useCallback((id, val) => {
    setItems(prev => {
      const next = prev.map(i => i._id===id ? {...i,label:val} : i);
      const updated = next.find(i=>i._id===id);
      if(updated) triggerSave({...updated, score: scores[id] ?? updated.score});
      return next;
    });
  },[scores, triggerSave]);

  // UPDATE score — PUT /api/items/:id  (debounced)
  const handleScoreChange = useCallback((id, val) => {
    setScores(prev=>({...prev,[id]:val}));
    setItems(prev=>{
      const updated = prev.find(i=>i._id===id);
      if(updated) triggerSave({...updated, score:val});
      return prev;
    });
  },[triggerSave]);

  // UPDATE tags — PUT /api/items/:id
  const handleTagsChange = useCallback((id, tagIds) => {
    setItems(prev=>{
      const next = prev.map(i => i._id===id ? {...i,tagIds} : i);
      const updated = next.find(i=>i._id===id);
      if(updated) triggerSave({...updated, score: scores[id] ?? updated.score});
      return next;
    });
  },[scores, triggerSave]);

  // DELETE — DELETE /api/items/:id
  const handleDeleteItem = useCallback(async (id) => {
    if(!window.confirm("Delete this item? This cannot be undone.")) return;
    setSaveStatus(prev=>({...prev,[id]:"saving"}));
    try {
      await api.delete(`/items/${id}`);
      setItems(prev=>prev.filter(i=>i._id!==id));
      setScores(prev=>{ const n={...prev}; delete n[id]; return n; });
    } catch(e) { alert(`Failed to delete: ${e.message}`); setSaveStatus(prev=>({...prev,[id]:"error"})); }
  },[]);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────────────────────────────────
  const tagById     = Object.fromEntries(tags.map(t=>[t._id,t]));
  const groupById   = Object.fromEntries(groups.map(g=>[g._id,g]));
  const tagColorMap = Object.fromEntries(tags.map((t,i)=>[t._id,TAG_COLORS[i%TAG_COLORS.length]]));

  const tagScores    = tags.map(t    =>({...t,    score:calcTagScore(t._id,items,scores)}));
  const groupScores  = groups.map(g  =>({...g,    score:calcGroupScore(g,items,scores)}));
  const familyScores = families.map(f=>({...f,    score:calcFamilyScore(f,items,scores,groupById)}));

  const loading = loadingTaxonomy || loadingItems;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#F3F4F6",minHeight:"100vh",paddingBottom:60}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)",padding:"2.5rem 2.5rem 2rem",marginBottom:"1.5rem",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
        <div style={{position:"absolute",bottom:-70,right:80,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{maxWidth:920,margin:"0 auto",position:"relative"}}>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {["tag-management-system","MongoDB","Live API","Persistent"].map(b=>(
              <span key={b} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:500}}>{b}</span>
            ))}
            <span style={{display:"flex",alignItems:"center",gap:5,background:"rgba(22,163,74,.2)",border:"1px solid rgba(22,163,74,.4)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:500}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:loading?"#D97706":taxonomyError||itemsError?"#DC2626":"#16A34A",display:"inline-block"}}/>
              {loading?"Loading…":taxonomyError||itemsError?"Error":"Live"}
            </span>
          </div>
          <h1 style={{fontSize:"1.9rem",fontWeight:700,lineHeight:1.2,marginBottom:8}}>OBE Achievement Calculator</h1>
          <p style={{fontSize:13,opacity:.75,maxWidth:580,lineHeight:1.6}}>
            Items are stored in MongoDB. Add, edit or delete items — changes are saved automatically to <code style={{background:"rgba(255,255,255,.12)",padding:"1px 6px",borderRadius:4,fontSize:12}}>{API_BASE}/items</code> and survive page refresh.
          </p>
          <div style={{display:"flex",gap:12,marginTop:20,flexWrap:"wrap"}}>
            {[["Tags",tags.length],["Groups",groups.length],["Families",families.length],["Items",items.length]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,.1)",borderRadius:10,padding:"8px 18px",textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:700}}>{loading?"…":v}</div>
                <div style={{fontSize:11,opacity:.7}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"0 1rem"}}>

        {/* Errors */}
        {(taxonomyError||itemsError) && (
          <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"1rem 1.25rem",marginBottom:"1.5rem"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#DC2626",marginBottom:4}}>API Error</div>
            {taxonomyError&&<div style={{fontSize:12,color:"#991B1B",marginBottom:2}}>Taxonomy: {taxonomyError}</div>}
            {itemsError&&<div style={{fontSize:12,color:"#991B1B"}}>Items: {itemsError} — make sure <code style={{background:"#FEE2E2",padding:"1px 4px",borderRadius:4}}>/api/items</code> route exists</div>}
            <button onClick={()=>{fetchTaxonomy();fetchItems();}} style={{marginTop:10,background:"#DC2626",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Retry</button>
          </div>
        )}

        {/* Data flow explainer */}
        <div style={{background:"#fff",borderRadius:16,border:".5px solid rgba(0,0,0,.09)",padding:"1.25rem 1.5rem",marginBottom:"1.5rem"}}>
          <SectionTitle>Data flow</SectionTitle>
          <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap"}}>
            {[
              {icon:"💾",title:"Items saved to MongoDB",    desc:"Every add / edit / delete calls your /api/items endpoint instantly"},
              {icon:"🔄",title:"Auto-save on change",       desc:"Score slider and label edits are debounced 600ms then saved automatically"},
              {icon:"✅",title:"Survives page refresh",     desc:"On load the component fetches all items fresh from your database"},
              {icon:"🔗",title:"Tags linked by ObjectId",   desc:"Each item stores an array of tag _ids — resolved live into names"},
            ].map(c=>(
              <div key={c.title} style={{display:"flex",gap:10,alignItems:"flex-start",minWidth:180,flex:1}}>
                <span style={{fontSize:20,flexShrink:0}}>{c.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:2}}>{c.title}</div>
                  <div style={{fontSize:11,color:"#6B7280",lineHeight:1.5}}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend setup hint */}
        <div style={{background:"#0F172A",borderRadius:14,padding:"1.25rem 1.5rem",marginBottom:"1.5rem"}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:"#38BDF8",marginBottom:10}}>Required backend routes</div>
          {[
            {method:"GET",    color:"#4ADE80", path:"/api/items",     desc:"Return all items from DB"},
            {method:"POST",   color:"#60A5FA", path:"/api/items",     desc:"Create new item, return saved doc"},
            {method:"PUT",    color:"#FBBF24", path:"/api/items/:id", desc:"Update label / score / tags"},
            {method:"DELETE", color:"#F87171", path:"/api/items/:id", desc:"Delete item permanently"},
          ].map(ep=>(
            <div key={ep.method+ep.path} style={{display:"flex",alignItems:"center",gap:10,fontSize:12,marginBottom:6}}>
              <span style={{background:"rgba(255,255,255,.08)",color:ep.color,borderRadius:6,padding:"2px 8px",fontFamily:"monospace",fontWeight:700,fontSize:11,minWidth:52,textAlign:"center"}}>{ep.method}</span>
              <span style={{fontFamily:"monospace",color:"#C7D2FE"}}>{API_BASE}{ep.path}</span>
              <span style={{color:"#6B7280",fontSize:11}}>— {ep.desc}</span>
            </div>
          ))}
        </div>

        {/* ── ITEMS TABLE ── */}
        <div style={{background:"#fff",borderRadius:16,border:".5px solid rgba(0,0,0,.09)",padding:"1.5rem",marginBottom:"1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <SectionTitle>Assessment items</SectionTitle>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <SaveStatus status={saveStatus._new}/>
              <button onClick={handleAddItem}
                style={{display:"flex",alignItems:"center",gap:6,background:"#4F46E5",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"opacity .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >＋ Add item</button>
            </div>
          </div>

          {loadingItems ? (
            <div style={{padding:"2rem",textAlign:"center",color:"#9CA3AF",fontSize:13}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8}}>
                <div style={{width:16,height:16,border:"2px solid #E5E7EB",borderTop:"2px solid #4F46E5",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                Loading items from MongoDB…
              </div>
            </div>
          ) : itemsError ? (
            <div style={{padding:"1.5rem",textAlign:"center"}}>
              <div style={{fontSize:13,color:"#DC2626",marginBottom:8}}>Could not load items</div>
              <div style={{fontSize:11,color:"#6B7280",marginBottom:12}}>Make sure <code style={{background:"#F3F4F6",padding:"1px 5px",borderRadius:4}}>/api/items</code> GET route exists in your Express app</div>
              <button onClick={fetchItems} style={{background:"#4F46E5",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Retry</button>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
                <thead>
                  <tr>{["#","Question","Tags","Score","Adjust","Status",""].map(h=>(
                    <th key={h} style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#9CA3AF",padding:"0 10px 10px 0",textAlign:"left",borderBottom:"1px solid rgba(0,0,0,.08)",whiteSpace:"nowrap"}}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {items.map((item,idx)=>(
                    <tr key={item._id} style={{borderBottom:".5px solid rgba(0,0,0,.05)"}}>

                      {/* Index */}
                      <td style={{padding:"10px 10px 10px 0",verticalAlign:"middle"}}>
                        <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,background:"#F5F3FF",borderRadius:8,padding:"4px 10px",color:"#4F46E5"}}>{item.id||`#${idx+1}`}</span>
                      </td>

                      {/* Editable label */}
                      <td style={{padding:"10px 10px 10px 0",verticalAlign:"middle",minWidth:160}}>
                        <InlineEdit value={item.label} onSave={val=>handleLabelChange(item._id,val)} style={{fontSize:13,color:"#374151"}}/>
                        <div style={{fontSize:10,color:"#C4B5FD",marginTop:1}}>double-click to edit</div>
                      </td>

                      {/* Tags multi-select */}
                      <td style={{padding:"10px 10px 10px 0",verticalAlign:"middle",minWidth:160}}>
                        <div style={{position:"relative",display:"inline-block"}}>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                            {item.tagIds.map(tid=>{
                              const tag=tagById[tid]; const tc=tagColorMap[tid]??TAG_COLORS[0];
                              return tag?(
                                <span key={tid} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,padding:"3px 4px 3px 8px",borderRadius:20,fontWeight:500,background:tc.bg,color:tc.color}}>
                                  {tag.name}
                                  <span onClick={()=>handleTagsChange(item._id,item.tagIds.filter(t=>t!==tid))} style={{cursor:"pointer",fontSize:12,lineHeight:1,opacity:.6,fontWeight:700}} title="Remove">×</span>
                                </span>
                              ):null;
                            })}
                            <button onClick={()=>setPickerOpen(pickerOpen===item._id?null:item._id)}
                              style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:"1.5px dashed #D1D5DB",background:"none",cursor:"pointer",color:"#6B7280",transition:"border-color .15s,color .15s"}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor="#4F46E5";e.currentTarget.style.color="#4F46E5"}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor="#D1D5DB";e.currentTarget.style.color="#6B7280"}}
                            >＋ tag</button>
                          </div>
                          {pickerOpen===item._id&&(
                            <TagPicker availableTags={tags} selectedIds={item.tagIds} tagColorMap={tagColorMap}
                              onToggle={tid=>{
                                const next=item.tagIds.includes(tid)?item.tagIds.filter(t=>t!==tid):[...item.tagIds,tid];
                                handleTagsChange(item._id,next);
                              }}
                              onClose={()=>setPickerOpen(null)}
                            />
                          )}
                        </div>
                      </td>

                      {/* Score */}
                      <td style={{padding:"10px 10px 10px 0",verticalAlign:"middle",minWidth:52}}>
                        <span style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:getColor(scores[item._id]),transition:"color .3s"}}>{scores[item._id]??0}%</span>
                      </td>

                      {/* Slider */}
                      <td style={{padding:"10px 10px 10px 0",verticalAlign:"middle",minWidth:140}}>
                        <input type="range" min={0} max={100} step={1} value={scores[item._id]??0}
                          onChange={e=>handleScoreChange(item._id,parseInt(e.target.value))}
                          style={{width:"100%",accentColor:"#4F46E5",cursor:"pointer"}}
                        />
                      </td>

                      {/* Save status */}
                      <td style={{padding:"10px 10px 10px 0",verticalAlign:"middle",minWidth:70}}>
                        <SaveStatus status={saveStatus[item._id]??"idle"}/>
                      </td>

                      {/* Delete */}
                      <td style={{padding:"10px 0",verticalAlign:"middle"}}>
                        <button onClick={()=>handleDeleteItem(item._id)} title="Delete item"
                          style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:"#DC2626",fontSize:14,transition:"background .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#FEE2E2"}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}
                        >🗑</button>
                      </td>
                    </tr>
                  ))}
                  {items.length===0&&(
                    <tr><td colSpan={7} style={{padding:"2rem",textAlign:"center",color:"#9CA3AF",fontSize:13}}>
                      No items yet. Click <strong>＋ Add item</strong> to add your first assessment item.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tag Achievement */}
        <SectionTitle>Tag achievement <span style={{fontWeight:400,fontSize:12,textTransform:"none",letterSpacing:0,color:"#9CA3AF"}}>&nbsp;= avg of items mapped to this tag</span></SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:"1.5rem"}}>
          {loadingTaxonomy?Array(4).fill(0).map((_,i)=><SkeletonCard key={i}/>)
          :tagScores.map(tag=>{
            const tc=tagColorMap[tag._id]??TAG_COLORS[0];
            const mapped=itemsForTag(tag._id,items).map(i=>i.id||"?").join(", ")||"none";
            return <AchCard key={tag._id} name={tag.name} score={tag.score} sub={`Items: ${mapped}`} accent={tc.color}/>;
          })}
        </div>

        {/* Group Achievement */}
        <SectionTitle>Group achievement <span style={{fontWeight:400,fontSize:12,textTransform:"none",letterSpacing:0,color:"#9CA3AF"}}>&nbsp;= avg of its tags' scores</span></SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:"1.5rem"}}>
          {loadingTaxonomy?Array(4).fill(0).map((_,i)=><SkeletonCard key={i}/>)
          :groupScores.map(grp=>{
            const tagNames=grp.tags.map(tid=>tagById[tid]?.name).filter(Boolean).join(", ")||"—";
            return <AchCard key={grp._id} name={grp.name} score={grp.score} sub={`Tags: ${tagNames}`}/>;
          })}
        </div>

        {/* Family Achievement */}
        <SectionTitle>Family achievement <span style={{fontWeight:400,fontSize:12,textTransform:"none",letterSpacing:0,color:"#9CA3AF"}}>&nbsp;= avg of its groups' scores</span></SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:"1.5rem"}}>
          {loadingTaxonomy?Array(3).fill(0).map((_,i)=><SkeletonCard key={i}/>)
          :familyScores.map(fam=>{
            const grpNames=fam.groups.map(gid=>groupById[gid]?.name).filter(Boolean).join(", ")||"—";
            return <AchCard key={fam._id} name={fam.name} score={fam.score} sub={`Groups: ${grpNames}`}/>;
          })}
        </div>

        {/* Charts */}
        {!loading && (
          <div style={{background:"#fff",borderRadius:16,border:".5px solid rgba(0,0,0,.09)",padding:"1.5rem",marginBottom:"1.5rem"}}>
            <SectionTitle>Visual comparison</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem"}}>
              {[
                {title:"Item scores",        labels:items.map(i=>i.id||"?"),                      values:items.map(i=>scores[i._id]??0)},
                {title:"Tag achievement",    labels:tagScores.map(t=>t.name.split(" ")[0]),        values:tagScores.map(t=>t.score)},
                {title:"Group achievement",  labels:groupScores.map(g=>g.name.split(" ")[0]),      values:groupScores.map(g=>g.score)},
                {title:"Family achievement", labels:familyScores.map(f=>f.name),                  values:familyScores.map(f=>f.score)},
              ].map(({title,labels,values})=>{
                const BAR_AREA=140;
                return (
                  <div key={title}>
                    <div style={{fontSize:12,color:"#6B7280",marginBottom:6,fontWeight:500}}>{title}</div>
                    <div style={{display:"flex",gap:4,marginBottom:4}}>
                      {labels.map((lbl,i)=>{
                        const v=values[i]; const c=getColor(v);
                        return <div key={lbl} style={{flex:1,textAlign:"center",fontSize:9,fontWeight:700,color:c}}>{v===null?"—":`${v}%`}</div>;
                      })}
                    </div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:BAR_AREA,background:"#F8FAFC",borderRadius:8,padding:"0 4px",position:"relative"}}>
                      {[25,50,75].map(pct=>(
                        <div key={pct} style={{position:"absolute",left:0,right:0,bottom:`${pct*BAR_AREA/100}px`,height:1,background:"rgba(0,0,0,.05)",zIndex:0}}/>
                      ))}
                      {labels.map((lbl,i)=>{
                        const v=values[i];
                        const barH=v===null?4:Math.max(4,Math.round((v/100)*BAR_AREA));
                        const c=getColor(v);
                        return <div key={lbl} style={{flex:1,height:barH,background:c,borderRadius:"4px 4px 0 0",transition:"height .5s cubic-bezier(.4,0,.2,1),background .4s",position:"relative",zIndex:1}}/>;
                      })}
                    </div>
                    <div style={{display:"flex",gap:4,marginTop:6}}>
                      {labels.map(lbl=>(
                        <div key={lbl} style={{flex:1,textAlign:"center",fontSize:9,color:"#9CA3AF",lineHeight:1.3,wordBreak:"break-word"}}>{lbl}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          {[["≥ 70% — Good","#DCFCE7","#166534"],["50–69% — Moderate","#FEF3C7","#92400E"],["< 50% — Needs improvement","#FEE2E2","#991B1B"],["No items mapped","#F3F4F6","#6B7280"]].map(([label,bg,color])=>(
            <span key={label} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#6B7280"}}>
              <span style={{width:10,height:10,borderRadius:2,background:bg,border:`1px solid ${color}`,display:"inline-block"}}/>
              {label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}