import { useState, useEffect, useCallback, useRef } from "react";



const API_BASE = "http://localhost:5000/api";



const extractId = (ref) =>
  typeof ref === "object" && ref !== null
    ? ref._id?.toString()
    : ref?.toString();
const extractIds = (arr) =>
  Array.isArray(arr) ? arr.map(extractId).filter(Boolean) : [];
const normalizeTag = (t) => ({ ...t, _id: extractId(t._id) });
const normalizeGroup = (g) => ({
  ...g,
  _id: extractId(g._id),
  tags: extractIds(g.tags ?? g.tagIds ?? []),
});
const normalizeFamily = (f) => ({
  ...f,
  _id: extractId(f._id),
  groups: extractIds(f.groups ?? f.groupIds ?? []),
});

// ─────────────────────────────────────────────────────────────────────────────
// SCORE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
const avg = (arr) =>
  arr.length === 0
    ? 0
    : Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
const itemsForTag = (tagId, items) =>
  items.filter((i) => i.tagIds.includes(tagId));
const calcTagScore = (tagId, items, scores) => {
  const its = itemsForTag(tagId, items);
  return its.length === 0 ? null : avg(its.map((i) => scores[i.id]));
};
const calcGroupScore = (group, items, scores) => {
  const ts = group.tags
    .map((tid) => calcTagScore(tid, items, scores))
    .filter((v) => v !== null);
  return ts.length === 0 ? null : avg(ts);
};
const calcFamilyScore = (family, items, scores, groupById) => {
  const gs = family.groups
    .map((gid) => groupById[gid])
    .filter(Boolean)
    .map((g) => calcGroupScore(g, items, scores))
    .filter((v) => v !== null);
  return gs.length === 0 ? null : avg(gs);
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getColor = (v) =>
  v === null
    ? "#9CA3AF"
    : v >= 70
      ? "#16A34A"
      : v >= 50
        ? "#D97706"
        : "#DC2626";
const getBadgeStyle = (v) =>
  v === null
    ? { bg: "#F3F4F6", color: "#6B7280" }
    : v >= 70
      ? { bg: "#DCFCE7", color: "#166534" }
      : v >= 50
        ? { bg: "#FEF3C7", color: "#92400E" }
        : { bg: "#FEE2E2", color: "#991B1B" };
const getBadgeLabel = (v) =>
  v === null
    ? "No data"
    : v >= 70
      ? "Good"
      : v >= 50
        ? "Moderate"
        : "Needs work";

const TAG_COLORS = [
  { bg: "#EEF2FF", color: "#4338CA" },
  { bg: "#F3E8FF", color: "#7C3AED" },
  { bg: "#CCFBF1", color: "#0F766E" },
  { bg: "#FFE4E6", color: "#BE123C" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#F0FDF4", color: "#15803D" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#9CA3AF",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,.08)" }} />
  </div>
);

const AnimatedBar = ({ pct, color }) => (
  <div
    style={{
      height: 5,
      background: "#F1F5F9",
      borderRadius: 3,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: "100%",
        borderRadius: 3,
        width: pct === null ? "0%" : `${pct}%`,
        background: color,
        transition: "width .5s cubic-bezier(.4,0,.2,1),background .4s",
      }}
    />
  </div>
);

const Badge = ({ value }) => {
  const s = getBadgeStyle(value);
  return (
    <span
      style={{
        display: "inline-flex",
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 10,
        letterSpacing: ".5px",
        textTransform: "uppercase",
        marginLeft: 6,
        background: s.bg,
        color: s.color,
      }}
    >
      {getBadgeLabel(value)}
    </span>
  );
};

const AchCard = ({ name, score, sub, accent }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      border:
        score !== null && score >= 70
          ? "1.5px solid #BBF7D0"
          : ".5px solid rgba(0,0,0,.09)",
      padding: "1rem 1.1rem",
      transition: "transform .2s,box-shadow .2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.08)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "";
      e.currentTarget.style.boxShadow = "";
    }}
  >
    {accent && (
      <div
        style={{
          width: 24,
          height: 4,
          borderRadius: 2,
          background: accent,
          marginBottom: 8,
        }}
      />
    )}
    <div
      style={{
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 4,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {name}
      <Badge value={score} />
    </div>
    <div
      style={{
        fontSize: 11,
        color: "#6B7280",
        marginBottom: 8,
        lineHeight: 1.5,
      }}
    >
      {sub}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 600,
        color: getColor(score),
        marginBottom: 6,
        transition: "color .4s",
      }}
    >
      {score === null ? "—" : `${score}%`}
    </div>
    <AnimatedBar pct={score} color={getColor(score)} />
  </div>
);

const SkeletonCard = () => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      border: ".5px solid rgba(0,0,0,.09)",
      padding: "1rem 1.1rem",
    }}
  >
    {[80, 60, 40, "100%"].map((w, i) => (
      <div
        key={i}
        style={{
          height: i === 3 ? 5 : 12,
          width: typeof w === "number" ? `${w}%` : w,
          background: "#F1F5F9",
          borderRadius: 6,
          marginBottom: i === 3 ? 0 : 8,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    ))}
  </div>
);

// Icon buttons
const IconBtn = ({ onClick, title, children, danger }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px 6px",
      borderRadius: 6,
      color: danger ? "#DC2626" : "#6B7280",
      fontSize: 14,
      lineHeight: 1,
      transition: "background .15s",
      display: "inline-flex",
      alignItems: "center",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.background = danger ? "#FEE2E2" : "#F1F5F9")
    }
    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
  >
    {children}
  </button>
);

// Inline editable text
const InlineEdit = ({ value, onSave, style }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef();
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useEffect(() => setVal(value), [value]);
  if (!editing)
    return (
      <span
        style={{ cursor: "text", ...style }}
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {value}
      </span>
    );
  return (
    <input
      ref={ref}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        onSave(val);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSave(val);
          setEditing(false);
        }
        if (e.key === "Escape") setEditing(false);
      }}
      style={{
        border: "1.5px solid #4F46E5",
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: "inherit",
        fontFamily: "inherit",
        fontWeight: "inherit",
        color: "inherit",
        outline: "none",
        width: "100%",
        background: "#fff",
        ...style,
      }}
    />
  );
};

// Tag dropdown picker
const TagPicker = ({
  availableTags,
  selectedIds,
  onToggle,
  tagColorMap,
  onClose,
}) => {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        zIndex: 100,
        background: "#fff",
        border: "1px solid rgba(0,0,0,.12)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,.12)",
        padding: "8px",
        minWidth: 200,
        maxHeight: 240,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#9CA3AF",
          padding: "4px 6px 8px",
        }}
      >
        Select tags
      </div>
      {availableTags.length === 0 && (
        <div style={{ fontSize: 12, color: "#9CA3AF", padding: "6px" }}>
          No tags available
        </div>
      )}
      {availableTags.map((tag) => {
        const tc = tagColorMap[tag._id] ?? TAG_COLORS[0];
        const checked = selectedIds.includes(tag._id);
        return (
          <div
            key={tag._id}
            onClick={() => onToggle(tag._id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 8,
              cursor: "pointer",
              background: checked ? "#F5F3FF" : "transparent",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => {
              if (!checked) e.currentTarget.style.background = "#F9FAFB";
            }}
            onMouseLeave={(e) => {
              if (!checked) e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `1.5px solid ${checked ? "#4F46E5" : "#D1D5DB"}`,
                background: checked ? "#4F46E5" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {checked && (
                <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>
                  ✓
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 20,
                background: tc.bg,
                color: tc.color,
                fontWeight: 500,
              }}
            >
              {tag.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE ITEMS TABLE
// ─────────────────────────────────────────────────────────────────────────────
const EditableItemsTable = ({
  items,
  scores,
  tags,
  tagColorMap,
  onScoreChange,
  onLabelChange,
  onAddItem,
  onDeleteItem,
  onTagsChange,
}) => {
  const [pickerOpen, setPickerOpen] = useState(null); // item id with open picker

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: ".5px solid rgba(0,0,0,.09)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <SectionTitle>Assessment items</SectionTitle>
        <button
          onClick={onAddItem}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#4F46E5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          ＋ Add item
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}
        >
          <thead>
            <tr>
              {[
                "Item",
                "Question (double-click to edit)",
                "Tags",
                "Score",
                "Adjust",
                "",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "#9CA3AF",
                    padding: "0 10px 10px 0",
                    textAlign: "left",
                    borderBottom: "1px solid rgba(0,0,0,.08)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                style={{ borderBottom: ".5px solid rgba(0,0,0,.05)" }}
              >
                {/* Item label */}
                <td
                  style={{
                    padding: "10px 10px 10px 0",
                    verticalAlign: "middle",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      background: "#F5F3FF",
                      borderRadius: 8,
                      padding: "4px 10px",
                      color: "#4F46E5",
                    }}
                  >
                    {item.id}
                  </span>
                </td>

                {/* Editable question */}
                <td
                  style={{
                    padding: "10px 10px 10px 0",
                    verticalAlign: "middle",
                    minWidth: 160,
                  }}
                >
                  <InlineEdit
                    value={item.label}
                    onSave={(val) => onLabelChange(item.id, val)}
                    style={{ fontSize: 13, color: "#374151" }}
                  />
                  <div style={{ fontSize: 10, color: "#C4B5FD", marginTop: 2 }}>
                    double-click to edit
                  </div>
                </td>

                {/* Tags — multi-select via dropdown */}
                <td
                  style={{
                    padding: "10px 10px 10px 0",
                    verticalAlign: "middle",
                    minWidth: 160,
                  }}
                >
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      {item.tagIds.map((tid) => {
                        const tag = tags.find((t) => t._id === tid);
                        const tc = tagColorMap[tid] ?? TAG_COLORS[0];
                        return tag ? (
                          <span
                            key={tid}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              padding: "3px 4px 3px 8px",
                              borderRadius: 20,
                              fontWeight: 500,
                              background: tc.bg,
                              color: tc.color,
                            }}
                          >
                            {tag.name}
                            <span
                              onClick={() =>
                                onTagsChange(
                                  item.id,
                                  item.tagIds.filter((t) => t !== tid),
                                )
                              }
                              style={{
                                cursor: "pointer",
                                fontSize: 12,
                                lineHeight: 1,
                                opacity: 0.6,
                                fontWeight: 700,
                              }}
                              title="Remove tag"
                            >
                              ×
                            </span>
                          </span>
                        ) : null;
                      })}
                      <button
                        onClick={() =>
                          setPickerOpen(pickerOpen === item.id ? null : item.id)
                        }
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 20,
                          border: "1.5px dashed #D1D5DB",
                          background: "none",
                          cursor: "pointer",
                          color: "#6B7280",
                          transition: "border-color .15s,color .15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#4F46E5";
                          e.currentTarget.style.color = "#4F46E5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#D1D5DB";
                          e.currentTarget.style.color = "#6B7280";
                        }}
                      >
                        ＋ tag
                      </button>
                    </div>
                    {pickerOpen === item.id && (
                      <TagPicker
                        availableTags={tags}
                        selectedIds={item.tagIds}
                        tagColorMap={tagColorMap}
                        onToggle={(tid) => {
                          const next = item.tagIds.includes(tid)
                            ? item.tagIds.filter((t) => t !== tid)
                            : [...item.tagIds, tid];
                          onTagsChange(item.id, next);
                        }}
                        onClose={() => setPickerOpen(null)}
                      />
                    )}
                  </div>
                </td>

                {/* Score */}
                <td
                  style={{
                    padding: "10px 10px 10px 0",
                    verticalAlign: "middle",
                    minWidth: 52,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      color: getColor(scores[item.id]),
                      transition: "color .3s",
                    }}
                  >
                    {scores[item.id]}%
                  </span>
                </td>

                {/* Slider */}
                <td
                  style={{
                    padding: "10px 10px 10px 0",
                    verticalAlign: "middle",
                    minWidth: 140,
                  }}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={scores[item.id]}
                    onChange={(e) =>
                      onScoreChange(item.id, parseInt(e.target.value))
                    }
                    style={{
                      width: "100%",
                      accentColor: "#4F46E5",
                      cursor: "pointer",
                    }}
                  />
                </td>

                {/* Delete */}
                <td style={{ padding: "10px 0", verticalAlign: "middle" }}>
                  <IconBtn
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete item"
                    danger
                  >
                    🗑
                  </IconBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#9CA3AF",
              fontSize: 13,
            }}
          >
            No items yet. Click <strong>＋ Add item</strong> to get started.
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
let _itemCounter = 6;

export default function AnalyticsDashboard({ onClose }) {
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable items
  const [items, setItems] = useState([
    { id: "Q1", label: "Stack operations", tagIds: [], score: 88 },
    { id: "Q2", label: "Queue traversal", tagIds: [], score: 68 },
    { id: "Q3", label: "Pointer arithmetic", tagIds: [], score: 78 },
    { id: "Q4", label: "Algorithm complexity", tagIds: [], score: 58 },
    { id: "Q5", label: "Sorting algorithms", tagIds: [], score: 98 },
    { id: "Q6", label: "DSA", tagIds: [], score: 98 },
  ]);
  const [scores, setScores] = useState(
    Object.fromEntries(items.map((i) => [i.id, i.score])),
  );

  // ── Fetch tags/groups/families from API ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tR, gR, fR] = await Promise.all([
        fetch(`${API_BASE}/tags`),
        fetch(`${API_BASE}/groups`),
        fetch(`${API_BASE}/families`),
      ]);
      if (!tR.ok) throw new Error(`Tags ${tR.status}`);
      if (!gR.ok) throw new Error(`Groups ${gR.status}`);
      if (!fR.ok) throw new Error(`Families ${fR.status}`);

      const [rawT, rawG, rawF] = await Promise.all([
        tR.json(),
        gR.json(),
        fR.json(),
      ]);
      const arr = (r) => (Array.isArray(r) ? r : (r.data ?? []));

      const normTags = arr(rawT).map(normalizeTag);
      const normGroups = arr(rawG).map(normalizeGroup);
      const normFamilies = arr(rawF).map(normalizeFamily);

      setTags(normTags);
      setGroups(normGroups);
      setFamilies(normFamilies);

      // Auto-assign first available tag to demo items that have no tags yet
      if (normTags.length > 0) {
        const ids = normTags.map((t) => t._id);
        setItems((prev) =>
          prev.map((item, i) => ({
            ...item,
            tagIds:
              item.tagIds.length > 0
                ? item.tagIds
                : ids.slice(i % ids.length, (i % ids.length) + 1 + (i % 2)),
          })),
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Item CRUD ──
  const handleScoreChange = useCallback((id, val) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleLabelChange = useCallback((id, val) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, label: val } : i)),
    );
  }, []);

  const handleTagsChange = useCallback((id, tagIds) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, tagIds } : i)));
  }, []);

  const handleAddItem = useCallback(() => {
    _itemCounter++;
    const id = `Q${_itemCounter}`;
    const newItem = { id, label: "New question", tagIds: [], score: 70 };
    setItems((prev) => [...prev, newItem]);
    setScores((prev) => ({ ...prev, [id]: 70 }));
  }, []);

  const handleDeleteItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setScores((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }, []);

  // ── Lookups & computations ──
  const tagById = Object.fromEntries(tags.map((t) => [t._id, t]));
  const groupById = Object.fromEntries(groups.map((g) => [g._id, g]));
  const tagColorMap = Object.fromEntries(
    tags.map((t, i) => [t._id, TAG_COLORS[i % TAG_COLORS.length]]),
  );

  const tagScores = tags.map((t) => ({
    ...t,
    score: calcTagScore(t._id, items, scores),
  }));
  const groupScores = groups.map((g) => ({
    ...g,
    score: calcGroupScore(g, items, scores),
  }));
  const familyScores = families.map((f) => ({
    ...f,
    score: calcFamilyScore(f, items, scores, groupById),
  }));

  return (
    <div
      style={{
        fontFamily: "'DM Sans',system-ui,sans-serif",
        background: "#F3F4F6",
        minHeight: "100vh",
        paddingBottom: 60,
      }}
    >
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)",
          padding: "2.5rem 2.5rem 2rem",
          marginBottom: "1.5rem",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            right: 80,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,.04)",
          }}
        />
        <div style={{ maxWidth: 920, margin: "0 auto", position: "relative" }}>
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Analytics Dashboard
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 1rem" }}>
        {/* Error */}
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#DC2626",
                  marginBottom: 2,
                }}
              >
                Failed to load data
              </div>
              <div style={{ fontSize: 12, color: "#991B1B" }}>{error}</div>
            </div>
            <button
              onClick={fetchData}
              style={{
                background: "#DC2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Editable items table */}
        <EditableItemsTable
          items={items}
          scores={scores}
          tags={tags}
          tagColorMap={tagColorMap}
          onScoreChange={handleScoreChange}
          onLabelChange={handleLabelChange}
          onTagsChange={handleTagsChange}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
        />

        {/* Tag Achievement */}
        <SectionTitle>
          Tag achievement{" "}
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              textTransform: "none",
              letterSpacing: 0,
              color: "#9CA3AF",
            }}
          >
            &nbsp;= avg of items mapped to this tag
          </span>
        </SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 12,
            marginBottom: "1.5rem",
          }}
        >
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => <SkeletonCard key={i} />)
            : tagScores.map((tag) => {
                const tc = tagColorMap[tag._id] ?? TAG_COLORS[0];
                const mapped =
                  itemsForTag(tag._id, items)
                    .map((i) => i.id)
                    .join(", ") || "none";
                return (
                  <AchCard
                    key={tag._id}
                    name={tag.name}
                    score={tag.score}
                    sub={`Items: ${mapped}`}
                    accent={tc.color}
                  />
                );
              })}
        </div>

        {/* Group Achievement */}
        <SectionTitle>
          Group achievement{" "}
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              textTransform: "none",
              letterSpacing: 0,
              color: "#9CA3AF",
            }}
          >
            &nbsp;= avg of its tags' scores
          </span>
        </SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 12,
            marginBottom: "1.5rem",
          }}
        >
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => <SkeletonCard key={i} />)
            : groupScores.map((grp) => {
                const tagNames =
                  grp.tags
                    .map((tid) => tagById[tid]?.name)
                    .filter(Boolean)
                    .join(", ") || "—";
                return (
                  <AchCard
                    key={grp._id}
                    name={grp.name}
                    score={grp.score}
                    sub={`Tags: ${tagNames}`}
                  />
                );
              })}
        </div>

        {/* Family Achievement */}
        <SectionTitle>
          Family achievement{" "}
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              textTransform: "none",
              letterSpacing: 0,
              color: "#9CA3AF",
            }}
          >
            &nbsp;= avg of its groups' scores
          </span>
        </SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            marginBottom: "1.5rem",
          }}
        >
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => <SkeletonCard key={i} />)
            : familyScores.map((fam) => {
                const grpNames =
                  fam.groups
                    .map((gid) => groupById[gid]?.name)
                    .filter(Boolean)
                    .join(", ") || "—";
                return (
                  <AchCard
                    key={fam._id}
                    name={fam.name}
                    score={fam.score}
                    sub={`Groups: ${grpNames}`}
                  />
                );
              })}
        </div>

        {/* Mini charts */}
        {!loading && !error && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: ".5px solid rgba(0,0,0,.09)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <SectionTitle>Visual comparison</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
              }}
            >
              {[
                {
                  title: "Item scores",
                  labels: items.map((i) => i.id),
                  values: items.map((i) => scores[i.id]),
                },
                {
                  title: "Tag achievement",
                  labels: tagScores.map((t) => t.name.split(" ")[0]),
                  values: tagScores.map((t) => t.score),
                },
                {
                  title: "Group achievement",
                  labels: groupScores.map((g) => g.name.split(" ")[0]),
                  values: groupScores.map((g) => g.score),
                },
                {
                  title: "Family achievement",
                  labels: familyScores.map((f) => f.name),
                  values: familyScores.map((f) => f.score),
                },
              ].map(({ title, labels, values }) => {
                const BAR_AREA = 140; // px — fixed height for the bar area only
                return (
                  <div key={title}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                        fontWeight: 500,
                      }}
                    >
                      {title}
                    </div>
                    {/* value labels row */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {labels.map((lbl, i) => {
                        const v = values[i];
                        const c = getColor(v);
                        return (
                          <div
                            key={lbl}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: c,
                            }}
                          >
                            {v === null ? "—" : `${v}%`}
                          </div>
                        );
                      })}
                    </div>
                    {/* bars row — fixed height container, bars grow from bottom */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 4,
                        height: BAR_AREA,
                        background: "#F8FAFC",
                        borderRadius: 8,
                        padding: "0 4px",
                        position: "relative",
                      }}
                    >
                      {/* horizontal guide lines */}
                      {[25, 50, 75, 100].map((pct) => (
                        <div
                          key={pct}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: `${(pct * BAR_AREA) / 100}px`,
                            height: 1,
                            background:
                              pct === 50
                                ? "rgba(0,0,0,.08)"
                                : "rgba(0,0,0,.04)",
                            zIndex: 0,
                          }}
                        />
                      ))}
                      {labels.map((lbl, i) => {
                        const v = values[i];
                        const barH =
                          v === null
                            ? 4
                            : Math.max(4, Math.round((v / 100) * BAR_AREA));
                        const c = getColor(v);
                        return (
                          <div
                            key={lbl}
                            style={{
                              flex: 1,
                              height: barH,
                              background: c,
                              borderRadius: "4px 4px 0 0",
                              transition:
                                "height .5s cubic-bezier(.4,0,.2,1),background .4s",
                              position: "relative",
                              zIndex: 1,
                            }}
                          />
                        );
                      })}
                    </div>
                    {/* label row */}
                    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      {labels.map((lbl, i) => (
                        <div
                          key={lbl}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            fontSize: 9,
                            color: "#9CA3AF",
                            lineHeight: 1.3,
                            wordBreak: "break-word",
                          }}
                        >
                          {lbl}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            ["≥ 70% — Good", "#DCFCE7", "#166534"],
            ["50–69% — Moderate", "#FEF3C7", "#92400E"],
            ["< 50% — Needs improvement", "#FEE2E2", "#991B1B"],
            ["No items mapped", "#F3F4F6", "#6B7280"],
          ].map(([label, bg, color]) => (
            <span
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: bg,
                  border: `1px solid ${color}`,
                  display: "inline-block",
                }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}