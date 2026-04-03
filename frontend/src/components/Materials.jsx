import React, { useState, useMemo } from 'react';
import { CAT_C } from '../constants';
import { fmt, fmtD, uid } from '../utils/calculations';
import { KpiCard, ES, ConfirmDeleteModal } from './shared/ui';
import I from './shared/Icons';

export default function Materials({mats,setMats,showToast,db}) {
  const [catF,setCatF]=useState("All");
  const [srch,setSrch]=useState("");
  const [form,setForm]=useState(null);
  const [pendingDel,setPendingDel]=useState(null);

  const cats=["All",...[...new Set(mats.map(m=>m.category))].sort()];
  const filt=useMemo(()=>mats.filter(m=>{
    const ms=!srch||m.name.toLowerCase().includes(srch.toLowerCase())||m.supplier.toLowerCase().includes(srch.toLowerCase());
    return ms&&(catF==="All"||m.category===catF);
  }),[mats,srch,catF]);

  const lowStock=mats.filter(m=>m.stock<=m.reorderAt);
  const totalVal=mats.reduce((s,m)=>s+(m.cost*m.stock),0);
  const blank={name:"",unit:"ea",category:"Lumber",supplier:"",cost:"",markup:30,stock:"",reorderAt:""};

  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=m=>setForm({...m,_id:m.id,cost:String(m.cost),markup:String(m.markup),stock:String(m.stock),reorderAt:String(m.reorderAt)});
  const save=()=>{
    if(!form.name.trim()){showToast("Name required","error");return;}
    const n=v=>Number(v)||0;
    const data={...form,cost:n(form.cost),markup:n(form.markup),stock:n(form.stock),reorderAt:n(form.reorderAt)};
    if(form._id){var ch={...data};delete ch._id;db.mats.update(form._id,ch);showToast("Updated");}
    else{db.mats.create({...data,id:uid()});showToast("Added");}
    setForm(null);
  };
  const del=id=>{db.mats.remove(id);showToast("Removed");setPendingDel(null);};

  const sellPrice=m=>m.cost*(1+m.markup/100);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="g4">
        {[{l:"Items",v:mats.length,c:"#63b3ed"},{l:"Inventory Value",v:fmt(totalVal),c:"#22c55e"},{l:"Low Stock Alerts",v:lowStock.length,c:lowStock.length>0?"#ef4444":"#22c55e"},{l:"Categories",v:[...new Set(mats.map(m=>m.category))].length,c:"#a78bfa"}].map(k=>(
          <KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>
        ))}
      </div>

      {lowStock.length>0&&(
        <div style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.18)",borderRadius:11,padding:"11px 14px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:.5,marginBottom:7,display:"flex",gap:5,alignItems:"center"}}><I n="alert" s={11}/>Low Stock — {lowStock.length} item{lowStock.length!==1?"s":""} at or below reorder point</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {lowStock.map(m=><div key={m.id} style={{background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.15)",borderRadius:7,padding:"4px 10px",fontSize:10,color:"#ef4444",fontWeight:600}}>{m.name} — {m.stock} {m.unit} left</div>)}
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={12}/></div>
          <input className="inp" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search materials…" style={{paddingLeft:27,fontSize:12}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {cats.map(c=><button key={c} onClick={()=>setCatF(c)} style={{padding:"5px 11px",borderRadius:18,fontSize:10,fontWeight:700,border:`1px solid ${catF===c?"var(--accent)":"var(--border)"}`,background:catF===c?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.14)":"var(--bg-card)",color:catF===c?"var(--accent-light)":"var(--text-dim)",transition:"all .13s"}}>{c}</button>)}
        </div>
        <button onClick={openNew} className="bb b-bl" style={{padding:"8px 14px",fontSize:12}}><I n="plus" s={13}/>Add Item</button>
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Name","Category","Supplier","Unit","Cost","Markup","Sell Price","Stock","Reorder At","Status",""].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filt.map((m,i)=>{
              const sp=sellPrice(m);
              const low=m.stock<=m.reorderAt;
              return <tr key={m.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td style={{padding:"8px 12px",fontWeight:700,color:"var(--text-2)"}}>{m.name}</td>
                <td style={{padding:"8px 12px"}}><span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:`${CAT_C[m.category]||"#4a566e"}18`,color:CAT_C[m.category]||"var(--text-muted)"}}>{m.category}</span></td>
                <td style={{padding:"8px 12px",color:"var(--text-muted)"}}>{m.supplier}</td>
                <td style={{padding:"8px 12px",color:"var(--text-dim)"}}>{m.unit}</td>
                <td className="mn" style={{padding:"8px 12px",color:"var(--text)"}}>{fmtD(m.cost)}</td>
                <td className="mn" style={{padding:"8px 12px",color:"#a78bfa"}}>{m.markup}%</td>
                <td className="mn" style={{padding:"8px 12px",color:"#22c55e",fontWeight:700}}>{fmtD(sp)}</td>
                <td className="mn" style={{padding:"8px 12px",color:low?"#ef4444":"var(--text)",fontWeight:low?700:400}}>{m.stock}</td>
                <td className="mn" style={{padding:"8px 12px",color:"var(--text-dim)"}}>{m.reorderAt}</td>
                <td style={{padding:"8px 12px"}}><span style={{padding:"2px 7px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:low?"rgba(239,68,68,.1)":"rgba(34,197,94,.08)",color:low?"#ef4444":"#22c55e"}}>{low?"Low Stock":"In Stock"}</span></td>
                <td style={{padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>openEdit(m)} style={{color:"var(--text-dim)",opacity:.7,transition:"opacity .12s"}} className="rh"><I n="edit" s={13}/></button>
                    <button onClick={()=>setPendingDel(m.id)} style={{color:"#ef4444",opacity:.5,transition:"opacity .12s"}} className="rh"><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
        {filt.length===0&&<ES icon="materials" text="No materials match your filters."/>}
      </div>

      {pendingDel!==null&&<ConfirmDeleteModal label="this material" onConfirm={()=>del(pendingDel)} onCancel={()=>setPendingDel(null)}/>}

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:560,marginTop:30}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Material":"Add Material"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Framing Lumber 2x4x8"/></div>
              <div className="g2">
                <div><label className="lbl">Category</label>
                  <select className="inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {["Lumber","Drywall","Flooring","Tile","Paint","Plumbing","Electrical","Decking","Concrete","Insulation","Doors & Windows","Other"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Unit</label>
                  <select className="inp" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                    {["ea","SF","LF","bag","sheet","roll","gal","lb","ton","box","set"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Supplier</label><input className="inp" value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="Home Depot"/></div>
              <div className="g3">
                <div><label className="lbl">Cost</label><input className="inp" type="number" step=".01" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))}/></div>
                <div><label className="lbl">Markup %</label><input className="inp" type="number" value={form.markup} onChange={e=>setForm(f=>({...f,markup:e.target.value}))}/></div>
                <div><label className="lbl">Sell Price</label><div className="inp" style={{background:"var(--bg)",cursor:"default"}}><span className="mn" style={{color:"#22c55e"}}>{fmtD((Number(form.cost)||0)*(1+(Number(form.markup)||0)/100))}</span></div></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Stock Qty</label><input className="inp" type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
                <div><label className="lbl">Reorder At</label><input className="inp" type="number" value={form.reorderAt} onChange={e=>setForm(f=>({...f,reorderAt:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:9,marginTop:4}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Add"} Item</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
