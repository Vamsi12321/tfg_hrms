"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, Eye, X, CheckCircle2, AlertCircle, Users, User, Sparkles, RefreshCw, Globe, Building2, Clock, FileText, Brain } from "lucide-react";
import { listEmailTemplates, sendEmail, generateAITemplate } from "@/lib/communication-api";
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
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("formal");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [bodyView, setBodyView] = useState("edit");
  const showToast = (m, t = "success") => { setToast({ msg: m, type: t }); setTimeout(() => setToast(null), 4000); };
  useEffect(() => { listEmailTemplates().then(r => { if (r.ok) setTemplates(r.data?.templates || r.data || []); }); listDepartments().then(r => { if (r.ok) setDepartments(r.data?.departments || r.data || []); }); }, []);
  const fetchEmp = async (d, s) => { setEmpLoading(true); const p = { limit: 100, status: "active" }; if (d) p.department = d; if (s) p.search = s; const r = await listEmployees(p); if (r.ok) setEmpList(r.data?.employees || []); setEmpLoading(false); };
  useEffect(() => { if (audienceType !== "individuals") return; const t = setTimeout(() => fetchEmp(empDeptFilter, empSearch), 400); return () => clearTimeout(t); }, [empSearch, empDeptFilter, audienceType]);
  useEffect(() => { if (audienceType === "individuals") fetchEmp("", ""); }, [audienceType]);
  const pickTpl = (id) => { setTemplateId(id); const t = templates.find(x => (x.id || x._id) === id); if (t) { setSubject(t.subject || ""); setBodyHtml(t.body_html || ""); } };
  const insertVar = (v) => setBodyHtml(p => p + `{{${v}}}`);
  const doAI = async () => { if (!aiPrompt.trim()) return; setAiLoading(true); setAiResult(null); const r = await generateAITemplate({ prompt: aiPrompt, tone: aiTone }); if (r.ok && r.data) setAiResult(r.data); else { const d = r.data?.detail; setAiResult({ error: typeof d === "string" ? d : Array.isArray(d) ? d.map(e => e.msg).join(", ") : "Failed" }); } setAiLoading(false); };
  const applyAI = () => { if (aiResult?.subject) setSubject(aiResult.subject); if (aiResult?.body_html) setBodyHtml(aiResult.body_html); setAiResult(null); setAiPrompt(""); showToast("AI content applied!"); };
  const doSend = async () => { if (!subject.trim() || !bodyHtml.trim()) { showToast("Subject and body required", "error"); return; } if (audienceType === "department" && !selectedDepts.length) { showToast("Select departments", "error"); return; } if (audienceType === "individuals" && !selectedEmps.length) { showToast("Select employees", "error"); return; } setSending(true); const p = { subject, body_html: bodyHtml, audience_type: audienceType, ...(templateId && { template_id: templateId }), ...(audienceType === "department" && { department_names: selectedDepts }), ...(audienceType === "individuals" && { employee_ids: selectedEmps }), ...(scheduleAt && { schedule_at: scheduleAt }) }; const r = await sendEmail(p); if (r.ok) { showToast(scheduleAt ? "Scheduled!" : "Sent!"); setSubject(""); setBodyHtml(""); setSelectedDepts([]); setSelectedEmps([]); } else showToast(r.data?.detail || "Failed", "error"); setSending(false); };

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>}</AnimatePresence>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><FileText className="w-5 h-5 text-blue-600"/></div>
              <div><h3 className="text-sm font-bold text-slate-900">Email Content</h3><p className="text-[10px] text-blue-600 font-medium">Write your message with dynamic variables</p></div>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Template</label><select value={templateId} onChange={e=>pickTpl(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-400 cursor-pointer"><option value="">Write from scratch...</option>{templates.map(t=><option key={t.id||t._id} value={t.id||t._id}>{t.name}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Subject *</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Holiday Notice — Diwali 2026" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"/></div>
              </div>
              <div><label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">Insert Variables</label><div className="flex flex-wrap gap-1.5">{VARIABLES.map(v=><button key={v} onClick={()=>insertVar(v)} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100">{`{{${v}}}`}</button>)}</div></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Body *</label>
                <div className="flex gap-1.5 mb-2">
                  <button type="button" onClick={() => setBodyView("edit")} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold ${bodyView === "edit" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>Edit</button>
                  <button type="button" onClick={() => setBodyView("preview")} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold ${bodyView === "preview" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>Preview</button>
                </div>
                {bodyView === "edit" ? (
                  <textarea rows={8} value={bodyHtml} onChange={e=>setBodyHtml(e.target.value)} placeholder={"Dear {{employee_name}},\n\nWrite here...\n\nBest regards,\n{{company_name}} Team"} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none font-mono leading-relaxed"/>
                ) : (
                  <div className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm min-h-[200px] overflow-y-auto bg-slate-50 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bodyHtml.replace(/\n/g, "<br/>") }} />
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100"><Users className="w-5 h-5 text-purple-600"/></div>
              <div><h3 className="text-sm font-bold text-slate-900">Recipients & Schedule</h3><p className="text-[10px] text-purple-600 font-medium">Choose who receives this email</p></div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">{[{v:"all",l:"All",i:Globe},{v:"department",l:"Departments",i:Building2},{v:"individuals",l:"Individuals",i:User}].map(o=><button key={o.v} onClick={()=>setAudienceType(o.v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all whitespace-nowrap ${audienceType===o.v?"bg-blue-50 border-blue-400 text-blue-700":"bg-white border-slate-200 text-slate-600"}`}><o.i className="w-3.5 h-3.5"/> {o.l}</button>)}</div>
              {audienceType==="department"&&<div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl">{departments.map(d=><button key={d.name||d.id} onClick={()=>setSelectedDepts(p=>p.includes(d.name)?p.filter(x=>x!==d.name):[...p,d.name])} className={`px-3 py-2 rounded-xl text-xs font-bold border ${selectedDepts.includes(d.name)?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-600 border-slate-200"}`}>{d.name}</button>)}</div>}
              {audienceType==="individuals"&&<div className="space-y-3 p-4 bg-slate-50 rounded-xl"><div className="flex gap-2"><select value={empDeptFilter} onChange={e=>setEmpDeptFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none cursor-pointer"><option value="">All</option>{departments.map(d=><option key={d.name} value={d.name}>{d.name}</option>)}</select><div className="relative flex-1"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"/><input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 bg-white"/></div></div>{selectedEmps.length>0&&<p className="text-xs font-bold text-blue-600">{selectedEmps.length} selected <button onClick={()=>setSelectedEmps([])} className="text-red-500 ml-1 text-[10px]">Clear</button></p>}<div className="bg-white rounded-xl border border-slate-200 max-h-36 overflow-y-auto divide-y divide-slate-50">{empLoading?<div className="p-4 flex justify-center"><div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/></div>:empList.slice(0,15).map(emp=>{const id=emp.employee_id||emp.id||emp._id;const sel=selectedEmps.includes(id);return<button key={id} onClick={()=>setSelectedEmps(p=>sel?p.filter(x=>x!==id):[...p,id])} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50/50 ${sel?"bg-blue-50":""}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${sel?"bg-blue-600 text-white":"bg-slate-100 text-slate-500"}`}>{sel?"✓":(emp.first_name||"?")[0]}</div><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-700 truncate">{emp.first_name} {emp.last_name}</p><p className="text-[9px] text-slate-400">{emp.department}</p></div></button>})}</div></div>}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 flex-1"><Clock className="w-4 h-4 text-slate-400 flex-shrink-0"/><input type="datetime-local" value={scheduleAt} onChange={e=>setScheduleAt(e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 min-w-0"/></div>
                <div className="flex gap-2"><button onClick={()=>setShowPreview(true)} disabled={!subject||!bodyHtml} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Preview</button><button onClick={doSend} disabled={sending||!subject||!bodyHtml} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">{sending?<RefreshCw className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>} {sending?"Sending...":scheduleAt?"Schedule":"Send Email"}</button></div>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT — AI */}
        <div className="w-full lg:w-[280px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><Brain className="w-5 h-5 text-indigo-600"/></div>
              <div><h3 className="text-sm font-bold text-slate-900">AI Email Writer</h3><p className="text-[10px] text-indigo-600 font-medium">Generate content with AI</p></div>
            </div>
            <div className="space-y-4">
              <textarea rows={3} value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder={"Describe the email...\ne.g. Diwali holiday notice"} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 resize-none"/>
              <div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tone</p><div className="flex flex-wrap gap-1.5">{TONES.map(t=><button key={t} onClick={()=>setAiTone(t)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize ${aiTone===t?"bg-indigo-600 text-white":"bg-slate-50 text-slate-500 border border-slate-200"}`}>{t}</button>)}</div></div>
              <button onClick={doAI} disabled={aiLoading||!aiPrompt.trim()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2">{aiLoading?<RefreshCw className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>} {aiLoading?"Generating...":"Generate Email"}</button>
              {aiResult&&!aiResult.error&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-2 pt-3 border-t border-slate-100"><div className="p-2 bg-slate-50 rounded-lg"><p className="text-[8px] font-bold text-slate-400 uppercase">Subject</p><p className="text-[11px] font-semibold text-slate-800 truncate">{aiResult.subject}</p></div><div className="p-2 bg-slate-50 rounded-lg max-h-24 overflow-y-auto"><p className="text-[8px] font-bold text-slate-400 uppercase">Preview</p><div className="text-[10px] text-slate-600 leading-snug" dangerouslySetInnerHTML={{__html:aiResult.body_html}}/></div><button onClick={applyAI} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> Apply</button></motion.div>}
              {aiResult?.error&&<div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-xs text-red-600">{aiResult.error}</p></div>}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>{showPreview&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowPreview(false)}><motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Preview</h3><button onClick={()=>setShowPreview(false)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div><div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto"><p className="text-[10px] text-slate-400">To: {audienceType==="all"?"All":audienceType==="department"?selectedDepts.join(", "):`${selectedEmps.length} people`}</p><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm font-bold text-slate-900">{subject}</p></div><div className="p-4 border border-slate-200 rounded-xl text-sm text-slate-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{__html:bodyHtml.replace(/\n/g,"<br/>")}}/></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
