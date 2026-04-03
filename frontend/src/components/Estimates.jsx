import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TAX, EST_SC, INV_SC, MGMT_ROLES, ROLE_C, CAT_C, SVC_CAT_C } from '../constants';
import { calcInv, calcBurden, fmt, fmtD, uid, tod, addD, nxtNum, printDoc } from '../utils/calculations';
import { Chip, ES, CTip, KpiCard, ConfirmDeleteModal } from './shared/ui';
import I from './shared/Icons';
import api from '../api';
import EmailSendModal from './modals/EmailSendModal';
import SignatureRequestModal from './modals/SignatureRequestModal';

export default function Estimates({ests,setEsts,custs,projs,setProjs,invs,setInvs,mats,roles,svcs,company,showToast,setTab,db}) {
  const [sel,  setSel]  = useState(ests[0]?.id||null);
  const [srch, setSrch] = useState("");
  const [stF,  setStF]  = useState("all");
  const [form, setForm] = useState(null);
  const [picker, setPicker] = useState(null); // {type:"material"|"labor", search:""}
  const [emailMd, setEmailMd] = useState(false);
  const [sigMd, setSigMd] = useState(false);
  const [pendingDel,setPendingDel]=useState(null);

  const blankLine=()=>({id:uid(),description:"",qty:1,unitPrice:0,isMaterial:false,sourceType:"custom",sourceId:null});
  const blank={custId:"",name:"",date:tod(),expiry:addD(tod(),30),taxRate:TAX,discount:0,depositType:"none",depositValue:0,notes:"",status:"draft",lineItems:[]};

  const filt=useMemo(()=>ests.filter(e=>{
    const ms=!srch||e.name.toLowerCase().includes(srch.toLowerCase())||(e.number||"").toLowerCase().includes(srch.toLowerCase())||custs.find(c=>c.id===e.custId)?.name.toLowerCase().includes(srch.toLowerCase());
    return ms&&(stF==="all"||e.status===stF);
  }),[ests,srch,stF,custs]);

  const se=ests.find(e=>e.id===sel)||null;
  const seC=se?calcInv(se.lineItems,se.taxRate,se.discount||0,se.depositType||"none",Number(se.depositValue)||0):{sub:0,lab:0,mat:0,discountPct:0,discAmt:0,discSub:0,tax:0,total:0,depAmt:0,balanceDue:0};
  const seLinkedInv=se?invs.find(i=>i.estId===se.id):null;
  const seEffBal=seLinkedInv?.status==="paid"?0:seC.balanceDue;
  const formC=form?calcInv(form.lineItems.filter(l=>l.description.trim()),Number(form.taxRate)||TAX,Number(form.discount)||0,form.depositType||"none",Number(form.depositValue)||0):{sub:0,lab:0,mat:0,discountPct:0,discAmt:0,discSub:0,tax:0,total:0,depAmt:0,balanceDue:0};

  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=e=>setForm({...e,_id:e.id,lineItems:e.lineItems.map(l=>({...l,sourceType:l.sourceType||(l.isMaterial?"material":"labor"),sourceId:l.sourceId||null}))});
  const addLine=()=>setForm(f=>({...f,lineItems:[...f.lineItems,blankLine()]}));
  const delLine=id=>setForm(f=>({...f,lineItems:f.lineItems.filter(l=>l.id!==id)}));
  const updLine=(id,fld,v)=>setForm(f=>({...f,lineItems:f.lineItems.map(l=>l.id===id?{...l,[fld]:fld==="qty"||fld==="unitPrice"?Number(v)||0:v}:l)}));

  const addMaterial=(mat)=>{
    const sellPrice=mat.cost*(1+mat.markup/100);
    const line={id:uid(),description:mat.name,qty:1,unitPrice:Math.round(sellPrice*100)/100,isMaterial:true,sourceType:"material",sourceId:mat.id,unit:mat.unit};
    setForm(f=>({...f,lineItems:[...f.lineItems,line]}));
    setPicker(null);
  };
  const addLabor=(role)=>{
    const b=calcBurden(role);
    const line={id:uid(),description:`${role.title} Labor`,qty:1,unitPrice:b.fullyBurdenedRate,isMaterial:false,sourceType:"labor",sourceId:role.id,unit:"hr"};
    setForm(f=>({...f,lineItems:[...f.lineItems,line]}));
    setPicker(null);
  };
  const addService=(svc)=>{
    const items=svc.lineItems||[];
    if(items.length>0){
      const newLines=items.map(li=>({id:uid(),description:li.description,qty:li.qty,unitPrice:li.unitPrice,isMaterial:li.isMaterial,unit:li.unit,sourceType:"service",sourceId:svc.id}));
      setForm(f=>({...f,lineItems:[...f.lineItems,...newLines]}));
    } else {
      const line={id:uid(),description:svc.name,qty:1,unitPrice:svc.unitPrice,isMaterial:svc.isMaterial,sourceType:"service",sourceId:svc.id,unit:svc.unit};
      setForm(f=>({...f,lineItems:[...f.lineItems,line]}));
    }
    setPicker(null);
  };

  const save=()=>{
    if(!form.custId){showToast("Select a customer","error");return;}
    if(!form.name.trim()){showToast("Name required","error");return;}
    const lines=form.lineItems.filter(l=>l.description.trim());
    const c=calcInv(lines,Number(form.taxRate),Number(form.discount)||0);
    const data={...form,custId:Number(form.custId)||form.custId,subtotal:c.sub,materialSubtotal:c.mat,discount:Number(form.discount)||0,depositType:form.depositType||"none",depositValue:Number(form.depositValue)||0,lineItems:lines};
    if(form._id){var ch={...data};delete ch._id;db.ests.update(form._id,ch);showToast("Updated");}
    else{const id=nxtNum(ests,"EST");const ne={...data,id,number:id};db.ests.create(ne);setSel(id);showToast(id+" created");}
    setForm(null);
  };
  const markSt=(id,st)=>{
    if(st==="approved"){
      const est=ests.find(e=>e.id===id);
      if(est&&!est.projId){
        const c=calcInv(est.lineItems,est.taxRate,est.discount||0);
        const projId=nxtNum(projs,"PRJ");
        const np={
          id:projId,name:est.name,custId:est.custId,estId:est.id,
          status:"active",contractValue:c.total,
          budgetLabor:c.lab,budgetMaterials:c.mat,
          actualLabor:0,actualMaterials:0,
          start:tod(),end:addD(tod(),60),
          phase:"Planning",progress:0,
          notes:"Auto-created from "+est.number
        };
        db.projs.create(np);
        db.ests.update(id,{status:"approved",projId:projId});
        showToast("Approved → "+projId+" created");
        return;
      }
    }
    db.ests.update(id,{status:st});
    showToast("Marked "+st);
  };
  const del=id=>{db.ests.remove(id);if(sel===id)setSel(null);showToast("Deleted");setPendingDel(null);};

  const exportEst=(e,autoPrint=false)=>{
    const c=custs.find(x=>x.id===e.custId);const calc=calcInv(e.lineItems,e.taxRate,e.discount||0,e.depositType||"none",Number(e.depositValue)||0);
    const labItems=e.lineItems.filter(l=>!l.isMaterial);const matItems=e.lineItems.filter(l=>l.isMaterial);
    const mkRows=(items,qtyH)=>items.map((li,i)=>`<tr><td>${i+1}</td><td>${li.description}</td><td class="mn" style="text-align:right">${li.qty}${qtyH==="Hours"?" hrs":""}</td><td class="mn" style="text-align:right">${fmtD(li.unitPrice)}${qtyH==="Hours"?"/hr":""}</td><td class="mn" style="text-align:right;font-weight:700">${fmtD(li.qty*li.unitPrice)}</td></tr>`).join("");
    const mkSection=(title,items,qtyH)=>items.length===0?"":
      `<div class="section"><div class="section-title">${title}</div>
        <table><thead><tr><th>#</th><th>Description</th><th style="text-align:right">${qtyH}</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead><tbody>${mkRows(items,qtyH)}</tbody></table></div>`;
    printDoc(`Estimate ${e.number}`,`
      <div class="doc-title">ESTIMATE ${e.number}</div>
      <div class="doc-meta">Status: ${e.status.toUpperCase()} · Date: ${e.date} · Expires: ${e.expiry}</div>
      <div class="two-col section">
        <div><div class="section-title">Bill To</div><div style="font-weight:700;font-size:12px">${c?.name||"—"}</div><div style="color:#555">${c?.address||""}</div><div style="color:#555">${c?.phone||""} ${c?.email?(" · "+c.email):""}</div></div>
        <div><div class="section-title">Project</div><div style="font-size:12px;color:#333">${e.name}</div></div>
      </div>
      ${mkSection("Labor",labItems,"Hours")}
      ${mkSection("Materials",matItems,"Qty")}
      <div class="totals">
        <div class="row"><span>Labor Subtotal</span><span class="mn">${fmt(calc.lab)}</span></div>
        <div class="row"><span>Material Subtotal</span><span class="mn">${fmt(calc.mat)}</span></div>
        <div class="row" style="font-weight:700"><span>Subtotal</span><span class="mn">${fmt(calc.sub)}</span></div>
        ${calc.discountPct>0?`<div class="row" style="color:#7c3aed"><span>Discount (${calc.discountPct}%)</span><span class="mn">−${fmt(calc.discAmt)}</span></div>
        <div class="row" style="font-weight:700"><span>After Discount</span><span class="mn">${fmt(calc.discSub)}</span></div>`:""}
        <div class="row"><span>Sales Tax (${e.taxRate}%${calc.discountPct>0?" on disc. materials":""})</span><span class="mn">${fmt(calc.tax)}</span></div>
        <div class="row grand"><span>TOTAL</span><span class="mn">${fmt(calc.total)}</span></div>
        ${calc.depAmt>0?`<div class="row" style="border-top:1px dashed #ccc;padding-top:6px;color:#d97706"><span>Deposit Required${e.depositType==="percent"?" ("+e.depositValue+"%)":""}</span><span class="mn">${fmt(calc.depAmt)}</span></div>
        <div class="row" style="font-weight:800;color:#2563eb"><span>Balance Due</span><span class="mn" style="font-size:15px">${fmt(calc.balanceDue)}</span></div>`:""}
      </div>
      ${e.notes?`<div class="notes" style="margin-top:16px"><strong>Notes:</strong> ${e.notes}</div>`:""}
      ${company.estimateFooter?`<div class="footer">${company.estimateFooter}</div>`:""}
    `,company,autoPrint);
  };

  const cnts={all:ests.length,draft:ests.filter(e=>e.status==="draft").length,sent:ests.filter(e=>e.status==="sent").length,approved:ests.filter(e=>e.status==="approved").length};

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    {!form?(<div className="spl" style={{flex:1}}>
      <div className="spl-l">
        <div style={{padding:"11px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{display:"flex",gap:7,marginBottom:8}}>
            <div style={{flex:1,position:"relative"}}>
              <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={12}/></div>
              <input className="inp" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search estimates…" style={{paddingLeft:27,fontSize:12}}/>
            </div>
            <button onClick={openNew} className="bb b-bl" style={{padding:"8px 12px",fontSize:12}}><I n="plus" s={12}/>New</button>
          </div>
          <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid var(--border)"}}>
            {[["all",`All (${cnts.all})`],["draft",`Draft (${cnts.draft})`],["sent",`Sent (${cnts.sent})`],["approved",`Approved (${cnts.approved})`]].map(([v,l])=>(
              <button key={v} onClick={()=>setStF(v)} style={{flex:1,padding:"5px 3px",fontSize:9,fontWeight:700,background:stF===v?"rgba(59,130,246,.15)":"transparent",color:stF===v?"#63b3ed":"var(--text-dim)",borderRight:"1px solid var(--border)",transition:"all .13s"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {filt.map(e=>{
            const c=custs.find(x=>x.id===e.custId);
            const calc=calcInv(e.lineItems,e.taxRate,e.discount||0);
            const is=sel===e.id;
            const sc=EST_SC[e.status]||EST_SC.draft;
            return <div key={e.id} className={`sl ${is?"on":""}`} onClick={()=>setSel(e.id)} style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",background:is?"rgba(59,130,246,.06)":"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span className="mn" style={{fontSize:10,color:is?"#63b3ed":"var(--text-dim)"}}>{e.number}</span>
                <span style={{padding:"2px 6px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:sc.bg,color:sc.c}}>{sc.label}</span>
              </div>
              <div style={{fontWeight:700,fontSize:12,color:is?"var(--text)":"var(--text-2)",marginBottom:2}}>{e.name}</div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:10,color:"var(--text-faint)"}}>{c?.name}</div>
                <div className="mn" style={{fontSize:12,color:"#a78bfa"}}>{fmt(calc.total)}</div>
              </div>
            </div>;
          })}
          {filt.length===0&&<div style={{padding:"30px",textAlign:"center",color:"var(--text-ghost)",fontSize:12}}>No estimates found</div>}
        </div>
      </div>

      {se?(
        <div className="spl-r">
          <div style={{padding:"15px 20px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div className="est-detail-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
                  <span className="mn" style={{fontSize:17,color:"var(--text-2)"}}>{se.number}</span>
                  <Chip s={se.status} map={EST_SC}/>
                  {se.signedAt&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(34,197,94,.12)",color:"#16a34a"}}>✓ Signed</span>}
                  {se.signToken&&!se.signedAt&&se.status!=="declined"&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(99,102,241,.1)",color:"#6366f1"}}>⏳ Awaiting Signature</span>}
                </div>
                <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>
                  {se.name} · {custs.find(c=>c.id===se.custId)?.name} · {se.date}
                  {se.projId&&<span style={{marginLeft:8,padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:700,background:"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.12)",color:"var(--accent)",cursor:"pointer"}} onClick={()=>setTab("projects")}><I n="projects" s={9}/> {se.projId}</span>}
                </div>
              </div>
              <div className="act-bar" style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {se.status==="draft"&&<button onClick={()=>markSt(se.id,"sent")} className="bb b-am" style={{padding:"5px 10px",fontSize:11}}><I n="send" s={11}/>Send</button>}
                {se.status==="sent"&&<button onClick={()=>markSt(se.id,"approved")} className="bb b-gr" style={{padding:"5px 10px",fontSize:11}}><I n="check" s={11}/>Approve</button>}
                {se.status==="sent"&&<button onClick={()=>markSt(se.id,"declined")} className="bb b-rd" style={{padding:"5px 9px",fontSize:11}}>Decline</button>}
                {se.status==="approved"&&se.projId&&<button onClick={()=>setTab("projects")} className="bb b-bl" style={{padding:"5px 10px",fontSize:11}}><I n="projects" s={11}/>View Project</button>}
                {se.status==="approved"&&<button onClick={()=>markSt(se.id,"sent")} className="bb b-am" style={{padding:"5px 10px",fontSize:11}}><I n="send" s={11}/>Resend</button>}
                <button onClick={()=>openEdit(se)} className="bb b-gh" style={{padding:"5px 9px",fontSize:11}}><I n="edit" s={11}/></button>
                <button onClick={()=>setEmailMd(true)} className="bb b-bl" style={{padding:"5px 10px",fontSize:11}}><I n="mail" s={11}/>Email</button>
                {se.status!=="approved"&&se.status!=="declined"&&<button onClick={()=>setSigMd(true)} className="bb b-bl" style={{padding:"5px 10px",fontSize:11,background:"#6366f1",borderColor:"#6366f1"}}><I n="send" s={11}/>Sign Link</button>}
                <button onClick={()=>exportEst(se,true)} className="bb b-gh" style={{padding:"5px 9px",fontSize:11}}>⎙ Print</button>
                <button onClick={()=>setPendingDel(se.id)} className="bb b-rd" style={{padding:"5px 8px",fontSize:11}}><I n="trash" s={11}/></button>
              </div>
            </div>
            <div className="est-kpi-row" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{l:"Labor",v:fmt(seC.lab),c:"#f5a623"},{l:"Materials",v:fmt(seC.mat),c:"#6c8ebf"},{l:"Subtotal",v:fmt(seC.sub),c:"var(--text)"},{l:`Tax ${se.taxRate}%`,v:fmt(seC.tax),c:"#14b8a6"},{l:"TOTAL",v:fmt(seC.total),c:"#22c55e",big:true},...(seC.depAmt>0?[{l:"Deposit",v:fmt(seC.depAmt),c:"#f59e0b"},{l:"Balance Due",v:fmt(seEffBal),c:seEffBal===0?"#22c55e":"#63b3ed",big:true}]:[])].map(k=>(
                <div key={k.l} style={{background:"var(--bg-card)",border:`1px solid ${k.big?"rgba(34,197,94,.3)":"var(--border)"}`,borderRadius:8,padding:"6px 11px"}}>
                  <div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4}}>{k.l}</div>
                  <div className="mn" style={{fontSize:k.big?14:11,color:k.c,marginTop:2}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
            {(()=>{
              const labItems=se.lineItems.filter(l=>!l.isMaterial);
              const matItems=se.lineItems.filter(l=>l.isMaterial);
              const renderSection=(title,items,color,qtyLabel)=>(
                items.length>0&&<div style={{border:"1px solid var(--border)",borderRadius:11,overflow:"hidden",marginBottom:14}}>
                  <div style={{padding:"8px 14px",background:"var(--bg-sidebar)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontWeight:700,fontSize:11,color}}><I n={title==="Labor"?"wrench":"materials"} s={12}/> {title}</div>
                    <span className="mn" style={{fontSize:11,color}}>{fmt(items.reduce((s,l)=>s+l.qty*l.unitPrice,0))}</span>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{background:"var(--bg-sidebar)"}}>{["#","Description",qtyLabel,"Rate","Total"].map(h=><th key={h} style={{padding:"6px 13px",textAlign:"left",fontSize:8,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {items.map((li,i)=>(
                        <tr key={li.id} className="rh" style={{borderTop:"1px solid var(--border)"}}>
                          <td style={{padding:"7px 13px",color:"var(--text-dim)",fontSize:10}}>{i+1}</td>
                          <td style={{padding:"7px 13px",color:"var(--text-2)"}}>{li.description}</td>
                          <td className="mn" style={{padding:"7px 13px",color:"var(--text-muted)"}}>{li.qty}{qtyLabel==="Hours"?" hrs":""}</td>
                          <td className="mn" style={{padding:"7px 13px",color:"var(--text)"}}>{fmtD(li.unitPrice)}{qtyLabel==="Hours"?"/hr":""}</td>
                          <td className="mn" style={{padding:"7px 13px",color:"#22c55e",fontWeight:700}}>{fmtD(li.qty*li.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              return <>{renderSection("Labor",labItems,"#f5a623","Hours")}{renderSection("Materials",matItems,"#6c8ebf","Qty")}</>;
            })()}
            <div style={{border:"1px solid var(--border)",borderRadius:11,overflow:"hidden",marginBottom:14}}>
              <div style={{padding:"11px 16px",background:"var(--bg-sidebar)"}}>
                <div style={{maxWidth:280,marginLeft:"auto"}}>
                  {[
                    {l:"Labor Subtotal",v:fmt(seC.lab),c:"#f5a623"},
                    {l:"Material Subtotal (taxable)",v:fmt(seC.mat),c:"#6c8ebf"},
                    {l:"Subtotal",v:fmt(seC.sub),c:"var(--text)",bold:true},
                    ...(seC.discountPct>0?[{l:`Discount (${seC.discountPct}%)`,v:`−${fmt(seC.discAmt)}`,c:"#a78bfa"}]:[]),
                    ...(seC.discountPct>0?[{l:"After Discount",v:fmt(seC.discSub),c:"var(--text)",bold:true}]:[]),
                    {l:`Sales Tax ${se.taxRate}%`,v:fmt(seC.tax),c:"#14b8a6"},
                  ].map(r=>(
                    <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontSize:11,color:r.bold?"var(--text)":"var(--text-muted)",fontWeight:r.bold?700:400}}>{r.l}</span>
                      <span className="mn" style={{fontSize:11,color:r.c}}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
                    <span style={{fontWeight:800,fontSize:13}}>TOTAL</span>
                    <span className="mn" style={{fontSize:18,color:"#22c55e"}}>{fmt(seC.total)}</span>
                  </div>
                  {seC.depAmt>0&&(<>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderTop:"1px dashed var(--border-2)"}}>
                      <span style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>Deposit Required{se.depositType==="percent"?` (${se.depositValue}%)`:""}</span>
                      <span className="mn" style={{fontSize:11,color:"#f59e0b"}}>{fmt(seC.depAmt)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}>
                      <span style={{fontSize:12,fontWeight:800,color:seEffBal===0?"#22c55e":"#63b3ed"}}>Balance Due</span>
                      <span className="mn" style={{fontSize:15,color:seEffBal===0?"#22c55e":"#63b3ed"}}>{fmt(seEffBal)}</span>
                    </div>
                  </>)}
                </div>
              </div>
            </div>
            {se.notes&&<div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 15px"}}><div className="stl">Notes</div><div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.7}}>{se.notes}</div></div>}
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"var(--text-ghost)",gap:12}}>
          <I n="estimates" s={40}/><div style={{fontSize:14,fontWeight:600}}>Select an estimate</div>
          <button onClick={openNew} className="bb b-bl" style={{padding:"8px 16px",fontSize:12,marginTop:4}}><I n="plus" s={13}/>New Estimate</button>
        </div>
      )}
    </div>):(
        <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"var(--bg-sidebar)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600}}><I n="arrow" s={15}/> Back</button>
              <div style={{width:1,height:18,background:"var(--border)"}}/>
              <div style={{fontSize:15,fontWeight:800}}>{form._id?"Edit Estimate":"New Estimate"}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setForm(null)} className="bb b-gh" style={{padding:"7px 14px",fontSize:11}}>Cancel</button>
              <button onClick={save} className="bb b-bl" style={{padding:"7px 16px",fontSize:12}}><I n="check" s={13}/>{form._id?"Update":"Create"}</button>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
            <div className="full-form-grid" style={{display:"grid",gridTemplateColumns:"1fr 240px",minHeight:"100%"}}>
              <div style={{padding:"22px 28px",borderRight:"1px solid var(--border-2)"}}>
                <div className="g2" style={{marginBottom:12}}>
                  <div><label className="lbl">Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Kitchen Remodel Bid"/></div>
                  <div><label className="lbl">Customer *</label>
                    <select className="inp" value={form.custId} onChange={e=>setForm(f=>({...f,custId:Number(e.target.value)}))}>
                      <option value="">— Select —</option>
                      {custs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="g4" style={{marginBottom:12}}>
                  <div><label className="lbl">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                  <div><label className="lbl">Expiry</label><input className="inp" type="date" value={form.expiry} onChange={e=>setForm(f=>({...f,expiry:e.target.value}))}/></div>
                  <div><label className="lbl">Tax Rate %</label><input className="inp" type="number" step=".1" value={form.taxRate} onChange={e=>setForm(f=>({...f,taxRate:Number(e.target.value)}))}/></div>
                  <div><label className="lbl">Discount %</label><input className="inp" type="number" step=".5" min="0" max="100" value={form.discount||0} onChange={e=>setForm(f=>({...f,discount:Number(e.target.value)||0}))} style={{borderColor:form.discount>0?"#a78bfa":"var(--border-2)"}}/></div>
                </div>
                <div className="g3" style={{marginBottom:12}}>
                  <div><label className="lbl">Deposit</label>
                    <select className="inp" value={form.depositType||"none"} onChange={e=>setForm(f=>({...f,depositType:e.target.value,depositValue:e.target.value==="none"?0:f.depositValue}))}>
                      <option value="none">No Deposit</option>
                      <option value="percent">% of Total</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>
                  {form.depositType&&form.depositType!=="none"&&(<>
                    <div><label className="lbl">{form.depositType==="percent"?"Deposit %":"Deposit $"}</label><input className="inp" type="number" step={form.depositType==="percent"?".5":".01"} min="0" value={form.depositValue||0} onChange={e=>setForm(f=>({...f,depositValue:Number(e.target.value)||0}))} style={{borderColor:"#f59e0b"}}/></div>
                    <div><label className="lbl">Deposit Amount</label><div className="mn" style={{padding:"9px 13px",background:"var(--bg-card)",border:"1px solid #f59e0b",borderRadius:8,color:"#f59e0b",fontSize:13}}>{fmt(formC.depAmt)}</div></div>
                  </>)}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <label className="lbl" style={{marginBottom:0}}>Line Items</label>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setPicker({type:"material",search:""})} className="bb b-bl" style={{padding:"4px 9px",fontSize:10,borderRadius:6}}><I n="materials" s={10}/>Material</button>
                    <button onClick={()=>setPicker({type:"labor",search:""})} className="bb b-am" style={{padding:"4px 9px",fontSize:10,borderRadius:6}}><I n="wrench" s={10}/>Labor</button>
                    <button onClick={()=>setPicker({type:"service",search:"",catF:"all"})} className="bb b-gh" style={{padding:"4px 9px",fontSize:10,borderRadius:6,borderColor:"#22c55e",color:"#22c55e"}}><I n="check" s={10}/>Service</button>
                    <button onClick={addLine} className="bb b-gh" style={{padding:"4px 9px",fontSize:10,borderRadius:6}}><I n="plus" s={10}/>Custom</button>
                  </div>
                </div>
                {picker&&(
                  <div style={{border:"1px solid var(--accent)",borderRadius:9,background:"var(--bg-sidebar)",marginBottom:10,overflow:"hidden",animation:"up .18s ease"}}>
                    <div style={{padding:"8px 10px",borderBottom:"1px solid var(--border-2)",display:"flex",gap:7,alignItems:"center"}}>
                      <div style={{position:"relative",flex:1}}>
                        <div style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={11}/></div>
                        <input className="inp" autoFocus value={picker.search} onChange={e=>setPicker(p=>({...p,search:e.target.value}))} placeholder={picker.type==="material"?"Search materials…":picker.type==="service"?"Search services…":"Search labor roles…"} style={{paddingLeft:24,fontSize:11,padding:"5px 7px 5px 24px"}}/>
                      </div>
                      <button onClick={()=>setPicker(null)} style={{color:"var(--text-dim)",flexShrink:0}}><I n="x" s={14}/></button>
                    </div>
                    <div style={{maxHeight:180,overflowY:"auto"}}>
                      {picker.type==="material"&&(()=>{
                        const fMats=mats.filter(m=>!picker.search||m.name.toLowerCase().includes(picker.search.toLowerCase())||m.category.toLowerCase().includes(picker.search.toLowerCase())||m.supplier.toLowerCase().includes(picker.search.toLowerCase()));
                        return fMats.length===0
                          ?<div style={{padding:"14px",textAlign:"center",color:"var(--text-faint)",fontSize:11}}>No materials found</div>
                          :fMats.map(m=>{
                            const sp2=m.cost*(1+m.markup/100);
                            return <div key={m.id} onClick={()=>addMaterial(m)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s"}} className="rh">
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:11,fontWeight:600,color:"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                                <div style={{fontSize:9,color:"var(--text-faint)",marginTop:1}}><span style={{padding:"1px 5px",borderRadius:6,background:`${CAT_C[m.category]||"#4a566e"}18`,color:CAT_C[m.category]||"var(--text-muted)",fontSize:8,fontWeight:700}}>{m.category}</span> · {m.supplier} · {m.stock} {m.unit} in stock</div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                                <div className="mn" style={{fontSize:11,color:"#22c55e"}}>{fmtD(sp2)}<span style={{fontSize:8,color:"var(--text-faint)"}}>/{m.unit}</span></div>
                                <div style={{fontSize:8,color:"var(--text-dim)"}}>cost {fmtD(m.cost)} +{m.markup}%</div>
                              </div>
                            </div>;
                          });
                      })()}
                      {picker.type==="service"&&(()=>{
                        const fSvcs=svcs.filter(s=>
                          (!picker.search||s.name.toLowerCase().includes(picker.search.toLowerCase())||s.category.toLowerCase().includes(picker.search.toLowerCase()))&&
                          (picker.catF==="all"||s.category===picker.catF)
                        );
                        return <>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"6px 12px",borderBottom:"1px solid var(--border)"}}>
                            {["all","General","Plumbing","Electrical","Framing","Painting","Flooring","Roofing","HVAC","Concrete","Landscaping","Cleanup"].map(c=>(
                              <button key={c} onClick={()=>setPicker(p=>({...p,catF:c}))} style={{padding:"2px 7px",borderRadius:10,fontSize:9,fontWeight:700,border:`1px solid ${picker.catF===c?"var(--accent)":"var(--border)"}`,background:picker.catF===c?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.14)":"transparent",color:picker.catF===c?"var(--accent-light)":"var(--text-dim)"}}>{c==="all"?"All":c}</button>
                            ))}
                          </div>
                          {fSvcs.length===0
                            ?<div style={{padding:"14px 12px",color:"var(--text-dim)",fontSize:11,textAlign:"center"}}>No services found</div>
                            :fSvcs.map(s=>(
                              <div key={s.id} onClick={()=>addService(s)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s"}} className="rh">
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                                  <div style={{fontSize:8,color:"var(--text-faint)",marginTop:1}}><span style={{padding:"1px 5px",borderRadius:6,fontSize:8,fontWeight:700,background:`${SVC_CAT_C[s.category]||"#4a566e"}18`,color:SVC_CAT_C[s.category]||"var(--text-dim)"}}>{s.category}</span> · {(s.lineItems||[]).length>0?"Package":s.isMaterial?"Material":"Labor"}</div>
                                </div>
                                <div style={{textAlign:"right",flexShrink:0}}>
                                  {(s.lineItems||[]).length>0
                                    ?<><div style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:"rgba(20,184,166,.12)",color:"#14b8a6"}}>{s.lineItems.length} items</div><div className="mn" style={{fontSize:10,color:"#22c55e",marginTop:1}}>{fmtD(s.lineItems.reduce((t,li)=>t+li.qty*li.unitPrice,0))}</div></>
                                    :<div className="mn" style={{fontSize:11,color:"#22c55e"}}>{fmtD(s.unitPrice)}<span style={{fontSize:8,color:"var(--text-faint)"}}>/{s.unit}</span></div>
                                  }
                                </div>
                              </div>
                            ))
                          }
                        </>;
                      })()}
                      {picker.type==="labor"&&(()=>{
                        const fRoles=roles.filter(r=>!MGMT_ROLES.has(r.title)&&(!picker.search||r.title.toLowerCase().includes(picker.search.toLowerCase())));
                        return fRoles.length===0
                          ?<div style={{padding:"14px",textAlign:"center",color:"var(--text-faint)",fontSize:11}}>No labor roles found</div>
                          :fRoles.map(r=>{
                            const b=calcBurden(r);const tc=ROLE_C[r.title]||"#4a566e";
                            return <div key={r.id} onClick={()=>addLabor(r)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s"}} className="rh">
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                <div style={{width:4,height:22,borderRadius:2,background:tc,flexShrink:0}}/>
                                <div>
                                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-2)"}}>{r.title}</div>
                                  <div style={{fontSize:8,color:"var(--text-faint)",marginTop:1}}>Base ${r.baseRate}/hr · Burden {b.totalBurdenPct.toFixed(1)}%</div>
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div className="mn" style={{fontSize:11,color:"#22c55e"}}>${b.fullyBurdenedRate.toFixed(2)}<span style={{fontSize:8,color:"var(--text-faint)"}}>/hr</span></div>
                                <div style={{fontSize:8,color:"var(--text-dim)"}}>fully burdened</div>
                              </div>
                            </div>;
                          });
                      })()}
                    </div>
                  </div>
                )}
                {(()=>{
                  const labLines=form.lineItems.filter(l=>!l.isMaterial);
                  const matLines=form.lineItems.filter(l=>l.isMaterial);
                  const renderEditSection=(title,items,color,qtyLabel,icon)=>(
                    items.length>0&&<div style={{border:"1px solid var(--border-2)",borderRadius:9,overflow:"hidden",marginBottom:10}}>
                      <div style={{padding:"6px 10px",background:"var(--bg-card)",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontWeight:700,fontSize:10,color,display:"flex",alignItems:"center",gap:5}}><I n={icon} s={11}/>{title}</span>
                        <span className="mn" style={{fontSize:10,color}}>{fmt(items.reduce((s,l)=>s+l.qty*l.unitPrice,0))}</span>
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead><tr style={{background:"var(--bg-card)"}}>{["Description",qtyLabel,"Rate/Price","Total",""].map(h=><th key={h} style={{padding:"5px 7px",textAlign:"left",fontSize:8,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",borderBottom:"1px solid var(--border-2)"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {items.map((li,i)=>(
                            <tr key={li.id} style={{borderTop:i>0?"1px solid var(--border)":"none"}}>
                              <td style={{padding:"4px 6px"}}><input className="inp" value={li.description} onChange={e=>updLine(li.id,"description",e.target.value)} placeholder="Description" style={{fontSize:11,padding:"5px 7px"}}/></td>
                              <td style={{padding:"4px 6px"}}><input className="inp" type="number" value={li.qty} onChange={e=>updLine(li.id,"qty",e.target.value)} style={{fontSize:11,padding:"5px 5px",width:56}} placeholder={qtyLabel==="Hours"?"hrs":"qty"}/></td>
                              <td style={{padding:"4px 6px"}}><input className="inp" type="number" step=".01" value={li.unitPrice} onChange={e=>updLine(li.id,"unitPrice",e.target.value)} style={{fontSize:11,padding:"5px 5px",width:82}}/></td>
                              <td className="mn" style={{padding:"4px 6px",color:"#22c55e",fontSize:11,whiteSpace:"nowrap"}}>{fmtD(li.qty*li.unitPrice)}</td>
                              <td style={{padding:"4px 2px",width:28}}><button onClick={()=>delLine(li.id)} style={{color:"#ef4444",opacity:.6,display:"flex",alignItems:"center",justifyContent:"center",padding:2}}><I n="x" s={13}/></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                  return <>{renderEditSection("Labor",labLines,"#f5a623","Hours","wrench")}{renderEditSection("Materials",matLines,"#6c8ebf","Qty","materials")}</>;
                })()}
                <div style={{marginBottom:12}}><label className="lbl">Notes</label><textarea className="inp" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{resize:"vertical"}}/></div>
                <div className="desk-only" style={{height:20}}/>
                <div className="mob-only" style={{display:"flex",gap:9,marginBottom:16}}>
                  <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                  <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Create"}</button>
                </div>
              </div>
              <div style={{padding:"18px 16px",background:"var(--bg-sidebar)",overflowY:"auto",borderLeft:"1px solid var(--border-2)"}}>
                <div className="stl">Preview</div>
                <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:9,overflow:"hidden"}}>
                  {[
                    {l:"Labor",v:fmt(formC.lab),c:"#f5a623"},
                    {l:"Materials",v:fmt(formC.mat),c:"#6c8ebf",note:"taxable"},
                    {l:"Subtotal",v:fmt(formC.sub),c:"var(--text)",bold:true},
                    ...(formC.discountPct>0?[{l:`Discount (${formC.discountPct}%)`,v:`−${fmt(formC.discAmt)}`,c:"#a78bfa",disc:true}]:[]),
                    ...(formC.discountPct>0?[{l:"After Discount",v:fmt(formC.discSub),c:"var(--text)",bold:true}]:[]),
                    {l:`Tax ${form.taxRate}%`+(formC.discountPct>0?" (on disc. materials)":""),v:fmt(formC.tax),c:"#14b8a6"},
                  ].map(r=>(
                    <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",borderBottom:"1px solid var(--border)",background:r.disc?"rgba(167,139,250,.04)":"transparent"}}>
                      <div><span style={{fontSize:10,color:r.disc?"#a78bfa":r.bold?"var(--text)":"var(--text-muted)",fontWeight:r.bold||r.disc?700:400}}>{r.l}</span>{r.note&&<span style={{fontSize:8,color:"var(--text-faint)",marginLeft:4}}>({r.note})</span>}</div>
                      <span className="mn" style={{fontSize:10,color:r.c}}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{padding:"10px 11px",background:"rgba(34,197,94,.05)"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:800,fontSize:12}}>TOTAL</span><span className="mn" style={{fontSize:17,color:"#22c55e"}}>{fmt(formC.total)}</span></div>
                  </div>
                  {formC.depAmt>0&&(<>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",borderTop:"1px solid var(--border)",background:"rgba(245,158,11,.04)"}}>
                      <span style={{fontSize:10,color:"#f59e0b",fontWeight:700}}>Deposit Required{form.depositType==="percent"?` (${form.depositValue}%)`:""}</span>
                      <span className="mn" style={{fontSize:12,color:"#f59e0b"}}>{fmt(formC.depAmt)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",background:"rgba(99,179,237,.04)"}}>
                      <span style={{fontSize:10,color:"#63b3ed",fontWeight:700}}>Balance Due</span>
                      <span className="mn" style={{fontSize:12,color:"#63b3ed"}}>{fmt(formC.balanceDue)}</span>
                    </div>
                  </>)}
                </div>
                <div style={{marginTop:10,background:"rgba(20,184,166,.06)",border:"1px solid rgba(20,184,166,.15)",borderRadius:8,padding:"9px 10px",fontSize:9,color:"var(--text-muted)",lineHeight:1.7}}>
                  <div style={{color:"#14b8a6",fontWeight:700,marginBottom:2}}>Calculation</div>
                  {formC.discountPct>0&&<div>Discount = Subtotal × {formC.discountPct}% = −{fmt(formC.discAmt)}</div>}
                  <div>Tax = {formC.discountPct>0?"Discounted ":""}Materials × {form.taxRate}%</div>
                  <div style={{fontWeight:700,color:"var(--text)"}}>Total = {formC.discountPct>0?"After Discount":"Subtotal"} + Tax</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {pendingDel!==null&&<ConfirmDeleteModal label="this estimate" onConfirm={()=>del(pendingDel)} onCancel={()=>setPendingDel(null)}/>}
      {emailMd&&se&&<EmailSendModal type="estimate" docNumber={se.number} customer={custs.find(c=>c.id===se.custId)} total={fmt(seC.total)} project={se.name} company={company} onClose={()=>setEmailMd(false)} onSend={(to)=>{if(se.status==="draft"){markSt(se.id,"sent");}showToast("Estimate emailed to "+to);}}/>}
      {sigMd&&se&&<SignatureRequestModal type="estimate" docId={se.id} docNumber={se.number} customer={custs.find(c=>c.id===se.custId)} company={company} onClose={()=>setSigMd(false)} onSent={(to)=>{db.ests.update(se.id,{status:"sent",signToken:"pending"});showToast("Signing link sent to "+to);}}/>}
    </div>
  );
}
