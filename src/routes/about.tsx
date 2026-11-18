import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — Wiliy Mart" },
      { name: "description", content: "Wiliy Mart adalah toko kelontong online untuk kebutuhan harian keluarga Indonesia." },
      { property: "og:title", content: "Tentang Wiliy Mart" },
      { property: "og:description", content: "Belanja Mudah, Kebutuhan Terpenuhi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="container-page pt-10 md:pt-16">
      <div className="max-w-3xl">
        <p className="eyebrow mb-3">Tentang kami</p>
        <h1 className="text-4xl font-medium leading-tight md:text-6xl">Kebutuhan harian, lebih dekat dan lebih mudah.</h1>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
          Wiliy Mart hadir sebagai toko kelontong online untuk keluarga Indonesia. Kami mengumpulkan kebutuhan pokok — beras, gula,
          minyak goreng, minuman, mi instan, camilan hingga perlengkapan rumah tangga — dalam satu tempat yang rapi dan mudah digunakan.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Setiap pesanan dikonfirmasi melalui WhatsApp, dan Anda bisa memilih bayar di tempat atau transfer bank manual.
        </p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          ["Misi", "Membuat belanja kebutuhan harian terasa ringan dan transparan."],
          ["Harga", "Semua harga dalam Rupiah dan dihitung ulang oleh sistem saat checkout."],
          ["Kontak", "Informasi kontak resmi toko akan segera ditambahkan."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-3xl bg-card p-7 shadow-soft">
            <h2 className="text-2xl">{t}</h2>
            <p className="mt-3 text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <Button asChild size="lg" className="mt-12"><Link to="/products" search={{}}>Mulai Belanja</Link></Button>
    </div>
  );
}
