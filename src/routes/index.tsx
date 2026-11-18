import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Clock, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import heroImg from "@/assets/hero-groceries.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wiliy Mart — Belanja Mudah, Kebutuhan Terpenuhi." },
      { name: "description", content: "Belanja sembako, minuman, mi instan, camilan dan kebutuhan rumah tangga secara online di Wiliy Mart. Harga dalam Rupiah, bayar COD atau transfer." },
      { property: "og:title", content: "Wiliy Mart — Toko Kelontong Online" },
      { property: "og:description", content: "Belanja Mudah, Kebutuhan Terpenuhi. Sembako dan kebutuhan harian diantar ke rumah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]),
  component: Index,
});

function SectionHeading({ eyebrow, title, to }: { eyebrow: string; title: string; to?: boolean }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="text-3xl font-medium md:text-4xl">{title}</h2>
      </div>
      {to && (
        <Link to="/products" search={{}} className="hidden items-center gap-1.5 text-sm font-semibold hover:underline sm:inline-flex">
          Lihat semua <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Index() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const bestSellers = [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 4);
  const newArrivals = products.slice(0, 4);
  const promos = products.filter((p) => p.compare_at_price && p.compare_at_price > p.price).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-navy">
          <img
            src={heroImg}
            alt="Keranjang belanja berisi sayur, beras, minyak goreng dan kopi"
            width={1600}
            height={1104}
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-right opacity-90 max-md:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/80 to-transparent" />
          <div className="relative max-w-xl px-6 py-16 md:px-14 md:py-28">
            <p className="eyebrow fade-up mb-5 text-beige">Toko kelontong online</p>
            <h1 className="fade-up text-4xl font-medium leading-[1.05] text-cream md:text-6xl">
              Belanja Mudah, Kebutuhan Terpenuhi.
            </h1>
            <p className="fade-up mt-5 max-w-md text-base leading-relaxed text-cream/75 [animation-delay:120ms]">
              Sembako, minuman, mi instan hingga kebutuhan rumah tangga — pesan dari rumah, bayar di tempat atau transfer.
            </p>
            <div className="fade-up mt-8 flex flex-wrap gap-3 [animation-delay:220ms]">
              <Button asChild variant="hero" size="lg">
                <Link to="/products" search={{}}>Belanja Sekarang <ArrowRight /></Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/categories">Lihat Kategori</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page mt-20" aria-labelledby="cat-title">
        <SectionHeading eyebrow="Kategori pilihan" title="Belanja per kategori" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug }}
              className="group flex flex-col items-start gap-6 rounded-3xl bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground hover:shadow-lift"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground transition-colors group-hover:bg-beige">
                <CategoryIcon slug={c.slug} className="size-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHeading eyebrow="Paling diminati" title="Produk terlaris" to />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Promo */}
      {promos.length > 0 && (
        <section className="container-page mt-20">
          <div className="rounded-[2rem] bg-beige p-6 md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
              <div>
                <p className="eyebrow mb-3">Promo spesial</p>
                <h2 className="text-3xl font-medium md:text-4xl">Hemat untuk kebutuhan pokok</h2>
                <p className="mt-4 text-muted-foreground">Harga coret berlaku selama stok tersedia. Harga akhir dihitung ulang saat checkout.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
                {promos.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-page mt-20">
        <SectionHeading eyebrow="Baru masuk" title="Produk terbaru" to />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Why */}
      <section className="container-page mt-24">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-2">Kenapa Wiliy Mart</p>
          <h2 className="text-3xl font-medium md:text-4xl">Belanja harian tanpa ribet</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "Harga transparan", text: "Harga dalam Rupiah, dihitung ulang oleh sistem saat checkout." },
            { icon: ShieldCheck, title: "Stok real-time", text: "Stok diperbarui otomatis setiap ada pesanan masuk." },
            { icon: Truck, title: "Diantar ke rumah", text: "Pesan dari mana saja, kami konfirmasi via WhatsApp." },
            { icon: Clock, title: "Bayar fleksibel", text: "Bayar di tempat (COD) atau transfer bank manual." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-border bg-card/60 p-6">
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-6 font-sans text-base font-semibold tracking-normal">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Produk bertanda “Data contoh” adalah inventaris contoh hingga produk asli dimasukkan oleh admin.
        </p>
      </section>
    </>
  );
}
