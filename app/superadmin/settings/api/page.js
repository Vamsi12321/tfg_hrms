"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, RefreshCw, Eye, EyeOff, CheckCircle2, Key } from "lucide-react";

export default function ApiSettingsPage() {
  const [apiKey, setApiKey] = useState("tfg_live_9481a7b8e210c4f8d");
  const [showKey, setShowKey] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const handleGenerate = () => {
    const hex = Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join("");
    setApiKey(`tfg_live_${hex}`);
    showToast("New API key generated.");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>
      <div className="p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-900">API & Webhooks</h3>

        {/* API Key */}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-2 block">Platform API Secret Key</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700">
              <Key className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/>
              <span className="flex-1 truncate">{showKey ? apiKey : apiKey.slice(0,12)+"••••••••••••"}</span>
              <button type="button" onClick={()=>setShowKey(v=>!v)} className="text-slate-400 hover:text-slate-600">
                {showKey ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
              </button>
            </div>
            <motion.button type="button" whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleGenerate}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 rounded-xl text-xs font-semibold hover:bg-amber-100">
              <RefreshCw className="w-3.5 h-3.5"/> Regenerate
            </motion.button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Keep this key secret. It grants full API access to the platform.</p>
        </div>

        {/* Webhook */}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-2 block">Webhook Endpoint URL</label>
          <input type="url" placeholder="https://your-app.com/webhooks/hrms" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"/>
          <p className="text-[10px] text-slate-400 mt-1.5">POST requests will be sent to this URL on system events (payroll processed, employee added, etc.)</p>
        </div>

        <motion.button type="button" whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={()=>showToast("API settings saved.")}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg">
          <Save className="w-4 h-4"/> Save Settings
        </motion.button>
      </div>
    </div>
  );
}
