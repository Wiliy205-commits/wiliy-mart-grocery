import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useMemo } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Sort = "newest" | "price-asc" | "price-desc" | "popular";
type ProductSearch = { q?: string | undefined; category?: string | undefined; sort?: Sort | undefined };
const SORTS: Sort[] = ["newest", "price-asc", "price-desc", "popular"];

export const Route = createFileRoute("/products/")({
  validateSearch: (s: Record<string, unknown>): ProductSearch => ({
    q: typeof s["q"] === "string" && s["q"].trim() ? s["q"].slice(0, 80) : undefined,
    category: typeof s["category"] === "string" && s["category"] ? s["category"] : undefined,
    sort: SORTS.includes(s["sort"] as Sort) ? (s["sort"] as Sort) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Semua Produk — Wiliy Mart" },
      { name: "description", content: "Katalog lengkap Wiliy Mart: cari dan saring sembako, minuman, mi instan, camilan dan kebutuhan rumah tangga." },
      { property: "og:title", content: "Katalog Produk — Wiliy Mart" },
      { property: "og:description", content: "Cari, saring per kategori dan urutkan berdasarkan harga." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, category, sort = "newest" } = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);

  const filtered = useMemo(() => {
    const term = q?.toLowerCase() ?? "";
    const list = products.filter(
      (p) =>
        (!category || p.categories?.slug === category) &&
        (!term || p.name.toLowerCase().includes(term) || (p.description ?? "").toLowerCase().includes(term)),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "popular") sorted.sort((a, b) => b.sold_count - a.sold_count);
    return sorted;
  }, [products, q, category, sort]);

  const activeCat = categories.find((c) => c.slug === category);
  const chip = "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors";

  return (
    <div className="container-page pt-10 md:pt-14">
      <header className="mb-8">
        <p className="eyebrow mb-2">Katalog</p>
        <h1 className="text-4xl font-medium md:text-5xl">{activeCat ? activeCat.name : "Semua produk"}</h1>
        {q && <p className="mt-3 text-muted-foreground">Hasil pencarian untuk “{q}”</p>}
      </header>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="list" aria-label="Filter kategori">
          <Link
            to="/products"
            search={(s) => ({ ...s, category: undefined })}
            className={cn(chip, !category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")}
          >
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={(s) => ({ ...s, category: c.slug })}
              className={cn(chip, category === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filtered.length} produk</span>
          <Select value={sort} onValueChange={(v) => navigate({ search: (s) => ({ ...s, sort: v as Sort }) })}>
            <SelectTrigger className="w-48 rounded-full bg-card" aria-label="Urutkan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="popular">Terlaris</SelectItem>
              <SelectItem value="price-asc">Harga terendah</SelectItem>
              <SelectItem value="price-desc">Harga tertinggi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl bg-card px-6 py-20 text-center shadow-soft">
          <SearchX className="size-10 text-muted-foreground" />
          <h2 className="mt-4 text-2xl">Produk tidak ditemukan</h2>
          <p className="mt-2 text-muted-foreground">Coba kata kunci lain atau pilih kategori berbeda.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/products" search={{}}>Reset filter</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
