"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Users, Brain } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect away
  useEffect(() => {
    if (!loading && user) {
      router.replace(getDefaultRoute(user.role));
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const result = login(email, password);
    if (result.success) {
      router.replace(getDefaultRoute(result.role));
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const quickLogin = (email, password) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-indigo-700 to-purple-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">TFG HRMS</h1>
                <p className="text-xs text-blue-200">AI-Powered Platform</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Manage your workforce with intelligence
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed mb-8">
              AI-powered insights, predictive analytics, mood tracking, and smart automation — everything you need to build a thriving workplace.
            </p>

            <div className="space-y-4">
              {[
                { icon: Brain, text: "AI-powered attrition prediction" },
                { icon: Users, text: "Employee wellness & mood tracking" },
                { icon: ShieldCheck, text: "Role-based access control" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-blue-200" />
                  </div>
                  <span className="text-sm text-blue-100">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900">TFG <span className="text-brand-600">HRMS</span></span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to your account to continue</p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-6"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Login Cards */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3">Quick Login (Demo Credentials)</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "HR Director", email: "priya@tfg.com", pass: "admin123", role: "hr", color: "blue" },
                { label: "Employee (Tech Lead)", email: "vikram@tfg.com", pass: "emp123", role: "employee", color: "green" },
                { label: "Employee (Marketing)", email: "sneha@tfg.com", pass: "emp123", role: "employee", color: "amber" },
                { label: "Super Admin", email: "admin@tfg.com", pass: "super123", role: "admin", color: "purple" },
              ].map((cred, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => quickLogin(cred.email, cred.pass)}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-${cred.color}-50 flex items-center justify-center`}>
                    <span className={`text-[10px] font-black text-${cred.color}-600 uppercase`}>{cred.role[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-800">{cred.label}</p>
                    <p className="text-[10px] text-slate-400">{cred.email} / {cred.pass}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
