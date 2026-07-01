"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleLeft, ToggleRight, Save, CheckCircle2 } from "lucide-react";

export default function PlatformSettingsPage() {
  const [platformName, setPlatformName] = useState("TFG HRMS");
  const [supportEmail, setSupportEmail] = useState("support@tfg.com");
  const [autoProvision, setAutoProvision] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>

      <form onSubmit={e => { e.preventDefault(); showToast("Platform settings saved."); }} className="divide-y divide-slate-100">
        <div className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Platform General Settings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-600 mb-1 block">White-label Title</label><input type="text" value={platformName} onChange={e=>setPlatformName(e.target.value)} className={inputCls}/></div>
            <div><label className="text-xs font-bold text-slate-600 mb-1 block">Global Support Mail</label><input type="email" value={supportEmail} onChange={e=>setSupportEmail(e.target.value)} className={inputCls}/></div>
            <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div><p className="text-xs font-bold text-slate-800">Auto-Provision Corporate Tenants</p><p className="text-[10px] text-slate-500 mt-0.5">Instantly spin up infrastructure containers upon payment authorization.</p></div>
              <button type="button" onClick={()=>setAutoProvision(v=>!v)}>
                {autoProvision ? <ToggleRight className="w-9 h-9 text-amber-600"/> : <ToggleLeft className="w-9 h-9 text-slate-400"/>}
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <motion.button type="submit" whileHover={{scale:1.01}} whileTap={{scale:0.99}}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20">
            <Save className="w-4 h-4"/> Save Settings
          </motion.button>
        </div>
      </form>
    </div>
  );
}
