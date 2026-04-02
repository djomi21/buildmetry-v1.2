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

  const usedCats = [...new Set(svcs.map(s=>s.category))];
  const avgRate  = svcs.length ? svcs.reduce((sum,s)=>sum+s.unitPrice,0)/svcs.length : 0;
  const blank    = {name:"",description:"",category:"General",unit:"ls",unitPrice:"",isMaterial:false};

  const openNew  = ()=>setForm({...blank,_id:null});
  const openEdit = s=>setForm({...s,_id:s.id,unitPrice:String(s.unitPrice)});
  const save = ()=>{
    if(!form.name.trim()){showToast("Name required","error");return;}
    const data = {...form, unitPrice:parseFloat(form.unitPrice)||0};
    if(form._id){const ch={...data};delete ch._id;db.svcs.update(form._id,ch);showToast("Updated");}
    else{db.svcs.create({...data,id:uid()});showToast("Service added");}
    setForm(null);
  };
  const del = id=>{db.svcs.remove(id);showToast("Removed");};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="g4">
        {[
          {l:"Total Services", v:svcs.length,         c:"#63b3ed"},
          {l:"Categories",     v:usedCats.length,      c:"#a78bfa"},
          {l:"Avg Rate",       v:fmtD(avgRate),        c:"#22c55e"},
          {l:"Labor Items",    v:svcs.filter(s=>!s.isMaterial).length, c:"#f5a623"},
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
              {["Name","Description","Category","Type","Unit","Rate",""].map(h=>(
                <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filt.map((s,i)=>(
              <tr key={s.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td style={{padding:"8px 12px",fontWeight:700,color:"var(--text-2)"}}>{s.name}</td>
                <td style={{padding:"8px 12px",color:"var(--text-muted)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.description||<span style={{color:"var(--text-dim)"}}>—</span>}</td>
                <td style={{padding:"8px 12px"}}>
                  <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:`${SVC_CAT_C[s.category]||"#4a566e"}18`,color:SVC_CAT_C[s.category]||"var(--text-muted)"}}>{s.category}</span>
                </td>
                <td style={{padding:"8px 12px"}}>
                  <span style={{padding:"2px 7px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:s.isMaterial?"rgba(99,102,241,.1)":"rgba(245,166,35,.1)",color:s.isMaterial?"#6366f1":"#f5a623"}}>{s.isMaterial?"Material":"Labor"}</span>
                </td>
                <td style={{padding:"8px 12px",color:"var(--text-dim)"}}>{s.unit}</td>
                <td className="mn" style={{padding:"8px 12px",color:"#22c55e",fontWeight:700}}>{fmtD(s.unitPrice)}/{s.unit}</td>
                <td style={{padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>openEdit(s)} style={{color:"var(--text-dim)",opacity:.7,transition:"opacity .12s"}} className="rh"><I n="edit" s={13}/></button>
                    <button onClick={()=>del(s.id)} style={{color:"#ef4444",opacity:.5,transition:"opacity .12s"}} className="rh"><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filt.length===0&&<ES icon="materials" text="No services match your filters."/>}
      </div>

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:520,marginTop:30}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Service":"Add Service"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Tile Installation"/></div>
              <div><label className="lbl">Description</label><input className="inp" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional details"/></div>
              <div className="g2">
                <div><label className="lbl">Category</label>
                  <select className="inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {SVC_CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Type</label>
                  <select className="inp" value={form.isMaterial?"material":"labor"} onChange={e=>setForm(f=>({...f,isMaterial:e.target.value==="material"}))}>
                    <option value="labor">Labor</option>
                    <option value="material">Material</option>
                  </select>
                </div>
              </div>
              <div className="g2">
                <div><label className="lbl">Unit</label>
                  <select className="inp" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Rate</label><input className="inp" type="number" step=".01" value={form.unitPrice} onChange={e=>setForm(f=>({...f,unitPrice:e.target.value}))} placeholder="0.00"/></div>
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
