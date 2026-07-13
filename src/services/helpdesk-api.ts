import {
  apiClient,
  clearAuthTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/services/api";
import type {
  AuditLog,
  Branch,
  Category,
  Department,
  GlobalSettings,
  Notification,
  Ticket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  User,
} from "@/types";
import type { CreateTicketInput } from "@/types/app-state";

type ApiTicketStatus =
  | "ABERTO"
  | "EM_ANALISE"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "AGUARDANDO_PECA"
  | "RESOLVIDO"
  | "FINALIZADO"
  | "CANCELADO"
  | "REABERTO"
  | "OPEN"
  | "ANALYSIS"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "WAITING_PARTS_OR_THIRD_PARTY"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELED"
  | "REOPENED";

type ApiTicketPriority =
  | "BAIXA"
  | "MEDIA"
  | "ALTA"
  | "CRITICA"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface TicketQuery {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  departmentId?: string;
  branchId?: string;
  categoryId?: string;
}

export interface ReportsQuery {
  period?: "7D" | "30D" | "90D" | "ALL";
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  branchId?: string;
  categoryId?: string;
  assigneeId?: string;
  priority?: TicketPriority | "ALL";
  status?: TicketStatus | "ALL";
}

export interface ReportsOverview {
  totalTickets: number;
  byPeriod: Array<{ key: string; total: number }>;
  byDepartment: Array<{ key: string; total: number }>;
  byBranch: Array<{ key: string; total: number }>;
  byCategory: Array<{ key: string; total: number }>;
  byAssignee: Array<{ key: string; total: number }>;
  byPriority: Array<{ key: TicketPriority; total: number }>;
  byStatus: Array<{ key: TicketStatus; total: number }>;
  sla: { inSla: number; overdue: number };
  avgResolutionMinutes: number;
  ratings: {
    average: number;
    total: number;
    items: Array<{ score: number; comment?: string; ticketId: string }>;
  };
}

type EnumFlavor = "EN" | "PT";
let enumFlavor: EnumFlavor = "EN";

const STATUS_FROM_API: Record<string, TicketStatus> = {
  ABERTO: "ABERTO",
  EM_ANALISE: "EM_ANALISE",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  AGUARDANDO_USUARIO: "AGUARDANDO_USUARIO",
  AGUARDANDO_PECA: "AGUARDANDO_PECA",
  RESOLVIDO: "RESOLVIDO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
  REABERTO: "REABERTO",
  OPEN: "ABERTO",
  ANALYSIS: "EM_ANALISE",
  IN_PROGRESS: "EM_ATENDIMENTO",
  WAITING_USER: "AGUARDANDO_USUARIO",
  WAITING_PARTS_OR_THIRD_PARTY: "AGUARDANDO_PECA",
  RESOLVED: "RESOLVIDO",
  CLOSED: "FINALIZADO",
  CANCELED: "CANCELADO",
  REOPENED: "REABERTO",
};

const STATUS_TO_API_EN: Record<TicketStatus, ApiTicketStatus> = {
  ABERTO: "OPEN",
  EM_ANALISE: "ANALYSIS",
  EM_ATENDIMENTO: "IN_PROGRESS",
  AGUARDANDO_USUARIO: "WAITING_USER",
  AGUARDANDO_PECA: "WAITING_PARTS_OR_THIRD_PARTY",
  RESOLVIDO: "RESOLVED",
  FINALIZADO: "CLOSED",
  CANCELADO: "CANCELED",
  REABERTO: "REOPENED",
};

const STATUS_TO_API_PT: Record<TicketStatus, ApiTicketStatus> = {
  ABERTO: "ABERTO",
  EM_ANALISE: "EM_ANALISE",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  AGUARDANDO_USUARIO: "AGUARDANDO_USUARIO",
  AGUARDANDO_PECA: "AGUARDANDO_PECA",
  RESOLVIDO: "RESOLVIDO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
  REABERTO: "REABERTO",
};

const PRIORITY_FROM_API: Record<string, TicketPriority> = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  CRITICA: "CRITICA",
  LOW: "BAIXA",
  MEDIUM: "MEDIA",
  HIGH: "ALTA",
  CRITICAL: "CRITICA",
};

const PRIORITY_TO_API_EN: Record<TicketPriority, ApiTicketPriority> = {
  BAIXA: "LOW",
  MEDIA: "MEDIUM",
  ALTA: "HIGH",
  CRITICA: "CRITICAL",
};

const PRIORITY_TO_API_PT: Record<TicketPriority, ApiTicketPriority> = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  CRITICA: "CRITICA",
};

const NOTIFICATION_TONE: Record<string, Notification["type"]> = {
  TICKET_CREATED: "INFO",
  TICKET_ASSIGNED: "INFO",
  STATUS_CHANGED: "INFO",
  COMMENT_ADDED: "INFO",
  SLA_WARNING: "WARNING",
  SLA_EXPIRED: "DANGER",
  TICKET_RESOLVED: "SUCCESS",
  TICKET_REOPENED: "WARNING",
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  DANGER: "DANGER",
};

function nowIso() {
  return new Date().toISOString();
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
}

function toIso(value: unknown): string {
  if (typeof value === "string" && value) return value;
  if (value instanceof Date) return value.toISOString();
  return nowIso();
}

function detectEnumFlavorFromValue(value: unknown) {
  if (typeof value !== "string") return;
  if (
    [
      "ABERTO",
      "EM_ANALISE",
      "EM_ATENDIMENTO",
      "AGUARDANDO_USUARIO",
      "AGUARDANDO_PECA",
      "RESOLVIDO",
      "FINALIZADO",
      "CANCELADO",
      "REABERTO",
    ].includes(value)
  ) {
    enumFlavor = "PT";
    return;
  }
  if (
    [
      "OPEN",
      "ANALYSIS",
      "IN_PROGRESS",
      "WAITING_USER",
      "WAITING_PARTS_OR_THIRD_PARTY",
      "RESOLVED",
      "CLOSED",
      "CANCELED",
      "REOPENED",
    ].includes(value)
  ) {
    enumFlavor = "EN";
  }
}

function mapStatusFromApi(value: unknown): TicketStatus {
  detectEnumFlavorFromValue(value);
  const raw = typeof value === "string" ? value : "OPEN";
  return STATUS_FROM_API[raw] ?? "ABERTO";
}

function mapPriorityFromApi(value: unknown): TicketPriority {
  if (typeof value === "string" && ["BAIXA", "MEDIA", "ALTA", "CRITICA"].includes(value)) {
    enumFlavor = "PT";
  }
  if (typeof value === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(value)) {
    enumFlavor = "EN";
  }
  const raw = typeof value === "string" ? value : "MEDIUM";
  return PRIORITY_FROM_API[raw] ?? "MEDIA";
}

function mapStatusToApi(value: TicketStatus): ApiTicketStatus {
  return enumFlavor === "PT" ? STATUS_TO_API_PT[value] : STATUS_TO_API_EN[value];
}

function mapPriorityToApi(value: TicketPriority): ApiTicketPriority {
  return enumFlavor === "PT" ? PRIORITY_TO_API_PT[value] : PRIORITY_TO_API_EN[value];
}

function parseSlaHours(ticket: Record<string, unknown>): number {
  const explicit = asNumber(ticket.slaHours);
  if (explicit && explicit > 0) return explicit;

  const createdAt = asString(ticket.createdAt);
  const dueAt = asString(ticket.slaDueAt);
  if (createdAt && dueAt) {
    const diff = (new Date(dueAt).getTime() - new Date(createdAt).getTime()) / 3600000;
    if (Number.isFinite(diff) && diff > 0) return Math.round(diff);
  }

  return 24;
}

function mapComment(entry: unknown): TicketComment {
  const row = (entry ?? {}) as Record<string, unknown>;
  const author = (row.author ?? row.user ?? {}) as Record<string, unknown>;
  const visibility = asString(row.visibility);
  const internalByVisibility = visibility === "INTERNAL";

  return {
    id: asString(row.id) ?? `cm-${Date.now()}`,
    ticketId: asString(row.ticketId) ?? "",
    authorId:
      asString(row.authorId) ??
      asString(row.authorUserId) ??
      asString(row.userId) ??
      asString(author.id) ??
      "system",
    authorName: asString(row.authorName) ?? asString(author.name) ?? "Sistema",
    content: asString(row.content) ?? "",
    internal: asBoolean(row.isInternal) ?? asBoolean(row.internal) ?? internalByVisibility,
    createdAt: toIso(row.createdAt),
  };
}

function mapAttachment(entry: unknown) {
  const row = (entry ?? {}) as Record<string, unknown>;
  const bytes = asNumber(row.sizeBytes) ?? asNumber(row.size) ?? 0;
  return {
    id: asString(row.id) ?? `at-${Date.now()}`,
    ticketId: asString(row.ticketId) ?? "",
    name: asString(row.originalName) ?? asString(row.name) ?? asString(row.filename) ?? "arquivo",
    sizeKb: Math.max(1, Math.round(bytes / 1024)),
    internal: asBoolean(row.isInternal) ?? asBoolean(row.internal) ?? false,
    uploadedAt: toIso(row.createdAt ?? row.uploadedAt),
  };
}

function mapStatusHistory(entry: unknown) {
  const row = (entry ?? {}) as Record<string, unknown>;
  const changedBy = (row.changedBy ?? {}) as Record<string, unknown>;

  return {
    id: asString(row.id) ?? `sh-${Date.now()}`,
    status: mapStatusFromApi(row.status ?? row.toStatus),
    changedById:
      asString(row.changedById) ??
      asString(row.changedByUserId) ??
      asString(changedBy.id) ??
      "system",
    changedByName: asString(row.changedByName) ?? asString(changedBy.name) ?? "Sistema",
    createdAt: toIso(row.createdAt),
    note: asString(row.note),
  };
}

function mapTicket(entry: unknown): Ticket {
  const row = (entry ?? {}) as Record<string, unknown>;
  const ratingObj = row.rating as Record<string, unknown> | undefined;

  const createdAt = toIso(row.createdAt);
  const closedAt = asString(row.closedAt) ?? asString(row.canceledAt);

  return {
    id: asString(row.id) ?? `t-${Date.now()}`,
    protocol:
      asString(row.protocol) ??
      asString(row.protocolNumber) ??
      `OS-${new Date().getFullYear()}-00000`,
    title: asString(row.title) ?? asString(row.description)?.slice(0, 72) ?? "Chamado sem titulo",
    description: asString(row.description) ?? "",
    requesterId:
      asString(row.requesterId) ??
      asString(row.requesterUserId) ??
      asString((row.requester as Record<string, unknown> | undefined)?.id) ??
      "",
    requesterName: asString(row.requesterName) ?? "Solicitante",
    requesterPhone: asString(row.requesterPhone) ?? "-",
    requesterEmail: asString(row.requesterEmail) ?? "-",
    departmentId:
      asString(row.departmentId) ??
      asString((row.department as Record<string, unknown> | undefined)?.id) ??
      "",
    branchId:
      asString(row.branchId) ??
      asString((row.branch as Record<string, unknown> | undefined)?.id) ??
      "",
    categoryId:
      asString(row.categoryId) ??
      asString((row.category as Record<string, unknown> | undefined)?.id) ??
      undefined,
    subcategory:
      asString(row.subcategoryId) ??
      asString((row.subcategory as Record<string, unknown> | undefined)?.name) ??
      asString(row.subcategory) ??
      undefined,
    suggestedPriority: row.suggestedPriority
      ? mapPriorityFromApi(row.suggestedPriority)
      : undefined,
    priority: mapPriorityFromApi(row.realPriority ?? row.priority),
    status: mapStatusFromApi(row.status),
    assigneeId:
      asString(row.assigneeId) ??
      asString(row.assigneeUserId) ??
      asString(row.assignedToId) ??
      asString((row.assignee as Record<string, unknown> | undefined)?.id) ??
      asString((row.assignedTo as Record<string, unknown> | undefined)?.id) ??
      undefined,
    equipment: asString(row.equipment) ?? asString(row.equipmentName) ?? undefined,
    assetTag: asString(row.assetTag) ?? undefined,
    bestTime: asString(row.bestTime) ?? asString(row.preferredServiceTime) ?? undefined,
    impact: asString(row.impact) ?? asString(row.impactDescription) ?? undefined,
    additionalNotes: asString(row.additionalNotes) ?? undefined,
    waitingRequesterMessage: asString(row.waitingRequesterMessage) ?? undefined,
    diagnosis: asString(row.diagnosis) ?? undefined,
    rootCause: asString(row.rootCause) ?? undefined,
    solution: asString(row.solution) ?? undefined,
    partsUsed: asString(row.partsUsed) ?? asString(row.usedParts) ?? undefined,
    timeSpentMinutes: asNumber(row.timeSpentMinutes),
    internalNotes: asString(row.internalNotes) ?? undefined,
    slaHours: parseSlaHours(row),
    createdAt,
    updatedAt: toIso(row.updatedAt ?? row.createdAt),
    closedAt: closedAt || undefined,
    rating:
      asNumber(row.rating) ??
      asNumber(ratingObj?.score) ??
      asNumber(ratingObj?.rating) ??
      undefined,
    ratingComment: asString(row.ratingComment) ?? asString(ratingObj?.comment) ?? undefined,
    resolutionSummary: asString(row.resolutionSummary) ?? undefined,
    statusHistory: Array.isArray(row.statusHistory) ? row.statusHistory.map(mapStatusHistory) : [],
    comments: Array.isArray(row.comments) ? row.comments.map(mapComment) : [],
    attachments: Array.isArray(row.attachments) ? row.attachments.map(mapAttachment) : [],
  };
}

function mapUser(entry: unknown): User {
  const row = (entry ?? {}) as Record<string, unknown>;
  const profile = (row.profile ?? {}) as Record<string, unknown>;
  const role = asString(row.role) === "TI_ADMIN" ? "TI_ADMIN" : "SOLICITANTE";

  return {
    id: asString(row.id) ?? `u-${Date.now()}`,
    name: asString(row.name) ?? "Usuario",
    email: asString(row.email) ?? "-",
    phone: asString(row.phone) ?? asString(profile.phone) ?? "-",
    whatsapp: asString(row.whatsapp) ?? asString(profile.whatsapp) ?? undefined,
    extension: asString(row.extension) ?? asString(profile.extension) ?? undefined,
    role,
    departmentId:
      asString(row.departmentId) ??
      asString(profile.departmentId) ??
      asString((row.department as Record<string, unknown> | undefined)?.id) ??
      "",
    branchId:
      asString(row.branchId) ??
      asString(profile.branchId) ??
      asString((row.branch as Record<string, unknown> | undefined)?.id) ??
      "",
    jobTitle: asString(row.position) ?? asString(row.jobTitle) ?? asString(profile.jobTitle) ?? "",
    active: asBoolean(row.active) ?? asBoolean(row.isActive) ?? true,
    mustChangePassword: asBoolean(row.mustChangePassword) ?? false,
    canReceiveTickets: asBoolean(row.canReceiveTickets) ?? false,
    notes: asString(row.notes) ?? asString(profile.notes) ?? undefined,
    avatarColor: role === "TI_ADMIN" ? "#0ea5e9" : undefined,
  };
}

function mapDepartment(entry: unknown): Department {
  const row = (entry ?? {}) as Record<string, unknown>;
  return {
    id: asString(row.id) ?? `d-${Date.now()}`,
    name: asString(row.name) ?? "Setor",
    active: asBoolean(row.active) ?? asBoolean(row.isActive) ?? true,
  };
}

function mapBranch(entry: unknown): Branch {
  const row = (entry ?? {}) as Record<string, unknown>;
  return {
    id: asString(row.id) ?? `b-${Date.now()}`,
    name: asString(row.name) ?? "Filial",
    city: asString(row.city) ?? asString(row.address) ?? undefined,
    active: asBoolean(row.active) ?? asBoolean(row.isActive) ?? true,
  };
}

function mapCategory(entry: unknown): Category {
  const row = (entry ?? {}) as Record<string, unknown>;
  const subcategories = Array.isArray(row.subcategories)
    ? row.subcategories
        .map((sub) => {
          const subRow = sub as Record<string, unknown>;
          const id = asString(subRow.id);
          const name = asString(subRow.name);
          if (!id || !name) return null;
          return { id, name };
        })
        .filter((item): item is { id: string; name: string } => Boolean(item))
    : [];

  return {
    id: asString(row.id) ?? `c-${Date.now()}`,
    name: asString(row.name) ?? "Categoria",
    description: asString(row.description) ?? undefined,
    defaultSlaHours: asNumber(row.defaultSlaHours) ?? 24,
    defaultPriority: mapPriorityFromApi(row.defaultPriority),
    active: asBoolean(row.active) ?? asBoolean(row.isActive) ?? true,
    subcategories,
  };
}

function mapNotification(entry: unknown): Notification {
  const row = (entry ?? {}) as Record<string, unknown>;
  const read = asBoolean(row.read) ?? asBoolean(row.isRead) ?? Boolean(asString(row.readAt));

  return {
    id: asString(row.id) ?? `n-${Date.now()}`,
    userId: asString(row.userId) ?? "",
    title: asString(row.title) ?? "Notificacao",
    message: asString(row.message) ?? "",
    type: NOTIFICATION_TONE[asString(row.type) ?? "INFO"] ?? "INFO",
    read,
    ticketId: asString(row.ticketId) ?? undefined,
    createdAt: toIso(row.createdAt),
  };
}

function toShortJson(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mapAudit(entry: unknown): AuditLog {
  const row = (entry ?? {}) as Record<string, unknown>;
  const actor = (row.actor ?? row.user ?? {}) as Record<string, unknown>;
  const before = row.before ?? row.beforeJson ?? row.oldValue;
  const after = row.after ?? row.afterJson ?? row.newValue;
  return {
    id: asString(row.id) ?? `al-${Date.now()}`,
    entity: asString(row.entity) ?? "Entity",
    entityId: asString(row.entityId) ?? "-",
    field: asString(row.field) ?? asString(row.action) ?? "update",
    before: toShortJson(before),
    after: toShortJson(after),
    userId: asString(row.userId) ?? asString(row.actorUserId) ?? asString(actor.id) ?? "system",
    userName: asString(row.userName) ?? asString(actor.name) ?? "Sistema",
    createdAt: toIso(row.createdAt),
  };
}

const SETTINGS_DEFAULTS: GlobalSettings = {
  companyName: "AgroDesk TI",
  logoText: "AgroDesk TI",
  defaultSlaHours: 24,
  priorities: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
  statuses: [
    "ABERTO",
    "EM_ANALISE",
    "EM_ATENDIMENTO",
    "AGUARDANDO_USUARIO",
    "AGUARDANDO_PECA",
    "RESOLVIDO",
    "FINALIZADO",
    "CANCELADO",
    "REABERTO",
  ],
  uploadLimitMb: 10,
  itContactName: "Equipe TI",
  itContactEmail: "ti@agrodesk.com",
  itContactPhone: "",
  appearancePreset: "agro",
  backupMessage: "Execute backups periodicos do PostgreSQL conforme BACKUP_RESTORE.md.",
};

function mapSettings(entry: unknown): GlobalSettings {
  if (Array.isArray(entry)) {
    const map = new Map<string, unknown>();
    entry.forEach((item) => {
      const row = item as Record<string, unknown>;
      const key = asString(row.key);
      if (key) map.set(key, row.value);
    });

    return {
      ...SETTINGS_DEFAULTS,
      companyName: asString(map.get("companyName")) ?? SETTINGS_DEFAULTS.companyName,
      logoText: asString(map.get("companyLogo")) ?? SETTINGS_DEFAULTS.logoText,
      defaultSlaHours: asNumber(map.get("defaultSlaHours")) ?? SETTINGS_DEFAULTS.defaultSlaHours,
      uploadLimitMb: asNumber(map.get("uploadLimitMb")) ?? SETTINGS_DEFAULTS.uploadLimitMb,
      itContactName: asString(map.get("itContactName")) ?? SETTINGS_DEFAULTS.itContactName,
      itContactEmail: asString(map.get("itContactEmail")) ?? SETTINGS_DEFAULTS.itContactEmail,
      itContactPhone: asString(map.get("itContactPhone")) ?? SETTINGS_DEFAULTS.itContactPhone,
    };
  }

  const row = (entry ?? {}) as Record<string, unknown>;
  return {
    ...SETTINGS_DEFAULTS,
    companyName: asString(row.companyName) ?? SETTINGS_DEFAULTS.companyName,
    logoText: asString(row.logoText) ?? asString(row.logo) ?? SETTINGS_DEFAULTS.logoText,
    defaultSlaHours: asNumber(row.defaultSlaHours) ?? SETTINGS_DEFAULTS.defaultSlaHours,
    uploadLimitMb: asNumber(row.uploadLimitMb) ?? SETTINGS_DEFAULTS.uploadLimitMb,
    itContactName: asString(row.itContactName) ?? SETTINGS_DEFAULTS.itContactName,
    itContactEmail: asString(row.itContactEmail) ?? SETTINGS_DEFAULTS.itContactEmail,
    itContactPhone: asString(row.itContactPhone) ?? SETTINGS_DEFAULTS.itContactPhone,
    priorities: Array.isArray(row.priorities)
      ? (row.priorities.map(mapPriorityFromApi) as TicketPriority[])
      : SETTINGS_DEFAULTS.priorities,
    statuses: Array.isArray(row.statuses)
      ? (row.statuses.map(mapStatusFromApi) as TicketStatus[])
      : SETTINGS_DEFAULTS.statuses,
  };
}

function mapReports(entry: unknown): ReportsOverview {
  const row = (entry ?? {}) as Record<string, unknown>;
  const ratings = (row.ratings ?? {}) as Record<string, unknown>;
  const ratingItems = Array.isArray(ratings.items) ? ratings.items : [];

  return {
    totalTickets: asNumber(row.totalTickets) ?? 0,
    byPeriod: Array.isArray(row.byPeriod)
      ? (row.byPeriod as Array<{ key: string; total: number }>)
      : [],
    byDepartment: Array.isArray(row.byDepartment)
      ? (row.byDepartment as Array<{ key: string; total: number }>)
      : [],
    byBranch: Array.isArray(row.byBranch)
      ? (row.byBranch as Array<{ key: string; total: number }>)
      : [],
    byCategory: Array.isArray(row.byCategory)
      ? (row.byCategory as Array<{ key: string; total: number }>)
      : [],
    byAssignee: Array.isArray(row.byAssignee)
      ? (row.byAssignee as Array<{ key: string; total: number }>)
      : [],
    byPriority: Array.isArray(row.byPriority)
      ? (row.byPriority as Array<{ key: string; total: number }>).map((item) => ({
          ...item,
          key: mapPriorityFromApi(item.key),
        }))
      : [],
    byStatus: Array.isArray(row.byStatus)
      ? (row.byStatus as Array<{ key: string; total: number }>).map((item) => ({
          ...item,
          key: mapStatusFromApi(item.key),
        }))
      : [],
    sla: {
      inSla: asNumber((row.sla as Record<string, unknown> | undefined)?.inSla) ?? 0,
      overdue: asNumber((row.sla as Record<string, unknown> | undefined)?.overdue) ?? 0,
    },
    avgResolutionMinutes: asNumber(row.avgResolutionMinutes) ?? 0,
    ratings: {
      average: asNumber(ratings.average) ?? 0,
      total: asNumber(ratings.total) ?? 0,
      items: ratingItems.map((item) => {
        const rating = item as Record<string, unknown>;
        return {
          score: asNumber(rating.score) ?? 0,
          comment: asString(rating.comment),
          ticketId: asString(rating.ticketId) ?? "",
        };
      }),
    },
  };
}

function buildReportsDateParams(query: ReportsQuery) {
  if (query.startDate || query.endDate) {
    return {
      startDate: query.startDate,
      endDate: query.endDate,
    };
  }

  const { period } = query;
  if (!period || period === "ALL") return {};
  const now = new Date();
  const start = new Date(now);

  if (period === "7D") start.setDate(now.getDate() - 7);
  if (period === "30D") start.setDate(now.getDate() - 30);
  if (period === "90D") start.setDate(now.getDate() - 90);

  return {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
  };
}

async function withEnumFallback<T>(action: (mode: EnumFlavor) => Promise<T>): Promise<T> {
  const primary = enumFlavor;
  const fallback = primary === "EN" ? "PT" : "EN";
  try {
    return await action(primary);
  } catch (error) {
    const shouldRetry =
      error instanceof Error && /enum|prioridade|status|invalid|inval/i.test(error.message);
    if (!shouldRetry) throw error;
    const previous = enumFlavor;
    enumFlavor = fallback;
    try {
      return await action(fallback);
    } catch (fallbackError) {
      enumFlavor = previous;
      throw fallbackError;
    }
  }
}

export async function loginApi(username: string, password: string) {
  const payload = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    user: unknown;
  }>("/auth/login", { username, password }, { skipAuth: true });

  setAccessToken(payload.accessToken);
  setRefreshToken(payload.refreshToken);

  return {
    user: mapUser(payload.user),
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

export async function fetchMeApi() {
  const payload = await apiClient.get<unknown>("/auth/me");
  return mapUser(payload);
}

export async function logoutApi() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await apiClient.post("/auth/logout", { refreshToken });
    } catch {
      // no-op
    }
  }
  clearAuthTokens();
}

export async function listUsersApi() {
  const payload = await apiClient.get<unknown[]>("/users");
  return payload.map(mapUser);
}

export async function createUserApi(user: User, password: string) {
  const payload = await apiClient.post<unknown>("/users", {
    name: user.name,
    email: user.email,
    password,
    role: user.role,
    phone: user.phone,
    whatsapp: user.whatsapp,
    extension: user.extension,
    departmentId: user.departmentId,
    branchId: user.branchId,
    jobTitle: user.jobTitle,
    notes: user.notes,
    active: user.active,
    canReceiveTickets: user.canReceiveTickets,
  });
  return mapUser(payload);
}

export async function updateUserApi(user: User) {
  const payload = await apiClient.patch<unknown>(`/users/${user.id}`, {
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    whatsapp: user.whatsapp,
    extension: user.extension,
    departmentId: user.departmentId,
    branchId: user.branchId,
    jobTitle: user.jobTitle,
    notes: user.notes,
    active: user.active,
    canReceiveTickets: user.canReceiveTickets,
  });
  return mapUser(payload);
}

export async function toggleUserActiveApi(id: string, active: boolean) {
  await apiClient.patch(`/users/${id}/active`, { active });
}

export async function resetUserPasswordApi(id: string, newPassword: string) {
  await apiClient.patch(`/users/${id}/reset-password`, { newPassword });
}

export async function changeMyPasswordApi(currentPassword: string, newPassword: string) {
  await apiClient.patch("/users/me/password", { currentPassword, newPassword });
}

export async function updateMyProfileApi(input: Partial<User>) {
  const payload = await apiClient.patch<unknown>("/users/me/profile", {
    name: input.name,
    phone: input.phone,
    whatsapp: input.whatsapp,
    extension: input.extension,
    departmentId: input.departmentId,
    branchId: input.branchId,
    jobTitle: input.jobTitle,
    notes: input.notes,
  });
  return mapUser(payload);
}

export async function listDepartmentsApi() {
  const payload = await apiClient.get<unknown[]>("/departments");
  return payload.map(mapDepartment);
}

export async function createDepartmentApi(input: Department) {
  const payload = await apiClient.post<unknown>("/departments", {
    name: input.name,
    active: input.active,
  });
  return mapDepartment(payload);
}

export async function updateDepartmentApi(input: Department) {
  const payload = await apiClient.patch<unknown>(`/departments/${input.id}`, {
    name: input.name,
    active: input.active,
  });
  return mapDepartment(payload);
}

export async function listBranchesApi() {
  const payload = await apiClient.get<unknown[]>("/branches");
  return payload.map(mapBranch);
}

export async function createBranchApi(input: Branch) {
  const payload = await apiClient.post<unknown>("/branches", {
    name: input.name,
    city: input.city,
    active: input.active,
  });
  return mapBranch(payload);
}

export async function updateBranchApi(input: Branch) {
  const payload = await apiClient.patch<unknown>(`/branches/${input.id}`, {
    name: input.name,
    city: input.city,
    active: input.active,
  });
  return mapBranch(payload);
}

export async function listCategoriesApi() {
  const payload = await apiClient.get<unknown[]>("/categories");
  return payload.map(mapCategory);
}

export async function createCategoryApi(input: Category) {
  const payload = await apiClient.post<unknown>("/categories", {
    name: input.name,
    description: input.description,
    defaultPriority: mapPriorityToApi(input.defaultPriority),
    defaultSlaHours: input.defaultSlaHours,
    active: input.active,
  });
  return mapCategory(payload);
}

export async function updateCategoryApi(input: Category) {
  const payload = await apiClient.patch<unknown>(`/categories/${input.id}`, {
    name: input.name,
    description: input.description,
    defaultPriority: mapPriorityToApi(input.defaultPriority),
    defaultSlaHours: input.defaultSlaHours,
    active: input.active,
  });
  return mapCategory(payload);
}

function mapTicketQuery(query: TicketQuery) {
  return {
    search: query.search,
    status: query.status ? mapStatusToApi(query.status) : undefined,
    priority: query.priority ? mapPriorityToApi(query.priority) : undefined,
    assigneeUserId: query.assigneeId,
    departmentId: query.departmentId,
    branchId: query.branchId,
    categoryId: query.categoryId,
  };
}

export async function listTicketsApi(query: TicketQuery = {}) {
  const payload = await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.get<unknown[]>("/tickets", mapTicketQuery(query));
  });
  return payload.map(mapTicket);
}

export async function getTicketApi(ticketId: string) {
  const payload = await apiClient.get<unknown>(`/tickets/${ticketId}`);
  return mapTicket(payload);
}

export async function createTicketApi(input: CreateTicketInput) {
  const payload = await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.post<unknown>("/tickets", {
      requesterName: input.requesterName,
      requesterPhone: input.requesterPhone,
      requesterEmail: input.requesterEmail || undefined,
      departmentId: input.departmentId,
      branchId: input.branchId,
      description: input.description,
      title: input.title || undefined,
      categoryId: input.categoryId || undefined,
      subcategoryId: input.subcategoryId || undefined,
      suggestedPriority: input.suggestedPriority
        ? mapPriorityToApi(input.suggestedPriority)
        : undefined,
      equipmentName: input.equipment || undefined,
      assetTag: input.assetTag || undefined,
      preferredServiceTime: input.bestTime || undefined,
      impactDescription: input.impact || undefined,
      additionalNotes: input.additionalNotes || undefined,
    });
  });
  return mapTicket(payload);
}

export async function uploadAttachmentApi(ticketId: string, file: File, internal = false) {
  const form = new FormData();
  form.append("file", file);
  if (internal) form.append("internal", "true");
  await apiClient.post(`/tickets/${ticketId}/attachments`, form);
}

export async function updateTicketFieldsApi(ticketId: string, patch: Partial<Ticket>) {
  const body: Record<string, unknown> = {};

  if (patch.requesterName !== undefined) body.requesterName = patch.requesterName;
  if (patch.requesterPhone !== undefined) body.requesterPhone = patch.requesterPhone;
  if (patch.departmentId !== undefined) body.departmentId = patch.departmentId;
  if (patch.branchId !== undefined) body.branchId = patch.branchId;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.categoryId !== undefined) body.categoryId = patch.categoryId;
  if (patch.subcategory !== undefined) body.subcategoryId = patch.subcategory;
  if (patch.suggestedPriority !== undefined)
    body.suggestedPriority = mapPriorityToApi(patch.suggestedPriority);
  if (patch.equipment !== undefined) body.equipmentName = patch.equipment;
  if (patch.assetTag !== undefined) body.assetTag = patch.assetTag;
  if (patch.bestTime !== undefined) body.preferredServiceTime = patch.bestTime;
  if (patch.impact !== undefined) body.impactDescription = patch.impact;
  if (patch.additionalNotes !== undefined) body.additionalNotes = patch.additionalNotes;

  if (Object.keys(body).length === 0) return null;
  const payload = await apiClient.patch<unknown>(`/tickets/${ticketId}`, body);
  return mapTicket(payload);
}

export async function assignTicketApi(ticketId: string, assigneeId?: string) {
  const payload = await apiClient.patch<unknown>(`/tickets/${ticketId}/assignee`, {
    assigneeUserId: assigneeId ?? null,
  });
  return mapTicket(payload);
}

export async function updateTicketPriorityApi(ticketId: string, priority: TicketPriority) {
  const payload = await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.patch<unknown>(`/tickets/${ticketId}/priority`, {
      realPriority: mapPriorityToApi(priority),
    });
  });
  return mapTicket(payload);
}

export async function updateTicketStatusApi(ticketId: string, status: TicketStatus, note?: string) {
  const payload = await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.patch<unknown>(`/tickets/${ticketId}/status`, {
      status: mapStatusToApi(status),
      note: note?.trim() || undefined,
    });
  });
  return mapTicket(payload);
}

async function ticketStatusActionApi(
  ticketId: string,
  action: "resolve" | "finalize" | "reopen" | "cancel",
  note?: string,
) {
  const payload = await apiClient.post<unknown>(`/tickets/${ticketId}/${action}`, {
    note: note?.trim() || undefined,
  });
  return mapTicket(payload);
}

export function resolveTicketApi(ticketId: string, note?: string) {
  return ticketStatusActionApi(ticketId, "resolve", note);
}

export function finalizeTicketApi(ticketId: string, note?: string) {
  return ticketStatusActionApi(ticketId, "finalize", note);
}

export function reopenTicketApi(ticketId: string, note?: string) {
  return ticketStatusActionApi(ticketId, "reopen", note);
}

export function cancelTicketApi(ticketId: string, note?: string) {
  return ticketStatusActionApi(ticketId, "cancel", note);
}

export async function updateTicketTechnicalApi(
  ticketId: string,
  patch: Pick<
    Ticket,
    | "diagnosis"
    | "rootCause"
    | "solution"
    | "partsUsed"
    | "timeSpentMinutes"
    | "internalNotes"
    | "resolutionSummary"
  >,
) {
  const payload = await apiClient.patch<unknown>(`/tickets/${ticketId}/technical`, {
    diagnosis: patch.diagnosis,
    rootCause: patch.rootCause,
    solution: patch.solution,
    partsUsed: patch.partsUsed,
    timeSpentMinutes: patch.timeSpentMinutes,
    internalNotes: patch.internalNotes,
    resolutionSummary: patch.resolutionSummary,
  });
  return mapTicket(payload);
}

export async function addCommentApi(ticketId: string, content: string, internal = false) {
  const payload = await apiClient.post<unknown>(`/tickets/${ticketId}/comments`, {
    content,
    internal,
  });
  return mapComment(payload);
}

export async function rateTicketApi(ticketId: string, rating: number, comment?: string) {
  await apiClient.post(`/tickets/${ticketId}/rating`, {
    score: rating,
    comment,
  });
}

export async function registerTicketWhatsappPreparedApi(
  ticketId: string,
  payload: {
    message: string;
    phoneUsed: string;
    statusAtMoment?: TicketStatus;
  },
) {
  await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.post(`/tickets/${ticketId}/whatsapp-prepared`, {
      message: payload.message,
      phoneUsed: payload.phoneUsed,
      statusAtMoment: payload.statusAtMoment ? mapStatusToApi(payload.statusAtMoment) : undefined,
    });
  });
}

export async function listNotificationsApi() {
  const payload = await apiClient.get<unknown[]>("/notifications");
  return payload.map(mapNotification);
}

export async function markNotificationReadApi(notificationId: string) {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsReadApi() {
  await apiClient.patch("/notifications/read-all");
}

export async function listAuditApi() {
  const payload = await apiClient.get<unknown[]>("/audit-logs");
  return payload.map(mapAudit);
}

export async function getSettingsApi() {
  const payload = await apiClient.get<unknown>("/settings");
  return mapSettings(payload);
}

export async function updateSettingsApi(input: Partial<GlobalSettings>) {
  const payload = await apiClient.patch<unknown>("/settings", {
    companyName: input.companyName,
    logo: input.logoText,
    defaultSlaHours: input.defaultSlaHours,
    uploadLimitMb: input.uploadLimitMb,
    itContactName: input.itContactName,
    itContactEmail: input.itContactEmail,
    itContactPhone: input.itContactPhone,
  });
  return mapSettings(payload);
}

export async function getReportsOverviewApi(query: ReportsQuery) {
  const dateParams = buildReportsDateParams(query);

  const payload = await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.get<unknown>("/reports/overview", {
      ...dateParams,
      departmentId: query.departmentId !== "ALL" ? query.departmentId : undefined,
      branchId: query.branchId !== "ALL" ? query.branchId : undefined,
      categoryId: query.categoryId !== "ALL" ? query.categoryId : undefined,
      assigneeUserId: query.assigneeId !== "ALL" ? query.assigneeId : undefined,
      priority:
        query.priority && query.priority !== "ALL" ? mapPriorityToApi(query.priority) : undefined,
      status: query.status && query.status !== "ALL" ? mapStatusToApi(query.status) : undefined,
    });
  });

  return mapReports(payload);
}

export async function getRecurringProblemsApi(query: ReportsQuery) {
  const dateParams = buildReportsDateParams(query);
  const payload = await withEnumFallback((mode) => {
    enumFlavor = mode;
    return apiClient.get<Array<{ key: string; total: number }>>("/reports/recurring-problems", {
      ...dateParams,
      departmentId: query.departmentId !== "ALL" ? query.departmentId : undefined,
      branchId: query.branchId !== "ALL" ? query.branchId : undefined,
      categoryId: query.categoryId !== "ALL" ? query.categoryId : undefined,
      assigneeUserId: query.assigneeId !== "ALL" ? query.assigneeId : undefined,
      priority:
        query.priority && query.priority !== "ALL" ? mapPriorityToApi(query.priority) : undefined,
      status: query.status && query.status !== "ALL" ? mapStatusToApi(query.status) : undefined,
    });
  });

  return payload.map((item) => ({ label: item.key, total: item.total }));
}

export async function listSlaOverdueApi() {
  const payload = await apiClient.get<unknown[]>("/sla/overdue");
  return payload.map(mapTicket);
}

export async function listSlaNearExpiryApi(minutes = 120) {
  const payload = await apiClient.get<unknown[]>("/sla/near-expiry", { minutes });
  return payload.map(mapTicket);
}
