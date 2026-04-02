import React, { useState, useMemo } from 'react';
import { TAG_C, INV_SC, EST_SC, PRJ_SC } from '../constants';
import { calcInv, fmt, uid, tod } from '../utils/calculations';
import { Chip, ES, ini, avC, Pr } from './shared/ui';
import I from './shared/Icons';

export default function Customers({custs,setCusts,invs,ests,projs,showToast,db}) {
  const [sel,  setSel]   = useState(custs[0]?.id||null);
  const [srch, setSrch]  = useState("");
  const [tagF, setTagF]  = useState("All");
  const [form, setForm]  = useState(null); // null=closed
  const [dtab, setDtab]  = useState("overview");

  const TAGS=["All","VIP","Repeat","Hot Lead","Investor","New","Referral Source"];
  const filt=useMemo(()=>custs.filter(c=>{
    const ms=!srch||c.name.toLowerCase().includes(srch.toLowerCase())||c.email.toLowerCase().includes(srch.toLowerCase())||c.phone.includes(srch);
    return ms&&(tagF==="All"||c.tags.includes(tagF));
  }),[custs,srch,tagF]);

  const sc=custs.find(c=>c.id===sel)||null;
  const cInvs=sc?invs.filter(i=>i.custId===sc.id):[];
  const cEsts=sc?ests.filter(e=>e.custId===sc.id):[];
  const cProj=sc?projs.filter(p=>p.custId===sc.id):[];
  const billed=cInvs.reduce((s,i)=>s+calcInv(i.lineItems,i.taxRate,i.discount||0).total,0);

  const blank={name:"",phone:"",email:"",address:"",propertyType:"Single Family",leadSource:"Referral",notes:"",tags:[]};
  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=c=>setForm({...c,_id:c.id});
  const toggleTag=t=>setForm(f=>({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]}));

  const save=()=>{
    if(!form.name.trim()){showToast("Name required","error");return;}
    if(form._id){
      var changes={...form}; delete changes._id;
      db.custs.update(form._id, changes);
      showToast("Customer updated");
    } else {
      const nc={...form,id:uid(),totalRevenue:0,createdAt:tod()};
      db.custs.create(nc);
      setSel(nc.id);
      showToast("Customer added");
    }
    setForm(null);
  };
  const del=id=>{db.custs.remove(id);if(sel===id)setSel(null);showToast("Removed");};

  return (
    <div className="spl">
      {/* LEFT */}
      <div className="spl-l">
        <div style={{padding:"11px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{display:"flex",gap:7,marginBottom:8}}>
            <div style={{flex:1,position:"relative"}}>
              <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={12}/></div>
              <input className="inp" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search…" style={{paddingLeft:27,fontSize:12}}/>
            </div>
            <button onClick={openNew} className="bb b-bl" style={{padding:"8px 12px",fontSize:12}}><I n="plus" s={12}/>Add</button>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {TAGS.map(t=><button key={t} onClick={()=>setTagF(t)} style={{padding:"3px 8px",borderRadius:18,fontSize:9,fontWeight:700,border:`1px solid ${tagF===t?"var(--accent)":"var(--border)"}`,background:tagF===t?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.14)":"transparent",color:tagF===t?"var(--accent-light)":"var(--text-dim)"}}>{t}</button>)}
          </div>
        </div>
        <div style={{padding:"5px 12px",borderBottom:"1px solid var(--border)",fontSize:9,color:"var(--text-ghost)",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,flexShrink:0}}>{filt.length} customers</div>
        <div style={{flex:1,overflowY:"auto"}}>
          {filt.map(c=>{
            const is=sel===c.id;
            return <div key={c.id} className={`sl ${is?"on":""}`} onClick={()=>{setSel(c.id);setDtab("overview");}} style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",background:is?"rgba(59,130,246,.06)":"transparent"}}>
              <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                <div style={{width:34,height:34,borderRadius:9,background:avC(c.id),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{ini(c.name)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
                    <div style={{fontWeight:700,fontSize:12,color:is?"var(--text)":"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div className="mn" style={{fontSize:10,color:"#3b82f6",flexShrink:0}}>{fmt(c.totalRevenue)}</div>
                  </div>
                  <div style={{fontSize:10,color:"var(--text-faint)",marginTop:1}}>{c.propertyType} · {c.leadSource}</div>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>
                    {c.tags.map(t=><span key={t} style={{padding:"1px 6px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:TAG_C[t]?.bg||"rgba(74,80,104,.15)",color:TAG_C[t]?.c||"var(--text-muted)"}}>{t}</span>)}
                  </div>
                </div>
              </div>
            </div>;
          })}
          {filt.length===0&&<div style={{padding:"30px",textAlign:"center",color:"var(--text-ghost)",fontSize:12}}>No customers found</div>}
        </div>
      </div>

      {/* RIGHT */}
      {sc?(
        <div className="spl-r">
          <div style={{padding:"15px 20px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:44,height:44,borderRadius:12,background:avC(sc.id),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16}}>{ini(sc.name)}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:18,letterSpacing:-.3}}>{sc.name}</div>
                  <div style={{display:"flex",gap:5,marginTop:4}}>{sc.tags.map(t=><span key={t} style={{padding:"2px 7px",borderRadius:10,fontSize:9,fontWeight:700,textTransform:"uppercase",background:TAG_C[t]?.bg||"rgba(74,80,104,.15)",color:TAG_C[t]?.c||"var(--text-muted)"}}>{t}</span>)}</div>
                </div>
              </div>
              <div className="act-bar" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>openEdit(sc)} className="bb b-gh" style={{padding:"6px 12px",fontSize:11}}><I n="edit" s={12}/>Edit</button>
                <button onClick={()=>del(sc.id)} className="bb b-rd" style={{padding:"6px 10px",fontSize:11}}><I n="trash" s={12}/></button>
              </div>
            </div>
            <div style={{display:"flex",gap:16,marginTop:11,flexWrap:"wrap"}}>
              {[{icon:"phone",v:sc.phone},{icon:"mail",v:sc.email},{icon:"map",v:sc.address}].map(x=>(
                <div key={x.icon} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--text-muted)"}}><span style={{color:"var(--text-dim)"}}><I n={x.icon} s={11}/></span>{x.v}</div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:11,flexWrap:"wrap"}}>
              {[{l:"Revenue",v:fmt(sc.totalRevenue),c:"#3b82f6"},{l:"Billed",v:fmt(billed),c:"#22c55e"},{l:"Projects",v:cProj.length,c:"#f5a623"},{l:"Estimates",v:cEsts.length,c:"#a78bfa"},{l:"Invoices",v:cInvs.length,c:"#14b8a6"},{l:"Since",v:sc.createdAt,c:"var(--text-dim)"}].map(k=>(
                <div key={k.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 11px"}}>
                  <div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</div>
                  <div className="mn" style={{fontSize:12,color:k.c,marginTop:2}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",borderBottom:"1px solid var(--border)",padding:"0 20px",flexShrink:0}}>
            {["overview","projects","estimates","invoices","notes"].map(t=>(
              <button key={t} onClick={()=>setDtab(t)} style={{padding:"9px 15px",fontSize:11,fontWeight:700,textTransform:"capitalize",letterSpacing:.3,color:dtab===t?"var(--accent-light)":"var(--text-dim)",borderBottom:`2px solid ${dtab===t?"var(--accent)":"transparent"}`,transition:"all .14s"}}>{t}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:20}} key={dtab+sc.id}>
            {dtab==="overview"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:15}}>
                  <div className="stl">Notes</div>
                  <div style={{fontSize:13,color:"var(--text-3)",lineHeight:1.7,fontStyle:sc.notes?"normal":"italic"}}>{sc.notes||"No notes added."}</div>
                </div>
                <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:15}}>
                  <div className="stl">Recent Activity</div>
                  {[...cProj.map(p=>({type:"Project",name:p.name,status:p.status,val:p.contractValue,date:p.start,map:PRJ_SC})),
                    ...cEsts.map(e=>({type:"Estimate",name:e.name,status:e.status,val:calcInv(e.lineItems,e.taxRate,e.discount||0).total,date:e.date,map:EST_SC})),
                    ...cInvs.map(i=>({type:"Invoice",name:i.number,status:i.status,val:calcInv(i.lineItems,i.taxRate,i.discount||0).total,date:i.issueDate,map:INV_SC})),
                  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(a=>(
                    <div key={`${a.type}-${a.name}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                      <div><div style={{fontSize:12,fontWeight:600}}>{a.name}</div><div style={{fontSize:10,color:"var(--text-faint)"}}>{a.type} · {a.date}</div></div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}><Chip s={a.status} map={a.map}/><span className="mn" style={{fontSize:12,color:"#63b3ed"}}>{fmt(a.val)}</span></div>
                    </div>
                  ))}
                  {cProj.length+cEsts.length+cInvs.length===0&&<ES icon="customers" text="No activity yet."/>}
                </div>
              </div>
            )}
            {dtab==="projects"&&(cProj.length===0?<ES icon="projects" text="No projects linked."/>:cProj.map(p=>(
              <div key={p.id} className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:11,padding:"13px 16px",marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{p.name}</div><div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Phase: {p.phase}</div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><Chip s={p.status} map={PRJ_SC}/><span className="mn" style={{fontSize:14,color:"var(--accent)"}}>{fmt(p.contractValue)}</span></div>
                </div>
                <div style={{marginTop:9}}><Pr v={p.progress} color={p.progress>=90?"#22c55e":p.progress>=50?"#3b82f6":"#f5a623"}/></div>
              </div>
            )))}
            {dtab==="estimates"&&(cEsts.length===0?<ES icon="estimates" text="No estimates."/>:cEsts.map(e=>{
              const c=calcInv(e.lineItems,e.taxRate,e.discount||0);
              return <div key={e.id} className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:11,padding:"13px 16px",marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{e.name}</div><div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>{e.number} · {e.date}</div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><Chip s={e.status} map={EST_SC}/><span className="mn" style={{fontSize:14,color:"#a78bfa"}}>{fmt(c.total)}</span></div>
                </div>
              </div>;
            }))}
            {dtab==="invoices"&&(
              <div>
                <div style={{display:"flex",gap:9,marginBottom:12}}>
                  {[{l:"Billed",v:fmt(billed),c:"var(--text)"},{l:"Paid",v:fmt(cInvs.filter(i=>i.status==="paid").reduce((s,i)=>s+calcInv(i.lineItems,i.taxRate,i.discount||0).total,0)),c:"#22c55e"},{l:"Outstanding",v:fmt(cInvs.filter(i=>i.status!=="paid"&&i.status!=="void").reduce((s,i)=>s+calcInv(i.lineItems,i.taxRate,i.discount||0).total,0)),c:"#f5a623"}].map(k=>(
                    <div key={k.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px"}}><div style={{fontSize:9,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase"}}>{k.l}</div><div className="mn" style={{fontSize:13,color:k.c,marginTop:2}}>{k.v}</div></div>
                  ))}
                </div>
                {cInvs.length===0?<ES icon="invoices" text="No invoices."/>:cInvs.map(inv=>{
                  const c=calcInv(inv.lineItems,inv.taxRate,inv.discount||0);
                  return <div key={inv.id} className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:11,padding:"11px 16px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><span className="mn" style={{fontSize:12,color:"var(--text-muted)"}}>{inv.number}</span><div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Due {inv.dueDate}</div></div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}><Chip s={inv.status} map={INV_SC}/><span className="mn" style={{fontSize:14,color:"#22c55e"}}>{fmt(c.total)}</span></div>
                    </div>
                  </div>;
                })}
              </div>
            )}
            {dtab==="notes"&&(
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                <div className="stl">Client Notes</div>
                <textarea defaultValue={sc.notes} onBlur={e=>{db.custs.update(sc.id,{notes:e.target.value});showToast("Notes saved");}} rows={10} className="inp" placeholder="Notes…" style={{resize:"vertical",lineHeight:1.7,fontSize:13}}/>
                <div style={{fontSize:10,color:"var(--text-ghost)",marginTop:6}}>Auto-saves on blur.</div>
              </div>
            )}
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"var(--text-ghost)",gap:12}}>
          <I n="customers" s={40}/><div style={{fontSize:14,fontWeight:600}}>Select a customer</div>
          <button onClick={openNew} className="bb b-bl" style={{padding:"8px 16px",fontSize:12,marginTop:4}}><I n="plus" s={13}/>Add Customer</button>
        </div>
      )}

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:580,marginTop:40}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Customer":"New Customer"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Full Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="John Smith"/></div>
              <div className="g2">
                <div><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000"/></div>
                <div><label className="lbl">Email</label><input className="inp" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="client@email.com"/></div>
              </div>
              <div><label className="lbl">Address</label><input className="inp" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="123 Main St, Austin TX"/></div>
              <div className="g2">
                <div><label className="lbl">Property Type</label>
                  <select className="inp" value={form.propertyType} onChange={e=>setForm(f=>({...f,propertyType:e.target.value}))}>
                    {["Single Family","Condo","Multi-family","Commercial","Townhome","Rental Property"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Lead Source</label>
                  <select className="inp" value={form.leadSource} onChange={e=>setForm(f=>({...f,leadSource:e.target.value}))}>
                    {["Referral","Google","Website","Facebook","Angi","HomeAdvisor","Yard Sign","Word of Mouth"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Tags</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["VIP","Repeat","Hot Lead","Investor","New","Referral Source"].map(t=>{
                    const on=form.tags.includes(t);
                    return <button key={t} onClick={()=>toggleTag(t)} style={{padding:"4px 11px",borderRadius:18,fontSize:10,fontWeight:700,border:`1px solid ${on?(TAG_C[t]?.c||"var(--accent)"):"var(--border-2)"}`,background:on?(TAG_C[t]?.bg||"rgba(59,130,246,.12)"):"transparent",color:on?(TAG_C[t]?.c||"#63b3ed"):"var(--text-dim)"}}>{t}</button>;
                  })}
                </div>
              </div>
              <div><label className="lbl">Notes</label><textarea className="inp" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{resize:"vertical"}}/></div>
              <div style={{display:"flex",gap:9,marginTop:4}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={14}/>{form._id?"Update":"Add"} Customer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
