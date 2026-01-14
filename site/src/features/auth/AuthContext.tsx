import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSupabaseClient } from "@core/lib/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDevBypass: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (
    provider: "google" | "github"
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

// Dev Auth Bypass Configuration (PRD 0058)
const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === "true";
const DEV_AUTH_USER_EMAIL =
  import.meta.env.DEV_AUTH_USER_EMAIL || "dev@example.com";
const DEV_AUTH_USER_NAME = import.meta.env.DEV_AUTH_USER_NAME || "Dev Admin";

// Create mock user for development
function createMockUser(): User {
  return {
    id: "dev-mock-user-id-12345",
    email: DEV_AUTH_USER_EMAIL,
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: { provider: "dev-bypass" },
    user_metadata: {
      name: DEV_AUTH_USER_NAME,
      full_name: DEV_AUTH_USER_NAME,
      role: "admin",
    },
  } as User;
}

// Create mock session for development
function createMockSession(): Session {
  return {
    access_token: "DEV_MOCK_TOKEN",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    refresh_token: "dev-mock-refresh-token",
    user: createMockUser(),
  } as Session;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV AUTH BYPASS (PRD 0058): Skip real authentication in dev mode
    if (DEV_AUTH_BYPASS && import.meta.env.MODE !== "production") {
      console.warn("🚨 DEV AUTH BYPASS MODE ACTIVE 🚨");
      console.warn("Using mock user:", DEV_AUTH_USER_EMAIL);

      const mockUser = createMockUser();
      const mockSession = createMockSession();

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }

    // Normal Supabase auth flow
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isDevBypass: DEV_AUTH_BYPASS && import.meta.env.MODE !== "production",
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

