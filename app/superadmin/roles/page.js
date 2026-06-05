"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Plus, Check, X,
  HelpCircle, Info
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  organizations,
  platformRoles as initialRoles,
  allPermissions
} from "@/lib/superAdminData";

export default function RolesPage() {
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || "");
  const [roles, setRoles] = useState(initialRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [modalOrgId, setModalOrgId] = useState(selectedOrgId);

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
  const orgRoles = roles.filter((r) => r.orgId === selectedOrgId);

  const handleOpenAdd = () => {
    setRoleName("");
    setRoleDesc("");
    setSelectedPermissions([]);
    setModalOrgId(selectedOrgId);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!roleName) return;

    const targetOrg = organizations.find((o) => o.id === modalOrgId);

    const newRole = {
      id: `ROLE${String(roles.length + 1).padStart(3, "0")}`,
      orgId: modalOrgId,
      orgName: targetOrg ? targetOrg.name : "Unknown Organization",
      name: roleName,
      description: roleDesc,
      usersCount: 0,
      permissions: selectedPermissions,
    };

    setRoles([...roles, newRole]);
    setIsModalOpen(false);

    if (modalOrgId !== selectedOrgId) {
      setSelectedOrgId(modalOrgId);
    }
  };

  const handleDeleteRole = (id) => {
    if (confirm("Are you sure you want to delete this role template? Users assigned to this role might lose access.")) {
      setRoles(roles.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Roles & Security Matrix" />

      <div className="p-6 space-y-6">
        {/* Header and selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tenant Roles & Access Matrix</h2>
            <p className="text-xs text-slate-500">Configure role templates and visual permission profiles per organization.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Org:</span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.plan})
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-orange-500/10"
            >
              <Plus className="w-4 h-4" /> Create Role
            </motion.button>
          </div>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-800">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Multi-tenant Security Rule:</span> Roles created here are isolated strictly within the selected organization{" "}
            <span className="font-bold underline">({selectedOrg?.name})</span>. As a Platform Super Admin, you define templates that organization administrators can assign to their employees.
          </div>
        </div>

        {/* Main Grid: Roles List + Visual Matrix */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Roles List Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Roles Defined ({orgRoles.length})</h3>
              <div className="space-y-3">
                {orgRoles.length > 0 ? (
                  orgRoles.map((role) => (
                    <div
                      key={role.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-amber-200 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <h4 className="text-sm font-bold text-slate-800">{role.name}</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          title="Delete Role"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{role.description}</p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                        <span>{role.permissions.length} PERMISSIONS</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase">
                          {role.usersCount} Active Users
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                    No roles created for this tenant yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-2">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Interactive Permission Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Audit permission allocations side-by-side</p>
                </div>
                <HelpCircle className="w-4 h-4 text-slate-300" title="Grid represents what features are enabled per role profile" />
              </div>

              {orgRoles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Permission Policy</th>
                        {orgRoles.map((role) => (
                          <th key={role.id} className="py-3 px-4 text-center text-xs font-black text-slate-700 capitalize min-w-[100px]">
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {allPermissions.map((catObj) => (
                        <AnimatePresence key={catObj.category}>
                          <tr className="bg-slate-50/50">
                            <td
                              colSpan={orgRoles.length + 1}
                              className="py-2 px-4 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50"
                            >
                              {catObj.category}
                            </td>
                          </tr>
                          {catObj.permissions.map((p) => (
                            <tr key={p} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-2.5 px-4 font-mono text-slate-600">{p}</td>
                              {orgRoles.map((role) => {
                                const hasPermission = role.permissions.includes(p);
                                return (
                                  <td key={role.id} className="py-2.5 px-4 text-center">
                                    <div className="flex justify-center">
                                      {hasPermission ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-200 bg-white" />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </AnimatePresence>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium">
                  Select or create roles to view the security matrix grid.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Role Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">Define New Role Profile</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Role Profile Name</label>
                      <input
                        type="text"
                        required
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="e.g. Department Manager"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Assign to Tenant</label>
                      <select
                        value={modalOrgId}
                        onChange={(e) => setModalOrgId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
                      <input
                        type="text"
                        value={roleDesc}
                        onChange={(e) => setRoleDesc(e.target.value)}
                        placeholder="Brief summary of duties and route accesses"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100 my-2" />

                  {/* Permissions Selection Grid */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3">Allocate Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[260px] overflow-y-auto pr-1">
                      {allPermissions.map((categoryObj) => (
                        <div key={categoryObj.category} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                          <h5 className="text-xs font-extrabold text-slate-700 mb-2 border-b border-slate-100 pb-1">{categoryObj.category}</h5>
                          <div className="space-y-1.5">
                            {categoryObj.permissions.map((p) => {
                              const isChecked = selectedPermissions.includes(p);
                              return (
                                <label key={p} className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(p)}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                                  />
                                  <span className="text-[11px] font-mono text-slate-600">{p}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
                    >
                      Create Role Profile
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
