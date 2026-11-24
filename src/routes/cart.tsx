import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QuantitySelector } from "@/components/site/QuantitySelector";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Keranjang Belanja — Wiliy Mart" },
      { name: "description", content: "Tinjau produk di keranjang belanja Wiliy Mart sebelum checkout." },
      { property: "og:title", content: "Keranjang Belanja — Wiliy Mart" },
      { property: "og:description", content: "Tinjau keranjang belanja Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, count, hydrated, setQuantity, remove, clear } = useCart();

  if (!hydrated) {
    return <div className="container-page py-24 text-center text-muted-foreground" role="status">Memuat keranjang…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[2rem] bg-card px-6 py-16 text-center shadow-soft">
          <span className="grid size-16 place-items-center rounded-full bg-secondary"><ShoppingBag className="size-7" /></span>
          <h1 className="mt-6 text-3xl">Keranjang masih kosong</h1>
          <p className="mt-2 text-muted-foreground">Yuk, isi dengan kebutuhan harian Anda.</p>
          <Button asChild size="lg" className="mt-8"><Link to="/products" search={{}}>Belanja Sekarang</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page pt-10 md:pt-14">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">{count} item</p>
          <h1 className="text-4xl font-medium md:text-5xl">Keranjang</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm"><Trash2 /> Kosongkan</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kosongkan keranjang?</AlertDialogTitle>
              <AlertDialogDescription>Semua produk akan dihapus dari keranjang.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={clear}>Kosongkan</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-4 rounded-3xl bg-card p-3 shadow-soft md:p-4">
              <Link to="/products/$slug" params={{ slug: i.slug }} className="size-24 shrink-0 overflow-hidden rounded-2xl bg-muted md:size-28">
                {i.imageUrl && <img src={i.imageUrl} alt={i.name} loading="lazy" width={112} height={112} className="size-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col justify-between gap-2">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link to="/products/$slug" params={{ slug: i.slug }} className="font-semibold hover:underline">{i.name}</Link>
                    <p className="text-sm text-muted-foreground">{i.unit} · {formatRupiah(i.price)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.productId)} aria-label={`Hapus ${i.name}`}>
                    <Trash2 />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <QuantitySelector size="sm" value={i.quantity} max={i.stock} onChange={(v) => setQuantity(i.productId, v)} />
                  <p className="font-bold tabular-nums">{formatRupiah(i.price * i.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-3xl bg-card p-6 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-2xl">Ringkasan</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold tabular-nums">{formatRupiah(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Ongkos kirim</dt><dd>Dikonfirmasi via WhatsApp</dd></div>
            <div className="flex justify-between border-t border-border pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold tabular-nums">{formatRupiah(subtotal)}</dd></div>
          </dl>
          <Button asChild size="lg" className="mt-6 w-full"><Link to="/checkout">Lanjut ke Checkout</Link></Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Harga akhir dihitung ulang oleh sistem saat pesanan dibuat.</p>
        </aside>
      </div>
    </div>
  );
}
