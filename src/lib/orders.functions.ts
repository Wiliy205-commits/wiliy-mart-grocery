import { createServerFn } from "@tanstack/react-start";
import { checkoutSchema } from "./format";
import { createPublicClient } from "./public-client";

export type OrderConfirmation = {
  order_number: string;
  subtotal: number;
  total: number;
  payment_method: "cod" | "bank_transfer";
  customer_name: string;
  items: { name: string; quantity: number; unit_price: number; line_total: number }[];
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const sb = createPublicClient();
    // Prices, stock checks and inventory updates happen inside the database function.
    const { data: result, error } = await sb.rpc("place_order", {
      _customer_name: data.customerName,
      _whatsapp: data.whatsapp,
      _address: data.address,
      _notes: data.notes ?? "",
      _payment_method: data.paymentMethod,
      _items: data.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, order: result as unknown as OrderConfirmation };
  });
