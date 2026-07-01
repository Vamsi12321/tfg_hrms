"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Upload, Search, X, ChevronRight, Star,
  Users, Sparkles, CheckCircle2, AlertCircle, Clock,
  FileText, Zap, Award, BarChart3, Eye, History,
  ArrowLeft, RefreshCw, Building2, AlertTriangle
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { runTalentSearch, getTalentSearchHistory, getTalentSearchDetail } from "@/lib/api";
import { useDepartments, useEmployees } from "@/lib/queries";

const verdictCfg = {
  shortlist: { cls: "bg-green-50 text-green-700 border-green-200",  label: "Shortlist", icon: "✅" },
  maybe:     { cls: "bg-amber-50 text-amber-700 border-amber-200",  label: "Maybe",     icon: "🤔" },
  pass:      { cls: "bg-red-50 text-red-600 border-red-200",        label: "Pass",      icon: "❌" },
};

const scoreColor = (s) =>
  s >= 80 ? "text-green-600" : s >= 60 ? "text-blue-600" : s >= 40 ? "text-amber-600" : "text-red-500";
const scoreBg = (s) =>
  s >= 80 ? "bg-green-500" : s >= 60 ? "bg-blue-500" : s >= 40 ? "bg-amber-500" : "bg-red-400";
const scoreLabel = (s) =>
  s >= 80 ? "Strong Match" : s >= 65 ? "Good Match" : s >= 45 ? "Partial Match" : "Weak Match";

const avatarColors = [
  "bg-blue-600","bg-purple-600","bg-green-600","bg-rose-500",
  "bg-indigo-600","bg-teal-600","bg-pink-500","bg-orange-500",
];

export default function TalentPage() {
  const [view, setView] = useState("search"); // "search" | "results" | "history" | "detail"
  const [tab,  setTab]  = useState("department"); // "department" | "employees"

  // Form state
  const [title,        setTitle]        = useState("");
  const [department,   setDepartment]   = useState("");
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [topN,         setTopN]         = useState("");
  const [jdFile,       setJdFile]       = useState(null);
  const fileRef = useRef(null);

  // Results
  const [results,    setResults]    = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [toast,      setToast]      = useState(null);
  const [detailCard, setDetailCard] = useState(null);

  // History
  const [history,        setHistory]        = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [histDetail,     setHistDetail]     = useState(null);

  const { data: departments = [] } = useDepartments();
  // Only load employees when "specific employees" tab is active and a department is selected
  const [empDept, setEmpDept] = useState("");
  const { data: empData } = useEmployees({
    limit: 100,
    department: empDept || undefined,
    status: "active",
  });
  const employees = empData?.employees || [];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 5000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!jdFile) { showToast("Please upload a JD file", "error"); return; }
    if (tab === "department" && !department) { showToast("Select a department", "error"); return; }
    if (tab === "employees" && selectedEmps.length === 0) { showToast("Select at least one employee", "error"); return; }
    setSearching(true);
    const payload = {
      jdFile,
      title: title || undefined,
      department: tab === "department" ? department : undefined,
      employeeIds: tab === "employees" ? selectedEmps.join(",") : undefined,
      topN: topN ? parseInt(topN) : undefined,
    };
    const res = await runTalentSearch(payload);
    setSearching(false);
    if (res.ok && res.data) {
      setResults(res.data);
      setView("results");
    } else {
      const msg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") :
        "Search failed. Ensure employees have uploaded their resumes.";
      showToast(msg, "error");
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setView("history");
    const res = await getTalentSearchHistory({ limit: 20 });
    if (res.ok && res.data) setHistory(res.data);
    setHistoryLoading(false);
  };

  const loadHistDetail = async (id) => {
    const res = await getTalentSearchDetail(id);
    if (res.ok && res.data) { setHistDetail(res.data); setView("detail"); }
    else showToast("Failed to load search detail", "error");
  };

  const toggleEmp = (id) =>
    setSelectedEmps(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  // Reusable result card renderer (used in both live results and history detail)
  const ResultCard = ({ r, i }) => {
    const vc = verdictCfg[r.recruiter_verdict] || verdictCfg.maybe;
    const av = avatarColors[i % avatarColors.length];
    const score = r.match_score ?? 0;
    return (
      <motion.div key={r.employee_id || i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i===0?"bg-amber-400 text-white":i===1?"bg-slate-300 text-white":i===2?"bg-orange-400 text-white":"bg-slate-100 text-slate-500"}`}>
            {r.rank ?? i+1}
          </div>
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-xl ${av} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {(r.candidate_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-bold text-slate-900">{r.candidate_name}</h4>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${vc.cls}`}>{vc.icon} {vc.label}</span>
              {r.seniority_level && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 capitalize">{r.seniority_level}</span>}
            </div>
            <p className="text-xs text-slate-500">{r.designation} · {r.department}{r.experience_years ? ` · ${r.experience_years}y exp` : ""}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed italic">{r.summary}</p>
            {/* Skills */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(r.matched_skills||[]).slice(0,5).map(s=>(
                <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5"/>{s}
                </span>
              ))}
              {(r.missing_skills||[]).slice(0,3).map(s=>(
                <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center gap-0.5">
                  <X className="w-2.5 h-2.5"/>{s}
                </span>
              ))}
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{width:0}} animate={{width:`${score}%`}} transition={{delay:0.3+i*0.04,duration:0.7}}
                  className={`h-full rounded-full ${scoreBg(score)}`}/>
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{(r.matched_skills||[]).length} skills matched</span>
            </div>
          </div>
          {/* Score ring */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5"/>
                <circle cx="28" cy="28" r="22" fill="none"
                  stroke={score>=80?"#22c55e":score>=60?"#3b82f6":score>=40?"#f59e0b":"#ef4444"}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${(score/100)*138} 138`}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-black ${scoreColor(score)}`}>{score.toFixed?score.toFixed(0):score}%</span>
              </div>
            </div>
            <span className={`text-[8px] font-bold ${scoreColor(score)}`}>{scoreLabel(score)}</span>
          </div>
          {/* Detail button */}
          <button onClick={()=>setDetailCard(r)}
            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 flex-shrink-0">
            <Eye className="w-3 h-3"/> Report
          </button>
        </div>
      </motion.div>
    );
  };

  const activeData = view === "detail" ? histDetail : results;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="AI Talent Finder" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-start gap-2 max-w-md ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error"?<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>:<CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5"/>}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Hero */}
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"/>
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"/>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div animate={{rotate:[0,10,-10,0]}} transition={{duration:3,repeat:Infinity}}>
                  <Brain className="w-5 h-5 text-purple-200"/>
                </motion.div>
                <span className="text-xs font-bold text-purple-200">AI Resume Matching</span>
              </div>
              <h2 className="text-2xl font-bold">Find Your Best Candidate</h2>
              <p className="text-purple-100 text-sm mt-1 max-w-lg">Upload a Job Description — AI compares every employee's resume and ranks them instantly.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>{setView("search");setResults(null);}}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${view==="search"?"bg-white text-indigo-700 shadow-md":"bg-white/10 text-white border border-white/20 hover:bg-white/20"}`}>
                <Sparkles className="w-4 h-4"/> New Search
              </button>
              <button onClick={loadHistory}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${view==="history"||view==="detail"?"bg-white text-indigo-700 shadow-md":"bg-white/10 text-white border border-white/20 hover:bg-white/20"}`}>
                <History className="w-4 h-4"/> History
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── SEARCH FORM ── */}
        {view === "search" && (
          <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}>
            <form onSubmit={handleSearch}>
              {/* Two columns on desktop, stacked on mobile */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* LEFT — JD Upload */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-indigo-600"/></div>
                      <div><h3 className="text-sm font-bold text-slate-900">Job Description</h3><p className="text-[10px] text-slate-500">Upload JD file to match against employee resumes</p></div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Drop zone */}
                    <div onClick={()=>fileRef.current?.click()}
                      className={`flex-1 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${jdFile?"border-indigo-400 bg-indigo-50":"border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"}`}>
                      <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
                        onChange={e=>{const f=e.target.files?.[0];if(f)setJdFile(f);}}/>
                      {jdFile ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center"><FileText className="w-7 h-7 text-indigo-600"/></div>
                          <div><p className="text-sm font-bold text-slate-800">{jdFile.name}</p><p className="text-[10px] text-slate-400 mt-0.5">{(jdFile.size/1024).toFixed(1)} KB · Ready</p></div>
                          <button type="button" onClick={e=>{e.stopPropagation();setJdFile(null);if(fileRef.current)fileRef.current.value="";}}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100">
                            <X className="w-3 h-3"/> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><Upload className="w-7 h-7 text-slate-400"/></div>
                          <p className="text-sm font-semibold text-slate-600">Drop JD here or <span className="text-indigo-600 font-bold">browse</span></p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, TXT · Max 10MB</p>
                        </div>
                      )}
                    </div>
                    {/* Title */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Search Title <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Senior Backend Developer Opening"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"/>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Filters */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-purple-600"/></div>
                      <div><h3 className="text-sm font-bold text-slate-900">Candidate Pool</h3><p className="text-[10px] text-slate-500">Choose which employees to match</p></div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Mode tabs */}
                    <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      {[["department","By Department"],["employees","Specific Employees"]].map(([k,l])=>(
                        <button key={k} type="button" onClick={()=>{setTab(k);setSelectedEmps([]);}}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?"bg-indigo-600 text-white shadow-md":"text-slate-600 hover:bg-white"}`}>{l}</button>
                      ))}
                    </div>

                    {tab === "department" ? (
                      <div className="space-y-4 flex-1">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department <span className="text-red-500">*</span></label>
                          <select value={department} onChange={e=>setDepartment(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
                            <option value="">All active employees (entire org)</option>
                            {departments.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                          </select>
                          {department && <p className="text-[10px] text-indigo-600 mt-1.5 font-semibold">All active employees in {department} will be matched.</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Top N Results <span className="text-slate-400 font-normal">(0 = all)</span></label>
                          <input type="number" min="0" max="50" value={topN} onChange={e=>setTopN(e.target.value)} placeholder="0 — show all"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"/>
                        </div>
                        {/* AI capabilities */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mt-auto">
                          <p className="text-xs font-bold text-indigo-700 flex items-center gap-2 mb-3"><Brain className="w-3.5 h-3.5"/> Enterprise AI Capabilities</p>
                          {[["Semantic understanding beyond keywords","🧠"],["Role-aware skill & level matching","🎯"],["Fraud & timeline inconsistency detection","🛡"],["Results in under 30 seconds","⚡"]].map(([t,ic])=>(
                            <div key={t} className="flex items-start gap-2.5 py-1.5 border-t border-indigo-100 first:border-0">
                              <span className="text-sm flex-shrink-0">{ic}</span>
                              <p className="text-[11px] text-indigo-800 leading-relaxed">{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 flex-1">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Filter by Department</label>
                          <select value={empDept} onChange={e=>{setEmpDept(e.target.value);setSelectedEmps([]);}}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
                            <option value="">All departments</option>
                            {departments.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-slate-600">{selectedEmps.length>0?`${selectedEmps.length} selected`:"Select employees"} <span className="text-red-500">*</span></label>
                            {selectedEmps.length>0 && <button type="button" onClick={()=>setSelectedEmps([])} className="text-[10px] text-slate-400 hover:text-red-500">Clear all</button>}
                          </div>
                          <div className="flex-1 max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                            {employees.length===0 ? (
                              <div className="p-6 text-center"><Users className="w-6 h-6 text-slate-200 mx-auto mb-2"/><p className="text-xs text-slate-400">{empDept?"No active employees in "+empDept:"Select a department to filter employees"}</p></div>
                            ) : employees.map(emp=>{
                              const id=emp.id||emp._id;const sel=selectedEmps.includes(id);
                              return (
                                <label key={id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${sel?"bg-indigo-50":"hover:bg-slate-50"}`}>
                                  <input type="checkbox" checked={sel} onChange={()=>toggleEmp(id)} className="w-4 h-4 rounded border-slate-300 accent-indigo-600 flex-shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{emp.first_name} {emp.last_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{emp.designation} · {emp.department}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit — full width below */}
              <div className="mt-4">
                <motion.button type="submit" disabled={searching} whileHover={{scale:1.01}} whileTap={{scale:0.99}}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {searching?<><RefreshCw className="w-4 h-4 animate-spin"/> Analyzing Resumes — this may take ~30 seconds…</>:<><Brain className="w-4 h-4"/> Run AI Match</>}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── RESULTS VIEW ── */}
        {(view === "results" || view === "detail") && activeData && (
          <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="space-y-5">
            {/* Back */}
            <button onClick={()=>view==="detail"?setView("history"):setView("search")}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-4 h-4"/> {view==="detail"?"Back to History":"New Search"}
            </button>

            {/* Summary banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold">{activeData.title || "Talent Search Results"}</h3>
                  {activeData.department && <p className="text-indigo-200 text-xs mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3"/> {activeData.department}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(activeData.required_skills||[]).map(s=>(
                      <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/20">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-3 bg-white/10 rounded-xl border border-white/20">
                    <p className="text-xl font-black">{activeData.total_candidates}</p>
                    <p className="text-[10px] text-indigo-200">Candidates</p>
                  </div>
                  <div className="text-center px-4 py-3 bg-white/10 rounded-xl border border-white/20">
                    <p className="text-xl font-black">{activeData.showing ?? (activeData.results||[]).length}</p>
                    <p className="text-[10px] text-indigo-200">Showing</p>
                  </div>
                </div>
              </div>
              {/* Employees without resume */}
              {(activeData.employees_without_resume||[]).length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-200 flex-shrink-0"/>
                  <p className="text-xs text-amber-100"><strong>No resume:</strong> {activeData.employees_without_resume.join(", ")} — skipped from AI matching.</p>
                </div>
              )}
            </div>

            {/* Stats row */}
            {(activeData.results||[]).length > 0 && (()=>{
              const rs = activeData.results;
              const shortlisted = rs.filter(r=>r.recruiter_verdict==="shortlist").length;
              const maybes      = rs.filter(r=>r.recruiter_verdict==="maybe").length;
              const passed      = rs.filter(r=>r.recruiter_verdict==="pass").length;
              const avgScore    = (rs.reduce((s,r)=>s+(r.match_score||0),0)/rs.length).toFixed(1);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[["Avg Score",avgScore+"%","text-indigo-600"],["Shortlist",shortlisted,"text-green-600"],["Maybe",maybes,"text-amber-600"],["Pass",passed,"text-red-500"]].map(([l,v,c])=>(
                    <div key={l} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                      <p className={`text-xl font-black ${c}`}>{v}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Candidate cards */}
            <div className="space-y-3">
              {(activeData.results||[]).map((r,i) => <ResultCard key={r.employee_id||i} r={r} i={i}/>)}
            </div>
          </motion.div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === "history" && (
          <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><History className="w-4 h-4 text-indigo-500"/> Past Searches</h3>
              <button onClick={()=>setView("search")} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline">
                <Sparkles className="w-3.5 h-3.5"/> New Search
              </button>
            </div>

            {historyLoading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/></div>
            ) : !history || (history.searches||[]).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <History className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
                <p className="text-sm font-semibold text-slate-400">No past searches yet</p>
                <p className="text-xs text-slate-400 mt-1">Run your first AI talent search above.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-slate-50/80">
                    {["Title","Department","Candidates","Run By","Date",""].map(h=>
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-5 py-3 whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(history.searches||[]).map((s,i)=>(
                      <motion.tr key={s.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                        className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-semibold text-slate-800">{s.title || "Untitled Search"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{s.department || <span className="text-slate-400">—</span>}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">{s.total_candidates} candidates</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{s.created_by_name || "—"}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(s.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={()=>loadHistDetail(s.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                            <Eye className="w-3 h-3"/> View Results
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {history.total > (history.searches||[]).length && (
                  <div className="p-4 border-t border-slate-50 text-center">
                    <p className="text-xs text-slate-400">{history.total} total searches · Showing {(history.searches||[]).length}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── CANDIDATE DETAIL MODAL ── */}
      <AnimatePresence>
        {detailCard && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={()=>setDetailCard(null)}>
            <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}}
              transition={{type:"spring",damping:28,stiffness:320}}
              onClick={e=>e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

              {/* Header */}
              {(()=>{
                const r = detailCard;
                const score = r.match_score ?? 0;
                const vc = verdictCfg[r.recruiter_verdict] || verdictCfg.maybe;
                const gradients = { shortlist:"from-green-500 to-emerald-500", maybe:"from-amber-500 to-orange-500", pass:"from-slate-500 to-slate-600" };
                return (
                  <div className={`bg-gradient-to-br ${gradients[r.recruiter_verdict]||"from-indigo-600 to-purple-600"} px-6 pt-5 pb-6 flex-shrink-0`}>
                    <div className="flex items-start justify-between mb-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-white/20 text-white`}>
                        {vc.icon} {vc.label} · Rank #{r.rank ?? "—"}
                      </span>
                      <button onClick={()=>setDetailCard(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                        <X className="w-4 h-4 text-white"/>
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                        {(r.candidate_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-black text-xl leading-tight">{r.candidate_name}</h3>
                        <p className="text-white/75 text-xs mt-0.5">{r.designation} · {r.department}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full capitalize">{r.seniority_level||"—"}</span>
                          {r.experience_years && <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{r.experience_years}y exp</span>}
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{score.toFixed?score.toFixed(1):score}% match</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* AI summary */}
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">AI Summary</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{detailCard.summary}</p>
                </div>

                {/* Why top ranked */}
                {detailCard.why_top_ranked && (
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">Why This Candidate?</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{detailCard.why_top_ranked}</p>
                  </div>
                )}

                {/* Score breakdown */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-3">Score Breakdown</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Skills",detailCard.skills_score,"bg-blue-500"],["Semantic",detailCard.semantic_score,"bg-purple-500"],["Experience",detailCard.experience_score,"bg-green-500"]].map(([l,v,c])=>{
                      const pct = v != null ? Math.round(v*100) : 0;
                      return (
                        <div key={l} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                          <div className="relative w-12 h-12 mx-auto mb-2">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                              <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                              <circle cx="24" cy="24" r="18" fill="none" stroke={pct>=70?"#22c55e":pct>=50?"#3b82f6":"#f59e0b"}
                                strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(pct/100)*113} 113`}/>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-black text-slate-700">{pct}%</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500">{l}</p>
                        </div>
                      );
                    })}
                  </div>
                  {detailCard.percentile != null && (
                    <div className="mt-3 flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500">Percentile</span>
                      <span className="text-xs font-black text-indigo-600">Top {100-(detailCard.percentile??50)}%</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Matched Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(detailCard.matched_skills||[]).map(s=>(
                        <span key={s} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{s}</span>
                      ))}
                      {(detailCard.matched_skills||[]).length===0 && <span className="text-[10px] text-slate-400">None</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1"><X className="w-3.5 h-3.5"/> Missing Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(detailCard.missing_skills||[]).map(s=>(
                        <span key={s} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-200">{s}</span>
                      ))}
                      {(detailCard.missing_skills||[]).length===0 && <span className="text-[10px] text-slate-400">None</span>}
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                {((detailCard.strengths||[]).length>0 || (detailCard.weaknesses||[]).length>0) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(detailCard.strengths||[]).length>0 && (
                      <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                        <p className="text-[10px] font-bold text-green-700 mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {detailCard.strengths.map((s,i)=><li key={i} className="text-xs text-slate-700 flex items-start gap-1.5"><span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {(detailCard.weaknesses||[]).length>0 && (
                      <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                        <p className="text-[10px] font-bold text-red-600 mb-2">Gaps</p>
                        <ul className="space-y-1">
                          {detailCard.weaknesses.map((w,i)=><li key={i} className="text-xs text-slate-700 flex items-start gap-1.5"><span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Improvement suggestion */}
                {detailCard.improvement_suggestion && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-[10px] font-bold text-amber-700">Improvement Suggestion</p>
                      <p className="text-xs text-slate-700 mt-0.5">{detailCard.improvement_suggestion}</p>
                    </div>
                  </div>
                )}

                {/* Fraud flag */}
                {detailCard.is_suspicious && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-[10px] font-bold text-red-600">Resume Anomaly Detected</p>
                      <p className="text-xs text-slate-700 mt-0.5">Fraud score: {detailCard.fraud_score}. Review resume carefully before shortlisting.</p>
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
