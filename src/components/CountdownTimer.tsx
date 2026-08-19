import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endDate: string | null;
  endTime: string | null;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ endDate, endTime, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!endDate && !endTime) return;

    const calculateTimeLeft = () => {
      // Create date in Asia/Dhaka (UTC+6)
      const now = new Date();
      const nowUTC = now.getTime() + now.getTimezoneOffset() * 60000;
      const nowDhaka = new Date(nowUTC + 3600000 * 6);

      let targetStr = "";
      if (endDate) {
        targetStr = endDate;
        if (endTime) targetStr += `T${endTime}`;
        else targetStr += "T23:59:59";
      } else if (endTime) {
        const today = nowDhaka.toISOString().split("T")[0];
        targetStr = `${today}T${endTime}`;
      }

      const target = new Date(targetStr);
      const diff = target.getTime() - nowDhaka.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        onExpire?.();
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({ h, m, s });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate, endTime, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className={cn("flex items-center gap-1 font-mono text-sm", className)}>
      <Timer className="size-3 text-primary animate-pulse" />
      <span className="text-white/60 text-[10px] uppercase tracking-tighter mr-1">Ends in:</span>
      <div className="flex gap-1">
        <TimeUnit value={timeLeft.h} label="h" />
        <span className="text-primary">:</span>
        <TimeUnit value={timeLeft.m} label="m" />
        <span className="text-primary">:</span>
        <TimeUnit value={timeLeft.s} label="s" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline">
      <span className="text-white font-bold">{value.toString().padStart(2, "0")}</span>
      <span className="text-[8px] text-muted-foreground ml-0.5">{label}</span>
    </div>
  );
}
