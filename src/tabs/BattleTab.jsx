// src/tabs/BattleTab.jsx — Group Battle Mode (up to 10 players)
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";
import { supabase } from "../utils/supabase";
import { runCode } from "../utils/piston";
import {
  createRoom, joinRoom, startBattle, updateMyCode, updateMyLang,
  submitSolution, judgeAllSolutions, saveResults, BATTLE_PROBLEMS
} from "../utils/battle";

function DiffBadge({ diff, C }) {
  const col = diff==="Easy"?C.green:diff==="Medium"?C.orange:C.red;
  return <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:col, background:col+"18", border:`1px solid ${col}35`, borderRadius:8, padding:"2px 8px", fontWeight:700 }}>{diff}</span>;
}

function PlayerSlot({ player, isMe, isCreator, C }) {
  const col = player ? (isMe ? C.accentL : C.cyan) : C.border;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:10, background:player?col+"12":C.surface, border:`1px solid ${col}40`, transition:"all .3s" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", background:player?`linear-gradient(135deg,${col},${col}88)`:`${C.border}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0 }}>
        {player ? player.name[0].toUpperCase() : "?"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:player?C.text:C.muted, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
          {player ? player.name : "Waiting..."}
          {isMe      && <span style={{ fontSize:8, color:C.accentL, background:C.accentL+"18", padding:"1px 5px", borderRadius:6, fontFamily:"'JetBrains Mono',monospace" }}>YOU</span>}
          {isCreator && <span style={{ fontSize:8, color:C.orange,  background:C.orange+"18",  padding:"1px 5px", borderRadius:6, fontFamily:"'JetBrains Mono',monospace" }}>HOST</span>}
        </div>
        {player && <div style={{ fontSize:9, color:col, fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>{player.submitted?"✓ Submitted":"⌨ Coding..."}</div>}
      </div>
      {player?.lang && <span style={{ fontSize:9, color:player.lang==="python"?C.green:C.accentL, fontFamily:"'JetBrains Mono',monospace", opacity:.85 }}>{player.lang==="python"?"🐍":"⚙️"}</span>}
    </div>
  );
}

function Timer({ seconds, total, C }) {
  const pct=seconds/total, r=28, circ=2*Math.PI*r;
  const col=pct>.5?C.green:pct>.25?C.orange:C.red;
  const mins=Math.floor(seconds/60), secs=seconds%60;
  return (
    <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
      <svg width={72} height={72} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke={C.border} strokeWidth={4}/>
        <circle cx={36} cy={36} r={r} fill="none" stroke={col} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s linear, stroke .5s" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, color:col }}>{mins}:{secs.toString().padStart(2,"0")}</div>
      </div>
    </div>
  );
}

function Podium({ rankings, C }) {
  const medals=["🥇","🥈","🥉"];
  const top3=rankings.slice(0,3), rest=rankings.slice(3);
  const order=[top3[1],top3[0],top3[2]], heights=[140,180,110], cols=[C.muted,C.orange,C.cyan];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:600 }}>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:10 }}>
        {order.map((r,i)=>{
          if (!r) return <div key={i} style={{ flex:1 }}/>;
          const isWinner=i===1;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              {isWinner && <div style={{ fontSize:26, animation:"float 2s ease infinite" }}>👑</div>}
              <div style={{ width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${cols[i]},${cols[i]}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff", boxShadow:`0 0 18px ${cols[i]}44` }}>{r.player_name[0].toUpperCase()}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color:C.text, textAlign:"center" }}>{r.player_name}</div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:15, fontWeight:700, color:cols[i] }}>{r.score}</div>
              <div style={{ width:"100%", height:heights[i], background:`linear-gradient(180deg,${cols[i]}30,${cols[i]}18)`, border:`1px solid ${cols[i]}40`, borderRadius:"8px 8px 0 0", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:8 }}>
                <span style={{ fontSize:22 }}>{medals[i===1?0:i===0?1:2]}</span>
              </div>
            </div>
          );
        })}
      </div>
      {rest.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {rest.map((r,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14, fontWeight:700, color:C.muted, width:24 }}>#{r.rank}</div>
              <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${C.muted},${C.muted}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff" }}>{r.player_name[0].toUpperCase()}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:C.text }}>{r.player_name}</div>
                <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{r.verdict}</div>
              </div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:16, fontWeight:700, color:C.muted }}>{r.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BattleTab({ user }) {
  const { C } = useTheme();
  const [screen,       setScreen]       = useState("lobby");
  const [diffFilter,   setDiffFilter]   = useState("Easy");
  const [selectedProb, setSelectedProb] = useState(null);
  const [timeLimit,    setTimeLimit]    = useState(10);
  const [maxPlayers,   setMaxPlayers]   = useState(2);
  const [joinCode,     setJoinCode]     = useState("");
  const [room,         setRoom]         = useState(null);
  const [players,      setPlayers]      = useState([]);
  const [myCode,       setMyCode]       = useState("");
  const [myLang,       setMyLang]       = useState("cpp");
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [submitted,    setSubmitted]    = useState(false);
  const [judging,      setJudging]      = useState(false);
  const [rankings,     setRankings]     = useState(null);
  const [summary,      setSummary]      = useState("");
  const [runResult,    setRunResult]    = useState(null);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [copied,       setCopied]       = useState(false);

  const timerRef=useRef(null), codeRef=useRef(""), roomRef=useRef(null), amICreatorRef=useRef(false);
  codeRef.current=myCode; roomRef.current=room;

  const userName=user?.user_metadata?.name||user?.user_metadata?.full_name||user?.email?.split("@")[0]||"Player";
  const amICreator=room?.created_by===user?.id;
  amICreatorRef.current=amICreator;
  const submittedCount=players.filter(p=>p.submitted).length;

  const setupRealtime=useCallback((roomCode)=>{
    supabase.channel(`room:${roomCode}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"battle_rooms",filter:`id=eq.${roomCode}`},
        payload=>{
          const r=payload.new; setRoom(r);
          if (r.status==="active"){ setScreen("battle"); startTimer(r.time_limit*60); }
          if (r.status==="done") stopTimer();
        }
      ).subscribe();

    supabase.channel(`players:${roomCode}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"battle_players",filter:`room_id=eq.${roomCode}`},
        async()=>{
          const {data}=await supabase.from("battle_players").select("*").eq("room_id",roomCode);
          const pl=data||[]; setPlayers(pl);
          const r=roomRef.current;
          if (r?.status==="active"&&pl.length>=2&&pl.every(p=>p.submitted)&&amICreatorRef.current){
            triggerJudging(r,pl);
          }
          if (r?.status==="done"){
            const ranked=[...pl].sort((a,b)=>(a.rank||99)-(b.rank||99));
            setRankings(ranked.map(p=>({player_name:p.name,rank:p.rank,score:p.score,verdict:p.verdict,reason:""})));
            setScreen("result");
          }
        }
      ).subscribe();
  },[]);

  function startTimer(secs){
    setTimeLeft(secs);
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);handleTimeUp();return 0;} return t-1; });
    },1000);
  }
  function stopTimer(){ clearInterval(timerRef.current); }
  useEffect(()=>()=>stopTimer(),[]);

  useEffect(()=>{
    if(screen!=="battle"||!room?.id) return;
    const iv=setInterval(()=>{ updateMyCode({roomCode:room.id,userId:user.id,code:codeRef.current}).catch(()=>{}); },3000);
    return ()=>clearInterval(iv);
  },[screen,room?.id,user?.id]);

  async function handleTimeUp(){
    if(!room?.id) return;
    await updateMyCode({roomCode:room.id,userId:user.id,code:codeRef.current});
    if(amICreatorRef.current){
      const{data}=await supabase.from("battle_players").select("*").eq("room_id",room.id);
      triggerJudging(room,data||[]);
    }
  }

  async function triggerJudging(r,p){
    if(!amICreatorRef.current) return;
    const{data:curr}=await supabase.from("battle_rooms").select("status").eq("id",r.id).single();
    if(curr?.status==="judging"||curr?.status==="done") return;
    await supabase.from("battle_rooms").update({status:"judging"}).eq("id",r.id);
    setJudging(true);
    try{
      const result=await judgeAllSolutions({room:r,players:p});
      await saveResults({roomCode:r.id,rankings:result.rankings,players:p});
      setSummary(result.summary||""); setRankings(result.rankings); setScreen("result");
    }catch(e){console.error(e);}
    setJudging(false);
  }

  async function handleCreate(){
    setLoading(true); setError("");
    try{
      const data=await createRoom({userId:user.id,userName,timeLimit,maxPlayers,problemId:selectedProb?.id});
      setRoom(data);
      const{data:pl}=await supabase.from("battle_players").select("*").eq("room_id",data.id);
      setPlayers(pl||[]); setScreen("waiting"); setupRealtime(data.id);
    }catch(e){setError(e.message);}
    setLoading(false);
  }

  async function handleJoin(){
    if(!joinCode.trim()){setError("Enter a room code!");return;}
    setLoading(true); setError("");
    try{
      const data=await joinRoom({roomCode:joinCode,userId:user.id,userName});
      setRoom(data);
      const{data:pl}=await supabase.from("battle_players").select("*").eq("room_id",data.id);
      setPlayers(pl||[]); setScreen("waiting"); setupRealtime(data.id);
    }catch(e){setError(e.message);}
    setLoading(false);
  }

  async function handleStart(){
    if(players.length<2){setError("Need at least 2 players!");return;}
    await startBattle(room.id);
  }

  async function handleSubmit(){
    if(submitted||!myCode.trim()) return;
    setSubmitted(true);
    const result=await runCode(myLang,myCode);
    setRunResult(result);
    await submitSolution({roomCode:room.id,userId:user.id,code:myCode,lang:myLang});
    const{data}=await supabase.from("battle_players").select("*").eq("room_id",room.id);
    if(data?.every(p=>p.submitted)&&amICreatorRef.current) triggerJudging(room,data);
  }

  async function handleLangChange(l){
    setMyLang(l);
    if(room?.id) updateMyLang({roomCode:room.id,userId:user.id,lang:l}).catch(()=>{});
  }

  async function copyCode(){
    await navigator.clipboard.writeText(room?.id||"");
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  function reset(){
    stopTimer();
    setScreen("lobby");setRoom(null);setPlayers([]);setMyCode("");
    setSubmitted(false);setJudging(false);setRankings(null);setSummary("");
    setRunResult(null);setError("");setJoinCode("");
  }

  // ════ LOBBY ════════════════════════════════════════════════
  if(screen==="lobby") return (
    <div style={{ minHeight:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,padding:"0 8px" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} @keyframes glow{0%,100%{box-shadow:0 0 20px ${C.accent}44}50%{box-shadow:0 0 40px ${C.accent}88}}`}</style>

      <div style={{ textAlign:"center",marginBottom:28,animation:"fadeUp .5s ease" }}>
        <div style={{ fontSize:44,marginBottom:8 }}>⚔️</div>
        <div style={{ fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:C.text,marginBottom:5 }}>Group Battle Mode</div>
        <div style={{ fontSize:12,color:C.text,fontFamily:"'JetBrains Mono',monospace",opacity:.85 }}>Up to 10 players · Same problem · AI ranks everyone 🏆</div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,width:"100%",maxWidth:780,animation:"fadeUp .5s ease .1s both" }}>

        {/* Create */}
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,display:"flex",flexDirection:"column",gap:13 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text }}>🏠 Create Room</div>

          {/* Problem */}
          <div>
            <div style={{ fontSize:10,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",marginBottom:7,textTransform:"uppercase",letterSpacing:1 }}>Problem</div>
            <div style={{ display:"flex",gap:4,marginBottom:7 }}>
              {["Easy","Medium","Hard"].map(d=>{
                const col=d==="Easy"?C.green:d==="Medium"?C.orange:C.red;
                return <button key={d} onClick={()=>{setDiffFilter(d);setSelectedProb(null);}} style={{ flex:1,padding:"5px",borderRadius:7,border:`1px solid ${diffFilter===d?col:C.border}`,background:diffFilter===d?col+"18":"transparent",color:diffFilter===d?col:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",fontWeight:diffFilter===d?700:500,transition:"all .15s",opacity:diffFilter===d?1:.8 }}>{d}</button>;
              })}
            </div>
            <div style={{ maxHeight:120,overflowY:"auto",display:"flex",flexDirection:"column",gap:3 }}>
              <button onClick={()=>setSelectedProb(null)} style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${selectedProb===null?C.accentL:C.border}`,background:selectedProb===null?C.accentL+"15":"transparent",color:selectedProb===null?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",textAlign:"left",opacity:selectedProb===null?1:.85 }}>
                🎲 Random {diffFilter} problem
              </button>
              {BATTLE_PROBLEMS.filter(p=>p.difficulty===diffFilter).map(p=>(
                <button key={p.id} onClick={()=>setSelectedProb(p)} style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${selectedProb?.id===p.id?C.accentL:C.border}`,background:selectedProb?.id===p.id?C.accentL+"15":"transparent",color:selectedProb?.id===p.id?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",textAlign:"left",display:"flex",gap:6,opacity:selectedProb?.id===p.id?1:.85 }}>
                  <span style={{ opacity:.6 }}>#{p.id}</span>{p.title}
                  <span style={{ marginLeft:"auto",opacity:.7,fontSize:9 }}>{p.tags[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max players */}
          <div>
            <div style={{ fontSize:10,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",marginBottom:7,textTransform:"uppercase",letterSpacing:1 }}>Max Players</div>
            <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
              {[2,3,4,5,6,8,10].map(n=>(
                <button key={n} onClick={()=>setMaxPlayers(n)} style={{ flex:1,minWidth:30,padding:"6px 4px",borderRadius:7,border:`1px solid ${maxPlayers===n?C.accentL:C.border}`,background:maxPlayers===n?C.accentL+"18":"transparent",color:maxPlayers===n?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",fontWeight:maxPlayers===n?700:500,opacity:maxPlayers===n?1:.8 }}>{n}</button>
              ))}
            </div>
            <div style={{ fontSize:9,color:C.text,opacity:.75,fontFamily:"'JetBrains Mono',monospace",marginTop:4 }}>
              👥 Host clicks Start when ready — can start with any number up to max
            </div>
          </div>

          {/* Time limit */}
          <div>
            <div style={{ fontSize:10,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",marginBottom:7,textTransform:"uppercase",letterSpacing:1 }}>Time Limit</div>
            <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
              {[5,10,15,20,25].map(t=>(
                <button key={t} onClick={()=>setTimeLimit(t)} style={{ flex:1,padding:"6px 4px",borderRadius:7,border:`1px solid ${timeLimit===t?C.accentL:C.border}`,background:timeLimit===t?C.accentL+"18":"transparent",color:timeLimit===t?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",fontWeight:timeLimit===t?700:500,opacity:timeLimit===t?1:.8 }}>{t}m</button>
              ))}
            </div>
          </div>

          <div style={{ padding:"8px 12px",borderRadius:8,background:C.cyan+"10",border:`1px solid ${C.cyan}25`,fontSize:10,color:C.text,fontFamily:"'JetBrains Mono',monospace",opacity:.9 }}>
            🌐 Each player picks their own language — C++ vs Python allowed!
          </div>

          {error&&<div style={{ fontSize:10,color:C.red,fontFamily:"'JetBrains Mono',monospace" }}>⚠ {error}</div>}

          <button onClick={handleCreate} disabled={loading} style={{ padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.accent},${C.accentL})`,color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,cursor:loading?"not-allowed":"pointer",animation:"glow 2s ease infinite" }}>
            {loading?"Creating...":"⚔️ Create Battle"}
          </button>
        </div>

        {/* Join */}
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,display:"flex",flexDirection:"column",gap:13 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text }}>🔑 Join Room</div>
          <div style={{ fontSize:11,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.7 }}>
            Got a room code? Enter it to join the battle!
          </div>

          <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&handleJoin()}
            placeholder="ABC123" maxLength={6}
            style={{ padding:"14px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontFamily:"'Orbitron',monospace",fontSize:22,fontWeight:700,textAlign:"center",outline:"none",letterSpacing:6,width:"100%" }}/>

          {error&&<div style={{ fontSize:10,color:C.red,fontFamily:"'JetBrains Mono',monospace" }}>⚠ {error}</div>}

          <button onClick={handleJoin} disabled={loading} style={{ padding:"12px",borderRadius:10,border:`1px solid ${C.cyan}50`,background:C.cyan+"15",color:C.text,fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,cursor:loading?"not-allowed":"pointer" }}>
            {loading?"Joining...":"🚀 Join Battle"}
          </button>

          <div style={{ display:"flex",flexDirection:"column",gap:7,marginTop:4 }}>
            {["🏠 Create or join a room","👥 Wait for friends to join","▶️ Host clicks Start Battle","⏱️ Everyone solves same problem","🤖 AI ranks all solutions","🏆 Podium with 🥇🥈🥉 revealed!"].map((s,i)=>(
              <div key={i} style={{ fontSize:10,color:C.text,fontFamily:"'JetBrains Mono',monospace",opacity:.8 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ════ WAITING ROOM ══════════════════════════════════════════
  if(screen==="waiting") return (
    <div style={{ minHeight:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,padding:"0 8px" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ background:C.card,border:`2px dashed ${C.accentL}50`,borderRadius:16,padding:"16px 32px",textAlign:"center" }}>
        <div style={{ fontSize:10,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:2,marginBottom:7 }}>Share this code!</div>
        <div style={{ fontFamily:"'Orbitron',monospace",fontSize:36,fontWeight:700,color:C.accentL,letterSpacing:8 }}>{room?.id}</div>
        <button onClick={copyCode} style={{ marginTop:9,padding:"5px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:copied?C.green+"22":"transparent",color:copied?C.green:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",opacity:.9 }}>
          {copied?"✓ Copied!":"📋 Copy Code"}
        </button>
      </div>

      {room?.problem_title&&(
        <div style={{ display:"flex",gap:8,alignItems:"center",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 16px" }}>
          <span>🧩</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.text }}>{room.problem_title}</span>
          <DiffBadge diff={room.difficulty} C={C}/>
          <span style={{ fontSize:11,color:C.text,opacity:.8,fontFamily:"'JetBrains Mono',monospace" }}>· {room.time_limit}min · max {room.max_players}</span>
        </div>
      )}

      <div style={{ width:"100%",maxWidth:600 }}>
        <div style={{ fontSize:11,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",marginBottom:10 }}>
          👥 Players ({players.length}/{room?.max_players})
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {Array.from({length:room?.max_players||2}).map((_,i)=>{
            const p=players[i];
            return <PlayerSlot key={i} player={p} isMe={p?.user_id===user?.id} isCreator={p?.user_id===room?.created_by} C={C}/>;
          })}
        </div>
      </div>

      {amICreator?(
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
          {error&&<div style={{ fontSize:10,color:C.red,fontFamily:"'JetBrains Mono',monospace" }}>⚠ {error}</div>}
          <button onClick={handleStart} disabled={players.length<2}
            style={{ padding:"13px 36px",borderRadius:12,border:"none",background:players.length>=2?`linear-gradient(135deg,${C.accent},${C.accentL})`:`${C.border}`,color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,cursor:players.length>=2?"pointer":"not-allowed",boxShadow:players.length>=2?`0 0 28px ${C.accent}44`:"none",transition:"all .3s" }}>
            {players.length<2?"⏳ Waiting for players...":`▶️ Start Battle (${players.length} players)`}
          </button>
          <div style={{ fontSize:10,color:C.text,opacity:.75,fontFamily:"'JetBrains Mono',monospace",textAlign:"center" }}>
            You can start with {players.length} player{players.length!==1?"s":""} or wait for more (max {room?.max_players})
          </div>
        </div>
      ):(
        <div style={{ fontSize:13,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",textAlign:"center" }}>
          ⏳ Waiting for host to start the battle...
        </div>
      )}

      <button onClick={reset} style={{ fontSize:10,color:C.muted,background:"transparent",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",textDecoration:"underline dotted" }}>
        Leave Room
      </button>
    </div>
  );

  // ════ BATTLE ARENA ══════════════════════════════════════════
  if(screen==="battle") return (
    <div style={{ display:"flex",flexDirection:"column",gap:10,height:"100%" }}>
      {/* Player pills */}
      <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:5,flex:1,flexWrap:"wrap" }}>
          {players.map(p=>{
            const isMe=p.user_id===user?.id;
            const col=isMe?C.accentL:p.submitted?C.green:C.muted;
            return (
              <div key={p.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:col+"12",border:`1px solid ${col}35`,fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:col }}>
                <div style={{ width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,${col},${col}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff" }}>{p.name[0].toUpperCase()}</div>
                {p.name.split(" ")[0]}{isMe?" (you)":""}{p.submitted?" ✓":""}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:9,color:C.text,opacity:.8,fontFamily:"'JetBrains Mono',monospace" }}>{submittedCount}/{players.length} submitted</div>
            <div style={{ fontSize:9,color:C.muted,fontFamily:"'JetBrains Mono',monospace" }}>{room?.id}</div>
          </div>
          <Timer seconds={timeLeft} total={room?.time_limit*60} C={C}/>
        </div>
      </div>

      {/* Problem + Editor */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,flex:1,minHeight:0 }}>
        <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,overflowY:"auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
            <span style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,color:C.text }}>{room?.problem_title}</span>
            <DiffBadge diff={room?.difficulty} C={C}/>
          </div>
          <pre style={{ fontSize:11,color:C.text,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word",opacity:.9 }}>{room?.problem_text}</pre>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ display:"flex",gap:6,alignItems:"center" }}>
            <span style={{ fontSize:10,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace" }}>Language:</span>
            {[{id:"cpp",label:"⚙️ C++"},{id:"python",label:"🐍 Python"}].map(l=>(
              <button key={l.id} onClick={()=>!submitted&&handleLangChange(l.id)}
                style={{ padding:"4px 12px",borderRadius:7,border:`1px solid ${myLang===l.id?(l.id==="python"?C.green:C.accentL):C.border}`,background:myLang===l.id?(l.id==="python"?C.green:C.accentL)+"18":"transparent",color:myLang===l.id?(l.id==="python"?C.green:C.accentL):C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:submitted?"not-allowed":"pointer",fontWeight:myLang===l.id?700:500,opacity:myLang===l.id?1:.8 }}>
                {l.label}
              </button>
            ))}
          </div>

          <textarea value={myCode} onChange={e=>setMyCode(e.target.value)} disabled={submitted||judging}
            spellCheck={false} placeholder={`// Write your ${myLang==="python"?"Python":"C++"} solution here...`}
            style={{ flex:1,minHeight:260,background:"#0a0a12",color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",fontSize:12,border:`1px solid ${submitted?C.border:C.accentL+"50"}`,borderRadius:10,padding:"12px 14px",resize:"none",outline:"none",lineHeight:1.7,opacity:submitted?.6:1 }}/>

          {judging?(
            <div style={{ padding:"12px",borderRadius:10,background:C.orange+"15",border:`1px solid ${C.orange}35`,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.orange }}>
              🤖 AI is ranking all {players.length} solutions...
            </div>
          ):submitted?(
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              <div style={{ padding:"10px 12px",borderRadius:10,background:C.green+"15",border:`1px solid ${C.green}35`,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.green }}>
                ✓ Submitted! {submittedCount}/{players.length} done
              </div>
              {runResult&&(
                <div style={{ padding:"10px 12px",borderRadius:10,background:runResult.success?C.green+"10":C.red+"10",border:`1px solid ${runResult.success?C.green:C.red}35`,fontFamily:"'JetBrains Mono',monospace",fontSize:11 }}>
                  <div style={{ color:runResult.success?C.green:C.red,fontWeight:700,marginBottom:4 }}>{runResult.success?"✓ Code ran successfully":"✗ Runtime error"}</div>
                  {runResult.stdout&&<div style={{ color:C.text,whiteSpace:"pre-wrap",maxHeight:70,overflow:"auto",opacity:.9 }}>{runResult.stdout}</div>}
                  {runResult.stderr&&<div style={{ color:C.red,whiteSpace:"pre-wrap",maxHeight:50,overflow:"auto",marginTop:4 }}>{runResult.stderr}</div>}
                </div>
              )}
            </div>
          ):(
            <button onClick={handleSubmit} disabled={!myCode.trim()}
              style={{ padding:"13px",borderRadius:10,border:"none",background:myCode.trim()?`linear-gradient(135deg,${C.accent},${C.accentL})`:`${C.border}`,color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,cursor:myCode.trim()?"pointer":"not-allowed",boxShadow:myCode.trim()?`0 0 24px ${C.accent}44`:"none",transition:"all .2s" }}>
              ⚡ Submit Solution
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ════ RESULT PODIUM ══════════════════════════════════════════
  if(screen==="result") return (
    <div style={{ minHeight:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:"20px 8px" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>

      {judging&&!rankings?(
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🤖</div>
          <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.text,marginBottom:6 }}>AI is ranking everyone...</div>
          <div style={{ fontSize:11,color:C.text,opacity:.8,fontFamily:"'JetBrains Mono',monospace" }}>Comparing {players.length} solutions</div>
        </div>
      ):rankings?(
        <>
          <div style={{ textAlign:"center",animation:"fadeUp .5s ease" }}>
            <div style={{ fontSize:44,animation:"float 2s ease infinite",marginBottom:8 }}>🏆</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4 }}>Battle Over!</div>
            {rankings[0]&&<div style={{ fontSize:14,color:C.orange,fontFamily:"'JetBrains Mono',monospace",marginBottom:4 }}>🥇 Winner: {rankings[0].player_name}</div>}
            {summary&&<div style={{ fontSize:11,color:C.text,opacity:.85,fontFamily:"'JetBrains Mono',monospace",maxWidth:500,lineHeight:1.7 }}>{summary}</div>}
          </div>
          <div style={{ animation:"fadeUp .5s ease .1s both",width:"100%" }}><Podium rankings={rankings} C={C}/></div>
          <div style={{ display:"flex",gap:10,animation:"fadeUp .5s ease .2s both" }}>
            <button onClick={reset} style={{ padding:"11px 28px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.accent},${C.accentL})`,color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:`0 0 20px ${C.accent}44` }}>⚔️ New Battle</button>
            <button onClick={reset} style={{ padding:"11px 20px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",opacity:.8 }}>Back to Lobby</button>
          </div>
        </>
      ):null}
    </div>
  );
}