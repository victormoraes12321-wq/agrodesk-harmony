import type { Branch, Category, Department, Ticket, TicketStatus, User } from "@/types";

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "TI_ADMIN";
}

export function canViewTicket(user: User | null | undefined, ticket: Ticket): boolean {
  if (!user) return false;
  if (user.role === "TI_ADMIN") return true;
  return ticket.requesterId === user.id;
}

export function byIdName(items: Array<{ id: string; name: string }>, id?: string): string {
  if (!id) return "Nao informado";
  return items.find((item) => item.id === id)?.name ?? "Nao informado";
}

export function getDepartmentName(departments: Department[], id?: string): string {
  return byIdName(departments, id);
}

export function formatBranchName(name: string): string {
  if (!name.trim()) return "Nao informado";
  return name.replace(/^Loja\b/i, "Filial");
}

export function getBranchName(branches: Branch[], id?: string): string {
  return formatBranchName(byIdName(branches, id));
}

export function getCategoryName(categories: Category[], id?: string): string {
  return byIdName(categories, id);
}

export function getUserName(users: User[], id?: string): string {
  return byIdName(users, id);
}

export function isSlaPaused(status: TicketStatus): boolean {
  return (
    status === "AGUARDANDO_PECA" ||
    status === "AGUARDANDO_USUARIO" ||
    status === "RESOLVIDO" ||
    status === "FINALIZADO" ||
    status === "CANCELADO"
  );
}

export function isSlaOverdue(ticket: Ticket): boolean {
  if (isSlaPaused(ticket.status)) return false;
  if (ticket.closedAt || ticket.resolvedAt) return false;
  if (ticket.slaDueAt) {
    return new Date(ticket.slaDueAt).getTime() < Date.now();
  }
  const elapsedHours = (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000;
  return elapsedHours > ticket.slaHours;
}

export function isSlaNear(ticket: Ticket): boolean {
  if (isSlaPaused(ticket.status)) return false;
  if (ticket.closedAt || ticket.resolvedAt) return false;
  if (ticket.slaDueAt) {
    const dueTime = new Date(ticket.slaDueAt).getTime();
    const now = Date.now();
    const createdTime = new Date(ticket.createdAt).getTime();
    const totalDuration = Math.max(3600000, dueTime - createdTime);
    const elapsed = now - createdTime;
    const ratio = elapsed / totalDuration;
    return ratio >= 0.75 && ratio <= 1.0;
  }
  const elapsedHours = (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000;
  return elapsedHours >= ticket.slaHours * 0.75 && elapsedHours <= ticket.slaHours;
}

export function isClosedStatus(status: TicketStatus): boolean {
  return status === "FINALIZADO" || status === "CANCELADO";
}

export function avgResolutionHours(tickets: Ticket[]): number {
  const done = tickets.filter((ticket) => Boolean(ticket.closedAt));
  if (done.length === 0) return 0;
  const total = done.reduce((sum, ticket) => {
    const hours =
      (new Date(ticket.closedAt as string).getTime() - new Date(ticket.createdAt).getTime()) /
      3600000;
    return sum + Math.max(0, hours);
  }, 0);
  return total / done.length;
}

export function avgRating(tickets: Ticket[]): number {
  const rated = tickets.filter((ticket) => typeof ticket.rating === "number");
  if (rated.length === 0) return 0;
  const total = rated.reduce((sum, ticket) => sum + (ticket.rating ?? 0), 0);
  return total / rated.length;
}
