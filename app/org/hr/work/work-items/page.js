"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
            <option value="">All Projects</option>
            {projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
          </select>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
            <option value="">All Types</option>
            <option value="task">Task</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="improvement">Improvement</option><option value="daily_work">Daily Work</option><option value="support">Support</option>
          </select>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> New Work Item
        </motion.button>
      </div>

      {/* Kanban Board */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLS.map(col=>(
            <div key={col.key} className={`rounded-2xl border p-3 min-h-[300px] ${col.color}`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
                <span className="text-xs font-bold text-slate-700">{col.label}</span>
                <span className="text-[10px] font-bold text-slate-400 ml-auto bg-white/70 px-2 py-0.5 rounded-full">{grouped[col.key]?.length||0}</span>
              </div>
              <div className="space-y-2">
                {(grouped[col.key]||[]).map((item,i)=>{
                  const pc = priorityCfg[item.priority]||priorityCfg.medium;
                  return (
                    <motion.div key={item.id||i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                      onClick={()=>loadDetail(item.id||item._id)}
                      className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{item.title}</h4>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${pc.cls}`}>{pc.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.assigned_to_name && (
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[8px] font-bold text-brand-600">
                                {item.assigned_to_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                              </div>
                              <span className="text-[9px] text-slate-500">{item.assigned_to_name.split(" ")[0]}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                          {item.due_date && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5"/>{new Date(item.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>}
                        </div>
                      </div>
                      {item.project_name && <p className="text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-50">{item.project_name}</p>}
                    </motion.div>
                  );
                })}
                {(grouped[col.key]||[]).length===0 && (
                  <div className="text-center py-8"><p className="text-[10px] text-slate-400">No items</p></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Work Item Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">New Work Item</h3><button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Project *</label>
                  <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="">Select project...</option>{projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Build employee import API" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Details about the task..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Priority</label>
                    <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                    <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                      <option value="task">Task</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="improvement">Improvement</option><option value="daily_work">Daily Work</option><option value="support">Support</option>
                    </select></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Severity {form.type==="bug"&&<span className="text-red-500">*</span>}</label>
                    <select value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                      <option value="">None</option><option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option><option value="trivial">Trivial</option>
                    </select></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                  <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="login, android, urgent" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                {/* Bug-specific fields — shown only when type=bug */}
                {form.type==="bug"&&(
                  <div className="space-y-3 p-4 rounded-xl bg-red-50/50 border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Bug Details</p>
                    <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Steps to Reproduce</label>
                      <textarea rows={3} value={form.steps_to_reproduce} onChange={e=>setForm(f=>({...f,steps_to_reproduce:e.target.value}))} placeholder="1. Open app&#10;2. Enter credentials&#10;3. Tap login" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-300 resize-none font-mono text-xs"/></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Expected Result</label>
                        <textarea rows={2} value={form.expected_result} onChange={e=>setForm(f=>({...f,expected_result:e.target.value}))} placeholder="User logs in successfully" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-300 resize-none"/></div>
                      <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Actual Result</label>
                        <textarea rows={2} value={form.actual_result} onChange={e=>setForm(f=>({...f,actual_result:e.target.value}))} placeholder="App crashes with error 500" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-300 resize-none"/></div>
                    </div>
                    <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Environment</label>
                      <input value={form.environment} onChange={e=>setForm(f=>({...f,environment:e.target.value}))} placeholder="Android 14 / Chrome 120 / v2.3.1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-300"/></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Assign To</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select value={assignDept} onChange={e=>setAssignDept(e.target.value)} className="px-2 py-2 rounded-lg border border-slate-200 text-[10px] bg-white outline-none focus:border-brand-400 w-28">
                          <option value="">All Depts</option>
                          {departments.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                        </select>
                        <input value={assignSearch} onChange={e=>setAssignSearch(e.target.value)} placeholder="Search name..."
                          className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-[10px] outline-none focus:border-brand-400"/>
                      </div>
                      <select value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                        <option value="">Unassigned</option>
                        {filteredAssignees.map(e=><option key={e.id||e._id} value={e.employee_id||e.id||e._id}>{e.first_name} {e.last_name} — {e.department}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Estimated Hours</label><input type="number" step="0.5" value={form.estimated_hours} onChange={e=>setForm(f=>({...f,estimated_hours:e.target.value}))} placeholder="8" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Creating...":"Create Work Item"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}}
              transition={{type:"spring",damping:28,stiffness:320}} onClick={e=>e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${(priorityCfg[showDetail.priority]||priorityCfg.medium).cls}`}>{(priorityCfg[showDetail.priority]||priorityCfg.medium).label}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 capitalize">{(showDetail.status||"todo").replace("_"," ")}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{showDetail.title}</h3>
                  {showDetail.project_name && <p className="text-[10px] text-slate-500 mt-0.5">{showDetail.project_name}{showDetail.assigned_to_name?` · ${showDetail.assigned_to_name}`:""}</p>}
                </div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center flex-shrink-0 ml-3"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {showDetail.description && <div className="p-4 rounded-xl bg-slate-50 border border-slate-100"><p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{showDetail.description}</p></div>}
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  {showDetail.due_date && <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Due Date</p><p className="text-xs font-semibold text-slate-800">{new Date(showDetail.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p></div>}
                  {showDetail.estimated_hours && <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Estimated</p><p className="text-xs font-semibold text-slate-800">{showDetail.estimated_hours}h</p></div>}
                </div>
                {/* Status change */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_COLS.map(col=>(
                      <button key={col.key} onClick={()=>handleStatusChange(showDetail.id||showDetail._id, col.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border transition-all ${showDetail.status===col.key?"ring-2 ring-brand-300 "+col.color:col.color+" opacity-60 hover:opacity-100"}`}>
                        <span className={`w-2 h-2 rounded-full ${col.dot}`}/>{col.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Comments */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-slate-400"/> Comments</p>
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {(showDetail.comments||[]).length>0 ? showDetail.comments.map((c,i)=>(
                      <div key={c.id||i} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600 flex-shrink-0">{(c.employee_name||"U")[0]}</div>
                        <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          <div className="flex items-center justify-between mb-0.5"><span className="text-[10px] font-bold text-slate-700">{c.employee_name||"User"}</span><span className="text-[9px] text-slate-400">{c.created_at?new Date(c.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}</span></div>
                          <p className="text-xs text-slate-600">{c.text}</p>
                        </div>
                      </div>
                    )) : <p className="text-[10px] text-slate-400 text-center py-3">No comments yet</p>}
                  </div>
                  <div className="flex gap-2 items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-brand-400 transition-all">
                    <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleComment(showDetail.id||showDetail._id)} placeholder="Add a comment…" className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"/>
                    <button onClick={()=>handleComment(showDetail.id||showDetail._id)} disabled={!comment.trim()} className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 flex items-center justify-center transition-colors"><ArrowRight className="w-3.5 h-3.5 text-white"/></button>
                  </div>
                </div>
                {/* Attachments */}
                {(showDetail.attachments||[]).length>0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5 text-slate-400"/> Attachments</p>
                    <div className="space-y-1.5">
                      {showDetail.attachments.map((a,i)=>(
                        <a key={a.id||i} href={a.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-brand-50 transition-colors">
                          <Paperclip className="w-3 h-3 text-slate-400 flex-shrink-0"/>
                          <span className="text-xs text-brand-600 font-semibold truncate">{a.file_name}</span>
                          <span className="text-[9px] text-slate-400 ml-auto flex-shrink-0">{a.uploaded_by_name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Footer actions */}
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                <button onClick={()=>handleDelete(showDetail.id||showDetail._id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                <span className="text-[9px] text-slate-400">Created by {showDetail.created_by_name||"—"}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
