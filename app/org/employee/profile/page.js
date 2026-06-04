"use client";

import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Calendar, Building,
  Briefcase, Edit, Camera, Shield, Key
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";

export default function MyProfilePage() {
  const { user } = useAuth();

  const profileData = {
    name: user?.name || "Employee",
    email: user?.email || "",
    phone: "+91 98765 43210",
    address: "Hyderabad, Telangana, India",
    joinDate: "Sep 1, 2020",
    department: user?.department || "",
    designation: user?.designation || "",
    employeeId: user?.employeeId || "",
    reportingTo: "Rajesh Kumar (CTO)",
    bloodGroup: "O+",
    emergencyContact: "+91 87654 32109",
    bankAccount: "XXXX XXXX 4521",
    panNumber: "XXXXX1234X",
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Profile" />

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20">
                {profileData.name.split(" ").map(n => n[0]).join("")}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{profileData.name}</h2>
                  <p className="text-sm text-slate-500">{profileData.designation} • {profileData.department}</p>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {profileData.employeeId}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              {[
                { icon: Mail, label: "Email", value: profileData.email },
                { icon: Phone, label: "Phone", value: profileData.phone },
                { icon: MapPin, label: "Address", value: profileData.address },
                { icon: Calendar, label: "Date of Joining", value: profileData.joinDate },
                { icon: User, label: "Blood Group", value: profileData.bloodGroup },
                { icon: Phone, label: "Emergency Contact", value: profileData.emergencyContact },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">{item.label}</p>
                      <p className="text-sm text-slate-800 font-medium">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Work Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Work Information</h3>
            <div className="space-y-4">
              {[
                { icon: Building, label: "Department", value: profileData.department },
                { icon: Briefcase, label: "Designation", value: profileData.designation },
                { icon: User, label: "Reporting To", value: profileData.reportingTo },
                { icon: Shield, label: "PAN Number", value: profileData.panNumber },
                { icon: Key, label: "Bank Account", value: profileData.bankAccount },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">{item.label}</p>
                      <p className="text-sm text-slate-800 font-medium">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-4">Security</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
              <Key className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Change Password</p>
                <p className="text-[10px] text-slate-400">Last changed 30 days ago</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
              <Shield className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Two-Factor Auth</p>
                <p className="text-[10px] text-green-500 font-medium">Enabled</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
