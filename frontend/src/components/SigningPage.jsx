import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// PUBLIC SIGNING PAGE — no auth required
// Loaded when URL matches /sign/:token
// ─────────────────────────────────────────────────────────────────

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

function fmt(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

export default function SigningPage() {
  const token = window.location.pathname.replace(/^\/sign\//, "");

  const [state, setState] = useState("loading"); // loading | error | already-signed | form | success | declined
  const [doc, setDoc] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [signerName, setSignerName] = useState("");
  const [showCanvas, setShowCanvas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);

  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!token) { setState("error"); setErrorMsg("Invalid signing link."); return; }
    fetch(API_BASE + "/sign/" + token)
      .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d })))
      .then(({ ok, status, data }) => {
        if (!ok) {
          if (status === 410) { setState("error"); setErrorMsg("This signing link has expired. Please contact us for a new link."); }
          else if (status === 404) { setState("error"); setErrorMsg("Signing link not found. It may have been revoked."); }
          else { setState("error"); setErrorMsg(data.error || "Something went wrong."); }
          return;
        }
        setDoc(data);
        if (data.signedAt) setState("already-signed");
        else setState("form");
      })
      .catch(() => { setState("error"); setErrorMsg("Could not load document. Please check your connection."); });
  }, [token]);

  // Canvas drawing
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function onCanvasStart(e) {
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function onCanvasMove(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const pos = getPos(e, canvasRef.current);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function onCanvasEnd(e) {
    e.preventDefault();
    drawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }

  function isCanvasBlank() {
    if (!canvasRef.current) return true;
    const ctx = canvasRef.current.getContext("2d");
    const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data;
    return !data.some(v => v !== 0);
  }

  async function handleAccept() {
    if (!signerName.trim()) { alert("Please enter your full name to sign."); return; }
    setSubmitting(true);
    try {
      var signatureImage = null;
      if (showCanvas && canvasRef.current && !isCanvasBlank()) {
        signatureImage = canvasRef.current.toDataURL("image/png");
      }
      const r = await fetch(API_BASE + "/sign/" + token + "/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: signerName.trim(), signatureImage }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 409) { setState("already-signed"); setDoc(d => ({ ...d, signedAt: data.signedAt, signedByName: data.signedByName })); }
        else { alert(data.error || "Could not process signature."); }
        return;
      }
      setState("success");
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    setSubmitting(true);
    try {
      const r = await fetch(API_BASE + "/sign/" + token + "/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) { const d = await r.json(); alert(d.error || "Could not process."); return; }
      setState("declined");
    } catch { alert("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  // ── Styles ───────────────────────────────────────────────────
  const s = {
    page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1e293b", fontSize: 14 },
    header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 },
    logo: { height: 40, objectFit: "contain" },
    companyName: { fontWeight: 700, fontSize: 18, color: "#0f172a" },
    container: { maxWidth: 780, margin: "0 auto", padding: "24px 16px" },
    card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 },
    docBadge: { display: "inline-block", background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", marginBottom: 12 },
    docTitle: { fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 },
    clientName: { color: "#64748b", marginBottom: 16 },
    sectionTitle: { fontWeight: 600, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 16 },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: 12 },
    td: { padding: "8px 10px", borderBottom: "1px solid #f1f5f9" },
    tdRight: { padding: "8px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "right" },
    totalRow: { fontWeight: 700, background: "#f8fafc" },
    totalLabel: { padding: "8px 10px", textAlign: "right", fontWeight: 600 },
    totalVal: { padding: "8px 10px", textAlign: "right", fontWeight: 700 },
    scopeBox: { background: "#f8fafc", borderRadius: 8, padding: 14, fontSize: 13, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.6 },
    inp: { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s" },
    label: { display: "block", fontWeight: 600, marginBottom: 6, color: "#374151" },
    canvas: { border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "crosshair", touchAction: "none", display: "block", width: "100%", background: "#fff" },
    btnPrimary: { background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" },
    btnSecondary: { background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" },
    btnDanger: { background: "#fff", color: "#dc2626", border: "1.5px solid #fecaca", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" },
    btnGhost: { background: "transparent", color: "#64748b", border: "none", padding: "8px 12px", fontSize: 13, cursor: "pointer" },
    successBox: { textAlign: "center", padding: "48px 24px" },
    successIcon: { fontSize: 64, marginBottom: 16 },
    successTitle: { fontSize: 24, fontWeight: 700, color: "#166534", marginBottom: 8 },
    successSub: { color: "#4b5563", lineHeight: 1.6 },
    errorBox: { textAlign: "center", padding: "64px 24px" },
    errorIcon: { fontSize: 56, marginBottom: 16 },
    errorTitle: { fontSize: 22, fontWeight: 700, color: "#991b1b", marginBottom: 8 },
    errorSub: { color: "#6b7280", lineHeight: 1.6 },
    alreadyBox: { background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 24, textAlign: "center" },
  };

  // ── Render helpers ───────────────────────────────────────────

  function LineItemsTable({ items, totals }) {
    const labor = (items || []).filter(i => !i.isMaterial);
    const mats = (items || []).filter(i => i.isMaterial);
    return (
      <>
        {labor.length > 0 && (
          <>
            <div style={s.sectionTitle}>Labor</div>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Description</th>
                <th style={{ ...s.th, textAlign: "right" }}>Qty</th>
                <th style={{ ...s.th, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...s.th, textAlign: "right" }}>Total</th>
              </tr></thead>
              <tbody>
                {labor.map((item, i) => (
                  <tr key={i}>
                    <td style={s.td}>{item.description}</td>
                    <td style={s.tdRight}>{item.qty} {item.unit || "ea"}</td>
                    <td style={s.tdRight}>{fmt(item.unitPrice)}</td>
                    <td style={s.tdRight}>{fmt(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {mats.length > 0 && (
          <>
            <div style={s.sectionTitle}>Materials</div>
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Description</th>
                <th style={{ ...s.th, textAlign: "right" }}>Qty</th>
                <th style={{ ...s.th, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...s.th, textAlign: "right" }}>Total</th>
              </tr></thead>
              <tbody>
                {mats.map((item, i) => (
                  <tr key={i}>
                    <td style={s.td}>{item.description}</td>
                    <td style={s.tdRight}>{item.qty} {item.unit || "ea"}</td>
                    <td style={s.tdRight}>{fmt(item.unitPrice)}</td>
                    <td style={s.tdRight}>{fmt(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {totals && (
          <table style={{ ...s.table, marginTop: 8 }}>
            <tbody>
              <tr><td style={s.totalLabel}>Subtotal</td><td style={s.totalVal}>{fmt(totals.sub)}</td></tr>
              {totals.da > 0 && <tr><td style={s.totalLabel}>Discount</td><td style={{ ...s.totalVal, color: "#16a34a" }}>-{fmt(totals.da)}</td></tr>}
              {totals.tax > 0 && <tr><td style={s.totalLabel}>Tax</td><td style={s.totalVal}>{fmt(totals.tax)}</td></tr>}
              <tr style={s.totalRow}><td style={{ ...s.totalLabel, fontSize: 16 }}>Total</td><td style={{ ...s.totalVal, fontSize: 16 }}>{fmt(totals.tot)}</td></tr>
              {totals.ra > 0 && <tr><td style={s.totalLabel}>Retention</td><td style={s.totalVal}>{fmt(totals.ra)}</td></tr>}
              {totals.net != null && totals.ra > 0 && <tr style={s.totalRow}><td style={{ ...s.totalLabel, fontSize: 15 }}>Net Payable</td><td style={{ ...s.totalVal, fontSize: 15 }}>{fmt(totals.net)}</td></tr>}
            </tbody>
          </table>
        )}
      </>
    );
  }

  // ── States ───────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Loading document…</div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={{ ...s.card, ...s.errorBox }}>
            <div style={s.errorIcon}>🔗</div>
            <div style={s.errorTitle}>Link Unavailable</div>
            <div style={s.errorSub}>{errorMsg}</div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "already-signed") {
    return (
      <div style={s.page}>
        <div style={s.header}>
          {doc?.companyLogo && <img src={doc.companyLogo} alt="" style={s.logo} />}
          <span style={s.companyName}>{doc?.companyName}</span>
        </div>
        <div style={s.container}>
          <div style={{ ...s.card, ...s.alreadyBox }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Already Signed</div>
            <div style={{ color: "#4b5563" }}>
              This document was signed by <strong>{doc?.signedByName}</strong>.<br />
              {doc?.signedAt && <span>Signed on {new Date(doc.signedAt).toLocaleString()}.</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div style={s.page}>
        <div style={s.header}>
          {doc?.companyLogo && <img src={doc.companyLogo} alt="" style={s.logo} />}
          <span style={s.companyName}>{doc?.companyName}</span>
        </div>
        <div style={s.container}>
          <div style={{ ...s.card, ...s.successBox }}>
            <div style={s.successIcon}>✅</div>
            <div style={s.successTitle}>Document Signed!</div>
            <div style={s.successSub}>
              Thank you, <strong>{signerName}</strong>!<br />
              Your signature has been recorded. {doc?.companyName} will be notified.<br /><br />
              You may close this window.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "declined") {
    return (
      <div style={s.page}>
        <div style={s.header}>
          {doc?.companyLogo && <img src={doc.companyLogo} alt="" style={s.logo} />}
          <span style={s.companyName}>{doc?.companyName}</span>
        </div>
        <div style={s.container}>
          <div style={{ ...s.card, textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>Document Declined</div>
            <div style={{ color: "#6b7280" }}>
              You have declined this document. {doc?.companyName} has been notified.<br /><br />
              You may close this window.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.header}>
        {doc?.companyLogo && <img src={doc.companyLogo} alt={doc.companyName} style={s.logo} />}
        <span style={s.companyName}>{doc?.companyName}</span>
      </div>

      <div style={s.container}>
        {/* Document info */}
        <div style={s.card}>
          <div style={s.docBadge}>{doc.docType === "contract" ? "Contract" : "Estimate"}</div>
          <div style={s.docTitle}>{doc.title}</div>
          {doc.clientOrSubName && <div style={s.clientName}>Prepared for: <strong>{doc.clientOrSubName}</strong></div>}

          {doc.lineItems?.length > 0 && (
            <LineItemsTable items={doc.lineItems} totals={doc.totals} />
          )}

          {doc.scopeOfWork && (
            <>
              <div style={s.sectionTitle}>Scope of Work</div>
              <div style={s.scopeBox}>{doc.scopeOfWork}</div>
            </>
          )}
          {doc.exclusions && (
            <>
              <div style={s.sectionTitle}>Exclusions</div>
              <div style={s.scopeBox}>{doc.exclusions}</div>
            </>
          )}
          {doc.paymentTerms && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
              Payment Terms: <strong>{doc.paymentTerms}</strong>
            </div>
          )}
        </div>

        {/* Signature section */}
        <div style={s.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sign Document</div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
            By signing, you agree to the terms described in this document.
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Full Name (required)</label>
            <input
              style={s.inp}
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Type your full legal name"
              autoComplete="name"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <button
              style={{ ...s.btnGhost, padding: "6px 0", color: "#1d4ed8", fontWeight: 600 }}
              onClick={() => { setShowCanvas(v => !v); }}
            >
              {showCanvas ? "▲ Hide signature pad" : "✏ Draw signature (optional)"}
            </button>
          </div>

          {showCanvas && (
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Draw your signature</label>
              <canvas
                ref={canvasRef}
                width={680}
                height={140}
                style={s.canvas}
                onMouseDown={onCanvasStart}
                onMouseMove={onCanvasMove}
                onMouseUp={onCanvasEnd}
                onMouseLeave={onCanvasEnd}
                onTouchStart={onCanvasStart}
                onTouchMove={onCanvasMove}
                onTouchEnd={onCanvasEnd}
              />
              <button style={{ ...s.btnGhost, marginTop: 4 }} onClick={clearCanvas}>Clear</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <button
                style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
                onClick={handleAccept}
                disabled={submitting}
              >
                {submitting ? "Processing…" : "✓ Accept & Sign"}
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {!confirmDecline
                ? <button style={s.btnSecondary} onClick={() => setConfirmDecline(true)} disabled={submitting}>Decline</button>
                : <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...s.btnDanger, flex: 1 }} onClick={handleDecline} disabled={submitting}>Confirm Decline</button>
                    <button style={{ ...s.btnSecondary, flex: "0 0 auto", width: "auto", padding: "12px 16px" }} onClick={() => setConfirmDecline(false)}>Cancel</button>
                  </div>
              }
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            Your IP address and timestamp are recorded when you sign.
          </div>
        </div>
      </div>
    </div>
  );
}
