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
    <div className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {ORDER_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {counts?.[tab.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}