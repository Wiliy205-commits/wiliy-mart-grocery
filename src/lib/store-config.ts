// Store-level settings. Edit these to configure checkout.
export type PaymentMethodId = "cod" | "bank_transfer";

export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
}[] = [
  {
    id: "cod",
    label: "Bayar di Tempat (COD)",
    description: "Bayar tunai kepada kurir saat pesanan tiba.",
    enabled: true,
  },
  {
    id: "bank_transfer",
    label: "Transfer Bank Manual",
    description:
      "Detail rekening akan dikirim admin melalui WhatsApp. Pesanan diproses setelah pembayaran diverifikasi admin.",
    enabled: true,
  },
];

// Leave empty until the store's real bank account is available.
export const BANK_ACCOUNTS: { bank: string; number: string; holder: string }[] = [];
