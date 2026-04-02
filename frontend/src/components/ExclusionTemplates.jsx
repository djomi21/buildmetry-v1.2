import { useState, useMemo } from 'react';
import { uid } from '../utils/calculations';
import { I } from './shared/Icons';
import { KpiCard, ES } from './shared/ui';

export default function ExclusionTemplates({ templates, showToast, db }) {
  const [form, setForm] = useState(null);
  const [srch, setSrch] = useState("");

  const filt = useMemo(() =>
    templates.filter(t => !srch || t.name.toLowerCase().includes(srch.toLowerCase()) || t.content.toLowerCase().includes(srch.toLowerCase())),
    [templates, srch]
  );

  const blank = { name: "", content: "" };
  const openNew = () => setForm({ ...blank, _id: null });
  const openEdit = t => setForm({ ...t, _id: t.id });
  const save = () => {
    if (!form.name.trim()) { showToast("Template name required", "error"); return; }
    const { _id, ...data } = form;
    if (_id) {
      db.update(_id, data);
      showToast("Template updated");
    } else {
      db.create({ ...data, id: uid() });
      showToast("Template added");
    }
    setForm(null);
  };
  const del = id => { db.remove(id); showToast("Removed"); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="g4">
        <KpiCard label="Total Templates" val={templates.length} sub="" color="#f59e0b"/>
      </div>

      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }}><I n="search" s={12}/></div>
          <input className="inp" value={srch} onChange={e => setSrch(e.target.value)} placeholder="Search templates…" style={{ paddingLeft: 27, fontSize: 12 }}/>
        </div>
        <button onClick={openNew} className="bb b-bl" style={{ padding: "8px 14px", fontSize: 12 }}><I n="plus" s={13}/>Add Template</button>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "var(--bg-sidebar)" }}>
              {["Template Name", "Content Preview", ""].map(h =>
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .3, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filt.map((t, i) => (
              <tr key={t.id} className="rh" style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.012)" }}>
                <td style={{ padding: "9px 14px", fontWeight: 700, color: "var(--text-2)", whiteSpace: "nowrap", minWidth: 160 }}>{t.name}</td>
                <td style={{ padding: "9px 14px", color: "var(--text-dim)", maxWidth: 400 }}>
                  <div style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>
                    {t.content || <span style={{ color: "var(--text-faint)", fontStyle: "italic" }}>No content</span>}
                  </div>
                </td>
                <td style={{ padding: "9px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openEdit(t)} style={{ color: "var(--text-dim)", opacity: .7 }} className="rh"><I n="edit" s={13}/></button>
                    <button onClick={() => del(t.id)} style={{ color: "#ef4444", opacity: .5 }} className="rh"><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filt.length === 0 && <ES icon="estimates" text={templates.length === 0 ? "No exclusion templates yet. Click 'Add Template' to create your first one." : "No templates match your search."}/>}
      </div>

      {form && (
        <div className="ov" onClick={e => e.target === e.currentTarget && setForm(null)}>
          <div className="mo" style={{ maxWidth: 540, marginTop: 60 }}>
            <div style={{ padding: "17px 24px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{form._id ? "Edit Exclusion Template" : "Add Exclusion Template"}</div>
              <button onClick={() => setForm(null)} style={{ color: "var(--text-dim)" }}><I n="x"/></button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <label className="lbl">Template Name *</label>
                <input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Exclusions"/>
              </div>
              <div>
                <label className="lbl">Content</label>
                <textarea className="inp" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} placeholder="List items not included in this contract…" style={{ resize: "vertical" }}/>
              </div>
              <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
                <button onClick={() => setForm(null)} className="bb b-gh" style={{ flex: 1, padding: "10px", justifyContent: "center" }}>Cancel</button>
                <button onClick={save} className="bb b-bl" style={{ flex: 2, padding: "10px", fontSize: 13, justifyContent: "center" }}><I n="check" s={13}/>{form._id ? "Update" : "Add"} Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
