import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-navy-deep text-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-sm text-sm leading-relaxed text-cream/70">
            Toko kelontong online untuk kebutuhan harian keluarga Indonesia — dari sembako hingga camilan, dikirim ke rumah Anda.
          </p>
        </div>
        <nav aria-label="Belanja" className="space-y-3 text-sm">
          <p className="font-semibold text-beige">Belanja</p>
          <Link to="/products" search={{}} className="block text-cream/70 hover:text-cream">Semua Produk</Link>
          <Link to="/categories" className="block text-cream/70 hover:text-cream">Kategori</Link>
          <Link to="/cart" className="block text-cream/70 hover:text-cream">Keranjang</Link>
        </nav>
        <nav aria-label="Informasi" className="space-y-3 text-sm">
          <p className="font-semibold text-beige">Informasi</p>
          <Link to="/about" className="block text-cream/70 hover:text-cream">Tentang Kami</Link>
          <Link to="/auth" search={{}} className="block text-cream/70 hover:text-cream">Masuk Admin</Link>
        </nav>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-cream/60 md:flex-row md:items-center md:justify-between">
          <p>Wiliy Mart — Belanja Mudah, Kebutuhan Terpenuhi.</p>
          <p>Made by Wiliy.</p>
        </div>
      </div>
    </footer>
  );
}
