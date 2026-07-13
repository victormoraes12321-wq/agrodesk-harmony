import type { TicketPriority, TicketStatus } from "@/types";

const STATUS_VALUES: TicketStatus[] = [
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

const PRIORITY_VALUES: TicketPriority[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

export type TicketListPeriod = "ALL" | "TODAY" | "7D" | "30D" | "90D" | "THIS_MONTH";
export type TicketListSlaFilter = "ALL" | "VENCIDO" | "PROXIMO";
export type TicketListQuickFilter = "NONE" | "OPEN";
export type TicketListSortBy = "createdAt" | "priority" | "sla";
export type TicketListSortDir = "asc" | "desc";

export interface TicketListSearch {
  q: string;
  quick: TicketListQuickFilter;
  status: TicketStatus | "ALL";
  priority: TicketPriority | "ALL";
  assigneeId: string;
  departmentId: string;
  branchId: string;
  categoryId: string;
  period: TicketListPeriod;
  sla: TicketListSlaFilter;
  sortBy: TicketListSortBy;
  sortDir: TicketListSortDir;
  page: number;
  pageSize: number;
}

const DEFAULT_SEARCH: TicketListSearch = {
  q: "",
  quick: "NONE",
  status: "ALL",
  priority: "ALL",
  assigneeId: "ALL",
  departmentId: "ALL",
  branchId: "ALL",
  categoryId: "ALL",
  period: "ALL",
  sla: "ALL",
  sortBy: "createdAt",
  sortDir: "desc",
  page: 1,
  pageSize: 20,
};

function isStatus(value: string): value is TicketStatus {
  return STATUS_VALUES.includes(value as TicketStatus);
}

function isPriority(value: string): value is TicketPriority {
  return PRIORITY_VALUES.includes(value as TicketPriority);
}

function parsePositiveInt(raw: unknown, fallback: number) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

export function getDefaultTicketListSearch(): TicketListSearch {
  return { ...DEFAULT_SEARCH };
}

export function parseTicketListSearch(raw: Record<string, unknown>): TicketListSearch {
  const q = typeof raw.q === "string" ? raw.q : "";
  const quick = raw.quick === "OPEN" ? "OPEN" : "NONE";

  const statusRaw = typeof raw.status === "string" ? raw.status : "ALL";
  const status: TicketListSearch["status"] = isStatus(statusRaw) ? statusRaw : "ALL";

  const priorityRaw = typeof raw.priority === "string" ? raw.priority : "ALL";
  const priority: TicketListSearch["priority"] = isPriority(priorityRaw) ? priorityRaw : "ALL";

  const assigneeId = typeof raw.assigneeId === "string" ? raw.assigneeId : "ALL";
  const departmentId = typeof raw.departmentId === "string" ? raw.departmentId : "ALL";
  const branchId = typeof raw.branchId === "string" ? raw.branchId : "ALL";
  const categoryId = typeof raw.categoryId === "string" ? raw.categoryId : "ALL";

  const periodRaw = typeof raw.period === "string" ? raw.period : "ALL";
  const period: TicketListPeriod = ["ALL", "TODAY", "7D", "30D", "90D", "THIS_MONTH"].includes(
    periodRaw,
  )
    ? (periodRaw as TicketListPeriod)
    : "ALL";

  const slaRaw = typeof raw.sla === "string" ? raw.sla : "ALL";
  const sla: TicketListSlaFilter = ["ALL", "VENCIDO", "PROXIMO"].includes(slaRaw)
    ? (slaRaw as TicketListSlaFilter)
    : "ALL";

  const sortByRaw = typeof raw.sortBy === "string" ? raw.sortBy : "createdAt";
  const sortBy: TicketListSortBy = ["createdAt", "priority", "sla"].includes(sortByRaw)
    ? (sortByRaw as TicketListSortBy)
    : "createdAt";

  const sortDirRaw = typeof raw.sortDir === "string" ? raw.sortDir : "desc";
  const sortDir: TicketListSortDir = ["asc", "desc"].includes(sortDirRaw)
    ? (sortDirRaw as TicketListSortDir)
    : "desc";

  const page = parsePositiveInt(raw.page, 1);
  const parsedPageSize = parsePositiveInt(raw.pageSize, DEFAULT_SEARCH.pageSize);
  const pageSize = [10, 20, 50, 100].includes(parsedPageSize)
    ? parsedPageSize
    : DEFAULT_SEARCH.pageSize;

  return {
    q,
    quick,
    status,
    priority,
    assigneeId,
    departmentId,
    branchId,
    categoryId,
    period,
    sla,
    sortBy,
    sortDir,
    page,
    pageSize,
  };
}

export function sanitizeTicketListSearch(search: TicketListSearch): TicketListSearch {
  return {
    ...search,
    q: search.q.trimStart(),
    page: Math.max(1, Math.floor(search.page)),
    pageSize: [10, 20, 50, 100].includes(search.pageSize)
      ? search.pageSize
      : DEFAULT_SEARCH.pageSize,
  };
}

export function toTicketListUrlSearch(
  search: TicketListSearch,
): Record<string, string | number | undefined> {
  return {
    q: search.q || undefined,
    quick: search.quick !== "NONE" ? search.quick : undefined,
    status: search.status !== "ALL" ? search.status : undefined,
    priority: search.priority !== "ALL" ? search.priority : undefined,
    assigneeId: search.assigneeId !== "ALL" ? search.assigneeId : undefined,
    departmentId: search.departmentId !== "ALL" ? search.departmentId : undefined,
    branchId: search.branchId !== "ALL" ? search.branchId : undefined,
    categoryId: search.categoryId !== "ALL" ? search.categoryId : undefined,
    period: search.period !== "ALL" ? search.period : undefined,
    sla: search.sla !== "ALL" ? search.sla : undefined,
    sortBy: search.sortBy !== DEFAULT_SEARCH.sortBy ? search.sortBy : undefined,
    sortDir: search.sortDir !== DEFAULT_SEARCH.sortDir ? search.sortDir : undefined,
    page: search.page > 1 ? search.page : undefined,
    pageSize: search.pageSize !== DEFAULT_SEARCH.pageSize ? search.pageSize : undefined,
  };
}
