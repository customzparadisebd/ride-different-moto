import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Shield, Loader2, Check, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  ASSIGNABLE_PERMISSIONS,
  type Permission,
} from "@/lib/admin.shared";
import { setStaffPermissions } from "@/lib/admin.functions";

interface UserPermissionsDialogProps {
  userId: string | null;
  userName: string;
  initialPermissions: Permission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPermissionsDialog({
  userId,
  userName,
  initialPermissions,
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(initialPermissions);
    }
  }, [open, initialPermissions]);

  const handleToggle = (permission: string) => {
    setSelected((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await setStaffPermissions({ data: { userId, permissions: selected } });
      toast.success("Permissions updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permissions.");
    } finally {
      setBusy(false);
    }
  };

  const selectAll = () => setSelected(ASSIGNABLE_PERMISSIONS);
  const selectNone = () => setSelected([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle className="uppercase font-display tracking-wide">
              Edit Permissions: {userName}
            </DialogTitle>
          </div>
          <DialogDescription>
            Grant specific permissions beyond the role baseline. Sensitive permissions are
            restricted to Super Admins.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {selected.length} Selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] uppercase"
              onClick={selectNone}
            >
              Clear All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] uppercase"
              onClick={selectAll}
            >
              Select All
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4 my-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {ASSIGNABLE_PERMISSIONS.map((permission) => (
              <div key={permission} className="flex items-start space-x-3 group">
                <Checkbox
                  id={`perm-${permission}`}
                  checked={selected.includes(permission)}
                  onCheckedChange={() => handleToggle(permission)}
                  className="mt-0.5"
                />
                <div className="grid gap-1 leading-none">
                  <Label
                    htmlFor={`perm-${permission}`}
                    className="text-sm font-bold uppercase tracking-tight cursor-pointer group-hover:text-primary transition-colors"
                  >
                    {PERMISSION_LABELS[permission as Permission]}
                  </Label>
                  <p className="text-[10px] font-mono text-muted-foreground">{permission}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-border/50 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="red" onClick={handleSave} disabled={busy || userId === null}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
