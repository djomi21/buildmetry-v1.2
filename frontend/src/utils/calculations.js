import { TAX } from '../constants';

// ── FORMATTERS ─────────────────────────────────────────────────
export const fmt  = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
export const fmtD = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n||0);
export const fmtK = n => n>=1000?`$${(n/1000).toFixed(1)}k`:fmt(n);
export const pct  = (a,b) => b===0?0:Math.round((a/b)*100);

// ── DATE HELPERS ───────────────────────────────────────────────
export const tod  = () => new Date().toISOString().slice(0,10);
export const addD = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); };

// ── ID / NUMBER GENERATORS ─────────────────────────────────────
export const uid  = () => Date.now()+Math.floor(Math.random()*9999);
export const nxtNum = (list,prefix,yr=2026) => {
  const max = list.filter(x=>(x.number||x.id||"").startsWith(`${prefix}-${yr}`))
    .map(x=>parseInt((x.number||x.id||"").split("-")[2]||0)).reduce((m,n)=>Math.max(m,n),0);
  return `${prefix}-${yr}-${String(max+1).padStart(3,"0")}`;
};

// ── INVOICE / ESTIMATE CALCULATION ────────────────────────────
// Fixed: replaced undefined TAX default with TAX from constants
export const calcInv = (lines=[],taxRate=TAX,discountPct=0,depositType="none",depositValue=0) => {
  const sub = lines.reduce((s,l)=>s+(l.qty*l.unitPrice),0);
  const lab = lines.filter(l=>!l.isMaterial).reduce((s,l)=>s+(l.qty*l.unitPrice),0);
  const mat = lines.filter(l=> l.isMaterial).reduce((s,l)=>s+(l.qty*l.unitPrice),0);
  const discAmt = Math.round(sub*(discountPct/100)*100)/100;
  const discSub = sub - discAmt;
  const discMat = discountPct>0?Math.round(mat*(1-discountPct/100)*100)/100:mat;
  const tax = discMat*(taxRate/100);
  const total = discSub+tax;
  const depAmt = depositType==="percent"?Math.round(total*(depositValue/100)*100)/100:depositType==="flat"?Math.min(depositValue,total):0;
  const balanceDue = total - depAmt;
  return {sub,lab,mat,discountPct,discAmt,discSub,tax,total,depositType,depositValue,depAmt,balanceDue};
};

// ── LABOR BURDEN CALCULATIONS ──────────────────────────────────
export const calcBurden = (r) => {
  const tb = r.payrollPct + r.benefitsPct;
  return { totalBurdenPct: tb, fullyBurdenedRate: Math.round(r.baseRate*(1+tb/100)*100)/100 };
};

export const getBurdenMult = (roles,roleTitle) => {
  const r = roles.find(x=>x.title===roleTitle);
  if(!r) return 1.28;
  return 1+(r.payrollPct+r.benefitsPct)/100;
};

export const getBurdenedRate = (roles,roleTitle,wage) => {
  return Math.round(wage*getBurdenMult(roles,roleTitle)*100)/100;
};

// ── PRINT / PDF EXPORT ─────────────────────────────────────────
export const printDoc = (title,bodyHtml,co,autoPrint=false) => {
  const coName=co?.name||"";const coAddr=co?.address||"";const coPhone=co?.phone||"";const coEmail=co?.email||"";const coLic=co?.license||"";
  const html=`<!DOCTYPE html><html><head><title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;font-size:11px;padding:32px 40px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
@page{size:letter;margin:18mm 14mm}
@media print{.no-print{display:none!important}}
.mn{font-family:'JetBrains Mono',monospace;font-weight:600}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1a2e;padding-bottom:14px;margin-bottom:18px}
.co-name{font-size:18px;font-weight:800;color:#1a1a2e;letter-spacing:-.3px}
.co-info{font-size:9px;color:#555;line-height:1.6;text-align:right}
.doc-title{font-size:14px;font-weight:800;color:#1a1a2e;margin-bottom:2px}
.doc-meta{font-size:10px;color:#666;margin-bottom:16px}
.section{margin-bottom:16px}
.section-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:6px;border-bottom:1px solid #e0e0e0;padding-bottom:3px}
table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:12px}
th{background:#f4f4f8;padding:6px 10px;text-align:left;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#555;border-bottom:2px solid #ddd}
td{padding:6px 10px;border-bottom:1px solid #eee}
.totals{max-width:260px;margin-left:auto}
.totals .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;font-size:10px}
.totals .row.grand{border-top:2px solid #1a1a2e;border-bottom:none;padding-top:8px;font-size:13px;font-weight:800}
.notes{background:#f8f8fb;border:1px solid #e8e8ee;border-radius:6px;padding:10px 14px;font-size:10px;color:#555;line-height:1.7}
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #ddd;font-size:9px;color:#888;text-align:center}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:8px;font-weight:700;text-transform:uppercase}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
</style></head><body>
<div class="hdr">
  <div style="display:flex;align-items:center;gap:12px">${co?.logo?`<img src="${co.logo}" alt="Logo" style="height:40px;width:auto;object-fit:contain"/>`:""}
    <div><div class="co-name">${coName}</div>${coLic?`<div style="font-size:9px;color:#888;margin-top:2px">${coLic}</div>`:""}</div>
  </div>
  <div class="co-info">${coAddr?coAddr.replace(/,/g,",<br>"):""}${coPhone?"<br>"+coPhone:""}${coEmail?"<br>"+coEmail:""}</div>
</div>
${bodyHtml}
</body></html>`;

  try {
    const w=window.open("","_blank");
    if(w&&w.document){
      w.document.write(html);
      w.document.close();
      if(autoPrint){ setTimeout(()=>{try{w.print();}catch(e){}},600); }
      return;
    }
  } catch(e){}

  // Fallback: iframe for sandboxed environments
  let iframe=document.getElementById("__print_frame");
  if(iframe)iframe.remove();
  iframe=document.createElement("iframe");
  iframe.id="__print_frame";
  iframe.style.cssText="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;border:none;background:#fff";
  document.body.appendChild(iframe);
  const idoc=iframe.contentDocument||iframe.contentWindow.document;
  idoc.open();
  idoc.write(html.replace("</body>",`
    <div class="no-print" style="position:fixed;top:14px;right:14px;display:flex;gap:6px;z-index:100">
      <button onclick="window.print()" style="border:none;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;background:#1a1a2e;color:#fff">Print</button>
      <button onclick="parent.document.getElementById('__print_frame').remove()" style="border:none;padding:9px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;background:#ef4444;color:#fff">Close</button>
    </div>
  </body>`));
  idoc.close();
  if(autoPrint){ setTimeout(()=>{try{iframe.contentWindow.print();}catch(e){}},600); }
};
