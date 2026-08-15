import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStaffActivity } from "@/lib/admin.functions";

interface UserActivityDialogProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserActivityDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserActivityDialogProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["staff-activity", userId],
    queryFn: () => (userId ? getStaffActivity({ data: { userId: userId as string } }) : null),
    enabled: !!userId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wider">
            <History className="size-5 text-primary" />
            Activity Log: {userName}
          </DialogTitle>
          <DialogDescription>Recent actions and changes made by this user.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6 pt-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((log: any) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 border-b border-border/50 pb-3 last:border-0"
                >
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-bold text-foreground">{userName}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-primary uppercase tracking-tight text-xs">
                      {log.action.replace(/\./g, " ").replace(/_/g, " ")}
                    </span>
                    {log.target_label && (
                      <>
                        <span className="text-muted-foreground">on</span>
                        <span className="font-medium text-foreground">{log.target_label}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{format(new Date(log.created_at), "h:mm a")}</span>
                    <span>·</span>
                    <span>{format(new Date(log.created_at), "d MMM yyyy")}</span>
                    {log.ip_address && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{log.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No activity recorded for this user.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
