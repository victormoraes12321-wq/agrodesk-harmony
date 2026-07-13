import type { TicketPriority, TicketStatus } from "@/types";

export const STATUS_FLOW: TicketStatus[] = [
  "ABERTO",
  "EM_ANALISE",
  "EM_ATENDIMENTO",
  "AGUARDANDO_USUARIO",
  "AGUARDANDO_PECA",
  "RESOLVIDO",
  "FINALIZADO",
  "CANCELADO",
  "REABERTO",
];

export const PRIORITY_LEVELS: TicketPriority[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

export const KANBAN_COLUMNS: Array<{ id: TicketStatus; title: string }> = [
  { id: "ABERTO", title: "Aberto" },
  { id: "EM_ANALISE", title: "Em analise" },
  { id: "EM_ATENDIMENTO", title: "Em atendimento" },
  { id: "AGUARDANDO_USUARIO", title: "Aguardando usuario" },
  { id: "AGUARDANDO_PECA", title: "Aguardando peca/terceiro" },
  { id: "RESOLVIDO", title: "Resolvido" },
  { id: "FINALIZADO", title: "Finalizado" },
  { id: "CANCELADO", title: "Cancelado" },
];
