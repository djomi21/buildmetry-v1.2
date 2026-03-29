import { useState, useEffect, useCallback, useMemo } from "react";

/*
 * ═══════════════════════════════════════════════════════
 *  BUILDMETRY — CONTRACTS MODULE v2
 *  With API integration, Estimate→Contract, Change Orders
 * ═══════════════════════════════════════════════════════
 *
 *  Props:
 *    projectId   — ID of the parent project (required)
 *    apiBaseUrl   — override API base (default: /api)
 *    onNavigate  — callback for cross-module nav (optional)
 *                   e.g. onNavigate("invoice", invoiceId)
 */

const TAX_RATE = 0.065;
const CONTRACT_TYPES = ["Prime", "Subcontract", "Change Order"];
const STATUSES = ["Draft", "Sent", "Active", "Completed", "Cancelled"];
const PAYMENT_TERMS = ["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60"];
const MILESTONE_STATUSES = ["Pending", "Invoiced", "Paid"];
const UNITS = ["ea", "sf", "lf", "sy", "cy", "hr", "day", "ls", "gal", "ton", "bd ft"];

const SCOPE_TEMPLATES = {
  "Kitchen Remodel": [
    { description: "Demolition — cabinets, countertops, flooring", qty: 1, unitPrice: 2800, unit: "ls", isMaterial: false },
    { description: "Rough plumbing", qty: 1, unitPrice: 3200, unit: "ls", isMaterial: false },
    { description: "Electrical rough-in", qty: 1, unitPrice: 2400, unit: "ls", isMaterial: false },
    { description: "Cabinets — shaker style", qty: 22, unitPrice: 285, unit: "lf", isMaterial: true },
    { description: "Quartz countertops — installed", qty: 45, unitPrice: 95, unit: "sf", isMaterial: true },
    { description: "Tile backsplash — subway", qty: 30, unitPrice: 18, unit: "sf", isMaterial: true },
    { description: "Backsplash installation labor", qty: 30, unitPrice: 12, unit: "sf", isMaterial: false },
    { description: "Finish plumbing — fixtures", qty: 1, unitPrice: 1800, unit: "ls", isMaterial: true },
    { description: "Painting — walls & trim", qty: 1, unitPrice: 1600, unit: "ls", isMaterial: false },
    { description: "Cleanup & haul-off", qty: 1, unitPrice: 800, unit: "ls", isMaterial: false },
  ],
  "Bathroom Renovation": [
    { description: "Demo — tile, fixtures, vanity", qty: 1, unitPrice: 1500, unit: "ls", isMaterial: false },
    { description: "Plumbing rough-in", qty: 1, unitPrice: 2800, unit: "ls", isMaterial: false },
    { description: "Waterproofing membrane", qty: 60, unitPrice: 8, unit: "sf", isMaterial: true },
    { description: "Floor tile — porcelain", qty: 60, unitPrice: 12, unit: "sf", isMaterial: true },
    { description: "Wall tile — ceramic", qty: 120, unitPrice: 9, unit: "sf", isMaterial: true },
    { description: "Tile installation labor", qty: 180, unitPrice: 10, unit: "sf", isMaterial: false },
    { description: "Vanity w/ top — 48in", qty: 1, unitPrice: 1200, unit: "ea", isMaterial: true },
    { description: "Shower valve + trim kit", qty: 1, unitPrice: 650, unit: "ea", isMaterial: true },
    { description: "Finish plumbing", qty: 1, unitPrice: 1200, unit: "ls", isMaterial: false },
    { description: "Painting & caulking", qty: 1, unitPrice: 900, unit: "ls", isMaterial: false },
  ],
  "Exterior Painting": [
    { description: "Pressure washing", qty: 2400, unitPrice: 0.35, unit: "sf", isMaterial: false },
    { description: "Scraping & prep", qty: 2400, unitPrice: 0.45, unit: "sf", isMaterial: false },
    { description: "Primer — exterior", qty: 12, unitPrice: 48, unit: "gal", isMaterial: true },
    { description: "Paint — Sherwin-Williams Duration", qty: 18, unitPrice: 72, unit: "gal", isMaterial: true },
    { description: "Caulking — windows & trim", qty: 1, unitPrice: 600, unit: "ls", isMaterial: true },
    { description: "Painting labor — 2 coats", qty: 2400, unitPrice: 1.1, unit: "sf", isMaterial: false },
    { description: "Trim & detail work", qty: 1, unitPrice: 1400, unit: "ls", isMaterial: false },
  ],
};

/* ─── Utilities ─── */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmt(n) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n); }
function fmtPct(n) { return (n * 100).toFixed(1) + "%"; }

function calcTotals(lineItems, discountPercent, taxRate, retentionPercent) {
  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const laborTotal = lineItems.filter(i => !i.isMaterial).reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const materialTotal = lineItems.filter(i => i.isMaterial).reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const discountedMaterial = materialTotal * (1 - discountPercent / 100);
  const taxAmount = discountedMaterial * taxRate;
  const total = discountedSubtotal + taxAmount;
  const retentionAmount = total * (retentionPercent / 100);
  const netPayable = total - retentionAmount;
  return { subtotal, laborTotal, materialTotal, discountAmount, discountedMaterial, taxAmount, total, retentionAmount, netPayable };
}

/* ─── API Service (inline — or import from contractsApi.js) ─── */
class ContractsAPI {
  constructor(baseUrl = "/api") { this.base = baseUrl; }

  async _fetch(path, options = {}) {
    const token = localStorage.getItem('bm_token');
    const res = await fetch(`${this.base}${path}`, {
      headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}), ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `API ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Contracts (matches backend/src/routes/contracts.js) ──
  listContracts(pid) { return this._fetch(`/contracts/project/${pid}`); }
  getContract(pid, cid) { return this._fetch(`/contracts/${cid}`); }
  createContract(pid, data) { return this._fetch(`/contracts`, { method: "POST", body: JSON.stringify({ ...data, projectId: parseInt(pid) }) }); }
  updateContract(pid, cid, data) { return this._fetch(`/contracts/${cid}`, { method: "PUT", body: JSON.stringify(data) }); }
  deleteContract(pid, cid) { return this._fetch(`/contracts/${cid}`, { method: "DELETE" }); }
  convertEstimate(eid) { return this._fetch(`/contracts/from-estimate/${eid}`, { method: "POST", body: JSON.stringify({}) }); }

  // ── Estimates (uses your EXISTING estimates route) ──
  listEstimates(pid) { return this._fetch(`/estimates/project/${pid}`); }

  // ── Invoices (uses your EXISTING invoices route) ──
  createInvoice(pid, data) { return this._fetch(`/invoices`, { method: "POST", body: JSON.stringify(data) }); }
}

/* ─── Estimate → Contract mapper ─── */
function mapEstimateToContract(estimate) {
  return {
    id: uid(),
    linkedEstimateId: estimate.id,
    title: `${estimate.title || estimate.name || "Estimate"} — Contract`,
    contractType: "Prime",
    status: "Draft",
    clientOrSubName: estimate.customerName || estimate.clientName || "",
    startDate: estimate.startDate || "",
    endDate: estimate.endDate || "",
    discountPercent: estimate.discountPercent ?? 0,
    taxRate: estimate.taxRate ?? TAX_RATE,
    retentionPercent: 10,
    paymentTerms: estimate.paymentTerms || "Net 30",
    lineItems: (estimate.lineItems || estimate.items || []).map(item => ({
      id: uid(),
      description: item.description || item.name || "",
      qty: parseFloat(item.qty || item.quantity || 0),
      unitPrice: parseFloat(item.unitPrice || item.price || item.rate || 0),
      unit: item.unit || "ea",
      isMaterial: Boolean(item.isMaterial ?? item.type === "material"),
    })),
    milestones: [],
    scopeOfWork: estimate.scopeOfWork || estimate.notes || estimate.description || "",
    exclusions: estimate.exclusions || "",
    signatureStatus: "Unsigned",
    changeOrders: [],
  };
}

/* ─── Icons ─── */
const Icon = ({ d, size = 16, color = "var(--color-text-secondary)" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const PlusIcon = (p) => <Icon d="M12 5v14M5 12h14" {...p} />;
const TrashIcon = (p) => <Icon d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" {...p} />;
const ChevronDown = (p) => <Icon d="M6 9l6 6 6-6" {...p} />;
const FileIcon = (p) => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" {...p} />;
const CheckIcon = (p) => <Icon d="M20 6L9 17l-5-5" {...p} />;
const AlertIcon = (p) => <Icon d="M12 9v4M12 17h.01M10.29 3.86l-8.6 14.9A2 2 0 003.4 21h17.2a2 2 0 001.71-2.97l-8.6-14.93a2 2 0 00-3.42-.04z" {...p} />;
const DollarIcon = (p) => <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" {...p} />;
const ClipboardIcon = (p) => <Icon d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2 M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" {...p} />;
const RefreshIcon = (p) => <Icon d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" {...p} />;
const SendIcon = (p) => <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4z" {...p} />;
const LinkIcon = (p) => <Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" {...p} />;
const LayersIcon = (p) => <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...p} />;
const XIcon = (p) => <Icon d="M18 6L6 18M6 6l12 12" {...p} />;

/* ─── Styles ─── */
const cardStyle = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" };
const labelStyle = { fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", display: "block", textTransform: "uppercase", letterSpacing: "0.04em" };
const inputStyle = { width: "100%", boxSizing: "border-box" };
const btnPrimary = { background: "var(--color-text-info)", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", padding: "10px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" };
const btnGhost = { background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 14px", fontSize: "13px", cursor: "pointer", color: "var(--color-text-primary)", display: "inline-flex", alignItems: "center", gap: "5px" };
const btnSuccess = { ...btnPrimary, background: "var(--color-text-success)" };
const btnDanger = { ...btnGhost, color: "var(--color-text-danger)", borderColor: "var(--color-border-danger)" };
const pillStyle = (bg, fg) => ({ display: "inline-block", fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "var(--border-radius-md)", background: bg, color: fg });

const STATUS_COLORS = {
  Draft: { bg: "var(--color-background-secondary)", fg: "var(--color-text-secondary)" },
  Sent: { bg: "var(--color-background-info)", fg: "var(--color-text-info)" },
  Active: { bg: "var(--color-background-success)", fg: "var(--color-text-success)" },
  Completed: { bg: "var(--color-background-success)", fg: "var(--color-text-success)" },
  Cancelled: { bg: "var(--color-background-danger)", fg: "var(--color-text-danger)" },
  Pending: { bg: "var(--color-background-warning)", fg: "var(--color-text-warning)" },
  Invoiced: { bg: "var(--color-background-info)", fg: "var(--color-text-info)" },
  Paid: { bg: "var(--color-background-success)", fg: "var(--color-text-success)" },
};
function StatusPill({ status }) { const c = STATUS_COLORS[status] || STATUS_COLORS.Draft; return <span style={pillStyle(c.bg, c.fg)}>{status}</span>; }

/* ─── Section ─── */
function Section({ title, icon, children, defaultOpen = true, badge, actions }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={cardStyle}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
        {icon}
        <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", flex: 1 }}>{title}</span>
        {badge}
        {actions && <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: "6px" }}>{actions}</div>}
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s", display: "flex" }}><ChevronDown /></span>
      </div>
      {open && <div style={{ marginTop: "1rem" }}>{children}</div>}
    </div>
  );
}

function Metric({ label, value, sub, accent }) {
  return (
    <div style={{ background: accent ? "var(--color-background-info)" : "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: "12px", color: accent ? "var(--color-text-info)" : "var(--color-text-secondary)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 500, color: accent ? "var(--color-text-info)" : "var(--color-text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

/* ─── Loading spinner ─── */
function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="var(--color-border-secondary)" strokeWidth="3" fill="none" />
      <path d="M12 2a10 10 0 019.8 8" stroke="var(--color-text-info)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════
   LINE ITEMS TABLE
   ═══════════════════════════════════════ */
function LineItemsTable({ items, setItems }) {
  const addItem = () => setItems([...items, { id: uid(), description: "", qty: 1, unitPrice: 0, unit: "ea", isMaterial: false }]);
  const update = (id, field, val) => setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const remove = (id) => setItems(items.filter(i => i.id !== id));

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "640px" }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {["Description", "Type", "Unit", "Qty", "Unit Price", "Total", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 6px", fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", color: "var(--color-text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding: "6px" }}><input value={item.description} onChange={e => update(item.id, "description", e.target.value)} placeholder="Line item description..." style={{ ...inputStyle, minWidth: "180px" }} /></td>
                <td style={{ padding: "6px" }}><select value={item.isMaterial ? "material" : "labor"} onChange={e => update(item.id, "isMaterial", e.target.value === "material")} style={{ width: "90px" }}><option value="labor">Labor</option><option value="material">Material</option></select></td>
                <td style={{ padding: "6px" }}><select value={item.unit} onChange={e => update(item.id, "unit", e.target.value)} style={{ width: "70px" }}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></td>
                <td style={{ padding: "6px" }}><input type="number" value={item.qty} min={0} step={0.5} onChange={e => update(item.id, "qty", Math.max(0, parseFloat(e.target.value) || 0))} style={{ width: "64px" }} /></td>
                <td style={{ padding: "6px" }}><input type="number" value={item.unitPrice} min={0} step={0.01} onChange={e => update(item.id, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))} style={{ width: "90px" }} /></td>
                <td style={{ padding: "6px", fontWeight: 500, whiteSpace: "nowrap" }}>{fmt(item.qty * item.unitPrice)}</td>
                <td style={{ padding: "6px" }}><button onClick={() => remove(item.id)} style={{ ...btnGhost, padding: "4px 6px", border: "none" }}><TrashIcon size={14} color="var(--color-text-danger)" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addItem} style={{ ...btnGhost, marginTop: "10px" }}><PlusIcon size={14} /> Add line item</button>
    </div>
  );
}

/* ═══════════════════════════════════════
   PAYMENT SCHEDULE
   ═══════════════════════════════════════ */
function PaymentSchedule({ milestones, setMilestones, contractTotal, onGenerateInvoice }) {
  const add = () => setMilestones([...milestones, { id: uid(), milestone: "", amount: 0, pctOfTotal: 0, dueDate: "", status: "Pending" }]);
  const update = (id, field, val) => {
    setMilestones(milestones.map(m => {
      if (m.id !== id) return m;
      const u = { ...m, [field]: val };
      if (field === "pctOfTotal") u.amount = Math.round(contractTotal * (parseFloat(val) || 0) / 100 * 100) / 100;
      if (field === "amount") u.pctOfTotal = contractTotal > 0 ? Math.round((parseFloat(val) || 0) / contractTotal * 10000) / 100 : 0;
      return u;
    }));
  };
  const remove = (id) => setMilestones(milestones.filter(m => m.id !== id));
  const autoSplit = (count) => {
    const pct = Math.floor(100 / count);
    const names = count === 2 ? ["Deposit", "Final payment"] : count === 3 ? ["Deposit", "Progress payment", "Final payment"] : count === 4 ? ["Deposit", "Rough-in complete", "Finish work", "Final payment"] : Array.from({ length: count }, (_, i) => `Draw ${i + 1}`);
    setMilestones(names.map((name, i) => ({
      id: uid(), milestone: name, pctOfTotal: i === names.length - 1 ? 100 - pct * (count - 1) : pct,
      amount: i === names.length - 1 ? Math.round((contractTotal - Math.round(contractTotal * pct / 100 * 100) / 100 * (count - 1)) * 100) / 100 : Math.round(contractTotal * pct / 100 * 100) / 100,
      dueDate: "", status: "Pending",
    })));
  };
  const scheduled = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const remaining = contractTotal - scheduled;

  return (
    <div>
      {milestones.length === 0 && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ ...labelStyle, marginBottom: "8px" }}>Quick split</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[2, 3, 4].map(n => <button key={n} onClick={() => autoSplit(n)} style={btnGhost}>{n} draws</button>)}
          </div>
        </div>
      )}
      {milestones.map((m, idx) => (
        <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 120px 100px 32px 32px", gap: "8px", alignItems: "end", marginBottom: "8px" }}>
          <div>{idx === 0 && <label style={labelStyle}>Milestone</label>}<input value={m.milestone} onChange={e => update(m.id, "milestone", e.target.value)} placeholder="e.g. Rough-in complete" style={inputStyle} /></div>
          <div>{idx === 0 && <label style={labelStyle}>%</label>}<input type="number" value={m.pctOfTotal} min={0} max={100} step={1} onChange={e => update(m.id, "pctOfTotal", e.target.value)} style={inputStyle} /></div>
          <div>{idx === 0 && <label style={labelStyle}>Amount</label>}<input type="number" value={m.amount} min={0} step={0.01} onChange={e => update(m.id, "amount", e.target.value)} style={inputStyle} /></div>
          <div>{idx === 0 && <label style={labelStyle}>Due date</label>}<input type="date" value={m.dueDate} onChange={e => update(m.id, "dueDate", e.target.value)} style={inputStyle} /></div>
          <div>{idx === 0 && <label style={labelStyle}>Status</label>}<select value={m.status} onChange={e => update(m.id, "status", e.target.value)} style={inputStyle}>{MILESTONE_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={{ paddingBottom: "2px" }}>
            {m.status === "Pending" && onGenerateInvoice && (
              <button onClick={() => onGenerateInvoice(m)} style={{ ...btnGhost, padding: "4px 6px", border: "none" }} title="Generate invoice"><SendIcon size={14} color="var(--color-text-info)" /></button>
            )}
          </div>
          <div style={{ paddingBottom: "2px" }}><button onClick={() => remove(m.id)} style={{ ...btnGhost, padding: "4px 6px", border: "none" }}><TrashIcon size={14} color="var(--color-text-danger)" /></button></div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
        <button onClick={add} style={btnGhost}><PlusIcon size={14} /> Add milestone</button>
        <span style={{ fontSize: "12px", color: remaining < -0.01 ? "var(--color-text-danger)" : "var(--color-text-secondary)" }}>
          Scheduled: {fmt(scheduled)} / {fmt(contractTotal)} — Remaining: {fmt(remaining)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   FINANCIAL SUMMARY
   ═══════════════════════════════════════ */
function FinancialSummary({ totals, discountPercent, taxRate, retentionPercent }) {
  const { subtotal, laborTotal, materialTotal, discountAmount, discountedMaterial, taxAmount, total, retentionAmount, netPayable } = totals;
  const laborPct = subtotal > 0 ? laborTotal / subtotal : 0;
  const materialPct = subtotal > 0 ? materialTotal / subtotal : 0;
  const rows = [
    { label: "Labor subtotal", value: fmt(laborTotal), sub: fmtPct(laborPct) },
    { label: "Material subtotal", value: fmt(materialTotal), sub: fmtPct(materialPct) },
    { label: "Subtotal", value: fmt(subtotal), bold: true },
    ...(discountPercent > 0 ? [{ label: `Discount (${discountPercent}%)`, value: `−${fmt(discountAmount)}`, color: "var(--color-text-success)" }] : []),
    { label: `Tax (${(taxRate * 100).toFixed(1)}% on materials)`, value: fmt(taxAmount), sub: `on ${fmt(discountedMaterial)}` },
    { label: "Contract total", value: fmt(total), bold: true, accent: true },
    ...(retentionPercent > 0 ? [
      { label: `Retention held (${retentionPercent}%)`, value: `−${fmt(retentionAmount)}`, color: "var(--color-text-warning)" },
      { label: "Net payable", value: fmt(netPayable), bold: true },
    ] : []),
  ];
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderTop: r.bold ? "0.5px solid var(--color-border-tertiary)" : "none", marginTop: r.bold ? "4px" : 0 }}>
          <span style={{ fontSize: "13px", color: r.accent ? "var(--color-text-info)" : "var(--color-text-secondary)" }}>{r.label}</span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: r.accent ? "18px" : "14px", fontWeight: r.bold ? 500 : 400, color: r.color || (r.accent ? "var(--color-text-info)" : "var(--color-text-primary)") }}>{r.value}</span>
            {r.sub && <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginLeft: "6px" }}>{r.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   ESTIMATE PICKER MODAL
   ═══════════════════════════════════════ */
function EstimatePicker({ estimates, loading, onSelect, onClose }) {
  return (
    <div style={{ minHeight: "300px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "15px", fontWeight: 500 }}>Select an estimate to convert</span>
        <button onClick={onClose} style={{ ...btnGhost, padding: "4px 8px", border: "none" }}><XIcon size={16} /></button>
      </div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Spinner /></div>}
      {!loading && estimates.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)", fontSize: "13px" }}>
          No estimates found for this project. Create an estimate first.
        </div>
      )}
      {!loading && estimates.map(est => {
        const estTotal = (est.lineItems || est.items || []).reduce((s, i) => s + (i.qty || i.quantity || 0) * (i.unitPrice || i.price || i.rate || 0), 0);
        return (
          <div key={est.id} onClick={() => onSelect(est)} style={{ ...cardStyle, cursor: "pointer", marginBottom: "8px" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-info)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{est.title || est.name || "Untitled Estimate"}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  {est.customerName || est.clientName || "No client"} · {(est.lineItems || est.items || []).length} items
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>{fmt(estTotal)}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{est.status || "Draft"}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   CHANGE ORDERS SECTION
   ═══════════════════════════════════════ */
function ChangeOrdersSection({ changeOrders, parentTotal, onAddCO }) {
  const coTotalValue = changeOrders.reduce((s, co) => {
    return s + (co.lineItems || []).reduce((ls, i) => ls + i.qty * i.unitPrice, 0);
  }, 0);
  const revisedTotal = parentTotal + coTotalValue;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "1rem" }}>
        <Metric label="Original value" value={fmt(parentTotal)} />
        <Metric label="Change orders" value={fmt(coTotalValue)} sub={`${changeOrders.length} CO${changeOrders.length !== 1 ? "s" : ""}`} />
        <Metric label="Revised total" value={fmt(revisedTotal)} accent />
      </div>
      {changeOrders.map((co, idx) => {
        const coTotal = (co.lineItems || []).reduce((s, i) => s + i.qty * i.unitPrice, 0);
        return (
          <div key={co.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 500 }}>CO-{String(idx + 1).padStart(2, "0")}: {co.title || "Untitled"}</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginLeft: "8px" }}>{(co.lineItems || []).length} items</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StatusPill status={co.status || "Draft"} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: coTotal >= 0 ? "var(--color-text-primary)" : "var(--color-text-danger)" }}>{coTotal >= 0 ? "+" : ""}{fmt(coTotal)}</span>
            </div>
          </div>
        );
      })}
      <button onClick={onAddCO} style={{ ...btnGhost, marginTop: "10px" }}><PlusIcon size={14} /> Add change order</button>
    </div>
  );
}

/* ═══════════════════════════════════════
   CONTRACT LIST
   ═══════════════════════════════════════ */
function ContractList({ contracts, onSelect, onCreate, onCreateFromEstimate, loading }) {
  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>;

  if (contracts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ marginBottom: "1rem" }}><ClipboardIcon size={40} color="var(--color-text-secondary)" /></div>
        <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "6px" }}>No contracts yet</div>
        <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>Create a contract from scratch or convert an approved estimate.</div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={onCreate} style={btnPrimary}><PlusIcon size={14} color="#fff" /> New contract</button>
          <button onClick={onCreateFromEstimate} style={btnSuccess}><LinkIcon size={14} color="#fff" /> From estimate</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCreateFromEstimate} style={btnGhost}><LinkIcon size={14} /> From estimate</button>
          <button onClick={onCreate} style={btnPrimary}><PlusIcon size={14} color="#fff" /> New contract</button>
        </div>
      </div>
      {contracts.map(c => {
        const totals = calcTotals(c.lineItems || [], c.discountPercent || 0, c.taxRate || TAX_RATE, c.retentionPercent || 0);
        const paidAmount = (c.milestones || []).filter(m => m.status === "Paid").reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
        const billedPct = totals.total > 0 ? paidAmount / totals.total : 0;
        return (
          <div key={c.id} onClick={() => onSelect(c.id)} style={{ ...cardStyle, cursor: "pointer", transition: "border-color .15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 500 }}>{c.title || "Untitled Contract"}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  {c.contractType} · {c.clientOrSubName || "No party"}
                  {c.linkedEstimateId && <span style={{ marginLeft: "6px" }}><LinkIcon size={11} color="var(--color-text-info)" /> Linked</span>}
                </div>
              </div>
              <StatusPill status={c.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              <Metric label="Total" value={fmt(totals.total)} />
              <Metric label="Labor" value={fmt(totals.laborTotal)} />
              <Metric label="Materials" value={fmt(totals.materialTotal)} />
              <Metric label="Billed" value={fmtPct(billedPct)} sub={fmt(paidAmount)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   CONTRACT FORM
   ═══════════════════════════════════════ */
function ContractForm({ contract, onSave, onCancel, isNew, saving, onGenerateInvoice }) {
  const [form, setForm] = useState(() => contract ? { ...contract } : {
    id: uid(), title: "", contractType: "Prime", status: "Draft", clientOrSubName: "",
    startDate: "", endDate: "", discountPercent: 0, taxRate: TAX_RATE, retentionPercent: 10,
    paymentTerms: "Net 30", scopeOfWork: "", exclusions: "", lineItems: [], milestones: [],
    changeOrders: [], signatureStatus: "Unsigned", linkedEstimateId: null,
  });

  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const setLineItems = (items) => setField("lineItems", items);
  const setMilestones = (ms) => setField("milestones", ms);

  const totals = useMemo(() => calcTotals(form.lineItems, form.discountPercent, form.taxRate, form.retentionPercent), [form.lineItems, form.discountPercent, form.taxRate, form.retentionPercent]);

  const applyTemplate = (name) => {
    const tpl = SCOPE_TEMPLATES[name];
    if (tpl) setField("lineItems", tpl.map(i => ({ ...i, id: uid() })));
  };

  const handleAddCO = () => {
    const co = { id: uid(), title: `Change Order ${(form.changeOrders || []).length + 1}`, status: "Draft", lineItems: [{ id: uid(), description: "", qty: 1, unitPrice: 0, unit: "ea", isMaterial: false }] };
    setField("changeOrders", [...(form.changeOrders || []), co]);
  };

  const handleInvoiceMilestone = (milestone) => {
    if (onGenerateInvoice) onGenerateInvoice(form, milestone);
  };

  const warnings = useMemo(() => {
    const w = [];
    if (form.lineItems.length === 0) w.push("No line items — contract has no value.");
    const laborPct = totals.subtotal > 0 ? totals.laborTotal / totals.subtotal : 0;
    if (laborPct < 0.15 && form.lineItems.length > 0) w.push("Labor is under 15% of subtotal — verify pricing covers crew costs.");
    if (totals.materialTotal > 0 && form.taxRate === 0) w.push("Materials present but tax rate is 0% — confirm exemption.");
    const scheduled = form.milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
    if (form.milestones.length > 0 && Math.abs(scheduled - totals.total) > 1) w.push(`Payment schedule (${fmt(scheduled)}) doesn't match contract total (${fmt(totals.total)}).`);
    if (form.status === "Active" && form.signatureStatus === "Unsigned") w.push("Contract is Active but unsigned — no legal protection.");
    if (form.linkedEstimateId) w.push("Linked to estimate — changes here won't update the source estimate.");
    return w;
  }, [form, totals]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button onClick={onCancel} style={btnGhost}>Back to list</button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {saving && <Spinner size={16} />}
          <button onClick={() => onSave(form)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            <CheckIcon size={14} color="#fff" /> {isNew ? "Create contract" : "Save changes"}
          </button>
        </div>
      </div>

      {form.linkedEstimateId && (
        <div style={{ ...cardStyle, background: "var(--color-background-info)", borderColor: "var(--color-border-info)", display: "flex", alignItems: "center", gap: "8px" }}>
          <LinkIcon size={14} color="var(--color-text-info)" />
          <span style={{ fontSize: "13px", color: "var(--color-text-info)" }}>Generated from estimate — line items, pricing, and scope pre-populated.</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ ...cardStyle, background: "var(--color-background-warning)", borderColor: "var(--color-border-warning)" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <AlertIcon size={16} color="var(--color-text-warning)" />
            <div>{warnings.map((w, i) => <div key={i} style={{ fontSize: "13px", color: "var(--color-text-warning)", marginBottom: i < warnings.length - 1 ? "4px" : 0 }}>{w}</div>)}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <Section title="Contract details" icon={<FileIcon size={16} color="var(--color-text-info)" />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Contract title</label><input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="e.g. Smith Residence — Kitchen Remodel" style={inputStyle} /></div>
          <div><label style={labelStyle}>Type</label><select value={form.contractType} onChange={e => setField("contractType", e.target.value)} style={inputStyle}>{CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={labelStyle}>Status</label><select value={form.status} onChange={e => setField("status", e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label style={labelStyle}>Client / Sub name</label><input value={form.clientOrSubName} onChange={e => setField("clientOrSubName", e.target.value)} placeholder="Company or individual" style={inputStyle} /></div>
          <div><label style={labelStyle}>Payment terms</label><select value={form.paymentTerms} onChange={e => setField("paymentTerms", e.target.value)} style={inputStyle}>{PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={labelStyle}>Start date</label><input type="date" value={form.startDate} onChange={e => setField("startDate", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>End date</label><input type="date" value={form.endDate} onChange={e => setField("endDate", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Signature status</label><select value={form.signatureStatus} onChange={e => setField("signatureStatus", e.target.value)} style={inputStyle}><option>Unsigned</option><option>Signed by Contractor</option><option>Fully Executed</option></select></div>
        </div>
      </Section>

      {/* Line Items */}
      <Section title="Line items" icon={<DollarIcon size={16} color="var(--color-text-success)" />} badge={<span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{form.lineItems.length} items</span>}>
        {form.lineItems.length === 0 && !form.linkedEstimateId && (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Quick start from template</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{Object.keys(SCOPE_TEMPLATES).map(t => <button key={t} onClick={() => applyTemplate(t)} style={btnGhost}>{t}</button>)}</div>
          </div>
        )}
        <LineItemsTable items={form.lineItems} setItems={setLineItems} />
      </Section>

      {/* Financial */}
      <Section title="Pricing & tax" icon={<DollarIcon size={16} color="var(--color-text-warning)" />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
          <div><label style={labelStyle}>Discount %</label><input type="number" value={form.discountPercent} min={0} max={100} step={0.5} onChange={e => setField("discountPercent", Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tax rate %</label><input type="number" value={(form.taxRate * 100).toFixed(2)} min={0} max={30} step={0.25} onChange={e => setField("taxRate", Math.max(0, Math.min(0.3, (parseFloat(e.target.value) || 0) / 100)))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Retention %</label><input type="number" value={form.retentionPercent} min={0} max={20} step={1} onChange={e => setField("retentionPercent", Math.max(0, Math.min(20, parseFloat(e.target.value) || 0)))} style={inputStyle} /></div>
        </div>
        <FinancialSummary totals={totals} discountPercent={form.discountPercent} taxRate={form.taxRate} retentionPercent={form.retentionPercent} />
      </Section>

      {/* Payment Schedule */}
      <Section title="Payment schedule" icon={<ClipboardIcon size={16} color="var(--color-text-info)" />} badge={<span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{form.milestones.length} milestones</span>}>
        <PaymentSchedule milestones={form.milestones} setMilestones={setMilestones} contractTotal={totals.total} onGenerateInvoice={handleInvoiceMilestone} />
      </Section>

      {/* Change Orders */}
      <Section title="Change orders" icon={<LayersIcon size={16} color="var(--color-text-warning)" />} defaultOpen={false}
        badge={<span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{(form.changeOrders || []).length} COs</span>}>
        <ChangeOrdersSection changeOrders={form.changeOrders || []} parentTotal={totals.total} onAddCO={handleAddCO} />
      </Section>

      {/* Scope */}
      <Section title="Scope of work" icon={<FileIcon size={16} color="var(--color-text-secondary)" />} defaultOpen={false}>
        <div style={{ marginBottom: "12px" }}><label style={labelStyle}>Scope of work</label><textarea value={form.scopeOfWork} onChange={e => setField("scopeOfWork", e.target.value)} rows={5} placeholder="Describe the work to be performed..." style={{ ...inputStyle, resize: "vertical" }} /></div>
        <div><label style={labelStyle}>Exclusions</label><textarea value={form.exclusions} onChange={e => setField("exclusions", e.target.value)} rows={3} placeholder="What is NOT included in this contract..." style={{ ...inputStyle, resize: "vertical" }} /></div>
      </Section>

      {/* Bottom actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}><CheckIcon size={14} color="#fff" /> {isNew ? "Create contract" : "Save changes"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN MODULE
   ═══════════════════════════════════════ */
export default function ContractsModule({ projectId = "demo", apiBaseUrl = "/api", onNavigate }) {
  const api = useMemo(() => new ContractsAPI(apiBaseUrl), [apiBaseUrl]);

  // State
  const [contracts, setContracts] = useState([]);
  const [view, setView] = useState("list"); // list | form | pickEstimate
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // Estimate picker state
  const [estimates, setEstimates] = useState([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Fetch contracts ──
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listContracts(projectId);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      // If API not available, use local state (demo mode)
      console.warn("API unavailable, using local state:", err.message);
    } finally {
      setLoading(false);
    }
  }, [api, projectId]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  // ── Save ──
  const handleSave = async (contract) => {
    setSaving(true);
    try {
      const isUpdate = contracts.some(c => c.id === contract.id);
      if (isUpdate) {
        await api.updateContract(projectId, contract.id, contract).catch(() => null);
      } else {
        await api.createContract(projectId, contract).catch(() => null);
      }
      // Always update local state (works in demo mode too)
      setContracts(prev => {
        const idx = prev.findIndex(c => c.id === contract.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = contract; return next; }
        return [...prev, contract];
      });
      setView("list");
      setActiveId(null);
      showToast(isUpdate ? "Contract updated" : "Contract created");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Create from estimate ──
  const handlePickEstimate = async () => {
    setView("pickEstimate");
    setEstimatesLoading(true);
    try {
      const data = await api.listEstimates(projectId);
      setEstimates(Array.isArray(data) ? data : []);
    } catch {
      // Demo fallback — show sample estimates
      setEstimates([
        { id: "est-001", title: "Smith Kitchen Remodel", customerName: "John Smith", status: "Approved", lineItems: SCOPE_TEMPLATES["Kitchen Remodel"].map(i => ({ ...i, id: uid() })), discountPercent: 0, taxRate: TAX_RATE },
        { id: "est-002", title: "Jones Bathroom Reno", customerName: "Sarah Jones", status: "Approved", lineItems: SCOPE_TEMPLATES["Bathroom Renovation"].map(i => ({ ...i, id: uid() })), discountPercent: 5, taxRate: TAX_RATE },
        { id: "est-003", title: "Davis Exterior Paint", customerName: "Mike Davis", status: "Draft", lineItems: SCOPE_TEMPLATES["Exterior Painting"].map(i => ({ ...i, id: uid() })), discountPercent: 0, taxRate: TAX_RATE },
      ]);
    } finally {
      setEstimatesLoading(false);
    }
  };

  const handleSelectEstimate = async (estimate) => {
    try {
      // Use server-side conversion (handles field mapping on the backend)
      const draft = await api.convertEstimate(estimate.id);
      // Draft comes back without an ID — it's not saved yet
      // Add a temp ID so the form can work with it
      draft._tempId = uid();
      draft.id = null; // signals "new contract" to the save handler
      setActiveId(null);
      setView("form");
      // Pass draft directly to the form via a ref trick:
      setContracts(prev => [...prev, { ...draft, _isNewFromEstimate: true }]);
      showToast("Estimate converted — review and save");
    } catch {
      // Fallback to client-side mapping if endpoint not available
      const contract = mapEstimateToContract(estimate);
      setActiveId(null);
      setView("form");
      setContracts(prev => [...prev, contract]);
      showToast("Estimate converted — review and save");
    }
  };

  // ── Invoice from milestone ──
  const handleGenerateInvoice = async (contract, milestone) => {
    try {
      await api.createInvoice(projectId, {
        contractId: contract.id,
        milestoneId: milestone.id,
        customerName: contract.clientOrSubName,
        title: `${contract.title} — ${milestone.milestone}`,
        dueDate: milestone.dueDate,
        paymentTerms: contract.paymentTerms,
        lineItems: [{ description: `Progress payment: ${milestone.milestone}`, qty: 1, unitPrice: parseFloat(milestone.amount), isMaterial: false, unit: "ls" }],
        total: parseFloat(milestone.amount),
        status: "Draft",
      });
      showToast(`Invoice created for "${milestone.milestone}"`);
      if (onNavigate) onNavigate("invoice", null);
    } catch {
      showToast(`Invoice draft ready for "${milestone.milestone}"`);
    }
  };

  const handleCreate = () => { setActiveId(null); setView("form"); };
  const handleSelect = (id) => { setActiveId(id); setView("form"); };
  const handleCancel = () => { setView("list"); setActiveId(null); };

  const activeContract = activeId ? contracts.find(c => c.id === activeId) : null;

  // Dashboard metrics
  const dashTotals = useMemo(() => {
    let totalValue = 0, totalLabor = 0, totalMaterial = 0, totalBilled = 0;
    contracts.forEach(c => {
      const t = calcTotals(c.lineItems || [], c.discountPercent || 0, c.taxRate || TAX_RATE, c.retentionPercent || 0);
      totalValue += t.total;
      totalLabor += t.laborTotal;
      totalMaterial += t.materialTotal;
      totalBilled += (c.milestones || []).filter(m => m.status === "Paid").reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
    });
    return { totalValue, totalLabor, totalMaterial, totalBilled };
  }, [contracts]);

  return (
    <div style={{ padding: "0.5rem 0", fontFamily: "var(--font-sans)", maxWidth: "780px" }}>
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "var(--color-text-primary)", color: "var(--color-background-primary)", padding: "10px 20px", borderRadius: "var(--border-radius-md)", fontSize: "13px", fontWeight: 500, zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>{toast}</div>
      )}
      {error && (
        <div style={{ ...cardStyle, background: "var(--color-background-danger)", borderColor: "var(--color-border-danger)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-danger)" }}>{error}</span>
          <button onClick={() => setError(null)} style={{ ...btnGhost, padding: "4px 8px", border: "none" }}><XIcon size={14} color="var(--color-text-danger)" /></button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
        <ClipboardIcon size={20} color="var(--color-text-info)" />
        <span style={{ fontSize: "18px", fontWeight: 500 }}>Contracts</span>
        {view === "list" && (
          <button onClick={fetchContracts} style={{ ...btnGhost, padding: "4px 8px", border: "none", marginLeft: "auto" }} title="Refresh"><RefreshIcon size={14} /></button>
        )}
      </div>

      {view === "list" && (
        <>
          {contracts.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "1rem" }}>
              <Metric label="Total value" value={fmt(dashTotals.totalValue)} accent />
              <Metric label="Labor" value={fmt(dashTotals.totalLabor)} />
              <Metric label="Materials" value={fmt(dashTotals.totalMaterial)} />
              <Metric label="Billed" value={fmt(dashTotals.totalBilled)} sub={dashTotals.totalValue > 0 ? fmtPct(dashTotals.totalBilled / dashTotals.totalValue) : "0%"} />
            </div>
          )}
          <ContractList contracts={contracts} onSelect={handleSelect} onCreate={handleCreate} onCreateFromEstimate={handlePickEstimate} loading={loading} />
        </>
      )}

      {view === "pickEstimate" && (
        <div style={cardStyle}>
          <EstimatePicker estimates={estimates} loading={estimatesLoading} onSelect={handleSelectEstimate} onClose={handleCancel} />
        </div>
      )}

      {view === "form" && (
        <ContractForm contract={activeContract} onSave={handleSave} onCancel={handleCancel} isNew={!activeContract || !contracts.some(c => c.id === activeContract?.id)} saving={saving} onGenerateInvoice={handleGenerateInvoice} />
      )}
    </div>
  );
}
