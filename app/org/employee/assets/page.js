"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Monitor, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import TopBar from "@/components/TopBar";
import { requestAssetReturn } from "@/lib/api";
import { useMyAssets, useInvalidate } from "@/lib/queries";

const catIcons = { laptop: Monitor, phone: Smartphone, monitor: Monitor };

export default function MyAssetsPage() {
  const invalidate = useInvalidate();
  const { data: assetData, isLoading } = useMyAssets();
  const assets = assetData?.assets || [];
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleRequestReturn = async (asset) => {
    setLoading(asset.id||asset._id);
    const res = await requestAssetReturn(asset.id||asset._id);
    if (res.ok) { showToast(res.data?.message||"Return requested"); invalidate("my-assets"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Assets" />

      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Assigned Assets</h2>
            <p className="text-xs text-slate-500">{assets.length} asset{assets.length!==1?"s":""} assigned to you</p>
          </div>
        </div>

        {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
        : assets.length===0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
            <p className="text-sm font-semibold text-slate-400">No assets assigned to you</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset,i)=>{
              const Icon = catIcons[asset.category] || Package;
              return (
                <motion.div key={asset.id||asset._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                  whileHover={{y:-4}} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600"/>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{asset.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono">{asset.asset_id}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 capitalize">{asset.category}</span>
                  </div>
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                    {asset.brand&&<div className="flex justify-between"><span className="text-[10px] text-slate-500">Brand/Model</span><span className="text-xs font-semibold text-slate-700">{asset.brand} {asset.model||""}</span></div>}
                    {asset.serial_number&&<div className="flex justify-between"><span className="text-[10px] text-slate-500">Serial</span><span className="text-xs font-mono text-slate-700">{asset.serial_number}</span></div>}
                    {asset.assigned_date&&<div className="flex justify-between"><span className="text-[10px] text-slate-500">Assigned</span><span className="text-xs font-semibold text-slate-700">{asset.assigned_date}</span></div>}
                    {asset.condition&&<div className="flex justify-between"><span className="text-[10px] text-slate-500">Condition</span><span className="text-xs font-bold text-green-600 capitalize">{asset.condition}</span></div>}
                  </div>
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                    onClick={()=>handleRequestReturn(asset)} disabled={loading===(asset.id||asset._id)}
                    className="w-full py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50">
                    <RotateCcw className="w-3.5 h-3.5"/>{loading===(asset.id||asset._id)?"Requesting...":"Request Return"}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
