"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo, Plus, X, Eye, Edit, Trash2, Users,
  CheckCircle2, AlertCircle, Clock, ArrowRight,
  MessageSquare, Paperclip, Calendar
} from "lucide-react";
import {
  createWorkItem, updateWorkItem, deleteWorkItem,
  changeWorkItemStatusExtended, assignWorkItem,
  addWorkItemComment, getWorkItemDetail, logWorkItemHours, getWorkItemActivity
} from "@/lib/api";
import { useProjects, useWorkItems, useEmployees, useDepartments, useInvalidate } from "@/lib/queries";

const STATUS_COLS = [
  { key:"todo",        label:"To Do",       color:"bg-slate-100 border-slate-200",  dot:"bg-slate-400" },
  { key:"in_progress", label:"In Progress", color:"bg-blue-50 border-blue-200",     dot:"bg-blue-500"  },
  { key:"review",      label:"In Review",   color:"bg-amber-50 border-amber-200",   dot:"bg-amber-500" },
  { key:"blocked",     label:"Blocked",     color:"bg-red-50 border-red-200",       dot:"bg-red-500"   },
  { key:"done",        label:"Done",        color:"bg-green-50 border-green-200",   dot:"bg-green-500" },
  { key:"closed",      label:"Closed",      color:"bg-slate-50 border-slate-300",   dot:"bg-slate-600" },
  { key:"reopened",    label:"Reopened",     color:"bg-purple-50 border-purple-200", dot:"bg-purple-500"},
];

const priorityCfg = {
  low:    { cls:"bg-slate-50 text-slate-500 border-slate-200",  label:"Low"    },
  medium: { cls:"bg-blue-50 text-blue-600 border-blue-200",     label:"Medium" },
  high:   { cls:"bg-orange-50 text-orange-600 border-orange-200",label:"High"  },
  urgent: { cls:"bg-red-50 text-red-600 border-red-200",        label:"Urgent" },
};

export default function WorkItemsPage() {
  const router = useRouter();
  const invalidate = useInvalidate();
  const { data: projData } = useProjects();
  const projects = projData?.projects || [];
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.employees || [];
  const { data: departments = [] } = useDepartments();

  // Assign To filter state
  const [assignDept, setAssignDept]     = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const filteredAssignees = employees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const matchSearch = !assignSearch || name.includes(assignSearch.toLowerCase());
    const matchDept = !assignDept || e.department === assignDept;
    return matchSearch && matchDept;
  });

  const [selectedProject, setSelectedProject] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: itemsData, isLoading } = useWorkItems({
    project_id: selectedProject || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    type: typeFilter || undefined,
  });
  const items = itemsData?.work_items || [];

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ project_id:"", title:"", description:"", priority:"medium", type:"task", severity:"", assigned_to:"", due_date:"", estimated_hours:"", tags:"", steps_to_reproduce:"", expected_result:"", actual_result:"", environment:"" });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [comment, setComment] = useState("");

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleCreate = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { project_id:form.project_id, title:form.title, description:form.description||undefined, priority:form.priority, type:form.type||"task", severity:form.severity||undefined, assigned_to:form.assigned_to||undefined, due_date:form.due_date||undefined, estimated_hours:form.estimated_hours?parseFloat(form.estimated_hours):undefined, tags:form.tags?form.tags.split(",").map(t=>t.trim()).filter(Boolean):undefined, steps_to_reproduce:form.steps_to_reproduce||undefined, expected_result:form.expected_result||undefined, actual_result:form.actual_result||undefined, environment:form.environment||undefined };
    const res = await createWorkItem(payload);
    if (res.ok) { showToast("Work item created"); setShowCreate(false); setForm({project_id:"",title:"",description:"",priority:"medium",type:"task",severity:"",assigned_to:"",due_date:"",estimated_hours:"",tags:"",steps_to_reproduce:"",expected_result:"",actual_result:"",environment:""}); invalidate("work-items"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed to create","error");
    setFormLoading(false);
  };

  const [statusModal, setStatusModal] = useState(null); // {itemId, targetStatus}
  const [blockedReason, setBlockedReason] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [logHoursModal, setLogHoursModal] = useState(null);
  const [logForm, setLogForm] = useState({ hours:"", description:"" });

  const handleStatusChange = async (itemId, newStatus) => {
    // Blocked requires reason, done requires comment
    if (newStatus === "blocked") { setStatusModal({itemId, targetStatus:"blocked"}); setBlockedReason(""); return; }
    if (newStatus === "done") { setStatusModal({itemId, targetStatus:"done"}); setStatusComment(""); return; }
    const res = await changeWorkItemStatusExtended(itemId, newStatus);
    if (res.ok) { invalidate("work-items"); if (showDetail?.id===itemId) loadDetail(itemId); }
    else showToast(res.data?.detail||"Status change failed","error");
  };

  const confirmStatusChange = async () => {
    if (!statusModal) return;
    const { itemId, targetStatus } = statusModal;
    if (targetStatus==="blocked" && !blockedReason.trim()) { showToast("Blocked reason is required","error"); return; }
    if (targetStatus==="done" && !statusComment.trim()) { showToast("Comment is required when marking done","error"); return; }
    const res = await changeWorkItemStatusExtended(itemId, targetStatus, targetStatus==="blocked"?blockedReason:undefined, targetStatus==="done"||targetStatus==="reopened"?statusComment:undefined);
    if (res.ok) { showToast(`Status → ${targetStatus}`); setStatusModal(null); invalidate("work-items"); if (showDetail?.id===itemId) loadDetail(itemId); }
    else showToast(res.data?.detail||"Failed","error");
  };

  const handleLogHours = async () => {
    if (!logHoursModal || !logForm.hours) return;
    const res = await logWorkItemHours(logHoursModal, parseFloat(logForm.hours), logForm.description);
    if (res.ok) { showToast(`Logged ${logForm.hours}h`); setLogHoursModal(null); setLogForm({hours:"",description:""}); loadDetail(logHoursModal); }
    else showToast("Failed to log hours","error");
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Delete this work item?")) return;
    const res = await deleteWorkItem(itemId);
    if (res.ok) { showToast("Deleted"); invalidate("work-items"); setShowDetail(null); }
    else showToast("Failed","error");
  };

  const handleComment = async (itemId) => {
    if (!comment.trim()) return;
    const res = await addWorkItemComment(itemId, comment);
    if (res.ok) { setComment(""); loadDetail(itemId); }
    else showToast("Failed to add comment","error");
  };

  const loadDetail = async (itemId) => {
    const res = await getWorkItemDetail(itemId);
    if (res.ok && res.data) setShowDetail(res.data);
  };

  // Group items by status for kanban
  const grouped = {};
  STATUS_COLS.forEach(c=>{ grouped[c.key] = items.filter(it=>it.status===c.key); });

  const inProgressCount = items.filter(it => it.status === 'in_progress').length;
  const blockedCount = items.filter(it => it.status === 'blocked').length;
  const doneCount = items.filter(it => it.status === 'done').length;

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Work Items Board</h3>
          <p className="text-sm text-slate-500">Track tasks, bugs, and features across projects</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer max-w-[130px]">
              <option value="">All Projects</option>
              {projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
            </select>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="">All Types</option>
              <option value="task">Task</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="improvement">Improvement</option><option value="daily_work">Daily Work</option><option value="support">Support</option>
            </select>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4"/> New Work Item
          </motion.button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: items.length, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
          { label: "In Progress", value: inProgressCount, color: "text-blue-700", bg: "bg-blue-50/60", border: "border-blue-100/40", dot: "bg-blue-500" },
          { label: "Blocked", value: blockedCount, color: "text-rose-700", bg: "bg-rose-50/60", border: "border-rose-100/40", dot: "bg-rose-500" },
          { label: "Done", value: doneCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
              <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full ${k.dot}`} />
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLS.map(col=>(
            <div key={col.key} className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[300px] overflow-hidden">
              {/* Column Header */}
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${col.color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot} flex-shrink-0`}/>
                <span className="text-xs font-bold text-slate-800 flex-1">{col.label}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/80 text-slate-600 border border-white/50`}>{grouped[col.key]?.length||0}</span>
              </div>
              {/* Cards */}
              <div className="p-3 space-y-2.5 flex-1">
                {(grouped[col.key]||[]).map((item,i)=>{
                  const pc = priorityCfg[item.priority]||priorityCfg.medium;
                  return (
                    <motion.div key={item.id||i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                      onClick={()=>router.push(`/org/hr/work/work-items/${item.id||item._id}`)}
                      className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-100 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors flex-1">{item.title}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${pc.cls}`}>{pc.label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {item.assigned_to_name ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">
                                {item.assigned_to_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                              </div>
                              <span className="text-[9px] font-semibold text-slate-500">{item.assigned_to_name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Unassigned</span>
                          )}
                        </div>
                        {item.due_date && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-slate-400">
                            <Calendar className="w-2.5 h-2.5"/>
                            {new Date(item.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                          </span>
                        )}
                      </div>
                      {item.project_name && (
                        <p className="text-[9px] font-bold text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100 truncate">
                          {item.project_name}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
                {(grouped[col.key]||[]).length===0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      <ListTodo className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">Empty</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Work Item Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                    <ListTodo className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">New Work Item</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Create task, bug, or feature request</p>
                  </div>
                </div>
                <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5">
                <form id="work-item-form" onSubmit={handleCreate} className="space-y-5">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Project *</label>
                    <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white cursor-pointer transition-all">
                      <option value="">Select project...</option>{projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
                    </select></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Build employee import API" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Details about the task..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white resize-none transition-all"/></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                      <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all">
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                      </select></div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
                      <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all">
                        <option value="task">Task</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="improvement">Improvement</option><option value="daily_work">Daily Work</option><option value="support">Support</option>
                      </select></div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Severity {form.type==="bug"&&<span className="text-red-500">*</span>}</label>
                      <select value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all">
                        <option value="">None</option><option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option><option value="trivial">Trivial</option>
                      </select></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tags <span className="text-slate-400 font-normal text-[9px] normal-case">(comma-separated)</span></label>
                    <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="login, android, urgent" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/></div>
                  {form.type==="bug"&&(
                    <div className="space-y-4 p-4 rounded-xl bg-rose-50/60 border border-rose-200/60">
                      <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">🐛 Bug Details</p>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Steps to Reproduce</label>
                        <textarea rows={3} value={form.steps_to_reproduce} onChange={e=>setForm(f=>({...f,steps_to_reproduce:e.target.value}))} placeholder={"1. Open app\n2. Enter credentials\n3. Tap login"} className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-sm outline-none focus:border-rose-400 resize-none font-mono text-xs bg-white"/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Expected Result</label>
                          <textarea rows={2} value={form.expected_result} onChange={e=>setForm(f=>({...f,expected_result:e.target.value}))} placeholder="User logs in" className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-sm outline-none focus:border-rose-400 resize-none bg-white"/></div>
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Actual Result</label>
                          <textarea rows={2} value={form.actual_result} onChange={e=>setForm(f=>({...f,actual_result:e.target.value}))} placeholder="App crashes" className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-sm outline-none focus:border-rose-400 resize-none bg-white"/></div>
                      </div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Environment</label>
                        <input value={form.environment} onChange={e=>setForm(f=>({...f,environment:e.target.value}))} placeholder="Android 14 / Chrome 120 / v2.3.1" className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-sm outline-none focus:border-rose-400 bg-white transition-all"/></div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Assign To</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select value={assignDept} onChange={e=>setAssignDept(e.target.value)} className="px-2 py-2 rounded-lg border border-slate-200 text-[10px] font-semibold bg-white outline-none focus:border-brand-400 w-24 cursor-pointer">
                            <option value="">All Depts</option>
                            {departments.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                          </select>
                          <input value={assignSearch} onChange={e=>setAssignSearch(e.target.value)} placeholder="Search..."
                            className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-[10px] font-semibold outline-none focus:border-brand-400"/>
                        </div>
                        <select value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 bg-white cursor-pointer transition-all">
                          <option value="">Unassigned</option>
                          {filteredAssignees.map(e=><option key={e.id||e._id} value={e.employee_id||e.id||e._id}>{e.first_name} {e.last_name} — {e.department}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Estimated Hours</label><input type="number" step="0.5" value={form.estimated_hours} onChange={e=>setForm(f=>({...f,estimated_hours:e.target.value}))} placeholder="8" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/></div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="work-item-form" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <><CheckCircle2 className="w-4 h-4" /> Create Item</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
