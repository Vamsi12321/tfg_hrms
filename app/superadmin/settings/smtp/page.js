"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Play, CheckCircle2 } from "lucide-react";

export default function SmtpSettingsPage() {
  const [smtpHost, setSmtpHost] = useState("smtp.tfg-platform.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>
      <form onSubmit={e=>{e.preventDefault();showToast("SMTP settings saved.");}} className="divide-y divide-slate-100">
        <div className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Email & SMTP Configuration</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-600 mb-1 block">SMTP Host</label><input value={smtpHost} onChange={e=>setSmtpHost(e.target.value)} className={inputCls}/></div>
            <div><label className="text-xs font-bold text-slate-600 mb-1 block">SMTP Port</label><input value={smtpPort} onChange={e=>setSmtpPort(e.target.value)} className={inputCls}/></div>
            <div><label className="text-xs font-bold text-slate-600 mb-1 block">Username</label><input value={smtpUser} onChange={e=>setSmtpUser(e.target.value)} placeholder="noreply@tfg.com" className={inputCls}/></div>
            <div><label className="text-xs font-bold text-slate-600 mb-1 block">Password</label><input type="password" placeholder="••••••••" className={inputCls}/></div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">Encryption: TLS/STARTTLS on port 587 recommended.</div>
        </div>
        <div className="p-6 flex gap-3">
          <motion.button type="button" whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={()=>showToast("SMTP test handshake successful.")}
            className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-100">
            <Play className="w-4 h-4"/> Test Connection
          </motion.button>
          <motion.button type="submit" whileHover={{scale:1.01}} whileTap={{scale:0.99}}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg">
            <Save className="w-4 h-4"/> Save
          </motion.button>
        </div>
      </form>
    </div>
  );
}
