import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TicketSlaChip({
  createdAt,
  slaHours,
  closedAt,
  className,
}: {
  createdAt: string;
  slaHours: number;
  closedAt?: string;
  className?: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (closedAt) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [closedAt]);

  const limitTime = new Date(createdAt).getTime() + slaHours * 3600000;
  const remainingMs = limitTime - Date.now();
  const totalMs = slaHours * 3600000;
  const percentageRemaining = Math.max(0, Math.min(1, remainingMs / totalMs));

  if (closedAt) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-success/15 text-success border border-success/30",
          className,
        )}
      >
        <CheckCircle2 className="size-3.5" /> Concluído
      </span>
    );
  }

  if (remainingMs <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30",
          className,
        )}
      >
        <AlertTriangle className="size-3.5" /> SLA Vencido
      </span>
    );
  }

  // Format remaining time
  const remainingHrs = Math.floor(remainingMs / 3600000);
  const remainingMins = Math.floor((remainingMs % 3600000) / 60000);
  const timeStr = remainingHrs > 0 
    ? `${remainingHrs}h ${remainingMins}m` 
    : `${remainingMins}m`;

  let colorClass = "bg-success/15 text-success border-success/30";
  let barColorClass = "bg-success";
  if (percentageRemaining <= 0.25) {
    colorClass = "bg-destructive/15 text-destructive border-destructive/30 animate-pulse";
    barColorClass = "bg-destructive";
  } else if (percentageRemaining <= 0.50) {
    colorClass = "bg-warning/20 text-warning-foreground border-warning/30";
    barColorClass = "bg-warning";
  }

  return (
    <div className={cn("flex flex-col gap-1.5 w-full min-w-[140px] max-w-[200px]", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border", colorClass)}>
          <Clock3 className="size-3" /> {timeStr}
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold font-mono">
          {Math.round(percentageRemaining * 100)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border">
        <div 
          className={cn("h-full transition-all duration-500", barColorClass)} 
          style={{ width: `${percentageRemaining * 100}%` }} 
        />
      </div>
    </div>
  );
}
