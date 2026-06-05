"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, ShieldAlert } from "lucide-react";
import { getDefaultRoute } from "@/lib/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

const mapUserProfile = (data) => {
  // Normalize the role from backend format to frontend routing format
  let rawRole = (data.role || "employee").toLowerCase().trim();
  
  // Map backend role names to internal routing role keys
  const roleMap = {
    "superadmin": "superadmin",
    "super_admin": "superadmin",
    "org_admin": "orgadmin",
    "orgadmin": "orgadmin",
    "hr_admin": "hr",
    "hr_manager": "hr",
    "hr": "hr",
    "employee": "employee",
  };

  const normalizedRole = roleMap[rawRole] || "employee";

  return {
    id: data.id,
    email: data.email,
    name: data.full_name || data.name || "User",
    role: normalizedRole,
    is_active: data.is_active !== false,
    is_verified: data.is_verified || false,
    designation: normalizedRole === "superadmin" 
      ? "Super Admin" 
      : normalizedRole === "orgadmin" 
        ? "Org Admin" 
        : normalizedRole === "hr" 
          ? "HR Manager" 
          : "Employee",
    department: normalizedRole === "superadmin" 
      ? "Platform Management" 
      : normalizedRole === "orgadmin" 
        ? "Management" 
        : normalizedRole === "hr" 
          ? "Human Resources" 
          : "General",
    employeeId: data.id || "EMP000",
    requires_password_change: !!data.requires_password_change,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skippedPasswordChange, setSkippedPasswordChange] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const router = useRouter();

  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy", {
        method: "GET",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/me",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const userData = mapUserProfile(data);
        try {
          const stored = localStorage.getItem("tfg_hrms_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.email === userData.email && parsed.requires_password_change !== undefined) {
              userData.requires_password_change = parsed.requires_password_change;
            }
          }
        } catch {}
        setUser(userData);
        localStorage.setItem("tfg_hrms_user", JSON.stringify(userData));
      } else if (res.status === 401) {
        // Attempt token refresh
        const refreshRes = await fetch("/api/proxy", {
          method: "POST",
          credentials: "include",
          headers: {
            "x-target-path": "/hrms/auth/refresh",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (refreshRes.ok) {
          // Retry get profile
          const retryRes = await fetch("/api/proxy", {
            method: "GET",
            credentials: "include",
            headers: {
              "x-target-path": "/hrms/auth/me",
            },
          });

          if (retryRes.ok) {
            const data = await retryRes.json();
            const userData = mapUserProfile(data);
            try {
              const stored = localStorage.getItem("tfg_hrms_user");
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.email === userData.email && parsed.requires_password_change !== undefined) {
                  userData.requires_password_change = parsed.requires_password_change;
                }
              }
            } catch {}
            setUser(userData);
            localStorage.setItem("tfg_hrms_user", JSON.stringify(userData));
            setLoading(false);
            return;
          }
        }
        
        // If refresh fails
        setUser(null);
        localStorage.removeItem("tfg_hrms_user");
      }
    } catch (err) {
      console.error("Failed to verify auth status:", err);
      // Fallback to localStorage if offline / network failure
      const stored = localStorage.getItem("tfg_hrms_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);


  const login = async (email, password) => {
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/login",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let errMsg = "Invalid email or password";
        if (res.status === 403) {
          errMsg = "Account is inactive";
        } else {
          try {
            const errData = await res.json();
            if (errData.detail) {
              errMsg = typeof errData.detail === "string" 
                ? errData.detail 
                : Array.isArray(errData.detail)
                  ? errData.detail.map(e => e.msg).join(", ")
                  : JSON.stringify(errData.detail);
            } else if (errData.error) {
              errMsg = errData.error;
            }
          } catch {}
        }
        return { success: false, error: errMsg };
      }

      const loginData = await res.json();
      const requiresPasswordChange = !!loginData.requires_password_change;

      // Login successful, retrieve current profile
      const meRes = await fetch("/api/proxy", {
        method: "GET",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/me",
        },
      });

      if (!meRes.ok) {
        return { success: false, error: "Failed to retrieve user profile" };
      }

      const meData = await meRes.json();
      const userData = mapUserProfile(meData);
      userData.requires_password_change = requiresPasswordChange;
      setUser(userData);
      localStorage.setItem("tfg_hrms_user", JSON.stringify(userData));
      return { success: true, role: userData.role, requiresPasswordChange };
    } catch (err) {
      console.error("Login request failed:", err);
      return { success: false, error: "Network error occurred. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/proxy", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/logout",
        },
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    setUser(null);
    localStorage.removeItem("tfg_hrms_user");
  };

  const forgotPassword = async (email) => {
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/forgot-password",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        let errMsg = "Failed to request password reset OTP";
        try {
          const errData = await res.json();
          if (errData.detail) {
            errMsg = typeof errData.detail === "string"
              ? errData.detail
              : JSON.stringify(errData.detail);
          }
        } catch {}
        return { success: false, error: errMsg };
      }

      return { success: true };
    } catch (err) {
      console.error("Forgot password request failed:", err);
      return { success: false, error: "Network error occurred." };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/reset-password",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      if (!res.ok) {
        let errMsg = "Failed to reset password. Check OTP and password requirements.";
        try {
          const errData = await res.json();
          if (errData.detail) {
            errMsg = typeof errData.detail === "string"
              ? errData.detail
              : JSON.stringify(errData.detail);
          }
        } catch {}
        return { success: false, error: errMsg };
      }

      return { success: true };
    } catch (err) {
      console.error("Reset password request failed:", err);
      return { success: false, error: "Network error occurred." };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-target-path": "/hrms/auth/change-password",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      if (!res.ok) {
        let errMsg = "Failed to change password. Make sure current password is correct and the new password meets requirements.";
        try {
          const errData = await res.json();
          if (errData.detail) {
            errMsg = typeof errData.detail === "string"
              ? errData.detail
              : JSON.stringify(errData.detail);
          }
        } catch {}
        return { success: false, error: errMsg };
      }

      if (user) {
        const updatedUser = { ...user, requires_password_change: false };
        setUser(updatedUser);
        localStorage.setItem("tfg_hrms_user", JSON.stringify(updatedUser));
      }
      return { success: true };
    } catch (err) {
      console.error("Change password request failed:", err);
      return { success: false, error: "Network error occurred." };
    }
  };

  const openChangePassword = () => setIsChangePasswordOpen(true);
  const closeChangePassword = () => setIsChangePasswordOpen(false);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, forgotPassword, resetPassword, changePassword, openChangePassword }}>
      {children}
      {isChangePasswordOpen && (
        <ChangePasswordModal 
          user={user} 
          changePassword={changePassword} 
          onSkip={closeChangePassword} 
          isMandatory={false}
        />
      )}
    </AuthContext.Provider>
  );
}

function ChangePasswordModal({ user, changePassword, onSkip, isMandatory }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setError("Password must contain uppercase, lowercase, numbers, and special characters.");
      setLoading(false);
      return;
    }
    if (newPassword === oldPassword) {
      setError("New password must be different from current password.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onSkip(); // Closes the modal
        }, 2000);
      } else {
        setError(res.error);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 p-6 text-white relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={onSkip}
              className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              title={isMandatory ? "Skip for now" : "Close"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{isMandatory ? "Reset Default Password" : "Change Password"}</h3>
              <p className="text-[9px] text-blue-100 uppercase tracking-widest font-semibold">Security</p>
            </div>
          </div>
          <p className="text-[11px] text-blue-100 leading-relaxed mt-2">
            {isMandatory 
              ? "This is your first login with a temporary password. For account safety, please set a new password."
              : "Update your account password. Make sure it is strong and secure."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex gap-2.5 items-center text-rose-700 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex gap-2.5 items-center text-emerald-700 text-xs font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Password updated successfully! Redirecting...</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showOld ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">New Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save New Password
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
