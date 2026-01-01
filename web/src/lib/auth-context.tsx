"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

// RBAC roles
export type UserRole = "coach" | "scorer" | "viewer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  setUserRole: (role: UserRole) => void;
  devLogin: (email: string, role: UserRole) => void; // Development mode bypass
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  // TEMPORARY: Force dev mode to true if Supabase is not configured
  const [isDevMode, setIsDevMode] = useState(!isSupabaseConfigured);

  // Development mode detection (client-side only to avoid hydration mismatch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isDev = !isSupabaseConfigured ||
                    hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    process.env.NODE_ENV === 'development';
      setIsDevMode(isDev);
    }
  }, []);

  // Get stored role or determine from email
  const getUserRole = (user: User): UserRole => {
    // First check localStorage for stored role (only in browser)
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem(`user_role_${user.id}`);
      if (storedRole && ["coach", "scorer", "viewer"].includes(storedRole)) {
        return storedRole as UserRole;
      }
    }

    // Fallback to email-based detection
    const email = user.email?.toLowerCase() || "";
    if (email.includes("coach")) return "coach";
    if (email.includes("scorer")) return "scorer";

    // Default role for new users
    return "viewer";
  };

  // Function to update user role
  const setUserRole = (newRole: UserRole) => {
    if (user && typeof window !== "undefined") {
      localStorage.setItem(`user_role_${user.id}`, newRole);
      setRole(newRole);
    }
  };

  useEffect(() => {
    // Skip Supabase auth if not configured
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const client = supabase; // Capture for TypeScript narrowing

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Get user role from metadata or database
        const userRole = getUserRole(session.user);
        setRole(userRole);
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userRole = getUserRole(session.user);
        setRole(userRole);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') };
    }

    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "/auth/callback";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear dev mode session
    if (isDevMode && typeof window !== "undefined") {
      localStorage.removeItem("dev_user");
      localStorage.removeItem("dev_role");
      setUser(null);
      setSession(null);
      setRole(null);
      return { error: null };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Development mode bypass - creates a mock user session
  const devLogin = (email: string, userRole: UserRole) => {
    if (!isDevMode || typeof window === "undefined") return;

    const mockUser = {
      id: "dev-user-" + Date.now(),
      email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;

    const mockSession = {
      access_token: "dev-token",
      refresh_token: "dev-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: mockUser,
    } as Session;

    // Store in localStorage for persistence across refreshes
    localStorage.setItem("dev_user", JSON.stringify(mockUser));
    localStorage.setItem("dev_role", userRole);

    setUser(mockUser);
    setSession(mockSession);
    setRole(userRole);
  };

  // Load dev mode session on mount
  useEffect(() => {
    if (typeof window === "undefined") return; // Skip on server

    if (isDevMode && !user) {
      const devUser = localStorage.getItem("dev_user");
      const devRole = localStorage.getItem("dev_role");

      if (devUser && devRole) {
        const parsedUser = JSON.parse(devUser);
        const mockSession = {
          access_token: "dev-token",
          refresh_token: "dev-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user: parsedUser,
        } as Session;

        setUser(parsedUser);
        setSession(mockSession);
        setRole(devRole as UserRole);
      }
    }
  }, [isDevMode, user]);

  const value = {
    user,
    session,
    role,
    loading,
    signIn,
    signOut,
    setUserRole,
    devLogin,
    isDevMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Role-based access control hooks
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, role, loading } = useAuth();

  const hasAccess =
    user && (!requiredRole || role === requiredRole || role === "coach");

  return {
    user,
    role,
    loading,
    hasAccess,
    isAuthenticated: !!user,
  };
}

export function useRoleAccess() {
  const { role } = useAuth();

  return {
    isCoach: role === "coach",
    isScorer: role === "scorer" || role === "coach",
    isViewer: !!role,
    canEdit: role === "coach" || role === "scorer",
    canManage: role === "coach",
  };
}
