import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/categories")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Kategori Produk — Wiliy Mart" },
      { name: "description", content: "Jelajahi kategori Wiliy Mart: Makanan, Minuman, Sembako, Mi Instan, Makanan Ringan dan Kebutuhan Rumah Tangga." },
      { property: "og:title", content: "Kategori Produk — Wiliy Mart" },
      { property: "og:description", content: "Temukan kebutuhan harian berdasarkan kategori." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  return (
    <div className="container-page pt-10 md:pt-14">
      <p className="eyebrow mb-2">Kategori</p>
      <h1 className="text-4xl font-medium md:text-5xl">Semua kategori</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug }}
              className="group flex min-h-52 flex-col justify-between rounded-[2rem] bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                  <CategoryIcon slug={c.slug} className="size-6" />
                </span>
                <ArrowUpRight className="size-5 opacity-40 transition group-hover:opacity-100" />
              </div>
              <div>
                <h2 className="text-2xl font-medium">{c.name}</h2>
                <p className="mt-1 text-sm opacity-70">{c.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider opacity-60">{count} produk</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
