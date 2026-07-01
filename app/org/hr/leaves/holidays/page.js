"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Upload, CalendarDays, CheckCircle2, AlertCircle, X } from "lucide-react";
import { listHolidays, createHoliday, updateHoliday, deleteHoliday, importHolidaysCSV } from "@/lib/api";

const blank = { name:"", date:"", state:"", type:"mandatory", description:"" };

export default function HolidaysPage() {
  const [holidays,    setHolidays]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [typeFilter,  setTypeFilter]  = useState("");
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [form,        setForm]        = useState(blank);
  const [formLoading, setFormLoading] = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [importResult,setImportResult]= useState(null);
  const [toast,       setToast]       = useState(null);
  const fileRef = useRef(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const fetchHolidays = async () => {
    setLoading(true);
    const params = { year, limit:100 };
    if (typeFilter) params.type = typeFilter;
    const res = await listHolidays(params);
    if (res.ok && res.data) { setHolidays(res.data.holidays||[]); setTotal(res.data.total||0); }
    setLoading(false);
  };

  useEffect(()=>{ fetchHolidays(); },[year,typeFilter]);

  const openAdd  = () => { setForm(blank); setEditItem(null); setShowAdd(true); };
  const openEdit = (h) => { setForm({name:h.name,date:h.date,state:h.state||"",type:h.type||"mandatory",description:h.description||""}); setEditItem(h); setShowAdd(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = editItem ? await updateHoliday(editItem.id, form) : await createHoliday(form);
    if (res.ok) { showToast(editItem?"Updated":"Added"); setShowAdd(false); fetchHolidays(); }
    else showToast(res.data?.detail?.[0]?.msg||res.data?.detail||"Failed","error");
    setFormLoading(false);
  };

  const handleDelete = async (h) => {
    if (!confirm(`Delete "${h.name}" (${h.date})?`)) return;
    const res = await deleteHoliday(h.id);
    if (res.ok) { showToast("Deleted"); fetchHolidays(); }
    else showToast(res.data?.detail||"Failed","error");
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { showToast("Select a CSV file","error"); return; }
    setFormLoading(true);
    const res = await importHolidaysCSV(file);
    if (res.ok && res.data) {
      setImportResult(res.data);
      showToast(`Imported ${res.data.imported}${res.data.failed?`, ${res.data.failed} failed`:""}`);
      fetchHolidays();
    } else showToast(res.data?.detail||"Import failed","error");
    setFormLoading(false);
  };

  return (
    <div>
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-sm font-bold text-slate-900">Holiday Calendar</h3><p className="text-[10px] text-slate-400 mt-0.5">{total} holidays for {year}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none">
              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none">
              <option value="">All Types</option><option value="mandatory">Mandatory</option><option value="optional">Optional</option>
            </select>
            <button onClick={()=>setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"><Upload className="w-3.5 h-3.5"/> Import CSV</button>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md"><Plus className="w-3.5 h-3.5"/> Add Holiday</motion.button>
          </div>
        </div>
        {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
        : holidays.length===0 ? (
          <div className="p-12 text-center"><CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3"/><p className="text-sm font-semibold text-slate-400">No holidays for {year}</p><p className="text-xs text-slate-400 mt-1">Add holidays or import from CSV.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">{["Date","Holiday","State","Type","Description","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {holidays.map((h,i)=>(
                  <motion.tr key={h.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3"><p className="text-xs font-bold text-slate-800">{h.date}</p><p className="text-[10px] text-slate-400">{new Date(h.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short"})}</p></td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-800">{h.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{h.state||"—"}</td>
                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${h.type==="mandatory"?"bg-red-50 text-red-600 border-red-200":"bg-blue-50 text-blue-600 border-blue-200"}`}>{h.type==="mandatory"?"Mandatory":"Optional"}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{h.description||"—"}</td>
                    <td className="px-4 py-3"><div className="flex gap-1.5"><button onClick={()=>openEdit(h)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-blue-600"/></button><button onClick={()=>handleDelete(h)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button></div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAdd(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{editItem?"Edit":"Add"} Holiday</h3><button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Holiday Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date *</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"><option value="mandatory">Mandatory</option><option value="optional">Optional</option></select></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">State / Region</label><input value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} placeholder="All India" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":editItem?"Update Holiday":"Add Holiday"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>{setShowImport(false);setImportResult(null);}}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Import Holidays CSV</h3><button onClick={()=>{setShowImport(false);setImportResult(null);}} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 mb-4">
                <p className="font-bold mb-2">CSV Format:</p>
                <code className="text-[10px] text-slate-500 block">name,date,state,type,description</code>
                <code className="text-[10px] text-slate-400 block mt-1">Republic Day,2026-01-26,All India,mandatory,National holiday</code>
              </div>
              <div className="mb-4"><label className="text-xs font-semibold text-slate-600 mb-2 block">Select CSV File *</label><input ref={fileRef} type="file" accept=".csv" className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"/></div>
              {importResult&&(
                <div className={`mb-4 p-4 rounded-xl border text-xs ${importResult.failed>0?"bg-amber-50 border-amber-200":"bg-green-50 border-green-200"}`}>
                  <p className="font-bold mb-2">Imported: {importResult.imported} | Failed: {importResult.failed}</p>
                  {importResult.errors?.map((err,i)=><p key={i} className="text-red-600 text-[10px]">{err}</p>)}
                </div>
              )}
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleImport} disabled={formLoading} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Importing...":"Import Holidays"}</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
