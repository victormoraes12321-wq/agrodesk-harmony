import type { Ticket, TicketPriority, TicketStatus } from "@/types";

export function groupByStatus(tickets: Ticket[]): Array<{ status: TicketStatus; total: number }> {
  const map = new Map<TicketStatus, number>();
  tickets.forEach((ticket) => {
    map.set(ticket.status, (map.get(ticket.status) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([status, total]) => ({ status, total }));
}

export function groupByKey(
  tickets: Ticket[],
  key: keyof Ticket,
): Array<{ key: string; total: number }> {
  const map = new Map<string, number>();
  tickets.forEach((ticket) => {
    const value = String(ticket[key] ?? "Nao informado");
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([value, total]) => ({ key: value, total }))
    .sort((a, b) => b.total - a.total);
}

export function slaCompliance(tickets: Ticket[]): { inSla: number; overdue: number } {
  let inSla = 0;
  let overdue = 0;

  tickets.forEach((ticket) => {
    const endTime = ticket.closedAt ? new Date(ticket.closedAt).getTime() : Date.now();
    const elapsedHours = (endTime - new Date(ticket.createdAt).getTime()) / 3600000;
    if (elapsedHours <= ticket.slaHours) inSla += 1;
    else overdue += 1;
  });

  return { inSla, overdue };
}

export function recurringProblems(tickets: Ticket[]): Array<{ label: string; total: number }> {
  const map = new Map<string, number>();
  tickets.forEach((ticket) => {
    const normalized = ticket.title.toLowerCase().split(" ").slice(0, 3).join(" ");
    map.set(normalized, (map.get(normalized) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, total]) => ({ label, total }))
    .filter((item) => item.total > 1)
    .sort((a, b) => b.total - a.total);
}

export function monthlyResolved(tickets: Ticket[]): number {
  const now = new Date();
  return tickets.filter((ticket) => {
    if (!ticket.closedAt) return false;
    const closedAt = new Date(ticket.closedAt);
    return closedAt.getMonth() === now.getMonth() && closedAt.getFullYear() === now.getFullYear();
  }).length;
}

export function criticalCount(tickets: Ticket[]): number {
  return tickets.filter((ticket) => ticket.priority === "CRITICA").length;
}

export function priorityDistribution(
  tickets: Ticket[],
): Array<{ priority: TicketPriority; total: number }> {
  const priorities: TicketPriority[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];
  return priorities.map((priority) => ({
    priority,
    total: tickets.filter((ticket) => ticket.priority === priority).length,
  }));
}
