"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Upload, CalendarDays, CheckCircle2, AlertCircle, X, Calendar, Globe, MapPin, Sparkles, PartyPopper, Flag } from "lucide-react";
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

  const mandatoryCount = holidays.filter(h => h.type === 'mandatory').length;
  const optionalCount  = holidays.filter(h => h.type === 'optional').length;

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Holiday Calendar</h3>
          <p className="text-sm text-slate-500">Configure annual regional and national holidays</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Year + Type filter pill */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-3 mr-1" />
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="">All Types</option>
              <option value="mandatory">Mandatory</option>
              <option value="optional">Optional</option>
            </select>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4"/> Add Holiday
          </motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4"/> Import CSV
          </motion.button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:"Total Holidays",     value:total,         icon:CalendarDays, color:"text-indigo-700",  bg:"bg-indigo-50/60",  border:"border-indigo-100/40",  iconBg:"bg-indigo-100",  iconColor:"text-indigo-600"  },
          { label:"Mandatory",          value:mandatoryCount,icon:Flag,         color:"text-rose-700",    bg:"bg-rose-50/60",    border:"border-rose-100/40",    iconBg:"bg-rose-100",    iconColor:"text-rose-600"    },
          { label:"Optional",           value:optionalCount, icon:PartyPopper,  color:"text-emerald-700", bg:"bg-emerald-50/60", border:"border-emerald-100/40", iconBg:"bg-emerald-100", iconColor:"text-emerald-600" },
        ].map((k,i) => (
          <motion.div key={k.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
            className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className={`text-[10px] font-bold ${k.color.replace('700','500')} uppercase tracking-wider`}>{k.label}</p>
              <p className={`text-3xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${k.iconBg} flex items-center justify-center`}>
              <k.icon className={`w-5 h-5 ${k.iconColor}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Table */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
        ) : holidays.length===0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-indigo-300"/>
            </div>
            <p className="text-sm font-bold text-slate-600">No holidays for {year}</p>
            <p className="text-xs text-slate-400 mt-1">Configure individual holidays or import a CSV list.</p>
            <button onClick={openAdd} className="mt-4 text-xs font-bold text-brand-600 hover:underline">+ Add Holiday</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                  {["Date","Holiday","State/Region","Type","Description","Actions"].map(h=>
                    <th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {holidays.map((h,i)=>{
                  const d = new Date(h.date+"T00:00:00");
                  const mon = d.toLocaleDateString("en-US",{month:"short"});
                  const day = d.getDate();
                  const weekday = d.toLocaleDateString("en-US",{weekday:"short"});
                  const isMandatory = h.type === "mandatory";
                  return (
                    <motion.tr key={h.id||i} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                      className="hover:bg-indigo-50/20 transition-colors group">
                      {/* Date cell */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{mon}</span>
                            <span className="text-sm font-black text-slate-700 leading-tight">{day}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{h.date}</p>
                            <p className="text-[10px] text-slate-400">{weekday}</p>
                          </div>
                        </div>
                      </td>
                      {/* Holiday name */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{h.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{h.date}</p>
                      </td>
                      {/* Region */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {h.state||"All India"}
                        </span>
                      </td>
                      {/* Type pill */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border shadow-sm ${
                          isMandatory
                            ? "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200/60"
                            : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/60"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isMandatory?"bg-rose-500":"bg-blue-500"}`}/>
                          {isMandatory ? "Mandatory" : "Optional"}
                        </span>
                      </td>
                      {/* Description */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 max-w-[200px] truncate" title={h.description}>{h.description||"—"}</p>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                            onClick={()=>openEdit(h)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs font-bold transition-colors border border-brand-100/50">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </motion.button>
                          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                            onClick={()=>handleDelete(h)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 text-xs font-bold transition-colors border border-slate-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={()=>setShowAdd(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white">{editItem ? "Edit Holiday" : "New Holiday"}</h3>
                  <p className="text-sm text-white/75 mt-0.5">{editItem ? `Editing: ${editItem.name}` : "Add a public off-day to the calendar"}</p>
                </div>
                <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="holiday-form" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Holiday Name *</label>
                    <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required
                      placeholder="e.g. Independence Day"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-slate-50 focus:bg-white transition-all"/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date *</label>
                      <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-slate-50 focus:bg-white transition-all"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Type</label>
                      <div className="flex gap-2">
                        {[{v:"mandatory",label:"Mandatory",cls:"border-rose-300 bg-rose-50 text-rose-700"},{v:"optional",label:"Optional",cls:"border-blue-300 bg-blue-50 text-blue-700"}].map(t=>(
                          <button key={t.v} type="button" onClick={()=>setForm(f=>({...f,type:t.v}))}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${form.type===t.v?t.cls:"border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">State / Region</label>
                    <input value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))}
                      placeholder="All India (leave empty for default)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-slate-50 focus:bg-white transition-all"/>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                      placeholder="Brief summary about this holiday..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-slate-50 focus:bg-white resize-none transition-all"/>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3 bg-slate-50/80">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="holiday-form" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>:<><CheckCircle2 className="w-4 h-4"/>Save Holiday</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={()=>{setShowImport(false);setImportResult(null);}}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white">Import Holidays CSV</h3>
                  <p className="text-sm text-slate-400 mt-0.5">Bulk upload via CSV file</p>
                </div>
                <button onClick={()=>{setShowImport(false);setImportResult(null);}} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 mb-5">
                  <p className="font-bold text-indigo-800 mb-2 flex items-center gap-1.5 text-xs"><Sparkles className="w-3.5 h-3.5"/>CSV Header Format:</p>
                  <code className="text-[10px] font-bold text-indigo-600 block bg-white px-3 py-2 rounded-xl border border-indigo-100 mb-2">name,date,state,type,description</code>
                  <p className="text-[10px] text-indigo-500 italic">e.g. Republic Day, 2026-01-26, All India, mandatory, National Holiday</p>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select CSV File *</label>
                  <input ref={fileRef} type="file" accept=".csv"
                    className="w-full text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none cursor-pointer"/>
                </div>

                {importResult&&(
                  <div className={`mb-5 p-4 rounded-xl border text-xs ${importResult.failed>0?"bg-amber-50 border-amber-200 text-amber-800":"bg-green-50 border-green-200 text-green-800"}`}>
                    <p className="font-bold mb-1.5">Imported: {importResult.imported} | Failed: {importResult.failed}</p>
                    {importResult.errors?.map((err,i)=><p key={i} className="text-red-600 text-[10px] mt-1">{err}</p>)}
                  </div>
                )}

                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleImport} disabled={formLoading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Uploading...</>:<><Upload className="w-4 h-4"/>Start Import</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
