import { useState, useEffect, useCallback, useMemo } from "react";

/*
 * BUILDMETRY — CONTRACTS MODULE
 * Dark theme matching App.jsx. Prisma backend API.
 * Props: projectId (string like "PRJ-2026-001"), apiBaseUrl (default "/api")
 */

const TAX_RATE = 0.065;
const CONTRACT_TYPES = ["Prime", "Subcontract", "Change Order"];
const STATUSES = ["Draft", "Sent", "Active", "Completed", "Cancelled"];
const PAYMENT_TERMS = ["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60"];
const MILESTONE_STATUSES = ["Pending", "Invoiced", "Paid"];
const UNITS = ["ea", "sf", "lf", "sy", "cy", "hr", "day", "ls", "gal", "ton", "bd ft"];
const TEMPLATES = {
  "Kitchen Remodel": [
    { description: "Demolition — cabinets, countertops, flooring", qty: 1, unitPrice: 2800, unit: "ls", isMaterial: false },
    { description: "Rough plumbing", qty: 1, unitPrice: 3200, unit: "ls", isMaterial: false },
    { description: "Electrical rough-in", qty: 1, unitPrice: 2400, unit: "ls", isMaterial: false },
    { description: "Cabinets — shaker style", qty: 22, unitPrice: 285, unit: "lf", isMaterial: true },
    { description: "Quartz countertops", qty: 45, unitPrice: 95, unit: "sf", isMaterial: true },
    { description: "Tile backsplash", qty: 30, unitPrice: 18, unit: "sf", isMaterial: true },
    { description: "Backsplash labor", qty: 30, unitPrice: 12, unit: "sf", isMaterial: false },
    { description: "Finish plumbing — fixtures", qty: 1, unitPrice: 1800, unit: "ls", isMaterial: true },
    { description: "Painting — walls & trim", qty: 1, unitPrice: 1600, unit: "ls", isMaterial: false },
    { description: "Cleanup & haul-off", qty: 1, unitPrice: 800, unit: "ls", isMaterial: false },
  ],
  "Bathroom Reno": [
    { description: "Demo — tile, fixtures, vanity", qty: 1, unitPrice: 1500, unit: "ls", isMaterial: false },
    { description: "Plumbing rough-in", qty: 1, unitPrice: 2800, unit: "ls", isMaterial: false },
    { description: "Waterproofing", qty: 60, unitPrice: 8, unit: "sf", isMaterial: true },
    { description: "Floor tile", qty: 60, unitPrice: 12, unit: "sf", isMaterial: true },
    { description: "Wall tile", qty: 120, unitPrice: 9, unit: "sf", isMaterial: true },
    { description: "Tile labor", qty: 180, unitPrice: 10, unit: "sf", isMaterial: false },
    { description: "Vanity w/ top", qty: 1, unitPrice: 1200, unit: "ea", isMaterial: true },
    { description: "Shower valve + trim", qty: 1, unitPrice: 650, unit: "ea", isMaterial: true },
    { description: "Finish plumbing", qty: 1, unitPrice: 1200, unit: "ls", isMaterial: false },
    { description: "Paint & caulk", qty: 1, unitPrice: 900, unit: "ls", isMaterial: false },
  ],
  "Ext. Painting": [
    { description: "Pressure washing", qty: 2400, unitPrice: 0.35, unit: "sf", isMaterial: false },
    { description: "Scraping & prep", qty: 2400, unitPrice: 0.45, unit: "sf", isMaterial: false },
    { description: "Primer", qty: 12, unitPrice: 48, unit: "gal", isMaterial: true },
    { description: "Paint — SW Duration", qty: 18, unitPrice: 72, unit: "gal", isMaterial: true },
    { description: "Caulking", qty: 1, unitPrice: 600, unit: "ls", isMaterial: true },
    { description: "Paint labor — 2 coats", qty: 2400, unitPrice: 1.1, unit: "sf", isMaterial: false },
    { description: "Trim & detail", qty: 1, unitPrice: 1400, unit: "ls", isMaterial: false },
  ],
};

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function $(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n)}
function pct(n){return(n*100).toFixed(1)+"%"}
function calc(items,dp,tr,rp){
  const sub=items.reduce((s,i)=>s+i.qty*i.unitPrice,0),lab=items.filter(i=>!i.isMaterial).reduce((s,i)=>s+i.qty*i.unitPrice,0),mat=items.filter(i=>i.isMaterial).reduce((s,i)=>s+i.qty*i.unitPrice,0);
  const da=sub*(dp/100),ds=sub-da,dm=mat*(1-dp/100),tax=dm*tr,tot=ds+tax,ra=tot*(rp/100);
  return{sub,lab,mat,da,dm,tax,tot,ra,net:tot-ra};
}

function printContract(c){
  const t=calc(c.lineItems||[],c.discountPercent||0,c.taxRate||TAX_RATE,c.retentionPercent||0);
  const fmtDate=d=>d?(d+"").slice(0,10):"—";
  const labItems=(c.lineItems||[]).filter(i=>!i.isMaterial);
  const matItems=(c.lineItems||[]).filter(i=>i.isMaterial);
  const mkRows=items=>items.map((i,n)=>`<tr><td>${n+1}</td><td>${i.description||""}</td><td class="mn r">${i.qty} ${i.unit||"ea"}</td><td class="mn r">${$(i.unitPrice)}</td><td class="mn r fw">${$(i.qty*i.unitPrice)}</td></tr>`).join("");
  const mkSection=(title,items)=>items.length===0?"":`<div class="section"><div class="sec-title">${title}</div><table><thead><tr><th>#</th><th>Description</th><th class="r">Qty / Unit</th><th class="r">Unit Price</th><th class="r">Total</th></tr></thead><tbody>${mkRows(items)}</tbody></table></div>`;
  const paid=(c.milestones||[]).filter(m=>m.status==="Paid").reduce((a,m)=>a+(parseFloat(m.amount)||0),0);
  const msRows=(c.milestones||[]).map((m,i)=>`<tr><td>${i+1}</td><td>${m.milestone||""}</td><td class="mn r">${$(m.amount||0)}</td><td class="r">${m.dueDate?fmtDate(m.dueDate):"—"}</td><td><span class="chip chip-${(m.status||"Pending").toLowerCase()}">${m.status||"Pending"}</span></td></tr>`).join("");
  const statusColor={Draft:"#6b7280",Sent:"#3b82f6",Active:"#22c55e",Completed:"#22c55e",Cancelled:"#ef4444"};
  const sc=statusColor[c.status]||"#6b7280";
  const html=`<!DOCTYPE html><html><head><title>Contract — ${c.title||"Untitled"}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;color:#111827;font-size:11px;padding:32px 40px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
@page{size:letter;margin:18mm 14mm}
@media print{.no-print{display:none!important}}
.mn{font-family:'JetBrains Mono',monospace;font-weight:600}
.r{text-align:right}.fw{font-weight:700}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #111827;padding-bottom:14px;margin-bottom:20px}
.doc-label{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;margin-bottom:4px}
.doc-title{font-size:20px;font-weight:800;color:#111827;letter-spacing:-.3px;line-height:1.2}
.doc-sub{font-size:12px;color:#374151;margin-top:4px}
.status{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#fff;background:${sc}}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:20px}
.meta-item .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:2px}
.meta-item .val{font-size:12px;font-weight:600;color:#111827}
.section{margin-bottom:20px}
.sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:11px}
thead tr{background:#f3f4f6}
th{text-align:left;padding:6px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6b7280}
td{padding:6px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
tbody tr:last-child td{border-bottom:none}
.fin-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-top:14px}
.fin-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px}
.fin-row.total{border-top:1.5px solid #d1d5db;margin-top:6px;padding-top:8px;font-size:14px;font-weight:800;color:#111827}
.fin-row.sub{border-top:1px solid #e5e7eb;margin-top:4px;padding-top:6px}
.fin-lbl{color:#6b7280}
.fin-val{font-family:'JetBrains Mono',monospace;font-weight:700;color:#111827}
.fin-val.grn{color:#16a34a}
.chip{display:inline-block;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.chip-pending{background:#fef3c7;color:#92400e}
.chip-invoiced{background:#dbeafe;color:#1d4ed8}
.chip-paid{background:#dcfce7;color:#15803d}
.scope-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;font-size:11px;color:#374151;line-height:1.7;white-space:pre-wrap;margin-bottom:20px}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:8px}
.sig-line{border-top:1px solid #374151;padding-top:6px;font-size:10px;color:#6b7280;margin-top:40px}
.footer-bar{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af}
</style></head><body>

<div class="hdr">
  <div>
    <div class="doc-label">Contract</div>
    <div class="doc-title">${c.title||"Untitled Contract"}</div>
    <div class="doc-sub">${c.contractType||"Prime"} · ${c.clientOrSubName||"—"}</div>
  </div>
  <div style="text-align:right">
    <div class="status">${c.status||"Draft"}</div>
    <div style="font-size:10px;color:#6b7280;margin-top:6px">${c.signatureStatus||"Unsigned"}</div>
  </div>
</div>

<div class="meta">
  <div class="meta-item"><div class="lbl">Contract Type</div><div class="val">${c.contractType||"Prime"}</div></div>
  <div class="meta-item"><div class="lbl">Client / Sub</div><div class="val">${c.clientOrSubName||"—"}</div></div>
  <div class="meta-item"><div class="lbl">Payment Terms</div><div class="val">${c.paymentTerms||"Net 30"}</div></div>
  <div class="meta-item"><div class="lbl">Start Date</div><div class="val">${fmtDate(c.startDate)}</div></div>
  <div class="meta-item"><div class="lbl">End Date</div><div class="val">${fmtDate(c.endDate)}</div></div>
  <div class="meta-item"><div class="lbl">Signature</div><div class="val">${c.signatureStatus||"Unsigned"}</div></div>
</div>

${mkSection("Labor",labItems)}
${mkSection("Materials",matItems)}

<div class="section">
  <div class="sec-title">Financial Summary</div>
  <div class="fin-box">
    <div class="fin-row"><span class="fin-lbl">Labor</span><span class="fin-val">${$(t.lab)}</span></div>
    <div class="fin-row"><span class="fin-lbl">Materials</span><span class="fin-val">${$(t.mat)}</span></div>
    <div class="fin-row sub"><span class="fin-lbl">Subtotal</span><span class="fin-val">${$(t.sub)}</span></div>
    ${t.da>0?`<div class="fin-row"><span class="fin-lbl">Discount (${c.discountPercent}%)</span><span class="fin-val grn">−${$(t.da)}</span></div>`:""}
    <div class="fin-row"><span class="fin-lbl">Tax (${((c.taxRate||TAX_RATE)*100).toFixed(1)}% on materials)</span><span class="fin-val">${$(t.tax)}</span></div>
    <div class="fin-row total"><span>Contract Total</span><span>${$(t.tot)}</span></div>
    ${t.ra>0?`<div class="fin-row"><span class="fin-lbl">Retention (${c.retentionPercent}%)</span><span class="fin-val">−${$(t.ra)}</span></div><div class="fin-row sub"><span class="fin-lbl">Net Payable</span><span class="fin-val">${$(t.net)}</span></div>`:""}
    ${paid>0?`<div class="fin-row"><span class="fin-lbl">Total Billed (Paid milestones)</span><span class="fin-val grn">${$(paid)}</span></div>`:""}
  </div>
</div>

${(c.milestones||[]).length>0?`<div class="section"><div class="sec-title">Payment Schedule</div><table><thead><tr><th>#</th><th>Milestone</th><th class="r">Amount</th><th class="r">Due Date</th><th>Status</th></tr></thead><tbody>${msRows}</tbody></table></div>`:""}

${c.scopeOfWork?`<div class="section"><div class="sec-title">Scope of Work</div><div class="scope-box">${c.scopeOfWork}</div></div>`:""}
${c.exclusions?`<div class="section"><div class="sec-title">Exclusions</div><div class="scope-box">${c.exclusions}</div></div>`:""}

<div class="section">
  <div class="sec-title">Signatures</div>
  <div class="sig-grid">
    <div><div class="sig-line">Contractor Signature &amp; Date</div></div>
    <div><div class="sig-line">Client / Sub Signature &amp; Date</div></div>
  </div>
</div>

<div class="footer-bar">
  <span>Generated by BuildMetry</span>
  <span>${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
</div>

</body></html>`;

  let w;
  try{w=window.open("","_blank","width=900,height=700")}catch(e){}
  if(w&&w.document){w.document.write(html);w.document.close();setTimeout(()=>{try{w.print()}catch(e){}},600);return}
  let iframe=document.getElementById("__contract_print");
  if(iframe)iframe.remove();
  iframe=document.createElement("iframe");
  iframe.id="__contract_print";
  iframe.style.cssText="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;border:none;background:#fff";
  document.body.appendChild(iframe);
  const idoc=iframe.contentDocument||iframe.contentWindow.document;
  idoc.open();
  idoc.write(html.replace("</body>",`<div class="no-print" style="position:fixed;top:14px;right:14px;display:flex;gap:6px;z-index:100"><button onclick="window.print()" style="border:none;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;background:#111827;color:#fff">⎙ Print / Save PDF</button><button onclick="parent.document.getElementById('__contract_print').remove()" style="border:none;padding:9px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;background:#ef4444;color:#fff">✕ Close</button></div></body>`));
  idoc.close();
}

// Theme-aware colors — CSS variables inherit light/dark from the app
const bg="var(--bg-card)",bg2="var(--bg-darker)",brd="var(--border-2)",brdL="var(--border)",tx="var(--text)",tx2="var(--text-muted)",tx3="var(--text-dim)",ac="var(--accent)",acL="var(--accent-light)",acD="var(--accent-dark)",grn="#22c55e",red="#ef4444",ylw="#f5a623";
const inpS={background:bg,border:`1px solid ${brd}`,color:tx,borderRadius:8,padding:"9px 13px",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
const cardS={background:bg2,border:`1px solid ${brdL}`,borderRadius:12,padding:"16px 18px",marginBottom:12};
const lblS={fontSize:10,fontWeight:700,color:tx3,marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:".5px"};
const bPri={background:`linear-gradient(135deg,${ac},${acD})`,color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit"};
const bGh={background:"transparent",border:`1px solid ${brd}`,color:tx2,borderRadius:8,padding:"7px 13px",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:"inherit"};
const SC={Draft:{b:"rgba(122,130,153,.12)",f:tx2},Sent:{b:"rgba(59,130,246,.12)",f:acL},Active:{b:"rgba(34,197,94,.12)",f:grn},Completed:{b:"rgba(34,197,94,.12)",f:grn},Cancelled:{b:"rgba(239,68,68,.12)",f:red},Pending:{b:"rgba(249,166,35,.12)",f:ylw},Invoiced:{b:"rgba(59,130,246,.12)",f:acL},Paid:{b:"rgba(34,197,94,.12)",f:grn}};
const Chip=({s})=>{const c=SC[s]||SC.Draft;return<span style={{display:"inline-block",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:8,background:c.b,color:c.f}}>{s}</span>};

const Ic=({d,s=14,c=tx2})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;

function Section({title,children,open:dOpen=true,badge}){
  const[o,setO]=useState(dOpen);
  return<div style={cardS}><div onClick={()=>setO(!o)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
    <span style={{fontSize:13,fontWeight:800,color:tx,flex:1}}>{title}</span>{badge}
    <span style={{transform:o?"rotate(180deg)":"rotate(0)",transition:"transform .2s",display:"flex"}}><Ic d="M6 9l6 6 6-6" s={12}/></span>
  </div>{o&&<div style={{marginTop:14}}>{children}</div>}</div>;
}

function Kpi({label,value,sub,accent}){
  return<div style={{background:accent?"rgba(59,130,246,.08)":bg,border:`1px solid ${accent?"rgba(59,130,246,.2)":brdL}`,borderRadius:10,padding:"10px 14px"}}>
    <div style={{fontSize:9,fontWeight:700,color:accent?acL:tx3,textTransform:"uppercase",letterSpacing:".5px",marginBottom:2}}>{label}</div>
    <div style={{fontSize:18,fontWeight:800,color:accent?acL:tx}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:tx2,marginTop:2}}>{sub}</div>}
  </div>;
}

function LineItems({items,setItems}){
  const add=()=>setItems([...items,{id:uid(),description:"",qty:1,unitPrice:0,unit:"ea",isMaterial:false}]);
  const upd=(id,f,v)=>setItems(items.map(i=>i.id===id?{...i,[f]:v}:i));
  const rm=id=>setItems(items.filter(i=>i.id!==id));
  return<div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
    <thead><tr style={{borderBottom:`1px solid ${brdL}`}}>{["Description","Type","Unit","Qty","Rate","Total",""].map(h=><th key={h} style={{textAlign:"left",padding:"7px 6px",fontSize:9,fontWeight:700,color:tx3,textTransform:"uppercase",letterSpacing:".3px"}}>{h}</th>)}</tr></thead>
    <tbody>{items.map(i=><tr key={i.id} style={{borderBottom:`1px solid ${brdL}`}}>
      <td style={{padding:6}}><input value={i.description} onChange={e=>upd(i.id,"description",e.target.value)} placeholder="Line item..." style={{...inpS,minWidth:150,padding:"7px 10px"}}/></td>
      <td style={{padding:6}}><select value={i.isMaterial?"material":"labor"} onChange={e=>upd(i.id,"isMaterial",e.target.value==="material")} style={{...inpS,width:82,padding:"7px 6px"}}><option value="labor">Labor</option><option value="material">Material</option></select></td>
      <td style={{padding:6}}><select value={i.unit} onChange={e=>upd(i.id,"unit",e.target.value)} style={{...inpS,width:62,padding:"7px 6px"}}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></td>
      <td style={{padding:6}}><input type="number" value={i.qty} min={0} step={.5} onChange={e=>upd(i.id,"qty",Math.max(0,parseFloat(e.target.value)||0))} style={{...inpS,width:58,padding:"7px 8px"}}/></td>
      <td style={{padding:6}}><input type="number" value={i.unitPrice} min={0} step={.01} onChange={e=>upd(i.id,"unitPrice",Math.max(0,parseFloat(e.target.value)||0))} style={{...inpS,width:82,padding:"7px 8px"}}/></td>
      <td style={{padding:6,fontWeight:700,color:grn,whiteSpace:"nowrap"}}>{$(i.qty*i.unitPrice)}</td>
      <td style={{padding:6}}><button onClick={()=>rm(i.id)} style={{...bGh,padding:"4px 6px",border:"none"}}><Ic d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" s={13} c={red}/></button></td>
    </tr>)}</tbody>
  </table></div>
  <button onClick={add} style={{...bGh,marginTop:10}}><Ic d="M12 5v14M5 12h14" s={12}/> Add line item</button></div>;
}

function Milestones({ms,setMs,total}){
  const add=()=>setMs([...ms,{id:uid(),milestone:"",amount:0,pctOfTotal:0,dueDate:"",status:"Pending"}]);
  const upd=(id,f,v)=>setMs(ms.map(m=>{if(m.id!==id)return m;const u={...m,[f]:v};if(f==="pctOfTotal")u.amount=Math.round(total*(parseFloat(v)||0)/100*100)/100;if(f==="amount")u.pctOfTotal=total>0?Math.round((parseFloat(v)||0)/total*10000)/100:0;return u}));
  const rm=id=>setMs(ms.filter(m=>m.id!==id));
  const split=n=>{const p=Math.floor(100/n);const nm=n===2?["Deposit","Final"]:n===3?["Deposit","Progress","Final"]:["Deposit","Rough-in","Finish","Final"];
    setMs(nm.map((name,i)=>({id:uid(),milestone:name,pctOfTotal:i===nm.length-1?100-p*(n-1):p,amount:i===nm.length-1?Math.round((total-Math.round(total*p/100*100)/100*(n-1))*100)/100:Math.round(total*p/100*100)/100,dueDate:"",status:"Pending"})))};
  const sched=ms.reduce((s,m)=>s+(parseFloat(m.amount)||0),0);
  return<div>
    {ms.length===0&&<div style={{marginBottom:12}}><div style={{...lblS,marginBottom:8}}>Quick split</div><div style={{display:"flex",gap:8}}>{[2,3,4].map(n=><button key={n} onClick={()=>split(n)} style={bGh}>{n} draws</button>)}</div></div>}
    {ms.map((m,i)=><div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 90px 110px 90px 28px",gap:6,alignItems:"end",marginBottom:6}}>
      <div>{i===0&&<label style={lblS}>Milestone</label>}<input value={m.milestone} onChange={e=>upd(m.id,"milestone",e.target.value)} placeholder="e.g. Rough-in" style={{...inpS,padding:"7px 10px"}}/></div>
      <div>{i===0&&<label style={lblS}>%</label>}<input type="number" value={m.pctOfTotal} min={0} max={100} onChange={e=>upd(m.id,"pctOfTotal",e.target.value)} style={{...inpS,padding:"7px 8px"}}/></div>
      <div>{i===0&&<label style={lblS}>Amount</label>}<input type="number" value={m.amount} min={0} onChange={e=>upd(m.id,"amount",e.target.value)} style={{...inpS,padding:"7px 8px"}}/></div>
      <div>{i===0&&<label style={lblS}>Due</label>}<input type="date" value={m.dueDate} onChange={e=>upd(m.id,"dueDate",e.target.value)} style={{...inpS,padding:"7px 8px"}}/></div>
      <div>{i===0&&<label style={lblS}>Status</label>}<select value={m.status} onChange={e=>upd(m.id,"status",e.target.value)} style={{...inpS,padding:"7px 6px"}}>{MILESTONE_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
      <div><button onClick={()=>rm(m.id)} style={{...bGh,padding:"4px",border:"none"}}><Ic d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" s={12} c={red}/></button></div>
    </div>)}
    <div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}>
      <button onClick={add} style={bGh}><Ic d="M12 5v14M5 12h14" s={12}/> Add</button>
      <span style={{fontSize:11,color:sched>total+.01?red:tx2}}>{$(sched)} / {$(total)}</span>
    </div>
  </div>;
}

function FinSummary({t,dp,tr,rp}){
  const rows=[{l:"Labor",v:$(t.lab),s:t.sub>0?pct(t.lab/t.sub):""},{l:"Materials",v:$(t.mat),s:t.sub>0?pct(t.mat/t.sub):""},{l:"Subtotal",v:$(t.sub),b:1},
    ...(dp>0?[{l:`Discount (${dp}%)`,v:`−${$(t.da)}`,c:grn}]:[]),
    {l:`Tax (${(tr*100).toFixed(1)}% on materials)`,v:$(t.tax),s:`on ${$(t.dm)}`},{l:"Contract total",v:$(t.tot),b:1,a:1},
    ...(rp>0?[{l:`Retention (${rp}%)`,v:`−${$(t.ra)}`,c:ylw},{l:"Net payable",v:$(t.net),b:1}]:[])];
  return<div style={{background:bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${brdL}`}}>
    {rows.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"5px 0",borderTop:r.b?`1px solid ${brdL}`:"none",marginTop:r.b?4:0}}>
      <span style={{fontSize:12,color:r.a?acL:tx2}}>{r.l}</span>
      <div style={{textAlign:"right"}}><span style={{fontSize:r.a?16:12,fontWeight:r.b?800:400,color:r.c||(r.a?acL:tx)}}>{r.v}</span>{r.s&&<span style={{fontSize:10,color:tx3,marginLeft:6}}>{r.s}</span>}</div>
    </div>)}
  </div>;
}

function Form({contract,onSave,onCancel,onPrint,onDelete,isNew,saving,onSendSignature}){
  const[f,sF]=useState(()=>contract?{...contract}:{id:null,title:"",contractType:"Prime",status:"Draft",clientOrSubName:"",startDate:"",endDate:"",discountPercent:0,taxRate:TAX_RATE,retentionPercent:10,paymentTerms:"Net 30",scopeOfWork:"",exclusions:"",lineItems:[],milestones:[],changeOrders:[],signatureStatus:"Unsigned",linkedEstimateId:null});
  const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const t=useMemo(()=>calc(f.lineItems,f.discountPercent,f.taxRate,f.retentionPercent),[f.lineItems,f.discountPercent,f.taxRate,f.retentionPercent]);
  const tpl=n=>{const tp=TEMPLATES[n];if(tp)s("lineItems",tp.map(i=>({...i,id:uid()})))};
  const warns=useMemo(()=>{const w=[];if(!f.lineItems.length)w.push("No line items.");if(t.sub>0&&t.lab/t.sub<.15&&f.lineItems.length)w.push("Labor under 15%.");if(t.mat>0&&f.taxRate===0)w.push("Tax 0% with materials.");const sc=f.milestones.reduce((a,m)=>a+(parseFloat(m.amount)||0),0);if(f.milestones.length&&Math.abs(sc-t.tot)>1)w.push(`Schedule ${$(sc)} ≠ total ${$(t.tot)}.`);if(f.status==="Active"&&f.signatureStatus==="Unsigned")w.push("Active but unsigned.");return w},[f,t]);

  const[dc,setDc]=useState(false);
  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={onCancel} style={bGh}>Back</button>
        {!isNew&&(dc
          ?<><button onClick={()=>onDelete(f.id)} style={{...bGh,borderColor:red,color:red}}>Confirm delete</button><button onClick={()=>setDc(false)} style={{...bGh,padding:"7px 8px"}}>✕</button></>
          :<button onClick={()=>setDc(true)} style={{...bGh,color:red}}><Ic d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" s={12} c={red}/> Delete</button>
        )}
      </div>
      <div style={{display:"flex",gap:8}}>
        {!isNew&&f.id&&<button onClick={()=>onSendSignature&&onSendSignature(f)} style={{...bGh,borderColor:"#6366f1",color:"#6366f1"}}><Ic d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" s={12} c="#6366f1"/> Sign Link</button>}
        <button onClick={()=>onPrint(f)} title="Print / Save PDF" style={bGh}><Ic d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" s={12}/> Print</button>
        <button onClick={()=>onSave(f)} disabled={saving} style={{...bPri,opacity:saving?.6:1}}><Ic d="M20 6L9 17l-5-5" s={12} c="#fff"/> {isNew?"Create":"Save"}</button>
      </div>
    </div>
    {warns.length>0&&<div style={{...cardS,background:"rgba(249,166,35,.06)",borderColor:"rgba(249,166,35,.2)"}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><Ic d="M12 9v4M12 17h.01M10.29 3.86l-8.6 14.9A2 2 0 003.4 21h17.2a2 2 0 001.71-2.97l-8.6-14.93a2 2 0 00-3.42-.04z" s={14} c={ylw}/>
        <div>{warns.map((w,i)=><div key={i} style={{fontSize:12,color:ylw,marginBottom:i<warns.length-1?3:0}}>{w}</div>)}</div></div></div>}

    <Section title="Contract Details"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{gridColumn:"1/-1"}}><label style={lblS}>Title</label><input value={f.title} onChange={e=>s("title",e.target.value)} placeholder="e.g. Smith Kitchen — Prime Contract" style={inpS}/></div>
      <div><label style={lblS}>Type</label><select value={f.contractType} onChange={e=>s("contractType",e.target.value)} style={inpS}>{CONTRACT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
      <div><label style={lblS}>Status</label><select value={f.status} onChange={e=>s("status",e.target.value)} style={inpS}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label style={lblS}>Client / Sub</label><input value={f.clientOrSubName} onChange={e=>s("clientOrSubName",e.target.value)} style={inpS}/></div>
      <div><label style={lblS}>Terms</label><select value={f.paymentTerms} onChange={e=>s("paymentTerms",e.target.value)} style={inpS}>{PAYMENT_TERMS.map(t=><option key={t}>{t}</option>)}</select></div>
      <div><label style={lblS}>Start</label><input type="date" value={f.startDate?(f.startDate+"").slice(0,10):""} onChange={e=>s("startDate",e.target.value)} style={inpS}/></div>
      <div><label style={lblS}>End</label><input type="date" value={f.endDate?(f.endDate+"").slice(0,10):""} onChange={e=>s("endDate",e.target.value)} style={inpS}/></div>
      <div><label style={lblS}>Signature</label><select value={f.signatureStatus} onChange={e=>s("signatureStatus",e.target.value)} style={inpS}><option>Unsigned</option><option>Signed by Contractor</option><option>Fully Executed</option></select></div>
    </div></Section>

    <Section title="Line Items" badge={<span style={{fontSize:10,color:tx3}}>{f.lineItems.length} items</span>}>
      {f.lineItems.length===0&&!f.linkedEstimateId&&<div style={{marginBottom:12}}><div style={{...lblS,marginBottom:8}}>Quick start</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.keys(TEMPLATES).map(t=><button key={t} onClick={()=>tpl(t)} style={bGh}>{t}</button>)}</div></div>}
      <LineItems items={f.lineItems} setItems={v=>s("lineItems",v)}/>
    </Section>

    <Section title="Pricing & Tax"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
      <div><label style={lblS}>Discount %</label><input type="number" value={f.discountPercent} min={0} max={100} step={.5} onChange={e=>s("discountPercent",Math.max(0,Math.min(100,parseFloat(e.target.value)||0)))} style={inpS}/></div>
      <div><label style={lblS}>Tax %</label><input type="number" value={(f.taxRate*100).toFixed(2)} min={0} max={30} step={.25} onChange={e=>s("taxRate",Math.max(0,Math.min(.3,(parseFloat(e.target.value)||0)/100)))} style={inpS}/></div>
      <div><label style={lblS}>Retention %</label><input type="number" value={f.retentionPercent} min={0} max={20} step={1} onChange={e=>s("retentionPercent",Math.max(0,Math.min(20,parseFloat(e.target.value)||0)))} style={inpS}/></div>
    </div><FinSummary t={t} dp={f.discountPercent} tr={f.taxRate} rp={f.retentionPercent}/></Section>

    <Section title="Payment Schedule" badge={<span style={{fontSize:10,color:tx3}}>{f.milestones.length}</span>}>
      <Milestones ms={f.milestones} setMs={v=>s("milestones",v)} total={t.tot}/>
    </Section>

    <Section title="Scope" open={false}><div style={{marginBottom:10}}><label style={lblS}>Scope of work</label><textarea value={f.scopeOfWork} onChange={e=>s("scopeOfWork",e.target.value)} rows={4} placeholder="Describe..." style={{...inpS,resize:"vertical"}}/></div>
      <div><label style={lblS}>Exclusions</label><textarea value={f.exclusions} onChange={e=>s("exclusions",e.target.value)} rows={3} placeholder="Not included..." style={{...inpS,resize:"vertical"}}/></div></Section>

    <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
      <button onClick={onCancel} style={bGh}>Cancel</button>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onPrint(f)} title="Print / Save PDF" style={bGh}><Ic d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" s={12}/> Print</button>
        <button onClick={()=>onSave(f)} disabled={saving} style={{...bPri,opacity:saving?.6:1}}><Ic d="M20 6L9 17l-5-5" s={12} c="#fff"/> {isNew?"Create":"Save"}</button>
      </div>
    </div>
  </div>;
}

/* ═══════ MAIN EXPORT ═══════ */
export default function ContractsModule({projectId,apiBaseUrl="/api",company}){
  const[contracts,setContracts]=useState([]);
  const[view,setView]=useState("list");
  const[activeId,setActiveId]=useState(null);
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[toast,setToast]=useState(null);
  const[ests,setEsts]=useState([]);
  const[estLd,setEstLd]=useState(false);
  const[delConfirm,setDelConfirm]=useState(null);
  const[sigMd,setSigMd]=useState(null); // contract object to send for signature

  const show=msg=>{setToast(msg);setTimeout(()=>setToast(null),3000)};
  const token=typeof localStorage!=="undefined"?localStorage.getItem("bm_token"):null;
  const hdr={"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})};

  const fetchC=useCallback(async()=>{
    if(!projectId)return;setLoading(true);
    try{const r=await fetch(`${apiBaseUrl}/contracts/project/${projectId}`,{headers:hdr});if(r.ok){const d=await r.json();setContracts(Array.isArray(d)?d:[])}}catch{}
    finally{setLoading(false)}
  },[projectId,apiBaseUrl]);

  useEffect(()=>{fetchC()},[fetchC]);

  const handleSave=async form=>{
    setSaving(true);
    try{
      const isUpd=form.id&&contracts.some(c=>c.id===form.id);
      if(isUpd){try{const r=await fetch(`${apiBaseUrl}/contracts/${form.id}`,{method:"PUT",headers:hdr,body:JSON.stringify(form)});if(r.ok){const d=await r.json();setContracts(p=>p.map(c=>c.id===form.id?d:c));setView("list");setActiveId(null);show("Updated");return}}catch{}}
      else{try{const r=await fetch(`${apiBaseUrl}/contracts`,{method:"POST",headers:hdr,body:JSON.stringify({...form,projectId})});if(r.ok){const d=await r.json();setContracts(p=>[...p.filter(c=>c.id!==null),d]);setView("list");setActiveId(null);show("Created");return}}catch{}}
      // Fallback local
      setContracts(p=>{const idx=p.findIndex(c=>c.id===form.id);if(idx>=0){const n=[...p];n[idx]=form;return n}return[...p.filter(c=>c.id!==null),{...form,id:form.id||uid()}]});
      setView("list");setActiveId(null);show(isUpd?"Updated":"Created");
    }finally{setSaving(false)}
  };

  const handleDelete=async id=>{
    try{const r=await fetch(`${apiBaseUrl}/contracts/${id}`,{method:"DELETE",headers:hdr});
      if(r.ok||r.status===204){setContracts(p=>p.filter(c=>c.id!==id));setView("list");setActiveId(null);setDelConfirm(null);show("Contract deleted");return}
    }catch{}
    setContracts(p=>p.filter(c=>c.id!==id));setView("list");setActiveId(null);setDelConfirm(null);show("Deleted");
  };

  const pickEst=async()=>{
    setView("pickEst");setEstLd(true);
    try{const r=await fetch(`${apiBaseUrl}/estimates/project/${projectId}`,{headers:hdr});if(r.ok){const d=await r.json();setEsts(Array.isArray(d)?d:[])}}catch{setEsts([])}
    finally{setEstLd(false)}
  };

  const selEst=async est=>{
    const items=(est.lineItems||est.items||[]).map(i=>({id:uid(),description:i.description||i.name||"",qty:parseFloat(i.qty||0),unitPrice:parseFloat(i.unitPrice||i.price||0),unit:i.unit||"ea",isMaterial:Boolean(i.isMaterial)}));
    const draft={id:null,title:`${est.title||est.name||"Estimate"} — Contract`,contractType:"Prime",status:"Draft",clientOrSubName:est.customer?.name||"",
      discountPercent:est.discountPercent||est.discount||0,taxRate:est.taxRate?est.taxRate/100:TAX_RATE,retentionPercent:10,paymentTerms:"Net 30",
      lineItems:items,milestones:[],changeOrders:[],scopeOfWork:est.notes||"",exclusions:"",signatureStatus:"Unsigned",linkedEstimateId:est.id};
    setContracts(p=>[...p,draft]);setView("form");setActiveId(null);show("Estimate converted — review and save");
  };

  const active=activeId!=null?contracts.find(c=>c.id===activeId):contracts.find(c=>c.id===null);

  return<div style={{maxWidth:780,color:tx,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:ac,color:"#fff",padding:"10px 22px",borderRadius:10,fontSize:12,fontWeight:700,zIndex:999,boxShadow:"0 8px 32px rgba(59,130,246,.4)"}}>{toast}</div>}

    {view==="list"&&<>
      {contracts.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {(()=>{let tv=0,tl=0,tm=0,tb=0;contracts.forEach(c=>{const t=calc(c.lineItems||[],c.discountPercent||0,c.taxRate||TAX_RATE,c.retentionPercent||0);tv+=t.tot;tl+=t.lab;tm+=t.mat;tb+=(c.milestones||[]).filter(m=>m.status==="Paid").reduce((a,m)=>a+(parseFloat(m.amount)||0),0)});
          return[<Kpi key="v" label="Total value" value={$(tv)} accent/>,<Kpi key="l" label="Labor" value={$(tl)}/>,<Kpi key="m" label="Materials" value={$(tm)}/>,<Kpi key="b" label="Billed" value={$(tb)} sub={tv>0?pct(tb/tv):"0%"}/>]})()}
      </div>}
      {loading?<div style={{textAlign:"center",padding:40,color:tx2}}>Loading...</div>:
      contracts.length===0?<div style={{textAlign:"center",padding:"40px 16px"}}>
        <Ic d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" s={36} c={tx3}/>
        <div style={{fontSize:15,fontWeight:800,color:tx,marginTop:12,marginBottom:6}}>No contracts yet</div>
        <div style={{fontSize:12,color:tx2,marginBottom:20}}>Create from scratch or convert an estimate.</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={()=>{setActiveId(null);setView("form")}} style={bPri}><Ic d="M12 5v14M5 12h14" s={12} c="#fff"/> New</button>
          <button onClick={pickEst} style={{...bPri,background:`linear-gradient(135deg,${grn},#16a34a)`}}><Ic d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" s={12} c="#fff"/> From estimate</button>
        </div>
      </div>:
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:11,color:tx2}}>{contracts.length} contract{contracts.length!==1?"s":""}</span>
          <div style={{display:"flex",gap:8}}>
            <button onClick={pickEst} style={bGh}><Ic d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" s={12}/> From est.</button>
            <button onClick={()=>{setActiveId(null);setView("form")}} style={bPri}><Ic d="M12 5v14M5 12h14" s={12} c="#fff"/> New</button>
          </div>
        </div>
        {contracts.map(c=>{const t=calc(c.lineItems||[],c.discountPercent||0,c.taxRate||TAX_RATE,c.retentionPercent||0);const pd=(c.milestones||[]).filter(m=>m.status==="Paid").reduce((a,m)=>a+(parseFloat(m.amount)||0),0);
          return<div key={c.id||uid()} onClick={()=>{setActiveId(c.id);setView("form")}} style={{...cardS,cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=ac} onMouseLeave={e=>e.currentTarget.style.borderColor=brdL}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontSize:14,fontWeight:800,color:tx}}>{c.title||"Untitled"}</div><div style={{fontSize:11,color:tx2,marginTop:2}}>{c.contractType} · {c.clientOrSubName||"\u2014"}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={e=>{e.stopPropagation();printContract(c)}} title="Print / Save PDF" style={{...bGh,padding:"4px 8px",border:"none"}}><Ic d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" s={13}/></button>
                {delConfirm===c.id
                  ?<><button onClick={e=>{e.stopPropagation();handleDelete(c.id)}} style={{...bGh,padding:"4px 10px",borderColor:red,color:red,fontSize:11}}>Confirm</button><button onClick={e=>{e.stopPropagation();setDelConfirm(null)}} style={{...bGh,padding:"4px 7px",border:"none",fontSize:11}}>✕</button></>
                  :<button onClick={e=>{e.stopPropagation();setDelConfirm(c.id)}} title="Delete" style={{...bGh,padding:"4px 7px",border:"none"}}><Ic d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" s={13} c={red}/></button>
                }
                <Chip s={c.status}/>
                {c.signedAt&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:12,background:"rgba(34,197,94,.12)",color:"#16a34a"}}>✓ Signed</span>}
                {c.signToken&&!c.signedAt&&c.status!=="Cancelled"&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:12,background:"rgba(99,102,241,.1)",color:"#6366f1"}}>⏳ Awaiting</span>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              <Kpi label="Total" value={$(t.tot)}/><Kpi label="Labor" value={$(t.lab)}/><Kpi label="Materials" value={$(t.mat)}/><Kpi label="Billed" value={pct(t.tot>0?pd/t.tot:0)} sub={$(pd)}/>
            </div>
          </div>})}
      </div>}
    </>}

    {view==="pickEst"&&<div style={cardS}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontSize:14,fontWeight:800,color:tx}}>Select an estimate</span>
        <button onClick={()=>setView("list")} style={{...bGh,padding:"4px 8px",border:"none"}}><Ic d="M18 6L6 18M6 6l12 12" s={14}/></button>
      </div>
      {estLd?<div style={{textAlign:"center",padding:30,color:tx2}}>Loading...</div>:
      ests.length===0?<div style={{textAlign:"center",padding:30,color:tx2,fontSize:12}}>No estimates found.</div>:
      ests.map(e=>{const t=(e.lineItems||e.items||[]).reduce((a,i)=>a+(i.qty||0)*(i.unitPrice||0),0);
        return<div key={e.id} onClick={()=>selEst(e)} style={{...cardS,cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={x=>x.currentTarget.style.borderColor=ac} onMouseLeave={x=>x.currentTarget.style.borderColor=brdL}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:tx}}>{e.title||e.name||"Untitled"}</div><div style={{fontSize:11,color:tx2,marginTop:2}}>{e.customer?.name||"\u2014"} · {(e.lineItems||e.items||[]).length} items</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:800,color:grn}}>{$(t)}</div><Chip s={e.status==="approved"?"Active":"Draft"}/></div>
          </div>
        </div>})}
    </div>}

    {view==="form"&&<Form contract={active} onSave={handleSave} onCancel={()=>{setView("list");setActiveId(null)}} onPrint={printContract} onDelete={handleDelete} isNew={!active||active.id==null} saving={saving} onSendSignature={c=>setSigMd(c)}/>}

    {sigMd&&<ContractSigModal contract={sigMd} company={company} apiBaseUrl={apiBaseUrl} onClose={()=>setSigMd(null)} onSent={(to)=>{setContracts(p=>p.map(c=>c.id===sigMd.id?{...c,status:"Sent"}:c));setSigMd(null);show("Signing link sent to "+to);}}/>}
  </div>;
}

/* ═══════ INLINE SIGNATURE MODAL (no App.jsx dependency) ═══════ */
function ContractSigModal({contract,company,apiBaseUrl,onClose,onSent}){
  const[to,setTo]=useState(contract?.clientEmail||"");
  const[msg,setMsg]=useState("Please review and sign the attached contract at your earliest convenience.");
  const[sending,setSending]=useState(false);
  const[sent,setSent]=useState(false);
  const[err,setErr]=useState(null);
  const token=typeof localStorage!=="undefined"?localStorage.getItem("bm_token"):null;

  const send=async()=>{
    if(!to.trim())return;
    setSending(true);setErr(null);
    try{
      const r=await fetch(`${apiBaseUrl}/contracts/${contract.id}/send-signature`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify({toEmail:to.trim(),message:msg.trim()})});
      if(!r.ok){const d=await r.json().catch(()=>({}));setErr(d.error||"Failed to send. Check SMTP settings in Company Setup.");return;}
      setSent(true);
      if(onSent)onSent(to.trim());
      setTimeout(()=>onClose(),1400);
    }catch{setErr("Network error. Please try again.");}
    finally{setSending(false);}
  };

  const ov={position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9999,overflowY:"auto",padding:"40px 16px"};
  const mo={background:"#1a1d23",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",width:"100%",maxWidth:520};
  const inp={width:"100%",background:"#23262d",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#e2e8f0",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const lbl={display:"block",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:.5,marginBottom:5};

  return(
    <div style={ov} onClick={onClose}>
      <div style={mo} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" s={16} c="#6366f1"/>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#e2e8f0"}}>Send for Signature</div>
              <div style={{fontSize:10,color:"#6b7280",fontFamily:"monospace"}}>{contract?.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{color:"#6b7280",background:"none",border:"none",cursor:"pointer",padding:4}}><Ic d="M18 6L6 18M6 6l12 12" s={16} c="#6b7280"/></button>
        </div>
        {sent?(
          <div style={{padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(99,102,241,.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic d="M20 6L9 17l-5-5" s={26} c="#6366f1"/>
            </div>
            <div style={{fontSize:16,fontWeight:800,color:"#6366f1"}}>Signing Link Sent!</div>
            <div style={{fontSize:12,color:"#9ca3af",textAlign:"center"}}>A signing link was emailed to {to}.<br/>You will be notified when they sign.</div>
          </div>
        ):(
          <>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={lbl}>Send To</label>
                <input style={inp} type="email" value={to} onChange={e=>setTo(e.target.value)} placeholder="customer@email.com"/>
              </div>
              <div>
                <label style={lbl}>Message (optional)</label>
                <textarea style={{...inp,resize:"vertical",lineHeight:1.6}} value={msg} onChange={e=>setMsg(e.target.value)} rows={3}/>
              </div>
              {err&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#fca5a5"}}>{err}</div>}
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#9ca3af"}}>
                Customer receives a secure link — no login required — to view and sign the contract online.
              </div>
            </div>
            <div style={{padding:"14px 20px",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",justifyContent:"space-between"}}>
              <button onClick={onClose} style={{background:"none",border:"1px solid rgba(255,255,255,.1)",color:"#9ca3af",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12}}>Cancel</button>
              <button onClick={send} disabled={sending||!to.trim()} style={{background:"#6366f1",border:"none",color:"#fff",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:12,fontWeight:700,opacity:!to.trim()||sending?0.5:1}}>
                {sending?"Sending…":"Send Signing Link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
