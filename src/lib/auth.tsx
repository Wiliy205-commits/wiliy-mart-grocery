import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { finishPendingAvatar } from "./pending-avatar";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { user: User | null; isAdmin: boolean; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });

async function checkAdmin(userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export function AuthProvider({ children, onIdentityChange }: { children: ReactNode; onIdentityChange?: (event: string) => void }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    let active = true;
    const sync = async (user: User | null) => {
      if (user) { try { await finishPendingAvatar(user.id); } catch { toast.error("Foto belum tersimpan. Unggah kembali melalui Profil saya."); } }
      const isAdmin = user ? await checkAdmin(user.id) : false;
      if (active) setState({ user, isAdmin, loading: false });
    };
    if (localStorage.getItem("wiliy-session-only") === "1" && sessionStorage.getItem("wiliy-session-only") !== "1") {
      void supabase.auth.signOut().then(() => { localStorage.removeItem("wiliy-session-only"); void sync(null); });
    } else {
      supabase.auth.getUser().then(({ data }) => sync(data.user ?? null));
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { sessionStorage.setItem("wiliy-recovery", String(Date.now())); setTimeout(() => sync(session?.user ?? null), 0); return; }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Defer to avoid calling Supabase inside the auth callback.
      setTimeout(() => sync(session?.user ?? null), 0);
      onIdentityChange?.(event);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [onIdentityChange]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
