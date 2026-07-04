"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo, X, Calendar, MessageSquare, Paperclip, Upload,
  ArrowRight, CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { changeWorkItemStatus, addWorkItemComment, getWorkItemDetail, addWorkItemAttachment, uploadFile } from "@/lib/api";
import { useWorkItems, useProjects, useInvalidate } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";

const STATUS_COLS = [
  { key:"todo",        label:"To Do",       dot:"bg-slate-400",  bg:"bg-slate-50"   },
  { key:"in_progress", label:"In Progress", dot:"bg-blue-500",   bg:"bg-blue-50"    },
  { key:"review",      label:"In Review",   dot:"bg-amber-500",  bg:"bg-amber-50"   },
  { key:"blocked",     label:"Blocked",     dot:"bg-red-500",    bg:"bg-red-50"     },
  { key:"done",        label:"Done",        dot:"bg-green-500",  bg:"bg-green-50"   },
  { key:"closed",      label:"Closed",      dot:"bg-slate-600",  bg:"bg-slate-50"   },
  { key:"reopened",    label:"Reopened",     dot:"bg-purple-500", bg:"bg-purple-50"  },
];

const priorityCfg = {
  low:    { cls:"bg-slate-50 text-slate-500 border-slate-200",    label:"Low"    },
  medium: { cls:"bg-blue-50 text-blue-600 border-blue-200",       label:"Medium" },
  high:   { cls:"bg-orange-50 text-orange-600 border-orange-200", label:"High"   },
  urgent: { cls:"bg-red-50 text-red-600 border-red-200",          label:"Urgent" },
};

export default function MyTasksPage() {
  const invalidate = useInvalidate();
  const { user } = useAuth();
  const { data: itemsData, isLoading } = useWorkItems({});
  const items = itemsData?.work_items || [];
  const { data: projData } = useProjects();
  const projects = projData?.projects || [];

  const [projectFilter, setProjectFilter] = useState("");
  const [showDetail, setShowDetail] = useState(null);
  const [comment, setComment] = useState("");
  const [commentFile, setCommentFile] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const filtered = projectFilter ? items.filter(i=>i.project_id===projectFilter) : items;

  // Group by status
  const grouped = {};
  STATUS_COLS.forEach(c=>{ grouped[c.key] = filtered.filter(it=>it.status===c.key); });

  const handleStatusChange = async (itemId, newStatus) => {
    const res = await changeWorkItemStatus(itemId, newStatus);
    if (res.ok) { invalidate("work-items"); if (showDetail?.id===itemId) loadDetail(itemId); }
    else showToast("Status change failed","error");
  };

  const handleComment = async (itemId) => {
    if (!comment.trim() && !commentFile) return;
    let attachment = null;
    if (commentFile) {
      const uploadRes = await uploadFile(commentFile, "document");
      if (uploadRes.ok && uploadRes.data?.url) {
        attachment = { file_name: commentFile.name, file_url: uploadRes.data.url };
      } else { showToast("File upload failed","error"); return; }
    }
    const res = await addWorkItemComment(itemId, comment || "(attached file)", attachment);
    if (res.ok) { setComment(""); setCommentFile(null); loadDetail(itemId); }
    else showToast("Failed to add comment","error");
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

      {/* Filter + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
          <option value="">All Projects</option>
          {projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_COLS.filter(c=>(grouped[c.key]?.length||0)>0).map(c=>(
            <span key={c.key} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.bg} border-slate-200`}>
              <span className={`inline-block w-2 h-2 rounded-full ${c.dot} mr-1.5 align-middle`}/>
              {c.label} <span className="text-slate-800 ml-0.5">{grouped[c.key]?.length||0}</span>
            </span>
          ))}
          <span className="text-xs font-bold text-slate-700 ml-1">{filtered.length} total</span>
        </div>
      </div>

      {/* Kanban */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : filtered.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <ListTodo className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No tasks assigned to you</p>
          <p className="text-xs text-slate-400 mt-1">Tasks assigned by your team lead will appear here.</p>
        </div>
      ) : (
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
                      <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        {item.project_name && <span className="font-semibold text-brand-500">{item.project_name}</span>}
                        {item.due_date && <span className="flex items-center gap-0.5 ml-auto"><Calendar className="w-2.5 h-2.5"/>{new Date(item.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}} transition={{type:"spring",damping:28,stiffness:320}} onClick={e=>e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${(priorityCfg[showDetail.priority]||priorityCfg.medium).cls}`}>{(priorityCfg[showDetail.priority]||priorityCfg.medium).label}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{(showDetail.status||"todo").replace("_"," ")}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{showDetail.title}</h3>
                  {showDetail.project_name && <p className="text-[10px] text-slate-500 mt-0.5">{showDetail.project_name}</p>}
                </div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center flex-shrink-0 ml-3"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {showDetail.description && <div className="p-4 rounded-xl bg-slate-50 border border-slate-100"><p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{showDetail.description}</p></div>}
                <div className="grid grid-cols-2 gap-3">
                  {showDetail.due_date && <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Due Date</p><p className="text-xs font-semibold text-slate-800">{new Date(showDetail.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p></div>}
                  {showDetail.estimated_hours && <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Estimated</p><p className="text-xs font-semibold text-slate-800">{showDetail.estimated_hours}h</p></div>}
                </div>
                {/* Status change */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(()=>{
                      // Determine which statuses to show based on user role
                      const isTeamLead = user?.is_team_lead;
                      const isAdmin = user?.role === "hr" || user?.role === "orgadmin" || user?.role === "superadmin";
                      const isRaiser = showDetail.created_by === user?.id || showDetail.created_by === user?.employee_id;
                      const currentStatus = showDetail.status;

                      let allowedStatuses;
                      if (isTeamLead || isAdmin) {
                        // Team lead / admin can set any status
                        allowedStatuses = STATUS_COLS.map(c=>c.key);
                      } else if (isRaiser && (currentStatus === "done" || currentStatus === "closed")) {
                        // Raiser can only reopen done/closed items
                        allowedStatuses = ["reopened"];
                      } else {
                        // Regular assignee — can do in_progress, blocked, review, done
                        allowedStatuses = ["todo", "in_progress", "blocked", "review", "done"];
                      }

                      return STATUS_COLS.filter(col=>allowedStatuses.includes(col.key)).map(col=>(
                        <button key={col.key} onClick={()=>handleStatusChange(showDetail.id||showDetail._id, col.key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border transition-all ${showDetail.status===col.key?"ring-2 ring-brand-300 bg-white border-brand-200":"bg-slate-50 border-slate-200 hover:bg-white"}`}>
                          <span className={`w-2 h-2 rounded-full ${col.dot}`}/>{col.label}
                        </button>
                      ));
                    })()}
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
                          <div className="flex items-center justify-between mb-0.5"><span className="text-[10px] font-bold text-slate-700">{c.employee_name||"You"}</span><span className="text-[9px] text-slate-400">{c.created_at?`${new Date(c.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} ${new Date(c.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`:"—"}</span></div>
                          <p className="text-xs text-slate-600">{c.text}</p>
                          {c.attachment && (
                            <a href={c.attachment.file_url} target="_blank" rel="noopener noreferrer"
                              className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-300 transition-colors w-fit">
                              <Paperclip className="w-3 h-3 text-brand-500"/>
                              <span className="text-[10px] font-semibold text-brand-600 truncate max-w-[150px]">{c.attachment.file_name}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )) : <p className="text-[10px] text-slate-400 text-center py-3">No comments yet</p>}
                  </div>
                  {/* Comment input with optional file attach */}
                  <div className="space-y-2">
                    {commentFile && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200">
                        <Paperclip className="w-3 h-3 text-brand-500 flex-shrink-0"/>
                        <span className="text-[10px] font-semibold text-brand-700 truncate flex-1">{commentFile.name}</span>
                        <button onClick={()=>setCommentFile(null)} className="text-brand-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </div>
                    )}
                    <div className="flex gap-2 items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-brand-400 transition-all">
                      <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&handleComment(showDetail.id||showDetail._id)} placeholder="Add a comment…" className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"/>
                      <label className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors" title="Attach file">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500"/>
                        <input type="file" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setCommentFile(f);e.target.value="";}}/>
                      </label>
                      <button onClick={()=>handleComment(showDetail.id||showDetail._id)} disabled={!comment.trim()&&!commentFile} className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 flex items-center justify-center transition-colors"><ArrowRight className="w-3.5 h-3.5 text-white"/></button>
                    </div>
                  </div>
                </div>
                {/* Attachments */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5 text-slate-400"/> Attachments</p>
                  {(showDetail.attachments||[]).length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {showDetail.attachments.map((a,i)=>(
                        <a key={a.id||i} href={a.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-brand-50 transition-colors">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-brand-600 font-semibold truncate block">{a.file_name}</span>
                            <span className="text-[9px] text-slate-400">{a.uploaded_by_name}{a.uploaded_at ? ` · ${new Date(a.uploaded_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} ${new Date(a.uploaded_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}` : ""}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  {(showDetail.attachments||[]).length === 0 && <p className="text-[10px] text-slate-400 mb-3">No attachments yet</p>}
                  {/* Upload button */}
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-slate-400"/>
                    <span className="text-xs font-semibold text-slate-600">Attach a file</span>
                    <input type="file" className="hidden" onChange={async (e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      showToast("Uploading...");
                      const uploadRes = await uploadFile(file, "document");
                      if (uploadRes.ok && uploadRes.data?.url) {
                        const attachRes = await addWorkItemAttachment(showDetail.id||showDetail._id, { file_name: file.name, file_url: uploadRes.data.url });
                        if (attachRes.ok) { showToast("File attached"); loadDetail(showDetail.id||showDetail._id); }
                        else showToast("Failed to attach","error");
                      } else showToast("Upload failed","error");
                      e.target.value = "";
                    }}/>
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
