"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Send, X, CheckCircle2, AlertCircle, Users, User, Globe, Building2, RefreshCw, Search } from "lucide-react";
import { createCampaign, sendCampaign } from "@/lib/communication-api";
import { listDepartments, listEmployees } from "@/lib/api";
import { useCampaigns, useEmailTemplates, useCommStats, useCommInvalidate } from "@/lib/communication-queries";

const STATUS_CFG = {
  draft: "bg-slate-50 text-slate-600 border-slate-200", scheduled: "bg-purple-50 text-purple-600 border-purple-200",
  sending: "bg-blue-50 text-blue-600 border-blue-200", sent: "bg-green-50 text-green-600 border-green-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

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

  const invalidate = useCommInvalidate();
  const { data: campaignData, isLoading: loading } = useCampaigns(statusFilter ? { status: statusFilter } : {});
  const campaigns = campaignData?.campaigns || [];
  const { data: templates = [] } = useEmailTemplates();
  const { data: stats } = useCommStats();

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    listDepartments().then(r => { if (r.ok) setDepartments(r.data?.departments || r.data || []); });
  }, []);

  // Fetch employees when individuals is selected
  const fetchEmployees = async (dept, search) => {
    setEmpLoading(true);
    const params = { limit: 100, status: "active" };
    if (dept) params.department = dept;
    if (search) params.search = search;
    const res = await listEmployees(params);
    if (res.ok && res.data) setEmpList(res.data.employees || []);
    setEmpLoading(false);
  };

  useEffect(() => {
    if (form.audience_type !== "individuals") return;
    const timer = setTimeout(() => fetchEmployees(empDeptFilter, empSearch), 400);
    return () => clearTimeout(timer);
  }, [empSearch, empDeptFilter, form.audience_type]);

  useEffect(() => {
    if (form.audience_type === "individuals" && empList.length === 0) fetchEmployees("", "");
  }, [form.audience_type]);

  const handleCreate = async (e) => {
    e.preventDefault(); if (!form.name) { showToast("Name required", "error"); return; }
    if (form.audience_type === "individuals" && form.employee_ids.length === 0) { showToast("Select at least one employee", "error"); return; }
    setFormLoading(true);
    const payload = {
      name: form.name,
      audience_type: form.audience_type,
      subject: form.subject || undefined,
      body_html: form.body_html || undefined,
      template_id: form.template_id || undefined,
      schedule_at: form.schedule_at || undefined,
    };
    // Map frontend field names to API field names
    if (form.audience_type === "department") payload.audience_departments = form.department_names;
    if (form.audience_type === "individuals") payload.audience_employee_ids = form.employee_ids;
    const res = await createCampaign(payload);
    if (res.ok) { showToast("Campaign created!"); setShowNew(false); invalidate("campaigns"); invalidate("comm-stats"); setForm({ name: "", template_id: "", audience_type: "all", department_names: [], employee_ids: [], subject: "", body_html: "", schedule_at: "" }); }
    else showToast(res.data?.detail || "Failed", "error");
    setFormLoading(false);
  };

  const handleSend = async (id) => { if (!confirm("Send this campaign now?")) return; const res = await sendCampaign(id); if (res.ok) { showToast("Sent!"); invalidate("campaigns"); invalidate("comm-stats"); } else showToast(res.data?.detail || "Failed", "error"); };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}</motion.div>)}</AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-900">Email Campaigns</h2>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"><Plus className="w-3.5 h-3.5" /> New Campaign</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: stats.total_sent || 0, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Delivered", value: stats.delivered || 0, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
            { label: "Failed", value: stats.failed || 0, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
            { label: "Campaigns", value: stats.campaigns_count || campaigns.length, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-2">
        {["", "draft", "scheduled", "sent", "failed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${statusFilter === s ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center"><Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-400">No campaigns yet</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                {["Campaign", "Audience", "Sent", "Failed", "Status", "Created By", "Date", ""].map(h => <th key={h} className="text-[10px] font-bold text-white uppercase px-5 py-3 tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const statusCls = STATUS_CFG[c.status] || STATUS_CFG.draft;
                  return (
                    <motion.tr key={c.id || c._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        {c.subject && <p className="text-[9px] text-slate-400 truncate max-w-[180px]">{c.subject}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                          {c.audience_type === "all" ? <><Globe className="w-3 h-3 text-slate-400" /> All</> : c.audience_type === "department" ? <><Building2 className="w-3 h-3 text-slate-400" /> {(c.audience_departments || c.department_names || []).join(", ") || "Dept"}</> : <><User className="w-3 h-3 text-slate-400" /> {(c.audience_employee_ids || c.employee_ids || []).length} people</>}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-black text-slate-800">{c.stats?.sent || 0}</td>
                      <td className="px-5 py-3.5 text-xs font-black text-red-500">{c.stats?.failed || 0}</td>
                      <td className="px-5 py-3.5"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border capitalize ${statusCls}`}>{c.status}</span></td>
                      <td className="px-5 py-3.5 text-[10px] text-slate-500">{c.created_by_name || "—"}</td>
                      <td className="px-5 py-3.5 text-[10px] text-slate-500">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3.5">
                        {(c.status === "draft" || c.status === "scheduled") && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleSend(c.id || c._id)}
                            className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center" title="Send Now">
                            <Send className="w-3.5 h-3.5 text-green-600" />
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between"><h3 className="text-base font-bold text-slate-900">New Campaign</h3><button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button></div>
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="July Newsletter" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Template</label><select value={form.template_id} onChange={e => { const tpl = templates.find(t => (t.id || t._id) === e.target.value); setForm(f => ({ ...f, template_id: e.target.value, subject: tpl?.subject || f.subject, body_html: tpl?.body_html || f.body_html })); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-400"><option value="">Custom</option>{templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}</select></div>
                {!form.template_id && <><div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Subject</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div><div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Body</label><textarea rows={4} value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none" /></div></>}
                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Audience</label><div className="grid grid-cols-3 gap-2">{[{ v: "all", l: "All", i: Globe }, { v: "department", l: "Dept", i: Building2 }, { v: "individuals", l: "Select", i: User }].map(o => <button type="button" key={o.v} onClick={() => setForm(f => ({ ...f, audience_type: o.v }))} className={`p-2.5 rounded-xl border text-center ${form.audience_type === o.v ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}><o.i className="w-4 h-4 mx-auto mb-0.5" /><p className="text-[9px] font-bold">{o.l}</p></button>)}</div></div>
                {form.audience_type === "department" && <div className="flex flex-wrap gap-2">{departments.map(d => <button type="button" key={d.name} onClick={() => setForm(f => ({ ...f, department_names: f.department_names.includes(d.name) ? f.department_names.filter(x => x !== d.name) : [...f.department_names, d.name] }))} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${form.department_names.includes(d.name) ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-white text-slate-500 border-slate-200"}`}>{d.name}</button>)}</div>}
                {form.audience_type === "individuals" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select value={empDeptFilter} onChange={e => setEmpDeptFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-blue-400 cursor-pointer min-w-[130px]">
                        <option value="">All Depts</option>
                        {departments.map(d => <option key={d.name || d.id} value={d.name}>{d.name}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employees..."
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400" />
                      </div>
                    </div>
                    {form.employee_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-[9px] font-bold text-blue-500 self-center mr-1">{form.employee_ids.length} selected</span>
                        {form.employee_ids.slice(0, 5).map(id => {
                          const emp = empList.find(e => (e.employee_id || e.id || e._id) === id);
                          return <span key={id} className="text-[9px] font-bold text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">{emp ? `${emp.first_name} ${emp.last_name}` : id}<button type="button" onClick={() => setForm(f => ({ ...f, employee_ids: f.employee_ids.filter(x => x !== id) }))}><X className="w-2.5 h-2.5" /></button></span>;
                        })}
                        {form.employee_ids.length > 5 && <span className="text-[9px] text-blue-400 self-center">+{form.employee_ids.length - 5}</span>}
                        <button type="button" onClick={() => setForm(f => ({ ...f, employee_ids: [] }))} className="text-[9px] font-bold text-red-500 ml-auto self-center">Clear</button>
                      </div>
                    )}
                    <div className="bg-white rounded-xl border border-slate-200 max-h-40 overflow-y-auto divide-y divide-slate-50">
                      {empLoading ? <div className="p-4 flex justify-center"><div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
                      : empList.length === 0 ? <div className="p-4 text-center text-[10px] text-slate-400">No employees found</div>
                      : empList.slice(0, 20).map(emp => {
                        const empId = emp.employee_id || emp.id || emp._id;
                        const selected = form.employee_ids.includes(empId);
                        return (
                          <button type="button" key={empId} onClick={() => setForm(f => ({ ...f, employee_ids: selected ? f.employee_ids.filter(x => x !== empId) : [...f.employee_ids, empId] }))}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50/50 ${selected ? "bg-blue-50" : ""}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{selected ? "✓" : (emp.first_name || "?")[0]}</div>
                            <div className="min-w-0"><p className="text-[11px] font-semibold text-slate-700 truncate">{emp.first_name} {emp.last_name}</p><p className="text-[9px] text-slate-400 truncate">{emp.department} · {emp.official_email || empId}</p></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Schedule</label><input type="datetime-local" value={form.schedule_at} onChange={e => setForm(f => ({ ...f, schedule_at: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{formLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {formLoading ? "Creating..." : "Create Campaign"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
