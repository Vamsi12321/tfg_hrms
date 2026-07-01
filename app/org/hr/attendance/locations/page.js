"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, MapPin, CheckCircle2, AlertCircle, X } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Office Locations</h3>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> Add Location
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : locations.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No locations configured yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {locations.map((loc,i)=>(
            <motion.div key={loc.id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div><h4 className="text-sm font-bold text-slate-900">{loc.name}</h4><p className="text-xs text-slate-500 mt-0.5">{loc.address}</p></div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${loc.is_active?"bg-green-50 text-green-600 border-green-200":"bg-slate-50 text-slate-400 border-slate-200"}`}>{loc.is_active?"Active":"Inactive"}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-3">
                <span>Lat: {loc.latitude}</span><span>Lng: {loc.longitude}</span><span>Radius: {loc.radius_meters}m</span>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>openEdit(loc)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100"><Edit className="w-3 h-3"/> Edit</button>
                <button onClick={()=>handleDelete(loc)} className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100"><Trash2 className="w-3 h-3"/> Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{editLoc?"Edit":"Add"} Location</h3><button onClick={()=>setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleSave} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Address</label><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Pick on Map</label>
                  <LocationPicker latitude={form.latitude} longitude={form.longitude} radius={form.radius_meters}
                    onLocationChange={(lat,lng)=>setForm(f=>({...f,latitude:lat,longitude:lng}))}
                    onAddressChange={(addr)=>setForm(f=>({...f,address:addr}))}/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Radius (m)</label><input type="number" value={form.radius_meters} onChange={e=>setForm(f=>({...f,radius_meters:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div className="flex items-end pb-1.5"><label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} className="w-4 h-4 rounded border-slate-300"/> Active</label></div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":editLoc?"Update":"Add Location"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
