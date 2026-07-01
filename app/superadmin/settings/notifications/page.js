"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";

const channels = [
  { key:"email",   label:"Email Notifications",    desc:"Send email alerts for leave approvals, payroll, and system events" },
  { key:"inapp",   label:"In-App Notifications",   desc:"Bell icon notifications inside the HRMS dashboard"                 },
  { key:"sms",     label:"SMS Alerts",             desc:"Critical system alerts via SMS (requires SMS provider config)"     },
  { key:"webhook", label:"Webhook Push",           desc:"Push event payloads to external URLs on system events"             },
];

export default function NotificationsSettingsPage() {
  const [enabled, setEnabled] = useState({ email:true, inapp:true, sms:false, webhook:false });
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>
      <div className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-5">Notification Channels</h3>
        <div className="space-y-3">
          {channels.map(ch=>(
            <div key={ch.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">{ch.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{ch.desc}</p>
              </div>
              <button type="button" onClick={()=>setEnabled(e=>({...e,[ch.key]:!e[ch.key]}))}>
                {enabled[ch.key]?<ToggleRight className="w-9 h-9 text-amber-600"/>:<ToggleLeft className="w-9 h-9 text-slate-400"/>}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={()=>showToast("Notification channels saved.")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg">
            <Save className="w-4 h-4"/> Save Channels
          </motion.button>
        </div>
      </div>
    </div>
  );
}
