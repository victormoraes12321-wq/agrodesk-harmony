import { AlertTriangle, CheckCircle2, Clock3, PauseCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TicketSlaChip({
  createdAt,
  slaHours,
  closedAt,
  status,
  slaDueAt,
  className,
  showDetailed = false,
}: {
  createdAt: string;
  slaHours: number;
  closedAt?: string;
  status?: string;
  slaDueAt?: string;
  className?: string;
  showDetailed?: boolean;
}) {
  const [tick, setTick] = useState(0);

  const isPaused =
    status === "AGUARDANDO_PECA" ||
    status === "AGUARDANDO_USUARIO" ||
    status === "WAITING_PARTS_OR_THIRD_PARTY" ||
    status === "WAITING_USER";

  const isClosed =
    status === "RESOLVIDO" ||
    status === "FINALIZADO" ||
    status === "CLOSED" ||
    status === "RESOLVED" ||
    Boolean(closedAt);

  const isCanceled = status === "CANCELADO" || status === "CANCELED";

  useEffect(() => {
    if (isClosed || isPaused || isCanceled) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [isClosed, isPaused, isCanceled]);

  if (isClosed) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
          className,
        )}
      >
        <CheckCircle2 className="size-3.5" /> Concluído
      </span>
    );
  }

  if (isCanceled) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-muted text-muted-foreground border border-border",
          className,
        )}
      >
        <XCircle className="size-3.5" /> Cancelado
      </span>
    );
  }

  if (isPaused) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse",
          className,
        )}
      >
        <PauseCircle className="size-3.5" /> SLA Pausado (Aguardando)
      </span>
    );
  }

  const limitTime = slaDueAt
    ? new Date(slaDueAt).getTime()
    : new Date(createdAt).getTime() + (slaHours || 24) * 3600000;
  const remainingMs = limitTime - Date.now();
  const totalMs = Math.max(3600000, limitTime - new Date(createdAt).getTime());
  const percentageRemaining = Math.max(0, Math.min(1, remainingMs / totalMs));

  if (remainingMs <= 0) {
    const overdueHrs = Math.floor(Math.abs(remainingMs) / 3600000);
    const overdueMins = Math.floor((Math.abs(remainingMs) % 3600000) / 60000);
    const overdueStr = overdueHrs > 0 ? `${overdueHrs}h ${overdueMins}m` : `${overdueMins}m`;

    return (
      <div className={cn("inline-flex flex-col gap-1", className)}>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30 animate-pulse"
        >
          <AlertTriangle className="size-3.5" /> SLA Vencido (+{overdueStr})
        </span>
        {showDetailed && (
          <span className="text-[11px] text-muted-foreground font-medium">
            Prazo expirou em: {new Date(limitTime).toLocaleDateString("pt-BR")} às {new Date(limitTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    );
  }

  // Format remaining time
  const remainingHrs = Math.floor(remainingMs / 3600000);
  const remainingMins = Math.floor((remainingMs % 3600000) / 60000);
  const timeStr = remainingHrs > 0 ? `${remainingHrs}h ${remainingMins}m` : `${remainingMins}m`;

  let colorClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  let barColorClass = "bg-emerald-500";
  if (percentageRemaining <= 0.25) {
    colorClass = "bg-destructive/15 text-destructive border-destructive/30 animate-pulse";
    barColorClass = "bg-destructive";
  } else if (percentageRemaining <= 0.5) {
    colorClass = "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
    barColorClass = "bg-amber-500";
  }

  const deadlineDate = new Date(limitTime);
  const deadlineStr = `${deadlineDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${deadlineDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full min-w-[140px]", showDetailed ? "max-w-[280px]" : "max-w-[200px]", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-sm", colorClass)}>
          <Clock3 className="size-3" /> {timeStr} restantes
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold font-mono">
          {Math.round(percentageRemaining * 100)}%
        </span>
      </div>
      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden border">
        <div
          className={cn("h-full transition-all duration-500 rounded-full", barColorClass)}
          style={{ width: `${percentageRemaining * 100}%` }}
        />
      </div>
      {showDetailed && (
        <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
          <span>Prazo: <strong>{deadlineStr}</strong></span>
          <span>Total: {slaHours || 24}h</span>
        </span>
      )}
    </div>
  );
}
