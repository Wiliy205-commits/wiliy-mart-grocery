import { accountHead } from '@/lib/account-schema';
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatRupiah, ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = Database["public"]["Enums"]["order_status"];
const STATUSES: Status[] = ["pending", "processing", "shipped", "completed", "cancelled"];

export const Route = createFileRoute("/_authenticated/admin/orders")({ head:()=>accountHead('Kelola pesanan','Pengelolaan pesanan dan pembayaran Wiliy Mart.'), component: OrdersAdmin });

function OrdersAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; patch: Database["public"]["Tables"]["orders"]["Update"] }) => {
      const { error } = await supabase.from("orders").update(v.patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pesanan diperbarui");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = (id: string, status: Status) => {
    if (status === "cancelled") return setPendingCancel(id);
    update.mutate({ id, patch: { status } });
  };

  if (isLoading) return <div className="flex items-center gap-2 py-16 text-muted-foreground" role="status"><Loader2 className="animate-spin" /> Memuat pesanan…</div>;
  if (error) return <p className="py-16 text-destructive">Gagal memuat: {error.message}</p>;
  const orders = (data ?? []).filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full border px-4 py-1.5 text-sm", filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
            {s === "all" ? "Semua" : ORDER_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {orders.length === 0 ? <div className="rounded-3xl bg-card p-10 text-center text-muted-foreground shadow-soft">Belum ada pesanan.</div> : orders.map((o) => (
        <article key={o.id} className="rounded-3xl bg-card p-5 shadow-soft md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-display text-xl">{o.order_number}</p>
              <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as Status)} disabled={o.status === "cancelled" || update.isPending}>
                <SelectTrigger className="w-40 rounded-full" aria-label="Status pesanan"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
              {o.payment_method === "bank_transfer" && (
                <Button size="sm" variant={o.payment_verified ? "secondary" : "outline"} disabled={update.isPending} onClick={() => update.mutate({ id: o.id, patch: { payment_verified: !o.payment_verified } })}>
                  {o.payment_verified ? "Pembayaran terverifikasi ✓" : "Tandai pembayaran terverifikasi"}
                </Button>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-6 text-sm md:grid-cols-2">
            <dl className="space-y-1.5">
              <div><dt className="inline text-muted-foreground">Nama: </dt><dd className="inline font-medium">{o.customer_name}</dd></div>
              <div><dt className="inline text-muted-foreground">WhatsApp: </dt><dd className="inline"><a className="font-medium underline" href={`https://wa.me/${o.whatsapp.replace(/^0/, "62").replace(/^\+/, "")}`} target="_blank" rel="noreferrer">{o.whatsapp}</a></dd></div>
              <div><dt className="inline text-muted-foreground">Alamat: </dt><dd className="inline">{o.address}</dd></div>
              {o.notes && <div><dt className="inline text-muted-foreground">Catatan: </dt><dd className="inline">{o.notes}</dd></div>}
              <div><dt className="inline text-muted-foreground">Pembayaran: </dt><dd className="inline">{PAYMENT_LABEL[o.payment_method]} {o.payment_method === "bank_transfer" && !o.payment_verified && "(belum diverifikasi)"}</dd></div>
            </dl>
            <div>
              <ul className="space-y-1.5">
                {o.order_items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2"><span>{i.product_name} × {i.quantity}</span><span className="tabular-nums">{formatRupiah(i.line_total)}</span></li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span className="tabular-nums">{formatRupiah(o.total)}</span></p>
            </div>
          </div>
        </article>
      ))}
      <AlertDialog open={!!pendingCancel} onOpenChange={(v) => !v && setPendingCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pesanan?</AlertDialogTitle>
            <AlertDialogDescription>Stok produk akan dikembalikan. Pesanan yang dibatalkan tidak dapat diaktifkan kembali.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingCancel) update.mutate({ id: pendingCancel, patch: { status: "cancelled" } }); setPendingCancel(null); }}>Batalkan pesanan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
