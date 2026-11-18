import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatRupiah, slugify } from "@/lib/format";
import { StockBadge } from "@/components/site/StockBadge";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsAdmin });

type Row = Tables<"products">;
type FormState = {
  id?: string; name: string; slug: string; category_id: string; description: string; unit: string;
  price: string; compare_at_price: string; stock: string; image_url: string; is_active: boolean; is_featured: boolean; is_sample: boolean;
};
const EMPTY: FormState = { name: "", slug: "", category_id: "", description: "", unit: "", price: "", compare_at_price: "", stock: "0", image_url: "", is_active: true, is_featured: false, is_sample: false };
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function ProductsAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name").order("sort_order"),
      ]);
      if (p.error) throw p.error;
      if (c.error) throw c.error;
      return { products: p.data, categories: c.data };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const price = Number(f.price);
      const stock = Number(f.stock);
      const compare = f.compare_at_price ? Number(f.compare_at_price) : null;
      if (!f.name.trim() || f.name.length > 120) throw new Error("Nama produk wajib diisi (maks. 120 karakter)");
      if (!Number.isInteger(price) || price < 0) throw new Error("Harga harus bilangan bulat ≥ 0");
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Stok harus bilangan bulat ≥ 0");
      if (compare !== null && (!Number.isInteger(compare) || compare < 0)) throw new Error("Harga coret tidak valid");
      const payload = {
        name: f.name.trim(), slug: slugify(f.slug || f.name), category_id: f.category_id || null,
        description: f.description.trim().slice(0, 2000) || null, unit: f.unit.trim().slice(0, 60) || null,
        price, stock, compare_at_price: compare, image_url: f.image_url || null,
        is_active: f.is_active, is_featured: f.is_featured, is_sample: f.is_sample,
      };
      const res = f.id ? await supabase.from("products").update(payload).eq("id", f.id) : await supabase.from("products").insert(payload);
      if (res.error) throw new Error(res.error.code === "23505" ? "Slug sudah dipakai produk lain" : res.error.message);
    },
    onSuccess: () => { toast.success("Produk disimpan"); setForm(null); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Produk dihapus"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Stok tidak valid");
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { toast.success("Stok diperbarui"); setStockEdits((s) => { const n = { ...s }; delete n[v.id]; return n; }); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = async (file: File) => {
    if (!form) return;
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran maksimal 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: signed, error: sErr } = await supabase.storage.from("product-images").createSignedUrl(path, TEN_YEARS);
      if (sErr || !signed) throw sErr ?? new Error("Gagal membuat tautan gambar");
      setForm({ ...form, image_url: signed.signedUrl });
      toast.success("Gambar diunggah");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="flex items-center gap-2 py-16 text-muted-foreground" role="status"><Loader2 className="animate-spin" /> Memuat produk…</div>;
  if (error || !data) return <p className="py-16 text-destructive">Gagal memuat: {error?.message}</p>;
  const catName = (id: string | null) => data.categories.find((c) => c.id === id)?.name ?? "—";

  const openEdit = (p: Row) => setForm({
    id: p.id, name: p.name, slug: p.slug, category_id: p.category_id ?? "", description: p.description ?? "", unit: p.unit ?? "",
    price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", stock: String(p.stock),
    image_url: p.image_url ?? "", is_active: p.is_active, is_featured: p.is_featured, is_sample: p.is_sample,
  });

  const submit = (e: FormEvent) => { e.preventDefault(); if (form) save.mutate(form); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.products.length} produk</p>
        <Button onClick={() => setForm({ ...EMPTY, category_id: data.categories[0]?.id ?? "" })}><Plus /> Tambah produk</Button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {data.products.map((p) => (
            <li key={p.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {p.image_url && <img src={p.image_url} alt="" loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name} {!p.is_active && <span className="ml-1 text-xs font-normal text-muted-foreground">(nonaktif)</span>} {p.is_sample && <span className="ml-1 text-xs font-normal text-muted-foreground">(contoh)</span>}</p>
                  <p className="text-sm text-muted-foreground">{catName(p.category_id)} · {formatRupiah(p.price)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StockBadge stock={p.stock} />
                <Label htmlFor={`stock-${p.id}`} className="sr-only">Stok {p.name}</Label>
                <Input id={`stock-${p.id}`} type="number" min={0} className="h-9 w-24 rounded-full" value={stockEdits[p.id] ?? String(p.stock)} onChange={(e) => setStockEdits({ ...stockEdits, [p.id]: e.target.value })} />
                {stockEdits[p.id] !== undefined && stockEdits[p.id] !== String(p.stock) && (
                  <Button size="sm" onClick={() => saveStock.mutate({ id: p.id, stock: Number(stockEdits[p.id]) })} disabled={saveStock.isPending}><Save /> Simpan</Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}><Pencil /></Button>
                <Button size="icon" variant="ghost" onClick={() => setToDelete(p)} aria-label={`Hapus ${p.name}`}><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{form?.id ? "Edit produk" : "Tambah produk"}</DialogTitle></DialogHeader>
          {form && (
            <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="p-name">Nama</Label><Input id="p-name" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></div>
              <div className="space-y-2"><Label htmlFor="p-slug">Slug URL</Label><Input id="p-slug" maxLength={80} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger aria-label="Kategori"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>{data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="p-price">Harga (Rp)</Label><Input id="p-price" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="p-compare">Harga coret (opsional)</Label><Input id="p-compare" type="number" min={0} value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="p-stock">Stok</Label><Input id="p-stock" type="number" min={0} required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="p-unit">Satuan</Label><Input id="p-unit" maxLength={60} placeholder="1 kg, 600 ml…" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="p-desc">Deskripsi</Label><Textarea id="p-desc" maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-image">Gambar produk</Label>
                <div className="flex items-center gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted">
                    {form.image_url ? <img src={form.image_url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted-foreground" />}
                  </div>
                  <Input id="p-image" type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
                  {uploading && <Loader2 className="animate-spin" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Tampilkan di toko</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Unggulan</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_sample} onCheckedChange={(v) => setForm({ ...form, is_sample: v })} /> Tandai sebagai data contoh</label>
              </div>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Batal</Button>
            <Button type="submit" form="product-form" disabled={save.isPending || uploading}>{save.isPending && <Loader2 className="animate-spin" />} Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Produk akan dihapus permanen. Riwayat pesanan tetap tersimpan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
