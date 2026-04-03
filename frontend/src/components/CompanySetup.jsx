import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../api';
import { USER_ROLES, USER_ROLE_C, USR_SC, MGMT_ROLES, USER_ROLE_PERMS } from '../constants';
import { uid, tod } from '../utils/calculations';
import { I } from './shared/Icons';
import { Chip, ToggleSwitch, KpiCard, ES, ini } from './shared/ui';
import LaborRoles from './LaborRoles';
import ScopeTemplates from './ScopeTemplates';
import ExclusionTemplates from './ExclusionTemplates';

export default function CompanySetup({company,setCompany,users,setUsers,showToast,db,auth,roles,setRoles,phases,setPhases,scopeTemplates,setScopeTemplates,exclusionTemplates,setExclusionTemplates}) {
  const [stab, setStab] = useState("users");
  const [dirty, setDirty] = useState(false);
  // Always initialize form from latest company data
  const [form, setForm] = useState({...company});
  // Re-sync form from company whenever company changes (e.g., after API load or save)
  const companyJson = JSON.stringify(company);
  useEffect(()=>{
    if(!dirty){
      //removed;
      setForm({...company});
    }
  },[companyJson]);
  const [uForm, setUForm] = useState(null);
  const [srch, setSrch] = useState("");
  const [roleF, setRoleF] = useState("All");
  const [testingEmail, setTestingEmail] = useState(false);
  const logoRef = useRef(null);

  const upd=(k,v)=>{setForm(f=>({...f,[k]:v}));setDirty(true);};
  const saveCompany=async ()=>{
    try {
      var data = {};
      ['name','owner','phone','email','address','website','license','ein','logo',
       'defaultTaxRate','paymentTerms','laborBurdenDefault','invoiceFooter','estimateFooter',
       'smtpHost','smtpPort','smtpUser','smtpPass','smtpSecure',
       'emailFromName','emailReplyTo','emailSignature',
       'emailSubjectEstimate','emailSubjectInvoice','emailBodyEstimate','emailBodyInvoice',
       'notifyEstimateSent','notifyEstimateApproved','notifyEstimateDeclined',
       'notifyInvoiceSent','notifyInvoicePaid','notifyInvoiceOverdue','notifyPaymentReminder',
       'reminderDaysBefore','overdueFollowupDays',
       'themeAccent','themeName'
      ].forEach(function(k){ if(form[k]!==undefined) data[k]=form[k]; });
      //removed;
      var result = await api.company.update(data);
      //removed;
      setCompany(result);
      setForm({...result});
      setDirty(false);
      showToast("Company settings saved");
      return true;
    } catch(err) {
      console.error('SAVE COMPANY FAIL:', err);
      showToast("Save failed: "+err.message,"error");
      return false;
    }
  };

  const sendTestEmail=async ()=>{
    setTestingEmail(true);
    try {
      // Save first so the DB has latest SMTP settings
      var saved = await saveCompany();
      if (!saved) { setTestingEmail(false); return; }
      // Now send test
      var result = await api.email.test();
      showToast(result.message || "Test email sent to "+form.smtpUser);
    } catch(err) {
      showToast(err.message || "SMTP test failed","error");
    }
    setTestingEmail(false);
  };

  const STABS=[
    {id:"users",label:"Users & Roles",icon:"customers"},
    {id:"roles",label:"Role Permissions",icon:"shield"},
    {id:"labor",label:"Labor Roles",icon:"wrench"},
    {id:"admin_roles",label:"Company Roles",icon:"building"},
    {id:"scope_tpl",label:"Scope Templates",icon:"estimates"},
    {id:"exclusion_tpl",label:"Exclusion Templates",icon:"estimates"},
    {id:"email",label:"Email & Notifications",icon:"bell"},
    {id:"theme",label:"Theme & Branding",icon:"palette"},
    {id:"company",label:"Company Info",icon:"settings"},
  ];

  const filt=useMemo(()=>users.filter(u=>{
    const ms=!srch||u.name.toLowerCase().includes(srch.toLowerCase())||u.email.toLowerCase().includes(srch.toLowerCase());
    return ms&&(roleF==="All"||u.role===roleF);
  }),[users,srch,roleF]);

  const roleCounts=useMemo(()=>{
    const c={};
    users.forEach(u=>{c[u.role]=(c[u.role]||0)+1;});
    return c;
  },[users]);

  const canManageUsers = auth && ["Owner","Admin"].includes(auth.role);
  const blankUser={name:"",email:"",phone:"",role:"Field Tech",status:"invited"};
  const openNewUser=()=>setUForm({...blankUser,_id:null});
  const openEditUser=u=>setUForm({...u,_id:u.id});

  const saveUser=()=>{
    if(!uForm.name.trim()){showToast("Name required","error");return;}
    if(!uForm.email.trim()){showToast("Email required","error");return;}
    if(uForm._id){
      db.users.update(uForm._id,{name:uForm.name,email:uForm.email,phone:uForm.phone,role:uForm.role,status:uForm.status});
      showToast("User updated");
    } else {
      const nu={...uForm,id:uid(),lastLogin:null,createdAt:tod()};
      db.users.create(nu);
      showToast("User invited");
    }
    setUForm(null);
  };

  const toggleStatus=(id)=>{
    const u=users.find(x=>x.id===id);
    if(!u) return;
    if(u.role==="Owner"){showToast("Cannot disable Owner","error");return;}
    const newSt=u.status==="active"?"disabled":"active";
    db.users.update(id,{status:newSt});
  };

  const delUser=(id)=>{
    const u=users.find(x=>x.id===id);
    if(u?.role==="Owner"){showToast("Cannot remove Owner","error");return;}
    db.users.remove(id);
    showToast("User removed");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {/* SUB-TAB NAV */}
      <div className="sub-tabs" style={{display:"flex",gap:2,background:"var(--bg-sidebar)",borderRadius:10,padding:3,border:"1px solid var(--border)",width:"fit-content",maxWidth:"100%",overflowX:"auto"}}>
        {STABS.map(t=>(
          <button key={t.id} onClick={()=>setStab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:700,color:stab===t.id?"#63b3ed":"var(--text-dim)",background:stab===t.id?"rgba(99,179,237,.1)":"transparent",transition:"all .18s",border:"none",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            <I n={t.icon} s={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {stab==="users"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* KPI cards */}
          <div className="g4">
            {[
              {l:"Total Users",v:users.length,c:"#63b3ed"},
              {l:"Active",v:users.filter(u=>u.status==="active").length,c:"#22c55e"},
              {l:"Invited",v:users.filter(u=>u.status==="invited").length,c:"#f5a623"},
              {l:"Disabled",v:users.filter(u=>u.status==="disabled").length,c:"#ef4444"},
            ].map(k=><KpiCard key={k.l} label={k.l} val={k.v} sub="" color={k.c}/>)}
          </div>

          {/* Role distribution */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
            {USER_ROLES.map(r=>{
              const cnt=roleCounts[r]||0;
              const rc=USER_ROLE_C[r]||"#4a566e";
              return (
                <button key={r} onClick={()=>setRoleF(roleF===r?"All":r)} style={{background:roleF===r?`${rc}14`:"var(--bg-card)",border:`1px solid ${roleF===r?rc:"var(--border)"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:2,background:rc}}/>
                    <span style={{fontSize:11,fontWeight:700,color:roleF===r?rc:"var(--text-muted)"}}>{r}</span>
                  </div>
                  <div className="mn" style={{fontSize:18,color:roleF===r?rc:"var(--text-dim)"}}>{cnt}</div>
                  <div style={{fontSize:9,color:"var(--text-faint)",marginTop:2}}>{USER_ROLE_PERMS[r]?.length||0} permissions</div>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="search" s={13}/></div>
                <input className="inp" placeholder="Search users…" value={srch} onChange={e=>setSrch(e.target.value)} style={{paddingLeft:30,width:220,fontSize:12,height:34}}/>
              </div>
              {roleF!=="All"&&<button onClick={()=>setRoleF("All")} className="bb b-gh" style={{padding:"5px 10px",fontSize:10}}>Clear filter <I n="x" s={10}/></button>}
            </div>
            {canManageUsers&&<button onClick={openNewUser} className="bb b-bl" style={{padding:"8px 16px",fontSize:12}}><I n="user-plus" s={14}/>Add User</button>}
          </div>

          {/* Users table */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:520}}>
              <thead>
                <tr style={{background:"var(--bg-sidebar)"}}>
                  {["User","Email","Phone","Role","Status","Last Login","Actions"].map(h=>
                    <th key={h} style={{padding:"8px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.4,borderBottom:"1px solid var(--border)"}}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filt.length===0&&<tr><td colSpan={7}><ES icon="customers" text="No users found"/></td></tr>}
                {filt.map((u,i)=>{
                  const rc=USER_ROLE_C[u.role]||"#4a566e";
                  return (
                    <tr key={u.id} className="rh" style={{borderTop:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                      <td style={{padding:"8px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${rc},${rc}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}}>{ini(u.name)}</div>
                          <span style={{fontWeight:700,color:"var(--text-2)"}}>{u.name}</span>
                        </div>
                      </td>
                      <td className="mn" style={{padding:"8px 14px",color:"var(--text-muted)",fontSize:10}}>{u.email}</td>
                      <td className="mn" style={{padding:"8px 14px",color:"var(--text-dim)",fontSize:10}}>{u.phone||"—"}</td>
                      <td style={{padding:"8px 14px"}}>
                        <span style={{fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:8,background:`${rc}18`,color:rc}}>{u.role}</span>
                      </td>
                      <td style={{padding:"8px 14px"}}><Chip s={u.status} map={USR_SC}/></td>
                      <td className="mn" style={{padding:"8px 14px",color:"var(--text-dim)",fontSize:10}}>{u.lastLogin||"Never"}</td>
                      <td style={{padding:"8px 14px"}}>
                        {canManageUsers&&<div style={{display:"flex",gap:4}}>
                          <button onClick={()=>openEditUser(u)} title="Edit" style={{padding:5,color:"var(--text-dim)",borderRadius:6,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.color="#63b3ed";}} onMouseLeave={e=>{e.currentTarget.style.color="var(--text-dim)";}}><I n="edit" s={13}/></button>
                          <button onClick={()=>toggleStatus(u.id)} title={u.status==="active"?"Disable":"Enable"} style={{padding:5,color:"var(--text-dim)",borderRadius:6,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.color=u.status==="active"?"#ef4444":"#22c55e";}} onMouseLeave={e=>{e.currentTarget.style.color="var(--text-dim)";}}>{u.status==="active"?<I n="x" s={13}/>:<I n="check" s={13}/>}</button>
                          <button onClick={()=>delUser(u.id)} title="Remove" style={{padding:5,color:"var(--text-dim)",borderRadius:6,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";}} onMouseLeave={e=>{e.currentTarget.style.color="var(--text-dim)";}}><I n="trash" s={13}/></button>
                        </div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ROLE PERMISSIONS TAB ── */}
      {stab==="roles"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6}}>Each role grants a specific set of module permissions. Users inherit all permissions from their assigned role.</div>
          <div className="g2">
            {USER_ROLES.map(r=>{
              const rc=USER_ROLE_C[r]||"#4a566e";
              const perms=USER_ROLE_PERMS[r]||[];
              const cnt=roleCounts[r]||0;
              return (
                <div key={r} className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 18px",overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:rc,opacity:.04,borderRadius:"0 0 0 60px"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:10,height:10,borderRadius:3,background:rc}}/>
                      <span style={{fontSize:14,fontWeight:800,color:"var(--text)"}}>{r}</span>
                    </div>
                    <span className="mn" style={{fontSize:10,color:rc}}>{cnt} user{cnt!==1?"s":""}</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {perms.map(p=>(
                      <span key={p} style={{fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:6,background:"rgba(99,179,237,.06)",color:"var(--text-muted)",border:"1px solid var(--border-2)"}}>{p}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LABOR ROLES TAB (trade roles only) ── */}
      {stab==="labor"&&(
        <LaborRoles roles={roles} setRoles={setRoles} showToast={showToast} db={db} filterFn={function(r){return !MGMT_ROLES.has(r.title);}} heading="Labor Roles"/>
      )}

      {/* ── ADMIN ROLES TAB (management roles only) ── */}
      {stab==="admin_roles"&&(
        <LaborRoles roles={roles} setRoles={setRoles} showToast={showToast} db={db} filterFn={function(r){return MGMT_ROLES.has(r.title);}} heading="Administrative Roles"/>
      )}

      {/* ── SCOPE TEMPLATES TAB ── */}
      {stab==="scope_tpl"&&(
        <ScopeTemplates templates={scopeTemplates} showToast={showToast} db={db.scopeTemplates}/>
      )}

      {/* ── EXCLUSION TEMPLATES TAB ── */}
      {stab==="exclusion_tpl"&&(
        <ExclusionTemplates templates={exclusionTemplates} showToast={showToast} db={db.exclusionTemplates}/>
      )}

      {/* ── COMPANY INFO TAB ── */}
      {stab==="company"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:780}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>Business Information</div>
              <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Business info, defaults, and document footers</div>
            </div>
            <button onClick={saveCompany} className={`bb ${dirty?"b-bl":"b-gh"}`} style={{padding:"8px 18px",fontSize:12}}><I n="check" s={13}/>Save Changes</button>
          </div>

          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">Business Information</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="g2">
                <div><label className="lbl">Company Name</label><input className="inp" value={form.name} onChange={e=>upd("name",e.target.value)}/></div>
                <div><label className="lbl">Owner / Principal</label><input className="inp" value={form.owner} onChange={e=>upd("owner",e.target.value)}/></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e=>upd("phone",e.target.value)}/></div>
                <div><label className="lbl">Email</label><input className="inp" value={form.email} onChange={e=>upd("email",e.target.value)}/></div>
              </div>
              <div><label className="lbl">Address</label><input className="inp" value={form.address} onChange={e=>upd("address",e.target.value)}/></div>
              <div className="g2">
                <div><label className="lbl">Website</label><input className="inp" value={form.website} onChange={e=>upd("website",e.target.value)}/></div>
                <div><label className="lbl">License #</label><input className="inp" value={form.license} onChange={e=>upd("license",e.target.value)}/></div>
              </div>
              <div className="g2">
                <div><label className="lbl">EIN / Tax ID</label><input className="inp" value={form.ein} onChange={e=>upd("ein",e.target.value)}/></div>
                <div/>
              </div>
            </div>
          </div>

          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">Default Settings</div>
            <div className="g3">
              <div><label className="lbl">Default Tax Rate %</label><input className="inp" type="number" step=".1" value={form.defaultTaxRate} onChange={e=>upd("defaultTaxRate",Number(e.target.value)||0)}/></div>
              <div><label className="lbl">Payment Terms (days)</label><input className="inp" type="number" value={form.paymentTerms} onChange={e=>upd("paymentTerms",Number(e.target.value)||0)}/></div>
              <div><label className="lbl">Default Labor Burden %</label><input className="inp" type="number" step=".1" value={form.laborBurdenDefault} onChange={e=>upd("laborBurdenDefault",Number(e.target.value)||0)}/></div>
            </div>
          </div>

          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">Document Footers</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label className="lbl">Invoice Footer</label><textarea className="inp" value={form.invoiceFooter} onChange={e=>upd("invoiceFooter",e.target.value)} rows={2} style={{resize:"vertical",lineHeight:1.6}}/></div>
              <div><label className="lbl">Estimate Footer</label><textarea className="inp" value={form.estimateFooter} onChange={e=>upd("estimateFooter",e.target.value)} rows={2} style={{resize:"vertical",lineHeight:1.6}}/></div>
            </div>
          </div>

          <div style={{background:"rgba(59,130,246,.04)",border:"1px solid rgba(59,130,246,.15)",borderRadius:10,padding:"12px 16px"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#3b82f6",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Current Configuration</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:11,color:"var(--text-muted)"}}>
              <span>Tax: <span className="mn" style={{color:"#f5a623"}}>{form.defaultTaxRate}%</span></span>
              <span>Terms: <span className="mn" style={{color:"#3b82f6"}}>Net {form.paymentTerms}</span></span>
              <span>Burden: <span className="mn" style={{color:"#ef4444"}}>{form.laborBurdenDefault}%</span></span>
              <span>License: <span className="mn" style={{color:"#22c55e"}}>{form.license||"—"}</span></span>
              <span>EIN: <span className="mn" style={{color:"#a78bfa"}}>{form.ein||"—"}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL & NOTIFICATIONS TAB ── */}
      {stab==="email"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:820}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>Email & Notification Setup</div>
              <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Configure outgoing email for estimates, invoices, and payment reminders</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={sendTestEmail} disabled={testingEmail} className="bb b-am" style={{padding:"8px 14px",fontSize:11}}><I n="send" s={12}/>{testingEmail?"Sending...":"Send Test"}</button>
              <button onClick={saveCompany} className={`bb ${dirty?"b-bl":"b-gh"}`} style={{padding:"8px 18px",fontSize:12}}><I n="check" s={13}/>Save</button>
            </div>
          </div>

          {/* SMTP Settings */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">SMTP Server Configuration</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="g3">
                <div><label className="lbl">SMTP Host</label><input className="inp" value={form.smtpHost||""} onChange={e=>upd("smtpHost",e.target.value)} placeholder="smtp.gmail.com"/></div>
                <div><label className="lbl">Port</label><input className="inp" type="number" value={form.smtpPort||587} onChange={e=>upd("smtpPort",Number(e.target.value)||587)}/></div>
                <div><label className="lbl">Encryption</label>
                  <div style={{display:"flex",gap:8,marginTop:2}}>
                    {["TLS","SSL","None"].map(s=>(
                      <button key={s} onClick={()=>upd("smtpSecure",s!=="None")} style={{flex:1,padding:"8px 0",borderRadius:8,fontSize:11,fontWeight:700,border:"1px solid "+(form.smtpSecure===(s!=="None")?"#3b82f6":"var(--border-2)"),background:form.smtpSecure===(s!=="None")?"rgba(59,130,246,.1)":"transparent",color:form.smtpSecure===(s!=="None")?"#63b3ed":"var(--text-dim)",cursor:"pointer",transition:"all .15s"}}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="g2">
                <div><label className="lbl">SMTP Username / Email</label><input className="inp" value={form.smtpUser||""} onChange={e=>upd("smtpUser",e.target.value)} placeholder="you@company.com"/></div>
                <div><label className="lbl">SMTP Password / App Key</label><input className="inp" type="password" value={form.smtpPass||""} onChange={e=>upd("smtpPass",e.target.value)} placeholder="App-specific password"/></div>
              </div>
            </div>
          </div>

          {/* Sender identity */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">Sender Identity</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="g2">
                <div><label className="lbl">From Name</label><input className="inp" value={form.emailFromName||""} onChange={e=>upd("emailFromName",e.target.value)} placeholder="Your Company LLC"/></div>
                <div><label className="lbl">Reply-To Address</label><input className="inp" value={form.emailReplyTo||""} onChange={e=>upd("emailReplyTo",e.target.value)} placeholder="reply@company.com"/></div>
              </div>
              <div><label className="lbl">Email Signature</label><textarea className="inp" value={form.emailSignature||""} onChange={e=>upd("emailSignature",e.target.value)} rows={3} style={{resize:"vertical",lineHeight:1.6}} placeholder="Best regards,&#10;Name&#10;Company"/></div>
            </div>
          </div>

          {/* Email templates */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">Email Templates</div>
            <div style={{fontSize:10,color:"var(--text-dim)",marginBottom:12,lineHeight:1.6}}>Use placeholders: <span className="mn" style={{color:"#63b3ed",fontSize:9}}>{"{customer}"} {"{company}"} {"{number}"} {"{project}"} {"{total}"} {"{dueDate}"}</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{padding:"14px 16px",background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#14b8a6",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><I n="estimates" s={13}/>Estimate Email</div>
                <div style={{marginBottom:8}}><label className="lbl">Subject Line</label><input className="inp" value={form.emailSubjectEstimate||""} onChange={e=>upd("emailSubjectEstimate",e.target.value)}/></div>
                <div><label className="lbl">Body</label><textarea className="inp" value={form.emailBodyEstimate||""} onChange={e=>upd("emailBodyEstimate",e.target.value)} rows={4} style={{resize:"vertical",lineHeight:1.6,fontSize:12}}/></div>
              </div>
              <div style={{padding:"14px 16px",background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#3b82f6",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><I n="invoices" s={13}/>Invoice Email</div>
                <div style={{marginBottom:8}}><label className="lbl">Subject Line</label><input className="inp" value={form.emailSubjectInvoice||""} onChange={e=>upd("emailSubjectInvoice",e.target.value)}/></div>
                <div><label className="lbl">Body</label><textarea className="inp" value={form.emailBodyInvoice||""} onChange={e=>upd("emailBodyInvoice",e.target.value)} rows={4} style={{resize:"vertical",lineHeight:1.6,fontSize:12}}/></div>
              </div>
            </div>
          </div>

          {/* Notification triggers */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px"}}>
            <div className="stl">Automatic Notifications</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {k:"notifyEstimateSent",l:"Estimate Sent",d:"Email customer when an estimate is sent",icon:"estimates",c:"#14b8a6"},
                {k:"notifyEstimateApproved",l:"Estimate Approved",d:"Notify team when customer approves",icon:"check",c:"#22c55e"},
                {k:"notifyEstimateDeclined",l:"Estimate Declined",d:"Alert team when customer declines",icon:"x",c:"#ef4444"},
                {k:"notifyInvoiceSent",l:"Invoice Sent",d:"Email customer when invoice is sent",icon:"invoices",c:"#3b82f6"},
                {k:"notifyInvoicePaid",l:"Invoice Paid",d:"Confirm payment receipt to customer",icon:"check",c:"#22c55e"},
                {k:"notifyInvoiceOverdue",l:"Invoice Overdue",d:"Auto-send overdue notice to customer",icon:"alert",c:"#ef4444"},
                {k:"notifyPaymentReminder",l:"Payment Reminder",d:"Send reminder before due date",icon:"clock",c:"#f5a623"},
              ].map(n=>(
                <div key={n.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <div style={{color:n.c}}><I n={n.icon} s={15}/></div>
                    <div><div style={{fontSize:12,fontWeight:600,color:"var(--text-2)"}}>{n.l}</div><div style={{fontSize:10,color:"var(--text-dim)"}}>{n.d}</div></div>
                  </div>
                  <ToggleSwitch on={form[n.k]!==false} onChange={v=>upd(n.k,v)}/>
                </div>
              ))}
            </div>
            <div className="g2" style={{marginTop:14}}>
              <div><label className="lbl">Reminder Days Before Due</label><input className="inp" type="number" value={form.reminderDaysBefore||3} onChange={e=>upd("reminderDaysBefore",Number(e.target.value)||1)}/></div>
              <div><label className="lbl">Overdue Follow-up Every (days)</label><input className="inp" type="number" value={form.overdueFollowupDays||7} onChange={e=>upd("overdueFollowupDays",Number(e.target.value)||7)}/></div>
            </div>
          </div>
        </div>
      )}

      {/* ── THEME & BRANDING TAB ── */}
      {stab==="theme"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:820}}>
          <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
            const file=e.target.files?.[0];
            if(!file)return;
            if(!file.type.startsWith("image/")){showToast("Please select an image file","error");return;}
            if(file.size>5*1024*1024){showToast("Image must be under 5MB","error");return;}
            const reader=new FileReader();
            reader.onload=ev=>{upd("logo",ev.target.result);showToast("Logo uploaded");};
            reader.readAsDataURL(file);
          }}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>Theme & Branding</div>
              <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Upload your company logo and choose your accent color</div>
            </div>
            <button onClick={saveCompany} className={`bb ${dirty?"b-bl":"b-gh"}`} style={{padding:"8px 18px",fontSize:12}}><I n="check" s={13}/>Save Changes</button>
          </div>

          {/* Company logo */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,padding:"24px 28px"}}>
            <div className="stl">Company Logo</div>
            <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
              <div style={{width:140,height:140,borderRadius:14,border:"2px dashed "+(form.logo?"transparent":"var(--border-2)"),background:form.logo?"transparent":"var(--bg-sidebar)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,position:"relative",cursor:"pointer",transition:"border-color .2s"}} onClick={()=>logoRef.current?.click()} onMouseEnter={e=>{if(!form.logo)e.currentTarget.style.borderColor="#3b82f6";}} onMouseLeave={e=>{if(!form.logo)e.currentTarget.style.borderColor="var(--border-2)";}}>
                {form.logo ? (
                  <img src={form.logo} alt="Company Logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:8}}/>
                ) : (
                  <>
                    <I n="image" s={28}/>
                    <div style={{fontSize:10,color:"var(--text-dim)",marginTop:6,fontWeight:600}}>Click to upload</div>
                    <div style={{fontSize:9,color:"var(--text-faint)",marginTop:2}}>PNG, JPG, SVG</div>
                  </>
                )}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-2)",marginBottom:6}}>Logo Guidelines</div>
                <div style={{fontSize:11,color:"var(--text-dim)",lineHeight:1.8}}>
                  Your logo appears on printed estimates, invoices, and PDF exports. For best results use a transparent PNG or SVG at least 400px wide. Max file size is 5MB.
                </div>
                <div style={{display:"flex",gap:8,marginTop:14}}>
                  <button onClick={()=>logoRef.current?.click()} className="bb b-bl" style={{padding:"8px 14px",fontSize:11}}><I n="upload" s={12}/>{form.logo?"Replace Logo":"Upload Logo"}</button>
                  {form.logo&&<button onClick={()=>{upd("logo",null);showToast("Logo removed");}} className="bb b-rd" style={{padding:"8px 14px",fontSize:11}}><I n="trash" s={12}/>Remove</button>}
                </div>
              </div>
            </div>
            {/* Logo preview on document mock */}
            {form.logo&&(
              <div style={{marginTop:18,padding:"16px 20px",background:"#fff",borderRadius:10,maxWidth:400}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"2px solid #1a1a2e",paddingBottom:10,marginBottom:8}}>
                  <div><img src={form.logo} alt="Logo" style={{height:36,objectFit:"contain"}}/><div style={{fontSize:8,color:"#888",marginTop:3}}>{form.name}</div></div>
                  <div style={{textAlign:"right",fontSize:7,color:"#888",lineHeight:1.7}}>{form.address}<br/>{form.phone}<br/>{form.email}</div>
                </div>
                <div style={{fontSize:8,fontWeight:700,color:"#1a1a2e"}}>ESTIMATE #EST-2026-007</div>
                <div style={{fontSize:7,color:"#888",marginTop:2}}>Preview of how your logo appears on documents</div>
              </div>
            )}
          </div>

          {/* Accent color */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,padding:"24px 28px"}}>
            <div className="stl">Accent Color</div>
            <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:16}}>Choose a primary accent color for your workspace. This color is used for buttons, links, active states, and document headers.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:10,marginBottom:18}}>
              {[
                {name:"Ocean Blue",color:"#3b82f6"},
                {name:"Emerald",color:"#22c55e"},
                {name:"Sunset Orange",color:"#f97316"},
                {name:"Royal Purple",color:"#8b5cf6"},
                {name:"Crimson",color:"#ef4444"},
                {name:"Teal",color:"#14b8a6"},
                {name:"Amber",color:"#f59e0b"},
                {name:"Rose",color:"#ec4899"},
                {name:"Sky",color:"#0ea5e9"},
                {name:"Lime",color:"#84cc16"},
                {name:"Indigo",color:"#6366f1"},
                {name:"Slate",color:"#64748b"},
              ].map(t=>{
                const active=form.themeAccent===t.color;
                return (
                  <button key={t.color} onClick={()=>{upd("themeAccent",t.color);upd("themeName",t.name);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 8px",borderRadius:10,border:active?("2px solid "+t.color):"2px solid var(--border)",background:active?(t.color+"10"):"transparent",cursor:"pointer",transition:"all .18s"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.borderColor=t.color+"60";}} onMouseLeave={e=>{if(!active)e.currentTarget.style.borderColor=active?t.color:"var(--border)";}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:t.color,boxShadow:active?("0 4px 16px "+t.color+"50"):"none",transition:"box-shadow .2s",display:"flex",alignItems:"center",justifyContent:"center"}}>{active&&<I n="check" s={14}/>}</div>
                    <span style={{fontSize:9,fontWeight:active?700:500,color:active?t.color:"var(--text-dim)"}}>{t.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom color picker */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)"}}>
              <input type="color" value={form.themeAccent||"var(--accent)"} onChange={e=>{upd("themeAccent",e.target.value);upd("themeName","Custom");}} style={{width:36,height:36,border:"none",borderRadius:8,cursor:"pointer",background:"none",padding:0}}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--text-2)"}}>Custom Color</div>
                <div className="mn" style={{fontSize:11,color:"var(--text-dim)"}}>{form.themeAccent||"var(--accent)"}</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:"var(--text-dim)"}}>Current:</span>
                <div style={{width:20,height:20,borderRadius:5,background:form.themeAccent||"var(--accent)"}}/>
                <span className="mn" style={{fontSize:10,color:form.themeAccent||"var(--accent)"}}>{form.themeName||"Ocean Blue"}</span>
              </div>
            </div>
          </div>

          {/* Preview section */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,padding:"24px 28px"}}>
            <div className="stl">Live Preview</div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",marginBottom:16}}>
              <button style={{padding:"9px 18px",borderRadius:8,background:form.themeAccent||"var(--accent)",color:"#fff",fontWeight:700,fontSize:12,border:"none",fontFamily:"inherit"}}>Primary Button</button>
              <button style={{padding:"9px 18px",borderRadius:8,background:"transparent",color:form.themeAccent||"var(--accent)",fontWeight:700,fontSize:12,border:"1px solid "+(form.themeAccent||"var(--accent)"),fontFamily:"inherit"}}>Ghost Button</button>
              <span style={{fontSize:10,fontWeight:700,padding:"4px 11px",borderRadius:10,background:(form.themeAccent||"var(--accent)")+"18",color:form.themeAccent||"var(--accent)"}}>Status Chip</span>
              <div style={{height:6,width:120,borderRadius:3,background:"var(--border)",overflow:"hidden"}}><div style={{height:"100%",width:"68%",borderRadius:3,background:form.themeAccent||"var(--accent)"}}/></div>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:12,height:12,borderRadius:3,background:form.themeAccent||"var(--accent)"}}/><span style={{fontSize:11,color:"var(--text-muted)"}}>Legend item</span></div>
            </div>
            <div style={{padding:"12px 16px",background:"var(--bg)",borderRadius:8,border:"1px solid var(--border)",fontSize:11,color:"var(--text-dim)",lineHeight:1.7}}>
              This preview shows how your accent color will appear across the app. The sidebar active state, buttons, progress bars, charts, and status chips will all use <span style={{color:form.themeAccent||"var(--accent)",fontWeight:700}}>{form.themeName||"Ocean Blue"}</span> as the primary accent.
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT USER MODAL ── */}
      {uForm&&(
        <div className="ov" onClick={()=>setUForm(null)}>
          <div className="mo" style={{maxWidth:520,marginTop:60}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:800,fontSize:15}}>{uForm._id?"Edit User":"Invite New User"}</div>
              <button onClick={()=>setUForm(null)} style={{color:"var(--text-dim)",padding:4}}><I n="x" s={16}/></button>
            </div>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
              <div className="g2">
                <div><label className="lbl">Full Name</label><input className="inp" placeholder="e.g. Sarah Kim" value={uForm.name} onChange={e=>setUForm({...uForm,name:e.target.value})}/></div>
                <div><label className="lbl">Email</label><input className="inp" placeholder="user@company.com" value={uForm.email} onChange={e=>setUForm({...uForm,email:e.target.value})}/></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Phone</label><input className="inp" placeholder="(555) 000-0000" value={uForm.phone} onChange={e=>setUForm({...uForm,phone:e.target.value})}/></div>
                <div>
                  <label className="lbl">Role</label>
                  {canManageUsers
                    ?<select className="inp" value={uForm.role} onChange={e=>setUForm({...uForm,role:e.target.value})}>
                      {USER_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                    :<input className="inp" value={uForm.role} readOnly style={{opacity:.6,cursor:"not-allowed"}}/>
                  }
                </div>
              </div>
              {uForm._id&&(
                <div>
                  <label className="lbl">Status</label>
                  <select className="inp" value={uForm.status} onChange={e=>setUForm({...uForm,status:e.target.value})}>
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              )}
              {/* Role permission preview */}
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Permissions for {uForm.role}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(USER_ROLE_PERMS[uForm.role]||[]).map(p=>(
                    <span key={p} style={{fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:6,background:`${USER_ROLE_C[uForm.role]||"#4a566e"}12`,color:USER_ROLE_C[uForm.role]||"var(--text-muted)",border:"1px solid var(--border-2)"}}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{padding:"14px 20px",borderTop:"1px solid var(--border-2)",display:"flex",justifyContent:"flex-end",gap:9}}>
              <button onClick={()=>setUForm(null)} className="bb b-gh" style={{padding:"8px 16px",fontSize:12}}>Cancel</button>
              <button onClick={saveUser} className="bb b-bl" style={{padding:"8px 20px",fontSize:12}}><I n={uForm._id?"check":"send"} s={13}/>{uForm._id?"Save Changes":"Send Invite"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMAIL SEND MODAL ──────────────────────────────────────────
