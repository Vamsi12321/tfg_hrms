"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, MapPin, CheckCircle2, AlertCircle, X, Navigation } from "lucide-react";
import { createOfficeLocation, updateOfficeLocation, deleteOfficeLocation } from "@/lib/api";
import { useOfficeLocations, useInvalidate } from "@/lib/queries";
import LocationPicker from "@/components/LocationPicker";

const blank = { name:"", address:"", latitude:"", longitude:"", radius_meters:200, is_active:true };

export default function LocationsPage() {
  const invalidate = useInvalidate();
  const { data: locations = [], isLoading } = useOfficeLocations();
  const [showModal, setShowModal] = useState(false);
  const [editLoc, setEditLoc] = useState(null);
  const [form, setForm] = useState(blank);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const openAdd  = () => { setForm(blank); setEditLoc(null); setShowModal(true); };
  const openEdit = (loc) => { setForm({name:loc.name,address:loc.address||"",latitude:loc.latitude,longitude:loc.longitude,radius_meters:loc.radius_meters,is_active:loc.is_active}); setEditLoc(loc); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = {...form, latitude:parseFloat(form.latitude), longitude:parseFloat(form.longitude), radius_meters:parseInt(form.radius_meters)};
    const res = editLoc ? await updateOfficeLocation(editLoc.id, payload) : await createOfficeLocation(payload);
    if (res.ok) { showToast(editLoc?"Location updated":"Location added"); setShowModal(false); invalidate("office-locations"); }
    else showToast(res.data?.detail||"Failed","error");
    setFormLoading(false);
  };

  const handleDelete = async (loc) => {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    const res = await deleteOfficeLocation(loc.id);
    if (res.ok) { showToast("Deleted"); invalidate("office-locations"); }
    else showToast("Failed","error");
  };

  const activeCount = locations.filter(l => l.is_active).length;
  const inactiveCount = locations.length - activeCount;

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Office Locations</h3>
          <p className="text-sm text-slate-500">Configure geofenced zones for check-ins</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25">
          <Plus className="w-4 h-4"/> Add Location
        </motion.button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Locations", value: locations.length, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
          { label: "Active", value: activeCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
          { label: "Inactive", value: inactiveCount, color: "text-slate-700", bg: "bg-slate-50/60", border: "border-slate-200/50", dot: "bg-slate-400" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
              <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full ${k.dot}`} />
          </div>
        ))}
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : locations.length===0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <MapPin className="w-8 h-8 text-slate-300"/>
          </div>
          <p className="text-sm font-bold text-slate-500">No locations configured yet</p>
          <button onClick={openAdd} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Add first location</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc,i)=>(
            <motion.div key={loc.id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-100 transition-all group flex flex-col h-full">
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-600 opacity-80 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{loc.name}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex mt-1 ${loc.is_active?"bg-emerald-50 text-emerald-700 border-emerald-200/50":"bg-slate-50 text-slate-500 border-slate-200/50"}`}>{loc.is_active?"Active":"Inactive"}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{loc.address || "No address specified."}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5"><Navigation className="w-3 h-3 text-slate-400"/> Lat: {parseFloat(loc.latitude).toFixed(4)}</div>
                  <div className="flex items-center gap-1.5"><Navigation className="w-3 h-3 text-slate-400"/> Lng: {parseFloat(loc.longitude).toFixed(4)}</div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400"/> Radius: {loc.radius_meters}m
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-2">
                <button onClick={()=>openEdit(loc)} className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors">
                  <Edit className="w-3.5 h-3.5"/> Edit
                </button>
                <button onClick={()=>handleDelete(loc)} className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors">
                  <Trash2 className="w-3.5 h-3.5"/> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{editLoc ? "Edit Location" : "Add Location"}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Geofenced zone properties</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="loc-form" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Location Name *</label>
                      <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. Headquarters" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/>
                    </div>
                    <label className="flex flex-col gap-1.5 cursor-pointer group mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${form.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>{form.is_active ? "Active" : "Inactive"}</span>
                      <div className={`w-11 h-6 rounded-full p-1 transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} />
                    </label>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Address</label>
                    <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="123 Tech Park, City..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Map Region Setup</label>
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                      <LocationPicker latitude={form.latitude} longitude={form.longitude} radius={form.radius_meters}
                        onLocationChange={(lat,lng)=>setForm(f=>({...f,latitude:lat,longitude:lng}))}
                        onAddressChange={(addr)=>setForm(f=>({...f,address:addr}))}/>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Geofence Radius (Meters)</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min="50" max="1000" step="50" value={form.radius_meters} onChange={e=>setForm(f=>({...f,radius_meters:e.target.value}))} className="flex-1 accent-brand-500" />
                      <input type="number" min="10" max="5000" value={form.radius_meters} onChange={e=>setForm(f=>({...f,radius_meters:e.target.value}))} className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-center outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all"/>
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="loc-form" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> {editLoc ? "Update Location" : "Save Location"}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
