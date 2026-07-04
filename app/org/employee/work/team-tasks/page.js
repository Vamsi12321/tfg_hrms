"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, Calendar, CheckCircle2, AlertCircle,
  ArrowRight, MessageSquare
} from "lucide-react";
import {
  createWorkItem, changeWorkItemStatus, assignWorkItem,
  addWorkItemComment, getWorkItemDetail, getProjectMembers
} from "@/lib/api";
import { useProjects, useWorkItems, useEmployees, useDepartments, useInvalidate } from "@/lib/queries";

const STATUS_COLS = [
  { key:"todo",        label:"To Do",       dot:"bg-slate-400",  bg:"bg-slate-50"  },
  { key:"in_progress", label:"In Progress", dot:"bg-blue-500",   bg:"bg-blue-50"   },
  { key:"review",      label:"In Review",   dot:"bg-amber-500",  bg:"bg-amber-50"  },
  { key:"blocked",     label:"Blocked",     dot:"bg-red-500",    bg:"bg-red-50"    },
  { key:"done",        label:"Done",        dot:"bg-green-500",  bg:"bg-green-50"  },
  { key:"closed",      label:"Closed",      dot:"bg-slate-600",  bg:"bg-slate-50"  },
  { key:"reopened",    label:"Reopened",     dot:"bg-purple-500", bg:"bg-purple-50" },
];

const priorityCfg = {
  low:    { cls:"bg-slate-50 text-slate-500 border-slate-200",    label:"Low"    },
  medium: { cls:"bg-blue-50 text-blue-600 border-blue-200",       label:"Medium" },
  high:   { cls:"bg-orange-50 text-orange-600 border-orange-200", label:"High"   },
  urgent: { cls:"bg-red-50 text-red-600 border-red-200",          label:"Urgent" },
};

export default function TeamTasksPage() {
  const invalidate = useInvalidate();
  const { data: projData } = useProjects();
  const projects = projData?.projects || [];
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.employees || [];

  const [selectedProject, setSelectedProject] = useState("");
  const [projectMembers, setProjectMembers] = useState([]);

  // Auto-select first project when projects load
  const firstProjectId = projects.length > 0 ? (projects[0].id || projects[0]._id) : "";

  const activeProjectId = selectedProject || firstProjectId;
  const { data: itemsData, isLoading } = useWorkItems({ project_id: activeProjectId || undefined });
  const items = itemsData?.work_items || [];

  // Load project members when project changes (for assign dropdown)
  const loadProjectMembers = async (projectId) => {
    if (!projectId) { setProjectMembers([]); return; }
    const res = await getProjectMembers(projectId);
    if (res.ok && res.data) setProjectMembers(res.data.members || []);
    else setProjectMembers([]);
  };

  // Auto-load members for active project
  useEffect(() => {
    if (activeProjectId) loadProjectMembers(activeProjectId);
  }, [activeProjectId]);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ project_id:"", title:"", description:"", priority:"medium", assigned_to:"", due_date:"", estimated_hours:"" });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [comment, setComment] = useState("");

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const grouped = {};
  STATUS_COLS.forEach(c=>{ grouped[c.key] = items.filter(it=>it.status===c.key); });

  const handleCreate = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { project_id:form.project_id, title:form.title, description:form.description||undefined, priority:form.priority, assigned_to:form.assigned_to||undefined, due_date:form.due_date||undefined, estimated_hours:form.estimated_hours?parseFloat(form.estimated_hours):undefined };
    const res = await createWorkItem(payload);
    if (res.ok) { showToast("Work item created & assigned"); setShowCreate(false); setForm({project_id:"",title:"",description:"",priority:"medium",assigned_to:"",due_date:"",estimated_hours:""}); invalidate("work-items"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setFormLoading(false);
  };

  const handleStatusChange = async (itemId, newStatus) => {
    const res = await changeWorkItemStatus(itemId, newStatus);
    if (res.ok) { invalidate("work-items"); if (showDetail?.id===itemId) loadDetail(itemId); }
    else showToast("Failed","error");
  };

  const handleAssign = async (itemId, empId) => {
    const res = await assignWorkItem(itemId, empId);
    if (res.ok) { showToast("Assigned"); invalidate("work-items"); loadDetail(itemId); }
    else showToast("Failed","error");
  };

  const handleComment = async (itemId) => {
    if (!comment.trim()) return;
    const res = await addWorkItemComment(itemId, comment);
    if (res.ok) { setComment(""); loadDetail(itemId); }
  };

  const loadDetail = async (itemId) => {
    const res = await getWorkItemDetail(itemId);
    if (res.ok && res.data) setShowDetail(res.data);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={selectedProject} onChange={e=>{setSelectedProject(e.target.value);loadProjectMembers(e.target.value);}} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
            <option value="">All Projects</option>
            {projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
          </select>
          <span className="text-xs text-slate-500">{items.length} items</span>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> Assign Task
        </motion.button>
      </div>

      {/* Kanban */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLS.map(col=>(
            <div key={col.key} className={`rounded-2xl border border-slate-200 p-3 min-h-[250px] ${col.bg}`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
                <span className="text-xs font-bold text-slate-700">{col.label}</span>
                <span className="text-[10px] font-bold text-slate-400 ml-auto">{grouped[col.key]?.length||0}</span>
              </div>
              <div className="space-y-2">
                {(grouped[col.key]||[]).map((item,i)=>{
                  const pc = priorityCfg[item.priority]||priorityCfg.medium;
                  return (
                    <motion.div key={item.id||i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                      onClick={()=>loadDetail(item.id||item._id)}
                      className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{item.title}</h4>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${pc.cls}`}>{pc.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        {item.assigned_to_name ? (
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center text-[7px] font-bold text-brand-600">{item.assigned_to_name[0]}</div>
                            <span>{item.assigned_to_name.split(" ")[0]}</span>
                          </div>
                        ) : <span className="text-amber-500 font-bold">Unassigned</span>}
                        {item.due_date && <span>{new Date(item.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>}
                      </div>
                    </motion.div>
                  );
                })}
                {(grouped[col.key]||[]).length===0 && <div className="py-6 text-center"><p className="text-[10px] text-slate-400">Empty</p></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create + Assign Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Create & Assign Task</h3><button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="border-l-3 border-brand-400 pl-3">
                  <label className="text-[10px] font-bold text-brand-600 mb-1 block">Project *</label>
                  <select value={form.project_id} onChange={e=>{setForm(f=>({...f,project_id:e.target.value}));loadProjectMembers(e.target.value);}} required className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="">Select project...</option>{projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="border-l-3 border-slate-400 pl-3">
                  <label className="text-[10px] font-bold text-slate-600 mb-1 block">Title *</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Task title" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400"/>
                </div>
                <div className="border-l-3 border-slate-300 pl-3">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Details..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-l-3 border-orange-400 pl-3">
                    <label className="text-[10px] font-bold text-orange-600 mb-1 block">Priority</label>
                    <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-300 bg-white">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select></div>
                  <div className="border-l-3 border-indigo-400 pl-3">
                    <label className="text-[10px] font-bold text-indigo-600 mb-1 block">Due Date</label>
                    <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-300"/></div>
                </div>
                <div className="border-l-3 border-green-400 pl-3">
                  <label className="text-[10px] font-bold text-green-600 mb-1 block">Assign To *</label>
                  <select value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} required className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-300 bg-white">
                    <option value="">Select team member...</option>
                    {projectMembers.length > 0
                      ? projectMembers.map(m=><option key={m.employee_id} value={m.employee_id}>{m.name} — {m.department}</option>)
                      : employees.map(e=><option key={e.id||e._id} value={e.employee_id||e.id||e._id}>{e.first_name} {e.last_name} — {e.department}</option>)
                    }
                  </select>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Creating...":"Create & Assign"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal with reassign */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}} transition={{type:"spring",damping:28,stiffness:320}} onClick={e=>e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900">{showDetail.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{showDetail.project_name} · Assigned to: {showDetail.assigned_to_name||"Unassigned"}</p>
                </div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center flex-shrink-0 ml-3"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {showDetail.description && <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{showDetail.description}</p>}
                {/* Reassign */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Reassign</p>
                  <select onChange={e=>{if(e.target.value)handleAssign(showDetail.id||showDetail._id, e.target.value);}} defaultValue="" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="" disabled>Select member to reassign...</option>
                    {projectMembers.length > 0
                      ? projectMembers.map(m=><option key={m.employee_id} value={m.employee_id}>{m.name} — {m.department}</option>)
                      : employees.map(e=><option key={e.id||e._id} value={e.employee_id||e.id||e._id}>{e.first_name} {e.last_name}</option>)
                    }
                  </select>
                </div>
                {/* Status change */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_COLS.map(col=>(
                      <button key={col.key} onClick={()=>handleStatusChange(showDetail.id||showDetail._id, col.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border ${showDetail.status===col.key?"ring-2 ring-brand-300 bg-white":"bg-slate-50 hover:bg-white"} border-slate-200`}>
                        <span className={`w-2 h-2 rounded-full ${col.dot}`}/>{col.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Comments */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Comments</p>
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                    {(showDetail.comments||[]).map((c,i)=>(
                      <div key={i} className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                        <div className="flex justify-between mb-0.5"><span className="text-[10px] font-bold text-slate-700">{c.employee_name||"User"}</span><span className="text-[9px] text-slate-400">{c.created_at?new Date(c.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}</span></div>
                        <p className="text-xs text-slate-600">{c.text}</p>
                      </div>
                    ))}
                    {(showDetail.comments||[]).length===0 && <p className="text-[10px] text-slate-400 text-center py-2">No comments</p>}
                  </div>
                  <div className="flex gap-2 items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                    <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleComment(showDetail.id||showDetail._id)} placeholder="Add comment…" className="flex-1 bg-transparent text-xs outline-none"/>
                    <button onClick={()=>handleComment(showDetail.id||showDetail._id)} disabled={!comment.trim()} className="w-7 h-7 rounded-lg bg-brand-600 disabled:bg-slate-200 flex items-center justify-center"><ArrowRight className="w-3.5 h-3.5 text-white"/></button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
