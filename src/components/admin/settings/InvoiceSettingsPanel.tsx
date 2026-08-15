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

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.nextNumber !== undefined && draft.nextNumber !== current?.nextNumber) {
            if (!confirm(`Are you sure you want to change the NEXT invoice serial to ${draft.prefix}-${draft.nextNumber}? This affects future orders.`)) {
              return;
            }
          }
          mutation.mutate({ data: draft as never });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="prefix"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Invoice Prefix
            </Label>
            <Input
              id="prefix"
              placeholder="e.g. CZP"
              className="h-10 font-bold uppercase"
              value={draft.prefix}
              disabled={!canManage || mutation.isPending}
              onChange={(e) => setDraft((c) => ({ ...c, prefix: e.target.value.toUpperCase() }))}
              maxLength={10}
            />
            <p className="text-[10px] text-muted-foreground">Example: {draft.prefix}-01</p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="startNumber"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Starting Invoice Number
            </Label>
            <Input
              id="startNumber"
              type="number"
              placeholder="e.g. 1"
              className="h-10 font-bold"
              value={draft.startNumber}
              disabled={!canManage || mutation.isPending}
              onChange={(e) =>
                setDraft((c) => ({ ...c, startNumber: parseInt(e.target.value) || 1 }))
              }
              min={1}
            />
            <p className="text-[10px] text-muted-foreground">
              The sequence will follow this if current is lower.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="nextNumber"
              className="text-[10px] font-bold uppercase tracking-wider text-primary"
            >
              Set Next Invoice Serial
            </Label>
            <Input
              id="nextNumber"
              type="number"
              placeholder="e.g. 100"
              className="h-10 font-bold border-primary/50"
              value={draft.nextNumber ?? ""}
              disabled={!canManage || mutation.isPending}
              onChange={(e) =>
                setDraft((c) => ({ ...c, nextNumber: parseInt(e.target.value) || 1 }))
              }
              min={1}
            />
            <p className="text-[10px] text-muted-foreground">
              Manually override the NEXT number to be generated.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="currentNumber"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Last Used Serial
            </Label>
            <div className="h-10 px-3 flex items-center rounded-md border border-input bg-neutral-900 font-mono text-sm">
              {current?.currentNumber ?? 0}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Informational only. Use "Next Serial" to jump sequence.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Next Invoice Preview
              </span>
              <p className="font-mono text-lg font-bold">
                {draft.prefix}-{Math.max(draft.startNumber, draft.nextNumber ?? (draft.currentNumber + 1))
                  .toString()
                  .padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-[10px] text-muted-foreground italic">
              Current count: {current?.currentNumber ?? 0}
            </div>
            <Button
              type="submit"
              variant="red"
              size="sm"
              className="h-9 px-4 uppercase font-bold text-[11px] tracking-wider"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
