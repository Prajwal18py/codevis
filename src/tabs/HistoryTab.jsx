// src/tabs/HistoryTab.jsx — Enhanced saved analyses history
// Enhancements: skeleton loader, hover states on cards, delete confirmation,
// search/filter bar, grouped by date (Today / Earlier), better empty state

import { useState, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";
import { getHistory, getSavedResult, deleteResult } from "../utils/supabase";

const getTypeColor  = (t, C) => t === 'lc' ? C.orange : C.cyan;
const TYPE_ICON  = { lc: "🧩",     oop: "🔷" };
const getLangColor  = (t, C) => t === 'python' ? C.green : C.accentL;

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const { C } = useTheme();
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.border, animation: "shimmer 1.4s ease-in-out infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 11, width: "60%", background: C.border, borderRadius: 5, animation: "shimmer 1.4s ease-in-out .1s infinite" }} />
        <div style={{ height: 9, width: "40%", background: C.border, borderRadius: 5, animation: "shimmer 1.4s ease-in-out .2s infinite" }} />
      </div>
      <div style={{ width: 60, height: 28, background: C.border, borderRadius: 7, animation: "shimmer 1.4s ease-in-out .15s infinite" }} />
    </div>
  );
}

// ─── History card ─────────────────────────────────────────────────────────────
function HistoryCard({ item, onLoad, onDelete, deleting }) {
  const { C } = useTheme();
  const [hovered,   setHovered]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDel(false); }}
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.border : C.border}`,
        borderRadius: 11, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12,
        transition: "all .18s",
        boxShadow: hovered ? `0 2px 12px ${C.accentL}08` : "none",
        transform: hovered ? "translateX(2px)" : "none",
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: 20, flexShrink: 0, opacity: hovered ? 1 : 0.8, transition: "opacity .2s" }}>
        {TYPE_ICON[item.type]}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: hovered ? C.text : C.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ background: getTypeColor(item.type, C) + "18", color: getTypeColor(item.type, C), border: `1px solid ${getTypeColor(item.type, C)}35`, borderRadius: 10, padding: "1px 8px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
            {item.type?.toUpperCase()}
          </span>
          <span style={{ background: getLangColor(item.lang, C) + "18", color: getLangColor(item.lang, C), border: `1px solid ${getLangColor(item.lang, C)}35`, borderRadius: 10, padding: "1px 8px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
            {item.lang?.toUpperCase()}
          </span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{formatDate(item.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={() => onLoad(item)} style={{ padding: "6px 13px", borderRadius: 7, border: `1px solid ${C.accentL}40`, background: hovered ? C.accentL + "18" : C.accentL + "0a", color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "background .15s" }}>
          Load
        </button>

        {confirmDel ? (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => { onDelete(item.id); setConfirmDel(false); }} disabled={deleting} style={{ padding: "6px 9px", borderRadius: 7, border: `1px solid ${C.red}50`, background: C.red + "20", color: C.red, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>
              {deleting ? "..." : "Confirm"}
            </button>
            <button onClick={() => setConfirmDel(false)} style={{ padding: "6px 7px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.red}25`, background: "transparent", color: C.red + "88", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer", transition: "all .15s", opacity: hovered ? 1 : 0.5 }}>
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HistoryTab({ user, onLoad }) {
  const { C } = useTheme();
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all"); // "all" | "lc" | "oop"

  useEffect(() => { if (user) fetchHistory(); }, [user]);

  async function fetchHistory() {
    setLoading(true);
    try { const data = await getHistory(user.id); setHistory(data || []); }
    catch(e) { setError("Failed to load history"); }
    finally { setLoading(false); }
  }

  async function handleLoad(item) {
    try { const full = await getSavedResult(item.id); onLoad(full); }
    catch(e) { setError("Failed to load result"); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try { await deleteResult(id); setHistory(h => h.filter(i => i.id !== id)); }
    catch(e) { setError("Failed to delete"); }
    finally { setDeleting(null); }
  }

  // Filter + search
  const filtered = history.filter(item => {
    const matchType   = filter === "all" || item.type === filter;
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Group into Today / Earlier
  const today = new Date().toDateString();
  const grouped = { today: [], earlier: [] };
  filtered.forEach(item => {
    const d = new Date(item.created_at).toDateString();
    if (d === today) grouped.today.push(item);
    else grouped.earlier.push(item);
  });

  if (!user) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
      <div style={{ fontSize: 40, opacity: 0.12 }}>📚</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 2 }}>
        Sign in to save and revisit<br/>your analyses
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`@keyframes shimmer { 0%{opacity:.35} 50%{opacity:.7} 100%{opacity:.35} }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: C.text }}>📚 My History</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{history.length} saved</div>
      </div>

      {/* Search + filter bar */}
      {!loading && history.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search analyses..."
            style={{ flex: 1, background: C.surface, border: `1px solid ${search ? C.accentL + "50" : C.border}`, color: C.text, borderRadius: 8, padding: "6px 11px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none", transition: "border-color .2s" }}
          />
          <div style={{ display: "flex", gap: 3, background: C.surface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {["all", "lc", "oop"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: filter === f ? C.card : "transparent", color: filter === f ? C.accentL : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer", transition: "all .15s", fontWeight: filter === f ? 700 : 400 }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: C.red + "0f", border: `1px solid ${C.red}35`, borderRadius: 8, padding: "8px 12px", color: C.red, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>⚠ {error}</div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2 }}>
          {search || filter !== "all" ? (
            <>No results found.<br /><span style={{ fontSize: 10, opacity: 0.6 }}>Try a different search or filter.</span></>
          ) : (
            <>No saved analyses yet.<br /><span style={{ fontSize: 10, opacity: 0.6 }}>Analyze a problem and hit 💾 Save to store it here.</span></>
          )}
        </div>
      )}

      {/* Grouped results */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {grouped.today.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accentL, boxShadow: `0 0 4px ${C.accentL}` }} />
                Today
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {grouped.today.map(item => (
                  <HistoryCard key={item.id} item={item} onLoad={handleLoad} onDelete={handleDelete} deleting={deleting === item.id} />
                ))}
              </div>
            </div>
          )}

          {grouped.earlier.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.muted }} />
                Earlier
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {grouped.earlier.map(item => (
                  <HistoryCard key={item.id} item={item} onLoad={handleLoad} onDelete={handleDelete} deleting={deleting === item.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}