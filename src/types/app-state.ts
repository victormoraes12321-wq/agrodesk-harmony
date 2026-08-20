import type {
  AuditLog,
  Branch,
  Category,
  Department,
  GlobalSettings,
  Notification,
  Ticket,
  TicketPriority,
  User,
} from "@/types";

export interface CreateTicketInput {
  title?: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  departmentId: string;
  branchId: string;
  categoryId?: string;
  subcategory?: string;
  subcategoryId?: string;
  suggestedPriority?: TicketPriority;
  equipment?: string;
  assetTag?: string;
  bestTime?: string;
  impact?: string;
  additionalNotes?: string;
  attachments?: Array<{ name: string; sizeKb: number }>;
  assetId?: string;
  targetUserId?: string;
  resolveImmediately?: boolean;
  resolutionNotes?: string;
}

export interface PersistedAppState {
  users: User[];
  departments: Department[];
  branches: Branch[];
  categories: Category[];
  tickets: Ticket[];
  notifications: Notification[];
  audit: AuditLog[];
  settings: GlobalSettings;
}
