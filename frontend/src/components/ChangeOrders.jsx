import { useState, useMemo } from 'react';
import { CO_SC } from '../constants';
import { fmt, tod, nxtNum } from '../utils/calculations';
import { I } from './shared/Icons';
import { KpiCard, Chip, ES } from './shared/ui';

export default function ChangeOrders({cos,setCos,projs,setProjs,custs,invs,setInvs,showToast,setTab,db}) {
  const [form,setForm]=useState(null);
  const [stF,setStF]=useState("all");

  const filt=useMemo(()=>cos.filter(c=>stF==="all"||c.status===stF),[cos,stF]);
  const totApproved=cos.filter(c=>c.status==="approved").reduce((s,c)=>s+c.totalAmt,0);
  const totPending=cos.filter(c=>c.status==="pending").reduce((s,c)=>s+c.totalAmt,0);

  const blank={projId:"",description:"",reason:"Customer request",laborAmt:"",materialAmt:"",notes:"",status:"pending"};
  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=c=>setForm({...c,_id:c.id,laborAmt:String(c.laborAmt),materialAmt:String(c.materialAmt)});

  const save=()=>{
    if(!form.projId){showToast("Select a project","error");return;}
    if(!form.description.trim()){showToast("Description required","error");return;}
    const lab=Number(form.laborAmt)||0;const mat=Number(form.materialAmt)||0;
    const p=projs.find(x=>x.id===form.projId);
    const data={...form,laborAmt:lab,materialAmt:mat,totalAmt:lab+mat,custId:p?.custId||null,date:form.date||tod()};
    if(form._id){var ch={...data};delete ch._id;db.cos.update(form._id,ch);showToast("Updated");}
    else{const id=nxtNum(cos,"CO");db.cos.create({...data,id,number:id,approvedBy:null,approvedDate:null});showToast(id+" created");}
    setForm(null);
  };

  const approve=co=>{
    db.cos.update(co.id,{status:"approved",approvedBy:"Owner",approvedDate:tod()});
    var proj=projs.find(p=>p.id===co.projId);
    if(proj){
      db.projs.update(co.projId,{contractValue:proj.contractValue+co.totalAmt,budgetLabor:proj.budgetLabor+co.laborAmt,budgetMaterials:proj.budgetMaterials+co.materialAmt});
    }
    showToast("Approved — project budget updated");
  };
  const decline=id=>{db.cos.update(id,{status:"declined"});showToast("Declined");};
  const del=id=>{db.cos.remove(id);showToast("Removed");};

  const cnts={all:cos.length,pending:cos.filter(c=>c.status==="pending").length,approved:cos.filter(c=>c.status==="approved").length,declined:cos.filter(c=>c.status==="declined").length};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="g4">
        {[{l:"Total COs",v:cos.length,c:"#63b3ed"},{l:"Pending",v:fmt(totPending),c:"#f5a623"},{l:"Approved",v:fmt(totApproved),c:"#22c55e"},{l:"Net Contract Impact",v:fmt(totApproved),c:"#3b82f6"}].map(k=>(<KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>))}
      </div>
      <div style={{display:"flex",gap:9,alignItems:"center"}}>
        <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid var(--border)",flex:1,maxWidth:480}}>
          {[["all",`All (${cnts.all})`],["pending",`Pending (${cnts.pending})`],["approved",`Approved (${cnts.approved})`],["declined",`Declined (${cnts.declined})`]].map(([v,l])=>(
            <button key={v} onClick={()=>setStF(v)} style={{flex:1,padding:"6px 4px",fontSize:9,fontWeight:700,background:stF===v?"rgba(59,130,246,.15)":"transparent",color:stF===v?"#63b3ed":"var(--text-dim)",borderRight:"1px solid var(--border)"}}>{l}</button>
          ))}
        </div>
        <button onClick={openNew} className="bb b-bl" style={{padding:"8px 14px",fontSize:12}}><I n="plus" s={13}/>New CO</button>
      </div>
      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"var(--bg-sidebar)"}}>{["CO #","Project","Customer","Description","Reason","Labor","Material","Total","Status",""].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filt.map((co,i)=>{
              const p=projs.find(x=>x.id===co.projId);const c=custs.find(x=>x.id===co.custId);
              return <tr key={co.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td className="mn" style={{padding:"8px 12px",color:"var(--text-muted)",fontSize:10}}>{co.number}</td>
                <td style={{padding:"8px 12px",color:"var(--text-2)",fontWeight:600,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p?.name||"—"}</td>
                <td style={{padding:"8px 12px",color:"var(--text-muted)"}}>{c?.name||"—"}</td>
                <td style={{padding:"8px 12px",color:"var(--text)",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.description}</td>
                <td style={{padding:"8px 12px",color:"var(--text-dim)",fontSize:10}}>{co.reason}</td>
                <td className="mn" style={{padding:"8px 12px",color:"#f5a623"}}>{fmt(co.laborAmt)}</td>
                <td className="mn" style={{padding:"8px 12px",color:"#6c8ebf"}}>{fmt(co.materialAmt)}</td>
                <td className="mn" style={{padding:"8px 12px",color:"#22c55e",fontWeight:700}}>{fmt(co.totalAmt)}</td>
                <td style={{padding:"8px 12px"}}><Chip s={co.status} map={CO_SC}/></td>
                <td style={{padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:4}}>
                    {co.status==="pending"&&<button onClick={()=>approve(co)} style={{color:"#22c55e",opacity:.8}} className="rh"><I n="check" s={13}/></button>}
                    {co.status==="pending"&&<button onClick={()=>decline(co.id)} style={{color:"#ef4444",opacity:.6}} className="rh"><I n="x" s={13}/></button>}
                    <button onClick={()=>openEdit(co)} style={{color:"var(--text-dim)",opacity:.7}} className="rh"><I n="edit" s={13}/></button>
                    <button onClick={()=>del(co.id)} style={{color:"#ef4444",opacity:.5}} className="rh"><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
        {filt.length===0&&<ES icon="changeorder" text="No change orders found."/>}
      </div>
      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:560,marginTop:50}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Change Order":"New Change Order"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Project *</label>
                <select className="inp" value={form.projId} onChange={e=>setForm(f=>({...f,projId:e.target.value}))}>
                  <option value="">— Select —</option>
                  {projs.filter(p=>p.status==="active").map(p=><option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
              <div><label className="lbl">Description *</label><input className="inp" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Add under-cabinet lighting"/></div>
              <div><label className="lbl">Reason</label>
                <select className="inp" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}>
                  {["Customer request","Code requirement","Design change","Unforeseen condition","Scope clarification","Value engineering"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">Labor Amount $</label><input className="inp" type="number" value={form.laborAmt} onChange={e=>setForm(f=>({...f,laborAmt:e.target.value}))} placeholder="0"/></div>
                <div><label className="lbl">Material Amount $</label><input className="inp" type="number" value={form.materialAmt} onChange={e=>setForm(f=>({...f,materialAmt:e.target.value}))} placeholder="0"/></div>
              </div>
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:700,fontSize:12}}>CO Total</span>
                <span className="mn" style={{fontSize:16,color:"#22c55e"}}>{fmt((Number(form.laborAmt)||0)+(Number(form.materialAmt)||0))}</span>
              </div>
              <div><label className="lbl">Notes</label><textarea className="inp" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{resize:"vertical"}}/></div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Create"} CO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
