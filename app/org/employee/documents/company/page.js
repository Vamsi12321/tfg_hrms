"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { acknowledgeDocument } from "@/lib/api";
import { useCompanyDocuments, useInvalidate } from "@/lib/queries";

export default function EmpCompanyDocsPage() {
  const invalidate = useInvalidate();
  const { data: companyDocs = [], isLoading } = useCompanyDocuments();
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleAcknowledge = async (docId) => {
    const res = await acknowledgeDocument(docId);
    if (res.ok) { showToast("Document acknowledged ✓"); invalidate("company-documents"); }
    else {
      const msg = typeof res.data?.detail==="string"?res.data.detail:res.data?.message||"Failed";
      if (msg.toLowerCase().includes("already")) showToast("Already acknowledged","error");
      else showToast(msg,"error");
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : companyDocs.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No company documents shared yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companyDocs.map((doc,i)=>(
            <motion.div key={doc.id||doc._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-500"/></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">{doc.category||"other"}</span>
                  {doc.is_mandatory&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Mandatory</span>}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{doc.title}</h4>
              {doc.description&&<p className="text-xs text-slate-500 mb-3">{doc.description}</p>}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-50 flex-wrap">
                {doc.file_url&&<a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3"/> Download</a>}
                {doc.is_mandatory&&!doc.acknowledged&&(
                  <button onClick={()=>handleAcknowledge(doc.id||doc._id)}
                    className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">
                    Acknowledge
                  </button>
                )}
                {doc.acknowledged&&<span className="ml-auto text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Acknowledged</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
