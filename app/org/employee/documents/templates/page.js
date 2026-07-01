"use client";

import { motion } from "framer-motion";
import { File, Download } from "lucide-react";
import { useTemplates } from "@/lib/queries";

export default function EmpTemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();

  if (isLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  if (templates.length===0) return (
    <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
      <File className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
      <p className="text-sm font-semibold text-slate-400">No templates available</p>
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((tpl,i)=>(
        <motion.div key={tpl.id||tpl._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><File className="w-5 h-5 text-amber-500"/></div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">{tpl.title}</h4>
          {tpl.description&&<p className="text-xs text-slate-500 mb-3">{tpl.description}</p>}
          {tpl.file_url&&(
            <a href={tpl.file_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1 pt-3 border-t border-slate-50">
              <Download className="w-3 h-3"/> Download
            </a>
          )}
        </motion.div>
      ))}
    </div>
  );
}
