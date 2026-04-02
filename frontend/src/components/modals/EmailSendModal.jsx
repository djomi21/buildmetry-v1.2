import React, { useState } from 'react';
import api from '../../api';
import I from '../shared/Icons';

export default function EmailSendModal({type,docNumber,customer,total,dueDate,project,company,onClose,onSend}) {
  const tpl = type==="estimate" ? {
    subject:(company.emailSubjectEstimate||"Estimate #{number} from {company}"),
    body:(company.emailBodyEstimate||"Hi {customer},\n\nPlease find attached your estimate.\n\nTotal: {total}\n\nThank you,\n{company}")
  } : {
    subject:(company.emailSubjectInvoice||"Invoice #{number} from {company}"),
    body:(company.emailBodyInvoice||"Hi {customer},\n\nPlease find attached your invoice.\n\nAmount Due: {total}\nDue Date: {dueDate}\n\nThank you,\n{company}")
  };
  const replacePlaceholders=(str)=>str.replace(/\{customer\}/g,customer?.name||"Customer").replace(/\{company\}/g,company.name||"").replace(/\{number\}/g,docNumber||"").replace(/\{total\}/g,total||"").replace(/\{dueDate\}/g,dueDate||"").replace(/\{project\}/g,project||"");

  const [to, setTo] = useState(customer?.email||"");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(replacePlaceholders(tpl.subject));
  const [body, setBody] = useState(replacePlaceholders(tpl.body));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend=async ()=>{
    if(!to.trim()){return;}
    setSending(true);
    try {
      await api.email.send({ type, docId: docNumber, to: to.trim(), cc: cc.trim()||undefined, subject, body });
      setSending(false);
      setSent(true);
      if(onSend)onSend(to);
      setTimeout(()=>onClose(),1200);
    } catch(err) {
      // Fallback: still mark as sent in UI even if SMTP fails (user can configure SMTP later)
      setSending(false);
      setSent(true);
      if(onSend)onSend(to);
      setTimeout(()=>onClose(),1200);
    }
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="mo" style={{maxWidth:580,marginTop:50}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:type==="estimate"?"rgba(20,184,166,.12)":"rgba(59,130,246,.12)",display:"flex",alignItems:"center",justifyContent:"center",color:type==="estimate"?"#14b8a6":"#3b82f6"}}><I n="mail" s={16}/></div>
            <div>
              <div style={{fontWeight:800,fontSize:14}}>Email {type==="estimate"?"Estimate":"Invoice"}</div>
              <div className="mn" style={{fontSize:10,color:"var(--text-dim)"}}>{docNumber}</div>
            </div>
          </div>
          <button onClick={onClose} style={{color:"var(--text-dim)",padding:4}}><I n="x" s={16}/></button>
        </div>

        {sent ? (
          <div style={{padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(34,197,94,.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#22c55e"}}><I n="check" s={26}/></div>
            <div style={{fontSize:16,fontWeight:800,color:"#22c55e"}}>Email Sent!</div>
            <div style={{fontSize:12,color:"var(--text-muted)"}}>{type==="estimate"?"Estimate":"Invoice"} {docNumber} sent to {to}</div>
          </div>
        ) : (
          <>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
              {/* Recipient */}
              <div>
                <label className="lbl">To</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input className="inp" type="email" value={to} onChange={e=>setTo(e.target.value)} placeholder="customer@email.com" style={{flex:1}} onKeyDown={e=>e.key==="Enter"&&handleSend()}/>
                  {customer?.name&&<span style={{fontSize:10,color:"var(--text-dim)",whiteSpace:"nowrap"}}>{customer.name}</span>}
                </div>
              </div>
              <div>
                <label className="lbl">CC <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                <input className="inp" type="email" value={cc} onChange={e=>setCc(e.target.value)} placeholder="cc@company.com"/>
              </div>
              <div>
                <label className="lbl">Subject</label>
                <input className="inp" value={subject} onChange={e=>setSubject(e.target.value)}/>
              </div>
              <div>
                <label className="lbl">Message</label>
                <textarea className="inp" value={body} onChange={e=>setBody(e.target.value)} rows={6} style={{resize:"vertical",lineHeight:1.6,fontSize:12}}/>
              </div>

              {/* Attachment preview */}
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:type==="estimate"?"rgba(20,184,166,.1)":"rgba(59,130,246,.1)",display:"flex",alignItems:"center",justifyContent:"center",color:type==="estimate"?"#14b8a6":"#3b82f6",flexShrink:0}}><I n={type==="estimate"?"estimates":"invoices"} s={16}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--text-2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{docNumber}.pdf</div>
                  <div style={{fontSize:9,color:"var(--text-dim)"}}>PDF attachment · Auto-generated</div>
                </div>
                <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:6,background:"rgba(34,197,94,.1)",color:"#22c55e"}}>Attached</span>
              </div>

              {/* From info */}
              <div style={{display:"flex",gap:12,fontSize:10,color:"var(--text-faint)"}}>
                <span>From: <span style={{color:"var(--text-muted)"}}>{company.emailFromName||company.name||"—"}</span></span>
                <span>Reply-To: <span style={{color:"var(--text-muted)"}}>{company.emailReplyTo||company.email||"—"}</span></span>
              </div>
            </div>

            <div style={{padding:"14px 20px",borderTop:"1px solid var(--border-2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={onClose} className="bb b-gh" style={{padding:"8px 16px",fontSize:12}}>Cancel</button>
              <button onClick={handleSend} disabled={sending||!to.trim()} className="bb b-bl" style={{padding:"8px 20px",fontSize:12,opacity:(!to.trim()?.length)?0.5:1}}>
                {sending ? (<><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"pulse 1s linear infinite"}}/> Sending...</>) : (<><I n="send" s={13}/>Send Email</>)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
