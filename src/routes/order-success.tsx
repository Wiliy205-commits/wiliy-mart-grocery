import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatRupiah, PAYMENT_LABEL } from "@/lib/format";
import type { OrderConfirmation } from "@/lib/orders.functions";
import { BANK_ACCOUNTS } from "@/lib/store-config";

export const Route = createFileRoute("/order-success")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Pesanan Diterima — Wiliy Mart" },
      { name: "description", content: "Konfirmasi pesanan Wiliy Mart Anda." },
      { property: "og:title", content: "Pesanan Diterima — Wiliy Mart" },
      { property: "og:description", content: "Konfirmasi pesanan Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wiliy-last-order");
      setOrder(raw ? (JSON.parse(raw) as OrderConfirmation) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) return <div className="container-page py-24 text-center text-muted-foreground" role="status">Memuat…</div>;
  if (order === null) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl">Tidak ada pesanan untuk ditampilkan</h1>
        <Button asChild className="mt-6"><Link to="/products" search={{}}>Mulai belanja</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-card p-6 shadow-soft md:p-10">
        <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-medium md:text-4xl">Terima kasih, {order.customer_name}!</h1>
        <p className="mt-3 text-muted-foreground">
          Pesanan Anda sudah kami terima dan berstatus <strong className="text-foreground">Menunggu</strong>. Admin akan menghubungi Anda melalui WhatsApp untuk konfirmasi ongkos kirim.
        </p>
        <div className="mt-8 rounded-2xl bg-secondary/60 p-5">
          <p className="eyebrow">Nomor pesanan</p>
          <p className="mt-1 font-display text-2xl tracking-wide">{order.order_number}</p>
        </div>
        <ul className="mt-8 space-y-3">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3 text-sm">
              <span>{i.name} <span className="text-muted-foreground">× {i.quantity}</span></span>
              <span className="tabular-nums">{formatRupiah(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Metode pembayaran</dt><dd>{PAYMENT_LABEL[order.payment_method]}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Status pembayaran</dt><dd>Belum dibayar / menunggu verifikasi</dd></div>
          <div className="flex justify-between text-base"><dt className="font-semibold">Total (belum termasuk ongkir)</dt><dd className="font-bold tabular-nums">{formatRupiah(order.total)}</dd></div>
        </dl>
        {order.payment_method === "bank_transfer" && (
          <div className="mt-6 rounded-2xl border border-border p-5 text-sm leading-relaxed">
            <p className="font-semibold">Instruksi transfer bank</p>
            {BANK_ACCOUNTS.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {BANK_ACCOUNTS.map((b) => <li key={b.number}>{b.bank} · {b.number} a.n. {b.holder}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-muted-foreground">Detail rekening akan dikirim admin melalui WhatsApp. Jangan transfer sebelum menerima konfirmasi resmi.</p>
            )}
            <p className="mt-2 text-muted-foreground">Pesanan diproses setelah admin memverifikasi pembayaran.</p>
          </div>
        )}
        <Button asChild size="lg" className="mt-8 w-full"><Link to="/products" search={{}}>Lanjut belanja</Link></Button>
      </div>
    </div>
  );
}
