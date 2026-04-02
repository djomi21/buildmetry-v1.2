import React, { useState, useMemo } from 'react';
import { SVC_CATS, SVC_CAT_C } from '../constants';
import { fmtD, uid } from '../utils/calculations';
import { KpiCard, ES } from './shared/ui';
import I from './shared/Icons';

const UNITS = ["ea","sf","lf","sy","cy","hr","day","ls","gal","ton","bd ft"];

export default function Services({svcs,db,showToast}) {
  const [catF,setCatF]  = useState("All");
  const [srch,setSrch]  = useState("");
  const [form,setForm]  = useState(null);

  const filt = useMemo(()=>svcs.filter(s=>{
    const ms = !srch || s.name.toLowerCase().includes(srch.toLowerCase()) || s.description.toLowerCase().includes(srch.toLowerCase());
    return ms && (catF==="All" || s.category===catF);
  }),[svcs,srch,catF]);

  const usedCats  = [...new Set(svcs.map(s=>s.category))];
  const pkgCount  = svcs.filter(s=>(s.lineItems||[]).length>0).length;
  const blank     = {name:"",description:"",category:"General",unit:"ls",unitPrice:"",isMaterial:false,lineItems:[]};

  const openNew  = ()=>setForm({...blank,_id:null});
  const openEdit = s=>setForm({...s,_id:s.id,unitPrice:String(s.unitPrice),lineItems:(s.lineItems||[]).map(li=>({...li,id:uid()}))});
  const save = ()=>{
    if(!form.name.trim()){showToast("Name required","error");return;}
    const cleanItems = form.lineItems.map(({id,...li})=>li);
    const data = {...form, unitPrice:parseFloat(form.unitPrice)||0, lineItems:cleanItems};
    if(form._id){const ch={...data};delete ch._id;db.svcs.update(form._id,ch);showToast("Updated");}
    else{db.svcs.create({...data,id:uid()});showToast("Service added");}
    setForm(null);
  };
  const del = id=>{db.svcs.remove(id);showToast("Removed");};

  const addLI  = isMat=>setForm(f=>({...f,lineItems:[...f.lineItems,{id:uid(),description:"",qty:1,unitPrice:"",unit:"ls",isMaterial:isMat}]}));
  const updLI  = (liId,fld,v)=>setForm(f=>({...f,lineItems:f.lineItems.map(li=>li.id===liId?{...li,[fld]:fld==="qty"||fld==="unitPrice"?Number(v)||0:v}:li)}));
  const delLI  = liId=>setForm(f=>({...f,lineItems:f.lineItems.filter(li=>li.id!==liId)}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="g4">
        {[
          {l:"Total Services", v:svcs.length,         c:"#63b3ed"},
          {l:"Categories",     v:usedCats.length,      c:"#a78bfa"},
          {l:"Packages",       v:pkgCount,             c:"#14b8a6"},
          {l:"Labor Items",    v:svcs.filter(s=>!s.isMaterial&&!(s.lineItems||[]).length).length, c:"#f5a623"},
        ].map(k=><KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>)}
      </div>

      <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={12}/></div>
          <input className="inp" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search services…" style={{paddingLeft:27,fontSize:12}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...SVC_CATS].map(c=><button key={c} onClick={()=>setCatF(c)} style={{padding:"5px 11px",borderRadius:18,fontSize:10,fontWeight:700,border:`1px solid ${catF===c?"var(--accent)":"var(--border)"}`,background:catF===c?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.14)":"var(--bg-card)",color:catF===c?"var(--accent-light)":"var(--text-dim)",transition:"all .13s"}}>{c}</button>)}
        </div>
        <button onClick={openNew} className="bb b-bl" style={{padding:"8px 14px",fontSize:12}}><I n="plus" s={13}/>Add Service</button>
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{background:"var(--bg-sidebar)"}}>
              {["Name","Category","Type / Package","Rate",""].map(h=>(
                <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filt.map((s,i)=>{
              const isPackage = (s.lineItems||[]).length>0;
              const pkgTotal  = isPackage ? s.lineItems.reduce((sum,li)=>sum+(li.qty*li.unitPrice),0) : 0;
              return (
                <tr key={s.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                  <td style={{padding:"8px 12px",fontWeight:700,color:"var(--text-2)"}}>
                    {s.name}
                    {isPackage&&<div style={{fontSize:9,color:"#14b8a6",fontWeight:600,marginTop:2}}>Package · {s.lineItems.length} items</div>}
                  </td>
                  <td style={{padding:"8px 12px"}}>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:`${SVC_CAT_C[s.category]||"#4a566e"}18`,color:SVC_CAT_C[s.category]||"var(--text-muted)"}}>{s.category}</span>
                  </td>
                  <td style={{padding:"8px 12px"}}>
                    {isPackage
                      ?<span style={{padding:"2px 7px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:"rgba(20,184,166,.12)",color:"#14b8a6"}}>{s.lineItems.length} items</span>
                      :<span style={{padding:"2px 7px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:s.isMaterial?"rgba(99,102,241,.1)":"rgba(245,166,35,.1)",color:s.isMaterial?"#6366f1":"#f5a623"}}>{s.isMaterial?"Material":"Labor"}</span>
                    }
                  </td>
                  <td className="mn" style={{padding:"8px 12px",color:"#22c55e",fontWeight:700}}>
                    {isPackage ? fmtD(pkgTotal) : `${fmtD(s.unitPrice)}/${s.unit}`}
                  </td>
                  <td style={{padding:"8px 12px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>openEdit(s)} style={{color:"var(--text-dim)",opacity:.7,transition:"opacity .12s"}} className="rh"><I n="edit" s={13}/></button>
                      <button onClick={()=>del(s.id)} style={{color:"#ef4444",opacity:.5,transition:"opacity .12s"}} className="rh"><I n="trash" s={13}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filt.length===0&&<ES icon="services" text="No services match your filters."/>}
      </div>

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:680,marginTop:30}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Service":"Add Service"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13,overflowY:"auto",maxHeight:"80vh"}}>
              {/* Basic info — always shown */}
              <div><label className="lbl">Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Bathroom Reno Package"/></div>
              <div><label className="lbl">Description</label><input className="inp" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional details"/></div>
              <div><label className="lbl">Category</label>
                <select className="inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {SVC_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Single-item fields — only when no line items */}
              {form.lineItems.length===0&&(
                <div className="g3">
                  <div><label className="lbl">Type</label>
                    <select className="inp" value={form.isMaterial?"material":"labor"} onChange={e=>setForm(f=>({...f,isMaterial:e.target.value==="material"}))}>
                      <option value="labor">Labor</option>
                      <option value="material">Material</option>
                    </select>
                  </div>
                  <div><label className="lbl">Unit</label>
                    <select className="inp" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                      {UNITS.map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div><label className="lbl">Rate</label><input className="inp" type="number" step=".01" value={form.unitPrice} onChange={e=>setForm(f=>({...f,unitPrice:e.target.value}))} placeholder="0.00"/></div>
                </div>
              )}

              {/* Package line-item table — shown when items exist */}
              {form.lineItems.length>0&&(
                <div style={{border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
                  <div style={{background:"var(--bg-sidebar)",padding:"5px 10px",display:"flex",gap:0,borderBottom:"1px solid var(--border)"}}>
                    <span style={{flex:1,fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3}}>Description</span>
                    <span style={{width:46,textAlign:"center",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3}}>Qty</span>
                    <span style={{width:68,textAlign:"center",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3}}>Unit</span>
                    <span style={{width:80,textAlign:"center",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3}}>Price</span>
                    <span style={{width:70,textAlign:"center",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3}}>Type</span>
                    <span style={{width:28}}/>
                  </div>
                  {form.lineItems.map(li=>(
                    <div key={li.id} style={{display:"flex",gap:4,alignItems:"center",padding:"5px 8px",borderTop:"1px solid var(--border)"}}>
                      <input className="inp" style={{flex:1,fontSize:11,padding:"4px 6px"}} value={li.description}
                        onChange={e=>updLI(li.id,"description",e.target.value)} placeholder="Description"/>
                      <input className="inp" style={{width:46,fontSize:11,padding:"4px 4px",textAlign:"center"}} type="number" min="0" step=".1"
                        value={li.qty} onChange={e=>updLI(li.id,"qty",e.target.value)}/>
                      <select className="inp" style={{width:68,fontSize:11,padding:"4px 4px"}} value={li.unit}
                        onChange={e=>updLI(li.id,"unit",e.target.value)}>
                        {UNITS.map(u=><option key={u}>{u}</option>)}
                      </select>
                      <input className="inp" style={{width:80,fontSize:11,padding:"4px 4px",textAlign:"right"}} type="number" step=".01"
                        value={li.unitPrice} onChange={e=>updLI(li.id,"unitPrice",e.target.value)} placeholder="0.00"/>
                      <button onClick={()=>updLI(li.id,"isMaterial",!li.isMaterial)}
                        style={{width:68,padding:"3px 0",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",
                          background:li.isMaterial?"rgba(99,102,241,.12)":"rgba(245,166,35,.12)",
                          color:li.isMaterial?"#6366f1":"#f5a623",
                          border:`1px solid ${li.isMaterial?"#6366f140":"#f5a62340"}`,cursor:"pointer"}}>
                        {li.isMaterial?"Material":"Labor"}
                      </button>
                      <button onClick={()=>delLI(li.id)} style={{color:"#ef4444",opacity:.6,width:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"none",background:"none",cursor:"pointer"}}>
                        <I n="x" s={13}/>
                      </button>
                    </div>
                  ))}
                  <div className="mn" style={{padding:"5px 10px",background:"var(--bg-sidebar)",borderTop:"1px solid var(--border)",fontSize:10,color:"#22c55e",textAlign:"right"}}>
                    Total: {fmtD(form.lineItems.reduce((sum,li)=>sum+(li.qty*(parseFloat(li.unitPrice)||0)),0))}
                  </div>
                </div>
              )}

              {/* Add line item buttons — always shown */}
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>addLI(false)} style={{flex:1,padding:"7px",borderRadius:8,fontSize:11,fontWeight:600,border:"1px dashed var(--border)",background:"transparent",color:"#f5a623",cursor:"pointer",transition:"all .13s"}}>
                  + Add Labor Item
                </button>
                <button onClick={()=>addLI(true)} style={{flex:1,padding:"7px",borderRadius:8,fontSize:11,fontWeight:600,border:"1px dashed var(--border)",background:"transparent",color:"#6366f1",cursor:"pointer",transition:"all .13s"}}>
                  + Add Material Item
                </button>
              </div>

              <div style={{display:"flex",gap:9,marginTop:4}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Add"} Service</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
