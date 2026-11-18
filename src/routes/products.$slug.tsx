import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/site/QuantitySelector";
import { SampleBadge, StockBadge } from "@/components/site/StockBadge";
import { ProductCard } from "@/components/site/ProductCard";
import { productQuery, productsQuery } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery);
    return { name: product.name, description: product.description, price: product.price };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produk tidak tersedia — Wiliy Mart" }, { name: "robots", content: "noindex" }] };
    const desc = `${loaderData.name} seharga ${formatRupiah(loaderData.price)} di Wiliy Mart. ${loaderData.description ?? ""}`.slice(0, 160);
    return {
      meta: [
        { title: `${loaderData.name} — Wiliy Mart` },
        { name: "description", content: desc },
        { property: "og:title", content: `${loaderData.name} — Wiliy Mart` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl">Produk tidak ditemukan</h1>
      <Button asChild className="mt-6"><Link to="/products" search={{}}>Kembali ke katalog</Link></Button>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(productsQuery);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const out = product.stock <= 0;
  const related = all.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);

  return (
    <div className="container-page pt-8 md:pt-12">
      <Link to="/products" search={{}} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Kembali ke katalog
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-card shadow-soft">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} width={816} height={816} className="aspect-square size-full object-cover" />
          )}
          {product.is_sample && <SampleBadge className="absolute left-4 top-4" />}
        </div>
        <div className="flex flex-col md:py-6">
          {product.categories && (
            <Link to="/products" search={{ category: product.categories.slug }} className="eyebrow hover:text-foreground">
              {product.categories.name}
            </Link>
          )}
          <h1 className="mt-3 text-4xl font-medium leading-tight md:text-5xl">{product.name}</h1>
          {product.unit && <p className="mt-2 text-muted-foreground">{product.unit}</p>}
          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-3xl font-bold tabular-nums">{formatRupiah(product.price)}</p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <p className="text-lg text-muted-foreground line-through tabular-nums">{formatRupiah(product.compare_at_price)}</p>
            )}
          </div>
          <StockBadge stock={product.stock} className="mt-4 self-start" />
          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-8">
            <QuantitySelector value={qty} max={Math.max(1, product.stock)} onChange={setQty} />
            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              disabled={out}
              onClick={() =>
                add(
                  {
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.image_url,
                    unit: product.unit,
                    stock: product.stock,
                  },
                  qty,
                )
              }
            >
              <ShoppingBag /> {out ? "Stok habis" : "Tambah ke keranjang"}
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-3xl font-medium">Produk serupa</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
