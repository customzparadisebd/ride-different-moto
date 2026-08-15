// ============================================================
// ORDER STATUS TABS
// Purpose: Compact status navigation with live counts. Selecting a tab
//          re-runs the server-side filtered query.
// ============================================================
import { ORDER_TABS, type OrderTab } from "@/lib/orders.shared";

export function OrderStatusTabs({
  value,
  counts,
  onChange,
}: {
  value: OrderTab;
  counts: Partial<Record<OrderTab, number>> | undefined;
  onChange: (next: OrderTab) => void;
}) {
  return (
    <div className="mt-4 -mx-1 flex flex-wrap gap-1.5 overflow-x-auto px-1 pb-1">
      {ORDER_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex shrink-0 items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span className="rounded bg-secondary px-1 text-[10px] font-bold text-foreground">
              {counts?.[tab.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
