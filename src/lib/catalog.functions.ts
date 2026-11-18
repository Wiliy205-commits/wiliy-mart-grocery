import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./public-client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Product = Tables<"products"> & {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
};

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicClient();
  const { data, error } = await sb.from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data as Category[];
});

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Product[];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 100) }))
  .handler(async ({ data }) => {
    const sb = createPublicClient();
    const { data: row, error } = await sb
      .from("products")
      .select("*, categories(id, name, slug)")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as Product | null) ?? null;
  });
