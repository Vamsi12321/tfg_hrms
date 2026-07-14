"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Mail, Copy, Eye } from "lucide-react";
import { listEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, generateAITemplate } from "@/lib/communication-api";

const CATEGORIES = ["Onboarding", "Leave", "Payroll", "Events", "HR", "Exit", "Announcement", "Assets", "General"];
const TONES = ["formal", "friendly", "celebratory", "urgent", "empathetic"];
const CAT_COLOR = {
  Onboarding: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: "text-blue-500" },
  Leave: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: "text-amber-500" },
  Payroll: { bg: "bg-green-50", text: "text-green-700", border: "border-green-100", icon: "text-green-500" },
  Events: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", icon: "text-purple-500" },
  HR: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", icon: "text-indigo-500" },
  Exit: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100", icon: "text-red-500" },
  Announcement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", icon: "text-orange-500" },
  Assets: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100", icon: "text-cyan-500" },
  General: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: "text-slate-500" },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [previewTpl, setPreviewTpl] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", category: "General", subject: "", body_html: "" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const extractVars = (t) => [...new Set((t || "").match(/\{\{(\w+)\}\}/g)?.map(m => m.replace(/\{|\}/g, "")) || [])];

  const fetchTemplates = async () => {
    setLoading(true);
    const p = {}; if (catFilter !== "All") p.category = catFilter; if (search) p.search = search;
    const res = await listEmailTemplates(p);
    if (res.ok && res.data) setTemplates(res.data.templates || res.data || []);
    setLoading(false);
  };
  useEffect(() => { fetchTemplates(); }, [catFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body_html) { showToast("Fill all fields", "error"); return; }
    setFormLoading(true);
    const payload = { ...form, variables: extractVars(form.subject + " " + form.body_html) };
    const res = editTpl ? await updateEmailTemplate(editTpl.id || editTpl._id, payload) : await createEmailTemplate(payload);
    if (res.ok) { showToast(editTpl ? "Updated!" : "Created!"); setShowCreate(false); setEditTpl(null); setForm({ name: "", category: "General", subject: "", body_html: "" }); fetchTemplates(); }
    else showToast(res.data?.detail || "Failed", "error");
    setFormLoading(false);
  };
  const handleDelete = async (tpl) => { if (!confirm(`Delete "${tpl.name}"?`)) return; const res = await deleteEmailTemplate(tpl.id || tpl._id); if (res.ok) { showToast("Deleted"); fetchTemplates(); } else showToast("Failed", "error"); };
  const openEdit = (tpl) => { setForm({ name: tpl.name, category: tpl.category || "General", subject: tpl.subject || "", body_html: tpl.body_html || "" }); setEditTpl(tpl); setShowCreate(true); };
  const filtered = templates.filter(t => (t.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}</motion.div>)}</AnimatePresence>

      {/* Section Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Email Templates</h3>
              <p className="text-xs text-slate-400">{templates.length} reusable template{templates.length !== 1 ? "s" : ""} for quick communication</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditTpl(null); setForm({ name: "", category: "General", subject: "", body_html: "" }); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">
            <Plus className="w-3.5 h-3.5" /> New Template
          </motion.button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-50 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchTemplates()}
              placeholder="Search..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${catFilter === c ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? <div className="py-12 flex justify-center"><div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">{search ? "No templates match" : "No templates yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                  {["Template", "Subject", "Variables", "Actions"].map(h => <th key={h} className="text-left text-[10px] font-bold text-white uppercase px-5 py-3 tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map((tpl, idx) => {
                    const cc = CAT_COLOR[tpl.category] || CAT_COLOR.General;
                    const vars = tpl.variables || extractVars(tpl.subject + " " + (tpl.body_html || ""));
                    return (
                      <motion.tr key={tpl.id || tpl._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="border-t border-slate-100 hover:bg-slate-50/50 group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${cc.bg} border ${cc.border} flex items-center justify-center flex-shrink-0`}>
                              <FileText className={`w-4 h-4 ${cc.icon}`} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{tpl.name}</p>
                              <p className={`text-[9px] font-semibold ${cc.text}`}>{tpl.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-[250px] truncate">{tpl.subject || "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {vars.slice(0, 3).map(v => <span key={v} className="text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>)}
                            {vars.length > 3 && <span className="text-[8px] text-slate-400">+{vars.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setPreviewTpl(tpl)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200" title="Preview"><Eye className="w-3.5 h-3.5 text-slate-500" /></button>
                            <button onClick={() => openEdit(tpl)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center border border-blue-200" title="Edit"><Pencil className="w-3.5 h-3.5 text-blue-600" /></button>
                            <button onClick={() => handleDelete(tpl)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTpl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewTpl(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div><h3 className="text-sm font-bold text-slate-900">{previewTpl.name}</h3><p className="text-[10px] text-slate-400">{previewTpl.category}</p></div>
                <button onClick={() => setPreviewTpl(null)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase">Subject</p><p className="text-sm font-semibold text-slate-800 mt-1">{previewTpl.subject}</p></div>
                <div className="p-3 border border-slate-200 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Body</p><div className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: previewTpl.body_html || "<p>No body content</p>" }} /></div>
                {previewTpl.variables?.length > 0 && <div className="flex flex-wrap gap-1.5">{previewTpl.variables.map(v => <span key={v} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">{`{{${v}}}`}</span>)}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCreate(false); setShowAI(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><Mail className="w-4 h-4 text-emerald-600" /></div>
                  <div><h3 className="text-sm font-bold text-slate-900">{editTpl ? "Edit Template" : "Create Template"}</h3><p className="text-[10px] text-slate-400">Reusable email with dynamic variables</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAI(!showAI)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold ${showAI ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}><Sparkles className="w-3 h-3" /> AI</button>
                  <button onClick={() => { setShowCreate(false); setShowAI(false); }} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {showAI && <AIBlock onApply={(r) => { setForm(f => ({ ...f, subject: r.subject || f.subject, body_html: r.body_html || f.body_html })); setShowAI(false); showToast("AI applied!"); }} />}
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Welcome Email" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-400 cursor-pointer">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Subject *</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required placeholder="Welcome to {{company_name}}" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Body *</label><textarea rows={6} value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} required placeholder="<p>Dear {{employee_name}},</p>" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 resize-none font-mono" /></div>
                  {extractVars(form.subject + " " + form.body_html).length > 0 && <div className="flex flex-wrap gap-1">{extractVars(form.subject + " " + form.body_html).map(v => <span key={v} className="text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>)}</div>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowCreate(false); setShowAI(false); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={formLoading} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
                      {formLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} {formLoading ? "Saving..." : editTpl ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIBlock({ onApply }) {
  const [prompt, setPrompt] = useState(""); const [tone, setTone] = useState("formal"); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const gen = async () => { if (!prompt.trim()) return; setLoading(true); const r = await generateAITemplate({ prompt, tone }); if (r.ok) setResult(r.data); else setResult({ error: r.data?.detail || "Failed" }); setLoading(false); };
  return (
    <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 space-y-3">
      <p className="text-[10px] font-bold text-indigo-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Email Generator</p>
      <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the email you want..." className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs outline-none focus:border-indigo-400 bg-white" />
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1 flex-wrap">{TONES.map(t => <button key={t} onClick={() => setTone(t)} className={`px-2 py-1 rounded text-[8px] font-bold capitalize ${tone === t ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>{t}</button>)}</div>
        <button onClick={gen} disabled={loading || !prompt.trim()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-bold disabled:opacity-50 flex items-center gap-1">{loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Generate</button>
      </div>
      {result && !result.error && <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-green-200"><div className="flex-1 min-w-0"><p className="text-[9px] text-green-600 font-bold truncate">{result.subject}</p></div><button onClick={() => onApply(result)} className="px-3 py-1 bg-green-600 text-white rounded text-[8px] font-bold flex-shrink-0">Use</button></div>}
      {result?.error && <p className="text-[9px] text-red-500">{result.error}</p>}
    </div>
  );
}
