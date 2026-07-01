"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updatePayrollConfig } from "@/lib/api";
import { usePayrollConfig, useInvalidate } from "@/lib/queries";

export default function PayrollConfigPage() {
  const { data: config, isLoading } = usePayrollConfig();
  const invalidate = useInvalidate();
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    salary_structure: { basic_percentage:40, hra_percentage:25, special_allowance_percentage:25, other_percentage:10 },
    pf: { enabled:true, employee_percentage:12, employer_percentage:12, pf_applicable_on:"full_basic", pf_wage_ceiling:15000, employer_pf_included_in_ctc:true },
    esi: { enabled:true, employee_percentage:0.75, employer_percentage:3.25, salary_limit:21000, employer_esi_included_in_ctc:true },
    professional_tax: { enabled:true, state:"Telangana", amount:200 },
    lop: { calculation:"working_days", deduction_basis:"gross" },
    payroll_schedule: { pay_day:28, lock_after_processing:true, allow_reprocessing:false },
  });

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };
  const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;

  useEffect(() => {
    if (config) {
      setConfigForm({
        salary_structure: { basic_percentage:config.salary_structure?.basic_percentage??40, hra_percentage:config.salary_structure?.hra_percentage??25, special_allowance_percentage:config.salary_structure?.special_allowance_percentage??25, other_percentage:config.salary_structure?.other_percentage??10 },
        pf: { ...config.pf },
        esi: { ...config.esi },
        professional_tax: { ...config.professional_tax },
        lop: { ...config.lop },
        payroll_schedule: { ...config.payroll_schedule },
      });
    }
  }, [config]);

  const handleSave = async () => {
    const ss = configForm.salary_structure;
    const sum = (ss.basic_percentage||0)+(ss.hra_percentage||0)+(ss.special_allowance_percentage||0)+(ss.other_percentage||0);
    if (Math.abs(sum-100)>0.01) { showToast(`Salary structure must total 100%. Current: ${sum.toFixed(1)}%`,"error"); return; }
    setFormLoading(true);
    const res = await updatePayrollConfig(configForm);
    if (res.ok) { showToast("Config updated"); setShowEditModal(false); invalidate("payroll-config"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setFormLoading(false);
  };

  if (isLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Salary Structure */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Salary Structure</p>
        <div className="grid grid-cols-4 gap-3">
          {[["Basic",config?.salary_structure?.basic_percentage],["HRA",config?.salary_structure?.hra_percentage],["Special",config?.salary_structure?.special_allowance_percentage],["Other",config?.salary_structure?.other_percentage]].map(([l,v])=>(
            <div key={l} className="p-3 rounded-xl bg-slate-50 text-center"><p className="text-lg font-black text-brand-600">{v??0}%</p><p className="text-[10px] text-slate-500">{l}</p></div>
          ))}
        </div>
      </div>

      {/* PF */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provident Fund</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config?.pf?.enabled!==false?"bg-green-50 text-green-600":"bg-slate-100 text-slate-400"}`}>{config?.pf?.enabled!==false?"Enabled":"Disabled"}</span></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {[["Employee %",`${config?.pf?.employee_percentage??0}%`],["Employer %",`${config?.pf?.employer_percentage??0}%`],["Applicable On",(config?.pf?.pf_applicable_on||"—").replace(/_/g," ")],["Wage Ceiling",fmt(config?.pf?.pf_wage_ceiling)]].map(([l,v])=>(<div key={l} className="flex justify-between"><span className="text-[10px] text-slate-500">{l}</span><span className="text-[10px] font-bold capitalize">{v}</span></div>))}
          <div className="flex justify-between col-span-2 pt-1 border-t border-slate-50 mt-1"><span className="text-[10px] text-slate-500">Employer PF in CTC</span><span className={`text-[10px] font-bold ${config?.pf?.employer_pf_included_in_ctc?"text-amber-600":"text-slate-600"}`}>{config?.pf?.employer_pf_included_in_ctc===true?"Yes — deducted from gross":config?.pf?.employer_pf_included_in_ctc===false?"No — paid on top":"—"}</span></div>
        </div>
      </div>

      {/* ESI */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ESI</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config?.esi?.enabled!==false?"bg-green-50 text-green-600":"bg-slate-100 text-slate-400"}`}>{config?.esi?.enabled!==false?"Enabled":"Disabled"}</span></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {[["Employee %",`${config?.esi?.employee_percentage??0}%`],["Employer %",`${config?.esi?.employer_percentage??0}%`],["Salary Limit",fmt(config?.esi?.salary_limit)]].map(([l,v])=>(<div key={l} className="flex justify-between"><span className="text-[10px] text-slate-500">{l}</span><span className="text-[10px] font-bold">{v}</span></div>))}
          <div className="flex justify-between col-span-2 pt-1 border-t border-slate-50 mt-1"><span className="text-[10px] text-slate-500">Employer ESI in CTC</span><span className={`text-[10px] font-bold ${config?.esi?.employer_esi_included_in_ctc?"text-amber-600":"text-slate-600"}`}>{config?.esi?.employer_esi_included_in_ctc===true?"Yes — deducted from gross":config?.esi?.employer_esi_included_in_ctc===false?"No — paid on top":"—"}</span></div>
        </div>
      </div>

      {/* PT & LOP + Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professional Tax & LOP</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config?.professional_tax?.enabled!==false?"bg-green-50 text-green-600":"bg-slate-100 text-slate-400"}`}>{config?.professional_tax?.enabled!==false?"Enabled":"Disabled"}</span></div>
          <div className="space-y-1.5">
            {[["PT Amount",fmt(config?.professional_tax?.amount)],["PT State",config?.professional_tax?.state||"—"],["LOP Basis",(config?.lop?.calculation||"—").replace(/_/g," ")],["Deduction On",config?.lop?.deduction_basis||"—"]].map(([l,v])=>(<div key={l} className="flex justify-between"><span className="text-[10px] text-slate-500">{l}</span><span className="text-[10px] font-bold capitalize">{v}</span></div>))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payroll Schedule</p>
          <div className="space-y-1.5">
            {[["Pay Day",config?.payroll_schedule?.pay_day||"—"],["Lock After Processing",config?.payroll_schedule?.lock_after_processing?"Yes":"No"],["Allow Reprocessing",config?.payroll_schedule?.allow_reprocessing?"Yes":"No"]].map(([l,v])=>(<div key={l} className="flex justify-between"><span className="text-[10px] text-slate-500">{l}</span><span className={`text-[10px] font-bold ${l==="Lock After Processing"&&v==="Yes"?"text-amber-600":l==="Allow Reprocessing"&&v==="Yes"?"text-brand-600":"text-slate-600"}`}>{v}</span></div>))}
          </div>
        </div>
      </div>

      <button onClick={()=>setShowEditModal(true)} className="text-xs font-bold text-brand-600 hover:underline">Edit Configuration →</button>

      {/* Edit Config Modal */}
      <AnimatePresence>
        {showEditModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowEditModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-900">Edit Payroll Config</h3>
                <button onClick={()=>setShowEditModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-slate-400 hidden"/><span className="text-slate-400 text-lg leading-none">×</span></button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
                {/* Salary Structure */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Salary Structure</p>
                  {(()=>{const ss=configForm.salary_structure;const sum=(ss.basic_percentage||0)+(ss.hra_percentage||0)+(ss.special_allowance_percentage||0)+(ss.other_percentage||0);const ok=Math.abs(sum-100)<0.01;return(<div className={`text-[10px] font-semibold mb-3 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 ${ok?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600"}`}>{ok?"✓":"⚠"} Total: {sum.toFixed(1)}% {ok?"(Valid)":"(Must equal 100%)"}</div>);})()}
                  <div className="grid grid-cols-4 gap-3">
                    {[["Basic %","basic_percentage"],["HRA %","hra_percentage"],["Special %","special_allowance_percentage"],["Other %","other_percentage"]].map(([l,k])=>(
                      <div key={k}><label className="text-[10px] font-semibold text-slate-500 mb-1 block">{l}</label><input type="number" step="0.1" value={configForm.salary_structure[k]||""} onChange={e=>setConfigForm(f=>({...f,salary_structure:{...f.salary_structure,[k]:parseFloat(e.target.value)||0}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                    ))}
                  </div>
                </div>

                {/* PF */}
                <div>
                  <div className="flex items-center gap-2 mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PF</p><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={configForm.pf.enabled} onChange={e=>setConfigForm(f=>({...f,pf:{...f.pf,enabled:e.target.checked}}))} className="w-3.5 h-3.5 rounded border-slate-300"/><span className="text-[10px] text-slate-500">{configForm.pf.enabled?"Enabled":"Disabled"}</span></label></div>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Employee %","employee_percentage"],["Employer %","employer_percentage"],["Wage Ceiling (₹)","pf_wage_ceiling"]].map(([l,k])=>(<div key={k}><label className="text-[10px] font-semibold text-slate-500 mb-1 block">{l}</label><input type="number" step="0.01" value={configForm.pf[k]||""} disabled={!configForm.pf.enabled} onChange={e=>setConfigForm(f=>({...f,pf:{...f.pf,[k]:parseFloat(e.target.value)||0}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400"/></div>))}
                  </div>
                  <div className="mt-3"><label className="text-[10px] font-semibold text-slate-500 mb-2 block">PF Applicable On</label><div className="flex gap-3">{[["full_basic","Full Basic"],["pf_wage_ceiling","Wage Ceiling (₹15k)"]].map(([v,l])=>(<label key={v} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${configForm.pf.pf_applicable_on===v?"border-brand-400 bg-brand-50":"border-slate-200"} ${!configForm.pf.enabled?"opacity-40 pointer-events-none":""}`}><input type="radio" name="pf_on" value={v} checked={configForm.pf.pf_applicable_on===v} disabled={!configForm.pf.enabled} onChange={()=>setConfigForm(f=>({...f,pf:{...f.pf,pf_applicable_on:v}}))} className="accent-brand-600"/><span className="text-[10px] font-medium text-slate-700">{l}</span></label>))}</div></div>
                  <div className="mt-3"><label className="text-[10px] font-semibold text-slate-500 mb-2 block">Employer PF included in CTC?</label><div className="flex gap-3">{[[true,"Yes — deducted from gross"],[false,"No — paid on top"]].map(([v,l])=>(<label key={String(v)} className={`flex items-start gap-2 px-3 py-2 rounded-xl border cursor-pointer flex-1 transition-all ${configForm.pf.employer_pf_included_in_ctc===v?"border-brand-400 bg-brand-50":"border-slate-200"} ${!configForm.pf.enabled?"opacity-40 pointer-events-none":""}`}><input type="radio" name="pf_ctc" value={String(v)} checked={configForm.pf.employer_pf_included_in_ctc===v} disabled={!configForm.pf.enabled} onChange={()=>setConfigForm(f=>({...f,pf:{...f.pf,employer_pf_included_in_ctc:v}}))} className="accent-brand-600 mt-0.5 flex-shrink-0"/><span className="text-[10px] font-medium text-slate-700 leading-relaxed">{l}</span></label>))}</div></div>
                </div>

                {/* ESI */}
                <div>
                  <div className="flex items-center gap-2 mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ESI</p><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={configForm.esi.enabled} onChange={e=>setConfigForm(f=>({...f,esi:{...f.esi,enabled:e.target.checked}}))} className="w-3.5 h-3.5 rounded border-slate-300"/><span className="text-[10px] text-slate-500">{configForm.esi.enabled?"Enabled":"Disabled"}</span></label></div>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Employee %","employee_percentage"],["Employer %","employer_percentage"],["Salary Limit (₹)","salary_limit"]].map(([l,k])=>(<div key={k}><label className="text-[10px] font-semibold text-slate-500 mb-1 block">{l}</label><input type="number" step="0.01" value={configForm.esi[k]||""} disabled={!configForm.esi.enabled} onChange={e=>setConfigForm(f=>({...f,esi:{...f.esi,[k]:parseFloat(e.target.value)||0}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400"/></div>))}
                  </div>
                  <div className="mt-3"><label className="text-[10px] font-semibold text-slate-500 mb-2 block">Employer ESI included in CTC?</label><div className="flex gap-3">{[[true,"Yes — deducted from gross"],[false,"No — paid on top"]].map(([v,l])=>(<label key={String(v)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer flex-1 transition-all ${configForm.esi.employer_esi_included_in_ctc===v?"border-brand-400 bg-brand-50":"border-slate-200"} ${!configForm.esi.enabled?"opacity-40 pointer-events-none":""}`}><input type="radio" name="esi_ctc" value={String(v)} checked={configForm.esi.employer_esi_included_in_ctc===v} disabled={!configForm.esi.enabled} onChange={()=>setConfigForm(f=>({...f,esi:{...f.esi,employer_esi_included_in_ctc:v}}))} className="accent-brand-600"/><span className="text-[10px] font-medium text-slate-700">{l}</span></label>))}</div></div>
                </div>

                {/* PT + LOP + Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professional Tax</p><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!configForm.professional_tax.enabled} onChange={e=>setConfigForm(f=>({...f,professional_tax:{...f.professional_tax,enabled:e.target.checked}}))} className="w-3.5 h-3.5 rounded border-slate-300"/><span className="text-[10px] text-slate-500">{configForm.professional_tax.enabled?"On":"Off"}</span></label></div>
                    <div className="space-y-2">
                      <div><label className="text-[10px] font-semibold text-slate-500 mb-1 block">Amount (₹)</label><input type="number" value={configForm.professional_tax.amount||""} disabled={!configForm.professional_tax.enabled} onChange={e=>setConfigForm(f=>({...f,professional_tax:{...f.professional_tax,amount:parseFloat(e.target.value)||0}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400"/></div>
                      <div><label className="text-[10px] font-semibold text-slate-500 mb-1 block">State</label><input value={configForm.professional_tax.state||""} disabled={!configForm.professional_tax.enabled} onChange={e=>setConfigForm(f=>({...f,professional_tax:{...f.professional_tax,state:e.target.value}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400"/></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">LOP</p>
                    <div className="space-y-2">
                      <div><label className="text-[10px] font-semibold text-slate-500 mb-1 block">Calculation</label><select value={configForm.lop.calculation||"working_days"} onChange={e=>setConfigForm(f=>({...f,lop:{...f.lop,calculation:e.target.value}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none"><option value="calendar_days">Calendar Days</option><option value="working_days">Working Days</option></select></div>
                      <div><label className="text-[10px] font-semibold text-slate-500 mb-1 block">Deduction On</label><select value={configForm.lop.deduction_basis||"gross"} onChange={e=>setConfigForm(f=>({...f,lop:{...f.lop,deduction_basis:e.target.value}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none"><option value="gross">Gross</option><option value="basic">Basic</option></select></div>
                    </div>
                  </div>
                </div>

                {/* Payroll Schedule */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payroll Schedule</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-semibold text-slate-500 mb-1 block">Pay Day (1–31)</label><input type="number" min="1" max="31" value={configForm.payroll_schedule.pay_day||28} onChange={e=>setConfigForm(f=>({...f,payroll_schedule:{...f.payroll_schedule,pay_day:parseInt(e.target.value)||28}}))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                    <div className="space-y-2 pt-1">
                      <label className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-all ${configForm.payroll_schedule.lock_after_processing?"border-amber-400 bg-amber-50":"border-slate-200"}`}><div><p className="text-[10px] font-semibold text-slate-700">Lock after processing</p><p className="text-[9px] text-slate-400">Once run, can&apos;t re-run</p></div><input type="checkbox" checked={!!configForm.payroll_schedule.lock_after_processing} onChange={e=>setConfigForm(f=>({...f,payroll_schedule:{...f.payroll_schedule,lock_after_processing:e.target.checked,allow_reprocessing:e.target.checked?false:f.payroll_schedule.allow_reprocessing}}))} className="w-4 h-4 rounded border-slate-300 accent-amber-500"/></label>
                      <label className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-all ${configForm.payroll_schedule.allow_reprocessing?"border-brand-400 bg-brand-50":"border-slate-200"} ${configForm.payroll_schedule.lock_after_processing?"opacity-40 pointer-events-none":""}`}><div><p className="text-[10px] font-semibold text-slate-700">Allow reprocessing</p><p className="text-[9px] text-slate-400">Re-run for same month</p></div><input type="checkbox" checked={!!configForm.payroll_schedule.allow_reprocessing} disabled={configForm.payroll_schedule.lock_after_processing} onChange={e=>setConfigForm(f=>({...f,payroll_schedule:{...f.payroll_schedule,allow_reprocessing:e.target.checked}}))} className="w-4 h-4 rounded border-slate-300 accent-brand-600"/></label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
                <button onClick={()=>setShowEditModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleSave} disabled={formLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">
                  {formLoading?"Saving...":"Save Config"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
