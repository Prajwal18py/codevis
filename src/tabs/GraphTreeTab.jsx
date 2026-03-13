// src/tabs/GraphTreeTab.jsx — Graph & Tree Visualizer
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_R = 24;
const SPEEDS = { slow: 900, normal: 500, fast: 150 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildBST(values) {
  const nodes = {}, edges = [];
  const insert = (val, parentId = null, side = null) => {
    const id = String(val);
    if (!nodes[id]) nodes[id] = { id, val, left: null, right: null };
    if (parentId) {
      nodes[parentId][side] = id;
      edges.push({ from: parentId, to: id });
    }
  };
  const bstInsert = (val, nodeId) => {
    if (!nodeId) { insert(val); return String(val); }
    if (val < nodes[nodeId].val) {
      if (!nodes[nodeId].left) { insert(val, nodeId, "left"); }
      else bstInsert(val, nodes[nodeId].left);
    } else {
      if (!nodes[nodeId].right) { insert(val, nodeId, "right"); }
      else bstInsert(val, nodes[nodeId].right);
    }
  };
  let root = null;
  values.forEach(v => {
    if (!root) { insert(v); root = String(v); }
    else bstInsert(v, root);
  });
  return { nodes, edges, root };
}

function layoutBST(nodes, root) {
  const pos = {};
  const W = 700, startY = 60, levelH = 80;
  const setPos = (id, x, y, spread) => {
    if (!id || !nodes[id]) return;
    pos[id] = { x, y };
    setPos(nodes[id].left,  x - spread, y + levelH, spread / 2);
    setPos(nodes[id].right, x + spread, y + levelH, spread / 2);
  };
  setPos(root, W / 2, startY, 160);
  return pos;
}

function bfsOrder(nodes, root) {
  const order = [], queue = [root];
  while (queue.length) {
    const id = queue.shift();
    if (!id || !nodes[id]) continue;
    order.push(id);
    if (nodes[id].left)  queue.push(nodes[id].left);
    if (nodes[id].right) queue.push(nodes[id].right);
  }
  return order;
}

function dfsOrder(nodes, root, type = "inorder") {
  const order = [];
  const traverse = (id) => {
    if (!id || !nodes[id]) return;
    if (type === "preorder")  order.push(id);
    traverse(nodes[id].left);
    if (type === "inorder")   order.push(id);
    traverse(nodes[id].right);
    if (type === "postorder") order.push(id);
  };
  traverse(root);
  return order;
}

// Graph BFS/DFS
function graphBFS(adj, start) {
  const visited = new Set(), order = [], queue = [start];
  visited.add(start);
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    (adj[node] || []).forEach(n => {
      if (!visited.has(n)) { visited.add(n); queue.push(n); }
    });
  }
  return order;
}

function graphDFS(adj, start) {
  const visited = new Set(), order = [];
  const dfs = (node) => {
    visited.add(node); order.push(node);
    (adj[node] || []).forEach(n => { if (!visited.has(n)) dfs(n); });
  };
  dfs(start);
  return order;
}

// ─── Tree SVG ─────────────────────────────────────────────────────────────────
function TreeSVG({ nodes, edges, pos, visited, current, C }) {
  if (!Object.keys(pos).length) return null;
  const allX = Object.values(pos).map(p => p.x);
  const allY = Object.values(pos).map(p => p.y);
  const minX = Math.min(...allX) - NODE_R - 10;
  const maxX = Math.max(...allX) + NODE_R + 10;
  const maxY = Math.max(...allY) + NODE_R + 10;
  const W = Math.max(maxX - minX, 300), H = Math.max(maxY, 200);

  return (
    <svg viewBox={`${minX} 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 400, overflow: "visible" }}>
      {/* Edges */}
      {edges.map((e, i) => {
        const f = pos[e.from], t = pos[e.to];
        if (!f || !t) return null;
        const active = visited.has(e.from) && visited.has(e.to);
        return (
          <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
            stroke={active ? C.accentL : C.border}
            strokeWidth={active ? 2.5 : 1.5}
            style={{ transition: "stroke .3s" }}
          />
        );
      })}
      {/* Nodes */}
      {Object.values(nodes).map(node => {
        const p = pos[node.id];
        if (!p) return null;
        const isCurrent = current === node.id;
        const isVisited = visited.has(node.id);
        const fill = isCurrent ? C.accentL : isVisited ? C.green : C.card;
        const stroke = isCurrent ? C.accentL : isVisited ? C.green : C.border;
        return (
          <g key={node.id} style={{ transition: "all .3s" }}>
            <circle cx={p.x} cy={p.y} r={NODE_R}
              fill={fill} stroke={stroke} strokeWidth={isCurrent ? 3 : 1.5}
              style={{ filter: isCurrent ? `drop-shadow(0 0 8px ${C.accentL})` : "none", transition: "all .3s" }}
            />
            <text x={p.x} y={p.y + 5} textAnchor="middle"
              fill={isCurrent || isVisited ? "#fff" : C.text}
              fontSize={13} fontWeight={700} fontFamily="'JetBrains Mono',monospace"
              style={{ transition: "fill .3s", userSelect: "none" }}
            >{node.val}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Graph SVG ────────────────────────────────────────────────────────────────
function GraphSVG({ gNodes, gEdges, gPos, visited, current, C, onNodeClick, dragging, onMouseDown }) {
  return (
    <svg style={{ width: "100%", height: 380, cursor: "crosshair" }}>
      {gEdges.map((e, i) => {
        const f = gPos[e.from], t = gPos[e.to];
        if (!f || !t) return null;
        const active = visited.has(e.from) && visited.has(e.to);
        return (
          <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
            stroke={active ? C.cyan : C.border}
            strokeWidth={active ? 2.5 : 1.5}
            style={{ transition: "stroke .3s" }}
          />
        );
      })}
      {gNodes.map(node => {
        const p = gPos[node.id];
        if (!p) return null;
        const isCurrent = current === node.id;
        const isVisited = visited.has(node.id);
        const fill = isCurrent ? C.accentL : isVisited ? C.cyan : C.card;
        const stroke = isCurrent ? C.accentL : isVisited ? C.cyan : C.border;
        return (
          <g key={node.id} style={{ cursor: "pointer" }}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onClick={() => onNodeClick(node.id)}
          >
            <circle cx={p.x} cy={p.y} r={NODE_R}
              fill={fill} stroke={stroke} strokeWidth={isCurrent ? 3 : 1.5}
              style={{ filter: isCurrent ? `drop-shadow(0 0 8px ${C.accentL})` : "none", transition: "all .3s" }}
            />
            <text x={p.x} y={p.y + 5} textAnchor="middle"
              fill={isCurrent || isVisited ? "#fff" : C.text}
              fontSize={12} fontWeight={700} fontFamily="'JetBrains Mono',monospace"
              style={{ userSelect: "none" }}
            >{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── TREE MODE ────────────────────────────────────────────────────────────────
function TreeMode({ C }) {
  const [input, setInput]       = useState("50,30,70,20,40,60,80");
  const [algo, setAlgo]         = useState("bfs");
  const [speed, setSpeed]       = useState("normal");
  const [tree, setTree]         = useState(null);
  const [pos, setPos]           = useState({});
  const [visited, setVisited]   = useState(new Set());
  const [current, setCurrent]   = useState(null);
  const [order, setOrder]       = useState([]);
  const [step, setStep]         = useState(-1);
  const [running, setRunning]   = useState(false);
  const [built, setBuilt]       = useState(false);
  const timerRef                = useRef(null);

  const buildTree = () => {
    const vals = input.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    if (!vals.length) return;
    // deduplicate
    const unique = [...new Set(vals)];
    const t = buildBST(unique);
    const p = layoutBST(t.nodes, t.root);
    setTree(t); setPos(p); setVisited(new Set()); setCurrent(null);
    setOrder([]); setStep(-1); setBuilt(true); setRunning(false);
    clearInterval(timerRef.current);
  };

  const getOrder = useCallback(() => {
    if (!tree) return [];
    if (algo === "bfs")      return bfsOrder(tree.nodes, tree.root);
    if (algo === "inorder")  return dfsOrder(tree.nodes, tree.root, "inorder");
    if (algo === "preorder") return dfsOrder(tree.nodes, tree.root, "preorder");
    if (algo === "postorder")return dfsOrder(tree.nodes, tree.root, "postorder");
    return [];
  }, [tree, algo]);

  const startTraversal = () => {
    const ord = getOrder();
    setOrder(ord); setStep(0); setVisited(new Set()); setCurrent(ord[0]);
    setRunning(true);
    let i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++;
      if (i >= ord.length) { clearInterval(timerRef.current); setRunning(false); setCurrent(null); return; }
      setCurrent(ord[i]);
      setVisited(prev => new Set([...prev, ord[i - 1]]));
      setStep(i);
    }, SPEEDS[speed]);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setVisited(new Set()); setCurrent(null); setStep(-1); setRunning(false); setOrder([]);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const algoInfo = {
    bfs:      { label: "BFS (Level Order)", color: C.accentL, desc: "Visit nodes level by level using a queue. Great for finding shortest path." },
    inorder:  { label: "In-Order DFS",      color: C.green,   desc: "Left → Root → Right. Gives sorted output for a BST." },
    preorder: { label: "Pre-Order DFS",      color: C.cyan,    desc: "Root → Left → Right. Used to copy or serialize a tree." },
    postorder:{ label: "Post-Order DFS",     color: C.orange,  desc: "Left → Right → Root. Used to delete or evaluate a tree." },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Input */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Build BST — Enter values</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="50,30,70,20,40,60,80"
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none" }}
          />
          <button onClick={buildTree} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: C.accentL, color: "#fff", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Build Tree
          </button>
        </div>
      </div>

      {/* Algo selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(algoInfo).map(([k, v]) => (
          <button key={k} onClick={() => { setAlgo(k); reset(); }}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${algo === k ? v.color : C.border}`, background: algo === k ? v.color + "18" : "transparent", color: algo === k ? v.color : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: algo === k ? 700 : 400, cursor: "pointer", transition: "all .15s" }}>
            {v.label}
          </button>
        ))}
        {/* Speed */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {["slow","normal","fast"].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${speed === s ? C.cyan : C.border}`, background: speed === s ? C.cyan + "18" : "transparent", color: speed === s ? C.cyan : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Algo info */}
      {built && (
        <div style={{ background: algoInfo[algo].color + "12", border: `1px solid ${algoInfo[algo].color}30`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.dim }}>
          <strong style={{ color: algoInfo[algo].color }}>{algoInfo[algo].label}</strong> — {algoInfo[algo].desc}
        </div>
      )}

      {/* SVG canvas */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", minHeight: 300 }}>
        {!built ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
            Enter values and click <strong style={{ color: C.accentL }}>Build Tree</strong> to visualize
          </div>
        ) : (
          <TreeSVG nodes={tree.nodes} edges={tree.edges} pos={pos} visited={visited} current={current} C={C} />
        )}
      </div>

      {/* Traversal order */}
      {order.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Traversal Order</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {order.map((id, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
                background: i < step ? C.green + "22" : i === step ? C.accentL + "33" : C.card,
                border: `1.5px solid ${i < step ? C.green + "55" : i === step ? C.accentL : C.border}`,
                color: i <= step ? C.text : C.muted,
                transition: "all .3s"
              }}>{tree.nodes[id]?.val}</div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      {built && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={startTraversal} disabled={running}
            style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", background: running ? C.border : C.accentL, color: "#fff", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", transition: "all .2s" }}>
            {running ? "⏳ Running..." : `▶ Run ${algoInfo[algo].label}`}
          </button>
          <button onClick={reset} style={{ padding: "10px 18px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ─── GRAPH MODE ───────────────────────────────────────────────────────────────
function GraphMode({ C }) {
  const svgRef = useRef(null);
  const [gNodes, setGNodes]     = useState([]);
  const [gEdges, setGEdges]     = useState([]);
  const [gPos, setGPos]         = useState({});
  const [visited, setVisited]   = useState(new Set());
  const [current, setCurrent]   = useState(null);
  const [order, setOrder]       = useState([]);
  const [step, setStep]         = useState(-1);
  const [running, setRunning]   = useState(false);
  const [algo, setAlgo]         = useState("bfs");
  const [speed, setSpeed]       = useState("normal");
  const [mode, setMode]         = useState("addNode"); // addNode | addEdge | traverse
  const [edgeFrom, setEdgeFrom] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const timerRef = useRef(null);
  const nodeCounter = useRef(0);

  const addNode = () => {
    const id = `n${nodeCounter.current++}`;
    const label = nodeLabel.trim() || id;
    const svgRect = svgRef.current?.getBoundingClientRect();
    const W = svgRect?.width || 600;
    const x = 80 + Math.random() * (W - 160);
    const y = 80 + Math.random() * 220;
    setGNodes(prev => [...prev, { id, label }]);
    setGPos(prev => ({ ...prev, [id]: { x, y } }));
    setNodeLabel("");
  };

  const handleNodeClick = (id) => {
    if (mode === "addEdge") {
      if (!edgeFrom) { setEdgeFrom(id); return; }
      if (edgeFrom !== id) {
        const exists = gEdges.some(e => (e.from === edgeFrom && e.to === id) || (e.from === id && e.to === edgeFrom));
        if (!exists) setGEdges(prev => [...prev, { from: edgeFrom, to: id }]);
      }
      setEdgeFrom(null);
    } else if (mode === "traverse") {
      setStartNode(id);
    }
  };

  const handleMouseDown = (e, id) => {
    if (mode !== "addNode") return;
    const svgRect = svgRef.current?.getBoundingClientRect();
    const move = (me) => {
      setGPos(prev => ({ ...prev, [id]: { x: me.clientX - svgRect.left, y: me.clientY - svgRect.top } }));
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const buildAdj = () => {
    const adj = {};
    gNodes.forEach(n => adj[n.id] = []);
    gEdges.forEach(e => { adj[e.from].push(e.to); adj[e.to].push(e.from); });
    return adj;
  };

  const runTraversal = () => {
    if (!startNode) return;
    const adj = buildAdj();
    const ord = algo === "bfs" ? graphBFS(adj, startNode) : graphDFS(adj, startNode);
    setOrder(ord); setStep(0); setVisited(new Set()); setCurrent(ord[0]);
    setRunning(true);
    let i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++;
      if (i >= ord.length) { clearInterval(timerRef.current); setRunning(false); setCurrent(null); return; }
      setCurrent(ord[i]);
      setVisited(prev => new Set([...prev, ord[i - 1]]));
      setStep(i);
    }, SPEEDS[speed]);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setVisited(new Set()); setCurrent(null); setStep(-1); setRunning(false); setOrder([]);
  };

  const clearAll = () => {
    reset(); setGNodes([]); setGEdges([]); setGPos({}); setEdgeFrom(null); setStartNode(null);
    nodeCounter.current = 0;
  };

  // Preset graphs
  const loadPreset = (preset) => {
    clearAll();
    setTimeout(() => {
      if (preset === "simple") {
        const nodes = [
          { id:"A", label:"A" }, { id:"B", label:"B" }, { id:"C", label:"C" },
          { id:"D", label:"D" }, { id:"E", label:"E" }, { id:"F", label:"F" }
        ];
        const pos = { A:{x:300,y:60}, B:{x:160,y:160}, C:{x:440,y:160}, D:{x:80,y:280}, E:{x:240,y:280}, F:{x:400,y:280} };
        const edges = [{from:"A",to:"B"},{from:"A",to:"C"},{from:"B",to:"D"},{from:"B",to:"E"},{from:"C",to:"F"}];
        setGNodes(nodes); setGPos(pos); setGEdges(edges); nodeCounter.current = 6;
      } else if (preset === "cycle") {
        const nodes = [{id:"1",label:"1"},{id:"2",label:"2"},{id:"3",label:"3"},{id:"4",label:"4"},{id:"5",label:"5"}];
        const r = 120, cx = 300, cy = 180;
        const pos = {};
        nodes.forEach((n, i) => {
          const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          pos[n.id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
        });
        const edges = nodes.map((n, i) => ({ from: n.id, to: nodes[(i+1)%nodes.length].id }));
        setGNodes(nodes); setGPos(pos); setGEdges(edges); nodeCounter.current = 5;
      }
    }, 50);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const modeColors = { addNode: C.accentL, addEdge: C.cyan, traverse: C.green };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "addNode", label: "➕ Add Node" },
          { id: "addEdge", label: "🔗 Add Edge" },
          { id: "traverse", label: "▶ Traverse" },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setEdgeFrom(null); }}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${mode === m.id ? modeColors[m.id] : C.border}`, background: mode === m.id ? modeColors[m.id] + "18" : "transparent", color: mode === m.id ? modeColors[m.id] : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: mode === m.id ? 700 : 400, cursor: "pointer", transition: "all .15s" }}>
            {m.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={() => loadPreset("simple")} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>Sample Tree</button>
          <button onClick={() => loadPreset("cycle")}  style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>Cycle Graph</button>
          <button onClick={clearAll} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.red}40`, background: "transparent", color: C.red, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>Clear</button>
        </div>
      </div>

      {/* Mode-specific controls */}
      {mode === "addNode" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={nodeLabel} onChange={e => setNodeLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addNode()}
            placeholder="Node label (or leave blank)"
            style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none" }}
          />
          <button onClick={addNode} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: C.accentL, color: "#fff", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Add
          </button>
        </div>
      )}
      {mode === "addEdge" && (
        <div style={{ background: C.cyan + "12", border: `1px solid ${C.cyan}30`, borderRadius: 9, padding: "9px 13px", fontSize: 11, color: C.cyan, fontFamily: "'JetBrains Mono',monospace" }}>
          {edgeFrom ? `Click second node to connect from "${gNodes.find(n=>n.id===edgeFrom)?.label}"` : "Click first node to start edge"}
        </div>
      )}
      {mode === "traverse" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
            {startNode ? `Start: ${gNodes.find(n=>n.id===startNode)?.label}` : "Click a node to set start"}
          </div>
          {[{id:"bfs",label:"BFS"},{id:"dfs",label:"DFS"}].map(a => (
            <button key={a.id} onClick={() => setAlgo(a.id)}
              style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${algo === a.id ? C.green : C.border}`, background: algo === a.id ? C.green + "18" : "transparent", color: algo === a.id ? C.green : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer" }}>
              {a.label}
            </button>
          ))}
          {["slow","normal","fast"].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${speed === s ? C.cyan : C.border}`, background: speed === s ? C.cyan + "18" : "transparent", color: speed === s ? C.cyan : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer" }}>
              {s}
            </button>
          ))}
          <button onClick={runTraversal} disabled={!startNode || running}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: startNode && !running ? C.green : C.border, color: "#fff", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: startNode && !running ? "pointer" : "not-allowed" }}>
            {running ? "Running..." : "▶ Run"}
          </button>
          <button onClick={reset} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>Reset</button>
        </div>
      )}

      {/* SVG Canvas */}
      <div ref={svgRef} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", minHeight: 380, position: "relative" }}>
        {gNodes.length === 0 && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, pointerEvents: "none" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
            Click <strong style={{ color: C.accentL }}>Sample Tree</strong> or add nodes manually
          </div>
        )}
        <GraphSVG gNodes={gNodes} gEdges={gEdges} gPos={gPos} visited={visited} current={current} C={C}
          onNodeClick={handleNodeClick} onMouseDown={handleMouseDown}
        />
      </div>

      {/* Traversal order */}
      {order.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            {algo.toUpperCase()} Traversal Order
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {order.map((id, i) => (
              <div key={i} style={{
                padding: "4px 12px", borderRadius: 8,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
                background: i < step ? C.cyan + "22" : i === step ? C.accentL + "33" : C.card,
                border: `1.5px solid ${i < step ? C.cyan + "55" : i === step ? C.accentL : C.border}`,
                color: i <= step ? C.text : C.muted,
                transition: "all .3s"
              }}>{gNodes.find(n => n.id === id)?.label}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN TAB ─────────────────────────────────────────────────────────────────
export default function GraphTreeTab() {
  const { C } = useTheme();
  const [tab, setTab] = useState("tree");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.accent}15,${C.cyan}08)`, border: `1px solid ${C.accentL}25`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>
              🌳 Graph & Tree Visualizer
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
              Visualize BST operations · BFS · DFS · Graph traversals
            </div>
          </div>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 2, background: C.card, borderRadius: 9, padding: 3, border: `1px solid ${C.border}` }}>
            {[{ id: "tree", label: "🌳 BST" }, { id: "graph", label: "🌐 Graph" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "6px 16px", borderRadius: 7, border: "none",
                background: tab === t.id ? C.accentL + "22" : "transparent",
                color: tab === t.id ? C.accentL : C.muted,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                cursor: "pointer", fontWeight: tab === t.id ? 700 : 400, transition: "all .15s",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {tab === "tree"  && <TreeMode  C={C} />}
      {tab === "graph" && <GraphMode C={C} />}
    </div>
  );
}