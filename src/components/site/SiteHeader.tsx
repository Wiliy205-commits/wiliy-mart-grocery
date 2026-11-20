import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogIn, LogOut, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAccountSession } from "@/lib/account-session";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/products", label: "Produk" },
  { to: "/categories", label: "Kategori" },
  { to: "/about", label: "Tentang Kami" },
] as const;

function SearchForm({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { q: q.trim() || undefined } });
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor="site-search" className="sr-only">Cari produk</label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="site-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari beras, minyak, mi instan…"
        maxLength={80}
        className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </form>
  );
}

export function SiteHeader() {
  const qc = useQueryClient();
  const { count, hydrated } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const signOut = async () => {
    await clearAccountSession(qc);
    setOpen(false);
    navigate({ to: "/auth", search: {}, replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4 md:h-20 md:gap-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              search={{}}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden max-w-sm flex-1 md:block">
          <SearchForm />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button asChild variant="ghost" size="icon" title={user ? "Akun saya" : "Masuk atau daftar"}>
            {user ? <Link to="/my-account" aria-label="Akun saya"><UserRound /></Link> : <Link to="/account" aria-label="Masuk atau daftar"><UserRound /></Link>}
          </Button>
          {isAdmin && (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/admin"><LayoutDashboard /> Admin</Link>
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={signOut} aria-label="Keluar">
              <LogOut />
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="icon" className="relative size-11">
            <Link to="/cart" aria-label={`Keranjang, ${hydrated ? count : 0} item`}>
              <ShoppingBag className="size-5!" />
              {hydrated && count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label="Buka menu">
                <Menu className="size-5!" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm bg-background">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 px-4">
                <SearchForm onDone={() => setOpen(false)} />
                <nav className="flex flex-col" aria-label="Navigasi seluler">
                  {user && <Link to="/my-account" onClick={() => setOpen(false)} className="border-b border-border py-4 font-display text-2xl">Akun saya</Link>}
                  {NAV.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      search={{}}
                      onClick={() => setOpen(false)}
                      className="border-b border-border py-4 font-display text-2xl"
                    >
                      {n.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="border-b border-border py-4 font-display text-2xl">
                      Dashboard Admin
                    </Link>
                  )}
                </nav>
                {user ? (
                  <Button variant="outline" onClick={signOut}><LogOut /> Keluar</Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/account" onClick={() => setOpen(false)}><LogIn /> Masuk / Daftar</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchForm />
      </div>
    </header>
  );
}
