import { statusLabel, statusTone, priorityLabel, priorityTone } from "@/lib/format";
import type { TicketPriority, TicketStatus } from "@/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const isPulsing =
    status === "EM_ATENDIMENTO" ||
    status === "EM_ANALISE" ||
    status === "AGUARDANDO_USUARIO" ||
    status === "AGUARDANDO_PECA" ||
    status === "REABERTO";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border shadow-sm transition-all duration-200",
        statusTone[status],
        className,
      )}
    >
      <span className="relative flex size-2">
        {isPulsing && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
        )}
        <span className="relative inline-flex rounded-full size-2 bg-current" />
      </span>
      {statusLabel[status]}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border shadow-sm transition-all duration-200",
        priorityTone[priority],
        className,
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
