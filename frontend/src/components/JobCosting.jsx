import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PRJ_SC, ROLE_C } from '../constants';
import { fmt, pct, getBurdenedRate } from '../utils/calculations';
import { Chip, KpiCard, ES, CTip } from './shared/ui';
import I from './shared/Icons';

export default function JobCosting({projs,custs,hrs,subs,roles}) {
  const [selP,setSelP]=useState(projs[0]?.id||null);
  const sp=projs.find(p=>p.id===selP);

  const pHrs=selP?hrs.filter(h=>h.projId===selP).sort((a,b)=>new Date(b.date)-new Date(a.date)):[];
  const pSubHrs=pHrs.map(h=>{
    const sub=subs.find(e=>e.id===h.subId);
    return {...h,sub,billed:h.hours*(sub?.billableRate||0),trueCost:h.hours*getBurdenedRate(roles,sub?.role,sub?.hourlyWage||0)};
  });
  const totBilled=pSubHrs.reduce((s,h)=>s+h.billed,0);
  const totCost=pSubHrs.reduce((s,h)=>s+h.trueCost,0);
  const totHrs=pSubHrs.reduce((s,h)=>s+h.hours,0);
  const laborMargin=totBilled>0?pct(totBilled-totCost,totBilled):0;

  const totalActual=sp?sp.actualLabor+sp.actualMaterials:0;
  const totalBudget=sp?sp.budgetLabor+sp.budgetMaterials:0;
  const grossProfit=sp?sp.contractValue-totalActual:0;
  const grossMargin=sp&&sp.contractValue>0?pct(grossProfit,sp.contractValue):0;

  const byRole={};
  pSubHrs.forEach(h=>{
    const t=h.sub?.role||"Unknown";
    if(!byRole[t])byRole[t]={role:t,hours:0,billed:0,cost:0};
    byRole[t].hours+=h.hours;byRole[t].billed+=h.billed;byRole[t].cost+=h.trueCost;
  });

  const allProjData=projs.map(p=>({
    name:p.name.split(" ").slice(0,2).join(" "),
    contract:p.contractValue,
    actual:p.actualLabor+p.actualMaterials,
    profit:p.contractValue-(p.actualLabor+p.actualMaterials),
  }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {projs.map(p=><button key={p.id} onClick={()=>setSelP(p.id)} style={{padding:"7px 13px",borderRadius:9,fontSize:12,fontWeight:700,border:`1px solid ${selP===p.id?"var(--accent)":"var(--border)"}`,background:selP===p.id?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.12)":"var(--bg-card)",color:selP===p.id?"var(--accent-light)":"var(--text-muted)",transition:"all .14s"}}>{p.name.split(" ").slice(0,3).join(" ")}</button>)}
      </div>

      {sp&&<>
        <div className="g6">
          {[{l:"Contract",v:fmt(sp.contractValue),c:"#3b82f6"},{l:"Total Budget",v:fmt(totalBudget),c:"#f5a623"},{l:"Total Actual",v:fmt(totalActual),c:totalActual>totalBudget?"#ef4444":"#22c55e"},{l:"Variance",v:fmt(totalActual-totalBudget),c:totalActual>totalBudget?"#ef4444":"#22c55e"},{l:"Gross Profit",v:fmt(grossProfit),c:grossProfit>=0?"#22c55e":"#ef4444"},{l:"Gross Margin",v:`${grossMargin}%`,c:grossMargin>=25?"#22c55e":grossMargin>=15?"#f5a623":"#ef4444"}].map(k=>(
            <KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>
          ))}
        </div>

        <div className="jc-grid" style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:13}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"11px 16px",borderBottom:"1px solid var(--border)",fontWeight:800,fontSize:12}}>Labor Detail — {sp.name.split(" ").slice(0,3).join(" ")}</div>
            {pSubHrs.length===0?<ES icon="employees" text="No hours logged for this project."/>:<>
              <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:480}}>
                <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Crew Member","Role","Hours","Billed","True Cost","Margin"].map(h=><th key={h} style={{padding:"7px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {pSubHrs.map((h,i)=>{
                    const m=h.billed>0?pct(h.billed-h.trueCost,h.billed):0;
                    return <tr key={h.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                      <td style={{padding:"7px 13px",color:"var(--text-2)",fontWeight:600}}>{h.sub?.company||h.sub?.name}</td>
                      <td style={{padding:"7px 13px"}}><span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:`${ROLE_C[h.sub?.role]||"#4a566e"}22`,color:ROLE_C[h.sub?.role]||"var(--text-muted)"}}>{h.sub?.role}</span></td>
                      <td className="mn" style={{padding:"7px 13px",color:"#63b3ed"}}>{h.hours}h</td>
                      <td className="mn" style={{padding:"7px 13px",color:"#22c55e"}}>{fmt(h.billed)}</td>
                      <td className="mn" style={{padding:"7px 13px",color:"#ef4444"}}>{fmt(h.trueCost)}</td>
                      <td className="mn" style={{padding:"7px 13px",color:m>=30?"#22c55e":"#f5a623"}}>{m}%</td>
                    </tr>;
                  })}
                </tbody>
              </table>
              </div>
              <div style={{padding:"9px 16px",background:"var(--bg-sidebar)",borderTop:"2px solid var(--border-2)",display:"flex",gap:18}}>
                {[{l:"Total Hrs",v:`${totHrs}h`,c:"#63b3ed"},{l:"Total Billed",v:fmt(totBilled),c:"#22c55e"},{l:"True Labor Cost",v:fmt(totCost),c:"#ef4444"},{l:"Labor Margin",v:`${laborMargin}%`,c:laborMargin>=30?"#22c55e":"#f5a623"}].map(k=>(
                  <div key={k.l}><div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase"}}>{k.l}</div><div className="mn" style={{fontSize:12,color:k.c,marginTop:2}}>{k.v}</div></div>
                ))}
              </div>
            </>}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:13}}>
              <div style={{fontWeight:800,fontSize:12,marginBottom:11}}>Budget vs. Actual</div>
              {[{l:"Labor",budget:sp.budgetLabor,actual:sp.actualLabor,c:"#f5a623"},{l:"Materials",budget:sp.budgetMaterials,actual:sp.actualMaterials,c:"#6c8ebf"},{l:"Total",budget:totalBudget,actual:totalActual,c:"#3b82f6"}].map(row=>{
                const over=row.actual>row.budget;
                const usePct=row.budget>0?Math.min((row.actual/row.budget)*100,100):0;
                return <div key={row.l} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:11}}>
                    <span style={{color:"var(--text-muted)"}}>{row.l}</span>
                    <span><span className="mn" style={{color:row.c,fontSize:10}}>{fmt(row.budget)}</span><span style={{color:"var(--text-faint)",fontSize:10}}> → </span><span className="mn" style={{color:over?"#ef4444":"#22c55e",fontSize:10}}>{fmt(row.actual)}</span></span>
                  </div>
                  <div style={{height:5,background:"var(--bg-sidebar)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${usePct}%`,background:over?"#ef4444":row.c}}/></div>
                  {over&&<div style={{fontSize:9,color:"#ef4444",marginTop:2}}>Over by {fmt(row.actual-row.budget)}</div>}
                </div>;
              })}
            </div>
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:13}}>
              <div style={{fontWeight:800,fontSize:12,marginBottom:9}}>By Role</div>
              {Object.values(byRole).length===0?<div style={{fontSize:11,color:"var(--text-faint)"}}>No labor logged.</div>:Object.values(byRole).map(t=>(
                <div key={t.role} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)",fontSize:11}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:6,height:6,borderRadius:2,background:ROLE_C[t.role]||"#4a566e"}}/><span style={{color:"var(--text-2)"}}>{t.role}</span></div>
                  <div style={{display:"flex",gap:12}}><span className="mn" style={{color:"#63b3ed",fontSize:10}}>{t.hours}h</span><span className="mn" style={{color:"#22c55e",fontSize:10}}>{fmt(t.billed)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"13px 16px 8px"}}>
          <div style={{fontWeight:800,fontSize:12,marginBottom:9}}>All Projects — Contract vs Actual vs Profit</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={allProjData} margin={{top:4,right:8,left:-18,bottom:0}} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<CTip/>}/>
              <Bar dataKey="contract" name="Contract" fill="#3b82f6" radius={[3,3,0,0]}/>
              <Bar dataKey="actual"   name="Actual Cost" fill="#ef4444" radius={[3,3,0,0]}/>
              <Bar dataKey="profit"   name="Profit" fill="#22c55e" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}
    </div>
  );
}
