"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, ShieldCheck, Wrench, AlertCircle, Monitor, Smartphone, MessageSquare } from "lucide-react";
import TopBar from "@/components/TopBar";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function MyAssetsPage() {
  const [activeTab, setActiveTab] = useState("my_assets");

  // Mock Data
  const myAssets = [
    { 
      id: "LAP-042", 
      name: "MacBook Pro M2 (2023)", 
      type: "Laptop",
      icon: Monitor,
      assigned_on: "12 Jan 2024",
      warranty_until: "11 Jan 2027",
      status: "active",
      specs: "16GB RAM, 512GB SSD"
    },
    { 
      id: "PHN-012", 
      name: "iPhone 14", 
      type: "Phone",
      icon: Smartphone,
      assigned_on: "15 Mar 2024",
      warranty_until: "14 Mar 2025",
      status: "active",
      specs: "128GB, Midnight"
    },
    { 
      id: "ACC-099", 
      name: "Logitech MX Master 3", 
      type: "Accessory",
      icon: Package,
      assigned_on: "12 Jan 2024",
      warranty_until: "11 Jan 2025",
      status: "maintenance",
      specs: "Wireless Mouse"
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case "active": return "bg-green-50 text-green-600 border-green-200";
      case "maintenance": return "bg-amber-50 text-amber-600 border-amber-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Assets" />

      <div className="p-4 md:p-6 space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {["my_assets", "requests", "policies"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}>
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm transition-all">
            <Wrench className="w-3.5 h-3.5" /> Request Maintenance
          </button>
        </div>

        {/* Dashboard Content */}
        {activeTab === "my_assets" && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {myAssets.map((asset, i) => {
              const Icon = asset.icon;
              return (
                <motion.div key={asset.id} variants={fadeUp} whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{asset.name}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">{asset.id} • {asset.type}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${getStatusColor(asset.status)} capitalize`}>
                      {asset.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-slate-500">Specifications</span>
                      <span className="text-xs font-bold text-slate-700">{asset.specs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-slate-500">Assigned On</span>
                      <span className="text-xs font-bold text-slate-700">{asset.assigned_on}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-slate-500">Warranty Until</span>
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs font-bold text-slate-700">{asset.warranty_until}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Report Issue
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">
                      <AlertCircle className="w-3.5 h-3.5" /> Report Lost
                    </button>
                  </div>

                </motion.div>
              );
            })}

          </motion.div>
        )}
      </div>
    </div>
  );
}
