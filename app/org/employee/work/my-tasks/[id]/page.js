"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, AlertCircle, MessageSquare, Paperclip,
  Trash2, Clock, Calendar, User, Tag, Activity, Upload, X
} from "lucide-react";
import {
  getWorkItemDetail, changeWorkItemStatus,
  addWorkItemComment, addWorkItemAttachment, uploadFile
} from "@/lib/api";
import { useInvalidate } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";

const STATUS_OPTS = [
  { key:"todo",        label:"To Do",       color:"bg-slate-100 text-slate-700 border-slate-200", dot:"bg-slate-400" },
  { key:"in_progress", label:"In Progress", color:"bg-blue-50 text-blue-700 border-blue-200", dot:"bg-blue-500" },
  { key:"review",      label:"In Review",   color:"bg-amber-50 text-amber-700 border-amber-200", dot:"bg-amber-500" },
  { key:"blocked",     label:"Blocked",     color:"bg-red-50 text-red-700 border-red-200", dot:"bg-red-500" },
  { key:"done",        label:"Done",        color:"bg-green-50 text-green-700 border-green-200", dot:"bg-green-500" },
  { key:"closed",      label:"Closed",      color:"bg-slate-50 text-slate-600 border-slate-300", dot:"bg-slate-600" },
  { key:"reopened",    label:"Reopened",    color:"bg-purple-50 text-purple-700 border-purple-200", dot:"bg-purple-500" },
];

const priorityCfg = {
  low:    { cls:"bg-slate-50 text-slate-600 border-slate-200",  label:"Low"    },
  medium: { cls:"bg-blue-50 text-blue-700 border-blue-200",     label:"Medium" },
  high:   { cls:"bg-orange-50 text-orange-700 border-orange-200",label:"High"  },
  urgent: { cls:"bg-red-50 text-red-700 border-red-200",        label:"Urgent" },
};

export default function EmployeeTaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invalidate = useInvalidate();
  const { user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [comment, setComment] = useState("");
  const [commentFile, setCommentFile] = useState(null);

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
      showToast("Failed to load task details", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) loadData();
  }, [params.id]);

  const handleStatusChange = async (newStatus) => {
    const res = await changeWorkItemStatus(item.id || item._id, newStatus);
    if (res.ok) {
      showToast("Status updated");
      loadData();
      invalidate("work-items");
    } else {
      showToast("Status change failed", "error");
    }
  };

  const handleComment = async () => {
    if (!comment.trim() && !commentFile) return;
    let attachment = null;
    if (commentFile) {
      const uploadRes = await uploadFile(commentFile, "document");
      if (uploadRes.ok && uploadRes.data?.url) {
        attachment = { file_name: commentFile.name, file_url: uploadRes.data.url };
      } else { 
        showToast("File upload failed", "error"); 
        return; 
      }
    }
    const res = await addWorkItemComment(item.id || item._id, comment || "(attached file)", attachment);
    if (res.ok) {
      setComment("");
      setCommentFile(null);
      loadData();
    } else {
      showToast("Failed to add comment", "error");
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
        <h2 className="text-lg font-bold text-slate-800">Task not found</h2>
        <button onClick={() => router.push("/org/employee/work/my-tasks")} className="mt-4 text-brand-600 hover:underline">
          Return to My Tasks
        </button>
      </div>
    );
  }

  const pCfg = priorityCfg[item.priority] || priorityCfg.medium;
  const currentStatus = STATUS_OPTS.find(s => s.key === item.status) || STATUS_OPTS[0];

  // Permissions for status
  const isTeamLead = user?.is_team_lead;
  const isAdmin = user?.role === "hr" || user?.role === "orgadmin" || user?.role === "superadmin";
  const isRaiser = item.created_by === user?.id || item.created_by === user?.employee_id;
  
  let allowedStatuses;
  if (isTeamLead || isAdmin) {
    allowedStatuses = STATUS_OPTS.map(c=>c.key);
  } else if (isRaiser && (item.status === "done" || item.status === "closed")) {
    allowedStatuses = ["reopened"];
  } else {
    allowedStatuses = ["todo", "in_progress", "blocked", "review", "done"];
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2.5 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/org/employee/work/my-tasks")} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Tasks
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column - Details & Discussion */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header Card */}
          <div className="bg-white rounded-[1.5rem] p-6 sm:p-7 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pCfg.cls}`}>
                {pCfg.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentStatus.color} flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600 capitalize">
                {item.type || "Task"}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-1.5">
              {item.title}
            </h1>
            {item.project_name && (
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> {item.project_name}
              </p>
            )}
            
            {/* Description */}
            <div className="mt-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Description</h3>
              {item.description ? (
                <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap text-[13px]">
                  {item.description}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No description provided.</p>
              )}
            </div>

            {/* Bug Specific Details */}
            {item.type === "bug" && (
              <div className="mt-6 space-y-5 p-5 rounded-xl bg-rose-50/50 border border-rose-100">
                <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Bug Information
                </h3>
                {item.steps_to_reproduce && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 mb-1.5">Steps to Reproduce</p>
                    <div className="text-[13px] font-mono text-slate-600 bg-white p-3 rounded-lg border border-rose-100 whitespace-pre-wrap">
                      {item.steps_to_reproduce}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.expected_result && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5">Expected Result</p>
                      <div className="text-[13px] text-slate-600 bg-white p-3 rounded-lg border border-rose-100 whitespace-pre-wrap">
                        {item.expected_result}
                      </div>
                    </div>
                  )}
                  {item.actual_result && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5">Actual Result</p>
                      <div className="text-[13px] text-slate-600 bg-white p-3 rounded-lg border border-rose-100 whitespace-pre-wrap">
                        {item.actual_result}
                      </div>
                    </div>
                  )}
                </div>
                {item.environment && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 mb-1.5">Environment</p>
                    <p className="text-[13px] font-medium text-slate-600 bg-white px-3 py-2 rounded-lg border border-rose-100">
                      {item.environment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-[1.5rem] p-6 sm:p-7 border border-slate-200/60 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" /> Discussion
            </h3>
            
            <div className="space-y-5 mb-6">
              {(item.comments || []).length > 0 ? item.comments.map((c, i) => (
                <div key={c.id || i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                    {(c.employee_name || "U")[0]}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold text-slate-800">{c.employee_name || "You"}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                    {c.attachment && (
                      <a href={c.attachment.file_url} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-300 transition-colors w-fit">
                        <Paperclip className="w-3.5 h-3.5 text-brand-500"/>
                        <span className="text-xs font-semibold text-brand-600 truncate max-w-[200px]">{c.attachment.file_name}</span>
                      </a>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-[11px] font-semibold text-slate-500">No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Add Comment Input */}
            <div className="space-y-3">
              {commentFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 w-fit">
                  <Paperclip className="w-3.5 h-3.5 text-brand-500 flex-shrink-0"/>
                  <span className="text-xs font-semibold text-brand-700 truncate max-w-[200px]">{commentFile.name}</span>
                  <button onClick={() => setCommentFile(null)} className="text-brand-400 hover:text-red-500 ml-2"><X className="w-3.5 h-3.5"/></button>
                </div>
              )}
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea 
                    rows={2}
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                    placeholder="Write an update... (Enter to submit)" 
                    className="w-full bg-slate-50 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none p-3 rounded-xl border border-slate-200 focus:border-brand-400 focus:bg-white transition-all resize-none shadow-sm"
                  />
                  <div className="absolute right-2 bottom-2">
                    <label className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-sm" title="Attach file">
                      <Paperclip className="w-4 h-4 text-slate-500"/>
                      <input type="file" className="hidden" onChange={e => {const f=e.target.files?.[0]; if(f)setCommentFile(f); e.target.value="";}}/>
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleComment} 
                  disabled={!comment.trim() && !commentFile} 
                  className="px-5 py-2.5 h-[52px] rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 text-white font-bold text-[13px] transition-colors shadow-sm flex items-center justify-center"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Meta & Actions */}
        <div className="space-y-5">
          {/* Status Updater Card */}
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Update Status
            </h3>
            <div className="flex flex-col gap-2">
              {STATUS_OPTS.filter(col => allowedStatuses.includes(col.key)).map(col => {
                const isActive = item.status === col.key;
                return (
                  <button 
                    key={col.key} 
                    onClick={() => handleStatusChange(col.key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold border transition-all ${isActive ? `ring-2 ring-brand-300 ${col.color} bg-white shadow-sm` : `bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100`}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${col.dot} ${isActive ? 'scale-110' : ''}`} />
                    {col.label}
                    {isActive && <CheckCircle2 className="w-4 h-4 ml-auto text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Properties Card */}
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Properties</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-700">
                    {item.due_date ? new Date(item.due_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "None"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimate</p>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-700">
                    {item.estimated_hours ? `${item.estimated_hours} hrs` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tags</p>
              {item.tags && item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No tags</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Created By</p>
               <p className="text-[11px] font-semibold text-slate-600">{item.created_by_name || "—"}</p>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Attachments
              </h3>
              
              <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 cursor-pointer transition-colors">
                <Upload className="w-3 h-3 text-brand-600"/>
                <span className="text-[10px] font-bold text-brand-600">Upload</span>
                <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  showToast("Uploading...");
                  const uploadRes = await uploadFile(file, "document");
                  if (uploadRes.ok && uploadRes.data?.url) {
                    const attachRes = await addWorkItemAttachment(item.id || item._id, { file_name: file.name, file_url: uploadRes.data.url });
                    if (attachRes.ok) { 
                      showToast("File attached"); 
                      loadData(); 
                    } else showToast("Failed to attach", "error");
                  } else showToast("Upload failed", "error");
                  e.target.value = "";
                }}/>
              </label>
            </div>
            
            <div className="space-y-2">
              {(item.attachments || []).length > 0 ? item.attachments.map((a, i) => (
                <a key={a.id || i} href={a.file_url} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-brand-50 hover:border-brand-200 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-brand-300">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-brand-700">{a.file_name}</p>
                    <p className="text-[9px] text-slate-400">{a.uploaded_by_name}</p>
                  </div>
                </a>
              )) : (
                <p className="text-[11px] text-slate-400 italic">No attachments yet</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
