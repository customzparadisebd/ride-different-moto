import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Trash2, Save, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFraudMark, setFraudMark, removeFraudMark } from "@/lib/customer-fraud.functions";

interface MarkFraudDialogProps {
  phoneNumber: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
}

export function MarkFraudDialog({
  phoneNumber,
  customerName,
  open,
  onOpenChange,
  canManage = false,
}: MarkFraudDialogProps) {
  const queryClient = useQueryClient();
  const fetchMark = useServerFn(getFraudMark);
  const saveMark = useServerFn(setFraudMark);
  const deleteMark = useServerFn(removeFraudMark);

  const [markType, setMarkType] = useState<"fraud" | "warning">("fraud");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const markQuery = useQuery({
    queryKey: ["customer-fraud", phoneNumber],
    queryFn: () => fetchMark({ data: { phoneNumber } }),
    enabled: open,
  });

  useEffect(() => {
    if (markQuery.data) {
      setMarkType((markQuery.data.mark_type as "fraud" | "warning") || "fraud");
      setLabel(markQuery.data.label || "");
      setNote(markQuery.data.note || "");
    } else if (!markQuery.isLoading) {
      setMarkType("fraud");
      setLabel("");
      setNote("");
    }
  }, [markQuery.data, markQuery.isLoading]);

  const saveMutation = useMutation({
    mutationFn: saveMark,
    onSuccess: () => {
      toast.success("Fraud status updated");
      queryClient.invalidateQueries({ queryKey: ["customer-fraud", phoneNumber] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMark,
    onSuccess: () => {
      toast.success("Fraud status removed");
      queryClient.invalidateQueries({ queryKey: ["customer-fraud", phoneNumber] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to remove"),
  });

  const handleSave = () => {
    if (!note.trim()) {
      toast.error("Note is required");
      return;
    }
    saveMutation.mutate({
      data: { phoneNumber, markType, label, note },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase">
            <ShieldAlert className="size-5 text-red-500" />
            Mark Fraud - <span className="text-red-500">{customerName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">Type *</label>
            <Select
              disabled={!canManage}
              value={markType}
              onValueChange={(v) => setMarkType(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fraud">Fraud</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">Label (%)</label>
            <Input
              disabled={!canManage}
              placeholder="Enter label (e.g. 100% Fraud)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">Note *</label>
            <Textarea
              disabled={!canManage}
              placeholder="Enter note why this customer is marked..."
              className="min-h-[120px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {markQuery.data?.marked_by_label && (
              <p className="text-[10px] text-muted-foreground italic">
                Marked by {markQuery.data.marked_by_label} on{" "}
                {new Date(markQuery.data.marked_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>

          {canManage && (
            <>
              {markQuery.data && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to remove this fraud mark?")) {
                      deleteMutation.mutate({ data: { phoneNumber } });
                    }
                  }}
                  disabled={deleteMutation.isPending || saveMutation.isPending}
                >
                  <Trash2 className="mr-2 size-4" />
                  Remove
                </Button>
              )}
              <Button
                variant="red"
                onClick={handleSave}
                disabled={saveMutation.isPending || deleteMutation.isPending}
              >
                <Save className="mr-2 size-4" />
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
