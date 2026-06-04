"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Plus, Upload, Search, X, ChevronRight,
  Star, TrendingUp, Users, Target, Sparkles, CheckCircle2,
  AlertCircle, Clock, ArrowRight, FileText, Filter,
  Zap, Award, BarChart3, BookOpen, ChevronDown, Eye
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { internalRoles, employeeProfiles, scoreCandidate } from "@/lib/talentData";

const readinessConfig = {
  "ready-now":        { label: "Ready Now",       cls: "bg-green-100 text-green-700 border-green-200"  },
  "ready-soon":       { label: "Ready in 6mo",    cls: "bg-blue-100 text-blue-700 border-blue-200"     },
  "needs-development":{ label: "Needs Dev",        cls: "bg-amber-100 text-amber-700 border-amber-200"  },
  "not-applicable":   { label: "N/A",              cls: "bg-slate-100 text-slate-500 border-slate-200"  },
};

const potentialConfig = {
  exceptional: { stars: 3, color: "text-purple-500" },
  high:        { stars: 2, color: "text-amber-500"  },
  medium:      { stars: 1, color: "text-slate-400"  },
};

const priorityCfg = {
  high:   "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low:    "bg-slate-50 text-slate-500 border-slate-200",
};

const avatarColors = [
  "bg-blue-600","bg-purple-600","bg-green-600","bg-red-500",
  "bg-indigo-600","bg-teal-600","bg-pink-500","bg-orange-500",
];

export default function TalentPage() {
  const [view,           setView]           = useState("match-jd");   // "match-jd" | "match-employee"
  const [selectedJD,     setSelectedJD]     = useState(internalRoles[0]);
  const [selectedEmp,    setSelectedEmp]    = useState(null);
  const [showAddJD,      setShowAddJD]      = useState(false);
  const [showJDDetail,   setShowJDDetail]   = useState(null);
  const [showEmpDetail,  setShowEmpDetail]  = useState(null);
  const [filterReady,    setFilterReady]    = useState("all");
  const [searchEmp,      setSearchEmp]      = useState("");
  const [toast,          setToast]          = useState(null);
  const [jdText,         setJdText]         = useState("");
  const [roles,          setRoles]          = useState(internalRoles);
  const [addForm,        setAddForm]        = useState({
    title:"", department:"Engineering", level:"L4", priority:"medium",
    description:"", skills:"", niceToHave:"", minExperience:"3", timeline:"30 days",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Score all employees against selected JD
  const rankedForJD = useMemo(() => {
    if (!selectedJD) return [];
    return employeeProfiles
      .map(emp => ({ ...emp, score: scoreCandidate(emp, selectedJD) }))
      .sort((a, b) => b.score.finalScore - a.score.finalScore);
  }, [selectedJD]);

  // Score selected employee against all active JDs
  const rankedJDs = useMemo(() => {
    if (!selectedEmp) return [];
    return roles
      .filter(r => r.status === "active")
      .map(jd => ({ ...jd, score: scoreCandidate(selectedEmp, jd) }))
      .sort((a, b) => b.score.finalScore - a.score.finalScore);
  }, [selectedEmp, roles]);

  const filteredEmps = useMemo(() => {
    return rankedForJD.filter(e => {
      const matchReady  = filterReady === "all" || e.readiness === filterReady;
      const matchSearch = e.name.toLowerCase().includes(searchEmp.toLowerCase()) ||
                          e.designation.toLowerCase().includes(searchEmp.toLowerCase());
      return matchReady && matchSearch;
    });
  }, [rankedForJD, filterReady, searchEmp]);

  const handleAddJD = (e) => {
    e.preventDefault();
    const newRole = {
      id: `JD00${roles.length + 1}`,
      title: addForm.title,
      department: addForm.department,
      level: addForm.level,
      priority: addForm.priority,
      postedOn: new Date().toISOString().split("T")[0],
      status: "active",
      description: addForm.description,
      requiredSkills: addForm.skills.split(",").map(s => s.trim()).filter(Boolean),
      niceToHave: addForm.niceToHave.split(",").map(s => s.trim()).filter(Boolean),
      minExperience: parseInt(addForm.minExperience) || 3,
      targetTimeline: addForm.timeline,
    };
    setRoles(prev => [newRole, ...prev]);
    setSelectedJD(newRole);
    setShowAddJD(false);
    setAddForm({ title:"", department:"Engineering", level:"L4", priority:"medium", description:"", skills:"", niceToHave:"", minExperience:"3", timeline:"30 days" });
    showToast(`"${newRole.title}" role added and matched!`);
  };

  const getScoreColor = (score) =>
    score >= 80 ? "text-green-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-500";

  const getScoreBg = (score) =>
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-red-400";

  const getScoreLabel = (score) =>
    score >= 80 ? "Strong Match" : score >= 65 ? "Good Match" : score >= 45 ? "Partial Match" : "Weak Match";

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Internal Talent Finder" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold bg-green-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">

        {/* Hero Banner */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:3, repeat:Infinity }}>
                  <Brain className="w-5 h-5 text-purple-200" />
                </motion.div>
                <span className="text-xs font-bold text-purple-200">AI-Powered Internal Mobility</span>
              </div>
              <h2 className="text-2xl font-bold">Find Your Best Internal Candidate</h2>
              <p className="text-purple-100 text-sm mt-1 max-w-lg">
                Upload or select a JD → AI scores every employee → See who's ready to grow into the role. No external hiring needed.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-5 py-3 bg-white/10 rounded-xl border border-white/20">
                <p className="text-xl font-black">{employeeProfiles.length}</p>
                <p className="text-[10px] text-purple-200">Employees</p>
              </div>
              <div className="text-center px-5 py-3 bg-white/10 rounded-xl border border-white/20">
                <p className="text-xl font-black">{roles.filter(r=>r.status==="active").length}</p>
                <p className="text-[10px] text-purple-200">Open Roles</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button onClick={() => setView("match-jd")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${view==="match-jd" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}>
              <FileText className="w-4 h-4" /> JD → Find Candidates
            </button>
            <button onClick={() => setView("match-employee")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${view==="match-employee" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}>
              <Users className="w-4 h-4" /> Employee → Find Roles
            </button>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            onClick={() => setShowAddJD(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Add New Role / Upload JD
          </motion.button>
        </div>

        {/* ───── VIEW 1: JD → Find Candidates ───── */}
        {view === "match-jd" && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left: JD List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 px-1">Open Roles</h3>
              {roles.map(role => (
                <motion.div key={role.id} whileHover={{ x:2 }}
                  onClick={() => setSelectedJD(role)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedJD?.id===role.id ? "border-indigo-300 bg-indigo-50 shadow-md shadow-indigo-100" : "border-slate-100 bg-white shadow-sm hover:shadow-md"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{role.title}</p>
                      <p className="text-[11px] text-slate-500">{role.department} · {role.level}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${priorityCfg[role.priority]}`}>{role.priority}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${role.status==="active" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>{role.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{role.requiredSkills.length} required skills</span>
                    <button onClick={e => { e.stopPropagation(); setShowJDDetail(role); }}
                      className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                      View JD <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Matched Candidates */}
            <div className="lg:col-span-2 space-y-4">
              {selectedJD ? (
                <>
                  {/* Selected JD header */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{selectedJD.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedJD.department} · {selectedJD.level} · {selectedJD.minExperience}+ yrs</p>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedJD.description}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full border flex-shrink-0 ${priorityCfg[selectedJD.priority]}`}>{selectedJD.priority} priority</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJD.requiredSkills.map(s => (
                        <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs focus-within:border-indigo-400">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input value={searchEmp} onChange={e=>setSearchEmp(e.target.value)} placeholder="Search employee..."
                        className="bg-transparent text-xs outline-none w-full text-slate-700" />
                    </div>
                    <select value={filterReady} onChange={e=>setFilterReady(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none">
                      <option value="all">All Readiness</option>
                      <option value="ready-now">Ready Now</option>
                      <option value="ready-soon">Ready Soon</option>
                      <option value="needs-development">Needs Dev</option>
                    </select>
                    <p className="text-xs text-slate-400 ml-auto">{filteredEmps.length} candidates ranked</p>
                  </div>

                  {/* Candidate Cards */}
                  <div className="space-y-3">
                    {filteredEmps.map((emp, i) => {
                      const rc = readinessConfig[emp.readiness];
                      const pc = potentialConfig[emp.potentialRating] || potentialConfig.medium;
                      const avColor = avatarColors[employeeProfiles.indexOf(employeeProfiles.find(e=>e.id===emp.id)) % avatarColors.length];
                      return (
                        <motion.div key={emp.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Rank badge */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i===0?"bg-amber-400 text-white":i===1?"bg-slate-300 text-white":i===2?"bg-orange-400 text-white":"bg-slate-100 text-slate-500"}`}>
                              {i+1}
                            </div>
                            {/* Avatar */}
                            <div className={`w-11 h-11 rounded-xl ${avColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                              {emp.name.split(" ").map(n=>n[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${rc.cls}`}>{rc.label}</span>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(pc.stars)].map((_,j) => <Star key={j} className={`w-3 h-3 fill-current ${pc.color}`} />)}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">{emp.designation} · {emp.department} · {emp.experience}y exp</p>
                              {/* Skill match pills */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {emp.score.matched.slice(0,4).map(s => (
                                  <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />{s}
                                  </span>
                                ))}
                                {emp.score.missing.slice(0,2).map(s => (
                                  <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center gap-0.5">
                                    <X className="w-2.5 h-2.5" />{s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {/* Score */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div className="relative w-14 h-14">
                                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                  <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                                  <circle cx="28" cy="28" r="22" fill="none"
                                    stroke={emp.score.finalScore>=80?"#22c55e":emp.score.finalScore>=60?"#3b82f6":emp.score.finalScore>=40?"#f59e0b":"#ef4444"}
                                    strokeWidth="5" strokeLinecap="round"
                                    strokeDasharray={`${(emp.score.finalScore/100)*138} 138`} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-xs font-black ${getScoreColor(emp.score.finalScore)}`}>{emp.score.finalScore}%</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-bold ${getScoreColor(emp.score.finalScore)}`}>{getScoreLabel(emp.score.finalScore)}</span>
                            </div>
                            {/* Actions */}
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              <button onClick={() => setShowEmpDetail(emp)}
                                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Full Report
                              </button>
                              {emp.readiness !== "not-applicable" && (
                                <button onClick={() => showToast(`Grooming plan initiated for ${emp.name}`)}
                                  className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Nominate
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width:0 }} animate={{ width:`${emp.score.finalScore}%` }} transition={{ delay:0.3+i*0.05, duration:0.8 }}
                                className={`h-full rounded-full ${getScoreBg(emp.score.finalScore)}`} />
                            </div>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {emp.score.matched.length}/{selectedJD.requiredSkills.length} skills matched
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">Select a role to see matched candidates</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───── VIEW 2: Employee → Find Matching Roles ───── */}
        {view === "match-employee" && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left: Employee List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 px-1">Select Employee</h3>
              {employeeProfiles.map((emp, i) => {
                const avColor = avatarColors[i % avatarColors.length];
                const pc = potentialConfig[emp.potentialRating] || potentialConfig.medium;
                return (
                  <motion.div key={emp.id} whileHover={{ x:2 }}
                    onClick={() => setSelectedEmp(emp)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${selectedEmp?.id===emp.id ? "border-indigo-300 bg-indigo-50 shadow-md shadow-indigo-100" : "border-slate-100 bg-white shadow-sm hover:shadow-md"}`}>
                    <div className={`w-10 h-10 rounded-xl ${avColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {emp.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{emp.designation} · {emp.experience}y</p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[...Array(pc.stars)].map((_,j) => <Star key={j} className={`w-3 h-3 fill-current ${pc.color}`} />)}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Right: Matched JDs */}
            <div className="lg:col-span-2 space-y-4">
              {selectedEmp ? (
                <>
                  {/* Employee Profile Header */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${avatarColors[employeeProfiles.indexOf(selectedEmp)%avatarColors.length]} flex items-center justify-center text-white font-bold text-lg`}>
                        {selectedEmp.name.split(" ").map(n=>n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-900">{selectedEmp.name}</h3>
                        <p className="text-xs text-slate-500">{selectedEmp.designation} · {selectedEmp.department} · {selectedEmp.experience}y experience</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedEmp.skills.map(s => (
                            <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${readinessConfig[selectedEmp.readiness]?.cls}`}>
                          {readinessConfig[selectedEmp.readiness]?.label}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Performance: <strong className="text-slate-700">{selectedEmp.currentPerformance}%</strong></p>
                      </div>
                    </div>
                    {selectedEmp.managerNotes && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-700 mb-0.5">Manager Notes</p>
                        <p className="text-xs text-amber-800 italic">"{selectedEmp.managerNotes}"</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-medium px-1">{rankedJDs.length} open roles ranked by match score</p>

                  {/* Matched Roles */}
                  <div className="space-y-3">
                    {rankedJDs.map((jd, i) => (
                      <motion.div key={jd.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i===0?"bg-amber-400 text-white":i===1?"bg-slate-300 text-white":"bg-slate-100 text-slate-500"}`}>
                            {i+1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-bold text-slate-900">{jd.title}</h4>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{jd.department} · {jd.level}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${priorityCfg[jd.priority]}`}>{jd.priority}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{jd.minExperience}+ yrs · Target: {jd.targetTimeline}</p>
                            <div className="flex flex-wrap gap-1">
                              {jd.score.matched.slice(0,4).map(s => (
                                <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />{s}
                                </span>
                              ))}
                              {jd.score.missing.slice(0,3).map(s => (
                                <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center gap-0.5">
                                  <X className="w-2.5 h-2.5" />{s}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width:0 }} animate={{ width:`${jd.score.finalScore}%` }} transition={{ delay:0.4+i*0.08, duration:0.8 }}
                                  className={`h-full rounded-full ${getScoreBg(jd.score.finalScore)}`} />
                              </div>
                              <span className={`text-xs font-black ${getScoreColor(jd.score.finalScore)}`}>{jd.score.finalScore}%</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button onClick={() => setShowJDDetail(jd)}
                              className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> View JD
                            </button>
                            <button onClick={() => showToast(`${selectedEmp.name} nominated for ${jd.title}`)}
                              className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Nominate
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">Select an employee to see role matches</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add JD Modal ── */}
      <AnimatePresence>
        {showAddJD && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddJD(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Role / Upload JD</h3>
                  <p className="text-xs text-slate-500 mt-0.5">AI will instantly match your team against this role</p>
                </div>
                <button onClick={() => setShowAddJD(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Paste JD option */}
              <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Paste JD text for AI extraction (optional)</p>
                <textarea rows={3} value={jdText} onChange={e=>setJdText(e.target.value)}
                  placeholder="Paste full JD text here — AI will extract skills and requirements..."
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs outline-none focus:border-indigo-400 resize-none bg-white" />
              </div>

              <form onSubmit={handleAddJD} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role Title *</label>
                    <input value={addForm.title} onChange={e=>setAddForm(f=>({...f,title:e.target.value}))} required
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</label>
                    <select value={addForm.department} onChange={e=>setAddForm(f=>({...f,department:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400">
                      {["Engineering","Design","Marketing","Sales","Finance","HR","Product","Legal"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Level</label>
                    <select value={addForm.level} onChange={e=>setAddForm(f=>({...f,level:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400">
                      {["L3","L4","L5","L6","L7","Director","VP"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Priority</label>
                    <select value={addForm.priority} onChange={e=>setAddForm(f=>({...f,priority:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Min Experience (yrs)</label>
                    <input type="number" min="1" max="20" value={addForm.minExperience} onChange={e=>setAddForm(f=>({...f,minExperience:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role Description</label>
                  <textarea rows={3} value={addForm.description} onChange={e=>setAddForm(f=>({...f,description:e.target.value}))}
                    placeholder="Brief description of the role and responsibilities..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Required Skills <span className="text-slate-400 font-normal">(comma separated)</span></label>
                  <input value={addForm.skills} onChange={e=>setAddForm(f=>({...f,skills:e.target.value}))} required
                    placeholder="e.g. React, Node.js, Team Leadership, System Design"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nice to Have <span className="text-slate-400 font-normal">(comma separated)</span></label>
                  <input value={addForm.niceToHave} onChange={e=>setAddForm(f=>({...f,niceToHave:e.target.value}))}
                    placeholder="e.g. AWS, Kubernetes, Product Sense"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
                </div>
                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4" /> Create Role & Run AI Match
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JD Detail Modal ── */}
      <AnimatePresence>
        {showJDDetail && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJDDetail(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">{showJDDetail.title}</h3>
                <button onClick={() => setShowJDDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{showJDDetail.department}</span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{showJDDetail.level}</span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{showJDDetail.minExperience}+ years</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{showJDDetail.description}</p>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {showJDDetail.requiredSkills.map(s => <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{s}</span>)}
                  </div>
                </div>
                {showJDDetail.niceToHave?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Nice to Have</p>
                    <div className="flex flex-wrap gap-1.5">
                      {showJDDetail.niceToHave.map(s => <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Employee Full Report Modal ── */}
      <AnimatePresence>
        {showEmpDetail && selectedJD && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmpDetail(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Match Report</h3>
                <button onClick={() => setShowEmpDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Score header */}
              <div className={`rounded-xl p-4 mb-5 ${showEmpDetail.score.finalScore>=80?"bg-green-50 border border-green-200":showEmpDetail.score.finalScore>=60?"bg-blue-50 border border-blue-200":"bg-amber-50 border border-amber-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{showEmpDetail.name} → {selectedJD.title}</p>
                    <p className={`text-2xl font-black mt-1 ${getScoreColor(showEmpDetail.score.finalScore)}`}>{showEmpDetail.score.finalScore}% Match</p>
                    <p className={`text-xs font-semibold ${getScoreColor(showEmpDetail.score.finalScore)}`}>{getScoreLabel(showEmpDetail.score.finalScore)}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 space-y-1">
                    <p>Skill score: <strong>{showEmpDetail.score.skillScore}/70</strong></p>
                    <p>Experience: <strong>{showEmpDetail.score.expScore}/20</strong></p>
                    <p>Nice-to-have: <strong>{showEmpDetail.score.niceScore}/10</strong></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({showEmpDetail.score.matched.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {showEmpDetail.score.matched.map(s => <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{s}</span>)}
                  </div>
                </div>
                {showEmpDetail.score.missing.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Missing Skills ({showEmpDetail.score.missing.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {showEmpDetail.score.missing.map(s => <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">{s}</span>)}
                    </div>
                  </div>
                )}
                {showEmpDetail.managerNotes && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 mb-0.5">Manager Notes</p>
                    <p className="text-xs text-amber-800 italic">"{showEmpDetail.managerNotes}"</p>
                  </div>
                )}
                {showEmpDetail.score.missing.length > 0 && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-700 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Grooming Recommendation</p>
                    <p className="text-xs text-purple-800">
                      {showEmpDetail.name} can bridge the gap in <strong>{showEmpDetail.score.missing.join(", ")}</strong> through targeted L&D programs, stretch assignments, or mentoring from senior team members.
                      Estimated readiness: <strong>{showEmpDetail.readiness === "ready-now" ? "Immediate" : showEmpDetail.readiness === "ready-soon" ? "6 months" : "12+ months"}</strong>.
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={() => { showToast(`Grooming plan initiated for ${showEmpDetail.name}`); setShowEmpDetail(null); }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Nominate & Start Grooming
                  </motion.button>
                  <button onClick={() => setShowEmpDetail(null)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
