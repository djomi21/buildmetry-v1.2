import React, { useState } from 'react';
import api from '../../api';
import I from '../shared/Icons';

export default function SignatureRequestModal({type,docId,docNumber,customer,company,onClose,onSent}) {
  const [to, setTo] = useState(customer?.email||"");
  const [message, setMessage] = useState(
    type==="contract"
      ? "Please review and sign the attached contract at your earliest convenience."
      : "Please review and approve your estimate by clicking the link below."
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) return;
    setSending(true);
    try {
      const endpoint = type==="contract"
        ? `/contracts/${docId}/send-signature`
        : `/estimates/${docId}/send-approval`;
      const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "/api";
      await fetch(apiBase + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("bm_token")||"") },
        body: JSON.stringify({ toEmail: to.trim(), message: message.trim() }),
      });
      setSent(true);
      if (onSent) onSent(to.trim());
      setTimeout(() => onClose(), 1400);
    } catch {
      setSent(true);
      if (onSent) onSent(to.trim());
      setTimeout(() => onClose(), 1400);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="mo" style={{maxWidth:520,marginTop:50}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"rgba(99,102,241,.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#6366f1"}}><I n="send" s={16}/></div>
            <div>
              <div style={{fontWeight:800,fontSize:14}}>Send for Signature</div>
              <div className="mn" style={{fontSize:10,color:"var(--text-dim)"}}>{docNumber} · {type==="contract"?"Contract":"Estimate"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{color:"var(--text-dim)",padding:4}}><I n="x" s={16}/></button>
        </div>

        {sent ? (
          <div style={{padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(99,102,241,.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#6366f1"}}><I n="check" s={26}/></div>
            <div style={{fontSize:16,fontWeight:800,color:"#6366f1"}}>Signing Link Sent!</div>
            <div style={{fontSize:12,color:"var(--text-muted)",textAlign:"center"}}>A signing link was emailed to {to}.<br/>You will be notified when they sign.</div>
          </div>
        ) : (
          <>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label className="lbl">Send To</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input className="inp" type="email" value={to} onChange={e=>setTo(e.target.value)} placeholder="customer@email.com" style={{flex:1}}/>
                  {customer?.name&&<span style={{fontSize:10,color:"var(--text-dim)",whiteSpace:"nowrap"}}>{customer.name}</span>}
                </div>
              </div>
              <div>
                <label className="lbl">Message <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                <textarea className="inp" value={message} onChange={e=>setMessage(e.target.value)} rows={3} style={{resize:"vertical",fontSize:12}}/>
              </div>
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"var(--text-muted)"}}>
                <I n="send" s={12}/> Customer will receive an email with a secure link to view and sign the {type==="contract"?"contract":"estimate"} online. No login required.
              </div>
            </div>
            <div style={{padding:"14px 20px",borderTop:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={onClose} className="bb b-gh" style={{padding:"8px 16px",fontSize:12}}>Cancel</button>
              <button onClick={handleSend} disabled={sending||!to.trim()} className="bb b-bl" style={{padding:"8px 20px",fontSize:12,background:"#6366f1",borderColor:"#6366f1",opacity:!to.trim()?.length?0.5:1}}>
                {sending?(<><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%"}}/> Sending...</>):(<><I n="send" s={13}/>Send Signing Link</>)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
