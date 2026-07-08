"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, AlertCircle, MessageSquare, Paperclip,
  Trash2, Clock, Calendar, User, Tag, Activity, Edit
} from "lucide-react";
import {
  getWorkItemDetail, changeWorkItemStatusExtended,
  addWorkItemComment, deleteWorkItem
} from "@/lib/api";
import { useInvalidate } from "@/lib/queries";

const STATUS_OPTS = [
  { key:"todo",        label:"To Do",       color:"bg-slate-100 text-slate-700 border-slate-200", dot:"bg-slate-400" },
  { key:"in_progress", label:"In Progress", color:"bg-blue-50 text-blue-700 border-blue-200", dot:"bg-blue-500" },
  { key:"review",      label:"In Review",   color:"bg-amber-50 text-amber-700 border-amber-200", dot:"bg-amber-500" },
  { key:"blocked",     label:"Blocked",     color:"bg-red-50 text-red-700 border-red-200", dot:"bg-red-500" },
  { key:"done",        label:"Done",        color:"bg-green-50 text-green-700 border-green-200", dot:"bg-green-500" },
  { key:"closed",      label:"Closed",      color:"bg-slate-50 text-slate-600 border-slate-300", dot:"bg-slate-600" },
];

const priorityCfg = {
  low:    { cls:"bg-slate-50 text-slate-600 border-slate-200",  label:"Low"    },
  medium: { cls:"bg-blue-50 text-blue-700 border-blue-200",     label:"Medium" },
  high:   { cls:"bg-orange-50 text-orange-700 border-orange-200",label:"High"  },
  urgent: { cls:"bg-red-50 text-red-700 border-red-200",        label:"Urgent" },
};

export default function WorkItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invalidate = useInvalidate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [comment, setComment] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getWorkItemDetail(params.id);
    if (res.ok && res.data) {
      setItem(res.data);
    } else {
      showToast("Failed to load work item", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) loadData();
  }, [params.id]);

  const handleStatusChange = async (newStatus) => {
    const res = await changeWorkItemStatusExtended(item.id || item._id, newStatus);
    if (res.ok) {
      showToast("Status updated");
      loadData();
      invalidate("work-items");
    } else {
      showToast("Status change failed", "error");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const res = await addWorkItemComment(item.id || item._id, comment);
    if (res.ok) {
      setComment("");
      loadData();
    } else {
      showToast("Failed to add comment", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this work item?")) return;
    const res = await deleteWorkItem(item.id || item._id);
    if (res.ok) {
      invalidate("work-items");
      router.push("/org/hr/work/work-items");
    } else {
      showToast("Failed to delete", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">Work item not found</h2>
        <button onClick={() => router.push("/org/hr/work/work-items")} className="mt-4 text-brand-600 hover:underline">
          Return to Board
        </button>
      </div>
    );
  }

  const pCfg = priorityCfg[item.priority] || priorityCfg.medium;
  const currentStatus = STATUS_OPTS.find(s => s.key === item.status) || STATUS_OPTS[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/org/hr/work/work-items")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Board
        </button>
        <div className="flex gap-2">
           <button onClick={handleDelete} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 text-xs font-bold transition-colors">
             <Trash2 className="w-3.5 h-3.5" /> Delete Item
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details & Discussion */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pCfg.cls}`}>
                {pCfg.label} Priority
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStatus.color} flex items-center gap-1.5`}>
                <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 capitalize">
                {item.type || "Task"}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
              {item.title}
            </h1>
            {item.project_name && (
              <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> {item.project_name}
              </p>
            )}
            
            {/* Description */}
            <div className="mt-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Description</h3>
              {item.description ? (
                <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                  {item.description}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No description provided.</p>
              )}
            </div>

            {/* Bug Specific Details */}
            {item.type === "bug" && (
              <div className="mt-8 space-y-6 p-6 rounded-2xl bg-rose-50/50 border border-rose-100">
                <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Bug Information
                </h3>
                {item.steps_to_reproduce && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Steps to Reproduce</p>
                    <div className="text-sm font-mono text-slate-600 bg-white p-4 rounded-xl border border-rose-100 whitespace-pre-wrap">
                      {item.steps_to_reproduce}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {item.expected_result && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 mb-2">Expected Result</p>
                      <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-rose-100 whitespace-pre-wrap">
                        {item.expected_result}
                      </div>
                    </div>
                  )}
                  {item.actual_result && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 mb-2">Actual Result</p>
                      <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-rose-100 whitespace-pre-wrap">
                        {item.actual_result}
                      </div>
                    </div>
                  )}
                </div>
                {item.environment && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Environment</p>
                    <p className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-xl border border-rose-100">
                      {item.environment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" /> Discussion
            </h3>
            
            <div className="space-y-6 mb-8">
              {(item.comments || []).length > 0 ? item.comments.map((c, i) => (
                <div key={c.id || i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                    {(c.employee_name || "U")[0]}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-800">{c.employee_name || "User"}</span>
                      <span className="text-xs font-semibold text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Add Comment Input */}
            <div className="flex gap-4 items-start">
              <div className="flex-1 relative">
                <textarea 
                  rows={3}
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  placeholder="Write a comment... (Press Enter to submit)" 
                  className="w-full bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none p-4 rounded-2xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all resize-none shadow-sm"
                />
              </div>
              <button 
                onClick={handleComment} 
                disabled={!comment.trim()} 
                className="px-6 py-3 h-[54px] rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 text-white font-bold text-sm transition-colors shadow-lg shadow-brand-500/25 flex items-center justify-center"
              >
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Meta & Actions */}
        <div className="space-y-6">
          {/* Status Updater Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Change Status
            </h3>
            <div className="flex flex-col gap-2">
              {STATUS_OPTS.map(col => {
                const isActive = item.status === col.key;
                return (
                  <button 
                    key={col.key} 
                    onClick={() => handleStatusChange(col.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${isActive ? `ring-2 ring-brand-300 ${col.color} bg-white shadow-sm` : `bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100`}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot} ${isActive ? 'scale-110' : ''}`} />
                    {col.label}
                    {isActive && <CheckCircle2 className="w-4 h-4 ml-auto text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Properties Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Properties</h3>
            
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assignee</p>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {item.assigned_to_name ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                      {item.assigned_to_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.assigned_to_name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium italic">Unassigned</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    {item.due_date ? new Date(item.due_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "None"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimate</p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    {item.estimated_hours ? `${item.estimated_hours} hrs` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tags</p>
              {item.tags && item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No tags</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created By</p>
               <p className="text-xs font-semibold text-slate-600">{item.created_by_name || "—"}</p>
            </div>
          </div>

          {/* Attachments Card */}
          {(item.attachments || []).length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> Attachments
              </h3>
              <div className="space-y-2">
                {item.attachments.map((a, i) => (
                  <a key={a.id || i} href={a.file_url} target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-brand-50 hover:border-brand-200 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-brand-300">
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-brand-700">{a.file_name}</p>
                      <p className="text-[10px] text-slate-400">{a.uploaded_by_name}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
