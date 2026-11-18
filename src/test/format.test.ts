import { describe, expect, it } from "vitest";
import { checkoutSchema, formatRupiah } from "@/lib/format";

const base = {
  customerName: "Budi Santoso",
  whatsapp: "0812-3456-7890",
  address: "Jl. Melati No. 10, Makassar",
  notes: "",
  paymentMethod: "cod" as const,
  items: [{ productId: "3f1c2b8e-1d2a-4c5b-9e8f-1a2b3c4d5e6f", quantity: 2 }],
};

describe("format & checkout rules", () => {
  it("formats prices as Indonesian Rupiah without decimals", () => {
    expect(formatRupiah(3500).replace(/\s/g, " ")).toMatch(/^Rp\s?3\.500$/);
  });
  it("accepts and normalizes an Indonesian WhatsApp number", () => {
    const r = checkoutSchema.safeParse(base);
    expect(r.success && r.data.whatsapp).toBe("081234567890");
  });
  it("rejects a non-Indonesian WhatsApp number", () => {
    expect(checkoutSchema.safeParse({ ...base, whatsapp: "12345" }).success).toBe(false);
  });
  it("rejects an empty cart", () => {
    expect(checkoutSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });
  it("only allows COD or manual bank transfer", () => {
    expect(checkoutSchema.safeParse({ ...base, paymentMethod: "credit_card" }).success).toBe(false);
  });
});
