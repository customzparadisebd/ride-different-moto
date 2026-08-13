import { statusLabel } from "@/lib/orders.shared";

const TONES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/15 text-primary",
  processing: "bg-primary/15 text-primary",
  shipped: "bg-blue-500/15 text-blue-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
  returned: "bg-amber-500/15 text-amber-400",
  unpaid: "bg-muted text-muted-foreground",
  partial: "bg-amber-500/15 text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  refunded: "bg-destructive/15 text-destructive",
  not_booked: "bg-muted text-muted-foreground",
  booked: "bg-primary/15 text-primary",
  picked_up: "bg-blue-500/15 text-blue-400",
  in_transit: "bg-blue-500/15 text-blue-400",
  out_for_delivery: "bg-blue-500/15 text-blue-400",
};

export function StatusBadge({ value, className }: { value: string | null | undefined, className?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = TONES[value] ?? "bg-secondary text-secondary-foreground";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${tone} ${className || ""}`}
    >
      {statusLabel(value)}
    </span>
  );
}
