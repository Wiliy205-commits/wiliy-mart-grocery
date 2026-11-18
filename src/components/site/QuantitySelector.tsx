import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  max,
  onChange,
  size = "md",
  label = "Jumlah",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const btn = cn("grid place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40", size === "sm" ? "size-8" : "size-11");
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Kurangi jumlah">
        <Minus className="size-4" />
      </button>
      <span className={cn("min-w-8 text-center font-semibold tabular-nums", size === "sm" ? "text-sm" : "text-base")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Tambah jumlah">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
