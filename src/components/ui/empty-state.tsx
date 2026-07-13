import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  compact = false,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-center rounded-2xl border border-dashed bg-muted/20",
        compact ? "p-6" : "p-10",
      )}
    >
      <div className="size-14 rounded-2xl bg-muted mx-auto grid place-items-center border">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mt-4 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
