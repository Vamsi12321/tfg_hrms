"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
                      onClick={()=>router.push(`/org/employee/work/my-tasks/${item.id||item._id}`)}
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

    </div>
  );
}
