import { statusLabel, statusTone, priorityLabel, priorityTone } from "@/lib/format";
import type { TicketPriority, TicketStatus } from "@/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        statusTone[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        priorityTone[priority],
        className,
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
