import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ROLE_C, PRJ_SC, INV_SC } from '../constants';
import { calcInv, fmt, tod, pct, getBurdenedRate, printDoc } from '../utils/calculations';
import { KpiCard, Chip, CTip } from './shared/ui';

export default function Reports({invs,projs,custs,subs,hrs,roles,expenses,company}) {
  const [rtab,setRtab]=useState("pl");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");

  const inRange=(dateStr)=>{
    if(!dateFrom&&!dateTo)return true;
    const d=new Date(dateStr);
    if(dateFrom&&d<new Date(dateFrom))return false;
    if(dateTo&&d>new Date(dateTo))return false;
    return true;
  };

  const iAll=useMemo(()=>invs.map(i=>({...i,...calcInv(i.lineItems,i.taxRate,i.discount||0)})),[invs]);
  const curYear=new Date().getFullYear();
  const [selYear,setSelYear]=useState(curYear);
  const monthlyData=useMemo(()=>{
    const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const acc=MONTHS.map(m=>({month:m,revenue:0,labor:0,materials:0,totalCost:0,profit:0}));
    invs.filter(i=>i.status!=="void"&&inRange(i.issueDate)).forEach(inv=>{
      const d=new Date(inv.issueDate);if(d.getFullYear()!==selYear)return;
      acc[d.getMonth()].revenue+=calcInv(inv.lineItems,inv.taxRate,inv.discount||0).total;
    });
    (expenses||[]).filter(exp=>inRange(exp.date)).forEach(exp=>{
      const d=new Date(exp.date);if(d.getFullYear()!==selYear)return;
      const mIdx=d.getMonth();acc[mIdx].totalCost+=exp.amount;
      if(exp.category==="Labor"||exp.category==="Subcontractor/Crew")acc[mIdx].labor+=exp.amount;
      else if(exp.category==="Materials")acc[mIdx].materials+=exp.amount;
    });
    acc.forEach(m=>{m.profit=m.revenue-m.totalCost;});
    return acc;
  },[invs,expenses,selYear,dateFrom,dateTo]);
  const ytdMonths=useMemo(()=>monthlyData.slice(0,selYear===curYear?new Date().getMonth()+1:12),[monthlyData,selYear]);
  const ytdRev=ytdMonths.reduce((s,m)=>s+m.revenue,0);
  const ytdProfit=ytdMonths.reduce((s,m)=>s+m.profit,0);
  const ytdLabor=ytdMonths.reduce((s,m)=>s+m.labor,0);
  const ytdMats=ytdMonths.reduce((s,m)=>s+m.materials,0);
  const ytdMargin=pct(ytdProfit,ytdRev);

  const arData=useMemo(()=>iAll.filter(i=>inRange(i.issueDate)).map(i=>{
    const due=new Date(i.dueDate);const now=new Date(tod());
    const days=Math.round((now-due)/(1000*60*60*24));
    return {...i,daysPast:days};
  }).sort((a,b)=>b.daysPast-a.daysPast),[iAll,dateFrom,dateTo]);

  const subData=useMemo(()=>subs.map(sub=>{
    const eHrs=hrs.filter(h=>h.subId===sub.id);
    const totH=eHrs.reduce((s,h)=>s+h.hours,0);
    const billed=totH*sub.billableRate;
    const cost=totH*getBurdenedRate(roles,sub.role,sub.hourlyWage);
    return {...sub,totalHours:totH,billed,trueCost:cost,net:billed-cost,margin:billed>0?pct(billed-cost,billed):0};
  }),[subs,hrs]);

  const tabs=[{id:"pl",label:"P&L Summary"},{id:"job",label:"Job P&L"},{id:"ar",label:"A/R Aging"},{id:"labor",label:"Labor Report"}];

  const exportReport=(autoPrint=false)=>{
    const iAll2=invs.map(i=>({...i,...calcInv(i.lineItems,i.taxRate,i.discount||0)}));
    let body="";
    if(rtab==="pl"){
      const rows=ytdMonths.map(m=>{const other=m.revenue-m.labor-m.materials-m.profit;return `<tr><td style="font-weight:700">${m.month}</td><td class="mn" style="text-align:right">${fmt(m.revenue)}</td><td class="mn" style="text-align:right">${fmt(m.labor)}</td><td class="mn" style="text-align:right">${fmt(m.materials)}</td><td class="mn" style="text-align:right">${fmt(other)}</td><td class="mn" style="text-align:right;font-weight:700">${fmt(m.profit)}</td><td class="mn" style="text-align:right">${pct(m.profit,m.revenue)}%</td></tr>`;}).join("");
      body=`<div class="doc-title">P&L Summary — YTD ${selYear}</div><div class="doc-meta">Generated ${tod()}</div>
        <div class="two-col section"><div>Revenue: <strong class="mn">${fmt(ytdRev)}</strong></div><div>Gross Profit: <strong class="mn">${fmt(ytdProfit)}</strong> (${ytdMargin}%)</div></div>
        <table><thead><tr><th>Month</th><th style="text-align:right">Revenue</th><th style="text-align:right">Labor</th><th style="text-align:right">Materials</th><th style="text-align:right">Other</th><th style="text-align:right">Profit</th><th style="text-align:right">Margin</th></tr></thead><tbody>${rows}
        <tr style="border-top:2px solid #333;font-weight:800"><td>YTD</td><td class="mn" style="text-align:right">${fmt(ytdRev)}</td><td class="mn" style="text-align:right">${fmt(ytdLabor)}</td><td class="mn" style="text-align:right">${fmt(ytdMats)}</td><td class="mn" style="text-align:right">${fmt(ytdRev-ytdLabor-ytdMats-ytdProfit)}</td><td class="mn" style="text-align:right">${fmt(ytdProfit)}</td><td class="mn" style="text-align:right">${ytdMargin}%</td></tr></tbody></table>`;
    } else if(rtab==="job"){
      const rows=projs.map(p=>{const tot=p.actualLabor+p.actualMaterials;const gp=p.contractValue-tot;const gm=p.contractValue>0?pct(gp,p.contractValue):0;const c=custs.find(x=>x.id===p.custId);return `<tr><td style="font-weight:600">${p.name}</td><td>${c?.name||""}</td><td class="mn" style="text-align:right">${fmt(p.contractValue)}</td><td class="mn" style="text-align:right">${fmt(p.actualLabor)}</td><td class="mn" style="text-align:right">${fmt(p.actualMaterials)}</td><td class="mn" style="text-align:right">${fmt(tot)}</td><td class="mn" style="text-align:right;font-weight:700">${fmt(gp)}</td><td class="mn" style="text-align:right">${gm}%</td></tr>`;}).join("");
      body=`<div class="doc-title">Job P&L Report</div><div class="doc-meta">Generated ${tod()}</div>
        <table><thead><tr><th>Project</th><th>Customer</th><th style="text-align:right">Contract</th><th style="text-align:right">Labor</th><th style="text-align:right">Materials</th><th style="text-align:right">Total Actual</th><th style="text-align:right">Gross Profit</th><th style="text-align:right">Margin</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if(rtab==="ar"){
      const rows=iAll2.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(inv=>{const c=custs.find(x=>x.id===inv.custId);const due=new Date(inv.dueDate);const days=Math.round((new Date(tod())-due)/(864e5));const isPast=days>0&&inv.status!=="paid"&&inv.status!=="void";return `<tr><td class="mn">${inv.number}</td><td>${c?.name||"—"}</td><td class="mn">${inv.issueDate}</td><td class="mn">${inv.dueDate}</td><td style="color:${isPast?"#dc2626":"#333"};font-weight:${isPast?700:400}">${inv.status==="paid"?"—":isPast?days+"d overdue":"Current"}</td><td class="mn" style="text-align:right;font-weight:700">${fmt(inv.total)}</td><td>${inv.status.toUpperCase()}</td></tr>`;}).join("");
      body=`<div class="doc-title">A/R Aging Report</div><div class="doc-meta">Generated ${tod()}</div>
        <table><thead><tr><th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th><th>Status</th><th style="text-align:right">Amount</th><th>Payment</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      const rows=subData.map(e=>`<tr><td style="font-weight:600">${e.name}</td><td>${e.role}</td><td class="mn" style="text-align:right">$${e.hourlyWage}</td><td class="mn" style="text-align:right">$${e.billableRate}</td><td class="mn" style="text-align:right">$${getBurdenedRate(roles,e.role,e.hourlyWage).toFixed(2)}</td><td class="mn" style="text-align:right">${e.totalHours}h</td><td class="mn" style="text-align:right">${fmt(e.billed)}</td><td class="mn" style="text-align:right">${fmt(e.trueCost)}</td><td class="mn" style="text-align:right;font-weight:700">${fmt(e.net)}</td><td class="mn" style="text-align:right">${e.margin}%</td></tr>`).join("");
      body=`<div class="doc-title">Crew Labor Report</div><div class="doc-meta">Generated ${tod()}</div>
        <table><thead><tr><th>Sub</th><th>Role</th><th style="text-align:right">Wage</th><th style="text-align:right">Bill</th><th style="text-align:right">Burdened</th><th style="text-align:right">Hours</th><th style="text-align:right">Billed</th><th style="text-align:right">True Cost</th><th style="text-align:right">Net</th><th style="text-align:right">Margin</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    printDoc(tabs.find(t=>t.id===rtab)?.label||"Report",body,company,autoPrint);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid var(--border)",marginBottom:4,alignItems:"center",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setRtab(t.id)} style={{padding:"9px 16px",fontSize:12,fontWeight:700,color:rtab===t.id?"#63b3ed":"var(--text-dim)",borderBottom:`2px solid ${rtab===t.id?"#3b82f6":"transparent"}`,transition:"all .14s",whiteSpace:"nowrap",flexShrink:0}}>{t.label}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
          {rtab==="pl"&&(
            <div style={{display:"flex",alignItems:"center",gap:2,marginRight:4}}>
              <button onClick={()=>setSelYear(y=>y-1)} className="bb" style={{padding:"3px 8px",fontSize:12}}>‹</button>
              <span style={{fontSize:11,fontWeight:700,minWidth:34,textAlign:"center"}}>{selYear}</span>
              <button onClick={()=>setSelYear(y=>y+1)} className="bb" style={{padding:"3px 8px",fontSize:12,opacity:selYear>=curYear?.5:1}} disabled={selYear>=curYear}>›</button>
            </div>
          )}
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="inp" style={{fontSize:10,padding:"3px 6px",width:120}}/>
          <span style={{fontSize:10,color:"var(--text-faint)"}}>–</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="inp" style={{fontSize:10,padding:"3px 6px",width:120}}/>
          <button onClick={()=>exportReport(true)} className="bb b-gh" style={{padding:"5px 12px",fontSize:11}}>⎙ Print</button>
        </div>
      </div>

      {rtab==="pl"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="g4">
            {[{l:"YTD Revenue",v:fmt(ytdRev),c:"#3b82f6"},{l:"YTD Gross Profit",v:fmt(ytdProfit),c:"#22c55e"},{l:"Gross Margin",v:`${ytdMargin}%`,c:ytdMargin>=25?"#22c55e":"#f5a623"},{l:"YTD Labor Cost",v:fmt(ytdLabor),c:"#f5a623"}].map(k=>(
              <KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>
            ))}
          </div>
          <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px 8px"}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Monthly P&L — {selYear}</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{top:4,right:8,left:-18,bottom:0}} barSize={12} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                <Tooltip content={<CTip/>}/>
                <Bar dataKey="revenue"   name="Revenue"   fill="#3b82f6" radius={[3,3,0,0]}/>
                <Bar dataKey="profit"    name="Profit"    fill="#22c55e" radius={[3,3,0,0]}/>
                <Bar dataKey="labor"     name="Labor"     fill="#f5a623" radius={[3,3,0,0]}/>
                <Bar dataKey="materials" name="Materials" fill="#6c8ebf" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",fontWeight:800,fontSize:12}}>P&L Statement — YTD {selYear}</div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:580}}>
              <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Month","Revenue","Labor","Materials","Other","Gross Profit","Margin"].map(h=><th key={h} style={{padding:"7px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
              <tbody>
                {ytdMonths.map((m,i)=>{
                  const other=m.revenue-m.labor-m.materials-m.profit;
                  const mg=pct(m.profit,m.revenue);
                  return <tr key={m.month} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                    <td style={{padding:"8px 14px",fontWeight:700,color:"var(--text-2)"}}>{m.month}</td>
                    <td className="mn" style={{padding:"8px 14px",color:"#3b82f6"}}>{fmt(m.revenue)}</td>
                    <td className="mn" style={{padding:"8px 14px",color:"#f5a623"}}>{fmt(m.labor)}</td>
                    <td className="mn" style={{padding:"8px 14px",color:"#6c8ebf"}}>{fmt(m.materials)}</td>
                    <td className="mn" style={{padding:"8px 14px",color:"var(--text-dim)"}}>{fmt(other)}</td>
                    <td className="mn" style={{padding:"8px 14px",color:"#22c55e",fontWeight:700}}>{fmt(m.profit)}</td>
                    <td className="mn" style={{padding:"8px 14px",color:mg>=25?"#22c55e":mg>=15?"#f5a623":"#ef4444"}}>{mg}%</td>
                  </tr>;
                })}
                <tr style={{borderTop:"2px solid var(--border-2)",background:"var(--bg-sidebar)"}}>
                  <td style={{padding:"9px 14px",fontWeight:800,color:"var(--text)"}}>YTD Total</td>
                  <td className="mn" style={{padding:"9px 14px",color:"#3b82f6",fontWeight:700}}>{fmt(ytdRev)}</td>
                  <td className="mn" style={{padding:"9px 14px",color:"#f5a623",fontWeight:700}}>{fmt(ytdLabor)}</td>
                  <td className="mn" style={{padding:"9px 14px",color:"#6c8ebf",fontWeight:700}}>{fmt(ytdMats)}</td>
                  <td className="mn" style={{padding:"9px 14px",color:"var(--text-dim)"}}>{fmt(ytdRev-ytdLabor-ytdMats-ytdProfit)}</td>
                  <td className="mn" style={{padding:"9px 14px",color:"#22c55e",fontWeight:800,fontSize:13}}>{fmt(ytdProfit)}</td>
                  <td className="mn" style={{padding:"9px 14px",color:ytdMargin>=25?"#22c55e":"#f5a623",fontWeight:700}}>{ytdMargin}%</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {rtab==="job"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px 8px"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:10}}>Job P&L Comparison</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projs.map(p=>({name:p.name.split(" ").slice(0,2).join(" "),contract:p.contractValue,actual:p.actualLabor+p.actualMaterials,profit:p.contractValue-(p.actualLabor+p.actualMaterials)}))} margin={{top:4,right:8,left:-18,bottom:0}} barSize={14} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="name" tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"var(--text-dim)",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                <Tooltip content={<CTip/>}/>
                <Bar dataKey="contract" name="Contract"  fill="#3b82f6" radius={[3,3,0,0]}/>
                <Bar dataKey="actual"   name="Actual Cost" fill="#ef4444" radius={[3,3,0,0]}/>
                <Bar dataKey="profit"   name="Profit"    fill="#22c55e" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",fontWeight:800,fontSize:12}}>Job-by-Job P&L</div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:700}}>
              <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Project","Customer","Contract","Actual Labor","Actual Mat","Total Actual","Gross Profit","Margin","Status"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
              <tbody>
                {projs.map((p,i)=>{
                  const c=custs.find(x=>x.id===p.custId);
                  const tot=p.actualLabor+p.actualMaterials;
                  const gp=p.contractValue-tot;
                  const gm=p.contractValue>0?pct(gp,p.contractValue):0;
                  return <tr key={p.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                    <td style={{padding:"8px 12px",fontWeight:700,color:"var(--text-2)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</td>
                    <td style={{padding:"8px 12px",color:"var(--text-muted)"}}>{c?.name}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"var(--accent)"}}>{fmt(p.contractValue)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#f5a623"}}>{fmt(p.actualLabor)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#6c8ebf"}}>{fmt(p.actualMaterials)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#ef4444"}}>{fmt(tot)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:gp>=0?"#22c55e":"#ef4444",fontWeight:700}}>{fmt(gp)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:gm>=25?"#22c55e":gm>=10?"#f5a623":"#ef4444"}}>{gm}%</td>
                    <td style={{padding:"8px 12px"}}><Chip s={p.status} map={PRJ_SC}/></td>
                  </tr>;
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {rtab==="ar"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="g4">
            {[{l:"Total Billed",v:fmt(iAll.reduce((s,i)=>s+i.total,0)),c:"#3b82f6"},{l:"Collected",v:fmt(iAll.filter(i=>i.status==="paid").reduce((s,i)=>s+i.total,0)),c:"#22c55e"},{l:"Overdue",v:fmt(iAll.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.total,0)),c:"#ef4444"},{l:"Outstanding",v:fmt(iAll.filter(i=>i.status!=="paid"&&i.status!=="void").reduce((s,i)=>s+i.total,0)),c:"#f5a623"}].map(k=>(
              <KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>
            ))}
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",fontWeight:800,fontSize:12}}>Invoice Aging Detail</div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:580}}>
              <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Invoice","Customer","Issued","Due","Days Past Due","Amount","Status"].map(h=><th key={h} style={{padding:"7px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
              <tbody>
                {arData.map((inv,i)=>{
                  const c=custs.find(x=>x.id===inv.custId);
                  const isPast=inv.daysPast>0&&inv.status!=="paid"&&inv.status!=="void";
                  return <tr key={inv.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                    <td className="mn" style={{padding:"8px 13px",color:"var(--text-muted)",fontSize:10}}>{inv.number}</td>
                    <td style={{padding:"8px 13px",color:"var(--text-2)",fontWeight:600}}>{c?.name||"—"}</td>
                    <td className="mn" style={{padding:"8px 13px",color:"var(--text-dim)",fontSize:10}}>{inv.issueDate}</td>
                    <td className="mn" style={{padding:"8px 13px",color:"var(--text-dim)",fontSize:10}}>{inv.dueDate}</td>
                    <td className="mn" style={{padding:"8px 13px",color:isPast?"#ef4444":"#22c55e",fontWeight:isPast?700:400}}>
                      {inv.status==="paid"?"—":isPast?`${inv.daysPast}d overdue`:"Current"}
                    </td>
                    <td className="mn" style={{padding:"8px 13px",color:"#22c55e",fontWeight:700}}>{fmt(inv.total)}</td>
                    <td style={{padding:"8px 13px"}}><Chip s={inv.status} map={INV_SC}/></td>
                  </tr>;
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {rtab==="labor"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="g4">
            {[
              {l:"Total Sub Hours",v:`${hrs.reduce((s,h)=>s+h.hours,0)}h`,c:"#63b3ed"},
              {l:"Total Billed Labor",v:fmt(subData.reduce((s,e)=>s+e.billed,0)),c:"#22c55e"},
              {l:"True Labor Cost",v:fmt(subData.reduce((s,e)=>s+e.trueCost,0)),c:"#ef4444"},
              {l:"Avg Labor Margin",v:`${subData.length>0?Math.round(subData.reduce((s,e)=>s+e.margin,0)/subData.length):0}%`,c:"#f5a623"},
            ].map(k=><KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>)}
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",fontWeight:800,fontSize:12}}>Crew Labor Report</div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:820}}>
              <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Crew Member","Role","Wage/hr","Bill/hr","True Cost/hr","Hours","Billed","True Cost","Net Profit","Margin"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
              <tbody>
                {subData.map((e,i)=>(
                  <tr key={e.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                    <td style={{padding:"8px 12px",fontWeight:700,color:"var(--text-2)"}}>{e.name}</td>
                    <td style={{padding:"8px 12px"}}><span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:`${ROLE_C[e.role]||"#4a566e"}18`,color:ROLE_C[e.role]||"var(--text-muted)"}}>{e.role}</span></td>
                    <td className="mn" style={{padding:"8px 12px",color:"#f5a623"}}>${e.hourlyWage}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#3b82f6"}}>${e.billableRate}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#ef4444"}}>${getBurdenedRate(roles,e.role,e.hourlyWage).toFixed(2)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#63b3ed"}}>{e.totalHours}h</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#22c55e"}}>{fmt(e.billed)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:"#ef4444"}}>{fmt(e.trueCost)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:e.net>=0?"#22c55e":"#ef4444",fontWeight:700}}>{fmt(e.net)}</td>
                    <td className="mn" style={{padding:"8px 12px",color:e.margin>=30?"#22c55e":e.margin>=20?"#f5a623":"#ef4444",fontWeight:700}}>{e.margin}%</td>
                  </tr>
                ))}
                <tr style={{borderTop:"2px solid var(--border-2)",background:"var(--bg-sidebar)"}}>
                  <td colSpan={5} style={{padding:"9px 12px",fontWeight:800,color:"var(--text)"}}>Totals</td>
                  <td className="mn" style={{padding:"9px 12px",color:"#63b3ed",fontWeight:700}}>{subData.reduce((s,e)=>s+e.totalHours,0)}h</td>
                  <td className="mn" style={{padding:"9px 12px",color:"#22c55e",fontWeight:700}}>{fmt(subData.reduce((s,e)=>s+e.billed,0))}</td>
                  <td className="mn" style={{padding:"9px 12px",color:"#ef4444",fontWeight:700}}>{fmt(subData.reduce((s,e)=>s+e.trueCost,0))}</td>
                  <td className="mn" style={{padding:"9px 12px",color:"#22c55e",fontWeight:800,fontSize:12}}>{fmt(subData.reduce((s,e)=>s+e.net,0))}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
