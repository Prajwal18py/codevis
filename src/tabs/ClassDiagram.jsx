// src/tabs/ClassDiagram.jsx
// Enhanced: curved SVG arrows with anchor snapping, zoom/pan, hover highlight,
// relationship tooltip, safer layout algorithm, class type badge

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const relColor  = (t, C) => t === "inherits" ? C.cyan : t === "composition" ? C.coral : t === "aggregation" ? C.amber : C.accentL;
const relDash   = t => t === "aggregation" ? "5,3" : t === "uses" ? "2,3" : "none";
const accessIcon= a => a === "private" ? "●" : a === "protected" ? "◈" : "▸";
const accessCol = (a, C) => a === "private" ? C.red : a === "protected" ? C.orange : C.green;

// Grid-based layout: spread classes into rows/cols with breathing room
function computeLayout(classes) {
  const cols  = Math.max(2, Math.ceil(Math.sqrt(classes.length)));
  const W = 210, H = 250; // cell size
  return classes.map((_, i) => ({
    x: 24 + (i % cols) * W,
    y: 24 + Math.floor(i / cols) * H,
  }));
}

// Returns edge midpoints for a class box to snap arrows to nearest side
function boxEdge(pos, w = 195, h = 26) {
  return {
    top:    { x: pos.x + w / 2, y: pos.y },
    bottom: { x: pos.x + w / 2, y: pos.y + h },
    left:   { x: pos.x,         y: pos.y + h / 2 },
    right:  { x: pos.x + w,     y: pos.y + h / 2 },
    center: { x: pos.x + w / 2, y: pos.y + h / 2 },
  };
}

function bestEdgePair(fromPos, toPos) {
  const f = boxEdge(fromPos), t = boxEdge(toPos);
  const dx = t.center.x - f.center.x;
  const dy = t.center.y - f.center.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { from: f.right,  to: t.left   }
      : { from: f.left,   to: t.right  };
  }
  return dy > 0
    ? { from: f.bottom, to: t.top    }
    : { from: f.top,    to: t.bottom };
}

// ─── Arrow with curve + tooltip ──────────────────────────────────────────────
function CurvedArrow({ x1, y1, x2, y2, label, color, dash, id }) {
  const [vis, setVis]     = useState(false);
  const [tooltip, setTooltip] = useState(null);
  useEffect(() => { const t = setTimeout(() => setVis(true), 600); return () => clearTimeout(t); }, []);

  const cx1 = x1 + (x2 - x1) * 0.4;
  const cy1 = y1;
  const cx2 = x1 + (x2 - x1) * 0.6;
  const cy2 = y2;
  const d   = `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 12 };

  const markerId = `mk_${id}`;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>

      {/* Fat invisible hit area */}
      <path
        d={d} fill="none" stroke="transparent" strokeWidth={14}
        style={{ cursor:"pointer" }}
        onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, label })}
        onMouseLeave={() => setTooltip(null)}
      />

      {/* Visible arrow */}
      <path
        d={d} fill="none" stroke={color} strokeWidth={1.5}
        strokeDasharray={dash} markerEnd={`url(#${markerId})`}
        opacity={vis ? 0.72 : 0}
        style={{ transition:"opacity .4s ease .5s", pointerEvents:"none" }}
      />

      {/* Label */}
      {label && (
        <text
          x={mid.x} y={mid.y} fill={color} fontSize={9}
          fontFamily="JetBrains Mono" textAnchor="middle"
          opacity={vis ? 1 : 0}
          style={{ transition:"opacity .4s ease .6s", pointerEvents:"none" }}
        >
          {label}
        </text>
      )}

      {/* Tooltip */}
      {tooltip && (
        <foreignObject x={tooltip.x - 60} y={tooltip.y - 30} width={120} height={30}>
          <div style={{
            background: C.card,
            border: `1px solid ${color}50`,
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 10,
            color,
            fontFamily: "'JetBrains Mono',monospace",
            whiteSpace: "nowrap",
          }}>
            {tooltip.label}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// ─── Class box ───────────────────────────────────────────────────────────────
function ClassBox({ cls, x, y, delay, isHighlighted, onHover }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay * 90); return () => clearTimeout(t); }, [delay]);

  const isAbstract  = cls.isAbstract;
  const isInterface = cls.type === "interface";
  const accent =
    isInterface ? C.teal :
    isAbstract  ? C.amber :
    cls.type === "derived" ? C.accentL : C.coral;
  const borderStyle = isAbstract ? "dashed" : "solid";

  const badge = isAbstract ? { label:"abstract", col:C.amber } : isInterface ? { label:"interface", col:C.teal } : null;

  return (
    <div
      onMouseEnter={() => onHover(cls.name)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: "absolute", left: x, top: y, width: 195,
        background: C.card,
        border: `1.5px ${borderStyle} ${isHighlighted ? accent : accent + "44"}`,
        borderRadius: 11, overflow: "hidden",
        boxShadow: isHighlighted
          ? `0 0 0 2px ${accent}40, 4px 4px 0px ${accent}30, 0 0 22px ${accent}20`
          : `4px 4px 0px ${accent}18, 0 0 14px ${accent}0a`,
        zIndex: isHighlighted ? 10 : 2,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0) scale(1)" : "translateY(14px) scale(.95)",
        transition: "all .38s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, border-color .2s",
      }}
    >
      {/* Header */}
      <div style={{ background:accent + "14", borderBottom:`1px ${borderStyle} ${accent}30`, padding:"7px 10px", display:"flex", alignItems:"center", gap:5 }}>
        <div style={{ width:7, height:7, borderRadius:isInterface ? 2 : "50%", background:accent, boxShadow:`0 0 6px ${accent}aa`, flexShrink:0 }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:accent, fontWeight:700, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {cls.name}
        </span>
        {badge && (
          <span style={{ fontSize:8, color:badge.col, background:badge.col + "18", padding:"1px 5px", borderRadius:4, border:`1px ${borderStyle} ${badge.col}50`, flexShrink:0 }}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Members */}
      {cls.members?.length > 0 && (
        <div style={{ padding:"5px 10px", borderBottom:`1px solid ${C.border}` }}>
          {cls.members.map((m, i) => (
            <div key={i} style={{ fontSize:10, color:C.dim, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.85, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              <span style={{ color:accessCol(m.access, C), marginRight:4, fontSize:9 }}>{accessIcon(m.access)}</span>
              {m.name}<span style={{ color:C.muted }}>:</span>
              <span style={{ color:C.cyan }}> {m.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Methods */}
      {cls.methods?.length > 0 && (
        <div style={{ padding:"5px 10px" }}>
          {cls.methods.map((m, i) => (
            <div key={i} style={{ fontSize:10, color:C.dim, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.85, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              <span style={{ color:m.isVirtual ? C.accentL : accessCol(m.access || "public", C), marginRight:4, fontSize:9 }}>
                {m.isVirtual ? "◆" : accessIcon(m.access || "public")}
              </span>
              <span style={{ color:m.isVirtual ? C.accentL : C.text }}>{m.name}()</span>
              {m.returns && <span style={{ color:C.muted }}>: {m.returns}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main diagram ─────────────────────────────────────────────────────────────
export default function ClassDiagram({ data }) {
  const { C } = useTheme();
  const [zoom, setZoom]           = useState(1);
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [dragging, setDragging]   = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hovered, setHovered]     = useState(null); // class name
  const svgRef                    = useRef(null);

  // Zoom controls
  const zoomIn  = () => setZoom(z => Math.min(2,    parseFloat((z + 0.15).toFixed(2))));
  const zoomOut = () => setZoom(z => Math.max(0.4,  parseFloat((z - 0.15).toFixed(2))));
  const reset   = () => { setZoom(1); setPan({ x:0, y:0 }); };

  // Pan drag
  const onMouseDown = e => { setDragging(true); setDragStart({ x:e.clientX - pan.x, y:e.clientY - pan.y }); };
  const onMouseMove = e => { if (dragging && dragStart) setPan({ x:e.clientX - dragStart.x, y:e.clientY - dragStart.y }); };
  const onMouseUp   = () => { setDragging(false); setDragStart(null); };

  // Scroll-to-zoom
  const onWheel = useCallback(e => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2, parseFloat((z - e.deltaY * 0.001).toFixed(2)))));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive:false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  if (!data?.classes?.length) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:320, color:C.muted, gap:10 }}>
        <div style={{ fontSize:36, opacity:0.15 }}>⬡</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>No classes detected</div>
      </div>
    );
  }

  const classes = data.classes;
  const rels    = data.relationships || [];
  const pos     = computeLayout(classes);
  const cols    = Math.max(2, Math.ceil(Math.sqrt(classes.length)));
  const canvasW = 24 + cols * 210 + 24;
  const maxH    = Math.max(...pos.map(p => p.y)) + 270;

  // Which class names are connected to hovered
  const connectedTo = hovered
    ? new Set(rels.filter(r => r.from === hovered || r.to === hovered).flatMap(r => [r.from, r.to]))
    : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>

      {/* Toolbar */}
      <div style={{
        display:"flex", alignItems:"center", gap:6, marginBottom:8,
        padding:"5px 10px", background:C.surface, borderRadius:9,
        border:`1px solid ${C.border}`,
      }}>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", flex:1 }}>
          {classes.length} class{classes.length !== 1 ? "es" : ""} · {rels.length} relation{rels.length !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize:10, color:C.dim, fontFamily:"'JetBrains Mono',monospace" }}>{Math.round(zoom * 100)}%</span>
        {[
          { label:"−", action:zoomOut },
          { label:"+", action:zoomIn  },
          { label:"⌂", action:reset   },
        ].map(b => (
          <button key={b.label} onClick={b.action} style={{
            width:24, height:24, borderRadius:6, border:`1px solid ${C.border}`,
            background:C.card, color:C.text, fontSize:13, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'JetBrains Mono',monospace",
          }}>{b.label}</button>
        ))}
      </div>

      {/* Diagram canvas */}
      <div
        ref={svgRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position:"relative", overflow:"hidden", borderRadius:12,
          border:`1px solid ${C.border}`, background:C.card,
          height: Math.min(maxH, 520),
          cursor: dragging ? "grabbing" : "grab",
          userSelect:"none",
        }}
      >
        {/* Dot grid background */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.18, pointerEvents:"none" }}>
          <defs>
            <pattern id="dotGrid" x={pan.x % 24} y={pan.y % 24} width={24} height={24} patternUnits="userSpaceOnUse">
              <circle cx={12} cy={12} r={1} fill={C.border} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
        </svg>

        {/* Panned + zoomed inner */}
        <div style={{
          position:"absolute", inset:0,
          transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin:"top left",
          width:canvasW, height:maxH,
        }}>
          {/* SVG arrows */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible", pointerEvents:"none" }}>
            {rels.map((rel, i) => {
              const fi = classes.findIndex(c => c.name === rel.from);
              const ti = classes.findIndex(c => c.name === rel.to);
              if (fi < 0 || ti < 0) return null;
              const { from, to } = bestEdgePair(pos[fi], pos[ti]);
              const isActive = !hovered || rel.from === hovered || rel.to === hovered;
              return (
                <g key={i} style={{ opacity: isActive ? 1 : 0.18, transition:"opacity .2s", pointerEvents:"all" }}>
                  <CurvedArrow
                    id={i}
                    x1={from.x} y1={from.y}
                    x2={to.x}   y2={to.y}
                    label={rel.type}
                    color={relColor(rel.type, C)}
                    dash={relDash(rel.type)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Class boxes */}
          {classes.map((cls, i) => {
            const isHL = !hovered || (connectedTo && connectedTo.has(cls.name));
            return (
              <div
                key={i}
                style={{ opacity: !hovered || isHL ? 1 : 0.25, transition:"opacity .2s" }}
              >
                <ClassBox
                  cls={cls} x={pos[i].x} y={pos[i].y} delay={i}
                  isHighlighted={hovered === cls.name}
                  onHover={setHovered}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:8, padding:"6px 4px" }}>
        {[
          { col:C.coral,   label:"Base class",   dot:true },
          { col:C.amber,   label:"Abstract",      dot:true },
          { col:C.teal,    label:"Interface",     dot:true },
          { col:C.accentL, label:"Derived",       dot:true },
          { col:C.cyan,    label:"inherits →",    dash:"none" },
          { col:C.coral,   label:"composition →", dash:"none" },
          { col:C.amber,   label:"aggregation →", dash:"5,3" },
        ].map((x, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:9, color:C.dim, fontFamily:"'JetBrains Mono',monospace" }}>
            {x.dot ? (
              <div style={{ width:7, height:7, borderRadius:"50%", background:x.col, boxShadow:`0 0 4px ${x.col}88` }} />
            ) : (
              <svg width={20} height={8}>
                <line x1={0} y1={4} x2={20} y2={4} stroke={x.col} strokeWidth={1.5} strokeDasharray={x.dash} />
                <polygon points="14,1 20,4 14,7" fill={x.col} />
              </svg>
            )}
            {x.label}
          </div>
        ))}
        <div style={{ marginLeft:"auto", fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>
          scroll to zoom · drag to pan · hover to highlight
        </div>
      </div>
    </div>
  );
}