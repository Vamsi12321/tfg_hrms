"use client";

import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ExportButton({ data = [], columns = [], filename = "export.csv" }) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    try {
      if (!data || data.length === 0) return;

      const headers = columns.map(c => `"${String(c.header).replace(/"/g, '""')}"`).join(",");
      const rows = data.map(row => {
        return columns.map(c => {
          let val = c.key ? row[c.key] : c.render ? c.render(row) : "";
          if (val === null || val === undefined) val = "";
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        }).join(",");
      });

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleExport}
      disabled={loading || data.length === 0}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {loading ? "Exporting..." : "Export CSV"}
    </motion.button>
  );
}
