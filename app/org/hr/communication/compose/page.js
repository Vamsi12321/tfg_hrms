"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Search, Eye, X, CheckCircle2, AlertCircle, Users, User,
  Sparkles, RefreshCw, Globe, Building2, Clock
} from "lucide-react";
import {
  listEmailTemplates, sendEmail, generateAITemplate
} from "@/lib/communication-api";
import { listEmployees, listDepartments } from "@/lib/api";

const TONES = ["formal", "friendly", "celebratory", "urgent", "empathetic"];
const VARIABLES = ["employee_name", "company_name", "department", "designation", "joining_date", "manager_name", "date", "month", "year"];

export default function ComposePage() {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("");
  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [sending, setSending] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    listEmailTemplates().then(r => { if (r.ok) setTemplates(r.data?.templates || r.data || []); });
    listDepartments().then(r => { if (r.ok) setDepartments(r.data?.departments || r.data || []); });
  }, []);

  // Fetch employees from API dynamically
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
    if (audienceType !== "individuals") return;
    const timer = setTimeout(() => fetchEmployees(empDeptFilter, empSearch), 400);
    return () => clearTimeout(timer);
  }, [empSearch, empDeptFilter, audienceType]);

  useEffect(() => {
    if (audienceType === "individuals") fetchEmployees("", "");
  }, [audienceType]);

  const handleTemplateSelect = (tplId) => {
    setTemplateId(tplId);
    const tpl = templates.find(t => (t.id || t._id) === tplId);
    if (tpl) { setSubject(tpl.subject || ""); setBodyHtml(tpl.body_html || ""); }
  };

  const insertVariable = (v) => setBodyHtml(prev => prev + `{{${v}}}`);

  const handleAIApply = (result) => {
    if (result.subject) setSubject(result.subject);
    if (result.body_html) setBodyHtml(result.body_html);
    setShowAI(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) { showToast("Subject and body required", "error"); return; }
    if (audienceType === "department" && selectedDepts.length === 0) { showToast("Select at least one department", "error"); return; }
    if (audienceType === "individuals" && selectedEmps.length === 0) { showToast("Select at least one employee", "error"); return; }
    setSending(true);
    const payload = {
      subject, body_html: bodyHtml, audience_type: audienceType,
      ...(templateId && { template_id: templateId }),
      ...(audienceType === "department" && { department_names: selectedDepts }),
      ...(audienceType === "individuals" && { employee_ids: selectedEmps }),
      ...(scheduleAt && { schedule_at: scheduleAt }),
    };
    const res = await sendEmail(payload);
    if (res.ok) { showToast(scheduleAt ? "Email scheduled!" : "Email sent successfully!"); setSubject(""); setBodyHtml(""); }
    else showToast(res.data?.detail || "Failed to send", "error");
    setSending(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main compose area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-base font-bold text-slate-900">Compose Email</h2>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowAI(!showAI)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-md shadow-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" /> AI Assist
              </motion.button>
            </div>

            <div className="p-6 space-y-5">
              {/* Template selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Use Template (optional)</label>
                <select value={templateId} onChange={e => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer">
                  <option value="">— No template (write from scratch) —</option>
                  {templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name} ({t.category})</option>)}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Holiday Notice: Diwali 2026"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>

              {/* Variable chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Insert Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map(v => (
                    <button key={v} onClick={() => insertVariable(v)}
                      className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg hover:bg-indigo-100 hover:shadow-sm transition-all">
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email Body *</label>
                <textarea rows={8} value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                  placeholder="Write your email content here. Use {{variable_name}} for dynamic content..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none font-mono transition-all" />
              </div>

              {/* Audience */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Send To *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "all", label: "All Employees", icon: Globe, desc: "Everyone in org" },
                    { val: "department", label: "Departments", icon: Building2, desc: "By team" },
                    { val: "individuals", label: "Individuals", icon: User, desc: "Specific people" },
                  ].map(opt => (
                    <button key={opt.val} onClick={() => setAudienceType(opt.val)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${audienceType === opt.val ? "bg-blue-50 border-blue-400 shadow-md shadow-blue-500/10" : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm"}`}>
                      <opt.icon className={`w-6 h-6 mx-auto mb-2 ${audienceType === opt.val ? "text-blue-600" : "text-slate-400"}`} />
                      <p className={`text-xs font-bold ${audienceType === opt.val ? "text-blue-700" : "text-slate-700"}`}>{opt.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department multi-select */}
              {audienceType === "department" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Select Departments</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {departments.map(d => (
                      <button key={d.name || d.id} onClick={() => setSelectedDepts(prev => prev.includes(d.name) ? prev.filter(x => x !== d.name) : [...prev, d.name])}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${selectedDepts.includes(d.name) ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individuals */}
              {audienceType === "individuals" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select value={empDeptFilter} onChange={e => setEmpDeptFilter(e.target.value)}
                      className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-blue-400 cursor-pointer min-w-[150px]">
                      <option value="">All Departments</option>
                      {departments.map(d => <option key={d.name || d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                        placeholder="Search by name, email, ID..."
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                  </div>
                  {selectedEmps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[9px] font-bold text-blue-500 self-center mr-1">{selectedEmps.length} selected:</span>
                      {selectedEmps.slice(0, 10).map(id => {
                        const emp = empList.find(e => (e.employee_id || e.id || e._id) === id);
                        return (
                          <span key={id} className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded-lg shadow-sm">
                            {emp ? `${emp.first_name} ${emp.last_name}` : id}
                            <button onClick={() => setSelectedEmps(prev => prev.filter(x => x !== id))}><X className="w-3 h-3 hover:text-red-500" /></button>
                          </span>
                        );
                      })}
                      {selectedEmps.length > 10 && <span className="text-[9px] text-blue-400 self-center">+{selectedEmps.length - 10} more</span>}
                      <button onClick={() => setSelectedEmps([])} className="text-[9px] font-bold text-red-500 ml-auto self-center">Clear All</button>
                    </div>
                  )}
                  <div className="bg-white rounded-xl border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-50 shadow-sm">
                    {empLoading ? (
                      <div className="p-6 flex justify-center"><div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
                    ) : empList.length === 0 ? (
                      <div className="p-6 text-center"><p className="text-[10px] text-slate-400 font-semibold">No employees found</p></div>
                    ) : empList.slice(0, 30).map(emp => {
                      const empId = emp.employee_id || emp.id || emp._id;
                      const selected = selectedEmps.includes(empId);
                      return (
                        <button key={empId} onClick={() => setSelectedEmps(prev => selected ? prev.filter(x => x !== empId) : [...prev, empId])}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50/50 transition-colors ${selected ? "bg-blue-50" : ""}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {selected ? "✓" : (emp.first_name || "?")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{emp.first_name} {emp.last_name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{emp.department} · {emp.official_email || empId}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Schedule (optional)</label>
                <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPreview(true)} disabled={!subject || !bodyHtml}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSend} disabled={sending || !subject || !bodyHtml}
                  className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending..." : scheduleAt ? "Schedule Email" : "Send Now"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence>
            {showAI ? <AIPanel onApply={handleAIApply} onClose={() => setShowAI(false)} /> : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 text-center sticky top-24">
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 mb-1">AI Email Assistant</h4>
                <p className="text-[10px] text-slate-500 mb-4">Describe what you need and AI will generate the perfect email content.</p>
                <button onClick={() => setShowAI(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold hover:bg-indigo-700 shadow-md transition-all">
                  Open AI Assistant
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Email Preview</h3>
                <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">To</p><p className="text-sm text-slate-700">{audienceType === "all" ? "All Employees" : audienceType === "department" ? selectedDepts.join(", ") : `${selectedEmps.length} employee(s)`}</p></div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Subject</p><p className="text-sm font-semibold text-slate-800">{subject}</p></div>
                <div className="bg-white rounded-xl p-4 border border-slate-200"><p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Body</p><div className="text-sm text-slate-700 prose prose-sm" dangerouslySetInnerHTML={{ __html: bodyHtml.replace(/\n/g, "<br/>") }} /></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Panel Component ───────────────────────────────────────────────────────
function AIPanel({ onApply, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("formal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(null);
    const res = await generateAITemplate({ prompt, tone });
    if (res.ok && res.data) setResult(res.data);
    else setResult({ error: res.data?.detail || "AI generation failed" });
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-2xl border border-indigo-100 shadow-xl p-5 space-y-4 sticky top-24">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> AI Generator</h4>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
      </div>
      <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="e.g. Write a Diwali holiday notice for all employees..."
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 resize-none" />
      <div className="flex flex-wrap gap-1.5">
        {TONES.map(t => (
          <button key={t} onClick={() => setTone(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize border ${tone === t ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>
            {t}
          </button>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGenerate} disabled={loading || !prompt.trim()}
        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? "Generating..." : "Generate"}
      </motion.button>
      {result && !result.error && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="bg-slate-50 rounded-xl p-3"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Subject</p><p className="text-xs font-semibold text-slate-800">{result.subject}</p></div>
          <div className="bg-slate-50 rounded-xl p-3 max-h-32 overflow-y-auto"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Body</p><div className="text-xs text-slate-700" dangerouslySetInnerHTML={{ __html: result.body_html }} /></div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => onApply(result)}
            className="w-full py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Use This
          </motion.button>
        </div>
      )}
      {result?.error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-xs text-red-600">{result.error}</p></div>}
    </motion.div>
  );
}
