import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:5000/api";

const api = {
  get: (path) =>
    fetch(`${API_BASE}${path}`).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    }),
  post: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    }),
  put: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    }),
  delete: (path) =>
    fetch(`${API_BASE}${path}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    }),
      patch: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────────────────────────────────────
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
const normalizeItem = (item) => ({
  _id: extractId(item._id),
  id: item.itemCode || extractId(item._id),
  label: item.label ?? item.name ?? "Untitled",
  tagIds: extractIds(item.tags ?? item.tagIds ?? []),
  score: item.score ?? 0,
});

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
// UI PRIMITIVES
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

// analyticsLoading passed as prop — AchCard is outside main component scope
const AchCard = ({ name, score, sub, accent, analyticsLoading }) => (
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
    {sub && (
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
    )}
    <div
      style={{
        fontSize: 22,
        fontWeight: 600,
        color: getColor(score),
        marginBottom: 6,
        opacity: analyticsLoading ? 0.4 : 1,
        transition: "color .4s, opacity .3s",
        animation: analyticsLoading ? "pulse 1s infinite" : "none",
      }}
    >
      {score === null ? "\u2014" : `${score}%`}
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

const TagPicker = ({
  availableTags,
  selectedIds,
  onToggle,
  tagColorMap,
  onClose,
}) => {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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

const SavePill = ({ status }) => {
  const map = {
    saving: { bg: "#EEF2FF", color: "#4338CA", text: "saving..." },
    saved: { bg: "#DCFCE7", color: "#166534", text: "saved" },
    error: { bg: "#FEE2E2", color: "#991B1B", text: "failed" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {s.text}
    </span>
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
  saveStatus,
  loadingItems,
  onScoreChange,
  onLabelChange,
  onAddItem,
  onDeleteItem,
  onTagsChange,
}) => {
  const [pickerOpen, setPickerOpen] = useState(null);
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saveStatus._adding && <SavePill status="saving" />}
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
            + Add item
          </button>
        </div>
      </div>

      {loadingItems ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid #E5E7EB",
              borderTop: "2px solid #4F46E5",
              borderRadius: "50%",
              animation: "spin .7s linear infinite",
            }}
          />
          Loading items from MongoDB...
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}
          >
            <thead>
              <tr>
                {["#", "Question", "Tags", "Score", "Adjust", "Status", ""].map(
                  (h) => (
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  style={{ borderBottom: ".5px solid rgba(0,0,0,.05)" }}
                >
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
                  <td
                    style={{
                      padding: "10px 10px 10px 0",
                      verticalAlign: "middle",
                      minWidth: 160,
                    }}
                  >
                    <InlineEdit
                      value={item.label}
                      onSave={(val) => onLabelChange(item._id, val)}
                      style={{ fontSize: 13, color: "#374151" }}
                    />
                    <div
                      style={{ fontSize: 10, color: "#C4B5FD", marginTop: 2 }}
                    >
                      double-click to edit
                    </div>
                  </td>
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
                                    item._id,
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
                              >
                                x
                              </span>
                            </span>
                          ) : null;
                        })}
                        <button
                          onClick={() =>
                            setPickerOpen(
                              pickerOpen === item._id ? null : item._id,
                            )
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
                          + tag
                        </button>
                      </div>
                      {pickerOpen === item._id && (
                        <TagPicker
                          availableTags={tags}
                          selectedIds={item.tagIds}
                          tagColorMap={tagColorMap}
                          onToggle={(tid) => {
                            const next = item.tagIds.includes(tid)
                              ? item.tagIds.filter((t) => t !== tid)
                              : [...item.tagIds, tid];
                            onTagsChange(item._id, next);
                          }}
                          onClose={() => setPickerOpen(null)}
                        />
                      )}
                    </div>
                  </td>
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
                        color: getColor(scores[item._id] ?? 0),
                        transition: "color .3s",
                      }}
                    >
                      {scores[item._id] ?? 0}%
                    </span>
                  </td>
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
                      value={scores[item._id] ?? 0}
                      onChange={(e) =>
                        onScoreChange(item._id, parseInt(e.target.value))
                      }
                      onMouseUp={(e) =>
                        onScoreChange(item._id, parseInt(e.target.value), true)
                      }
                      style={{
                        width: "100%",
                        accentColor: "#4F46E5",
                        cursor: "pointer",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 10px 10px 0",
                      verticalAlign: "middle",
                      minWidth: 64,
                    }}
                  >
                    <SavePill status={saveStatus[item._id]} />
                  </td>
                  <td style={{ padding: "10px 0", verticalAlign: "middle" }}>
                    <IconBtn
                      onClick={() => onDeleteItem(item._id)}
                      title="Delete item"
                      danger
                    >
                      delete
                    </IconBtn>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#9CA3AF",
                      fontSize: 13,
                    }}
                  >
                    No items yet. Click <strong>+ Add item</strong> to get
                    started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ onClose }) {


  const [tagScoreMap, setTagScoreMap] = useState({});
  const [groupScoreMap, setGroupScoreMap] = useState({});
  const [familyScoreMap, setFamilyScoreMap] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [items, setItems] = useState([]);
  const [scores, setScores] = useState({});
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  const saveTimers = useRef({});

  // ── Fetch analytics — stores as maps not arrays ───────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await api.get("/analytics");

      // Convert each array to a { [_id]: score } map
      // Also index by name as fallback in case _id format differs
      const toMap = (arr) => {
        const m = {};
        (arr || []).forEach((item) => {
          const id = extractId(item._id);
          if (id) m[id] = item.score ?? null;
          if (item.name) m[item.name] = item.score ?? null;
        });
        return m;
      };

      setTagScoreMap(toMap(data.tags));
      setGroupScoreMap(toMap(data.groups));
      setFamilyScoreMap(toMap(data.families));
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ── Fetch taxonomy ────────────────────────────────────────────────────────
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
      setTags(arr(rawT).map(normalizeTag));
      setGroups(arr(rawG).map(normalizeGroup));
      setFamilies(arr(rawF).map(normalizeFamily));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch items ───────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const raw = await api.get("/items");
      const arr = Array.isArray(raw) ? raw : (raw.data ?? []);
      const normalized = arr.map(normalizeItem);
      setItems(normalized);
      setScores(Object.fromEntries(normalized.map((i) => [i._id, i.score])));
    } catch (e) {
      setItemsError(e.message);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchItems();
    fetchAnalytics();
  }, [fetchData, fetchItems, fetchAnalytics]);

  // ── Debounced save ────────────────────────────────────────────────────────
  // refetchAnalytics flag: true for score/tag changes, false for label changes
  const debouncedSave = useCallback(
    (itemId, payload, refetchAnalytics = false) => {
      setSaveStatus((prev) => ({ ...prev, [itemId]: "saving" }));
      clearTimeout(saveTimers.current[itemId]);
      saveTimers.current[itemId] = setTimeout(async () => {
        try {
          // await api.put(`/items/${itemId}`, payload);
          await api.patch(`/items/${itemId}`, payload);
          if (refetchAnalytics) await fetchAnalytics();
          setSaveStatus((prev) => ({ ...prev, [itemId]: "saved" }));
          setTimeout(
            () => setSaveStatus((prev) => ({ ...prev, [itemId]: null })),
            2000,
          );
        } catch {
          setSaveStatus((prev) => ({ ...prev, [itemId]: "error" }));
        }
      }, 600);
    },
    [fetchAnalytics],
  );

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  // onChange: update local score display instantly (slider moves smoothly)
  // onMouseUp (commit=true): save to DB and refetch analytics
  const handleScoreChange = useCallback(
    (mongoId, val, commit = false) => {
      setScores((prev) => ({ ...prev, [mongoId]: val }));
      if (commit) {
        setItems((prev) => {
          const item = prev.find((i) => i._id === mongoId);
          if (item)
            debouncedSave(
              mongoId,
              {
                // itemCode: item.id,
                // label: item.label,
                score: val,
                // tags: item.tagIds,
              },
              true,
            );
          return prev;
        });
      }
    },
    [debouncedSave],
  );

  // Label changes don't affect scores — no analytics refetch
  const handleLabelChange = useCallback(
    (mongoId, val) => {
      setItems((prev) => {
        const next = prev.map((i) =>
          i._id === mongoId ? { ...i, label: val } : i,
        );
        const item = next.find((i) => i._id === mongoId);
        if (item)
          debouncedSave(
            mongoId,
            {
              // itemCode: item.id,
              // label: val,
              score: scores[mongoId] ?? item.score,
              // tags: item.tagIds,
            },
            false,
          );
        return next;
      });
    },
    [debouncedSave, scores],
  );

  // Tag changes affect group/family scores — refetch analytics
  const handleTagsChange = useCallback(
    (mongoId, tagIds) => {
      setItems((prev) => {
        const next = prev.map((i) =>
          i._id === mongoId ? { ...i, tagIds } : i,
        );
        const item = next.find((i) => i._id === mongoId);
        if (item)
          debouncedSave(
            mongoId,
            {
              // itemCode: item.id,
              // label: item.label,
              score: scores[mongoId] ?? item.score,
              // tags: tagIds,
            },
            true,
          );
        return next;
      });
    },
    [debouncedSave, scores],
  );

  const handleAddItem = useCallback(async () => {
    setSaveStatus((prev) => ({ ...prev, _adding: "saving" }));
    try {
      const maxNum = items.reduce(
        (max, item) =>
          Math.max(max, parseInt(item.id?.replace(/\D/g, "")) || 0),
        0,
      );
      const created = await api.post("/items", {
        itemCode: `Q${maxNum + 1}`,
        label: "New question",
        score: 70,
        tags: [],
      });
      const normalized = normalizeItem(created.data ?? created);
      setItems((prev) => [...prev, normalized]);
      setScores((prev) => ({ ...prev, [normalized._id]: normalized.score }));
      setSaveStatus((prev) => ({ ...prev, _adding: null }));
      // No analytics refetch — new item has no tags yet, won't affect scores
    } catch (e) {
      setSaveStatus((prev) => ({ ...prev, _adding: null }));
      alert(`Failed to create item: ${e.message}`);
    }
  }, [items]);

  const handleDeleteItem = useCallback(
    async (mongoId) => {
      if (!window.confirm("Delete this item? This cannot be undone.")) return;
      setSaveStatus((prev) => ({ ...prev, [mongoId]: "saving" }));
      try {
        await api.delete(`/items/${mongoId}`);
        setItems((prev) => prev.filter((i) => i._id !== mongoId));
        setScores((prev) => {
          const n = { ...prev };
          delete n[mongoId];
          return n;
        });
        await fetchAnalytics();
      } catch (e) {
        setSaveStatus((prev) => ({ ...prev, [mongoId]: "error" }));
        alert(`Failed to delete: ${e.message}`);
      }
    },
    [fetchAnalytics],
  );

  const tagColorMap = Object.fromEntries(
    tags.map((t, i) => [t._id, TAG_COLORS[i % TAG_COLORS.length]]),
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'DM Sans',system-ui,sans-serif",
        background: "#F3F4F6",
        minHeight: "100vh",
        paddingBottom: 60,
      }}
    >
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

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
              Back to Dashboard
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
          <p
            style={{
              fontSize: 13,
              opacity: 0.75,
              maxWidth: 500,
              lineHeight: 1.6,
            }}
          >
            Items persist in MongoDB. Scores come from the backend.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {[
              ["Tags", tags.length],
              ["Groups", groups.length],
              ["Families", families.length],
              ["Items", items.length],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  background: "rgba(255,255,255,.1)",
                  borderRadius: 10,
                  padding: "8px 18px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {loading || loadingItems ? "..." : v}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{l}</div>
              </div>
            ))}
            {analyticsLoading && (
              <div
                style={{
                  background: "rgba(255,255,255,.1)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                  }}
                />
                Updating scores...
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 1rem" }}>
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
                Failed to load taxonomy
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

        {itemsError && (
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
                Failed to load items
              </div>
              <div style={{ fontSize: 12, color: "#991B1B" }}>
                {itemsError} make sure GET /api/items exists
              </div>
            </div>
            <button
              onClick={fetchItems}
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

        <EditableItemsTable
          items={items}
          scores={scores}
          tags={tags}
          tagColorMap={tagColorMap}
          saveStatus={saveStatus}
          loadingItems={loadingItems}
          onScoreChange={handleScoreChange}
          onLabelChange={handleLabelChange}
          onTagsChange={handleTagsChange}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
        />

        {/* ── Tag Achievement ──
            Rendered by iterating the STABLE `tags` array (never reorders).
            Score is looked up from tagScoreMap by _id. This is the key fix
            for card jumbling — the order of `tags` never changes after initial
            fetch, so React always sees the same key in the same grid position. */}
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
            : tags.map((tag) => (
                <AchCard
                  key={tag._id}
                  name={tag.name}
                  score={tagScoreMap[tag._id] ?? tagScoreMap[tag.name] ?? null}
                  sub=""
                  accent={(tagColorMap[tag._id] ?? TAG_COLORS[0]).color}
                  analyticsLoading={analyticsLoading}
                />
              ))}
        </div>

        {/* ── Group Achievement ── */}
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
            &nbsp;= avg of its tags scores
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
            : groups.map((grp) => (
                <AchCard
                  key={grp._id}
                  name={grp.name}
                  score={
                    groupScoreMap[grp._id] ?? groupScoreMap[grp.name] ?? null
                  }
                  sub=""
                  analyticsLoading={analyticsLoading}
                />
              ))}
        </div>

        {/* ── Family Achievement ── */}
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
            &nbsp;= avg of its groups scores
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
            : families.map((fam) => (
                <AchCard
                  key={fam._id}
                  name={fam.name}
                  score={
                    familyScoreMap[fam._id] ?? familyScoreMap[fam.name] ?? null
                  }
                  sub=""
                  analyticsLoading={analyticsLoading}
                />
              ))}
        </div>

        {/* ── Visual Comparison ── */}
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
                  values: items.map((i) => scores[i._id] ?? 0),
                },
                {
                  title: "Tag achievement",
                  labels: tags.map((t) => t.name.split(" ")[0]),
                  values: tags.map(
                    (t) => tagScoreMap[t._id] ?? tagScoreMap[t.name] ?? null,
                  ),
                },
                {
                  title: "Group achievement",
                  labels: groups.map((g) => g.name.split(" ")[0]),
                  values: groups.map(
                    (g) =>
                      groupScoreMap[g._id] ?? groupScoreMap[g.name] ?? null,
                  ),
                },
                {
                  title: "Family achievement",
                  labels: families.map((f) => f.name),
                  values: families.map(
                    (f) =>
                      familyScoreMap[f._id] ?? familyScoreMap[f.name] ?? null,
                  ),
                },
              ].map(({ title, labels, values }) => {
                const BAR_AREA = 140;
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
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {labels.map((lbl, i) => {
                        const v = values[i];
                        return (
                          <div
                            key={lbl}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: getColor(v),
                            }}
                          >
                            {v === null ? "--" : `${v}%`}
                          </div>
                        );
                      })}
                    </div>
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
                        opacity: analyticsLoading ? 0.6 : 1,
                        transition: "opacity .3s",
                      }}
                    >
                      {[25, 50, 75].map((pct) => (
                        <div
                          key={pct}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: `${(pct * BAR_AREA) / 100}px`,
                            height: 1,
                            background: "rgba(0,0,0,.05)",
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
                        return (
                          <div
                            key={lbl}
                            style={{
                              flex: 1,
                              height: barH,
                              background: getColor(v),
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
                    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      {labels.map((lbl) => (
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
            ["70% or above - Good", "#DCFCE7", "#166534"],
            ["50 to 69% - Moderate", "#FEF3C7", "#92400E"],
            ["Below 50% - Needs improvement", "#FEE2E2", "#991B1B"],
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
