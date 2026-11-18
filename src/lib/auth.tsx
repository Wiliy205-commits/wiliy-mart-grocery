import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { user: User | null; isAdmin: boolean; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });

async function checkAdmin(userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export function AuthProvider({ children, onIdentityChange }: { children: ReactNode; onIdentityChange?: () => void }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    let active = true;
    const sync = async (user: User | null) => {
      const isAdmin = user ? await checkAdmin(user.id) : false;
      if (active) setState({ user, isAdmin, loading: false });
    };
    supabase.auth.getUser().then(({ data }) => sync(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Defer to avoid calling Supabase inside the auth callback.
      setTimeout(() => sync(session?.user ?? null), 0);
      onIdentityChange?.();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [onIdentityChange]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
