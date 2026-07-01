"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CloudUpload, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";
import { uploadRequestedDocument } from "@/lib/api";
import { useDocumentRequests, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Action Required", icon:AlertCircle  },
  uploaded: { cls:"bg-blue-50 text-blue-600 border-blue-200",    label:"Under Review",    icon:Clock        },
  approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved ✓",      icon:CheckCircle2 },
  rejected: { cls:"bg-red-50 text-red-500 border-red-200",       label:"Rejected",        icon:AlertCircle  },
};

export default function EmpDocRequestsPage() {
  const invalidate = useInvalidate();
  const { data: requests = [], isLoading } = useDocumentRequests();
  const [uploadingReqId, setUploadingReqId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const reqFileRef = useRef(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleUpload = async (reqId) => {
    const file = reqFileRef.current?.files?.[0];
    if (!file) return;
    setFormLoading(true);
    const res = await uploadRequestedDocument(reqId, file);
    if (res.ok) { showToast("Document submitted for review"); setUploadingReqId(null); invalidate("document-requests"); }
    else showToast("Upload failed","error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : requests.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No pending requests from HR</p>
        </div>
      ) : requests.map((req,i)=>{
        const sc=statusCfg[req.status]||statusCfg.pending;
        const StatusIcon=sc.icon;
        return (
          <motion.div key={req.id||req._id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${req.status==="pending"||req.status==="rejected"?"bg-amber-100":"bg-blue-100"}`}>
                  <StatusIcon className={`w-5 h-5 ${req.status==="pending"||req.status==="rejected"?"text-amber-600":"text-blue-600"}`}/>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-slate-900">{req.title}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                  </div>
                  {req.description&&<p className="text-xs text-slate-500">{req.description}</p>}
                  {req.due_date&&<p className="text-[10px] text-slate-400 mt-1">Due: {req.due_date}</p>}
                  {req.rejection_reason&&<p className="text-[10px] text-red-500 mt-1">Reason: {req.rejection_reason}</p>}
                </div>
              </div>
              <div className="flex-shrink-0">
                {(req.status==="pending"||req.status==="rejected")&&(
                  uploadingReqId===(req.id||req._id) ? (
                    <div className="flex items-center gap-2">
                      <input ref={reqFileRef} type="file" className="text-xs w-40"/>
                      <button onClick={()=>handleUpload(req.id||req._id)} disabled={formLoading}
                        className="text-[10px] font-bold text-white bg-brand-600 px-3 py-1.5 rounded-lg disabled:opacity-60">{formLoading?"...":"Submit"}</button>
                      <button onClick={()=>setUploadingReqId(null)} className="text-[10px] text-slate-400">Cancel</button>
                    </div>
                  ) : (
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setUploadingReqId(req.id||req._id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md">
                      <CloudUpload className="w-3.5 h-3.5"/> Upload
                    </motion.button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
