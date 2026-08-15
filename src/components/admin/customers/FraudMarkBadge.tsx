import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { getFraudMark } from "@/lib/customer-fraud.functions";
import { MarkFraudDialog } from "@/components/admin/customers/MarkFraudDialog";

interface FraudMarkBadgeProps {
  phoneNumber: string;
  customerName: string;
  canManage?: boolean;
}

export function FraudMarkBadge({
  phoneNumber,
  customerName,
  canManage = false,
}: FraudMarkBadgeProps) {
  const fetchMark = useServerFn(getFraudMark);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["customer-fraud", phoneNumber],
    queryFn: () => fetchMark({ data: { phoneNumber } }),
  });

  const mark = query.data;

  if (!mark && !canManage) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 transition-all hover:scale-105 ${
          mark
            ? mark.mark_type === "fraud"
              ? "bg-red-500/10 text-red-600 ring-red-500/20"
              : "bg-amber-500/10 text-amber-600 ring-amber-500/20"
            : "bg-slate-500/10 text-slate-600 ring-slate-500/20 opacity-30 hover:opacity-100"
        }`}
      >
        {mark ? (
          <>
            {mark.mark_type === "fraud" ? (
              <ShieldAlert className="size-3" />
            ) : (
              <AlertTriangle className="size-3" />
            )}
            {mark.label || (mark.mark_type === "fraud" ? "Fraud" : "Warning")}
          </>
        ) : (
          <>
            <ShieldAlert className="size-3" />
            Mark Fraud
          </>
        )}
      </button>

      <MarkFraudDialog
        phoneNumber={phoneNumber}
        customerName={customerName}
        open={open}
        onOpenChange={setOpen}
        canManage={canManage}
      />
    </>
  );
}
