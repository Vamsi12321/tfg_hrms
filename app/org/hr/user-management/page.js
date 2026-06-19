"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Shield, Mail, Calendar,
  X, Trash2, CheckCircle, XCircle, Key, Eye, EyeOff,
  UserCheck, UserX, RefreshCw
} from "lucide-react";
import TopBar from "@/components/TopBar";

const initialHRManagers = [
  { id: "HR001", name: "Priya Sharma", email: "priya@tfg.com", phone: "+91 98765 43210", addedOn: "2024-01-10", status: "active", lastLogin: "2025-06-11", employeesManaged: 12 },
  { id: "HR002", name: "Meera Iyer", email: "meera.hr@tfg.com", phone: "+91 91234 56789", addedOn: "2024-03-22", status: "active", lastLogin: "2025-06-10", employeesManaged: 8 },
  { id: "HR003", name: "Kiran Nair", email: "kiran.hr@tfg.com", phone: "+91 87654 32109", addedOn: "2024-07-05", status: "inactive", lastLogin: "2025-04-28", employeesManaged: 0 },
];

const avatarColors = ["bg-violet-600", "bg-blue-600", "bg-teal-600", "bg-rose-500", "bg-amber-500", "bg-indigo-600"];

function Modal({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex items-start justify-center min-h-full p-4 py-8">
        <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default function UserManagementPage() {
  const [hrManagers, setHRManagers] = useState(initialHRManagers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", tempPassword: "", confirmPassword: "" });
  const [formErrors, setFormErrors] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = hrManagers.filter(hr => {
    const matchSearch = hr.name.toLowerCase().includes(search.toLowerCase()) || hr.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || hr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const validate = () => {
    const errs = {};
    if (!addForm.name.trim()) errs.name = "Name is required";
    if (!addForm.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(addForm.email)) errs.email = "Invalid email";
    if (hrManagers.find(h => h.email === addForm.email)) errs.email = "Email already exists";
    if (!addForm.tempPassword) errs.tempPassword = "Temporary password required";
    else if (addForm.tempPassword.length < 6) errs.tempPassword = "Min 6 characters";
    if (addForm.tempPassword !== addForm.confirmPassword) errs.confirmPassword = "Passwords don't match";
    return errs;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    const newHR = {
      id: `HR${String(hrManagers.length + 1).padStart(3, "0")}`,
      name: addForm.name, email: addForm.email, phone: addForm.phone,
      addedOn: new Date().toISOString().split("T")[0],
      status: "active", lastLogin: "Never", employeesManaged: 0,
    };
    setHRManagers(prev => [...prev, newHR]);
    setShowAddModal(false);
    setAddForm({ name: "", email: "", phone: "", tempPassword: "", confirmPassword: "" });
    setFormErrors({});
    showToast(`${addForm.name} added as HR Manager`);
  };

  const toggleStatus = (id) => {
    const hr = hrManagers.find(h => h.id === id);
    setHRManagers(prev => prev.map(h => h.id === id ? { ...h, status: h.status === "active" ? "inactive" : "active" } : h));
    showToast(`${hr.name} ${hr.status === "active" ? "deactivated" : "activated"}`);
    setShowDetailModal(null);
  };

  const handleDelete = (id) => {
    const hr = hrManagers.find(h => h.id === id);
    setHRManagers(prev => prev.filter(h => h.id !== id));
    setShowDeleteConfirm(null);
    setShowDetailModal(null);
    showToast(`${hr.name} removed`, "error");
  };

  const activeCount = hrManagers.filter(h => h.status === "active").length;
  const inactiveCount = hrManagers.filter(h => h.status === "inactive").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="User Management" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">HR Manager Accounts</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage who has HR access in your organization</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
            <Plus className="w-4 h-4" /> Add HR Manager
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total HR Managers", value: hrManagers.length, textColor: "text-brand-600", border: "border-brand-100" },
            { label: "Active", value: activeCount, textColor: "text-green-600", border: "border-green-100" },
            { label: "Inactive", value: inactiveCount, textColor: "text-red-500", border: "border-red-100" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`bg-white rounded-2xl p-5 border ${s.border} shadow-sm`}>
              <p className={`text-2xl font-black ${s.textColor}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            {["all", "active", "inactive"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 text-xs font-semibold transition-colors capitalize ${statusFilter === s ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-50"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((hr, i) => (
              <motion.div key={hr.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer group relative overflow-hidden"
                onClick={() => setShowDetailModal(hr)}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500" />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {hr.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hr.status === "active" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                    {hr.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{hr.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Shield className="w-3 h-3 text-brand-400" /> HR Manager</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Mail className="w-3 h-3" /> {hr.email}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                  <div className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-slate-700">{hr.employeesManaged}</p>
                    <p className="text-[10px] text-slate-400">Managed</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-slate-700">{hr.lastLogin === "Never" ? "—" : hr.lastLogin.slice(5)}</p>
                    <p className="text-[10px] text-slate-400">Last Login</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No HR managers found</p>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <Modal onClose={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add HR Manager</h3>
                  <p className="text-xs text-slate-500 mt-0.5">They will receive login credentials via email</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="px-6 pb-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name *</label>
                  <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ravi Kumar"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${formErrors.name ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                  {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Work Email *</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="name@yourcompany.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${formErrors.email ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                  {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Temporary Password *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={addForm.tempPassword} onChange={e => setAddForm(f => ({ ...f, tempPassword: e.target.value }))} placeholder="Min 6 characters"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none pr-10 ${formErrors.tempPassword ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.tempPassword && <p className="text-[11px] text-red-500 mt-1">{formErrors.tempPassword}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Confirm Password *</label>
                  <input type="password" value={addForm.confirmPassword} onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Re-enter password"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${formErrors.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                  {formErrors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{formErrors.confirmPassword}</p>}
                </div>
                <div className="flex items-start gap-2 p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <Key className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-brand-700 leading-relaxed">
                    HR Manager will be prompted to change password on first login. They <strong>cannot</strong> add other HR managers or access org settings.
                  </p>
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20">
                  Add HR Manager
                </motion.button>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {showDetailModal && (
          <Modal onClose={() => setShowDetailModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {showDetailModal.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{showDetailModal.name}</h3>
                      <p className="text-blue-100 text-sm flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> HR Manager</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {[{ icon: Mail, label: "Email", value: showDetailModal.email }, { icon: Calendar, label: "Added On", value: showDetailModal.addedOn }, { icon: RefreshCw, label: "Last Login", value: showDetailModal.lastLogin }].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><item.icon className="w-3.5 h-3.5 text-slate-400" /></div>
                    <div><p className="text-[10px] text-slate-400">{item.label}</p><p className="text-sm font-medium text-slate-800">{item.value}</p></div>
                  </div>
                ))}
                <div className={`flex items-center justify-between p-3 rounded-xl ${showDetailModal.status === "active" ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                  <span className={`text-sm font-semibold ${showDetailModal.status === "active" ? "text-green-700" : "text-red-600"}`}>Account is <strong>{showDetailModal.status}</strong></span>
                  <span className={`w-2.5 h-2.5 rounded-full ${showDetailModal.status === "active" ? "bg-green-500" : "bg-red-400"}`} />
                </div>
                <div className="flex gap-2 pt-1">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => toggleStatus(showDetailModal.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${showDetailModal.status === "active" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                    {showDetailModal.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {showDetailModal.status === "active" ? "Deactivate" : "Activate"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteConfirm(showDetailModal.id)}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <Modal onClose={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-500" /></div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Remove HR Manager?</h4>
              <p className="text-sm text-slate-500 mb-6">This will revoke their access immediately. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">Yes, Remove</button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
