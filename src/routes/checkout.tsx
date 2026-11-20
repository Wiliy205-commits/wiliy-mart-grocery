import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/lib/cart";
import { checkoutSchema, formatRupiah } from "@/lib/format";
import { placeOrder } from "@/lib/orders.functions";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getAddresses } from "@/lib/account.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Wiliy Mart" },
      { name: "description", content: "Lengkapi data pengiriman dan pilih metode pembayaran untuk pesanan Wiliy Mart Anda." },
      { property: "og:title", content: "Checkout — Wiliy Mart" },
      { property: "og:description", content: "Selesaikan pesanan Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Errors = Partial<Record<"customerName" | "whatsapp" | "address" | "notes" | "paymentMethod" | "items", string>>;

function CheckoutPage() {
  const { items, subtotal, hydrated, clear } = useCart();
  const submitOrder = useServerFn(placeOrder);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const fetchAddresses = useServerFn(getAddresses);
  const { data: savedAddresses } = useQuery({ queryKey: ['checkout-addresses', user?.id], queryFn: () => fetchAddresses(), enabled: !!user });
  const methods = PAYMENT_METHODS.filter((m) => m.enabled);
  const [form, setForm] = useState({ customerName: "", whatsapp: "", address: "", notes: "" });
  const [payment, setPayment] = useState<PaymentMethodId>(methods[0]?.id ?? "cod");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  if (!hydrated) return <div className="container-page py-24 text-center text-muted-foreground" role="status">Memuat…</div>;
  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl">Keranjang kosong</h1>
        <p className="mt-2 text-muted-foreground">Tambahkan produk sebelum checkout.</p>
        <Button asChild className="mt-6"><Link to="/products" search={{}}>Lihat produk</Link></Button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      paymentMethod: payment,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Periksa kembali data pesanan Anda");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await submitOrder({ data: payload });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      sessionStorage.setItem("wiliy-last-order", JSON.stringify(res.order));
      clear();
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["account-summary"] });
      navigate({ to: "/order-success" });
    } catch {
      toast.error("Pesanan gagal dibuat. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (id: keyof typeof form, label: string, el: "input" | "textarea", props: Record<string, unknown> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {el === "input" ? (
        <Input id={id} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} className="h-12 rounded-2xl bg-card" {...props} />
      ) : (
        <Textarea id={id} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} className="min-h-24 rounded-2xl bg-card" {...props} />
      )}
      {errors[id] && <p id={`${id}-err`} className="text-sm text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="container-page pt-10 md:pt-14">
      <p className="eyebrow mb-2">Langkah terakhir</p>
      <h1 className="text-4xl font-medium md:text-5xl">Checkout</h1>
      <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className="space-y-5 rounded-3xl bg-card/60 p-6 md:p-8" aria-labelledby="ship-title">
            <h2 id="ship-title" className="text-2xl">Data pengiriman</h2>
            {savedAddresses && savedAddresses.length > 0 && <div className="space-y-2"><Label htmlFor="saved-address">Alamat tersimpan</Label><select id="saved-address" defaultValue="" className="h-12 w-full rounded-md border border-input bg-card px-3 text-sm" onChange={e => { const a = savedAddresses.find(a => a.id === e.target.value); if (a) setForm({ customerName: a.recipient_name, whatsapp: a.phone, address: `${a.full_address}, ${a.village}, ${a.district}, ${a.city}, ${a.province} ${a.postal_code}`.slice(0,500), notes: a.notes ?? '' }); }}><option value="">Pilih alamat Anda</option>{savedAddresses.map(a => <option key={a.id} value={a.id}>{a.label}{a.is_default ? ' · Utama' : ''} — {a.recipient_name}</option>)}</select></div>}
            {field("customerName", "Nama lengkap", "input", { autoComplete: "name", maxLength: 100 })}
            {field("whatsapp", "Nomor WhatsApp", "input", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "081234567890", maxLength: 20 })}
            {field("address", "Alamat pengiriman", "textarea", { autoComplete: "street-address", placeholder: "Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota", maxLength: 500 })}
            {field("notes", "Catatan pesanan (opsional)", "textarea", { placeholder: "Contoh: titip di pos satpam", maxLength: 500 })}
          </section>
          <section className="space-y-5 rounded-3xl bg-card/60 p-6 md:p-8" aria-labelledby="pay-title">
            <h2 id="pay-title" className="text-2xl">Metode pembayaran</h2>
            <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentMethodId)} className="gap-3">
              {methods.map((m) => (
                <Label
                  key={m.id}
                  htmlFor={`pay-${m.id}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-2xl border bg-card p-5 font-normal transition-colors",
                    payment === m.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/50",
                  )}
                >
                  <RadioGroupItem id={`pay-${m.id}`} value={m.id} className="mt-1" />
                  <span>
                    <span className="block font-semibold">{m.label}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{m.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </section>
        </div>
        <aside className="h-fit rounded-3xl bg-card p-6 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-2xl">Ringkasan pesanan</h2>
          <ul className="mt-6 space-y-3">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 text-sm">
                <span>{i.name} <span className="text-muted-foreground">× {i.quantity}</span></span>
                <span className="font-medium tabular-nums">{formatRupiah(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatRupiah(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Ongkos kirim</dt><dd>Dikonfirmasi via WhatsApp</dd></div>
            <div className="flex justify-between text-base"><dt className="font-semibold">Perkiraan total</dt><dd className="font-bold tabular-nums">{formatRupiah(subtotal)}</dd></div>
          </dl>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="animate-spin" /> Memproses…</> : "Buat Pesanan"}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            Stok dan harga diverifikasi ulang oleh sistem. Pembayaran belum dianggap lunas sampai diverifikasi admin.
          </p>
        </aside>
      </form>
    </div>
  );
}
