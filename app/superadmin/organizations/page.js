"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Search, Filter, ShieldCheck, Mail, Globe,
  MoreVertical, Edit2, Ban, CheckCircle2, X, AlertTriangle, Users
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { organizations as initialOrgs } from "@/lib/superAdminData";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  
  // Form state
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [plan, setPlan] = useState("Starter");
  const [status, setStatus] = useState("active");
  const [employeeCount, setEmployeeCount] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [country, setCountry] = useState("India");

  const handleOpenAdd = () => {
    setEditingOrg(null);
    setName("");
    setDomain("");
    setPlan("Starter");
    setStatus("active");
    setEmployeeCount("1");
    setAdminName("");
    setAdminEmail("");
    setIndustry("Technology");
    setCountry("India");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setName(org.name);
    setDomain(org.domain);
    setPlan(org.plan);
    setStatus(org.status);
    setEmployeeCount(org.employeeCount.toString());
    setAdminName(org.adminName);
    setAdminEmail(org.adminEmail);
    setIndustry(org.industry || "Technology");
    setCountry(org.country || "India");
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingOrg) {
      // Edit existing
      setOrgs(
        orgs.map((o) =>
          o.id === editingOrg.id
            ? {
                ...o,
                name,
                domain,
                plan,
                status,
                employeeCount: parseInt(employeeCount) || 0,
                adminName,
                adminEmail,
                industry,
                country,
                monthlyRevenue: plan === "Enterprise" ? 49900 : plan === "Business" ? 19900 : 4900,
              }
            : o
        )
      );
    } else {
      // Add new
      const newOrg = {
        id: `ORG${String(orgs.length + 1).padStart(3, "0")}`,
        name,
        domain,
        plan,
        status,
        employeeCount: parseInt(employeeCount) || 0,
        adminName,
        adminEmail,
        createdAt: new Date().toISOString().split("T")[0],
        industry,
        country,
        monthlyRevenue: plan === "Enterprise" ? 49900 : plan === "Business" ? 19900 : 4900,
      };
      setOrgs([...orgs, newOrg]);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setOrgs(orgs.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this organization? This action is irreversible.")) {
      setOrgs(orgs.filter((o) => o.id !== id));
    }
  };

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.domain.toLowerCase().includes(search.toLowerCase()) ||
      org.adminName.toLowerCase().includes(search.toLowerCase()) ||
      org.adminEmail.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    const matchesPlan = planFilter === "all" || org.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
        </span>;
      case "suspended":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
        </span>;
      case "trial":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Trial
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Organization Directory" />

      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Tenant Organizations</h2>
            <p className="text-xs text-slate-500">Configure corporate tenants, monitor billing plans, status, and system size.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Add Organization
          </motion.button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, domain, admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Filters:</span>
            </div>
            
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

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-colors"
            >
              <option value="all">All Plans</option>
              <option value="Starter">Starter</option>
              <option value="Business">Business</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Organization Name</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Plan / Billing</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Employees</th>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredOrgs.length > 0 ? (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center`}>
                            <Building2 className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{org.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{org.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {org.domain}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-md ${
                            org.plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                            org.plan === "Business" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            {org.plan}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">₹{org.monthlyRevenue.toLocaleString()}/mo</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(org.status)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {org.employeeCount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{org.adminName}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {org.adminEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {org.createdAt}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Tenant"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(org.id, org.status)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              org.status === "active"
                                ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title={org.status === "active" ? "Suspend Organization" : "Re-activate Organization"}
                          >
                            {org.status === "active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No organizations matched the search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Organization Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">
                    {editingOrg ? `Edit ${editingOrg.name}` : "Add New Organization"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Organization Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Zenith Tech Corp"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Domain Domain</label>
                      <input
                        type="text"
                        required
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="e.g. zenithtech.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Subscription Plan</label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors"
                      >
                        <option value="Starter">Starter (₹4,900/mo)</option>
                        <option value="Business">Business (₹19,900/mo)</option>
                        <option value="Enterprise">Enterprise (₹49,900/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors"
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Initial Employee Count</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100 my-2" />

                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Primary Administrator</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Admin Name</label>
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Admin Email</label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="e.g. admin@zenithtech.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Industry</label>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. Technology"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                      />
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
                      Save Tenant
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
