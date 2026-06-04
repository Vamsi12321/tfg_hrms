"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Filter, Mail, Building2, ShieldCheck,
  CheckCircle2, XCircle, Key, UserMinus, UserCheck, Edit,
  ChevronDown, X, Info
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  crossOrgUsers as initialUsers,
  organizations,
  platformRoles
} from "@/lib/superAdminData";

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Interactive operations state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const handleToggleStatus = (userId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setUsers(users.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    showAlert(`User status updated to ${nextStatus}.`);
  };

  const handleResetPassword = (name) => {
    showAlert(`Password reset link dispatched successfully to ${name}'s registered email.`);
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
    setIsRoleModalOpen(false);
    showAlert(`Role of ${selectedUser.name} updated to ${newRole}.`);
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage("");
    }, 4000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    const matchesOrg = orgFilter === "all" || u.orgId === orgFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;

    return matchesSearch && matchesOrg && matchesStatus;
  });

  // Calculate summary stats
  const totalCount = users.length;
  const activeCount = users.filter(u => u.status === "active").length;
  const suspendedCount = users.filter(u => u.status === "suspended").length;
  const trialCount = users.filter(u => u.status === "trial").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="User Directory" />

      <div className="p-6 space-y-6">
        {/* Toast Alert */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{alertMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cross-Organization Users</h2>
          <p className="text-xs text-slate-500">Monitor and audit all users registered across corporate tenant networks.</p>
        </div>

        {/* User Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Platform Users", value: totalCount, color: "blue", desc: "Registered accounts" },
            { label: "Active Status", value: activeCount, color: "green", desc: "Full system access" },
            { label: "Suspended Status", value: suspendedCount, color: "red", desc: "Temporarily blocked" },
            { label: "Trial Status", value: trialCount, color: "amber", desc: "Evaluation access" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-default">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{card.value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-colors"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Access Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-center">Security Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {u.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs">{u.orgName}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{u.orgId || "Platform"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          {u.role}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          u.status === "suspended" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                          "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {u.lastLogin || "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit User Role"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(u.name)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Force Password Reset"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              u.status === "active"
                                ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title={u.status === "active" ? "Suspend User" : "Activate User"}
                          >
                            {u.status === "active" ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No user accounts match the selected parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change Role Modal */}
        <AnimatePresence>
          {isRoleModalOpen && selectedUser && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">Modify User Role Designation</h3>
                  <button
                    onClick={() => setIsRoleModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveRole} className="p-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs text-slate-400 font-bold">TARGET ACCOUNT</p>
                    <p className="text-sm font-bold text-slate-800">{selectedUser.name}</p>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                    <p className="text-xs text-slate-500 font-medium">{selectedUser.orgName}</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Allocate Platform Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors cursor-pointer"
                    >
                      <option value="Org Admin">Org Admin</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="HR Executive">HR Executive</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="Compliance Officer">Compliance Officer</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsRoleModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
                    >
                      Save Role Change
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
