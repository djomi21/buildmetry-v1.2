import { useState, useMemo } from 'react';
import { EXPENSE_CATS } from '../constants';
import { fmt, tod, uid } from '../utils/calculations';
import { I } from './shared/Icons';
import { KpiCard, ES } from './shared/ui';

export default function Expenses({expenses,setExpenses,projs,showToast,db}) {
  const [form,setForm]=useState(null);
  const [catF,setCatF]=useState("All");
  const [projF,setProjF]=useState("all");
  const [srch,setSrch]=useState("");

  const cats=["All",...[...new Set(expenses.map(e=>e.category))].sort()];
  const filt=useMemo(()=>expenses.filter(e=>{
    const ms=!srch||e.description.toLowerCase().includes(srch.toLowerCase())||e.vendor.toLowerCase().includes(srch.toLowerCase());
    const cf=catF==="All"||e.category===catF;
    const pf=projF==="all"||(projF==="overhead"?!e.projId:e.projId===projF);
    return ms&&cf&&pf;
  }),[expenses,srch,catF,projF]);

  const totalAll=expenses.reduce((s,e)=>s+e.amount,0);
  const totalJob=expenses.filter(e=>e.projId).reduce((s,e)=>s+e.amount,0);
  const totalOverhead=expenses.filter(e=>!e.projId).reduce((s,e)=>s+e.amount,0);
  const totalReimb=expenses.filter(e=>e.reimbursable).reduce((s,e)=>s+e.amount,0);

  const blank={projId:"",date:tod(),category:"Materials",vendor:"",description:"",amount:"",receipt:false,reimbursable:false,notes:""};
  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=e=>setForm({...e,_id:e.id,amount:String(e.amount)});
  const save=()=>{
    if(!form.description.trim()||!form.amount){showToast("Description & amount required","error");return;}
    const data={...form,amount:Number(form.amount)||0,projId:form.projId||null};
    if(form._id){var ch={...data};delete ch._id;db.expenses.update(form._id,ch);showToast("Updated");}
    else{db.expenses.create({...data,id:uid()});showToast("Expense added");}
    setForm(null);
  };
  const del=id=>{db.expenses.remove(id);showToast("Removed");};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="g4">
        {[{l:"Total Expenses",v:fmt(totalAll),c:"#ef4444"},{l:"Job Costs",v:fmt(totalJob),c:"#f5a623"},{l:"Overhead",v:fmt(totalOverhead),c:"#a78bfa"},{l:"Reimbursable",v:fmt(totalReimb),c:"#22c55e"}].map(k=>(<KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>))}
      </div>
      <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180,maxWidth:280}}>
          <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={12}/></div>
          <input className="inp" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search expenses…" style={{paddingLeft:27,fontSize:12}}/>
        </div>
        <select className="inp" value={projF} onChange={e=>setProjF(e.target.value)} style={{width:180,fontSize:11}}>
          <option value="all">All Projects</option>
          <option value="overhead">Overhead Only</option>
          {projs.map(p=><option key={p.id} value={p.id}>{p.name.split(" ").slice(0,3).join(" ")}</option>)}
        </select>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {cats.slice(0,7).map(c=><button key={c} onClick={()=>setCatF(c)} style={{padding:"4px 10px",borderRadius:18,fontSize:10,fontWeight:700,border:`1px solid ${catF===c?"var(--accent)":"var(--border)"}`,background:catF===c?"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.14)":"var(--bg-card)",color:catF===c?"var(--accent-light)":"var(--text-dim)"}}>{c}</button>)}
        </div>
        <button onClick={openNew} className="bb b-bl" style={{padding:"8px 14px",fontSize:12,marginLeft:"auto"}}><I n="plus" s={13}/>Add Expense</button>
      </div>
      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Date","Project","Category","Vendor","Description","Amount","Receipt","Reimb.",""].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filt.map((ex,i)=>{
              const p=projs.find(x=>x.id===ex.projId);
              return <tr key={ex.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td className="mn" style={{padding:"8px 12px",color:"var(--text-dim)",fontSize:10}}>{ex.date}</td>
                <td style={{padding:"8px 12px",color:p?"var(--text-2)":"var(--text-faint)",fontSize:11}}>{p?p.name.split(" ").slice(0,2).join(" "):"Overhead"}</td>
                <td style={{padding:"8px 12px"}}><span style={{padding:"2px 7px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:"rgba(99,179,237,.1)",color:"#63b3ed"}}>{ex.category}</span></td>
                <td style={{padding:"8px 12px",color:"var(--text-muted)"}}>{ex.vendor}</td>
                <td style={{padding:"8px 12px",color:"var(--text)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.description}</td>
                <td className="mn" style={{padding:"8px 12px",color:"#ef4444",fontWeight:700}}>{fmt(ex.amount)}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>{ex.receipt?<span style={{color:"#22c55e"}}><I n="check" s={12}/></span>:<span style={{color:"var(--text-faint)"}}>—</span>}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>{ex.reimbursable?<span style={{padding:"2px 6px",borderRadius:10,fontSize:8,fontWeight:700,background:"rgba(34,197,94,.1)",color:"#22c55e"}}>Yes</span>:<span style={{color:"var(--text-faint)"}}>—</span>}</td>
                <td style={{padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>openEdit(ex)} style={{color:"var(--text-dim)",opacity:.7}} className="rh"><I n="edit" s={13}/></button>
                    <button onClick={()=>del(ex.id)} style={{color:"#ef4444",opacity:.5}} className="rh"><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
        {filt.length===0&&<ES icon="expense" text="No expenses match your filters."/>}
      </div>
      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:560,marginTop:40}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Expense":"Add Expense"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div className="g2">
                <div><label className="lbl">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                <div><label className="lbl">Amount $ *</label><input className="inp" type="number" step=".01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00"/></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Category</label>
                  <select className="inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Project (optional)</label>
                  <select className="inp" value={form.projId||""} onChange={e=>setForm(f=>({...f,projId:e.target.value||null}))}>
                    <option value="">Overhead / No Project</option>
                    {projs.map(p=><option key={p.id} value={p.id}>{p.name.split(" ").slice(0,3).join(" ")}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Vendor</label><input className="inp" value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))} placeholder="Home Depot"/></div>
              <div><label className="lbl">Description *</label><input className="inp" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Framing lumber & hardware"/></div>
              <div style={{display:"flex",gap:16}}>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"var(--text-muted)",cursor:"pointer"}}>
                  <input type="checkbox" checked={form.receipt} onChange={e=>setForm(f=>({...f,receipt:e.target.checked}))} style={{accentColor:"#3b82f6"}}/> Receipt on file
                </label>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"var(--text-muted)",cursor:"pointer"}}>
                  <input type="checkbox" checked={form.reimbursable} onChange={e=>setForm(f=>({...f,reimbursable:e.target.checked}))} style={{accentColor:"#22c55e"}}/> Reimbursable
                </label>
              </div>
              <div><label className="lbl">Notes</label><textarea className="inp" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{resize:"vertical"}}/></div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Add"} Expense</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
