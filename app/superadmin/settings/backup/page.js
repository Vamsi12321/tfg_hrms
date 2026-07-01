"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Play, CheckCircle2, Database } from "lucide-react";

export default function BackupSettingsPage() {
  const [frequency, setFrequency] = useState("daily");
  const [retention, setRetention] = useState("30");
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>
      <form onSubmit={e=>{e.preventDefault();showToast("Backup settings saved.");}} className="divide-y divide-slate-100">
        <div className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Backup & Recovery</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Backup Frequency</label>
              <select value={frequency} onChange={e=>setFrequency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400">
                <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Retention Period (days)</label>
              <input type="number" value={retention} onChange={e=>setRetention(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"/>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-1">Last Backup</p>
            <p className="text-[10px] text-slate-500">Today at 02:00 AM UTC — <span className="text-green-600 font-semibold">Successful</span></p>
            <p className="text-[10px] text-slate-400">Size: 847 MB • Location: S3 encrypted bucket</p>
          </div>
        </div>
        <div className="p-6 flex gap-3">
          <motion.button type="button" whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={()=>showToast("Full backup initiated. This may take a few minutes.")}
            className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-100">
            <Play className="w-4 h-4"/> Trigger Manual Backup
          </motion.button>
          <motion.button type="submit" whileHover={{scale:1.01}} whileTap={{scale:0.99}}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg">
            <Save className="w-4 h-4"/> Save Settings
          </motion.button>
        </div>
      </form>
    </div>
  );
}
