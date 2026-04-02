import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PRJ_SC, CO_SC, INV_SC } from '../constants';
import { fmt, fmtD, pct, tod, addD, uid, nxtNum, calcInv } from '../utils/calculations';
import { Chip, ES, KpiCard, Pr } from './shared/ui';
import I from './shared/Icons';
import ContractsModule from './ContractsModule';

export default function Projects({projs,setProjs,custs,ests,cos,invs,tasks,setTasks,phases,subs,showToast,setTab,db,auth,company,scopeTemplates=[],exclusionTemplates=[]}) {
  const [sel,  setSel]  = useState(projs[0]?.id||null);
  const [form, setForm] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [taskForm, setTaskForm] = useState(null);
  useEffect(() => setDetailTab('overview'), [sel]);
  const sp=projs.find(p=>p.id===sel)||null;
  const blank={name:"",custId:"",status:"active",contractValue:"",budgetLabor:"",budgetMaterials:"",actualLabor:"0",actualMaterials:"0",start:tod(),end:addD(tod(),60),phase:"Initiation (feasibility)",progress:0,notes:""};
  const PHASES=phases;

  const openNew=()=>setForm({...blank,_id:null});
  const openEdit=p=>setForm({...p,_id:p.id,contractValue:String(p.contractValue),budgetLabor:String(p.budgetLabor),budgetMaterials:String(p.budgetMaterials),actualLabor:String(p.actualLabor),actualMaterials:String(p.actualMaterials),progress:String(p.progress)});
  const save=()=>{
    if(!form.name.trim()||!form.custId){showToast("Name and customer required","error");return;}
    const n=v=>Number(v)||0;
    const data={...form,custId:Number(form.custId)||form.custId,contractValue:n(form.contractValue),budgetLabor:n(form.budgetLabor),budgetMaterials:n(form.budgetMaterials),actualLabor:n(form.actualLabor),actualMaterials:n(form.actualMaterials),progress:n(form.progress)};
    if(form._id){var ch={...data};delete ch._id;db.projs.update(form._id,ch);showToast("Updated");}
    else{const id=nxtNum(projs,"PRJ");const np={...data,id};db.projs.create(np);setSel(id);showToast(id+" created");}
    setForm(null);
  };

  const canDelete=auth&&["Owner","Admin","Project Manager"].includes(auth.role);
  const del=(id)=>{
    if(!canDelete)return;
    if(!confirm("Delete this project? This cannot be undone."))return;
    db.projs.remove(id);
    if(sel===id)setSel(projs.find(p=>p.id!==id)?.id||null);
    showToast("Project deleted");
  };

  const markComplete=(proj)=>{
    if(!confirm("Mark \""+proj.name+"\" as complete?\n\nThis will create a final invoice with estimate line items + approved change orders.")) return;
    db.projs.update(proj.id,{status:"complete",phase:"Closeout (final inspection/handover)",progress:100});
    var lineItems=[];var lineId=1;
    var est=(ests||[]).find(function(e){return e.id===proj.estId;});
    if(est&&est.lineItems){
      est.lineItems.forEach(function(li){
        lineItems.push({id:lineId++,description:li.description,qty:li.qty,unitPrice:li.unitPrice,isMaterial:li.isMaterial,section:"estimate"});
      });
    }
    var projCOs=(cos||[]).filter(function(c){return c.projId===proj.id&&c.status==="approved";});
    projCOs.forEach(function(co){
      if(co.laborAmt>0) lineItems.push({id:lineId++,description:"CO "+co.number+" — "+co.description+" (Labor)",qty:1,unitPrice:co.laborAmt,isMaterial:false,section:"changeorder",coNumber:co.number});
      if(co.materialAmt>0) lineItems.push({id:lineId++,description:"CO "+co.number+" — "+co.description+" (Materials)",qty:1,unitPrice:co.materialAmt,isMaterial:true,section:"changeorder",coNumber:co.number});
    });
    if(lineItems.length>0){
      var invId=nxtNum(invs||[],"INV");
      var taxRate=est?est.taxRate:7.5;
      var discount=est?(est.discount||0):0;
      var depositType=est?(est.depositType||"none"):"none";
      var depositValue=est?(Number(est.depositValue)||0):0;
      db.invs.create({id:invId,number:invId,custId:proj.custId,projId:proj.id,estId:proj.estId||null,status:"draft",issueDate:tod(),dueDate:addD(tod(),30),discount:discount,depositType:depositType,depositValue:depositValue,paidDate:null,taxRate:taxRate,notes:"Final invoice — "+proj.name+(projCOs.length>0?" (includes "+projCOs.length+" change order"+(projCOs.length>1?"s":"")+")" :""),lineItems:lineItems});
      showToast("Project completed — "+invId+" created");
    } else {
      showToast("Project completed");
    }
  };

  const laborVar=sp?sp.actualLabor-sp.budgetLabor:0;
  const matVar=sp?sp.actualMaterials-sp.budgetMaterials:0;
  const totalBudget=sp?sp.budgetLabor+sp.budgetMaterials:0;
  const totalActual=sp?sp.actualLabor+sp.actualMaterials:0;
  const grossProfit=sp?sp.contractValue-totalActual:0;

  return (
    <div className="spl">
      <div className="spl-l">
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{fontSize:10,color:"var(--text-dim)",fontWeight:700}}>{projs.length} PROJECTS</div>
          <button onClick={openNew} className="bb b-bl" style={{padding:"7px 11px",fontSize:11}}><I n="plus" s={11}/>New</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {projs.map(p=>{
            const c=custs.find(x=>x.id===p.custId);
            const is=sel===p.id;
            const sc=PRJ_SC[p.status]||PRJ_SC.active;
            const pc=p.progress>=90?"#22c55e":p.progress>=50?"#3b82f6":"#f5a623";
            return <div key={p.id} className={`sl ${is?"on":""}`} onClick={()=>setSel(p.id)} style={{padding:"11px 12px",borderBottom:"1px solid var(--border)",background:is?"rgba(59,130,246,.06)":"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span className="mn" style={{fontSize:10,color:is?"#63b3ed":"var(--text-faint)"}}>{p.id}</span>
                <span style={{padding:"2px 6px",borderRadius:10,fontSize:8,fontWeight:700,textTransform:"uppercase",background:sc.bg,color:sc.c}}>{sc.label}</span>
              </div>
              <div style={{fontWeight:700,fontSize:12,color:is?"var(--text)":"var(--text-2)",marginBottom:2,lineHeight:1.3}}>{p.name}</div>
              <div style={{fontSize:10,color:"var(--text-faint)",marginBottom:6}}>{c?.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1}}><Pr v={p.progress} color={pc}/></div>
                <span className="mn" style={{fontSize:9,color:"var(--text-dim)"}}>{p.progress}%</span>
                <span className="mn" style={{fontSize:11,color:"var(--accent)",marginLeft:4}}>{fmt(p.contractValue)}</span>
              </div>

            </div>;
          })}
        </div>
      </div>

      {sp?(
        <div className="spl-r">
          <div style={{padding:"15px 20px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
              <div>
                <div style={{display:"flex",gap:9,alignItems:"center"}}><span className="mn" style={{fontSize:12,color:"var(--text-dim)"}}>{sp.id}</span><Chip s={sp.status} map={PRJ_SC}/></div>
                <div style={{fontWeight:800,fontSize:18,marginTop:2,letterSpacing:-.3}}>{sp.name}</div>
                <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>{custs.find(c=>c.id===sp.custId)?.name} · Phase: {sp.phase} · {sp.start} → {sp.end}</div>
              </div>
              <div className="act-bar" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {sp.status==="active"&&<button onClick={()=>markComplete(sp)} className="bb b-gr" style={{padding:"6px 11px",fontSize:11}}><I n="check" s={11}/>Mark Complete</button>}
                <button onClick={()=>openEdit(sp)} className="bb b-gh" style={{padding:"6px 11px",fontSize:11}}><I n="edit" s={11}/>Edit</button>
                <button onClick={()=>setTab("costing")} className="bb b-am" style={{padding:"6px 11px",fontSize:11}}><I n="costing" s={11}/>Costs</button>
                {canDelete&&<button onClick={()=>del(sp.id)} className="bb b-rd" style={{padding:"6px 10px",fontSize:11}}><I n="trash" s={11}/></button>}
              </div>
            </div>
            <div style={{marginBottom:11}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}><span style={{color:"var(--text-dim)"}}>Progress</span><span className="mn" style={{color:sp.progress>=90?"#22c55e":sp.progress>=50?"#3b82f6":"#f5a623"}}>{sp.progress}%</span></div>
              <div style={{height:8,background:"var(--bg-card)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${sp.progress}%`,background:sp.progress>=90?"#22c55e":sp.progress>=50?"linear-gradient(90deg,#3b82f6,#6366f1)":"#f5a623",transition:"width .6s ease"}}/></div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{l:"Contract",v:fmt(sp.contractValue),c:"#3b82f6"},{l:"Budget Labor",v:fmt(sp.budgetLabor),c:"#f5a623"},{l:"Budget Mat",v:fmt(sp.budgetMaterials),c:"#6c8ebf"},{l:"Actual Labor",v:fmt(sp.actualLabor),c:laborVar>0?"#ef4444":"#22c55e"},{l:"Actual Mat",v:fmt(sp.actualMaterials),c:matVar>0?"#ef4444":"#22c55e"},{l:"Gross Profit",v:fmt(grossProfit),c:grossProfit>=0?"#22c55e":"#ef4444"}].map(k=>(
                <div key={k.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 11px"}}>
                  <div style={{fontSize:8,color:"var(--text-faint)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4}}>{k.l}</div>
                  <div className="mn" style={{fontSize:12,color:k.c,marginTop:2}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="sub-tabs" style={{display:"flex",gap:2,background:"var(--bg-sidebar)",borderRadius:10,padding:3,border:"1px solid var(--border)",width:"fit-content",maxWidth:"100%",overflowX:"auto",margin:"10px 20px 0"}}>
            {[{id:"overview",icon:"dashboard",label:"Overview"},{id:"contracts",icon:"shield",label:"Contracts"}].map(t=>(
              <button key={t.id} onClick={()=>setDetailTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:700,color:detailTab===t.id?"#63b3ed":"var(--text-dim)",background:detailTab===t.id?"rgba(99,179,237,.1)":"transparent",transition:"all .18s",border:"none",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                <I n={t.icon} s={13}/>{t.label}
              </button>
            ))}
          </div>
          {detailTab==='overview'&&<div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:14}}>
              {[{l:"Labor Budget vs Actual",budget:sp.budgetLabor,actual:sp.actualLabor,c:"#f5a623"},{l:"Materials Budget vs Actual",budget:sp.budgetMaterials,actual:sp.actualMaterials,c:"#6c8ebf"}].map(item=>{
                const over=item.actual>item.budget;
                const usePct=item.budget>0?Math.min((item.actual/item.budget)*100,100):0;
                return <div key={item.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:11,padding:13}}>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>{item.l}</div>
                  <div style={{height:7,background:"var(--bg-sidebar)",borderRadius:3,overflow:"hidden",marginBottom:8}}><div style={{height:"100%",borderRadius:3,width:`${usePct}%`,background:over?"#ef4444":item.c,transition:"width .6s ease"}}/></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                    <div><div style={{color:"var(--text-dim)",fontSize:9,textTransform:"uppercase",letterSpacing:.3}}>Budget</div><div className="mn" style={{color:item.c}}>{fmt(item.budget)}</div></div>
                    <div style={{textAlign:"right"}}><div style={{color:"var(--text-dim)",fontSize:9,textTransform:"uppercase",letterSpacing:.3}}>Actual</div><div className="mn" style={{color:over?"#ef4444":"#22c55e"}}>{fmt(item.actual)}</div></div>
                  </div>
                  {over&&<div style={{marginTop:5,fontSize:10,color:"#ef4444",fontWeight:700}}>Over by {fmt(item.actual-item.budget)}</div>}
                </div>;
              })}
            </div>
            {sp.notes&&<div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 15px",marginBottom:14}}><div className="stl">Notes</div><div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.7}}>{sp.notes}</div></div>}

            {/* ── PROJECT TASKS ── */}
            {(()=>{
              const TASK_SC={todo:{bg:"rgba(100,116,139,.12)",c:"#94a3b8",label:"To Do"},in_progress:{bg:"rgba(59,130,246,.12)",c:"#3b82f6",label:"In Progress"},done:{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Done"}};
              const projTasks=tasks.filter(t=>t.projId===sp.id);
              const byPhase={};
              PHASES.forEach(function(ph){var pt=projTasks.filter(function(t){return t.phase===ph;});if(pt.length>0)byPhase[ph]=pt;});
              const unphased=projTasks.filter(function(t){return !t.phase||!PHASES.includes(t.phase);});
              if(unphased.length>0) byPhase["Unassigned"]=unphased;

              const addTask=()=>setTaskForm({id:null,phase:sp.phase||PHASES[0],title:"",assignedTo:null,status:"todo",dueDate:"",notes:""});
              const saveTask=()=>{
                if(!taskForm.title.trim()){showToast("Task title required","error");return;}
                if(taskForm.id){
                  db.tasks.update(taskForm.id,{phase:taskForm.phase,title:taskForm.title,assignedTo:taskForm.assignedTo,status:taskForm.status,dueDate:taskForm.dueDate,notes:taskForm.notes});
                  showToast("Task updated");
                } else {
                  db.tasks.create({...taskForm,id:"T-"+uid(),projId:sp.id});
                  showToast("Task added");
                }
                setTaskForm(null);
              };
              const toggleTask=(tid)=>{
                var t=tasks.find(function(x){return x.id===tid;});if(!t)return;
                var next=t.status==="todo"?"in_progress":t.status==="in_progress"?"done":"todo";
                db.tasks.update(tid,{status:next});
              };
              const delTask=(tid)=>{db.tasks.remove(tid);showToast("Task removed");};

              const donePct=projTasks.length>0?Math.round(projTasks.filter(t=>t.status==="done").length/projTasks.length*100):0;

              return <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
                <div style={{padding:"10px 15px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span className="stl" style={{margin:0}}>Tasks</span>
                    <span style={{fontSize:10,color:"var(--text-dim)"}}>{projTasks.filter(t=>t.status==="done").length}/{projTasks.length} done</span>
                    {projTasks.length>0&&<span style={{fontSize:10,color:donePct===100?"#22c55e":"#3b82f6",fontWeight:700}}>{donePct}%</span>}
                  </div>
                  <button onClick={addTask} className="bb b-bl" style={{padding:"4px 10px",fontSize:10}}><I n="plus" s={10}/>Add Task</button>
                </div>
                {projTasks.length===0&&<div style={{padding:20,textAlign:"center",color:"var(--text-faint)",fontSize:12}}>No tasks yet. Click "Add Task" to get started.</div>}
                {Object.keys(byPhase).map(function(ph){
                  var pTasks=byPhase[ph];
                  var phColor=ph===sp.phase?"var(--accent)":"var(--text-dim)";
                  return <div key={ph}>
                    <div style={{padding:"6px 15px",background:"var(--bg-sidebar)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,fontWeight:700,color:phColor,textTransform:"uppercase",letterSpacing:.5}}>{ph}</span>
                      <span style={{fontSize:9,color:"var(--text-faint)"}}>{pTasks.filter(function(t){return t.status==="done";}).length}/{pTasks.length}</span>
                    </div>
                    {pTasks.map(function(t){
                      var sub=subs.find(function(s){return s.id===t.assignedTo;});
                      var st=TASK_SC[t.status]||TASK_SC.todo;
                      return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 15px",borderBottom:"1px solid var(--border)"}} className="rh">
                        <button onClick={function(){toggleTask(t.id);}} style={{width:20,height:20,borderRadius:6,border:"2px solid "+(t.status==="done"?"#22c55e":"var(--border-2)"),background:t.status==="done"?"rgba(34,197,94,.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
                          {t.status==="done"&&<I n="check" s={12} style={{color:"#22c55e"}}/>}
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:t.status==="done"?"var(--text-dim)":"var(--text-2)",textDecoration:t.status==="done"?"line-through":"none"}}>{t.title}</div>
                          <div style={{display:"flex",gap:8,marginTop:2,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{padding:"1px 6px",borderRadius:6,fontSize:8,fontWeight:700,background:st.bg,color:st.c}}>{st.label}</span>
                            {sub&&<span style={{fontSize:9,color:"var(--text-muted)"}}>{sub.name}</span>}
                            {t.dueDate&&<span style={{fontSize:9,color:t.dueDate<tod()&&t.status!=="done"?"#ef4444":"var(--text-dim)"}}>{t.dueDate}</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:3,flexShrink:0}}>
                          <button onClick={function(){setTaskForm({...t});}} style={{padding:3,color:"var(--text-faint)"}}><I n="edit" s={12}/></button>
                          <button onClick={function(){delTask(t.id);}} style={{padding:3,color:"var(--text-faint)"}}><I n="x" s={12}/></button>
                        </div>
                      </div>;
                    })}
                  </div>;
                })}

                {taskForm&&(
                  <div style={{padding:"12px 15px",borderTop:"1px solid var(--border-2)",background:"var(--bg-sidebar)"}}>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>{taskForm.id?"Edit Task":"New Task"}</div>
                    <div style={{marginBottom:8}}>
                      <label className="lbl">Title *</label><input className="inp" value={taskForm.title} onChange={function(e){setTaskForm(function(f){return{...f,title:e.target.value};})}} placeholder="Task description"/>
                    </div>
                    <div className="g3" style={{marginBottom:8}}>
                      <div><label className="lbl">Assign Crew</label>
                        <select className="inp" value={taskForm.assignedTo||""} onChange={function(e){setTaskForm(function(f){return{...f,assignedTo:e.target.value?Number(e.target.value):null};});}}>
                          <option value="">Unassigned</option>
                          {subs.filter(function(s){return s.status==="active";}).map(function(s){return <option key={s.id} value={s.id}>{s.name} — {s.role}</option>;})}
                        </select>
                      </div>
                      <div><label className="lbl">Status</label>
                        <select className="inp" value={taskForm.status} onChange={function(e){setTaskForm(function(f){return{...f,status:e.target.value};});}}>
                          <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option>
                        </select>
                      </div>
                      <div><label className="lbl">Due Date</label><input className="inp" type="date" value={taskForm.dueDate||""} onChange={function(e){setTaskForm(function(f){return{...f,dueDate:e.target.value};});}}/></div>
                    </div>
                    <div style={{marginBottom:8}}><label className="lbl">Notes</label><input className="inp" value={taskForm.notes||""} onChange={function(e){setTaskForm(function(f){return{...f,notes:e.target.value};});}} placeholder="Optional notes"/></div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={function(){setTaskForm(null);}} className="bb b-gh" style={{flex:1,padding:"8px",justifyContent:"center"}}>Cancel</button>
                      <button onClick={saveTask} className="bb b-bl" style={{flex:2,padding:"8px",justifyContent:"center"}}><I n="check" s={12}/>{taskForm.id?"Update":"Add"} Task</button>
                    </div>
                  </div>
                )}
              </div>;
            })()}
          </div>}
          {detailTab==='contracts'&&<div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}><ContractsModule projectId={sp.id} apiBaseUrl="/api" company={company} scopeTemplates={scopeTemplates} exclusionTemplates={exclusionTemplates}/></div>}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"var(--text-ghost)",gap:12}}>
          <I n="projects" s={40}/><div style={{fontSize:14,fontWeight:600}}>Select a project</div>
          <button onClick={openNew} className="bb b-bl" style={{padding:"8px 16px",fontSize:12,marginTop:4}}><I n="plus" s={13}/>New Project</button>
        </div>
      )}

      {form&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="mo" style={{maxWidth:640,marginTop:20}}>
            <div style={{padding:"17px 24px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:17,fontWeight:800}}>{form._id?"Edit Project":"New Project"}</div>
              <button onClick={()=>setForm(null)} style={{color:"var(--text-dim)"}}><I n="x"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:13,overflowY:"auto",maxHeight:"78vh"}}>
              <div className="g2">
                <div><label className="lbl">Project Name *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Kitchen Full Remodel"/></div>
                <div><label className="lbl">Customer *</label>
                  <select className="inp" value={form.custId} onChange={e=>setForm(f=>({...f,custId:Number(e.target.value)}))}>
                    <option value="">— Select —</option>
                    {custs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="g3">
                <div><label className="lbl">Status</label>
                  <select className="inp" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {["active","on_hold","complete","cancelled"].map(s=><option key={s} value={s}>{PRJ_SC[s]?.label||s}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Phase</label>
                  <select className="inp" value={form.phase} onChange={e=>setForm(f=>({...f,phase:e.target.value}))}>
                    {PHASES.map(ph=><option key={ph}>{ph}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Progress %</label><input className="inp" type="number" min="0" max="100" value={form.progress} onChange={e=>setForm(f=>({...f,progress:e.target.value}))}/></div>
              </div>
              <div className="g3">
                <div><label className="lbl">Contract Value</label><input className="inp" type="number" value={form.contractValue} onChange={e=>setForm(f=>({...f,contractValue:e.target.value}))}/></div>
                <div><label className="lbl">Budget Labor</label><input className="inp" type="number" value={form.budgetLabor} onChange={e=>setForm(f=>({...f,budgetLabor:e.target.value}))}/></div>
                <div><label className="lbl">Budget Materials</label><input className="inp" type="number" value={form.budgetMaterials} onChange={e=>setForm(f=>({...f,budgetMaterials:e.target.value}))}/></div>
              </div>
              <div className="g3">
                <div><label className="lbl">Actual Labor</label><input className="inp" type="number" value={form.actualLabor} onChange={e=>setForm(f=>({...f,actualLabor:e.target.value}))}/></div>
                <div><label className="lbl">Actual Materials</label><input className="inp" type="number" value={form.actualMaterials} onChange={e=>setForm(f=>({...f,actualMaterials:e.target.value}))}/></div>
                <div/>
              </div>
              <div className="g2">
                <div><label className="lbl">Start Date</label><input className="inp" type="date" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))}/></div>
                <div><label className="lbl">End Date</label><input className="inp" type="date" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))}/></div>
              </div>
              <div><label className="lbl">Notes</label><textarea className="inp" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{resize:"vertical"}}/></div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setForm(null)} className="bb b-gh" style={{flex:1,padding:"10px",justifyContent:"center"}}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{flex:2,padding:"10px",fontSize:13,justifyContent:"center"}}><I n="check" s={13}/>{form._id?"Update":"Create"} Project</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
