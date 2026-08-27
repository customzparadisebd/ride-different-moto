// ============================================================
// INVOICE SETTINGS PANEL
// Purpose: Manage invoice prefix and the next serial number.
// Security: Requires Admin/Super Admin access.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInvoiceSettings, saveInvoiceSettings } from "@/lib/invoice-settings.functions";
import {
  DEFAULT_INVOICE_SETTINGS,
  formatInvoiceNo,
  type InvoiceSettings,
  type InvoiceSettingsState,
} from "@/lib/invoicing.shared";

export function InvoiceSettingsPanel({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getInvoiceSettings);
  const save = useServerFn(saveInvoiceSettings);

  const { data: current, isLoading } = useQuery({
    queryKey: ["invoice-settings"],
    queryFn: () => load(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const [draft, setDraft] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [manualStart, setManualStart] = useState("");

  useEffect(() => {
    if (current) {
      setDraft({
        prefix: current.prefix,
        startNumber: current.startNumber,
        currentNumber: current.currentNumber,
      });
    }
  }, [current]);

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: (state: InvoiceSettingsState) => {
      // Write the authoritative state straight into the cache so every
      // invoice screen sees the new number immediately.
      queryClient.setQueryData(["invoice-settings"], state);
      toast.success(`Saved. Next invoice will be ${state.nextInvoiceNo}`);
      // Do not immediately refetch and overwrite the mutation response with a
      // stale in-flight read. The returned state is the committed DB value.
      void queryClient.cancelQueries({ queryKey: ["invoice-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save settings."),
  });

  const handleResetTo01 = () => {
    if (confirm(`Reset invoice sequence to 01? The next order will be ${draft.prefix}-01, even if that invoice number exists in history. Historical orders will not change.`)) {
      mutation.mutate({ data: { ...draft, nextNumber: 1 } });
    }
  };

  const handleSetStartingNumber = () => {
    const num = parseInt(manualStart, 10);
    if (isNaN(num) || num < 1) {
      toast.error("Please enter a valid starting number.");
      return;
    }

    if (confirm(`Set starting number to ${num}? The next order will be ${formatInvoiceNo(draft.prefix, num)}, even if that invoice number exists in history. Historical orders will not change.`)) {
      mutation.mutate({ data: { ...draft, nextNumber: num } });
      setManualStart("");
    }
  };

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
        {/* Live state */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/10 p-4 dark:bg-primary/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Current Active Invoice Number
            </span>
            <p className="font-mono text-2xl font-bold">{current?.nextInvoiceNo ?? "—"}</p>
            <p className="text-[10px] italic text-muted-foreground">
              The next order created anywhere will use this number.
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Last Issued Invoice
            </span>
            <p className="font-mono text-2xl font-bold">{current?.lastInvoiceNo ?? "—"}</p>
            <p className="text-[10px] italic text-muted-foreground">
              Existing orders keep their original invoice numbers.
            </p>
          </div>
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
                className="h-10 shrink-0 px-4 text-[11px] font-bold uppercase tracking-wider focus-visible:ring-offset-2"
                disabled={!canManage || mutation.isPending || !manualStart}
                onClick={() => handleSetStartingNumber()}
              >
                Set Starting Number
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              The next order uses exactly this number. Historical invoice labels may repeat.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full border-red-500/50 text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 focus-visible:ring-offset-2"
              disabled={!canManage || mutation.isPending}
              onClick={() => handleResetTo01()}
            >
              Reset to 01
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              The next order starts from {draft.prefix}-01 without changing invoice history.
            </p>
          </div>
        </div>

        {/* Prefix Setting (Secondary) */}
        <div className="border-t border-border/50 pt-4">
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
                className="h-10 shrink-0 px-4 text-[11px] font-bold uppercase tracking-wider"
                disabled={!canManage || mutation.isPending || draft.prefix === current?.prefix}
                onClick={() => mutation.mutate({ data: { ...draft } })}
              >
                Update Prefix
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Changing the prefix applies to new orders only; the counter is kept as-is.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
