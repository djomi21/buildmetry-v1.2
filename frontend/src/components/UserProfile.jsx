import { useState, useRef } from 'react';
import api from '../api';
import { USER_ROLE_C, USER_ROLE_PERMS } from '../constants';
import { I } from './shared/Icons';
import { Chip, ToggleSwitch } from './shared/ui';
import { ini } from './shared/ui';

export default function UserProfile({auth,setAuth,updateAuth,users,setUsers,company,showToast,setTab,handleLogout}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({name:auth.name,email:auth.email,phone:auth.phone||""});
  const [passForm, setPassForm] = useState({current:"",newPass:"",confirm:""});
  const [showPassSection, setShowPassSection] = useState(false);
  const [showPass, setShowPass] = useState({current:false,newPass:false,confirm:false});
  const fileRef = useRef(null);

  const rc = USER_ROLE_C[auth.role] || "#3b82f6";
  const perms = USER_ROLE_PERMS[auth.role] || [];
  const memberSince = auth.createdAt ? new Date(auth.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "Unknown";
  const lastLogin = auth.lastLogin ? new Date(auth.lastLogin).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "Never";

  const saveProfile = async () => {
    if (!form.name.trim()) { showToast("Name is required","error"); return; }
    if (!form.email.trim()) { showToast("Email is required","error"); return; }
    try {
      const updated = await api.users.update(auth.id, { name:form.name.trim(), email:form.email.trim(), phone:form.phone.trim() });
      const newAuth = {...auth, name:updated.name||form.name.trim(), email:updated.email||form.email.trim(), phone:updated.phone||form.phone.trim()};
      updateAuth(newAuth);
      setUsers(us => us.map(u => u.id === auth.id ? {...u, name:newAuth.name, email:newAuth.email, phone:newAuth.phone} : u));
      setEditing(false);
      showToast("Profile updated");
    } catch (err) {
      showToast(err.message || "Failed to save profile", "error");
    }
  };

  const changePassword = async () => {
    if (!passForm.current) { showToast("Enter current password","error"); return; }
    if (passForm.newPass.length < 6) { showToast("New password must be at least 6 characters","error"); return; }
    if (passForm.newPass !== passForm.confirm) { showToast("Passwords do not match","error"); return; }
    try {
      await api.changePassword(passForm.current, passForm.newPass);
      setPassForm({current:"",newPass:"",confirm:""});
      setShowPassSection(false);
      showToast("Password changed successfully");
    } catch (err) {
      showToast(err.message || "Password change failed", "error");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please select an image file","error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB","error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const updated = {...auth, avatar: dataUrl};
      updateAuth(updated);
      setUsers(us => us.map(u => u.id === auth.id ? {...u, avatar: dataUrl} : u));
      api.users.update(auth.id, {avatar: dataUrl}).catch(e => console.error('photo save:', e.message));
      showToast("Photo updated");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    const updated = {...auth, avatar: null};
    updateAuth(updated);
    setUsers(us => us.map(u => u.id === auth.id ? {...u, avatar: null} : u));
    api.users.update(auth.id, {avatar: null}).catch(e => console.error('photo remove:', e.message));
    showToast("Photo removed");
  };

  const passInput = (key, placeholder) => (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="lock" s={14}/></div>
      <input className="inp" type={showPass[key]?"text":"password"} placeholder={placeholder} value={passForm[key]} onChange={e=>setPassForm({...passForm,[key]:e.target.value})} style={{paddingLeft:36,paddingRight:38}} onKeyDown={e=>e.key==="Enter"&&changePassword()}/>
      <button onClick={()=>setShowPass({...showPass,[key]:!showPass[key]})} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",padding:3,display:"flex"}}><I n={showPass[key]?"eye-off":"eye"} s={14}/></button>
    </div>
  );

  return (
    <div style={{display:"flex",gap:20,maxWidth:1000,flexWrap:"wrap"}}>
      {/* LEFT COLUMN — Avatar + Identity */}
      <div style={{width:280,flexShrink:0,display:"flex",flexDirection:"column",gap:16,minWidth:0,flex:"1 1 260px",maxWidth:320}}>
        {/* Avatar card */}
        <div className="card" style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,padding:"28px 24px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:70,background:`linear-gradient(135deg,${rc}22,${rc}08)`,borderBottom:`1px solid ${rc}18`}}/>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
          <div style={{position:"relative",marginTop:10,marginBottom:16}}>
            <div style={{width:96,height:96,borderRadius:"50%",border:`3px solid ${rc}`,background:auth.avatar?`url(${auth.avatar}) center/cover`:`linear-gradient(135deg,${rc},${rc}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:800,color:"#fff",boxShadow:`0 8px 32px ${rc}30`}}>
              {!auth.avatar && ini(auth.name)}
            </div>
            <button onClick={()=>fileRef.current?.click()} title="Change photo" style={{position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--accent),var(--accent-dark))",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--bg)",cursor:"pointer",transition:"transform .15s",boxShadow:"0 4px 12px rgba(59,130,246,.4)"}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
              <I n="camera" s={13}/>
            </button>
          </div>
          <div style={{fontSize:17,fontWeight:800,color:"var(--text-2)",marginBottom:3,textAlign:"center"}}>{auth.name}</div>
          <span style={{fontSize:10,fontWeight:700,padding:"3px 11px",borderRadius:10,background:`${rc}18`,color:rc,marginBottom:10}}>{auth.role}</span>
          <div style={{fontSize:10,color:"var(--text-dim)",textAlign:"center",lineHeight:1.6}}>{auth.email}</div>
          {auth.avatar && (
            <button onClick={removePhoto} style={{marginTop:12,fontSize:10,fontWeight:600,color:"#ef4444",background:"none",border:"1px solid rgba(239,68,68,.2)",borderRadius:6,padding:"4px 12px",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.08)";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>Remove Photo</button>
          )}
        </div>

        {/* Quick stats */}
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 18px"}}>
          <div className="stl">Account Details</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"var(--text-muted)"}}>Member Since</span><span className="mn" style={{color:"#63b3ed",fontSize:10}}>{memberSince}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"var(--text-muted)"}}>Last Login</span><span className="mn" style={{color:"#22c55e",fontSize:10}}>{lastLogin}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"var(--text-muted)"}}>Status</span><Chip s={auth.status||"active"} map={{"active":{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Active"},"invited":{bg:"rgba(245,166,35,.12)",c:"#f5a623",label:"Invited"},"disabled":{bg:"rgba(239,68,68,.12)",c:"#ef4444",label:"Disabled"}}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"var(--text-muted)"}}>Company</span><span style={{color:"var(--text-2)",fontWeight:600,fontSize:10}}>{company.name}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"var(--text-muted)"}}>User ID</span><span className="mn" style={{color:"var(--text-dim)",fontSize:9}}>USR-{String(auth.id).padStart(4,"0")}</span></div>
          </div>
        </div>

        {/* Role permissions */}
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 18px"}}>
          <div className="stl">Your Permissions</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {perms.map(p => (
              <span key={p} style={{fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:6,background:`${rc}10`,color:rc,border:`1px solid ${rc}20`}}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Edit forms */}
      <div style={{flex:"1 1 400px",display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
        {/* Profile info */}
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,fontWeight:800}}>Profile Information</div>
              <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Update your name, email, and contact details</div>
            </div>
            {!editing ? (
              <button onClick={()=>{setForm({name:auth.name,email:auth.email,phone:auth.phone||""});setEditing(true);}} className="bb b-bl" style={{padding:"8px 16px",fontSize:12}}><I n="edit" s={13}/>Edit Profile</button>
            ) : (
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setEditing(false)} className="bb b-gh" style={{padding:"7px 14px",fontSize:11}}>Cancel</button>
                <button onClick={saveProfile} className="bb b-gr" style={{padding:"7px 14px",fontSize:11}}><I n="check" s={12}/>Save</button>
              </div>
            )}
          </div>
          <div style={{padding:"20px 22px"}}>
            {!editing ? (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="g2" style={{gap:20}}>
                  <div>
                    <div style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Full Name</div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--text-2)"}}>{auth.name}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Email Address</div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--text-2)",display:"flex",alignItems:"center",gap:6}}><I n="mail" s={14}/>{auth.email}</div>
                  </div>
                </div>
                <div className="g2" style={{gap:20}}>
                  <div>
                    <div style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Phone</div>
                    <div style={{fontSize:14,fontWeight:600,color:auth.phone?"var(--text-2)":"var(--text-faint)",display:"flex",alignItems:"center",gap:6}}><I n="phone" s={14}/>{auth.phone||"Not set"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Role</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:3,background:rc}}/>
                      <span style={{fontSize:14,fontWeight:600,color:"var(--text-2)"}}>{auth.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div className="g2">
                  <div><label className="lbl">Full Name</label><input className="inp" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name"/></div>
                  <div><label className="lbl">Email Address</label><input className="inp" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@company.com"/></div>
                </div>
                <div className="g2">
                  <div><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(555) 000-0000"/></div>
                  <div>
                    <label className="lbl">Role</label>
                    <input className="inp" value={auth.role} readOnly style={{opacity:.5,cursor:"not-allowed"}}/>
                    <div style={{fontSize:9,color:"var(--text-faint)",marginTop:4}}>Role can only be changed by an Admin</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,fontWeight:800}}>Security</div>
              <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Manage your password</div>
            </div>
            {!showPassSection && (
              <button onClick={()=>setShowPassSection(true)} className="bb b-gh" style={{padding:"8px 16px",fontSize:12}}><I n="lock" s={13}/>Change Password</button>
            )}
          </div>
          {showPassSection && (
            <div style={{padding:"20px 22px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:400}}>
                <div><label className="lbl">Current Password</label>{passInput("current","Enter current password")}</div>
                <div><label className="lbl">New Password</label>{passInput("newPass","Min 6 characters")}</div>
                <div><label className="lbl">Confirm New Password</label>{passInput("confirm","Re-enter new password")}</div>
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <button onClick={()=>{setShowPassSection(false);setPassForm({current:"",newPass:"",confirm:""});}} className="bb b-gh" style={{padding:"8px 16px",fontSize:12}}>Cancel</button>
                  <button onClick={changePassword} className="bb b-bl" style={{padding:"8px 16px",fontSize:12}}><I n="check" s={13}/>Update Password</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification preferences */}
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)"}}>
            <div style={{fontSize:15,fontWeight:800}}>Notification Preferences</div>
            <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Choose what you want to be notified about</div>
          </div>
          <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:14}}>
            {[
              {k:"email_invoices",l:"Invoice Reminders",d:"Get notified when invoices are sent, paid, or overdue"},
              {k:"email_projects",l:"Project Updates",d:"Notifications for project milestones and status changes"},
              {k:"email_estimates",l:"Estimate Activity",d:"When estimates are viewed, approved, or declined"},
              {k:"email_cos",l:"Change Orders",d:"New change order requests and approvals"},
              {k:"email_weekly",l:"Weekly Summary",d:"A weekly digest of your business performance"},
            ].map(n=>{
              var prefs = auth.notifPrefs || {};
              var isOn = prefs[n.k] !== undefined ? prefs[n.k] : true;
              return (
                <div key={n.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text-2)"}}>{n.l}</div>
                    <div style={{fontSize:10,color:"var(--text-dim)",marginTop:2}}>{n.d}</div>
                  </div>
                  <ToggleSwitch on={isOn} onChange={function(val){
                    var newPrefs = {...(auth.notifPrefs || {}), [n.k]: val};
                    var updated = {...auth, notifPrefs: newPrefs};
                    updateAuth(updated);
                    api.users.update(auth.id, {notifPrefs: newPrefs}).catch(function(e){ console.error('notif save:', e.message); });
                  }}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger zone */}
        <div style={{background:"rgba(239,68,68,.03)",border:"1px solid rgba(239,68,68,.12)",borderRadius:14,padding:"18px 22px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#ef4444",marginBottom:4}}>Danger Zone</div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:12}}>Once you sign out, you'll need to enter your credentials again. Account deletion requires admin approval.</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleLogout} className="bb b-rd" style={{padding:"8px 16px",fontSize:12}}><I n="arrow" s={13}/>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
