"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { listEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, generateAITemplate } from "@/lib/communication-api";

const CATEGORIES = ["Onboarding", "Leave", "Payroll", "Events", "HR", "Exit", "Announcement", "Assets", "General"];
const TONES = ["formal", "friendly", "celebratory", "urgent", "empathetic"];
const CATEGORY_COLORS = {
  Onboarding: "bg-blue-50 text-blue-700 border-blue-200", Leave: "bg-amber-50 text-amber-700 border-amber-200",
  Payroll: "bg-green-50 text-green-700 border-green-200", Events: "bg-purple-50 text-purple-700 border-purple-200",
  HR: "bg-indigo-50 text-indigo-700 border-indigo-200", Exit: "bg-red-50 text-red-700 border-red-200",
  Announcement: "bg-orange-50 text-orange-700 border-orange-200", Assets: "bg-cyan-50 text-cyan-700 border-cyan-200",
  General: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", category: "General", subject: "", body_html: "" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchTemplates = async () => {
    setLoading(true);
    const params = {};
    if (catFilter !== "All") params.category = catFilter;
    if (search) params.search = search;
    const res = await listEmailTemplates(params);
    if (res.ok && res.data) setTemplates(res.data.templates || res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, [catFilter]);

  const extractVariables = (text) => [...new Set((text || "").match(/\{\{(\w+)\}\}/g)?.map(m => m.replace(/\{|\}/g, "")) || [])];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body_html) { showToast("Fill all required fields", "error"); return; }
    setFormLoading(true);
    const payload = { ...form, variables: extractVariables(form.subject + " " + form.body_html) };
    const res = editTpl ? await updateEmailTemplate(editTpl.id || editTpl._id, payload) : await createEmailTemplate(payload);
    if (res.ok) { showToast(editTpl ? "Template updated!" : "Template created!"); setShowCreate(false); setEditTpl(null); setForm({ name: "", category: "General", subject: "", body_html: "" }); fetchTemplates(); }
    else showToast(res.data?.detail || "Failed", "error");
    setFormLoading(false);
  };

  const handleDelete = async (tpl) => {
    if (!confirm(`Delete "${tpl.name}"?`)) return;
    const res = await deleteEmailTemplate(tpl.id || tpl._id);
    if (res.ok) { showToast("Deleted"); fetchTemplates(); }
    else showToast(res.data?.detail || "Failed", "error");
  };

  const openEdit = (tpl) => { setForm({ name: tpl.name, category: tpl.category || "General", subject: tpl.subject || "", body_html: tpl.body_html || "" }); setEditTpl(tpl); setShowCreate(true); };

  const filtered = templates.filter(t => (t.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}</motion.div>)}</AnimatePresence>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchTemplates()}
            placeholder="Search templates…" className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 w-56 shadow-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${catFilter === c ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}>{c}</button>
          ))}
        </div>
        <button onClick={() => { setEditTpl(null); setForm({ name: "", category: "General", subject: "", body_html: "" }); setShowCreate(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 ml-auto">
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {/* Grid */}
      {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center"><FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-400">No templates found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <motion.div key={tpl.id || tpl._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-slate-900">{tpl.name}</h4>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.General}`}>{tpl.category}</span>
              </div>
              <p className="text-[10px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 truncate">Subject: {tpl.subject}</p>
              {tpl.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1">{tpl.variables.slice(0, 4).map(v => <span key={v} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">{`{{${v}}}`}</span>)}{tpl.variables.length > 4 && <span className="text-[9px] text-slate-400">+{tpl.variables.length - 4}</span>}</div>
              )}
              <div className="flex gap-2 pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(tpl)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-100"><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => handleDelete(tpl)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-100"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCreate(false); setShowAI(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">{editTpl ? "Edit Template" : "Create Template"}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAI(!showAI)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold"><Sparkles className="w-3 h-3" /> AI</button>
                  <button onClick={() => { setShowCreate(false); setShowAI(false); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {showAI && <AIBlock onApply={(r) => { setForm(f => ({ ...f, subject: r.subject || f.subject, body_html: r.body_html || f.body_html })); setShowAI(false); }} />}
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Welcome Email" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Category *</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-400">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Subject *</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required placeholder="Welcome to {{company_name}}" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Body (HTML) *</label><textarea rows={6} value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} required placeholder="<p>Dear {{employee_name}},</p>" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none font-mono" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 mb-1">Detected Variables:</p><div className="flex flex-wrap gap-1.5">{extractVariables(form.subject + " " + form.body_html).map(v => <span key={v} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{`{{${v}}}`}</span>)}</div></div>
                  <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50">{formLoading ? "Saving..." : editTpl ? "Update" : "Create"}</motion.button>
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
  const handleGen = async () => { if (!prompt.trim()) return; setLoading(true); const res = await generateAITemplate({ prompt, tone }); if (res.ok) setResult(res.data); else setResult({ error: res.data?.detail || "Failed" }); setLoading(false); };
  return (
    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3">
      <textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the email..." className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs outline-none focus:border-indigo-400 resize-none" />
      <div className="flex gap-1.5">{TONES.map(t => <button key={t} onClick={() => setTone(t)} className={`px-2 py-1 rounded text-[9px] font-bold capitalize ${tone === t ? "bg-indigo-200 text-indigo-800" : "bg-white text-slate-500 border border-slate-200"}`}>{t}</button>)}</div>
      <button onClick={handleGen} disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">{loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Generate</button>
      {result && !result.error && <div className="space-y-2"><div className="bg-white p-2 rounded-lg text-xs"><strong>Subject:</strong> {result.subject}</div><button onClick={() => onApply(result)} className="w-full py-2 bg-green-600 text-white rounded-lg text-[10px] font-bold">Use This</button></div>}
      {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
    </div>
  );
}
