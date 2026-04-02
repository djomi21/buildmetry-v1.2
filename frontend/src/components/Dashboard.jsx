import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { REV_DATA, PRJ_SC } from '../constants';
import { calcInv, fmt, pct } from '../utils/calculations';
import { KpiCard, CTip, Chip, Pr } from './shared/ui';
import I from './shared/Icons';

export default function Dashboard({custs,ests,projs,invs,setTab}) {
  const ytd   = REV_DATA.slice(0,3).reduce((s,m)=>({rev:s.rev+m.revenue,prof:s.prof+m.profit}),{rev:0,prof:0});
  const iCalcs= invs.map(i=>({...i,...calcInv(i.lineItems,i.taxRate,i.discount||0)}));
  const coll  = iCalcs.filter(i=>i.status==="paid").reduce((s,i)=>s+i.total,0);
  const sent  = iCalcs.filter(i=>i.status==="sent").reduce((s,i)=>s+i.total,0);
  const ovAmt = iCalcs.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.total,0);
  const draft = iCalcs.filter(i=>i.status==="draft").reduce((s,i)=>s+i.total,0);
  const actv  = projs.filter(p=>p.status==="active");

  const arPie=[
    {name:"Collected",value:coll,fill:"#22c55e"},
    {name:"Sent",value:sent,fill:"#3b82f6"},
    {name:"Overdue",value:ovAmt,fill:"#ef4444"},
    {name:"Draft",value:draft,fill:"#4a5068"},
  ].filter(d=>d.value>0);

  const kpis=[
    {label:"YTD Revenue",      val:fmt(ytd.rev),  sub:`Avg ${fmt(ytd.rev/3)}/mo`,                        color:"#63b3ed"},
    {label:"YTD Gross Profit", val:fmt(ytd.prof), sub:`${pct(ytd.prof,ytd.rev)}% margin`,                color:"#22c55e"},
    {label:"Invoiced",         val:fmt(iCalcs.reduce((s,i)=>s+i.total,0)), sub:`${invs.length} invoices`,color:"#a78bfa"},
    {label:"Collected",        val:fmt(coll),      sub:`${pct(coll,iCalcs.reduce((s,i)=>s+i.total,0))}% rate`, color:"#22c55e"},
    {label:"Active Projects",  val:actv.length,    sub:`${projs.filter(p=>p.status==="complete").length} complete`, color:"#f5a623"},
    {label:"Pending Estimates",val:ests.filter(e=>e.status==="draft"||e.status==="sent").length, sub:"Awaiting approval", color:"#fb923c"},
    {label:"Customers",        val:custs.length,   sub:`${custs.filter(c=>c.tags.includes("Hot Lead")).length} hot leads`, color:"#14b8a6"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:11}}>
        {kpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
        <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:13,padding:"16px 16px 8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div><div style={{fontWeight:800,fontSize:13}}>Revenue vs. Profit — 2026</div><div style={{fontSize:10,color:"var(--text-dim)",marginTop:1}}>Monthly trend</div></div>
            <span className="mn" style={{fontSize:12,color:"#63b3ed"}}>{fmt(ytd.rev)} YTD</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={REV_DATA} margin={{top:4,right:4,left:-24,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={.2}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<CTip/>}/>
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" dot={false}/>
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#22c55e" strokeWidth={2} fill="url(#g2)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:13,padding:"13px 15px",flex:1}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:8}}>A/R Status</div>
            <div style={{display:"flex",gap:0,height:90}}>
              <ResponsiveContainer width="45%" height="100%">
                <PieChart><Pie data={arPie} cx="50%" cy="50%" innerRadius={26} outerRadius={42} dataKey="value" paddingAngle={3}>{arPie.map(e=><Cell key={e.name} fill={e.fill}/>)}</Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{background:"var(--bg-darker)",border:"1px solid var(--border-2)",borderRadius:7,fontSize:10}}/></PieChart>
              </ResponsiveContainer>
              <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:5}}>
                {arPie.map(d=><div key={d.name} style={{display:"flex",justifyContent:"space-between",fontSize:10}}><div style={{display:"flex",gap:5,alignItems:"center"}}><div style={{width:6,height:6,borderRadius:1,background:d.fill}}/><span style={{color:"var(--text-muted)"}}>{d.name}</span></div><span className="mn" style={{color:d.fill,fontSize:10}}>{fmt(d.value)}</span></div>)}
              </div>
            </div>
          </div>
          {ovAmt>0&&<div style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.18)",borderRadius:11,padding:"11px 14px"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:.5,marginBottom:7,display:"flex",gap:5,alignItems:"center"}}><I n="alert" s={11}/>Overdue</div>
            {invs.filter(i=>i.status==="overdue").map(i=>{const c=custs.find(x=>x.id===i.custId);const v=calcInv(i.lineItems,i.taxRate,i.discount||0).total;return <div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:"var(--text-2)"}}>{c?.name}</span><span className="mn" style={{color:"#ef4444"}}>{fmt(v)}</span></div>;})}
          </div>}
        </div>
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:13,overflow:"hidden"}}>
        <div style={{padding:"11px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:800,fontSize:13}}>Active Projects</div>
          <button onClick={()=>setTab("projects")} className="bb b-gh" style={{padding:"4px 11px",fontSize:11}}>View All <I n="arrow" s={11}/></button>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Project","Customer","Contract","Budget Labor","Budget Mat","Progress","Status"].map(h=><th key={h} style={{padding:"7px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.4,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
          <tbody>
            {actv.map((p,i)=>{
              const c=custs.find(x=>x.id===p.custId);
              const pc=p.progress>=90?"#22c55e":p.progress>=50?"#3b82f6":"#f5a623";
              return <tr key={p.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td style={{padding:"8px 14px",fontWeight:700,color:"var(--text-2)"}}>{p.name}</td>
                <td style={{padding:"8px 14px",color:"var(--text-muted)"}}>{c?.name}</td>
                <td className="mn" style={{padding:"8px 14px",color:"var(--accent)"}}>{fmt(p.contractValue)}</td>
                <td className="mn" style={{padding:"8px 14px",color:"#f5a623"}}>{fmt(p.budgetLabor)}</td>
                <td className="mn" style={{padding:"8px 14px",color:"#6c8ebf"}}>{fmt(p.budgetMaterials)}</td>
                <td style={{padding:"8px 14px",minWidth:110}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{flex:1}}><Pr v={p.progress} color={pc}/></div>
                    <span className="mn" style={{fontSize:9,color:"var(--text-muted)"}}>{p.progress}%</span>
                  </div>
                </td>
                <td style={{padding:"8px 14px"}}><Chip s={p.status} map={PRJ_SC}/></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
