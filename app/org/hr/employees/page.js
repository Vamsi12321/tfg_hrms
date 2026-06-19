"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Download, MoreHorizontal, Smile, Meh, Frown,
  X, Mail, Phone, Building, Calendar, TrendingUp, Eye, Edit,
  Trash2, MessageSquare, MapPin
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { employees, departments } from "@/lib/fakeData";

const moodIcons = {
  happy:   { icon:Smile, color:"text-green-500", bg:"bg-green-50" },
  neutral: { icon:Meh,   color:"text-amber-500", bg:"bg-amber-50" },
  stressed:{ icon:Frown, color:"text-red-500",   bg:"bg-red-50"  },
};

const deptColors = {
  Engineering:"blue", Design:"purple", Marketing:"pink",
  Sales:"green", Finance:"amber", HR:"teal", Product:"indigo", Legal:"slate",
};

// Solid avatar colors per department — no gradients
const avatarBg = {
  Engineering: "bg-blue-600",
  Design:      "bg-purple-600",
  Marketing:   "bg-pink-500",
  Sales:       "bg-green-600",
  Finance:     "bg-amber-500",
  HR:          "bg-teal-600",
  Product:     "bg-indigo-600",
  Legal:       "bg-slate-600",
};

export default function EmployeesPage() {
  const [view, setView]             = useState("grid");
  const [search, setSearch]         = useState("");
  const [selectedDept, setDept]     = useState("All");
  const [selectedStatus, setStatus] = useState("all");
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showDetailModal, setDetailModal]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [allEmployees, setAllEmployees]       = useState(employees);
  const [addForm, setAddForm] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "male",
    address: "",
    department_id: "",
    designation: "",
    joining_date: "",
    employment_type: "full-time",
    salary: "",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 3000); };

  const filtered = allEmployees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    const matchDept   = selectedDept==="All" || emp.department===selectedDept;
    const matchStatus = selectedStatus==="all" || emp.status===selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    const fullName = `${addForm.first_name} ${addForm.last_name}`.trim();
    const dept = departments.find(d => d.name === addForm.department_id) || departments[0];
    const newEmp = {
      id: `EMP${String(allEmployees.length + 1).padStart(3, "0")}`,
      name: fullName,
      email: addForm.email,
      phone: addForm.phone,
      department: dept?.name || "Engineering",
      designation: addForm.designation,
      joinDate: addForm.joining_date,
      status: "active",
      salary: parseInt(addForm.salary) || 800000,
      avatar: null,
      mood: "happy",
      performance: 80,
      attendance: 95,
      // API fields stored for future real API call
      employee_id: addForm.employee_id,
      first_name: addForm.first_name,
      last_name: addForm.last_name,
      date_of_birth: addForm.date_of_birth,
      gender: addForm.gender,
      address: addForm.address,
      employment_type: addForm.employment_type,
    };
    setAllEmployees(prev => [...prev, newEmp]);
    setShowAddModal(false);
    setAddForm({
      employee_id: "", first_name: "", last_name: "", email: "", phone: "",
      date_of_birth: "", gender: "male", address: "", department_id: "",
      designation: "", joining_date: "", employment_type: "full-time", salary: "",
    });
    showToast(`${fullName} added successfully`);
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Employees" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold bg-green-500">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Team Directory</h2>
            <p className="text-sm text-slate-500">{filtered.length} of {allEmployees.length} employees</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Plus className="w-4 h-4" /> Add Employee
            </motion.button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search name, role..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <select value={selectedDept} onChange={e=>setDept(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-400">
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
          <select value={selectedStatus} onChange={e=>setStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
          </select>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden ml-auto">
            {["grid","list"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2.5 text-xs font-semibold transition-colors capitalize ${view===v ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-50"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / List */}
        <motion.div layout className={view==="grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
          <AnimatePresence mode="popLayout">
            {filtered.map((emp, i) => {
              const MoodIcon = moodIcons[emp.mood]?.icon || Meh;
              const moodColor = moodIcons[emp.mood]?.color || "text-slate-400";
              const moodBg    = moodIcons[emp.mood]?.bg    || "bg-slate-50";
              const dc  = deptColors[emp.department] || "slate";
              const avBg = avatarBg[emp.department] || "bg-slate-600";

              if (view==="grid") return (
                <motion.div key={emp.id} layout
                  initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                  transition={{ delay:i*0.03 }} whileHover={{ y:-3, boxShadow:"0 12px 40px -10px rgba(0,0,0,0.1)" }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer group relative overflow-hidden"
                  onClick={() => setDetailModal(emp)}>
                  {/* top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-${dc}-400`} />
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${avBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {emp.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full ${moodBg} flex items-center justify-center`}>
                        <MoodIcon className={`w-3.5 h-3.5 ${moodColor}`} />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${emp.status==="active" ? "bg-green-400" : "bg-amber-400"}`} />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{emp.designation}</p>
                  <span className={`text-[10px] font-medium text-${dc}-600 bg-${dc}-50 px-2 py-0.5 rounded-full mt-2 inline-block`}>
                    {emp.department}
                  </span>
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-400">Performance</span>
                      <span className="text-[10px] font-bold text-slate-700">{emp.performance}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width:0 }} animate={{ width:`${emp.performance}%` }} transition={{ delay:0.3+i*0.05, duration:0.8 }}
                        className={`h-full rounded-full ${emp.performance>=90?"bg-green-500":emp.performance>=80?"bg-blue-500":"bg-amber-500"}`} />
                    </div>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                </motion.div>
              );

              return (
                <motion.div key={emp.id} layout
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ delay:i*0.02 }}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setDetailModal(emp)}>
                  <div className={`w-10 h-10 rounded-xl ${avBg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {emp.name.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.designation} • {emp.department}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-full ${moodBg} flex items-center justify-center`}>
                      <MoodIcon className={`w-3.5 h-3.5 ${moodColor}`} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{emp.performance}%</p>
                      <p className="text-[10px] text-slate-400">Performance</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{emp.attendance}%</p>
                      <p className="text-[10px] text-slate-400">Attendance</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${emp.status==="active"?"bg-green-400":"bg-amber-400"}`} />
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors" onClick={e => {e.stopPropagation();}}>
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</label>
                    <input value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} required
                      placeholder="e.g. Ravi Kumar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email</label>
                    <input type="email" value={addForm.email} onChange={e=>setAddForm(f=>({...f,email:e.target.value}))} required
                      placeholder="name@tfg.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                    <input value={addForm.phone} onChange={e=>setAddForm(f=>({...f,phone:e.target.value}))}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</label>
                    <select value={addForm.department} onChange={e=>setAddForm(f=>({...f,department:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      {departments.map(d => <option key={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Designation</label>
                    <input value={addForm.designation} onChange={e=>setAddForm(f=>({...f,designation:e.target.value}))} required
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Joining Date</label>
                    <input type="date" value={addForm.joinDate} onChange={e=>setAddForm(f=>({...f,joinDate:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20">
                  Add Employee
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetailModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              {/* Header gradient */}
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${avatarBg[showDetailModal.department] || "bg-brand-600"} flex items-center justify-center text-white font-bold text-lg border border-white/20`}>
                      {showDetailModal.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{showDetailModal.name}</h3>
                      <p className="text-blue-100 text-sm">{showDetailModal.designation}</p>
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">{showDetailModal.department}</span>
                    </div>
                  </div>
                  <button onClick={() => setDetailModal(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 rounded-xl bg-blue-50">
                    <p className="text-lg font-black text-blue-600">{showDetailModal.performance}%</p>
                    <p className="text-[10px] text-slate-500">Performance</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50">
                    <p className="text-lg font-black text-green-600">{showDetailModal.attendance}%</p>
                    <p className="text-[10px] text-slate-500">Attendance</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50">
                    <p className="text-lg font-black text-purple-600">₹{(showDetailModal.salary/100000).toFixed(1)}L</p>
                    <p className="text-[10px] text-slate-500">Annual CTC</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon:Mail,     label:"Email",     value:showDetailModal.email },
                    { icon:Building, label:"Department",value:showDetailModal.department },
                    { icon:Calendar, label:"Joined",    value:showDetailModal.joinDate },
                  ].map((item,i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">{item.label}</p>
                          <p className="text-sm font-medium text-slate-800">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-5">
                  <button className="flex-1 py-2.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold border border-brand-200 flex items-center justify-center gap-1.5 hover:bg-brand-100 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                  <button className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
