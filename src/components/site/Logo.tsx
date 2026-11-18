import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Wiliy Mart — Beranda">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl font-display text-lg font-semibold transition-transform group-hover:-rotate-6",
          inverted ? "bg-beige text-navy-deep" : "bg-primary text-primary-foreground",
        )}
      >
        W
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-tight", inverted ? "text-cream" : "text-foreground")}>
        Wiliy<span className={inverted ? "text-beige" : "text-muted-foreground"}> Mart</span>
      </span>
    </Link>
  );
}
