import { queryOptions } from "@tanstack/react-query";
import { getProductBySlug, listCategories, listProducts } from "./catalog.functions";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
  staleTime: 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
  staleTime: 30_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
    staleTime: 30_000,
  });
