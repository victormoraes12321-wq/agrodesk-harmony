import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "info" | "warning" | "danger" | "success";
  trend?: { value: string; positive?: boolean };
  onClick?: () => void;
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className={cn("size-9 sm:size-10 rounded-xl grid place-items-center", toneMap[tone])}>
          <Icon className="size-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
      </div>
    </>
  );

  const className =
    "group rounded-2xl border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 w-full text-left hover-card-premium";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, "cursor-pointer")}>
        {content}
      </button>
    );
  }

  return <div className={cn(className, "cursor-default")}>{content}</div>;
}
