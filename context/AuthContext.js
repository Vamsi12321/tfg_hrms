"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { fakeCredentials, getDefaultRoute } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount only
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tfg_hrms_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem("tfg_hrms_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email, password) => {
    const found = fakeCredentials.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
    );
    if (found) {
      const userData = {
        email: found.email,
        name: found.name,
        role: found.role,
        designation: found.designation,
        department: found.department,
        employeeId: found.employeeId,
      };
      setUser(userData);
      localStorage.setItem("tfg_hrms_user", JSON.stringify(userData));
      return { success: true, role: found.role };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("tfg_hrms_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
