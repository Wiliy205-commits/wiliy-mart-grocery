import { z } from "zod";

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeWhatsapp(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export const WHATSAPP_PATTERN = /^(\+62|62|0)8[0-9]{7,12}$/;

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, { message: "Nama minimal 2 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  whatsapp: z
    .string()
    .transform(normalizeWhatsapp)
    .pipe(z.string().regex(WHATSAPP_PATTERN, { message: "Nomor WhatsApp tidak valid (contoh: 081234567890)" })),
  address: z
    .string()
    .trim()
    .min(10, { message: "Alamat minimal 10 karakter" })
    .max(500, { message: "Alamat maksimal 500 karakter" }),
  notes: z.string().trim().max(500, { message: "Catatan maksimal 500 karakter" }).default(""),
  paymentMethod: z.enum(["cod", "bank_transfer"], { message: "Pilih metode pembayaran" }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1, { message: "Keranjang masih kosong" })
    .max(50),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cod: "Bayar di Tempat (COD)",
  bank_transfer: "Transfer Bank Manual",
};
