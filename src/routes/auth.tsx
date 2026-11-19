import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordField, FormMessage } from "@/components/account/Fields";
import { loginWithIdentity } from "@/lib/account.functions";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

type AuthSearch = { redirect?: string | undefined };

function safePath(p: string | undefined) {
  if (!p) return "/my-account";
  try {
    const u = new URL(p, "http://x");
    if (u.origin !== "http://x" && typeof window !== "undefined" && u.origin !== window.location.origin) return "/my-account";
    const path = u.pathname + u.search;
    return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/auth") ? path : "/my-account";
  } catch {
    return "/my-account";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Masuk — Wiliy Mart" },
       { name: "description", content: "Masuk ke Wiliy Mart untuk mengelola profil, alamat, dan pesanan Anda." },
      { property: "og:title", content: "Masuk — Wiliy Mart" },
      { property: "og:description", content: "Masuk ke akun Wiliy Mart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const target = safePath(redirect);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const login = useServerFn(loginWithIdentity);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const saved = sessionStorage.getItem("wiliy-auth-redirect");
      sessionStorage.removeItem("wiliy-auth-redirect");
      navigate({ to: safePath(saved ?? redirect), replace: true });
    }
  }, [user, loading, target, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
     if (!email.trim() || !password) {
       setMessage("Masukkan email atau username dan kata sandi");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await login({ data: { identity: email, password } });
      if (!result.ok) throw new Error(result.error);
      sessionStorage.setItem("wiliy-session-only", remember ? "0" : "1");
      if (remember) localStorage.removeItem("wiliy-session-only");
      else localStorage.setItem("wiliy-session-only", "1");
      const { error } = await supabase.auth.setSession(result.session);
      if (error) throw error;
      toast.success("Berhasil masuk");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    sessionStorage.setItem("wiliy-auth-redirect", target);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Gagal masuk dengan Google");
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-7 shadow-soft md:p-10">
        <h1 className="text-3xl font-medium">Masuk ke Wiliy Mart</h1>
        <p className="mt-2 text-sm text-muted-foreground">Selamat datang kembali.</p>
        <Button type="button" variant="outline" className="mt-8 h-12 w-full" onClick={google}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Lanjutkan dengan Google
        </Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email atau username</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" maxLength={255} className="h-12 rounded-2xl" />
          </div>
          <PasswordField id="password" label="Kata sandi" value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><div className="flex items-center gap-2"><Checkbox id="remember" checked={remember} onCheckedChange={v => setRemember(v === true)} /><Label htmlFor="remember">Ingat saya</Label></div><Link to="/forgot-password" className="underline">Lupa password?</Link></div>
          <FormMessage message={message} />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Masuk
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Belum punya akun? <Link to="/register" className="font-semibold text-foreground underline">Daftar sekarang</Link></p>
      </div>
    </div>
  );
}
