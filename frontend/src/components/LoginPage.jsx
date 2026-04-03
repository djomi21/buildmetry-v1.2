import React, { useState } from 'react';
import api from '../api';
import { saveUser } from '../api';
import { CSS, USER_ROLE_C } from '../constants';
import { tod } from '../utils/calculations';
import { I } from './shared/Icons';
import { ini } from './shared/ui';

export default function LoginPage({users, onLogin}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!pass.trim()) { setError("Password is required"); return; }
    setLoading(true);
    try {
      const user = await api.login(email.trim(), pass);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  const demoLogin = async (u) => {
    setLoading(true);
    try {
      const user = await api.login(u.email, "contractor123");
      onLogin(user);
    } catch {
      onLogin({...u, lastLogin: tod()});
    }
  };

  const inputStyle = {
    background:"var(--bg-card)",border:"1px solid var(--border-2)",color:"var(--text)",borderRadius:10,padding:"12px 14px",fontSize:14,width:"100%",transition:"border-color .2s",outline:"none",fontFamily:"'DM Sans',system-ui,sans-serif"
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"row",flexWrap:"wrap",fontFamily:"'DM Sans',system-ui,sans-serif",color:"var(--text)",overflow:"auto"}}>
      <style>{CSS}</style>

      {/* LEFT — BRANDING PANEL */}
      <div style={{flex:"1 1 380px",minHeight:"min(100vh,500px)",background:"linear-gradient(160deg,var(--bg-sidebar) 0%,var(--bg-card) 60%,var(--bg-card) 100%)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"clamp(30px,5vw,60px) clamp(20px,4vw,50px)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:"radial-gradient(circle,var(--accent) 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
        <div style={{position:"absolute",top:"20%",left:"30%",width:300,height:300,background:"radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%)",borderRadius:"50%",filter:"blur(60px)",animation:"gridFloat 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"15%",right:"20%",width:200,height:200,background:"radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%)",borderRadius:"50%",filter:"blur(50px)",animation:"gridFloat 6s ease-in-out infinite 2s"}}/>

        <div style={{position:"relative",zIndex:1,maxWidth:380}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:32}}>
            <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,var(--accent),var(--accent-dark))",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 32px rgba(59,130,246,.35)"}}><I n="wrench" s={22}/></div>
            <div><div style={{fontSize:22,fontWeight:800,color:"var(--text-2)",letterSpacing:-.3}}>BuildMetry</div><div style={{fontSize:9,color:"var(--text-dim)",fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>v1.0</div></div>
          </div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.25,color:"var(--text-2)",marginBottom:14,letterSpacing:-.5}}>Run your construction<br/>business from one place.</div>
          <div style={{fontSize:14,color:"var(--text-dim)",lineHeight:1.7,marginBottom:36}}>Estimates, projects, invoices, job costing, materials, subs — everything a GC needs to stay profitable and organized.</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {["Estimates","Job Costing","Invoicing","Change Orders","Crew Management","Reports"].map(f=>(
              <span key={f} style={{fontSize:10,fontWeight:600,padding:"5px 12px",borderRadius:20,background:"rgba(var(--accent-r),var(--accent-g),var(--accent-b),.08)",border:"1px solid rgba(var(--accent-r),var(--accent-g),var(--accent-b),.15)",color:"var(--accent-light)"}}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — LOGIN FORM */}
      <div style={{flex:"1 1 380px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"clamp(24px,4vw,40px) clamp(16px,4vw,50px)",minHeight:"auto"}}>
        <div style={{width:"100%",maxWidth:400,animation:"slideUp .4s ease"}}>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:22,fontWeight:800,color:"var(--text-2)",marginBottom:6}}>Welcome back</div>
            <div style={{fontSize:13,color:"var(--text-dim)"}}>Sign in to your BuildMetry workspace</div>
          </div>

          {error&&(
            <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#ef4444",fontWeight:600,animation:"up .2s ease"}}>
              <I n="alert" s={14}/>{error}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:11,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,display:"block"}}>Email</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="mail" s={15}/></div>
                <input style={{...inputStyle,paddingLeft:38}} type="email" placeholder="you@company.com" value={email} onChange={e=>{setEmail(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              </div>
            </div>

            <div>
              <label style={{fontSize:11,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,display:"block"}}>Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="lock" s={15}/></div>
                <input style={{...inputStyle,paddingLeft:38,paddingRight:42}} type={showPass?"text":"password"} placeholder="Enter password" value={pass} onChange={e=>{setPass(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
                <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",padding:4,display:"flex"}}><I n={showPass?"eye-off":"eye"} s={15}/></button>
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:10,background:loading?"var(--border)":"linear-gradient(135deg,var(--accent),var(--accent-dark))",color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:loading?"default":"pointer",transition:"all .2s",boxShadow:loading?"none":"0 6px 24px rgba(var(--accent-r),var(--accent-g),var(--accent-b),.35)",fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading ? (<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"pulse 1s linear infinite"}}/> Signing in…</>) : "Sign In"}
            </button>
          </div>

          <div style={{textAlign:"center",marginTop:18,fontSize:12,color:"var(--text-faint)"}}>
            Contact your administrator for account access
          </div>

          {/* Demo quick-access */}
          <div style={{marginTop:28,borderTop:"1px solid var(--border)",paddingTop:20}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:1,marginBottom:10,textAlign:"center"}}>Quick Demo Access</div>
            <div className="g2" style={{gap:8}}>
              {users.filter(u=>u.status==="active").slice(0,4).map(u=>{
                const rc = USER_ROLE_C[u.role]||"var(--accent)";
                return (
                  <button key={u.id} onClick={()=>demoLogin(u)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",background:"var(--bg-card)",border:"1px solid var(--border-2)",borderRadius:9,cursor:"pointer",transition:"all .18s",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=rc;e.currentTarget.style.background=rc+"08";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border-2)";e.currentTarget.style.background="var(--bg-card)";}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${rc},${rc}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0}}>{ini(u.name)}</div>
                    <div style={{overflow:"hidden"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--text-2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
                      <div style={{fontSize:9,color:rc,fontWeight:600}}>{u.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
