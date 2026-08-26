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

export function formatCategoryDisplayName(name: string): string {
  if (!name || !name.trim()) return "Não informado";
  const trimmed = name.trim();
  // Check if string already starts with an emoji
  const hasEmoji = /^\p{Extended_Pictographic}/u.test(trimmed);
  if (hasEmoji) return trimmed;

  // Keyword-based fallback
  const lower = trimmed.toLowerCase();
  if (lower.includes("computador") || lower.includes("desktop") || lower.includes("pc")) return `🖥️ ${trimmed}`;
  if (lower.includes("notebook") || lower.includes("laptop")) return `💻 ${trimmed}`;
  if (lower.includes("impressora") || lower.includes("etiqueta") || lower.includes("termica") || lower.includes("térmica")) return `🖨️ ${trimmed}`;
  if (lower.includes("balan") || lower.includes("pesagem")) return `⚖️ ${trimmed}`;
  if (lower.includes("coletor") || lower.includes("leitor")) return `📟 ${trimmed}`;
  if (lower.includes("internet") || lower.includes("rede") || lower.includes("wi-fi") || lower.includes("wifi")) return `🌐 ${trimmed}`;
  if (lower.includes("erp") || lower.includes("pdv") || lower.includes("faturamento") || lower.includes("sistema")) return `📊 ${trimmed}`;
  if (lower.includes("acesso") || lower.includes("senha") || lower.includes("e-mail") || lower.includes("email")) return `🔐 ${trimmed}`;
  if (lower.includes("software") || lower.includes("aplicativo") || lower.includes("certificado") || lower.includes("programa")) return `📦 ${trimmed}`;
  if (lower.includes("telefonia") || lower.includes("ramal") || lower.includes("whatsapp")) return `📞 ${trimmed}`;
  if (lower.includes("camera") || lower.includes("câmera") || lower.includes("cftv") || lower.includes("seguran")) return `📹 ${trimmed}`;
  if (lower.includes("servidor") || lower.includes("nobreak") || lower.includes("energia")) return `⚡ ${trimmed}`;
  if (lower.includes("relatorio") || lower.includes("relatório") || lower.includes("bi") || lower.includes("consulta")) return `📋 ${trimmed}`;
  if (lower.includes("duvida") || lower.includes("dúvida") || lower.includes("orienta") || lower.includes("treinamento")) return `💡 ${trimmed}`;
  if (lower.includes("equipamento") || lower.includes("troca") || lower.includes("solicita") || lower.includes("compra")) return `🛒 ${trimmed}`;

  return `🏷️ ${trimmed}`;
}

export function getCategoryName(categories: Category[], id?: string): string {
  const raw = byIdName(categories, id);
  if (raw === "Nao informado" || raw === "Não informado") return raw;
  return formatCategoryDisplayName(raw);
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
