// ============================================================
// INVOICE SETTINGS PANEL
// Purpose: Manage invoice prefix and starting number.
// Security: Requires Admin/Super Admin access.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInvoiceSettings, saveInvoiceSettings } from "@/lib/invoicing.functions";
import { DEFAULT_INVOICE_SETTINGS, type InvoiceSettings } from "@/lib/invoicing.shared";

export function InvoiceSettingsPanel({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getInvoiceSettings);
  const save = useServerFn(saveInvoiceSettings);

  const { data: current, isLoading } = useQuery({
    queryKey: ["invoice-settings"],
    queryFn: () => load(),
  });

  const [draft, setDraft] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [manualStart, setManualStart] = useState("");

  useEffect(() => {
    if (current) {
      setDraft({
        prefix: current.prefix,
        startNumber: current.startNumber,
        currentNumber: current.currentNumber,
        nextNumber: current.nextNumber,
      });
    }
  }, [current]);

  const handleResetTo01 = () => {
    if (confirm("Reset invoice sequence to 01? The next order will be CZP-01.")) {
      mutation.mutate({
        data: {
          ...draft,
          nextNumber: 1,
        } as never,
      });
    }
  };

  const handleSetStartingNumber = () => {
    const num = parseInt(manualStart);
    if (isNaN(num) || num < 1) {
      toast.error("Please enter a valid starting number.");
      return;
    }

    if (confirm(`Set starting number to ${num}? The next order will be ${draft.prefix}-${num.toString().padStart(2, '0')}.`)) {
      mutation.mutate({
        data: {
          ...draft,
          nextNumber: num,
        } as never,
      });
      setManualStart("");
    }
  };

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Invoice settings saved");
      void queryClient.invalidateQueries({ queryKey: ["invoice-settings"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save settings."),
  });

  if (isLoading) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">
            Invoice Number Settings
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure how invoice numbers are generated for new orders.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Current Info */}
        <div className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/10 dark:bg-primary/5 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Current Invoice Number
          </span>
          <p className="font-mono text-2xl font-bold">
            {current?.prefix}-{(current?.currentNumber ?? 0) < 10 && (current?.currentNumber ?? 0) > 0 ? (current?.currentNumber ?? 0).toString().padStart(2, "0") : (current?.currentNumber ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground italic">
            Last order was assigned serial {current?.currentNumber}.
          </p>
        </div>

        {/* Manual Sequence Control */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="manualStart"
              className="text-xs font-bold uppercase tracking-wide"
            >
              Starting Invoice Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="manualStart"
                type="number"
                placeholder="01"
                className="h-10 font-bold"
                value={manualStart}
                disabled={!canManage || mutation.isPending}
                onChange={(e) => setManualStart(e.target.value)}
                min={1}
              />
              <Button
                type="button"
                variant="red"
                className="h-10 px-4 uppercase font-bold text-[11px] tracking-wider shrink-0 focus-visible:ring-offset-2"
                disabled={!canManage || mutation.isPending || !manualStart}
                onClick={() => handleSetStartingNumber()}
              >
                Set Starting Number
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Example: Entering 500 will make the next order CZP-500.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 border-red-500/50 text-red-500 hover:bg-red-500/10 uppercase font-bold text-[11px] tracking-wider focus-visible:ring-offset-2"
              disabled={!canManage || mutation.isPending}
              onClick={() => handleResetTo01()}
            >
              Reset to 01
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Resets the sequence so the next order starts from CZP-01.
            </p>
          </div>
        </div>

        {/* Prefix Setting (Secondary) */}
        <div className="pt-4 border-t border-border/50">
          <div className="space-y-1.5">
            <Label
              htmlFor="prefix"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Invoice Prefix
            </Label>
            <div className="flex gap-2">
              <Input
                id="prefix"
                placeholder="e.g. CZP"
                className="h-10 font-bold uppercase"
                value={draft.prefix}
                disabled={!canManage || mutation.isPending}
                onChange={(e) => setDraft((c) => ({ ...c, prefix: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-10 px-4 uppercase font-bold text-[11px] tracking-wider shrink-0"
                disabled={!canManage || mutation.isPending || draft.prefix === current?.prefix}
                onClick={() => {
                  mutation.mutate({ data: { ...draft, nextNumber: undefined } as never });
                }}
              >
                Update Prefix
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
