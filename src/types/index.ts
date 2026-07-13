export type UserRole = "SOLICITANTE" | "TI_ADMIN";

export type TicketStatus =
  | "ABERTO"
  | "EM_ANALISE"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "AGUARDANDO_PECA"
  | "RESOLVIDO"
  | "FINALIZADO"
  | "CANCELADO"
  | "REABERTO";

export type TicketPriority = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  extension?: string;
  role: UserRole;
  departmentId: string;
  branchId: string;
  jobTitle: string;
  active: boolean;
  mustChangePassword: boolean;
  canReceiveTickets: boolean;
  avatarColor?: string;
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  city?: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  defaultSlaHours: number;
  defaultPriority: TicketPriority;
  active: boolean;
  subcategories?: Array<{ id: string; name: string }>;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  internal: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  name: string;
  sizeKb: number;
  internal?: boolean;
  uploadedAt: string;
}

export interface TicketStatusHistoryItem {
  id: string;
  status: TicketStatus;
  changedById: string;
  changedByName: string;
  createdAt: string;
  note?: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  field: string;
  before: string;
  after: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  read: boolean;
  ticketId?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  protocol: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  departmentId: string;
  branchId: string;
  categoryId?: string;
  subcategory?: string;
  suggestedPriority?: TicketPriority;
  asset: any | null;
  assetId: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string;
  equipment?: string;
  assetTag?: string;
  bestTime?: string;
  impact?: string;
  additionalNotes?: string;
  waitingRequesterMessage?: string;
  diagnosis?: string;
  rootCause?: string;
  solution?: string;
  partsUsed?: string;
  timeSpentMinutes?: number;
  internalNotes?: string;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  rating?: number;
  ratingComment?: string;
  resolutionSummary?: string;
  statusHistory: TicketStatusHistoryItem[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
}

export interface GlobalSettings {
  companyName: string;
  logoText: string;
  defaultSlaHours: number;
  priorities: TicketPriority[];
  statuses: TicketStatus[];
  uploadLimitMb: number;
  itContactName: string;
  itContactEmail: string;
  itContactPhone: string;
  appearancePreset: "agro" | "corporate";
  backupMessage: string;
}
