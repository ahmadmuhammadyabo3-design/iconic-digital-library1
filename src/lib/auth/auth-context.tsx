"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import type { ProfileRow, UserRole } from "../supabase/types";
import { MOCK_PROFILES } from "../supabase/mock-data";

interface AuthContextType {
  user: User | null;
  profile: ProfileRow | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    studentStaffId?: string,
    departmentId?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  switchDemoRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, department:departments(*)")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as unknown as ProfileRow);
        return;
      }
    } catch {
      // Ignore error and fall through
    }

    // Fallback profile if profiles table not created or record missing
    const defaultProfile: ProfileRow = {
      id: userId,
      email: userEmail || "user@iconic-library.edu",
      full_name: userEmail?.split("@")[0] || "Institutional Member",
      avatar_url: null,
      role: "student",
      department_id: null,
      student_staff_id: "IDL-8021",
      phone: null,
      bio: null,
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProfile(defaultProfile);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id, session.user.email);
        } else {
          const savedRole = (typeof window !== "undefined" &&
            (localStorage.getItem("iconic_demo_role") as UserRole)) || null;
          if (savedRole && savedRole !== "guest") {
            setDemoRole(savedRole);
            const foundMock = MOCK_PROFILES.find((p) => p.role === savedRole) || null;
            setProfile(foundMock);
          } else {
            setUser(null);
            setProfile(null);
            setDemoRole(null);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setDemoRole(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
        setDemoRole(null);
      } else {
        setUser(null);
        if (demoRole && demoRole !== "guest") {
          const found = MOCK_PROFILES.find((p) => p.role === demoRole) || null;
          setProfile(found);
        } else {
          setProfile(null);
          setDemoRole(null);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [demoRole, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase auth fails (e.g. invalid credentials or network/demo), check if matching demo user
        const matchedDemo = MOCK_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
        if (matchedDemo) {
          setDemoRole(matchedDemo.role);
          setProfile(matchedDemo);
          if (typeof window !== "undefined") {
            localStorage.setItem("iconic_demo_role", matchedDemo.role);
          }
          return { error: null };
        }
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email);
      }
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    studentStaffId?: string,
    departmentId?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_staff_id: studentStaffId,
            department_id: departmentId,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email);
      }
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Continue cleanup
    }
    setUser(null);
    setDemoRole(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("iconic_demo_role");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const switchDemoRole = (newRole: UserRole) => {
    if (newRole === "guest") {
      setDemoRole(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("iconic_demo_role");
      }
    } else {
      setDemoRole(newRole);
      if (typeof window !== "undefined") {
        localStorage.setItem("iconic_demo_role", newRole);
      }
      const found = MOCK_PROFILES.find((p) => p.role === newRole);
      setProfile(found || null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const currentRole: UserRole = demoRole || profile?.role || "guest";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        switchDemoRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
