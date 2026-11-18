import { CupSoda, Cookie, ShoppingBasket, Soup, SprayCan, Utensils, Wheat, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  makanan: Utensils,
  minuman: CupSoda,
  sembako: Wheat,
  "mi-instan": Soup,
  "makanan-ringan": Cookie,
  "kebutuhan-rumah-tangga": SprayCan,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? ShoppingBasket;
  return <Icon className={className} aria-hidden="true" />;
}
