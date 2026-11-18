import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Banknote, Package, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, ORDER_STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [orders, products] = await Promise.all([
        supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, stock, is_active"),
      ]);
      if (orders.error) throw orders.error;
      if (products.error) throw products.error;
      return { orders: orders.data, products: products.data };
    },
  });

  if (isLoading) return <div className="flex items-center gap-2 py-16 text-muted-foreground" role="status"><Loader2 className="animate-spin" /> Memuat data…</div>;
  if (error || !data) return <p className="py-16 text-destructive">Gagal memuat data: {error?.message}</p>;

  const valid = data.orders.filter((o) => o.status !== "cancelled");
  const revenue = data.orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const pipeline = valid.filter((o) => o.status !== "completed").reduce((s, o) => s + o.total, 0);
  const lowStock = data.products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const daily = days.map((d) => {
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const total = valid.filter((o) => { const t = new Date(o.created_at); return t >= d && t < next; }).reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString("id-ID", { weekday: "short" }), total };
  });
  const max = Math.max(1, ...daily.map((d) => d.total));

  const stats = [
    { label: "Pendapatan (pesanan selesai)", value: formatRupiah(revenue), icon: Banknote },
    { label: "Nilai pesanan berjalan", value: formatRupiah(pipeline), icon: Banknote },
    { label: "Total pesanan", value: String(data.orders.length), icon: ShoppingCart },
    { label: "Total produk", value: String(data.products.length), icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl bg-card p-5 shadow-soft">
            <Icon className="size-5 text-muted-foreground" />
            <p className="mt-4 text-xl font-bold tabular-nums md:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="text-xl">Penjualan 7 hari terakhir</h2>
          <div className="mt-6 flex h-48 items-end gap-2" role="img" aria-label="Grafik penjualan harian">
            {daily.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-primary transition-all" style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }} title={formatRupiah(d.total)} />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-xl"><AlertTriangle className="size-5 text-warning" /> Stok menipis</h2>
          {lowStock.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Semua stok aman.</p> : (
            <ul className="mt-4 space-y-2 text-sm">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className={p.stock === 0 ? "font-semibold text-destructive" : "font-semibold text-warning"}>{p.stock}</span></li>
              ))}
            </ul>
          )}
          <Link to="/admin/products" className="mt-4 inline-block text-sm font-semibold hover:underline">Kelola stok →</Link>
        </section>
      </div>
      <section className="rounded-3xl bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between"><h2 className="text-xl">Pesanan terbaru</h2><Link to="/admin/orders" className="text-sm font-semibold hover:underline">Lihat semua →</Link></div>
        {data.orders.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Belum ada pesanan.</p> : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {data.orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span className="font-medium">{o.order_number} · {o.customer_name}</span>
                <span className="text-muted-foreground">{ORDER_STATUS_LABEL[o.status]} · <span className="tabular-nums text-foreground">{formatRupiah(o.total)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
