import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/lib/catalog.functions";
import { SampleBadge, StockBadge } from "./StockBadge";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={600}
            height={600}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">Tanpa gambar</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">-{discount}%</span>
          )}
          {product.is_sample && <SampleBadge />}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="eyebrow max-w-full truncate">{product.categories?.name ?? "Lainnya"}</span>
          <StockBadge stock={product.stock} />
        </div>
        <Link to="/products/$slug" params={{ slug: product.slug }} className="flex-1">
          <h3 className="font-sans text-base font-semibold leading-snug tracking-normal text-foreground">{product.name}</h3>
          {product.unit && <p className="mt-0.5 text-sm text-muted-foreground">{product.unit}</p>}
        </Link>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold tabular-nums">{formatRupiah(product.price)}</p>
            {discount > 0 && (
              <p className="text-xs text-muted-foreground line-through tabular-nums">{formatRupiah(product.compare_at_price!)}</p>
            )}
          </div>
          <Button
            size="icon"
            className="size-10 shrink-0"
            disabled={out}
            aria-label={out ? `${product.name} stok habis` : `Tambah ${product.name} ke keranjang`}
            onClick={() =>
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                imageUrl: product.image_url,
                unit: product.unit,
                stock: product.stock,
              })
            }
          >
            <Plus />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
