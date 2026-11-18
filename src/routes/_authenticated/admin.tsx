import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShieldAlert, ShoppingCart, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    return { isAdmin: data === true };
  },
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Wiliy Mart" },
      { name: "description", content: "Kelola produk, kategori, stok dan pesanan Wiliy Mart." },
      { property: "og:title", content: "Dashboard Admin — Wiliy Mart" },
      { property: "og:description", content: "Area pengelola toko." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
  { to: "/admin/products", label: "Produk & Stok", icon: Package },
  { to: "/admin/categories", label: "Kategori", icon: Tags },
] as const;

function AdminLayout() {
  const { isAdmin } = Route.useRouteContext();
  if (!isAdmin) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16">
        <div className="max-w-md rounded-[2rem] bg-card p-10 text-center shadow-soft">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-3xl">Akses ditolak</h1>
          <p className="mt-2 text-muted-foreground">Akun Anda tidak memiliki hak akses admin.</p>
          <Button asChild className="mt-6"><Link to="/">Kembali ke beranda</Link></Button>
        </div>
      </div>
    );
  }
  return (
    <div className="container-page pt-8 md:pt-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2">Admin</p>
          <h1 className="text-3xl font-medium md:text-4xl">Dashboard Wiliy Mart</h1>
        </div>
        <nav className="-mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" aria-label="Navigasi admin">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: "exact" in rest }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
