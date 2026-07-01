"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";

export default function SecuritySettingsPage() {
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>
      <form onSubmit={e=>{e.preventDefault();showToast("Security policies saved.");}} className="divide-y divide-slate-100">
        <div className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Security Policies</h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div><p className="text-xs font-bold text-slate-800">Enforce MFA for All Admins</p><p className="text-[10px] text-slate-500 mt-0.5">Require two-factor authentication for all org admin and HR accounts.</p></div>
            <button type="button" onClick={()=>setMfaEnforced(v=>!v)}>{mfaEnforced?<ToggleRight className="w-9 h-9 text-amber-600"/>:<ToggleLeft className="w-9 h-9 text-slate-400"/>}</button>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Session Timeout (minutes)</label>
            <input type="number" value={sessionTimeout} onChange={e=>setSessionTimeout(e.target.value)} className="w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"/>
            <p className="text-[10px] text-slate-400 mt-1">Idle users are automatically signed out after this period.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Password Policy</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {[["Minimum Length","8"],["Max Login Attempts","5"],["Lockout Duration (min)","15"],["Password Expiry (days)","90"]].map(([l,d])=>(
                <div key={l}><label className="text-[10px] text-slate-500 mb-1 block">{l}</label><input type="number" defaultValue={d} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"/></div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <motion.button type="submit" whileHover={{scale:1.01}} whileTap={{scale:0.99}}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg">
            <Save className="w-4 h-4"/> Save Policies
          </motion.button>
        </div>
      </form>
    </div>
  );
}
