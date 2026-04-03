import React, { useState } from 'react';
import { ROLE_C, MGMT_ROLES } from '../constants';
import { fmt, pct, uid, tod, getBurdenedRate } from '../utils/calculations';
import { ES, ini, avC, ConfirmDeleteModal } from './shared/ui';
import I from './shared/Icons';

export default function Subs({subs,setSubs,hrs,setHrs,projs,roles,showToast,db,auth}) {
  const [sel,setSel]=useState(subs[0]?.id||null);
  const [form,setForm]=useState(null);
  const [hrForm,setHrForm]=useState(null);
  const [pendingDel,setPendingDel]=useState(null);
  const [pendingHrDel,setPendingHrDel]=useState(null);
  const se=subs.find(e=>e.id===sel)||null;
  const eHrs=se?hrs.filter(h=>h.subId===se.id):[];
  const totHrs=eHrs.reduce((s,h)=>s+h.hours,0);
  const totBilled=eHrs.reduce((s,h)=>s+h.hours*se.billableRate,0);
  const totCost=eHrs.reduce((s,h)=>s+h.hours*getBurdenedRate(roles,se.role,se.hourlyWage),0);
  const laborMargin=totBilled>0?pct(totBilled-totCost,totBilled):0;

  const blank={name:"",company:"",role:"Carpenter",hourlyWage:"",billableRate:"",status:"active",phone:"",email:"",employeeType:"1099",hireDate:tod(),emergencyContact:"",certifications:""};
  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=e=>setForm({...e,_id:e.id,hourlyWage:String(e.hourlyWage),billableRate:String(e.billableRate)});
  const save=()=>{
    if(!form.name.trim()){showToast("Name required","error");return;}
    const n=v=>Number(v)||0;
    const data={...form,hourlyWage:n(form.hourlyWage),billableRate:n(form.billableRate)};
    if(form._id){var ch={...data};delete ch._id;db.subs.update(form._id,ch);showToast("Updated");}
    else{db.subs.create({...data,id:uid()});showToast("Added");}
    setForm(null);
  };
  const del=id=>{db.subs.remove(id);if(sel===id)setSel(null);showToast("Crew member removed");setPendingDel(null);};

  const blankHr={projId:projs[0]?.id||"",date:tod(),hours:"8",desc:"",approved:false};
  const logHrs=()=>{
    if(!hrForm.projId||!hrForm.hours){showToast("Project and hours required","error");return;}
    if(hrForm._id){
      const ch={projId:hrForm.projId,date:hrForm.date,hours:Number(hrForm.hours)||0,desc:hrForm.desc};
      db.hrs.update(hrForm._id,ch);showToast("Hours updated");
    } else {
      db.hrs.create({...hrForm,id:uid(),subId:sel,hours:Number(hrForm.hours)||0});showToast("Hours logged");
    }
    setHrForm(null);
  };

  const formPreview=hrForm&&se?{billed:(Number(hrForm.hours)||0)*se.billableRate,cost:(Number(hrForm.hours)||0)*getBurdenedRate(roles,se.role,se.hourlyWage)}:{billed:0,cost:0};

  const canApprove = auth && ["Owner","Admin","Foreman"].includes(auth.role);
  const openEditHr=h=>setHrForm({...h,_id:h.id,hours:String(h.hours)});
  const delHr=id=>{db.hrs.remove(id);showToast("Hour log removed");setPendingHrDel(null);};
  const toggleApprove=(hId,current)=>{
    if(!canApprove) return;
    db.hrs.update(hId,{approved:!current});
    showToast(!current?"Hours approved":"Approval revoked");
  };

  return (
    <div className="spl">
      <div className="spl-l">
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{fontSize:10,color:"var(--text-dim)",fontWeight:700}}>{subs.length} CREW MEMBERS</div>
          <button onClick={openNew} className="bb b-bl" style={{padding:"7px 11px",fontSize:11}}><I n="plus" s={11}/>Add</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {subs.map(e=>{
            const is=sel===e.id;
            const eH=hrs.filter(h=>h.subId===e.id);
            const totH=eH.reduce((s,h)=>s+h.hours,0);
            const tc=ROLE_C[e.role]||"#4a566e";
            return <div key={e.id} className={`sl ${is?"on":""}`} onClick={()=>setSel(e.id)} style={{padding:"11px 12px",borderBottom:"1px solid var(--border)",background:is?"rgba(59,130,246,.06)":"transparent"}}>
              <div style={{display:"flex",gap:9,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:10,background:avC(e.id),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>{ini(e.name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:is?"var(--text)":"var(--text-2)"}}>{e.name}</div>
                  <div style={{fontSize:9,color:"var(--text-faint)",marginTop:1}}>{e.company||"Independent"}</div>
                  <div style={{display:"flex",gap:5,marginTop:2,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:6,background:e.employeeType==="W2"?"rgba(34,197,94,.1)":e.employeeType==="sub_company"?"rgba(167,139,250,.1)":"rgba(59,130,246,.1)",color:e.employeeType==="W2"?"#22c55e":e.employeeType==="sub_company"?"#a78bfa":"#3b82f6"}}>{e.employeeType==="W2"?"W-2":e.employeeType==="sub_company"?"Sub":"1099"}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:`${tc}18`,color:tc}}>{e.role}</span>
                    <span style={{fontSize:9,color:"var(--text-faint)"}}>{totH}h</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span className="mn" style={{fontSize:10,color:"var(--text-dim)"}}>Wage ${e.hourlyWage}/hr</span>
                    <span className="mn" style={{fontSize:10,color:"#22c55e"}}>Bill ${e.billableRate}/hr</span>
                  </div>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>

      {se?(
        <div className="spl-r">
          <div style={{padding:"15px 20px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
              <div style={{display:"flex",gap:11,alignItems:"center"}}>
                <div style={{width:46,height:46,borderRadius:13,background:avC(se.id),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17}}>{ini(se.name)}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:18,letterSpacing:-.3}}>{se.name}</div>
                  {se.company&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:1}}>{se.company}</div>}
                  <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:se.employeeType==="W2"?"rgba(34,197,94,.1)":se.employeeType==="sub_company"?"rgba(167,139,250,.1)":"rgba(59,130,246,.1)",color:se.employeeType==="W2"?"#22c55e":se.employeeType==="sub_company"?"#a78bfa":"#3b82f6"}}>{se.employeeType==="W2"?"W-2":se.employeeType==="sub_company"?"Sub Co":"1099"}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,background:`${ROLE_C[se.role]||"#4a566e"}18`,color:ROLE_C[se.role]||"var(--text-muted)"}}>{se.role}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:se.status==="active"?"rgba(34,197,94,.1)":se.status==="terminated"?"rgba(239,68,68,.1)":"rgba(245,166,35,.1)",color:se.status==="active"?"#22c55e":se.status==="terminated"?"#ef4444":"#f5a623"}}>{se.status}</span>
                  </div>
                </div>
              </div>
              <div className="act-bar" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>setHrForm({...blankHr})} className="bb b-am" style={{padding:"6px 11px",fontSize:11}}><I n="clock" s={11}/>Log Hours</button>
                <button onClick={()=>openEdit(se)} className="bb b-gh" style={{padding:"6px 10px",fontSize:11}}><I n="edit" s={11}/></button>
                <button onClick={()=>setPendingDel(se.id)} className="bb b-rd" style={{padding:"6px 10px",fontSize:11}}><I n="trash" s={11}/></button>
              </div>
            </div>
            {(se.phone||se.email||se.hireDate||se.certifications||se.emergencyContact)&&(
              <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:10,fontSize:10,color:"var(--text-dim)"}}>
                {se.phone&&<span><I n="phone" s={10}/> {se.phone}</span>}
                {se.email&&<span><I n="mail" s={10}/> {se.email}</span>}
                {se.hireDate&&<span>Hired: {se.hireDate}</span>}
                {se.emergencyContact&&<span>Emergency: {se.emergencyContact}</span>}
              </div>
            )}
            {se.certifications&&<div style={{marginBottom:10,display:"flex",gap:5,flexWrap:"wrap"}}>{se.certifications.split(",").map(function(c,i){return <span key={i} style={{fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:6,background:"rgba(20,184,166,.08)",color:"#14b8a6",border:"1px solid rgba(20,184,166,.15)"}}>{c.trim()}</span>;})}</div>}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{l:"Wage",v:`$${se.hourlyWage}/hr`,c:"#f5a623"},{l:"Billable Rate",v:`$${se.billableRate}/hr`,c:"#3b82f6"},{l:"True Cost",v:`$${getBurdenedRate(roles,se.role,se.hourlyWage).toFixed(2)}/hr`,c:"#ef4444"},{l:"Total Hours",v:`${totHrs}h`,c:"#63b3ed"},{l:"Total Billed",v:fmt(totBilled),c:"#22c55e"},{l:"True Cost Total",v:fmt(totCost),c:"#ef4444"},{l:"Labor Margin",v:`${laborMargin}%`,c:laborMargin>=30?"#22c55e":"#f5a623"}].map(k=>(
                <div key={k.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 11px"}}>
                  <div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4}}>{k.l}</div>
                  <div className="mn" style={{fontSize:12,color:k.c,marginTop:2}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
            <div className="stl">Hour Log ({eHrs.length} entries)</div>
            {eHrs.length===0?<ES icon="clock" text="No hours logged yet."/>:(
              <div style={{border:"1px solid var(--border)",borderRadius:11,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{background:"var(--bg-sidebar)"}}>{[...["Date","Project","Hours","Description","Billed","True Cost","Approved"],...(canApprove?["Actions"]:[])].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {eHrs.sort((a,b)=>b.date.localeCompare(a.date)).map((h,i)=>{
                      const p=projs.find(x=>x.id===h.projId);
                      const billed=h.hours*se.billableRate;
                      const cost=h.hours*getBurdenedRate(roles,se.role,se.hourlyWage);
                      return <tr key={h.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                        <td className="mn" style={{padding:"7px 12px",color:"var(--text-muted)",fontSize:10}}>{h.date}</td>
                        <td style={{padding:"7px 12px",color:"var(--text-2)",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p?.name||h.projId}</td>
                        <td className="mn" style={{padding:"7px 12px",color:"#63b3ed"}}>{h.hours}h</td>
                        <td style={{padding:"7px 12px",color:"var(--text-muted)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.desc}</td>
                        <td className="mn" style={{padding:"7px 12px",color:"#22c55e"}}>{fmt(billed)}</td>
                        <td className="mn" style={{padding:"7px 12px",color:"#ef4444"}}>{fmt(cost)}</td>
                        <td style={{padding:"7px 12px"}}>{canApprove?(
                          <button onClick={()=>toggleApprove(h.id,h.approved)} style={{padding:"2px 9px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:h.approved?"rgba(34,197,94,.1)":"rgba(245,166,35,.08)",color:h.approved?"#22c55e":"#f5a623",border:h.approved?"1px solid rgba(34,197,94,.25)":"1px solid rgba(245,166,35,.2)",cursor:"pointer",transition:"all .15s"}}>{h.approved?"Approved":"Approve"}</button>
                        ):(
                          <span style={{padding:"2px 7px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:h.approved?"rgba(34,197,94,.1)":"rgba(245,166,35,.08)",color:h.approved?"#22c55e":"#f5a623"}}>{h.approved?"Approved":"Pending"}</span>
                        )}</td>
                        {canApprove&&<td style={{padding:"7px 12px",whiteSpace:"nowrap"}}>
                          <button onClick={()=>openEditHr(h)} style={{marginRight:5,padding:"2px 8px",borderRadius:8,fontSize:9,fontWeight:700,background:"rgba(99,179,237,.1)",color:"#63b3ed",border:"1px solid rgba(99,179,237,.25)",cursor:"pointer"}}>Edit</button>
                          <button onClick={()=>setPendingHrDel(h.id)} style={{padding:"2px 8px",borderRadius:8,fontSize:9,fontWeight:700,background:"rgba(239,68,68,.08)",color:"#ef4444",border:"1px solid rgba(239,68,68,.2)",cursor:"pointer"}}>Del</button>
                        </td>}
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"var(--text-ghost)",gap:12}}>
          <I n="employees" s={40}/><div style={{fontSize:14,fontWeight:600}}>Select a crew member</div>
        </div>
      )}

      {pendingDel!==null&&<ConfirmDeleteModal label="this crew member" onConfirm={()=>del(pendingDel)} onCancel={()=>setPendingDel(null)}/>}
      {pendingHrDel!==null&&<ConfirmDeleteModal label="this hour log" onConfirm={()=>delHr(pendingHrDel)} onCancel={()=>setPendingHrDel(null)}/>}

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:520,marginTop:40}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Crew Member":"Add Crew Member"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13,maxHeight:"78vh",overflowY:"auto"}}>
              <div className="g2">
                <div><label className="lbl">Full Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="John Smith"/></div>
                <div><label className="lbl">Company</label><input className="inp" value={form.company||""} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="ABC Contracting LLC"/></div>
              </div>
              <div className="g3">
                <div><label className="lbl">Type</label>
                  <select className="inp" value={form.employeeType||"1099"} onChange={e=>{var t=e.target.value;var filtered=roles.filter(function(r){return t==="W2"?MGMT_ROLES.has(r.title):!MGMT_ROLES.has(r.title);});setForm(f=>({...f,employeeType:t,role:filtered[0]?.title||f.role}));}}>
                    <option value="W2">W-2 Employee</option>
                    <option value="1099">1099 Contractor</option>
                    <option value="sub_company">Sub Company</option>
                  </select>
                </div>
                <div><label className="lbl">{form.employeeType==="W2"?"Position":"Trade / Role"}</label>
                  <select className="inp" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                    {roles.filter(function(r){return form.employeeType==="W2"?MGMT_ROLES.has(r.title):!MGMT_ROLES.has(r.title);}).map(r=><option key={r.id} value={r.title}>{r.title}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Status</label>
                  <select className="inp" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div className="g2">
                <div><label className="lbl">Hourly Wage $</label><input className="inp" type="number" step=".5" value={form.hourlyWage} onChange={e=>setForm(f=>({...f,hourlyWage:e.target.value}))}/></div>
                <div><label className="lbl">Billable Rate $</label><input className="inp" type="number" step=".5" value={form.billableRate} onChange={e=>setForm(f=>({...f,billableRate:e.target.value}))}/></div>
              </div>
              <div style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.15)",borderRadius:8,padding:"9px 12px",fontSize:11,color:"var(--text-muted)"}}>
                {(()=>{const rObj=roles.find(r=>r.title===form.role);const bm=rObj?(rObj.payrollPct+rObj.benefitsPct):28;const br=getBurdenedRate(roles,form.role,Number(form.hourlyWage)||0);return <>
                  Fully Burdened Rate (wage + {bm.toFixed(1)}%): <span className="mn" style={{color:"#ef4444",fontSize:12}}>${br.toFixed(2)}/hr</span>
                  &nbsp;·&nbsp; Margin: <span className="mn" style={{color:"#22c55e",fontSize:12}}>{form.billableRate&&form.hourlyWage?`${pct((Number(form.billableRate)||0)-br,Number(form.billableRate)||0)}%`:"—"}</span>
                  {rObj&&<span style={{marginLeft:8,fontSize:9,color:"var(--text-dim)"}}>(Payroll {rObj.payrollPct}% + Benefits {rObj.benefitsPct}%)</span>}
                </>;})()}
              </div>
              <div className="g2">
                <div><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000"/></div>
                <div><label className="lbl">Email</label><input className="inp" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="john@company.com"/></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Hire Date</label><input className="inp" type="date" value={form.hireDate||""} onChange={e=>setForm(f=>({...f,hireDate:e.target.value}))}/></div>
                <div><label className="lbl">Emergency Contact</label><input className="inp" value={form.emergencyContact||""} onChange={e=>setForm(f=>({...f,emergencyContact:e.target.value}))} placeholder="Name — (555) 000-0000"/></div>
              </div>
              <div><label className="lbl">Certifications / Licenses</label><input className="inp" value={form.certifications||""} onChange={e=>setForm(f=>({...f,certifications:e.target.value}))} placeholder="OSHA 10, EPA Lead, Electrical License…"/></div>
              <div style={{display:"flex",gap:9,marginTop:4}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Add"} Crew Member</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hrForm&&se&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setHrForm(null)}>
          <div className="mo" style={{maxWidth:460,marginTop:50}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{hrForm._id?"Edit Hours":"Log Hours"} — {se.name}</div>
              <button onClick={()=>setHrForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Project *</label>
                <select className="inp" value={hrForm.projId} onChange={e=>setHrForm(h=>({...h,projId:e.target.value}))}>
                  {projs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">Date</label><input className="inp" type="date" value={hrForm.date} onChange={e=>setHrForm(h=>({...h,date:e.target.value}))}/></div>
                <div><label className="lbl">Hours *</label><input className="inp" type="number" step=".5" value={hrForm.hours} onChange={e=>setHrForm(h=>({...h,hours:e.target.value}))}/></div>
              </div>
              <div><label className="lbl">Description</label><input className="inp" value={hrForm.desc} onChange={e=>setHrForm(h=>({...h,desc:e.target.value}))} placeholder="Framing day 1…"/></div>
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 14px",display:"flex",gap:18}}>
                {[{l:"Billed",v:fmt(formPreview.billed),c:"#22c55e"},{l:"True Cost",v:fmt(formPreview.cost),c:"#ef4444"},{l:"Net",v:fmt(formPreview.billed-formPreview.cost),c:formPreview.billed>=formPreview.cost?"#22c55e":"#ef4444"}].map(k=>(
                  <div key={k.l}><div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase"}}>{k.l}</div><div className="mn" style={{fontSize:13,color:k.c,marginTop:2}}>{k.v}</div></div>
                ))}
              </div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setHrForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={logHrs} className="bb b-am" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="clock" s={13}/>{hrForm._id?"Update Hours":"Log Hours"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
