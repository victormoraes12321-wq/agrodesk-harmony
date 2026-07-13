import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { AppContext } from "@/lib/app-context";
import { login as authLogin, logout as authLogout, getCurrentUser } from "@/services/authService";
import { setSessionExpiredHandler } from "@/services/api";
import {
  addCommentApi,
  assignTicketApi,
  cancelTicketApi,
  changeMyPasswordApi,
  createBranchApi,
  createCategoryApi,
  createDepartmentApi,
  createTicketApi,
  createUserApi,
  finalizeTicketApi,
  getReportsOverviewApi,
  getSettingsApi,
  getTicketApi,
  listAuditApi,
  listBranchesApi,
  listCategoriesApi,
  listDepartmentsApi,
  listNotificationsApi,
  listTicketsApi,
  listUsersApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  rateTicketApi,
  registerTicketWhatsappPreparedApi,
  reopenTicketApi,
  resetUserPasswordApi,
  resolveTicketApi,
  type ReportsOverview,
  type ReportsQuery,
  toggleUserActiveApi,
  updateBranchApi,
  updateCategoryApi,
  updateDepartmentApi,
  updateMyProfileApi,
  updateSettingsApi,
  updateTicketFieldsApi,
  updateTicketPriorityApi,
  updateTicketStatusApi,
  updateTicketTechnicalApi,
  updateUserApi,
  uploadAttachmentApi,
} from "@/services/helpdesk-api";
import type {
  AuditLog,
  Branch,
  Category,
  Department,
  GlobalSettings,
  Notification,
  Ticket,
  User,
} from "@/types";
import type { CreateTicketInput } from "@/types/app-state";

export interface UpdateTicketOptions {
  statusAction?: "UPDATE" | "RESOLVE" | "FINALIZE" | "REOPEN" | "CANCEL";
  statusNote?: string;
}

export interface AppState {
  loading: boolean;
  currentUser: User | null;
  users: User[];
  departments: Department[];
  branches: Branch[];
  categories: Category[];
  tickets: Ticket[];
  recentTicketIds: string[];
  notifications: Notification[];
  notificationSoundEnabled: boolean;
  audit: AuditLog[];
  settings: GlobalSettings;
  reportsOverview: ReportsOverview | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshAppData: () => Promise<void>;
  refreshReports: (query: ReportsQuery) => Promise<ReportsOverview | null>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  createTicket: (input: CreateTicketInput, attachments?: File[]) => Promise<Ticket>;
  updateTicket: (
    id: string,
    patch: Partial<Ticket>,
    options?: UpdateTicketOptions | string,
  ) => Promise<void>;
  refreshTicketDetails: (id: string) => Promise<Ticket | null>;
  addComment: (ticketId: string, content: string, internal: boolean) => Promise<void>;
  uploadAttachment: (ticketId: string, file: File, internal?: boolean) => Promise<void>;
  rateTicket: (ticketId: string, rating: number, comment?: string) => Promise<void>;
  registerWhatsappPrepared: (input: {
    ticketId: string;
    message: string;
    phoneUsed: string;
    statusAtMoment?: Ticket["status"];
  }) => Promise<void>;
  upsertUser: (u: User, initialPassword?: string) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  resetUserPassword: (id: string, newPassword: string) => Promise<void>;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  upsertDepartment: (d: Department) => Promise<void>;
  upsertBranch: (b: Branch) => Promise<void>;
  upsertCategory: (c: Category) => Promise<void>;
  updateSettings: (patch: Partial<GlobalSettings>) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setNotificationSoundEnabled: (enabled: boolean) => void;
}

const DEFAULT_SETTINGS: GlobalSettings = {
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

const LIVE_REFRESH_INTERVAL_MS = 15000;
const NEW_TICKET_HIGHLIGHT_MS = 12000;
const NOTIFICATION_SOUND_STORAGE_KEY = "agrodesk-ti-notification-sound-v1";

function readNotificationSoundFlag() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NOTIFICATION_SOUND_STORAGE_KEY) === "1";
}

function playNotificationTone() {
  if (typeof window === "undefined") return;
  const audioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!audioContextCtor) return;
  try {
    const context = new audioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.26);
    window.setTimeout(() => {
      void context.close();
    }, 350);
  } catch {
    // Ignore browser autoplay/audio engine errors.
  }
}

interface StoreData {
  users: User[];
  departments: Department[];
  branches: Branch[];
  categories: Category[];
  tickets: Ticket[];
  notifications: Notification[];
  audit: AuditLog[];
  settings: GlobalSettings;
}

const EMPTY_DATA: StoreData = {
  users: [],
  departments: [],
  branches: [],
  categories: [],
  tickets: [],
  notifications: [],
  audit: [],
  settings: DEFAULT_SETTINGS,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<StoreData>(EMPTY_DATA);
  const dataRef = useRef<StoreData>(EMPTY_DATA);
  const [reportsOverview, setReportsOverview] = useState<ReportsOverview | null>(null);
  const [recentTicketIds, setRecentTicketIds] = useState<string[]>([]);
  const [notificationSoundEnabled, setNotificationSoundEnabledState] = useState<boolean>(() =>
    readNotificationSoundFlag(),
  );

  const applyTicket = useCallback((ticket: Ticket) => {
    setData((prev) => ({
      ...prev,
      tickets: prev.tickets.some((item) => item.id === ticket.id)
        ? prev.tickets.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...prev.tickets],
    }));
  }, []);

  const refreshTicketDetails = useCallback(
    async (id: string) => {
      try {
        const ticket = await getTicketApi(id);
        applyTicket(ticket);
        return ticket;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar detalhe da OS.";
        toast.error(message);
        return null;
      }
    },
    [applyTicket],
  );

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      NOTIFICATION_SOUND_STORAGE_KEY,
      notificationSoundEnabled ? "1" : "0",
    );
  }, [notificationSoundEnabled]);

  const refreshCoreData = useCallback(async (user: User) => {
    const isAdmin = user.role === "TI_ADMIN";

    const [departments, branches, categories, tickets, notifications, settings, users, audit] =
      await Promise.all([
        listDepartmentsApi(),
        listBranchesApi(),
        listCategoriesApi(),
        listTicketsApi(),
        listNotificationsApi(),
        isAdmin ? getSettingsApi() : Promise.resolve({ ...DEFAULT_SETTINGS }),
        isAdmin ? listUsersApi() : Promise.resolve<User[]>([user]),
        isAdmin ? listAuditApi() : Promise.resolve<AuditLog[]>([]),
      ]);

    setData({
      users,
      departments,
      branches,
      categories,
      tickets,
      notifications,
      audit,
      settings,
    });
  }, []);

  const refreshAppData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await refreshCoreData(currentUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar dados.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, refreshCoreData]);

  const refreshLiveData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [nextTickets, nextNotifications] = await Promise.all([
        listTicketsApi(),
        listNotificationsApi(),
      ]);

      const prev = dataRef.current;
      const previousTicketIds = new Set(prev.tickets.map((ticket) => ticket.id));
      const newTicketIds = nextTickets
        .filter((ticket) => !previousTicketIds.has(ticket.id))
        .map((ticket) => ticket.id);

      const previousNotificationIds = new Set(
        prev.notifications.map((notification) => notification.id),
      );
      const freshUnreadForCurrentUser = nextNotifications.filter(
        (notification) =>
          notification.userId === currentUser.id &&
          !notification.read &&
          !previousNotificationIds.has(notification.id),
      );

      setData((current) => ({
        ...current,
        tickets: nextTickets,
        notifications: nextNotifications,
      }));

      if (newTicketIds.length > 0) {
        setRecentTicketIds((current) =>
          Array.from(new Set([...newTicketIds, ...current])).slice(0, 100),
        );
        window.setTimeout(() => {
          setRecentTicketIds((current) => current.filter((id) => !newTicketIds.includes(id)));
        }, NEW_TICKET_HIGHLIGHT_MS);
      }

      if (currentUser.role === "TI_ADMIN" && freshUnreadForCurrentUser.length > 0) {
        const newTicketNotifications = freshUnreadForCurrentUser.filter((notification) =>
          /nova os|os atribuida/i.test(notification.title),
        );
        if (newTicketNotifications.length > 0) {
          toast.info(
            newTicketNotifications.length === 1
              ? "Nova OS recebida"
              : `${newTicketNotifications.length} novas OS recebidas`,
            { description: newTicketNotifications[0]?.message },
          );
          if (notificationSoundEnabled) playNotificationTone();
        }
      }
    } catch {
      // Live refresh should be silent to avoid noisy toasts during transient network failures.
    }
  }, [currentUser, notificationSoundEnabled]);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } finally {
      setCurrentUser(null);
      setData(EMPTY_DATA);
      setRecentTicketIds([]);
      setReportsOverview(null);
    }
  }, []);

  const setNotificationSoundEnabled = useCallback((enabled: boolean) => {
    setNotificationSoundEnabledState(enabled);
  }, []);

  const bootstrap = useCallback(async () => {
    const storedUser = getCurrentUser();
    if (!storedUser) {
      setLoading(false);
      return;
    }

    setCurrentUser(storedUser);
    try {
      await refreshCoreData(storedUser);
    } catch {
      // Backend data may be unavailable in local demo mode.
    } finally {
      setLoading(false);
    }
  }, [refreshCoreData]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!currentUser) return;

    const interval = window.setInterval(() => {
      if (document.hidden) return;
      void refreshLiveData();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentUser, refreshLiveData]);

  useEffect(() => {
    if (!currentUser) return;
    const onVisibilityChange = () => {
      if (!document.hidden) void refreshLiveData();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser, refreshLiveData]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void logout();
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [logout]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "agrodesk-ti-current-user-v1") {
        if (!event.newValue) {
          setCurrentUser(null);
          setData(EMPTY_DATA);
          setRecentTicketIds([]);
          setReportsOverview(null);
          toast.info("Sessão encerrada em outra aba.");
        } else {
          window.location.reload();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true);
      try {
        const user = await authLogin(username, password);
        setCurrentUser(user);
        setRecentTicketIds([]);
        try {
          await refreshCoreData(user);
        } catch {
          // Backend data may be unavailable in local demo mode.
        }
        return user;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível realizar o login. Verifique suas credenciais.";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refreshCoreData],
  );

  const refreshReports = useCallback(async (query: ReportsQuery) => {
    try {
      const overview = await getReportsOverviewApi(query);
      setReportsOverview(overview);
      return overview;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar relatorios.";
      toast.error(message);
      return null;
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<User>) => {
      if (!currentUser) return;
      const updated = await updateMyProfileApi(patch);
      setCurrentUser(updated);
      setData((prev) => ({
        ...prev,
        users: prev.users.some((user) => user.id === updated.id)
          ? prev.users.map((user) => (user.id === updated.id ? updated : user))
          : [updated, ...prev.users],
      }));
    },
    [currentUser],
  );

  const createTicket = useCallback(
    async (input: CreateTicketInput, attachments: File[] = []) => {
      const created = await createTicketApi(input);

      for (const file of attachments) {
        await uploadAttachmentApi(created.id, file, false);
      }

      const full = await getTicketApi(created.id);
      applyTicket(full);
      const notifications = await listNotificationsApi();
      setData((prev) => ({ ...prev, notifications }));
      return full;
    },
    [applyTicket],
  );

  const updateTicket = useCallback(
    async (id: string, patch: Partial<Ticket>, options?: UpdateTicketOptions | string) => {
      const existing = data.tickets.find((ticket) => ticket.id === id);
      if (!existing) return;
      const normalizedOptions = typeof options === "string" ? undefined : options;

      const normalizedPatch = { ...patch };
      let hasTicketMutation = false;

      const hasAssigneeUpdate = Object.prototype.hasOwnProperty.call(normalizedPatch, "assigneeId");
      if (hasAssigneeUpdate && normalizedPatch.assigneeId !== existing.assigneeId) {
        await assignTicketApi(id, normalizedPatch.assigneeId);
        hasTicketMutation = true;
      }

      if (
        normalizedPatch.priority !== undefined &&
        normalizedPatch.priority !== existing.priority
      ) {
        await updateTicketPriorityApi(id, normalizedPatch.priority);
        hasTicketMutation = true;
      }

      if (normalizedPatch.status !== undefined && normalizedPatch.status !== existing.status) {
        if (normalizedOptions?.statusAction === "RESOLVE") {
          await resolveTicketApi(id, normalizedOptions.statusNote);
        } else if (normalizedOptions?.statusAction === "FINALIZE") {
          await finalizeTicketApi(id, normalizedOptions.statusNote);
        } else if (normalizedOptions?.statusAction === "REOPEN") {
          await reopenTicketApi(id, normalizedOptions.statusNote);
        } else if (normalizedOptions?.statusAction === "CANCEL") {
          await cancelTicketApi(id, normalizedOptions.statusNote);
        } else {
          await updateTicketStatusApi(id, normalizedPatch.status, normalizedOptions?.statusNote);
        }
        hasTicketMutation = true;
      }

      const technicalKeys: Array<keyof Ticket> = [
        "diagnosis",
        "rootCause",
        "solution",
        "partsUsed",
        "timeSpentMinutes",
        "internalNotes",
        "resolutionSummary",
      ];
      const hasTechnical = technicalKeys.some((key) => normalizedPatch[key] !== undefined);

      if (hasTechnical) {
        await updateTicketTechnicalApi(id, {
          diagnosis: normalizedPatch.diagnosis,
          rootCause: normalizedPatch.rootCause,
          solution: normalizedPatch.solution,
          partsUsed: normalizedPatch.partsUsed,
          timeSpentMinutes: normalizedPatch.timeSpentMinutes,
          internalNotes: normalizedPatch.internalNotes,
          resolutionSummary: normalizedPatch.resolutionSummary,
        });
        hasTicketMutation = true;
      }

      const fieldKeys: Array<keyof Ticket> = [
        "requesterName",
        "requesterPhone",
        "departmentId",
        "branchId",
        "description",
        "title",
        "categoryId",
        "subcategory",
        "suggestedPriority",
        "equipment",
        "assetTag",
        "bestTime",
        "impact",
        "additionalNotes",
      ];

      const hasFieldUpdates = fieldKeys.some((key) => normalizedPatch[key] !== undefined);
      if (hasFieldUpdates) {
        await updateTicketFieldsApi(id, normalizedPatch);
        hasTicketMutation = true;
      }

      if (!hasTicketMutation) return;

      const full = await getTicketApi(id);
      applyTicket(full);

      if (currentUser?.role === "TI_ADMIN") {
        const audit = await listAuditApi();
        setData((prev) => ({ ...prev, audit }));
      }
      const notifications = await listNotificationsApi();
      setData((prev) => ({ ...prev, notifications }));
    },
    [applyTicket, currentUser?.role, data.tickets],
  );

  const addComment = useCallback(
    async (ticketId: string, content: string, internal: boolean) => {
      await addCommentApi(ticketId, content, internal);
      await refreshTicketDetails(ticketId);
      const notifications = await listNotificationsApi();
      setData((prev) => ({ ...prev, notifications }));
      if (currentUser?.role === "TI_ADMIN") {
        const audit = await listAuditApi();
        setData((prev) => ({ ...prev, audit }));
      }
    },
    [currentUser?.role, refreshTicketDetails],
  );

  const uploadAttachment = useCallback(
    async (ticketId: string, file: File, internal = false) => {
      await uploadAttachmentApi(ticketId, file, internal);
      await refreshTicketDetails(ticketId);
    },
    [refreshTicketDetails],
  );

  const rateTicket = useCallback(
    async (ticketId: string, rating: number, comment?: string) => {
      await rateTicketApi(ticketId, rating, comment);
      await refreshTicketDetails(ticketId);
      const notifications = await listNotificationsApi();
      setData((prev) => ({ ...prev, notifications }));
    },
    [refreshTicketDetails],
  );

  const registerWhatsappPrepared = useCallback(
    async (input: {
      ticketId: string;
      message: string;
      phoneUsed: string;
      statusAtMoment?: Ticket["status"];
    }) => {
      await registerTicketWhatsappPreparedApi(input.ticketId, {
        message: input.message,
        phoneUsed: input.phoneUsed,
        statusAtMoment: input.statusAtMoment,
      });
      if (currentUser?.role === "TI_ADMIN") {
        const audit = await listAuditApi();
        setData((prev) => ({ ...prev, audit }));
      }
    },
    [currentUser?.role],
  );

  const upsertUser = useCallback(
    async (user: User, initialPassword?: string) => {
      const exists = data.users.some((item) => item.id === user.id);
      if (!exists && !initialPassword) {
        throw new Error("Informe uma senha temporaria para criar o usuario.");
      }
      const saved = exists ? await updateUserApi(user) : await createUserApi(user, initialPassword);
      setData((prev) => ({
        ...prev,
        users: prev.users.some((item) => item.id === saved.id)
          ? prev.users.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev.users],
      }));
    },
    [data.users],
  );

  const toggleUserActive = useCallback(
    async (id: string) => {
      const target = data.users.find((user) => user.id === id);
      if (!target) return;
      await toggleUserActiveApi(id, !target.active);
      setData((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user.id === id ? { ...user, active: !user.active } : user,
        ),
      }));
    },
    [data.users],
  );

  const resetUserPassword = useCallback(async (id: string, newPassword: string) => {
    await resetUserPasswordApi(id, newPassword);
  }, []);

  const changeMyPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changeMyPasswordApi(currentPassword, newPassword);
  }, []);

  const upsertDepartment = useCallback(
    async (department: Department) => {
      const exists = data.departments.some((item) => item.id === department.id);
      const saved = exists
        ? await updateDepartmentApi(department)
        : await createDepartmentApi(department);
      setData((prev) => ({
        ...prev,
        departments: prev.departments.some((item) => item.id === saved.id)
          ? prev.departments.map((item) => (item.id === saved.id ? saved : item))
          : [...prev.departments, saved],
      }));
    },
    [data.departments],
  );

  const upsertBranch = useCallback(
    async (branch: Branch) => {
      const exists = data.branches.some((item) => item.id === branch.id);
      const saved = exists ? await updateBranchApi(branch) : await createBranchApi(branch);
      setData((prev) => ({
        ...prev,
        branches: prev.branches.some((item) => item.id === saved.id)
          ? prev.branches.map((item) => (item.id === saved.id ? saved : item))
          : [...prev.branches, saved],
      }));
    },
    [data.branches],
  );

  const upsertCategory = useCallback(
    async (category: Category) => {
      const exists = data.categories.some((item) => item.id === category.id);
      const saved = exists ? await updateCategoryApi(category) : await createCategoryApi(category);
      setData((prev) => ({
        ...prev,
        categories: prev.categories.some((item) => item.id === saved.id)
          ? prev.categories.map((item) => (item.id === saved.id ? saved : item))
          : [...prev.categories, saved],
      }));
    },
    [data.categories],
  );

  const updateSettings = useCallback(
    async (patch: Partial<GlobalSettings>) => {
      const saved = await updateSettingsApi({ ...data.settings, ...patch });
      setData((prev) => ({
        ...prev,
        settings: {
          ...saved,
          priorities: patch.priorities ?? prev.settings.priorities,
          statuses: patch.statuses ?? prev.settings.statuses,
          appearancePreset: patch.appearancePreset ?? prev.settings.appearancePreset,
          backupMessage: patch.backupMessage ?? prev.settings.backupMessage,
        },
      }));
    },
    [data.settings],
  );

  const markNotificationRead = useCallback(async (notificationId: string) => {
    await markNotificationReadApi(notificationId);
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsReadApi();
    if (!currentUser) return;
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) =>
        notification.userId === currentUser.id ? { ...notification, read: true } : notification,
      ),
    }));
  }, [currentUser]);

  const value = useMemo<AppState>(
    () => ({
      loading,
      currentUser,
      users: data.users,
      departments: data.departments,
      branches: data.branches,
      categories: data.categories,
      tickets: data.tickets,
      recentTicketIds,
      notifications: data.notifications,
      notificationSoundEnabled,
      audit: data.audit,
      settings: data.settings,
      reportsOverview,
      login,
      logout,
      refreshAppData,
      refreshReports,
      updateProfile,
      createTicket,
      updateTicket,
      refreshTicketDetails,
      addComment,
      uploadAttachment,
      rateTicket,
      registerWhatsappPrepared,
      upsertUser,
      toggleUserActive,
      resetUserPassword,
      changeMyPassword,
      upsertDepartment,
      upsertBranch,
      upsertCategory,
      updateSettings,
      markNotificationRead,
      markAllRead,
      setNotificationSoundEnabled,
    }),
    [
      addComment,
      createTicket,
      currentUser,
      data.audit,
      data.branches,
      data.categories,
      data.departments,
      data.notifications,
      data.settings,
      data.tickets,
      data.users,
      loading,
      login,
      logout,
      markAllRead,
      markNotificationRead,
      notificationSoundEnabled,
      recentTicketIds,
      refreshAppData,
      refreshReports,
      refreshTicketDetails,
      reportsOverview,
      rateTicket,
      registerWhatsappPrepared,
      setNotificationSoundEnabled,
      toggleUserActive,
      resetUserPassword,
      changeMyPassword,
      updateProfile,
      updateSettings,
      updateTicket,
      uploadAttachment,
      upsertBranch,
      upsertCategory,
      upsertDepartment,
      upsertUser,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export function useCurrentUser() {
  return useApp().currentUser;
}
