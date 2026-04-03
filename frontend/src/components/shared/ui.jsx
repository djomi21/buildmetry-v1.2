import React, { useState } from 'react';
import { INV_SC } from '../../constants';
import { fmt, fmtK } from '../../utils/calculations';
import { I } from './Icons';

// ── STATUS CHIP ────────────────────────────────────────────────
export const Chip = ({s, map}) => {
  const sc = (map||INV_SC)[s] || {bg:"rgba(74,80,104,.15)",c:"#7a8299",label:s};
  return (
    <span style={{padding:"2px 9px",borderRadius:12,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.4,background:sc.bg,color:sc.c}}>
      {sc.label}
    </span>
  );
};

// ── KPI CARD ──────────────────────────────────────────────────
export const KpiCard = ({label, val, sub, color}) => (
  <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"13px 15px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,right:0,width:44,height:44,background:color,opacity:.05,borderRadius:"0 0 0 44px"}}/>
    <div style={{fontSize:9,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.6,marginBottom:7,lineHeight:1.3}}>{label}</div>
    <div className="mn" style={{fontSize:20,color:color,letterSpacing:-1}}>{val}</div>
    <div style={{fontSize:10,color:"var(--text-faint)",marginTop:4}}>{sub}</div>
  </div>
);

// ── CHART TOOLTIP ─────────────────────────────────────────────
export const CTip = ({active, payload, label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--bg-darker)",border:"1px solid var(--border-2)",borderRadius:9,padding:"9px 13px",fontSize:11}}>
      <div style={{fontWeight:700,marginBottom:5,color:"var(--text)"}}>{label}</div>
      {payload.map(p=>(
        <div key={p.dataKey} style={{color:p.color,display:"flex",justifyContent:"space-between",gap:14}}>
          <span>{p.name}</span>
          <span className="mn">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── EMPTY STATE ────────────────────────────────────────────────
export const ES = ({icon, text}) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"38px 20px",color:"var(--text-ghost)",gap:10,textAlign:"center"}}>
    <I n={icon} s={28}/>
    <div style={{fontSize:13}}>{text}</div>
  </div>
);

// ── PROGRESS BAR ───────────────────────────────────────────────
export const Pr = ({v, color}) => (
  <div style={{height:5,background:"var(--bg-card)",borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",borderRadius:3,width:`${v}%`,background:color||"var(--accent)",transition:"width .6s ease"}}/>
  </div>
);

// ── TOGGLE SWITCH ──────────────────────────────────────────────
export const ToggleSwitch = ({defaultOn=false, on: controlledOn, onChange}) => {
  const [internal, setInternal] = useState(defaultOn);
  const on = controlledOn !== undefined ? controlledOn : internal;
  const toggle = () => {
    if(controlledOn === undefined) setInternal(v=>!v);
    onChange?.(!on);
  };
  return (
    <div onClick={toggle} style={{width:36,height:20,borderRadius:10,background:on?"var(--accent)":"var(--border-2)",cursor:"pointer",transition:"background .2s",position:"relative",flexShrink:0}}>
      <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?19:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
    </div>
  );
};

// ── SMALL HELPERS (not components, but UI utilities) ───────────
export const ini = n => n?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"??";
export const avC = id => ["#3b82f6","#a78bfa","#22c55e","#f5a623","#fb923c","#6366f1","#14b8a6"][id%7];

// ── CONFIRM DELETE MODAL ───────────────────────────────────────
export function ConfirmDeleteModal({ label = "this item", onConfirm, onCancel }) {
  return (
    <div className="ov" onClick={onCancel}>
      <div className="mo" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div style={{borderBottom:"1px solid var(--border)",padding:"14px 18px",fontWeight:600,fontSize:15}}>
          Confirm Delete
        </div>
        <div style={{padding:"20px 18px",color:"var(--text-dim)",fontSize:14}}>
          Delete {label}? This cannot be undone.
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,padding:"0 18px 16px"}}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" style={{background:"#ef4444",color:"#fff",borderColor:"#ef4444"}} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
