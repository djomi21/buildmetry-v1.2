import React, { useState } from 'react';
import api from '../api';
import { saveUser } from '../api';
import { CSS } from '../constants';
import { I } from './shared/Icons';

export default function ForceChangePassword({auth, setAuth, showToast, handleLogout}) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    background:"var(--bg-card)",border:"1px solid var(--border-2)",color:"var(--text)",borderRadius:10,padding:"12px 14px",fontSize:14,width:"100%",transition:"border-color .2s",outline:"none",fontFamily:"'DM Sans',system-ui,sans-serif"
  };

  const handleSubmit = async () => {
    setError("");
    if (!currentPass) { setError("Enter your current password"); return; }
    if (newPass.length < 6) { setError("New password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { setError("Passwords do not match"); return; }
    if (currentPass === newPass) { setError("New password must be different from current password"); return; }
    setLoading(true);
    try {
      await api.changePassword(currentPass, newPass);
      const updated = {...auth, mustChangePassword: false};
      setAuth(updated);
      saveUser(updated);
      showToast("Password changed successfully! Welcome to BuildMetry.");
    } catch (err) {
      setError(err.message || "Password change failed");
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif",color:"var(--text)",padding:20}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:440,animation:"slideUp .4s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,var(--accent),var(--accent-dark))",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16,boxShadow:"0 8px 32px rgba(var(--accent-r),var(--accent-g),var(--accent-b),.35)"}}><I n="lock" s={24}/></div>
          <div style={{fontSize:22,fontWeight:800,color:"var(--text-2)",marginBottom:6}}>Set Your Password</div>
          <div style={{fontSize:13,color:"var(--text-dim)"}}>Welcome, {auth.name}! For security, please change your password before continuing.</div>
        </div>

        <div style={{background:"var(--bg-darker)",border:"1px solid var(--border-2)",borderRadius:14,padding:"24px 28px"}}>
          {error && (
            <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#ef4444",fontWeight:600}}>
              <I n="alert" s={14}/>{error}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:11,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,display:"block"}}>Current Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="lock" s={15}/></div>
                <input style={{...inputStyle,paddingLeft:38,paddingRight:42}} type={showCurrent?"text":"password"} placeholder="Default: Welcome123!" value={currentPass} onChange={e=>{setCurrentPass(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
                <button onClick={()=>setShowCurrent(!showCurrent)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",padding:4,display:"flex"}}><I n={showCurrent?"eye-off":"eye"} s={15}/></button>
              </div>
              <div style={{fontSize:10,color:"var(--text-faint)",marginTop:4}}>Your admin set a default password when creating your account</div>
            </div>

            <div>
              <label style={{fontSize:11,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,display:"block"}}>New Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="lock" s={15}/></div>
                <input style={{...inputStyle,paddingLeft:38,paddingRight:42}} type={showNew?"text":"password"} placeholder="Min 6 characters" value={newPass} onChange={e=>{setNewPass(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
                <button onClick={()=>setShowNew(!showNew)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",padding:4,display:"flex"}}><I n={showNew?"eye-off":"eye"} s={15}/></button>
              </div>
            </div>

            <div>
              <label style={{fontSize:11,color:"var(--text-dim)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,display:"block"}}>Confirm New Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none"}}><I n="lock" s={15}/></div>
                <input style={{...inputStyle,paddingLeft:38}} type={showNew?"text":"password"} placeholder="Type again to confirm" value={confirmPass} onChange={e=>{setConfirmPass(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:10,background:loading?"var(--border)":"linear-gradient(135deg,var(--accent),var(--accent-dark))",color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:loading?"default":"pointer",transition:"all .2s",boxShadow:loading?"none":"0 6px 24px rgba(var(--accent-r),var(--accent-g),var(--accent-b),.35)",fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
              {loading ? (<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"pulse 1s linear infinite"}}/> Updating…</>) : (<><I n="check" s={16}/> Set Password & Continue</>)}
            </button>
          </div>
        </div>

        <div style={{textAlign:"center",marginTop:18}}>
          <button onClick={handleLogout} style={{fontSize:12,color:"var(--text-dim)",fontWeight:600}}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
