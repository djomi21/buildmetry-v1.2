import { useState, useMemo } from 'react';
import api from '../api';
import { INV_SC, EST_SC, TAX, ROLE_C, SVC_CAT_C } from '../constants';
import { calcInv, fmt, fmtD, tod, uid, nxtNum, printDoc, calcBurden, addD } from '../utils/calculations';
import { I } from './shared/Icons';
import { KpiCard, Chip, ES, ConfirmDeleteModal } from './shared/ui';
import EmailSendModal from './modals/EmailSendModal';
import SignatureRequestModal from './modals/SignatureRequestModal';

export default function Invoices({invs,setInvs,custs,projs,ests,cos,mats,roles,svcs,company,showToast,db}) {
  const [sel,  setSel]  = useState(invs[0]?.id||null);
  const [stF,  setStF]  = useState("all");
  const [newMd,setNewMd]= useState(null);
  const [srcId,setSrcId]= useState("");
  const [emailMd, setEmailMd] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [invPicker, setInvPicker] = useState(null); // full-screen edit mode
  const [pendingDel,setPendingDel]=useState(null);
  const si=invs.find(i=>i.id===sel)||null;
  const siC=si?calcInv(si.lineItems,si.taxRate,si.discount||0,si.depositType||"none",Number(si.depositValue)||0):{sub:0,lab:0,mat:0,discountPct:0,discAmt:0,discSub:0,tax:0,total:0,depAmt:0,balanceDue:0};
  const effectiveBal=si?.status==="paid"?0:siC.balanceDue;

  const filt=useMemo(()=>invs.filter(i=>stF==="all"||i.status===stF),[invs,stF]);
  const arKpis=useMemo(()=>{
    const all=invs.map(i=>({...i,...calcInv(i.lineItems,i.taxRate,i.discount||0)}));
    return {
      coll:all.filter(i=>i.status==="paid").reduce((s,i)=>s+i.total,0),
      ov:all.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.total,0),
      sent:all.filter(i=>i.status==="sent").reduce((s,i)=>s+i.total,0),
      draft:all.filter(i=>i.status==="draft").reduce((s,i)=>s+i.total,0),
    };
  },[invs]);

  const setStatus=(id,st)=>db.invs.update(id,{status:st,paidDate:st==="paid"?tod():null});

  // Edit form helpers
  const openEdit=(inv)=>{setEditForm({...inv,_id:inv.id,custId:inv.custId||"",discount:inv.discount||0});setInvPicker(null);};
  const addEditLine=()=>setEditForm(f=>({...f,lineItems:[...f.lineItems,{id:uid(),description:"",qty:1,unitPrice:0,isMaterial:false}]}));
  const updEditLine=(lid,fld,v)=>setEditForm(f=>({...f,lineItems:f.lineItems.map(l=>l.id===lid?{...l,[fld]:fld==="qty"||fld==="unitPrice"?Number(v)||0:v}:l)}));
  const delEditLine=(lid)=>setEditForm(f=>({...f,lineItems:f.lineItems.filter(l=>l.id!==lid)}));
  const addInvMaterial=(mat)=>{
    var sellPrice=mat.cost*(1+mat.markup/100);
    var line={id:uid(),description:mat.name,qty:1,unitPrice:Math.round(sellPrice*100)/100,isMaterial:true,sourceType:"material",sourceId:mat.id,unit:mat.unit};
    setEditForm(f=>({...f,lineItems:[...f.lineItems,line]}));
    setInvPicker(null);
  };
  const addInvLabor=(role)=>{
    var b=calcBurden(role);
    var line={id:uid(),description:role.title+" Labor",qty:1,unitPrice:b.fullyBurdenedRate,isMaterial:false,sourceType:"labor",sourceId:role.id,unit:"hr"};
    setEditForm(f=>({...f,lineItems:[...f.lineItems,line]}));
    setInvPicker(null);
  };
  const addInvService=function(svc){
    var items=svc.lineItems||[];
    if(items.length>0){
      var newLines=items.map(function(li){return {id:uid(),description:li.description,qty:li.qty,unitPrice:li.unitPrice,isMaterial:li.isMaterial,unit:li.unit,sourceType:"service",sourceId:svc.id};});
      setEditForm(function(f){return {...f,lineItems:[...f.lineItems,...newLines]};});
    } else {
      var line={id:uid(),description:svc.name,qty:1,unitPrice:svc.unitPrice,isMaterial:svc.isMaterial,sourceType:"service",sourceId:svc.id,unit:svc.unit};
      setEditForm(function(f){return {...f,lineItems:[...f.lineItems,line]};});
    }
    setInvPicker(null);
  };
  const saveEdit=()=>{
    if(!editForm.lineItems.length){showToast("Add at least one line item","error");return;}
    var lines=editForm.lineItems.filter(l=>l.description.trim());
    var c=calcInv(lines,Number(editForm.taxRate),Number(editForm.discount)||0);
    var data={custId:Number(editForm.custId)||editForm.custId||null,projId:editForm.projId||null,issueDate:editForm.issueDate,dueDate:editForm.dueDate,discount:Number(editForm.discount)||0,depositType:editForm.depositType||"none",depositValue:Number(editForm.depositValue)||0,taxRate:Number(editForm.taxRate),notes:editForm.notes||"",lineItems:lines};
    if(editForm._id){
      db.invs.update(editForm._id,data);
      showToast("Invoice updated");
    } else {
      var id=nxtNum(invs,"INV");
      db.invs.create({...data,id:id,number:id,status:"draft",paidDate:null,estId:null});
      setSel(id);
      showToast(id+" created");
    }
    setEditForm(null);
  };
  const editFormC=editForm?calcInv(editForm.lineItems.filter(l=>l.description.trim()),Number(editForm.taxRate),Number(editForm.discount)||0,editForm.depositType||"none",Number(editForm.depositValue)||0):{sub:0,lab:0,mat:0,discountPct:0,discAmt:0,discSub:0,tax:0,total:0,depAmt:0,balanceDue:0};

  const createFromProj=()=>{
    const p=projs.find(x=>x.id===srcId);if(!p)return;
    const id=nxtNum(invs,"INV");
    var lineItems=[];var lineId=1;
    // Pull estimate line items
    var est=(ests||[]).find(function(e){return e.id===p.estId;});
    if(est&&est.lineItems){
      est.lineItems.forEach(function(li){
        lineItems.push({id:lineId++,description:li.description,qty:li.qty,unitPrice:li.unitPrice,isMaterial:li.isMaterial,section:"estimate"});
      });
    }
    // Pull approved change orders
    var projCOs=(cos||[]).filter(function(c){return c.projId===p.id&&c.status==="approved";});
    projCOs.forEach(function(co){
      if(co.laborAmt>0) lineItems.push({id:lineId++,description:"CO "+co.number+" — "+co.description+" (Labor)",qty:1,unitPrice:co.laborAmt,isMaterial:false,section:"changeorder",coNumber:co.number});
      if(co.materialAmt>0) lineItems.push({id:lineId++,description:"CO "+co.number+" — "+co.description+" (Materials)",qty:1,unitPrice:co.materialAmt,isMaterial:true,section:"changeorder",coNumber:co.number});
    });
    // If no estimate found, fall back to project budget summary
    if(lineItems.length===0){
      if(p.actualLabor>0||p.budgetLabor>0) lineItems.push({id:lineId++,description:"Labor — "+p.name,qty:1,unitPrice:p.actualLabor||p.budgetLabor,isMaterial:false,section:"estimate"});
      if(p.actualMaterials>0||p.budgetMaterials>0) lineItems.push({id:lineId++,description:"Materials — "+p.name,qty:1,unitPrice:p.actualMaterials||p.budgetMaterials,isMaterial:true,section:"estimate"});
    }
    var taxRate=est?est.taxRate:TAX;
    var discount=est?(est.discount||0):0;
    var depositType=est?(est.depositType||"none"):"none";
    var depositValue=est?(Number(est.depositValue)||0):0;
    db.invs.create({id,number:id,custId:p.custId,projId:p.id,estId:p.estId||null,status:"draft",issueDate:tod(),dueDate:addD(tod(),30),discount:discount,depositType:depositType,depositValue:depositValue,paidDate:null,taxRate:taxRate,notes:"Invoice from project — "+p.name+(projCOs.length>0?" (includes "+projCOs.length+" CO"+(projCOs.length>1?"s":"")+")" :""),lineItems:lineItems});
    setSel(id);setNewMd(null);showToast(id+" created");
  };
  const createManual=()=>{
    const id=nxtNum(invs,"INV");
    setEditForm({_id:null,id:id,number:id,custId:"",projId:null,estId:null,status:"draft",issueDate:tod(),dueDate:addD(tod(),30),discount:0,depositType:"none",depositValue:0,paidDate:null,taxRate:TAX,notes:"",lineItems:[]});
    setNewMd(null);
  };
  const dup=inv=>{
    const id=nxtNum(invs,"INV");
    db.invs.create({...inv,id,number:id,status:"draft",issueDate:tod(),dueDate:addD(tod(),30),paidDate:null});
    setSel(id);showToast(id+" created");
  };
  const del=id=>{db.invs.remove(id);if(sel===id)setSel(null);showToast("Deleted");setPendingDel(null);};

  const exportInv=(inv,autoPrint=false)=>{
    const c=custs.find(x=>x.id===inv.custId);const calc=calcInv(inv.lineItems,inv.taxRate,inv.discount||0,inv.depositType||"none",Number(inv.depositValue)||0);
    const labItems=inv.lineItems.filter(l=>!l.isMaterial);const matItems=inv.lineItems.filter(l=>l.isMaterial);
    const mkRows=(items,qtyH)=>items.map((li,i)=>`<tr><td>${i+1}</td><td>${li.description}</td><td class="mn" style="text-align:right">${li.qty}${qtyH==="Hours"?" hrs":""}</td><td class="mn" style="text-align:right">${fmtD(li.unitPrice)}${qtyH==="Hours"?"/hr":""}</td><td class="mn" style="text-align:right;font-weight:700">${fmtD(li.qty*li.unitPrice)}</td></tr>`).join("");
    const mkSection=(title,items,qtyH)=>items.length===0?"":
      `<div class="section"><div class="section-title">${title}</div>
        <table><thead><tr><th>#</th><th>Description</th><th style="text-align:right">${qtyH}</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead><tbody>${mkRows(items,qtyH)}</tbody></table></div>`;
    const stLabel=inv.status==="paid"?"PAID":inv.status==="overdue"?"OVERDUE":inv.status==="sent"?"SENT":"DRAFT";
    const stColor=inv.status==="paid"?"#16a34a":inv.status==="overdue"?"#dc2626":"#555";
    printDoc(`Invoice ${inv.number}`,`
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="doc-title">INVOICE ${inv.number}</div>
        <div style="font-size:16px;font-weight:800;color:${stColor}">${stLabel}</div>
      </div>
      <div class="doc-meta">Issued: ${inv.issueDate} · Due: ${inv.dueDate}${inv.paidDate?" · Paid: "+inv.paidDate:""}</div>
      <div class="two-col section">
        <div><div class="section-title">Bill To</div><div style="font-weight:700;font-size:12px">${c?.name||"—"}</div><div style="color:#555">${c?.address||""}</div><div style="color:#555">${c?.phone||""} ${c?.email?(" · "+c.email):""}</div></div>
        <div style="text-align:right"><div class="section-title">Payment Terms</div><div style="font-size:12px">Net ${company.paymentTerms||30}</div><div style="font-size:10px;color:#555;margin-top:4px">Due: ${inv.dueDate}</div></div>
      </div>
      ${mkSection("Labor",labItems,"Hours")}
      ${mkSection("Materials",matItems,"Qty")}
      <div class="totals">
        <div class="row"><span>Labor</span><span class="mn">${fmt(calc.lab)}</span></div>
        <div class="row"><span>Materials (taxable)</span><span class="mn">${fmt(calc.mat)}</span></div>
        <div class="row" style="font-weight:700"><span>Subtotal</span><span class="mn">${fmt(calc.sub)}</span></div>
        ${calc.discountPct>0?`<div class="row" style="color:#7c3aed"><span>Discount (${calc.discountPct}%)</span><span class="mn">−${fmt(calc.discAmt)}</span></div>
        <div class="row" style="font-weight:700"><span>After Discount</span><span class="mn">${fmt(calc.discSub)}</span></div>`:""}
        <div class="row"><span>Sales Tax (${inv.taxRate}%${calc.discountPct>0?" on disc. materials":""})</span><span class="mn">${fmt(calc.tax)}</span></div>
        <div class="row grand"><span>TOTAL DUE</span><span class="mn">${fmt(calc.total)}</span></div>
        ${calc.depAmt>0?`<div class="row" style="border-top:1px dashed #ccc;padding-top:6px;color:#d97706"><span>Deposit${inv.depositType==="percent"?" ("+inv.depositValue+"%)":""}</span><span class="mn">${fmt(calc.depAmt)}</span></div>
        <div class="row" style="font-weight:800;color:${inv.status==="paid"?"#16a34a":"#2563eb"};font-size:14px"><span>Balance Due</span><span class="mn" style="font-size:16px">${fmt(inv.status==="paid"?0:calc.balanceDue)}</span></div>`:""}
      </div>
      ${inv.notes?`<div class="notes" style="margin-top:16px"><strong>Notes:</strong> ${inv.notes}</div>`:""}
      ${company.invoiceFooter?`<div class="footer">${company.invoiceFooter}</div>`:""}
    `,company,autoPrint);
  };

  const cnts={all:invs.length,draft:invs.filter(i=>i.status==="draft").length,sent:invs.filter(i=>i.status==="sent").length,paid:invs.filter(i=>i.status==="paid").length,overdue:invs.filter(i=>i.status==="overdue").length};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%"}}>
    {!editForm?(<>
      <div className="g4">
        {[{l:"Collected",v:fmt(arKpis.coll),c:"#22c55e"},{l:"Overdue",v:fmt(arKpis.ov),c:"#ef4444"},{l:"Sent / Pending",v:fmt(arKpis.sent),c:"#f5a623"},{l:"Draft",v:fmt(arKpis.draft),c:"var(--text-dim)"}].map(k=>(
          <KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>
        ))}
      </div>

      <div className="spl" style={{flex:1}}>
        <div className="spl-l">
          <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div style={{display:"flex",gap:7,marginBottom:7}}>
              <span style={{flex:1,fontSize:10,color:"var(--text-dim)",fontWeight:700,display:"flex",alignItems:"center"}}>{filt.length} INVOICES</span>
              <button onClick={()=>setNewMd("pick")} className="bb b-bl" style={{padding:"7px 11px",fontSize:11}}><I n="plus" s={11}/>New</button>
            </div>
            <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid var(--border)"}}>
              {[["all",`All (${cnts.all})`],["draft",`Draft (${cnts.draft})`],["sent",`Sent (${cnts.sent})`],["overdue",`OD (${cnts.overdue})`],["paid",`Paid (${cnts.paid})`]].map(([v,l])=>(
                <button key={v} onClick={()=>setStF(v)} style={{flex:1,padding:"4px 2px",fontSize:8,fontWeight:700,background:stF===v?"rgba(59,130,246,.15)":"transparent",color:stF===v?"#63b3ed":"var(--text-dim)",borderRight:"1px solid var(--border)",transition:"all .13s"}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {filt.map(inv=>{
              const c=custs.find(x=>x.id===inv.custId);
              const calc=calcInv(inv.lineItems,inv.taxRate,inv.discount||0);
              const is=sel===inv.id;
              const sc=INV_SC[inv.status]||INV_SC.draft;
              return <div key={inv.id} className={`sl ${is?"on":""}`} onClick={()=>setSel(inv.id)} style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",background:is?"rgba(59,130,246,.06)":"transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span className="mn" style={{fontSize:10,color:is?"#63b3ed":"var(--text-dim)"}}>{inv.number}</span>
                  <span style={{padding:"2px 6px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:sc.bg,color:sc.c}}>{sc.label}</span>
                </div>
                <div style={{fontSize:12,color:is?"var(--text)":"var(--text-2)",fontWeight:600}}>{c?.name||"Unassigned"}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                  <div style={{fontSize:10,color:"var(--text-faint)"}}>Due {inv.dueDate}</div>
                  <div className="mn" style={{fontSize:12,color:"#22c55e"}}>{fmt(calc.total)}</div>
                </div>
              </div>;
            })}
            {filt.length===0&&<div style={{padding:"28px",textAlign:"center",color:"var(--text-ghost)",fontSize:12}}>No invoices</div>}
          </div>
        </div>

        {si?(
          <div className="spl-r">
            <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
              <div className="inv-detail-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}><span className="mn" style={{fontSize:16,color:"var(--text-2)"}}>{si.number}</span><Chip s={si.status} map={INV_SC}/></div>
                  <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>{custs.find(c=>c.id===si.custId)?.name||"Unassigned"} · Issued {si.issueDate} · Due {si.dueDate}{si.paidDate?` · Paid ${si.paidDate}`:""}</div>
                </div>
                <div className="act-bar" style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {si.status==="draft"&&<button onClick={()=>setStatus(si.id,"sent")} className="bb b-am" style={{padding:"5px 10px",fontSize:11}}><I n="send" s={11}/>Send</button>}
                  {si.status==="sent"&&<button onClick={()=>setStatus(si.id,"paid")} className="bb b-gr" style={{padding:"5px 10px",fontSize:11}}><I n="check" s={11}/>Mark Paid</button>}
                  {si.status==="sent"&&<button onClick={()=>setStatus(si.id,"overdue")} className="bb b-rd" style={{padding:"5px 9px",fontSize:11}}>Overdue</button>}
                  {si.status==="overdue"&&<button onClick={()=>setStatus(si.id,"paid")} className="bb b-gr" style={{padding:"5px 10px",fontSize:11}}><I n="check" s={11}/>Mark Paid</button>}
                  <button onClick={()=>dup(si)} className="bb b-gh" style={{padding:"5px 9px",fontSize:11}}><I n="copy" s={11}/>Dup</button>
                  <button onClick={()=>openEdit(si)} className="bb b-gh" style={{padding:"5px 9px",fontSize:11}}><I n="edit" s={11}/>Edit</button>
                  <button onClick={()=>setEmailMd(true)} className="bb b-bl" style={{padding:"5px 10px",fontSize:11}}><I n="mail" s={11}/>Email</button>
                  <button onClick={()=>exportInv(si,true)} className="bb b-gh" style={{padding:"5px 9px",fontSize:11}}>⎙ Print</button>
                  {si.status==="draft"&&<button onClick={()=>setStatus(si.id,"void")} className="bb b-rd" style={{padding:"5px 9px",fontSize:11}}>Void</button>}
                  <button onClick={()=>setPendingDel(si.id)} className="bb b-rd" style={{padding:"5px 8px",fontSize:11}}><I n="trash" s={11}/></button>
                </div>
              </div>
              <div className="inv-kpi-row" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{l:"Labor",v:fmt(siC.lab),c:"#f5a623"},{l:"Materials",v:fmt(siC.mat),c:"#6c8ebf"},{l:"Subtotal",v:fmt(siC.sub),c:"var(--text)"},...(siC.discountPct>0?[{l:`Disc ${siC.discountPct}%`,v:`−${fmt(siC.discAmt)}`,c:"#a78bfa"}]:[]),{l:`Tax ${si.taxRate}%`,v:fmt(siC.tax),c:"#14b8a6"},{l:"TOTAL",v:fmt(siC.total),c:"#22c55e",big:true},...(siC.depAmt>0?[{l:"Deposit",v:fmt(siC.depAmt),c:"#f59e0b"},{l:"Balance Due",v:fmt(effectiveBal),c:effectiveBal===0?"#22c55e":"#63b3ed",big:true}]:[])].map(k=>(
                  <div key={k.l} style={{background:"var(--bg-card)",border:`1px solid ${k.big?"rgba(34,197,94,.28)":"var(--border)"}`,borderRadius:8,padding:"6px 11px"}}>
                    <div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4}}>{k.l}</div>
                    <div className="mn" style={{fontSize:k.big?14:11,color:k.c,marginTop:2}}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
              {(()=>{
                const estItems=si.lineItems.filter(l=>l.section!=="changeorder");
                const coItems=si.lineItems.filter(l=>l.section==="changeorder");
                const labItems=estItems.filter(l=>!l.isMaterial);
                const matItems=estItems.filter(l=>l.isMaterial);
                const coLabItems=coItems.filter(l=>!l.isMaterial);
                const coMatItems=coItems.filter(l=>l.isMaterial);
                const renderSection=(title,items,color,qtyLabel)=>(
                  items.length>0&&<div style={{border:"1px solid var(--border)",borderRadius:11,overflow:"hidden",marginBottom:12}}>
                    <div style={{padding:"8px 14px",background:"var(--bg-sidebar)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontWeight:700,fontSize:11,color}}><I n={title==="Labor"||title==="CO Labor"?"wrench":"materials"} s={12}/> {title}</div>
                      <span className="mn" style={{fontSize:11,color}}>{fmt(items.reduce((s,l)=>s+l.qty*l.unitPrice,0))}</span>
                    </div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{background:"var(--bg-sidebar)"}}>{["#","Description",qtyLabel,"Rate","Total"].map(h=><th key={h} style={{padding:"6px 12px",textAlign:"left",fontSize:8,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {items.map((li,i)=>(
                          <tr key={li.id} className="rh" style={{borderTop:i>0?"1px solid var(--border)":"none"}}>
                            <td style={{padding:"7px 12px",color:"var(--text-dim)",fontSize:10}}>{i+1}</td>
                            <td style={{padding:"7px 12px",color:"var(--text-2)"}}>{li.description}</td>
                            <td className="mn" style={{padding:"7px 12px",color:"var(--text-muted)"}}>{li.qty}{qtyLabel==="Hours"?" hrs":""}</td>
                            <td className="mn" style={{padding:"7px 12px",color:"var(--text)"}}>{fmtD(li.unitPrice)}{qtyLabel==="Hours"?"/hr":""}</td>
                            <td className="mn" style={{padding:"7px 12px",color:"#22c55e",fontWeight:700}}>{fmtD(li.qty*li.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
                return <>
                  {(labItems.length>0||matItems.length>0)&&<div style={{marginBottom:4}}><div className="stl">Estimate</div></div>}
                  {renderSection("Labor",labItems,"#f5a623","Hours")}
                  {renderSection("Materials",matItems,"#6c8ebf","Qty")}
                  {coItems.length>0&&(<>
                    <div style={{marginTop:8,marginBottom:4,paddingTop:10,borderTop:"1px dashed var(--border-2)"}}><div className="stl" style={{color:"#a78bfa"}}>Change Orders</div></div>
                    {renderSection("CO Labor",coLabItems,"#a78bfa","Qty")}
                    {renderSection("CO Materials",coMatItems,"#8b5cf6","Qty")}
                    <div style={{background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:9,padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#a78bfa"}}>Change Orders Total</span>
                      <span className="mn" style={{fontSize:13,color:"#a78bfa"}}>{fmt(coItems.reduce(function(s,l){return s+l.qty*l.unitPrice;},0))}</span>
                    </div>
                  </>)}
                </>;
              })()}
              <div style={{border:"1px solid var(--border)",borderRadius:11,overflow:"hidden",marginBottom:12}}>
                <div style={{padding:"10px 15px",background:"var(--bg-sidebar)"}}>
                  <div style={{maxWidth:260,marginLeft:"auto"}}>
                    {[
                      {l:"Labor",v:fmt(siC.lab),c:"#f5a623"},
                      {l:"Materials (taxable)",v:fmt(siC.mat),c:"#6c8ebf"},
                      {l:"Subtotal",v:fmt(siC.sub),c:"var(--text)",bold:true},
                      ...(siC.discountPct>0?[{l:`Discount (${siC.discountPct}%)`,v:`−${fmt(siC.discAmt)}`,c:"#a78bfa"}]:[]),
                      ...(siC.discountPct>0?[{l:"After Discount",v:fmt(siC.discSub),c:"var(--text)",bold:true}]:[]),
                      {l:`Tax ${si.taxRate}% on materials`,v:fmt(siC.tax),c:"#14b8a6"},
                    ].map(r=>(
                      <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:r.bold?"var(--text)":"var(--text-muted)",fontWeight:r.bold?700:400}}>{r.l}</span>
                        <span className="mn" style={{fontSize:11,color:r.c}}>{r.v}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0"}}>
                      <span style={{fontWeight:800,fontSize:13}}>TOTAL</span>
                      <span className="mn" style={{fontSize:17,color:"#22c55e"}}>{fmt(siC.total)}</span>
                    </div>
                    {siC.depAmt>0&&(<>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderTop:"1px dashed var(--border-2)"}}>
                        <span style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>Deposit</span>
                        <span className="mn" style={{fontSize:11,color:"#f59e0b"}}>{fmt(siC.depAmt)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}>
                        <span style={{fontSize:12,fontWeight:800,color:effectiveBal===0?"#22c55e":"#63b3ed"}}>Balance Due</span>
                        <span className="mn" style={{fontSize:15,color:effectiveBal===0?"#22c55e":"#63b3ed"}}>{fmt(effectiveBal)}</span>
                      </div>
                    </>)}
                  </div>
                </div>
              </div>
              {si.notes&&<div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:9,padding:"11px 14px"}}><div className="stl">Notes</div><div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.7}}>{si.notes}</div></div>}
            </div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"var(--text-ghost)",gap:12}}>
            <I n="invoices" s={38}/><div style={{fontSize:14,fontWeight:600}}>Select an invoice</div>
            <button onClick={()=>setNewMd("pick")} className="bb b-bl" style={{padding:"8px 16px",fontSize:12,marginTop:4}}><I n="plus" s={13}/>New Invoice</button>
          </div>
        )}
      </div>

      {newMd==="pick"&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setNewMd(null)}>
          <div className="mo" style={{maxWidth:440,marginTop:120}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>New Invoice</div>
              <button onClick={()=>setNewMd(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:10}}>
              {[{id:"project",label:"From Project",sub:"Auto-populate labor & materials from a project",icon:"projects",c:"#3b82f6"},{id:"manual",label:"Manual",sub:"Start with a blank invoice",icon:"plus",c:"#22c55e"}].map(opt=>(
                <button key={opt.id} onClick={()=>opt.id==="manual"?createManual():setNewMd(opt.id)} style={{display:"flex",gap:12,alignItems:"center",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:11,padding:"13px 15px",textAlign:"left",transition:"all .15s",cursor:"pointer"}}>
                  <div style={{width:38,height:38,borderRadius:10,background:`${opt.c}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:opt.c}}><I n={opt.icon} s={17}/></div>
                  <div><div style={{fontWeight:700,fontSize:13,color:"var(--text-2)"}}>{opt.label}</div><div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>{opt.sub}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {newMd==="project"&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setNewMd(null)}>
          <div className="mo" style={{maxWidth:420,marginTop:120}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:16,fontWeight:800}}>Select Project</div>
              <button onClick={()=>setNewMd(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"18px 24px",display:"flex",flexDirection:"column",gap:12}}>
              <select className="inp" value={srcId} onChange={e=>setSrcId(e.target.value)}>
                <option value="">— Select —</option>
                {projs.map(p=><option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
              </select>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setNewMd(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={createFromProj} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="plus" s={13}/>Create Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {pendingDel!==null&&<ConfirmDeleteModal label="this invoice" onConfirm={()=>del(pendingDel)} onCancel={()=>setPendingDel(null)}/>}
      {emailMd&&si&&<EmailSendModal type="invoice" docNumber={si.number} customer={custs.find(c=>c.id===si.custId)} total={fmt(siC.total)} dueDate={si.dueDate} project={projs.find(p=>p.id===si.projId)?.name||""} company={company} onClose={()=>setEmailMd(false)} onSend={(to)=>{if(si.status==="draft"){setStatus(si.id,"sent");}showToast("Invoice emailed to "+to);}}/>}
    </>):(
      <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"var(--bg-sidebar)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setEditForm(null)} style={{color:"var(--text-dim)",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600}}><I n="arrow" s={15}/> Back</button>
              <div style={{width:1,height:18,background:"var(--border)"}}/>
              <div style={{fontSize:15,fontWeight:800}}>{editForm._id?"Edit Invoice":"New Invoice"}</div>
              {editForm._id&&<span className="mn" style={{fontSize:12,color:"var(--text-dim)"}}>{editForm.number}</span>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditForm(null)} className="bb b-gh" style={{padding:"7px 14px",fontSize:11}}>Cancel</button>
              <button onClick={saveEdit} className="bb b-bl" style={{padding:"7px 16px",fontSize:12}}><I n="check" s={13}/>{editForm._id?"Update":"Create"}</button>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
            <div className="full-form-grid" style={{display:"grid",gridTemplateColumns:"1fr 280px",maxWidth:1100,margin:"0 auto",minHeight:"100%"}}>
              <div style={{padding:"22px 28px",borderRight:"1px solid var(--border-2)"}}>
                <div className="g2" style={{marginBottom:14}}>
                  <div><label className="lbl">Customer</label>
                    <select className="inp" value={editForm.custId} onChange={e=>setEditForm(f=>({...f,custId:e.target.value}))}>
                      <option value="">— Select Customer —</option>
                      {custs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="lbl">Project (optional)</label>
                    <select className="inp" value={editForm.projId||""} onChange={e=>setEditForm(f=>({...f,projId:e.target.value||null}))}>
                      <option value="">— None —</option>
                      {projs.map(p=><option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="g3" style={{marginBottom:14}}>
                  <div><label className="lbl">Issue Date</label><input className="inp" type="date" value={editForm.issueDate} onChange={e=>setEditForm(f=>({...f,issueDate:e.target.value}))}/></div>
                  <div><label className="lbl">Due Date</label><input className="inp" type="date" value={editForm.dueDate} onChange={e=>setEditForm(f=>({...f,dueDate:e.target.value}))}/></div>
                  <div className="g2">
                    <div><label className="lbl">Tax %</label><input className="inp" type="number" step=".1" value={editForm.taxRate} onChange={e=>setEditForm(f=>({...f,taxRate:Number(e.target.value)||0}))}/></div>
                    <div><label className="lbl">Disc %</label><input className="inp" type="number" step=".5" value={editForm.discount} onChange={e=>setEditForm(f=>({...f,discount:Number(e.target.value)||0}))}/></div>
                  </div>
                </div>
                <div className="g3" style={{marginBottom:14}}>
                  <div><label className="lbl">Deposit</label>
                    <select className="inp" value={editForm.depositType||"none"} onChange={e=>setEditForm(f=>({...f,depositType:e.target.value,depositValue:e.target.value==="none"?0:f.depositValue}))}>
                      <option value="none">No Deposit</option>
                      <option value="percent">% of Total</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>
                  {editForm.depositType&&editForm.depositType!=="none"&&(<>
                    <div><label className="lbl">{editForm.depositType==="percent"?"Deposit %":"Deposit $"}</label><input className="inp" type="number" step={editForm.depositType==="percent"?".5":".01"} min="0" value={editForm.depositValue||0} onChange={e=>setEditForm(f=>({...f,depositValue:Number(e.target.value)||0}))} style={{borderColor:"#f59e0b"}}/></div>
                    <div><label className="lbl">Deposit Amount</label><div className="mn" style={{padding:"9px 13px",background:"var(--bg-card)",border:"1px solid #f59e0b",borderRadius:8,color:"#f59e0b",fontSize:13}}>{fmt(editFormC.depAmt)}</div></div>
                  </>)}
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <label className="lbl" style={{marginBottom:0}}>Line Items</label>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setInvPicker({type:"material",search:""})} className="bb b-bl" style={{padding:"4px 9px",fontSize:10,borderRadius:6}}><I n="materials" s={10}/>Material</button>
                    <button onClick={()=>setInvPicker({type:"labor",search:""})} className="bb b-am" style={{padding:"4px 9px",fontSize:10,borderRadius:6}}><I n="wrench" s={10}/>Labor</button>
                    <button onClick={()=>setInvPicker({type:"service",search:"",catF:"all"})} className="bb b-gh" style={{padding:"4px 9px",fontSize:10,borderRadius:6,borderColor:"#22c55e",color:"#22c55e"}}><I n="check" s={10}/>Service</button>
                    <button onClick={addEditLine} className="bb b-gh" style={{padding:"4px 9px",fontSize:10,borderRadius:6}}><I n="plus" s={10}/>Custom</button>
                  </div>
                </div>
                {invPicker&&(
                  <div style={{border:"1px solid var(--accent)",borderRadius:9,background:"var(--bg-sidebar)",marginBottom:10,overflow:"hidden",animation:"up .18s ease"}}>
                    <div style={{padding:"8px 10px",borderBottom:"1px solid var(--border-2)",display:"flex",gap:7,alignItems:"center"}}>
                      <div style={{position:"relative",flex:1}}>
                        <div style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={11}/></div>
                        <input className="inp" autoFocus value={invPicker.search} onChange={function(e){setInvPicker(function(p){return{...p,search:e.target.value};});}} placeholder={invPicker.type==="material"?"Search materials…":invPicker.type==="service"?"Search services…":"Search labor roles…"} style={{paddingLeft:24,fontSize:11,padding:"5px 7px 5px 24px"}}/>
                      </div>
                      <button onClick={()=>setInvPicker(null)} style={{color:"var(--text-dim)",flexShrink:0}}><I n="x" s={14}/></button>
                    </div>
                    <div style={{maxHeight:180,overflowY:"auto"}}>
                      {invPicker.type==="material"&&(function(){
                        var fMats=(mats||[]).filter(function(m){return !invPicker.search||m.name.toLowerCase().includes(invPicker.search.toLowerCase())||m.category.toLowerCase().includes(invPicker.search.toLowerCase())||m.supplier.toLowerCase().includes(invPicker.search.toLowerCase());});
                        return fMats.length===0
                          ?<div style={{padding:"14px",textAlign:"center",color:"var(--text-faint)",fontSize:11}}>No materials found</div>
                          :fMats.map(function(m){
                            var sp2=m.cost*(1+m.markup/100);
                            return <div key={m.id} onClick={function(){addInvMaterial(m);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s"}} className="rh">
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:11,fontWeight:600,color:"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                                <div style={{fontSize:9,color:"var(--text-faint)",marginTop:1}}><span style={{padding:"1px 5px",borderRadius:6,background:(CAT_C[m.category]||"#4a566e")+"18",color:CAT_C[m.category]||"var(--text-muted)",fontSize:8,fontWeight:700}}>{m.category}</span> · {m.supplier} · {m.stock} {m.unit} in stock</div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                                <div className="mn" style={{fontSize:11,color:"#22c55e"}}>{fmtD(sp2)}<span style={{fontSize:8,color:"var(--text-faint)"}}>/{m.unit}</span></div>
                                <div style={{fontSize:8,color:"var(--text-dim)"}}>cost {fmtD(m.cost)} +{m.markup}%</div>
                              </div>
                            </div>;
                          });
                      })()}
                      {invPicker.type==="service"&&(function(){
                        var fSvcs=(svcs||[]).filter(function(s){
                          return (!invPicker.search||s.name.toLowerCase().includes(invPicker.search.toLowerCase())||s.category.toLowerCase().includes(invPicker.search.toLowerCase()))&&
                            (invPicker.catF==="all"||s.category===invPicker.catF);
                        });
                        return <>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"6px 12px",borderBottom:"1px solid var(--border)"}}>
                            {["all","General","Plumbing","Electrical","Framing","Painting","Flooring","Roofing","HVAC","Concrete","Landscaping","Cleanup"].map(function(c){
                              return <button key={c} onClick={function(){setInvPicker(function(p){return{...p,catF:c};});}} style={{padding:"2px 7px",borderRadius:10,fontSize:9,fontWeight:700,border:`1px solid ${invPicker.catF===c?"var(--accent)":"var(--border)"}`,background:invPicker.catF===c?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.14)":"transparent",color:invPicker.catF===c?"var(--accent-light)":"var(--text-dim)"}}>{c==="all"?"All":c}</button>;
                            })}
                          </div>
                          {fSvcs.length===0
                            ?<div style={{padding:"14px",textAlign:"center",color:"var(--text-faint)",fontSize:11}}>No services found</div>
                            :fSvcs.map(function(s){
                              return <div key={s.id} onClick={function(){addInvService(s);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s"}} className="rh">
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                                  <div style={{fontSize:8,color:"var(--text-faint)",marginTop:1}}><span style={{padding:"1px 5px",borderRadius:6,fontSize:8,fontWeight:700,background:`${SVC_CAT_C[s.category]||"#4a566e"}18`,color:SVC_CAT_C[s.category]||"var(--text-dim)"}}>{s.category}</span> · {(s.lineItems||[]).length>0?"Package":s.isMaterial?"Material":"Labor"}</div>
                                </div>
                                <div style={{textAlign:"right",flexShrink:0}}>
                                  {(s.lineItems||[]).length>0
                                    ?<><div style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:"rgba(20,184,166,.12)",color:"#14b8a6"}}>{s.lineItems.length} items</div><div className="mn" style={{fontSize:10,color:"#22c55e",marginTop:1}}>{fmtD(s.lineItems.reduce(function(t,li){return t+li.qty*li.unitPrice;},0))}</div></>
                                    :<div className="mn" style={{fontSize:11,color:"#22c55e"}}>{fmtD(s.unitPrice)}<span style={{fontSize:8,color:"var(--text-faint)"}}>/{s.unit}</span></div>
                                  }
                                </div>
                              </div>;
                            })
                          }
                        </>;
                      })()}
                      {invPicker.type==="labor"&&(function(){
                        var fRoles=(roles||[]).filter(function(r){return !MGMT_ROLES.has(r.title)&&(!invPicker.search||r.title.toLowerCase().includes(invPicker.search.toLowerCase()));});
                        return fRoles.length===0
                          ?<div style={{padding:"14px",textAlign:"center",color:"var(--text-faint)",fontSize:11}}>No labor roles found</div>
                          :fRoles.map(function(r){
                            var b=calcBurden(r);var tc=ROLE_C[r.title]||"#4a566e";
                            return <div key={r.id} onClick={function(){addInvLabor(r);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s"}} className="rh">
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
                  var labLines=editForm.lineItems.filter(l=>!l.isMaterial);
                  var matLines=editForm.lineItems.filter(l=>l.isMaterial);
                  var renderSec=function(title,items,color,qtyLabel,icon){
                    if(items.length===0) return null;
                    return <div style={{border:"1px solid var(--border-2)",borderRadius:9,overflow:"hidden",marginBottom:10}}>
                      <div style={{padding:"6px 10px",background:"var(--bg-card)",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontWeight:700,fontSize:10,color:color,display:"flex",alignItems:"center",gap:5}}><I n={icon} s={11}/>{title}</span>
                        <span className="mn" style={{fontSize:10,color:color}}>{fmt(items.reduce(function(s,l){return s+l.qty*l.unitPrice;},0))}</span>
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead><tr style={{background:"var(--bg-card)"}}>{["Description",qtyLabel,"Rate","Total","Type",""].map(function(h){return <th key={h} style={{padding:"5px 7px",textAlign:"left",fontSize:8,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",borderBottom:"1px solid var(--border-2)"}}>{h}</th>;})}</tr></thead>
                        <tbody>
                          {items.map(function(li,i){return (
                            <tr key={li.id} style={{borderTop:i>0?"1px solid var(--border)":"none"}}>
                              <td style={{padding:"4px 6px"}}><input className="inp" value={li.description} onChange={function(e){updEditLine(li.id,"description",e.target.value);}} placeholder="Description" style={{fontSize:11,padding:"5px 7px"}}/></td>
                              <td style={{padding:"4px 6px"}}><input className="inp" type="number" value={li.qty} onChange={function(e){updEditLine(li.id,"qty",e.target.value);}} style={{fontSize:11,padding:"5px 5px",width:56}}/></td>
                              <td style={{padding:"4px 6px"}}><input className="inp" type="number" step=".01" value={li.unitPrice} onChange={function(e){updEditLine(li.id,"unitPrice",e.target.value);}} style={{fontSize:11,padding:"5px 5px",width:82}}/></td>
                              <td className="mn" style={{padding:"4px 6px",color:"#22c55e",fontSize:11,whiteSpace:"nowrap"}}>{fmtD(li.qty*li.unitPrice)}</td>
                              <td style={{padding:"4px 6px"}}><select className="inp" value={li.isMaterial?"m":"l"} onChange={function(e){updEditLine(li.id,"isMaterial",e.target.value==="m");}} style={{fontSize:10,padding:"4px",width:62}}><option value="l">Labor</option><option value="m">Material</option></select></td>
                              <td style={{padding:"4px 2px",width:28}}><button onClick={function(){delEditLine(li.id);}} style={{color:"#ef4444",opacity:.6,display:"flex",alignItems:"center",justifyContent:"center",padding:2}}><I n="x" s={13}/></button></td>
                            </tr>
                          );})}
                        </tbody>
                      </table>
                    </div>;
                  };
                  return <>{renderSec("Labor",labLines,"#f5a623","Hrs","wrench")}{renderSec("Materials",matLines,"#6c8ebf","Qty","materials")}</>;
                })()}

                {editForm.lineItems.length===0&&<div style={{padding:20,textAlign:"center",color:"var(--text-faint)",fontSize:12,border:"1px dashed var(--border-2)",borderRadius:9}}>No line items yet. Add from Materials, Labor, or Custom above.</div>}

                <div style={{marginBottom:12,marginTop:10}}><label className="lbl">Notes</label><textarea className="inp" value={editForm.notes||""} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} rows={2} style={{resize:"vertical"}}/></div>

                <div className="mob-only" style={{display:"flex",gap:9,marginBottom:16}}>
                  <button onClick={()=>setEditForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                  <button onClick={saveEdit} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{editForm._id?"Update":"Create"}</button>
                </div>
              </div>

              <div style={{padding:"18px 16px",background:"var(--bg-sidebar)",overflowY:"auto",borderLeft:"1px solid var(--border-2)"}}>
                <div className="stl">Preview</div>
                <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:9,overflow:"hidden"}}>
                  {[
                    {l:"Labor",v:fmt(editFormC.lab),c:"#f5a623"},
                    {l:"Materials",v:fmt(editFormC.mat),c:"#6c8ebf",note:"taxable"},
                    {l:"Subtotal",v:fmt(editFormC.sub),c:"var(--text)",bold:true},
                    ...(editFormC.discountPct>0?[{l:"Discount ("+editFormC.discountPct+"%)",v:"-"+fmt(editFormC.discAmt),c:"#a78bfa",disc:true}]:[]),
                    ...(editFormC.discountPct>0?[{l:"After Discount",v:fmt(editFormC.discSub),c:"var(--text)",bold:true}]:[]),
                    {l:"Tax "+editForm.taxRate+"%",v:fmt(editFormC.tax),c:"#14b8a6"},
                  ].map(function(r){return (
                    <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",borderBottom:"1px solid var(--border)",background:r.disc?"rgba(167,139,250,.04)":"transparent"}}>
                      <div><span style={{fontSize:10,color:r.disc?"#a78bfa":r.bold?"var(--text)":"var(--text-muted)",fontWeight:r.bold||r.disc?700:400}}>{r.l}</span>{r.note&&<span style={{fontSize:8,color:"var(--text-faint)",marginLeft:4}}>({r.note})</span>}</div>
                      <span className="mn" style={{fontSize:10,color:r.c}}>{r.v}</span>
                    </div>
                  );})}
                  <div style={{padding:"10px 11px",background:"rgba(34,197,94,.05)"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:800,fontSize:12}}>TOTAL</span><span className="mn" style={{fontSize:17,color:"#22c55e"}}>{fmt(editFormC.total)}</span></div>
                  </div>
                  {editFormC.depAmt>0&&(<>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",borderTop:"1px solid var(--border)",background:"rgba(245,158,11,.04)"}}>
                      <span style={{fontSize:10,color:"#f59e0b",fontWeight:700}}>Deposit{editForm.depositType==="percent"?(" ("+editForm.depositValue+"%)"):""}</span>
                      <span className="mn" style={{fontSize:12,color:"#f59e0b"}}>{fmt(editFormC.depAmt)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",background:"rgba(99,179,237,.04)"}}>
                      <span style={{fontSize:10,color:"#63b3ed",fontWeight:700}}>Balance Due</span>
                      <span className="mn" style={{fontSize:12,color:"#63b3ed"}}>{fmt(editFormC.balanceDue)}</span>
                    </div>
                  </>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
