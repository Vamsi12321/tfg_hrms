"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Pin, Plus, X, Search, Edit, Trash2,
  CheckCircle2, AlertCircle, Eye, Download, ChevronLeft, ChevronRight, ChevronDown, Calendar, Users
} from "lucide-react";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/api";
import { useAnnouncements, useDepartments, useEmployees, useInvalidate } from "@/lib/queries";
import TopBar from "@/components/TopBar";

const PAGE_SIZE = 12;

const typeCfg = {
  general:     { cls: "bg-slate-50 text-slate-600 border-slate-200",    label: "General"     },
  urgent:      { cls: "bg-red-50 text-red-600 border-red-100",           label: "Urgent"      },
  event:       { cls: "bg-purple-50 text-purple-600 border-purple-100",  label: "Event"       },
  policy:      { cls: "bg-blue-50 text-blue-600 border-blue-100",        label: "Policy"      },
  celebration: { cls: "bg-amber-50 text-amber-600 border-amber-100",     label: "Celebration" },
};

export default function HRAnnouncementsPage() {
  const [typeFilter,     setTypeFilter]     = useState("");
  const [deptFilter,     setDeptFilter]     = useState("");
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);
  const [showCreateModal,setShowCreateModal]= useState(false);
  const [showEditModal,  setShowEditModal]  = useState(null);
  const [formLoading,    setFormLoading]    = useState(false);
  const [formError,      setFormError]      = useState("");
  const [toast,          setToast]          = useState(null);
  const [deptDropOpen,   setDeptDropOpen]   = useState(false);
  const [empDropOpen,    setEmpDropOpen]    = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", type: "general", priority: "normal",
    target_departments: [], target_employees: [], is_pinned: false, expires_at: ""
  });

  const invalidate = useInvalidate();
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const qParams = { limit: 100 };
  if (typeFilter) qParams.type = typeFilter;
  if (deptFilter) qParams.department = deptFilter;
  const { data: announcementData, isLoading: loading } = useAnnouncements(qParams);
  const announcements = announcementData?.announcements || [];
  const { data: deptList = [] } = useDepartments();
  const { data: empData } = useEmployees({ limit: 100 });
  const allEmployees = empData?.employees || [];

  const filtered = announcements.filter(a =>
    !search ||
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetForm = () => setForm({ title: "", content: "", type: "general", priority: "normal", target_departments: [], target_employees: [], is_pinned: false, expires_at: "" });

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(""); setFormLoading(true);
    const res = await createAnnouncement({ ...form, expires_at: form.expires_at || null });
    if (res.ok) {
      showToast("Announcement created!"); setShowCreateModal(false); resetForm(); invalidate("announcements");
    } else {
      setFormError(typeof res.data?.detail === "string" ? res.data.detail : Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed to create");
    }
    setFormLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    setFormError(""); setFormLoading(true);
    const res = await updateAnnouncement(showEditModal.id, { ...form, expires_at: form.expires_at || null });
    if (res.ok) {
      showToast("Updated!"); setShowEditModal(null); invalidate("announcements");
    } else {
      setFormError(typeof res.data?.detail === "string" ? res.data.detail : "Failed to update");
    }
    setFormLoading(false);
  };

  const handleDelete = async (ann) => {
    if (!confirm(`Delete "${ann.title}"?`)) return;
    const res = await deleteAnnouncement(ann.id);
    if (res.ok) { showToast("Deleted"); invalidate("announcements"); }
    else showToast("Failed to delete", "error");
  };

  const openEdit = (ann) => {
    setForm({ title: ann.title || "", content: ann.content || "", type: ann.type || "general", priority: ann.priority || "normal", target_departments: ann.target_departments || [], target_employees: ann.target_employees || [], is_pinned: ann.is_pinned || false, expires_at: ann.expires_at || "" });
    setFormError(""); setShowEditModal(ann);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all";

  // KPIs
  const kpiTotal = announcements.length;
  const kpiPinned = announcements.filter(a => a.is_pinned).length;
  const kpiUrgent = announcements.filter(a => a.priority === "high").length;
  const kpiEvents = announcements.filter(a => a.type === "event").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Announcements" />
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
            {toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: kpiTotal, color: "text-blue-600", iconBg: "bg-blue-50", icon: Megaphone, iconColor: "text-blue-500" },
          { label: "Pinned", value: kpiPinned, color: "text-green-600", iconBg: "bg-green-50", icon: Pin, iconColor: "text-green-500" },
          { label: "Urgent", value: kpiUrgent, color: "text-red-600", iconBg: "bg-red-50", icon: AlertCircle, iconColor: "text-red-500" },
          { label: "Events", value: kpiEvents, color: "text-purple-600", iconBg: "bg-purple-50", icon: Calendar, iconColor: "text-purple-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{s.label}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header with Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">All Announcements</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Manage internal broadcasts and notices</p>
        </div>
        <button onClick={()=>{ resetForm(); setFormError(""); setShowCreateModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">
          <Plus className="w-3.5 h-3.5"/> New Announcement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder="Search announcements..."
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"/>
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-slate-400 hover:text-slate-600"/></button>}
        </div>
        
        <select value={typeFilter} onChange={e=>{ setTypeFilter(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 outline-none shadow-sm focus:border-brand-500 transition-all cursor-pointer min-w-[150px]">
          <option value="">All Types</option>
          {Object.keys(typeCfg).map(k=><option key={k} value={k}>{typeCfg[k].label}</option>)}
        </select>

        <select value={deptFilter} onChange={e=>{ setDeptFilter(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 outline-none shadow-sm focus:border-brand-500 transition-all cursor-pointer min-w-[170px]">
          <option value="">All Departments</option>
          {deptList.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>
        </div>
      ) : paged.length === 0 ? (
        <div className="flex justify-center py-10">
          <div className="bg-white rounded-3xl p-10 border border-slate-200/60 shadow-sm text-center max-w-lg w-full">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Megaphone className="w-8 h-8"/>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{search ? "No matching announcements" : "No announcements yet"}</h3>
            <p className="text-sm font-medium text-slate-500 mb-5">Click 'New Announcement' to create your first broadcast.</p>
            <button onClick={()=>{ resetForm(); setFormError(""); setShowCreateModal(true); }}
              className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              Create Broadcast
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map((ann,i)=>{
              const tc = typeCfg[ann.type] || typeCfg.general;
              return (
                <motion.div key={ann.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                  
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0 ${tc.cls.replace("text-","text-opacity-100 ").replace("bg-","bg-opacity-50 ")}`}>
                        <Megaphone className="w-5 h-5"/>
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight pr-6 relative">
                          {ann.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 absolute -right-4 top-0.5" />}
                          {ann.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">Broadcast details</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${ann.priority==="high" ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ann.priority==="high" ? "bg-red-500" : "bg-emerald-500"}`} />
                      {ann.priority==="high" ? "High Priority" : "Normal"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-purple-50/30 border border-purple-100/20 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Type</p>
                      <p className="text-xl font-black text-purple-700 capitalize">{ann.type || "general"}</p>
                    </div>
                    <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Read Status</p>
                      <p className="text-xl font-black text-blue-700">{ann.read_count != null ? `${ann.read_count}/${ann.total_recipients||"?"}` : "—"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-slate-400">Created By</span>
                      <span className="text-slate-900 font-bold">{ann.created_by_name||"HR Team"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-slate-400">Target</span>
                      <span className="text-slate-900 font-bold truncate max-w-[160px]">{ann.target_departments?.length > 0 ? ann.target_departments.join(", ") : "All Staff"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-slate-400">Created At</span>
                      <span className="text-slate-900 font-bold">{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ""}</span>
                    </div>
                    <div className="flex flex-col text-sm py-1 gap-1">
                      <span className="text-slate-400">Message</span>
                      <span className="text-slate-600 font-medium text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-24 overflow-y-auto custom-scrollbar">{ann.content}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                    <button onClick={()=>openEdit(ann)} 
                      className="flex-1 py-3 bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 rounded-xl text-xs font-bold text-center transition-colors shadow-sm">
                      Edit Broadcast
                    </button>
                    <button onClick={()=>handleDelete(ann)} 
                      className="w-11 h-11 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center transition-all">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 border border-slate-100 shadow-sm mt-4">
              <p className="text-sm font-semibold text-slate-500">Showing page <span className="text-slate-900">{page}</span> of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} 
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} 
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Clean White Modal */}
      <AnimatePresence>
        {(showCreateModal||showEditModal)&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={()=>{ setShowCreateModal(false); setShowEditModal(null); setDeptDropOpen(false); setEmpDropOpen(false); }}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} transition={{type:"spring",damping:28,stiffness:320}}
              onClick={e=>e.stopPropagation()} 
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white">{showEditModal?"Edit":"New"} Announcement</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Broadcast a message to your team</p>
                </div>
                <button onClick={()=>{ setShowCreateModal(false); setShowEditModal(null); setDeptDropOpen(false); setEmpDropOpen(false); }} 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={showEditModal?handleUpdate:handleCreate} className="space-y-5">
                  {formError&&(
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0"/>
                      <p className="text-xs font-semibold text-red-700">{formError}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Title *</label>
                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="E.g., Quarterly Townhall Meeting" className={inputCls}/>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Message Content *</label>
                    <textarea rows={4} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} required placeholder="Write the full announcement text here..." className={`${inputCls} resize-none`}/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Type</label>
                      <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={`${inputCls} cursor-pointer`}>
                        <option value="general">General</option><option value="urgent">Urgent</option><option value="event">Event</option><option value="policy">Policy</option><option value="celebration">Celebration</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Priority</label>
                      <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className={`${inputCls} cursor-pointer`}>
                        <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Expires At (Optional)</label>
                      <input type="date" value={form.expires_at} onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))} className={inputCls}/>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl hover:bg-blue-50 border border-slate-200 w-full transition-colors">
                        <input type="checkbox" checked={form.is_pinned} onChange={e=>setForm(f=>({...f,is_pinned:e.target.checked}))} 
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                        <span className="text-xs font-bold text-slate-700">Pin to Dashboard</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Target Departments</label>
                      <div className="relative">
                        <button type="button" onClick={()=>{ setDeptDropOpen(o=>!o); setEmpDropOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${deptDropOpen ? "border-brand-500 bg-white" : "border-slate-200 bg-white hover:border-brand-400"}`}>
                          <span className={form.target_departments.length === 0 ? "text-slate-400" : "text-slate-800"}>
                            {form.target_departments.length === 0 ? "All Departments" : `${form.target_departments.length} selected`}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${deptDropOpen?"rotate-180":""}`}/>
                        </button>
                        <AnimatePresence>
                          {deptDropOpen && (
                            <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-5}} transition={{duration:0.15}}
                              className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto p-1.5">
                              <button type="button" onClick={()=>{ setForm(f=>({...f,target_departments:[]})); setDeptDropOpen(false); }}
                                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                                All Departments (Clear)
                              </button>
                              <div className="h-px bg-slate-100 my-1"/>
                              {deptList.map(dept => {
                                const selected = form.target_departments.includes(dept.name);
                                return (
                                  <button key={dept.id||dept.name} type="button"
                                    onClick={()=>{ setForm(f=>({ ...f, target_departments: selected ? f.target_departments.filter(d=>d!==dept.name) : [...f.target_departments, dept.name] })); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-0.5 ${selected?"bg-brand-50 text-brand-700":"text-slate-700 hover:bg-slate-50"}`}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-brand-600 border-brand-600" : "bg-white border-slate-300"}`}>
                                      {selected && <CheckCircle2 className="w-3 h-3 text-white"/>}
                                    </div>
                                    {dept.name}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Target Specific Individuals (Optional)</label>
                      <div className="relative">
                        <button type="button" onClick={()=>{ setEmpDropOpen(o=>!o); setDeptDropOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${empDropOpen ? "border-brand-500 bg-white" : "border-slate-200 bg-white hover:border-brand-400"}`}>
                          <span className={(form.target_employees||[]).length === 0 ? "text-slate-400" : "text-slate-800"}>
                            {(form.target_employees||[]).length === 0 ? "All in selected departments" : `${(form.target_employees||[]).length} selected`}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${empDropOpen?"rotate-180":""}`}/>
                        </button>
                        <AnimatePresence>
                          {empDropOpen && (
                            <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-5}} transition={{duration:0.15}}
                              className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-64 overflow-hidden flex flex-col">
                              <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <input autoFocus placeholder="Search names..."
                                    className="bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none w-full"
                                    onChange={e => {
                                      const q = e.target.value.toLowerCase();
                                      document.querySelectorAll("[data-emp-option]").forEach(el => {
                                        el.style.display = el.dataset.empName?.toLowerCase().includes(q) ? "" : "none";
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="p-1.5 overflow-y-auto flex-1 custom-scrollbar">
                                <button type="button" onClick={()=>{ setForm(f=>({...f,target_employees:[]})); setEmpDropOpen(false); }}
                                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors mb-1">
                                  All in selected departments (Clear)
                                </button>
                                {(form.target_departments.length > 0 ? allEmployees.filter(e => form.target_departments.includes(e.department)) : allEmployees).map(emp => {
                                  const empId = emp.id || emp._id;
                                  const selected = (form.target_employees||[]).includes(empId);
                                  const name = `${emp.first_name} ${emp.last_name}`;
                                  return (
                                    <button key={empId} type="button" data-emp-option data-emp-name={name}
                                      onClick={()=>setForm(f=>({ ...f, target_employees: selected ? (f.target_employees||[]).filter(x=>x!==empId) : [...(f.target_employees||[]), empId] }))}
                                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors mt-0.5 ${selected?"bg-indigo-50 text-indigo-700":"text-slate-700 hover:bg-slate-50"}`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"}`}>
                                          {selected && <CheckCircle2 className="w-3 h-3 text-white"/>}
                                        </div>
                                        <div className="text-left">
                                          <p className="font-bold">{name}</p>
                                          <p className="text-[10px] font-medium text-slate-500">{emp.department || "No Dept"}</p>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={()=>{ setShowCreateModal(false); setShowEditModal(null); setDeptDropOpen(false); setEmpDropOpen(false); }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={formLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-60 transition-all">
                      {formLoading ? "Saving..." : showEditModal ? "Save Changes" : "Publish Announcement"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
