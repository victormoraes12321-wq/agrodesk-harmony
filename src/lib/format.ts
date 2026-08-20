import type { TicketPriority, TicketStatus } from "@/types";

export const statusLabel: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em analise",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_USUARIO: "Aguardando usuario",
  AGUARDANDO_PECA: "Aguardando peca/terceiro",
  RESOLVIDO: "Resolvido",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  REABERTO: "Reaberto",
};

export const priorityLabel: Record<TicketPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Critica",
};

export const statusTone: Record<TicketStatus, string> = {
  ABERTO: "bg-info/15 text-info border-info/30",
  EM_ANALISE: "bg-accent/15 text-accent border-accent/30",
  EM_ATENDIMENTO: "bg-primary/15 text-primary border-primary/30",
  AGUARDANDO_USUARIO: "bg-warning/20 text-warning-foreground border-warning/40",
  AGUARDANDO_PECA: "bg-warning/15 text-warning-foreground border-warning/30",
  RESOLVIDO: "bg-success/15 text-success border-success/30",
  FINALIZADO: "bg-success/25 text-success border-success/40",
  CANCELADO: "bg-muted text-muted-foreground border-border",
  REABERTO: "bg-destructive/15 text-destructive border-destructive/30",
};

export const priorityTone: Record<TicketPriority, string> = {
  BAIXA: "bg-muted text-muted-foreground border-border",
  MEDIA: "bg-info/15 text-info border-info/30",
  ALTA: "bg-warning/20 text-warning-foreground border-warning/40",
  CRITICA: "bg-destructive/15 text-destructive border-destructive/30",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atras`;
  const days = Math.floor(hours / 24);
  return `${days} d atras`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function slaStatus(
  createdAt: string,
  slaHours: number,
  closedAt?: string,
): { label: string; tone: string; pct: number } {
  const endTime = closedAt ? new Date(closedAt).getTime() : Date.now();
  const elapsedHours = (endTime - new Date(createdAt).getTime()) / 3600000;
  const pct = Math.min(100, (elapsedHours / Math.max(1, slaHours)) * 100);

  if (closedAt) return { label: "Concluido", tone: "text-success", pct: 100 };
  if (pct >= 100) return { label: "Vencido", tone: "text-destructive", pct: 100 };
  if (pct >= 75) return { label: "Atencao", tone: "text-warning-foreground", pct };
  return { label: "No prazo", tone: "text-success", pct };
}

export function maskPhone(value?: string | null): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

