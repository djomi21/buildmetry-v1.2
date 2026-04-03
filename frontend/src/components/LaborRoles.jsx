import { useState, useMemo } from 'react';
import { ROLE_C } from '../constants';
import { calcBurden, uid } from '../utils/calculations';
import { I } from './shared/Icons';
import { KpiCard, ES, ConfirmDeleteModal } from './shared/ui';

export default function LaborRoles({roles,setRoles,showToast,db,filterFn,heading}) {
  const [form,setForm]=useState(null);
  const [srch,setSrch]=useState("");
  const [pendingDel,setPendingDel]=useState(null);

  const baseRoles=useMemo(()=>filterFn?roles.filter(filterFn):roles,[roles,filterFn]);
  const filt=useMemo(()=>baseRoles.filter(r=>!srch||r.title.toLowerCase().includes(srch.toLowerCase())),[baseRoles,srch]);

  const blank={title:"",baseRate:"",payrollPct:"15.3",benefitsPct:"12.0"};
  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=r=>setForm({...r,_id:r.id,baseRate:String(r.baseRate),payrollPct:String(r.payrollPct),benefitsPct:String(r.benefitsPct)});
  const save=()=>{
    if(!form.title.trim()){showToast("Role title required","error");return;}
    const n=v=>Number(v)||0;
    const data={...form,baseRate:n(form.baseRate),payrollPct:n(form.payrollPct),benefitsPct:n(form.benefitsPct)};
    if(form._id){
      var ch={...data};delete ch._id;db.roles.update(form._id,ch);
      showToast("Role updated");
    } else {
      db.roles.create({...data,id:uid()});
      showToast("Role added");
    }
    setForm(null);
  };
  const del=id=>{db.roles.remove(id);showToast("Removed");setPendingDel(null);};

  const avgBurden=baseRoles.length>0?Math.round(baseRoles.reduce((s,r)=>s+(r.payrollPct+r.benefitsPct),0)/baseRoles.length*10)/10:0;
  const avgBase=baseRoles.length>0?Math.round(baseRoles.reduce((s,r)=>s+r.baseRate,0)/baseRoles.length*100)/100:0;
  const avgBurdened=baseRoles.length>0?Math.round(baseRoles.reduce((s,r)=>s+calcBurden(r).fullyBurdenedRate,0)/baseRoles.length*100)/100:0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="g4">
        {[{l:"Total Roles",v:baseRoles.length,c:"#63b3ed"},{l:"Avg Base Rate",v:`$${avgBase}/hr`,c:"#f5a623"},{l:"Avg Burden %",v:`${avgBurden}%`,c:"#ef4444"},{l:"Avg Burdened Rate",v:`$${avgBurdened}/hr`,c:"#22c55e"}].map(k=>(
          <KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>
        ))}
      </div>

      <div style={{display:"flex",gap:9,alignItems:"center"}}>
        <div style={{position:"relative",flex:1,maxWidth:320}}>
          <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={12}/></div>
          <input className="inp" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search roles…" style={{paddingLeft:27,fontSize:12}}/>
        </div>
        <button onClick={openNew} className="bb b-bl" style={{padding:"8px 14px",fontSize:12}}><I n="plus" s={13}/>Add Role</button>
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"var(--bg-sidebar)"}}>{["Role Title","Base Rate","Payroll %","Benefits %","Total Burden %","Fully Burdened Rate",""].map(h=><th key={h} style={{padding:"8px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filt.map((r,i)=>{
              const b=calcBurden(r);
              const tc=ROLE_C[r.title]||"#4a566e";
              return <tr key={r.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td style={{padding:"9px 14px"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{width:4,height:22,borderRadius:2,background:tc,flexShrink:0}}/>
                    <span style={{fontWeight:700,color:"var(--text-2)"}}>{r.title}</span>
                  </div>
                </td>
                <td className="mn" style={{padding:"9px 14px",color:"#f5a623"}}>${r.baseRate.toFixed(2)}</td>
                <td className="mn" style={{padding:"9px 14px",color:"#a78bfa"}}>{r.payrollPct}%</td>
                <td className="mn" style={{padding:"9px 14px",color:"#3b82f6"}}>{r.benefitsPct}%</td>
                <td className="mn" style={{padding:"9px 14px",color:"#ef4444",fontWeight:700}}>{b.totalBurdenPct.toFixed(1)}%</td>
                <td className="mn" style={{padding:"9px 14px",color:"#22c55e",fontWeight:700,fontSize:12}}>${b.fullyBurdenedRate.toFixed(2)}</td>
                <td style={{padding:"9px 14px"}}>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>openEdit(r)} style={{color:"var(--text-dim)",opacity:.7}} className="rh"><I n="edit" s={13}/></button>
                    <button onClick={()=>setPendingDel(r.id)} style={{color:"#ef4444",opacity:.5}} className="rh"><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
        {filt.length===0&&<ES icon="wrench" text="No roles match your search."/>}
      </div>

      <div style={{background:"rgba(59,130,246,.04)",border:"1px solid rgba(59,130,246,.15)",borderRadius:10,padding:"12px 16px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#3b82f6",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Burden Rate Guide</div>
        <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.8}}>
          <span style={{fontWeight:700,color:"#a78bfa"}}>Payroll %</span> — FICA, FUTA, SUTA, workers comp, payroll taxes · <span style={{fontWeight:700,color:"#3b82f6"}}>Benefits %</span> — health insurance, retirement, PTO, training, safety equipment<br/>
          <span style={{fontWeight:700,color:"#ef4444"}}>Total Burden %</span> = Payroll % + Benefits % · <span style={{fontWeight:700,color:"#22c55e"}}>Fully Burdened Rate</span> = Base Rate × (1 + Total Burden %)
        </div>
      </div>

      {pendingDel!==null&&<ConfirmDeleteModal label="this labor role" onConfirm={()=>del(pendingDel)} onCancel={()=>setPendingDel(null)}/>}

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:520,marginTop:60}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Role":"Add Role"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Role Title *</label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Electrician"/></div>
              <div><label className="lbl">Base Rate ($/hr)</label><input className="inp" type="number" step=".5" value={form.baseRate} onChange={e=>setForm(f=>({...f,baseRate:e.target.value}))} placeholder="42.00"/></div>
              <div className="g2">
                <div><label className="lbl">Payroll %</label><input className="inp" type="number" step=".1" value={form.payrollPct} onChange={e=>setForm(f=>({...f,payrollPct:e.target.value}))} placeholder="15.3"/></div>
                <div><label className="lbl">Benefits %</label><input className="inp" type="number" step=".1" value={form.benefitsPct} onChange={e=>setForm(f=>({...f,benefitsPct:e.target.value}))} placeholder="14.0"/></div>
              </div>
              {(()=>{
                const br=Number(form.baseRate)||0;const pp=Number(form.payrollPct)||0;const bp=Number(form.benefitsPct)||0;
                const tb=pp+bp;const fbr=Math.round(br*(1+tb/100)*100)/100;
                return <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase"}}>Total Burden %</span>
                    <span className="mn" style={{fontSize:13,color:"#ef4444"}}>{tb.toFixed(1)}%</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase"}}>Payroll Cost</span>
                    <span className="mn" style={{fontSize:11,color:"#a78bfa"}}>${(br*pp/100).toFixed(2)}/hr</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase"}}>Benefits Cost</span>
                    <span className="mn" style={{fontSize:11,color:"#3b82f6"}}>${(br*bp/100).toFixed(2)}/hr</span>
                  </div>
                  <div style={{borderTop:"1px solid var(--border-2)",paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:800,fontSize:12}}>Fully Burdened Rate</span>
                    <span className="mn" style={{fontSize:16,color:"#22c55e"}}>${fbr.toFixed(2)}/hr</span>
                  </div>
                  <div style={{fontSize:9,color:"var(--text-faint)",marginTop:4}}>${br.toFixed(2)} base + ${(fbr-br).toFixed(2)} burden = ${fbr.toFixed(2)}/hr</div>
                </div>;
              })()}
              <div style={{display:"flex",gap:9,marginTop:4}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Add"} Role</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
