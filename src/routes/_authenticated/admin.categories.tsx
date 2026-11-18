import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { slugify } from "@/lib/format";
import { CategoryIcon } from "@/components/site/CategoryIcon";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: CategoriesAdmin });

type Cat = Tables<"categories">;
type F = { id?: string; name: string; slug: string; description: string; sort_order: string };

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<F | null>(null);
  const [toDelete, setToDelete] = useState<Cat | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["categories"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  const save = useMutation({
    mutationFn: async (f: F) => {
      if (!f.name.trim() || f.name.length > 60) throw new Error("Nama kategori wajib diisi (maks. 60 karakter)");
      const payload = { name: f.name.trim(), slug: slugify(f.slug || f.name), description: f.description.trim().slice(0, 200) || null, sort_order: Number(f.sort_order) || 0 };
      const res = f.id ? await supabase.from("categories").update(payload).eq("id", f.id) : await supabase.from("categories").insert(payload);
      if (res.error) throw new Error(res.error.code === "23505" ? "Slug sudah dipakai" : res.error.message);
    },
    onSuccess: () => { toast.success("Kategori disimpan"); setForm(null); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Kategori dihapus"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center gap-2 py-16 text-muted-foreground" role="status"><Loader2 className="animate-spin" /> Memuat…</div>;
  if (error || !data) return <p className="py-16 text-destructive">Gagal memuat: {error?.message}</p>;
  const submit = (e: FormEvent) => { e.preventDefault(); if (form) save.mutate(form); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setForm({ name: "", slug: "", description: "", sort_order: String(data.length + 1) })}><Plus /> Tambah kategori</Button></div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <li key={c.id} className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary"><CategoryIcon slug={c.slug} className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-muted-foreground">/{c.slug}</p></div>
            <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => setForm({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sort_order: String(c.sort_order) })}><Pencil /></Button>
            <Button size="icon" variant="ghost" aria-label={`Hapus ${c.name}`} onClick={() => setToDelete(c)}><Trash2 /></Button>
          </li>
        ))}
      </ul>
      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Edit kategori" : "Tambah kategori"}</DialogTitle></DialogHeader>
          {form && (
            <form id="cat-form" onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="c-name">Nama</Label><Input id="c-name" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></div>
              <div className="space-y-2"><Label htmlFor="c-slug">Slug</Label><Input id="c-slug" maxLength={80} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="c-desc">Deskripsi</Label><Input id="c-desc" maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="c-order">Urutan</Label><Input id="c-order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Batal</Button>
            <Button type="submit" form="cat-form" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Produk dalam kategori ini tidak dihapus, tetapi menjadi tanpa kategori.</AlertDialogDescription>
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
