import {
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  FileCheck2,
  Star,
  UserCheck,
} from "lucide-react";
import { formatDateTime, statusLabel } from "@/lib/format";
import type { Ticket } from "@/types";

interface TicketTimelineStepperProps {
  ticket: Ticket;
}

export function TicketTimelineStepper({ ticket }: TicketTimelineStepperProps) {
  const isResolvedOrClosed =
    ticket.status === "RESOLVIDO" || ticket.status === "FINALIZADO";
  const isCanceled = ticket.status === "CANCELADO";
  const isReopened = ticket.status === "REABERTO";

  const steps = [
    {
      id: "OPEN",
      title: isReopened ? "OS Reaberta" : "OS Registrada",
      description: `Aberto por ${ticket.requesterName}`,
      time: (ticket as any).reopenedAt || ticket.createdAt,
      status: "COMPLETED",
      icon: Clock,
    },
    {
      id: "IN_PROGRESS",
      title: "Em Atendimento",
      description: ticket.assigneeId
        ? "Técnico responsável atribuído"
        : "Aguardando atribuição de técnico",
      time: (ticket as any).firstResponseAt || (ticket.status !== "ABERTO" ? ticket.updatedAt : undefined),
      status:
        ticket.status === "ABERTO"
          ? "PENDING"
          : isResolvedOrClosed || ticket.status === "EM_ATENDIMENTO" || ticket.status === "AGUARDANDO_PECA" || ticket.status === "AGUARDANDO_USUARIO"
            ? "COMPLETED"
            : "CURRENT",
      icon: Wrench,
    },
    {
      id: "WAITING",
      title:
        ticket.status === "AGUARDANDO_PECA"
          ? "Aguardando Peça / Terceiro"
          : ticket.status === "AGUARDANDO_USUARIO"
            ? "Aguardando Retorno do Usuário"
            : "Aguardos & Peças",
      description:
        ticket.status === "AGUARDANDO_PECA" || ticket.status === "AGUARDANDO_USUARIO"
          ? ticket.waitingRequesterMessage || "Pausa temporária de SLA"
          : "Nenhuma pendência externa",
      time:
        ticket.status === "AGUARDANDO_PECA" || ticket.status === "AGUARDANDO_USUARIO"
          ? ticket.updatedAt
          : undefined,
      status:
        ticket.status === "AGUARDANDO_PECA" || ticket.status === "AGUARDANDO_USUARIO"
          ? "CURRENT"
          : "OPTIONAL",
      icon: AlertCircle,
      hidden: ticket.status !== "AGUARDANDO_PECA" && ticket.status !== "AGUARDANDO_USUARIO" && !isResolvedOrClosed,
    },
    {
      id: "RESOLVED",
      title: "Solução Aplicada & Conclusão",
      description: ticket.solution
        ? `Solução: ${ticket.solution}`
        : isResolvedOrClosed
          ? "Atendimento finalizado com sucesso"
          : "Aguardando conclusão do chamado",
      time: ticket.resolvedAt || ticket.closedAt,
      status: isResolvedOrClosed ? "COMPLETED" : "PENDING",
      icon: FileCheck2,
    },
    {
      id: "RATED",
      title: ticket.rating && ticket.rating > 0 ? "Atendimento Avaliado" : "Avaliação de Satisfação",
      description:
        ticket.rating && ticket.rating > 0
          ? `${"⭐".repeat(ticket.rating)} (${ticket.rating}/5 estrelas)${ticket.ratingComment ? ` - "${ticket.ratingComment}"` : ""}`
          : isResolvedOrClosed
            ? "Aguardando avaliação do solicitante"
            : "Disponível após conclusão",
      time: ticket.rating && ticket.rating > 0 ? ticket.updatedAt : undefined,
      status: ticket.rating && ticket.rating > 0 ? "COMPLETED" : isResolvedOrClosed ? "CURRENT" : "PENDING",
      icon: Star,
    },
  ].filter((s) => !s.hidden);

  if (isCanceled) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <div>
            <h4 className="font-semibold text-destructive">Ordem de Serviço Cancelada</h4>
            <p className="text-xs text-muted-foreground">
              Cancelada em {formatDateTime(ticket.closedAt || ticket.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Linha do Tempo da Ordem de Serviço
        </h4>
        <span className="text-xs text-muted-foreground font-mono">
          Status atual: {statusLabel[ticket.status]}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-foreground/20">
        {steps.map((step, index) => {
          const isCompleted = step.status === "COMPLETED";
          const isCurrent = step.status === "CURRENT";
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start gap-4 group">
              <div
                className={`absolute -left-6 top-0.5 flex size-6 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-background transition-colors ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p
                    className={`text-sm font-semibold ${
                      isCompleted
                        ? "text-foreground"
                        : isCurrent
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.time && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatDateTime(step.time)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
