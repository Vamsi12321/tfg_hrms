"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Send, X, CheckCircle2, AlertCircle, Users, User, Globe, Building2, RefreshCw, Search, BarChart3, Clock, Download } from "lucide-react";
import { createCampaign, sendCampaign } from "@/lib/communication-api";
import { listDepartments, listEmployees } from "@/lib/api";
import { useCampaigns, useEmailTemplates, useCommStats, useCommInvalidate } from "@/lib/communication-queries";

export default function CampaignsPage() {
  const [showNew, setShowNew] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ name: "", template_id: "", audience_type: "all", department_names: [], employee_ids: [], subject: "", body_html: "", schedule_at: "" });
  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const invalidate = useCommInvalidate();
  const { data: campaignData, isLoading: loading } = useCampaigns(statusFilter ? { status: statusFilter } : {});
  const campaigns = campaignData?.campaigns || [];
  const { data: templates = [] } = useEmailTemplates();
  const { data: stats } = useCommStats();
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => { listDepartments().then(r => { if (r.ok) setDepartments(r.data?.departments || r.data || []); }); }, []);
  const fetchEmployees = async (dept, search) => { setEmpLoading(true); const p = { limit: 100, status: "active" }; if (dept) p.department = dept; if (search) p.search = search; const r = await listEmployees(p); if (r.ok) setEmpList(r.data?.employees || []); setEmpLoading(false); };
  useEffect(() => { if (form.audience_type !== "individuals") return; const t = setTimeout(() => fetchEmployees(empDeptFilter, empSearch), 400); return () => clearTimeout(t); }, [empSearch, empDeptFilter, form.audience_type]);
  useEffect(() => { if (form.audience_type === "individuals") fetchEmployees("", ""); }, [form.audience_type]);

  const handleCreate = async (e) => {
    e.preventDefault(); if (!form.name) { showToast("Name required", "error"); return; }
    if (form.audience_type === "individuals" && form.employee_ids.length === 0) { showToast("Select employees", "error"); return; }
    setFormLoading(true);
    const payload = { name: form.name, audience_type: form.audience_type, subject: form.subject || undefined, body_html: form.body_html || undefined, template_id: form.template_id || undefined, schedule_at: form.schedule_at || undefined };
    if (form.audience_type === "department") payload.audience_departments = form.department_names;
    if (form.audience_type === "individuals") payload.audience_employee_ids = form.employee_ids;
    const res = await createCampaign(payload);
    if (res.ok) { showToast("Campaign created!"); setShowNew(false); invalidate("campaigns"); invalidate("comm-stats"); setForm({ name: "", template_id: "", audience_type: "all", department_names: [], employee_ids: [], subject: "", body_html: "", schedule_at: "" }); }
    else showToast(res.data?.detail || "Failed", "error"); setFormLoading(false);
  };
  const handleSend = async (id) => { if (!confirm("Send now?")) return; const r = await sendCampaign(id); if (r.ok) { showToast("Sent!"); invalidate("campaigns"); invalidate("comm-stats"); } else showToast(r.data?.detail || "Failed", "error"); };

  const exportCampaignsCSV = () => {
    if (!campaigns.length) return;
    const headers = ["Name", "Audience", "Status", "Total", "Delivered", "Failed", "Created At"];
    const rows = campaigns.map(c => [
      (c.name || "").replace(/,/g, " "),
      c.audience_type || "",
      c.status || "",
      c.total_recipients || 0,
      c.delivered_count || 0,
      c.failed_count || 0,
      c.created_at || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaigns_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}</motion.div>)}</AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-bold text-slate-900">Email Campaigns</h2><p className="text-xs text-slate-400">Create and manage bulk email campaigns</p></div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </motion.button>
      </div>

      {/* Stats Section (like "Shift Timings") */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
            <div><h3 className="text-sm font-bold text-slate-900">Campaign Performance</h3><p className="text-[10px] text-slate-400">Overall email delivery statistics</p></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Total Sent</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{stats.total_sent || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50/60 border border-green-100">
              <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Delivered</p>
              <p className="text-2xl font-black text-green-700 mt-1">{stats.delivered || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-100">
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Failed</p>
              <p className="text-2xl font-black text-red-700 mt-1">{stats.failed || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Campaigns</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{stats.campaigns_count || campaigns.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign List Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><Megaphone className="w-5 h-5 text-indigo-600" /></div>
            <div><h3 className="text-sm font-bold text-slate-900">All Campaigns</h3><p className="text-[10px] text-slate-400">Filter by status</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCampaignsCSV} disabled={!campaigns.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
        <div className="px-5 py-3 border-b border-slate-50 flex gap-1.5">
            {["", "draft", "sent", "failed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                {s || "All"}
              </button>
            ))}
        </div>

        <div className="p-5">
          {loading ? <div className="py-8 flex justify-center"><div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          : campaigns.length === 0 ? (
            <div className="py-8 text-center"><Megaphone className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No campaigns yet</p></div>
          ) : (
            <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                  {["Campaign", "Audience", "Sent", "Failed", "Status", "Date", ""].map(h => <th key={h} className="text-left text-[10px] font-bold text-white uppercase px-4 py-3 tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <motion.tr key={c.id || c._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setSelectedCampaign(c)}
                      className="border-t border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors group">
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        {c.subject && <p className="text-[9px] text-slate-400 truncate max-w-[180px]">{c.subject}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-600">
                        {c.audience_type === "all" ? "All" : c.audience_type === "department" ? (c.audience_departments || []).join(", ") : `${(c.audience_employee_ids || []).length} people`}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-black text-green-600">{c.stats?.sent || 0}</td>
                      <td className="px-4 py-3.5 text-xs font-black text-red-500">{c.stats?.failed || 0}</td>
                      <td className="px-4 py-3.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${c.status === "sent" ? "bg-green-50 text-green-600 border border-green-200" : c.status === "failed" ? "bg-red-50 text-red-500 border border-red-200" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>{c.status}</span></td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-500">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3.5">{(c.status === "draft" || c.status === "scheduled") && <button onClick={(e) => { e.stopPropagation(); handleSend(c.id || c._id); }} className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 flex items-center justify-center"><Send className="w-3.5 h-3.5 text-green-600" /></button>}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {campaigns.map((c, i) => (
                <div key={c.id || c._id || i} onClick={() => setSelectedCampaign(c)}
                  className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                      {c.subject && <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.subject}</p>}
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${c.status === "sent" ? "bg-green-50 text-green-600 border border-green-200" : c.status === "failed" ? "bg-red-50 text-red-500 border border-red-200" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>{c.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold">Audience</p>
                      <p className="text-xs font-bold text-slate-700 capitalize mt-0.5">{c.audience_type || "all"}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-[9px] text-green-500 font-bold">Sent</p>
                      <p className="text-xs font-black text-green-700 mt-0.5">{c.stats?.sent || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-[9px] text-red-500 font-bold">Failed</p>
                      <p className="text-xs font-black text-red-700 mt-0.5">{c.stats?.failed || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</span>
                    {(c.status === "draft" || c.status === "scheduled") && <button onClick={(e) => { e.stopPropagation(); handleSend(c.id || c._id); }} className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-[9px] font-bold text-green-600">Send Now</button>}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><Megaphone className="w-4 h-4 text-indigo-600" /></div><div><h3 className="text-sm font-bold text-slate-900">New Campaign</h3><p className="text-[10px] text-slate-400">Send to targeted audience</p></div></div>
                <button onClick={() => setShowNew(false)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 space-y-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="July Newsletter" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Template</label><select value={form.template_id} onChange={e => { const t = templates.find(x => (x.id || x._id) === e.target.value); setForm(f => ({ ...f, template_id: e.target.value, subject: t?.subject || f.subject, body_html: t?.body_html || f.body_html })); }} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-400 cursor-pointer"><option value="">Custom</option>{templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}</select></div>
                {!form.template_id && <><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Subject</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Body</label><textarea rows={3} value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none" /></div></>}
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Audience</label><div className="grid grid-cols-3 gap-2">{[{ v: "all", l: "All", i: Globe }, { v: "department", l: "Dept", i: Building2 }, { v: "individuals", l: "Select", i: User }].map(o => <button type="button" key={o.v} onClick={() => setForm(f => ({ ...f, audience_type: o.v }))} className={`p-3 rounded-xl border-2 text-center ${form.audience_type === o.v ? "bg-blue-50 border-blue-400" : "bg-white border-slate-100"}`}><o.i className={`w-4 h-4 mx-auto mb-0.5 ${form.audience_type === o.v ? "text-blue-600" : "text-slate-400"}`} /><p className={`text-[9px] font-bold ${form.audience_type === o.v ? "text-blue-700" : "text-slate-500"}`}>{o.l}</p></button>)}</div></div>
                {form.audience_type === "department" && <div className="flex flex-wrap gap-1.5">{departments.map(d => <button type="button" key={d.name} onClick={() => setForm(f => ({ ...f, department_names: f.department_names.includes(d.name) ? f.department_names.filter(x => x !== d.name) : [...f.department_names, d.name] }))} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border ${form.department_names.includes(d.name) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>{d.name}</button>)}</div>}
                {form.audience_type === "individuals" && <div className="space-y-2"><div className="flex gap-2"><select value={empDeptFilter} onChange={e => setEmpDeptFilter(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] bg-white outline-none cursor-pointer"><option value="">All</option>{departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}</select><div className="relative flex-1"><Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" /><input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search..." className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none" /></div></div>{form.employee_ids.length > 0 && <p className="text-[9px] font-bold text-blue-600">{form.employee_ids.length} selected <button type="button" onClick={() => setForm(f => ({ ...f, employee_ids: [] }))} className="text-red-500 ml-1">Clear</button></p>}<div className="rounded-lg border border-slate-200 max-h-28 overflow-y-auto divide-y divide-slate-50">{empLoading ? <div className="p-3 flex justify-center"><div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : empList.slice(0, 12).map(emp => { const id = emp.employee_id || emp.id || emp._id; const sel = form.employee_ids.includes(id); return <button type="button" key={id} onClick={() => setForm(f => ({ ...f, employee_ids: sel ? f.employee_ids.filter(x => x !== id) : [...f.employee_ids, id] }))} className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50/50 ${sel ? "bg-blue-50" : ""}`}><div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold ${sel ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{sel ? "✓" : (emp.first_name || "?")[0]}</div><span className="text-[10px] font-semibold text-slate-700 truncate">{emp.first_name} {emp.last_name}</span></button>; })}</div></div>}
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Schedule</label><input type="datetime-local" value={form.schedule_at} onChange={e => setForm(f => ({ ...f, schedule_at: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowNew(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={formLoading} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5">{formLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {formLoading ? "Creating..." : "Create"}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Campaign Detail Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedCampaign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCampaign(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><Megaphone className="w-4 h-4 text-indigo-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedCampaign.name}</h3>
                    <p className="text-[10px] text-slate-400">{selectedCampaign.created_at ? new Date(selectedCampaign.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCampaign(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${selectedCampaign.status === "sent" ? "bg-green-50 text-green-600 border border-green-200" : selectedCampaign.status === "failed" ? "bg-red-50 text-red-500 border border-red-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>{selectedCampaign.status}</span>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-green-500 uppercase">Sent</p>
                    <p className="text-lg font-black text-green-700 mt-0.5">{selectedCampaign.stats?.sent || 0}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-red-500 uppercase">Failed</p>
                    <p className="text-lg font-black text-red-700 mt-0.5">{selectedCampaign.stats?.failed || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Audience</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 capitalize">{selectedCampaign.audience_type || "all"}</p>
                    {selectedCampaign.audience_departments?.length > 0 && <p className="text-[10px] text-slate-500 mt-0.5">{selectedCampaign.audience_departments.join(", ")}</p>}
                  </div>
                  {selectedCampaign.template_id && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Template</p>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">{selectedCampaign.template_name || selectedCampaign.template_id}</p>
                    </div>
                  )}
                </div>
                {selectedCampaign.subject && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject</p>
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{selectedCampaign.subject}</p>
                    </div>
                  </div>
                )}
                {selectedCampaign.body_html && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Content</p>
                    <div className="border border-slate-200 rounded-xl p-5 bg-white overflow-y-auto max-h-[250px]">
                      <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: selectedCampaign.body_html }} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
