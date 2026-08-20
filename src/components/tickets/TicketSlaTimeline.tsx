import React from "react";
import { Clock, Play, Pause, Calendar, CheckCircle2, AlertTriangle, FastForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Ticket } from "@/types";

interface TicketSlaTimelineProps {
  ticket: Ticket;
}

export function TicketSlaTimeline({ ticket }: TicketSlaTimelineProps) {
  const createdAt = new Date(ticket.createdAt);
  const now = Date.now();
  const dueAt = ticket.slaDueAt
    ? new Date(ticket.slaDueAt).getTime()
    : createdAt.getTime() + (ticket.slaHours || 24) * 3600000;

  const totalDuration = Math.max(1, dueAt - createdAt.getTime());
  const elapsed = Math.max(0, now - createdAt.getTime());
  const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  const isResolved =
    ticket.status === "RESOLVIDO" || ticket.status === "FINALIZADO";
  const isCanceled = ticket.status === "CANCELADO";
  const isPaused =
    ticket.status === "AGUARDANDO_USUARIO" ||
    ticket.status === "AGUARDANDO_PECA";

  const isOverdue = !isResolved && !isCanceled && !isPaused && now > dueAt;

  // Find extension comments if any
  const extensionComments = (ticket.comments || []).filter(
    (c) => c.content && c.content.includes("Prazo de SLA"),
  );

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              Timeline de Cumprimento de SLA
              {isOverdue ? (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="size-3" /> SLA Estourado
                </Badge>
              ) : isPaused ? (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1">
                  <Pause className="size-3" /> SLA Pausado
                </Badge>
              ) : isResolved ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                  <CheckCircle2 className="size-3" /> Concluído
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                  <Play className="size-3 animate-pulse" /> Em Andamento
                </Badge>
              )}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Abertura: {createdAt.toLocaleDateString("pt-BR")} às{" "}
              {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} • Prazo:{" "}
              {new Date(dueAt).toLocaleDateString("pt-BR")} às{" "}
              {new Date(dueAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Tempo Decorrido do SLA</span>
          <span
            className={
              isOverdue
                ? "text-destructive font-bold"
                : percent > 80
                  ? "text-amber-600 font-bold"
                  : "text-emerald-600 font-bold"
            }
          >
            {isOverdue ? "100% (Excedido)" : `${percent}%`}
          </span>
        </div>
        <Progress
          value={percent}
          className={`h-2 ${isOverdue ? "[&>div]:bg-destructive" : percent > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
        />
      </div>

      {/* SLA Extensions Log if any */}
      {extensionComments.length > 0 && (
        <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-1.5 text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <FastForward className="size-3.5 text-primary" />
            Prorrogações de Prazo Registradas:
          </span>
          {extensionComments.map((ext, idx) => (
            <div key={idx} className="text-[11px] text-muted-foreground pl-5 border-l-2 border-primary/40">
              {ext.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
