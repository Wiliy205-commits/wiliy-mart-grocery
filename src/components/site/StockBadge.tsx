import { cn } from "@/lib/utils";

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const state = stock <= 0 ? "out" : stock <= 10 ? "low" : "ok";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        state === "out" && "bg-destructive/10 text-destructive",
        state === "low" && "bg-warning/15 text-warning",
        state === "ok" && "bg-success/10 text-success",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {state === "out" ? "Stok habis" : state === "low" ? `Sisa ${stock}` : `Stok ${stock}`}
    </span>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur", className)}>
      Data contoh
    </span>
  );
}
