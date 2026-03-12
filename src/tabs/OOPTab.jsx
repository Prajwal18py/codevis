// src/tabs/OOPTab.jsx
// Enhanced: animated mount, filter toggle, hover expand with description, progress summary

import { useState, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";

const OOP_CONCEPTS = [
  { key: "encapsulation",     label: "Encapsulation",                 icon: "🔒", desc: "Bundles data and methods together, hiding internal state from outside access." },
  { key: "abstraction",       label: "Abstraction",                   icon: "🎭", desc: "Exposes only essential details, hiding complex implementation specifics." },
  { key: "inheritance",       label: "Inheritance",                   icon: "🧬", desc: "Allows a class to derive properties and behavior from a parent class." },
  { key: "polymorphism",      label: "Polymorphism",                  icon: "🔄", desc: "Enables objects of different types to be treated through a common interface." },
  { key: "templates",         label: "Templates / Generics",          icon: "📐", desc: "Write type-safe code that works with any data type without duplication." },
  { key: "abstract_classes",  label: "Abstract Classes",              icon: "⬡",  desc: "Classes that cannot be instantiated — define a blueprint for subclasses." },
  { key: "virtual_functions", label: "Virtual Functions",             icon: "◆",  desc: "Functions resolved at runtime, enabling dynamic dispatch and polymorphism." },
  { key: "composition",       label: "Composition",                   icon: "🧩", desc: "Build complex objects by combining simpler ones — 'has-a' relationships." },
  { key: "constructor_init",  label: "Constructor Initializer Lists", icon: "⚙",  desc: "Initialize member variables before the constructor body executes." },
  { key: "method_overriding", label: "Method Overriding",             icon: "↺",  desc: "A subclass provides its own implementation of a method from its parent." },
];

function ConceptCard({ concept, data, index }) {
  const { C } = useTheme();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const used = data && data.used;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 55);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onClick={() => used && setExpanded(e => !e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (used ? C.green + "08" : C.surface) : C.surface,
        borderRadius: 10,
        border: `1px solid ${used ? (hovered ? C.green + "70" : C.green + "40") : (hovered ? C.border : C.border)}`,
        transition: "all .22s ease",
        cursor: used ? "pointer" : "default",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px" }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>{concept.icon}</span>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11,
          color: used ? C.text : C.muted,
          fontWeight: used ? 700 : 400,
          flex: 1,
        }}>
          {concept.label}
        </span>

        {used && (
          <span style={{
            fontSize: 9,
            color: C.muted,
            fontFamily: "'JetBrains Mono',monospace",
            marginRight: 4,
            opacity: hovered ? 1 : 0,
            transition: "opacity .15s",
          }}>
            {expanded ? "▲ less" : "▼ more"}
          </span>
        )}

        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11,
          color: used ? C.green : C.muted,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          {used ? (
            <>
              <span style={{
                display: "inline-block",
                width: 6, height: 6,
                borderRadius: "50%",
                background: C.green,
                boxShadow: `0 0 6px ${C.green}`,
              }} />
              ✓ Used
            </>
          ) : "✗ Not used"}
        </span>
      </div>

      {/* Line reference */}
      {used && data.where && (
        <div style={{
          paddingLeft: 37, paddingRight: 13, paddingBottom: expanded ? 0 : 10,
          fontSize: 11, color: C.cyan,
          fontFamily: "'JetBrains Mono',monospace",
        }}>
          ↳ {data.where}
        </div>
      )}

      {/* Expanded: description + user explanation */}
      {used && expanded && (
        <div style={{
          margin: "8px 13px 11px 37px",
          padding: "9px 11px",
          background: C.card,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.7 }}>
            <span style={{ color: C.accentL, fontWeight: 700 }}>What it is: </span>
            {concept.desc}
          </div>
          {data.explanation && (
            <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.7 }}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>In your code: </span>
              {data.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OOPTab({ oop_analysis }) {
  const { C } = useTheme();
  const [filter, setFilter] = useState("all"); // "all" | "used" | "missing"

  if (!oop_analysis) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: 200, gap: 10,
      }}>
        <div style={{ fontSize: 32, opacity: 0.15 }}>🔒</div>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
          No OOP analysis available.
        </div>
      </div>
    );
  }

  const usedCount = OOP_CONCEPTS.filter(c => oop_analysis[c.key]?.used).length;
  const total = OOP_CONCEPTS.length;
  const pct = Math.round((usedCount / total) * 100);

  const filtered = OOP_CONCEPTS.filter(c => {
    const used = oop_analysis[c.key]?.used;
    if (filter === "used")    return used;
    if (filter === "missing") return !used;
    return true;
  });

  const scoreColor = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Progress summary */}
      <div style={{
        background: C.surface,
        borderRadius: 11,
        border: `1px solid ${scoreColor}30`,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        {/* Ring */}
        <svg width={46} height={46} style={{ flexShrink: 0 }}>
          <circle cx={23} cy={23} r={19} fill="none" stroke={C.border} strokeWidth={3} />
          <circle
            cx={23} cy={23} r={19} fill="none"
            stroke={scoreColor} strokeWidth={3}
            strokeDasharray={`${2 * Math.PI * 19}`}
            strokeDashoffset={`${2 * Math.PI * 19 * (1 - usedCount / total)}`}
            strokeLinecap="round"
            transform="rotate(-90 23 23)"
            style={{ transition: "stroke-dashoffset 1s ease .3s", filter: `drop-shadow(0 0 4px ${scoreColor})` }}
          />
          <text x={23} y={27} textAnchor="middle" fontSize={11} fontWeight={700}
            fontFamily="JetBrains Mono" fill={scoreColor}>
            {pct}%
          </text>
        </svg>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>
            {usedCount} / {total} Concepts Used
          </div>
          {/* Bar */}
          <div style={{ marginTop: 6, height: 4, background: C.border, borderRadius: 9, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)`,
              borderRadius: 9,
              boxShadow: `0 0 8px ${scoreColor}80`,
              transition: "width 1s ease .2s",
            }} />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: 3,
        background: C.surface, borderRadius: 8, padding: 3,
        border: `1px solid ${C.border}`,
      }}>
        {[
          { id: "all",     label: `All (${total})` },
          { id: "used",    label: `✓ Used (${usedCount})` },
          { id: "missing", label: `✗ Missing (${total - usedCount})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flex: 1, padding: "6px 4px",
              borderRadius: 6, border: "none",
              background: filter === f.id ? C.card : "transparent",
              color: filter === f.id
                ? (f.id === "used" ? C.green : f.id === "missing" ? C.muted : C.accentL)
                : C.muted,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10, cursor: "pointer",
              transition: "all .15s",
              fontWeight: filter === f.id ? 700 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Concept cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: 24, fontFamily: "'JetBrains Mono',monospace" }}>
            No concepts match this filter.
          </div>
        ) : (
          filtered.map((concept, i) => (
            <ConceptCard
              key={concept.key}
              concept={concept}
              data={oop_analysis[concept.key]}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}