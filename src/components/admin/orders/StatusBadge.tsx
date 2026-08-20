import { statusLabel } from "@/lib/orders.shared";

const TONES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
  confirmed: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  processing: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  shipped: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive",
  returned: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  unpaid: "bg-muted text-muted-foreground",
  partial: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  paid: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  refunded: "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive",
  not_booked: "bg-muted text-muted-foreground",
  booked: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  picked_up: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  in_transit: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  out_for_delivery: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
};

export function StatusBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
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
