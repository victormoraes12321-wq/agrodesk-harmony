import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Eye,
  MessageCircle,
  Search,
  ShieldX,
  SlidersHorizontal,
  SquarePen,
  SquareTerminal,
  UserCheck,
  UserRoundSearch,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PRIORITY_LEVELS, STATUS_FLOW } from "@/app/constants";
import { AdminOnly } from "@/components/auth/RoleGuard";
import { PriorityBadge, StatusBadge } from "@/components/tickets/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { TicketSlaChip } from "@/features/tickets/TicketSlaChip";
import {
  getDefaultTicketListSearch,
  parseTicketListSearch,
  sanitizeTicketListSearch,
  toTicketListUrlSearch,
  type TicketListSearch,
} from "@/features/tickets/list-search";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import {
  formatBranchName,
  getBranchName,
  getCategoryName,
  getDepartmentName,
  getUserName,
  isSlaNear,
  isSlaOverdue,
} from "@/lib/helpdesk";
import { useApp } from "@/lib/store";
import { buildWhatsAppUrl, generateWhatsAppMessage } from "@/lib/whatsapp";
import type { Ticket } from "@/types";

export const Route = createFileRoute("/app/chamados")({
  head: () => ({ meta: [{ title: "Gestao de Chamados | AgroDesk TI" }] }),
  validateSearch: (search: Record<string, unknown>): Partial<TicketListSearch> =>
    parseTicketListSearch(search),
  component: TicketsManagementRoute,
});

function TicketsManagementRoute() {
  const app = useApp();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/app/chamados") return <Outlet />;

  return (
    <AdminOnly user={app.currentUser}>
      <TicketsManagementPage />
    </AdminOnly>
  );
}

const OPEN_STATUSES: Ticket["status"][] = [
  "ABERTO",
  "EM_ANALISE",
  "EM_ATENDIMENTO",
  "AGUARDANDO_USUARIO",
  "AGUARDANDO_PECA",
  "REABERTO",
];

const RESOLVED_STATUSES: Ticket["status"][] = ["RESOLVIDO", "FINALIZADO"];

const PRIORITY_WEIGHT: Record<Ticket["priority"], number> = {
  CRITICA: 4,
  ALTA: 3,
  MEDIA: 2,
  BAIXA: 1,
};

function periodMatches(ticket: Ticket, period: TicketListSearch["period"]): boolean {
  if (period === "ALL") return true;
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const reference = ticket.resolvedAt ?? ticket.closedAt ?? ticket.updatedAt ?? ticket.createdAt;
  const referenceDate = new Date(reference);
  const ageHours = (now.getTime() - referenceDate.getTime()) / 3600000;

  if (period === "TODAY") return referenceDate.getTime() >= startToday.getTime();
  if (period === "THIS_MONTH") {
    return (
      referenceDate.getMonth() === now.getMonth() &&
      referenceDate.getFullYear() === now.getFullYear()
    );
  }
  if (period === "7D") return ageHours <= 24 * 7;
  if (period === "30D") return ageHours <= 24 * 30;
  if (period === "90D") return ageHours <= 24 * 90;
  return true;
}

function getSlaRemainingMs(ticket: Ticket): number {
  if (ticket.closedAt) return Number.POSITIVE_INFINITY;
  const deadline = new Date(ticket.createdAt).getTime() + ticket.slaHours * 3600000;
  return deadline - Date.now();
}

function compareTickets(
  a: Ticket,
  b: Ticket,
  sortBy: TicketListSearch["sortBy"],
  sortDir: TicketListSearch["sortDir"],
) {
  const dir = sortDir === "asc" ? 1 : -1;

  if (sortBy === "priority") {
    const diff = (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * dir;
    if (diff !== 0) return diff;
  }

  if (sortBy === "sla") {
    const diff = (getSlaRemainingMs(a) - getSlaRemainingMs(b)) * dir;
    if (diff !== 0) return diff;
  }

  return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
}

function TicketsManagementPage() {
  const {
    currentUser,
    tickets,
    users,
    departments,
    branches,
    categories,
    updateTicket,
    registerWhatsappPrepared,
    recentTicketIds,
  } = useApp();
  const loading = usePageLoading();
  const wideTicketTable = useMediaQuery("(min-width: 1536px)");
  const rawSearch = Route.useSearch();
  const search = useMemo<TicketListSearch>(
    () => ({
      ...getDefaultTicketListSearch(),
      ...rawSearch,
    }),
    [rawSearch],
  );
  const navigate = useNavigate();
  const admins = users.filter(
    (user) => user.role === "TI_ADMIN" && user.active && user.canReceiveTickets,
  );
  const [waitingTargetTicket, setWaitingTargetTicket] = useState<Ticket | null>(null);
  const [waitingReason, setWaitingReason] = useState("");
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const setBusy = useCallback((ticketId: string, value: boolean) => {
    setBusyIds((prev) => ({ ...prev, [ticketId]: value }));
  }, []);

  const updateSearch = useCallback(
    (patch: Partial<TicketListSearch>, replace = true) => {
      const next = sanitizeTicketListSearch({
        ...search,
        ...patch,
      });

      void navigate({
        search: toTicketListUrlSearch(next) as any,
        replace,
      });
    },
    [navigate, search],
  );

  const clearFilters = useCallback(() => {
    const base = getDefaultTicketListSearch();
    void navigate({
      search: toTicketListUrlSearch(base) as any,
      replace: true,
    });
  }, [navigate]);

  const filtered = useMemo(() => {
    const text = search.q.trim().toLowerCase();
    return tickets
      .filter((ticket) => {
        const textMatch =
          text.length === 0 ||
          ticket.protocol.toLowerCase().includes(text) ||
          ticket.requesterName.toLowerCase().includes(text) ||
          ticket.requesterPhone.toLowerCase().includes(text) ||
          ticket.description.toLowerCase().includes(text);

        const statusMatch =
          search.quick === "OPEN"
            ? OPEN_STATUSES.includes(ticket.status)
            : search.quick === "RESOLVED_MONTH"
              ? RESOLVED_STATUSES.includes(ticket.status)
              : search.status === "ALL" || ticket.status === search.status;

        const priorityMatch = search.priority === "ALL" || ticket.priority === search.priority;
        const assigneeMatch =
          search.assigneeId === "ALL" || ticket.assigneeId === search.assigneeId;
        const departmentMatch =
          search.departmentId === "ALL" || ticket.departmentId === search.departmentId;
        const branchMatch = search.branchId === "ALL" || ticket.branchId === search.branchId;
        const categoryMatch =
          search.categoryId === "ALL" || ticket.categoryId === search.categoryId;

        const slaMatch =
          search.sla === "ALL" ||
          (search.sla === "VENCIDO" && isSlaOverdue(ticket)) ||
          (search.sla === "PROXIMO" && isSlaNear(ticket));

        const periodMatch = periodMatches(ticket, search.period);

        return (
          textMatch &&
          statusMatch &&
          priorityMatch &&
          assigneeMatch &&
          departmentMatch &&
          branchMatch &&
          categoryMatch &&
          slaMatch &&
          periodMatch
        );
      })
      .sort((a, b) => compareTickets(a, b, search.sortBy, search.sortDir));
  }, [search, tickets]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / search.pageSize));
  const safePage = Math.min(search.page, totalPages);

  useEffect(() => {
    if (safePage !== search.page) updateSearch({ page: safePage });
  }, [safePage, search.page, updateSearch]);

  const pageStart = (safePage - 1) * search.pageSize;
  const pageEnd = pageStart + search.pageSize;
  const paginated = filtered.slice(pageStart, pageEnd);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (search.q.trim()) total += 1;
    if (search.quick !== "NONE") total += 1;
    if (search.status !== "ALL") total += 1;
    if (search.priority !== "ALL") total += 1;
    if (search.assigneeId !== "ALL") total += 1;
    if (search.departmentId !== "ALL") total += 1;
    if (search.branchId !== "ALL") total += 1;
    if (search.categoryId !== "ALL") total += 1;
    if (search.period !== "ALL") total += 1;
    if (search.sla !== "ALL") total += 1;
    if (search.sortBy !== "createdAt" || search.sortDir !== "desc") total += 1;
    return total;
  }, [search]);

  const onAssign = async (ticket: Ticket, assigneeId: string) => {
    setBusy(ticket.id, true);
    try {
      await updateTicket(ticket.id, { assigneeId: assigneeId || undefined }, "responsavel");
      toast.success("Responsavel atualizado");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel atualizar o responsavel.";
      toast.error(message);
    } finally {
      setBusy(ticket.id, false);
    }
  };

  const onPriority = async (ticket: Ticket, value: Ticket["priority"]) => {
    setBusy(ticket.id, true);
    try {
      await updateTicket(ticket.id, { priority: value }, "prioridade real");
      toast.success("Prioridade alterada");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel alterar a prioridade.";
      toast.error(message);
    } finally {
      setBusy(ticket.id, false);
    }
  };

  const submitStatusChange = async (
    ticket: Ticket,
    value: Ticket["status"],
    statusNote?: string,
  ) => {
    const statusAction =
      value === "RESOLVIDO"
        ? "RESOLVE"
        : value === "FINALIZADO"
          ? "FINALIZE"
          : value === "REABERTO"
            ? "REOPEN"
            : value === "CANCELADO"
              ? "CANCEL"
              : "UPDATE";

    setBusy(ticket.id, true);
    try {
      await updateTicket(ticket.id, { status: value }, { statusAction, statusNote });
      toast.success("Status alterado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel alterar o status.";
      toast.error(message);
    } finally {
      setBusy(ticket.id, false);
    }
  };

  const onStatus = async (ticket: Ticket, value: Ticket["status"]) => {
    if (value === "AGUARDANDO_USUARIO") {
      setWaitingTargetTicket(ticket);
      setWaitingReason(ticket.waitingRequesterMessage ?? "");
      return;
    }
    await submitStatusChange(ticket, value);
  };

  const openWhatsAppFromList = async (ticket: Ticket) => {
    if (!ticket.requesterPhone?.trim()) {
      toast.error("Telefone do solicitante nao informado nesta OS.");
      return;
    }

    const message = generateWhatsAppMessage(ticket, {
      assigneeName: getUserName(users, ticket.assigneeId),
      departmentName: getDepartmentName(departments, ticket.departmentId),
      branchName: getBranchName(branches, ticket.branchId),
      categoryName: getCategoryName(categories, ticket.categoryId),
    });

    const url = buildWhatsAppUrl(ticket.requesterPhone, message);
    if (!url) {
      toast.warning("Telefone invalido para WhatsApp. Corrija no cadastro ou detalhe da OS.");
      return;
    }

    setBusy(ticket.id, true);
    try {
      await registerWhatsappPrepared({
        ticketId: ticket.id,
        message,
        phoneUsed: ticket.requesterPhone,
        statusAtMoment: ticket.status,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const messageError =
        error instanceof Error
          ? error.message
          : "Nao foi possivel registrar auditoria do WhatsApp.";
      toast.error(messageError);
    } finally {
      setBusy(ticket.id, false);
    }
  };

  if (loading) return <PageLoading cards={0} rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Chamados"
        description="Tabela completa de todas as OS com filtros, ordenacao, paginacao e acoes operacionais rapidas."
      />

      <section className="rounded-2xl border bg-card p-4 space-y-3 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por protocolo, solicitante, telefone ou descricao"
              value={search.q}
              onChange={(event) => updateSearch({ q: event.target.value, page: 1 })}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="sm:hidden justify-between"
            onClick={() => setShowAdvancedFilters((current) => !current)}
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="size-4" /> Filtros e ordenacao
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {activeFilterCount}
            </span>
          </Button>

          <div className={`${showAdvancedFilters ? "contents" : "hidden"} sm:contents`}>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.status}
              onChange={(event) =>
                updateSearch({
                  quick: "NONE",
                  status: event.target.value as TicketListSearch["status"],
                  page: 1,
                })
              }
            >
              <option value="ALL">Status: todos</option>
              {STATUS_FLOW.map((item) => (
                <option key={item} value={item}>
                  {statusLabel[item]}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.priority}
              onChange={(event) =>
                updateSearch({
                  priority: event.target.value as TicketListSearch["priority"],
                  page: 1,
                })
              }
            >
              <option value="ALL">Prioridade: todas</option>
              {PRIORITY_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {priorityLabel[item]}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.assigneeId}
              onChange={(event) => updateSearch({ assigneeId: event.target.value, page: 1 })}
            >
              <option value="ALL">Responsavel: todos</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant={search.quick === "OPEN" ? "default" : "outline"}
              onClick={() =>
                updateSearch({
                  quick: search.quick === "OPEN" ? "NONE" : "OPEN",
                  status: "ALL",
                  page: 1,
                })
              }
            >
              Abertas em andamento
            </Button>
          </div>
        </div>

        <div className={`${showAdvancedFilters ? "space-y-3" : "hidden"} sm:block sm:space-y-3`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.departmentId}
              onChange={(event) => updateSearch({ departmentId: event.target.value, page: 1 })}
            >
              <option value="ALL">Setor: todos</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.branchId}
              onChange={(event) => updateSearch({ branchId: event.target.value, page: 1 })}
            >
              <option value="ALL">Filiais: todas</option>
              {branches.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatBranchName(item.name)}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.categoryId}
              onChange={(event) => updateSearch({ categoryId: event.target.value, page: 1 })}
            >
              <option value="ALL">Categoria: todas</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.period}
              onChange={(event) =>
                updateSearch({ period: event.target.value as TicketListSearch["period"], page: 1 })
              }
            >
              <option value="ALL">Periodo: todos</option>
              <option value="TODAY">Hoje</option>
              <option value="THIS_MONTH">Mes atual</option>
              <option value="7D">Ultimos 7 dias</option>
              <option value="30D">Ultimos 30 dias</option>
              <option value="90D">Ultimos 90 dias</option>
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.sla}
              onChange={(event) =>
                updateSearch({ sla: event.target.value as TicketListSearch["sla"], page: 1 })
              }
            >
              <option value="ALL">SLA: todos</option>
              <option value="VENCIDO">SLA vencido</option>
              <option value="PROXIMO">SLA proximo</option>
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              <X className="size-4" /> Limpar filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.sortBy}
              onChange={(event) =>
                updateSearch({ sortBy: event.target.value as TicketListSearch["sortBy"], page: 1 })
              }
            >
              <option value="createdAt">Ordenar por data de abertura</option>
              <option value="priority">Ordenar por prioridade</option>
              <option value="sla">Ordenar por SLA</option>
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={search.sortDir}
              onChange={(event) =>
                updateSearch({
                  sortDir: event.target.value as TicketListSearch["sortDir"],
                  page: 1,
                })
              }
            >
              <option value="desc">Ordem decrescente</option>
              <option value="asc">Ordem crescente</option>
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={String(search.pageSize)}
              onChange={(event) => updateSearch({ pageSize: Number(event.target.value), page: 1 })}
            >
              <option value="10">10 por pagina</option>
              <option value="20">20 por pagina</option>
              <option value="50">50 por pagina</option>
              <option value="100">100 por pagina</option>
            </select>
            <div className="h-10 rounded-md border px-3 text-sm flex items-center justify-between bg-muted/20">
              <span className="text-muted-foreground">Filtros ativos</span>
              <strong>{activeFilterCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card overflow-hidden shadow-[var(--shadow-card)]">
        {paginated.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Nenhum chamado encontrado"
              description="Ajuste os filtros aplicados para localizar OS."
              compact
              actionLabel="Limpar filtros"
              onAction={activeFilterCount > 0 ? clearFilters : undefined}
            />
          </div>
        ) : (
          <>
            {!wideTicketTable ? (
              <div className="divide-y">
                {paginated.map((ticket) => {
                  const busy = busyIds[ticket.id] === true;
                  const isRecent = recentTicketIds.includes(ticket.id);
                  return (
                    <article
                      key={ticket.id}
                      className={`p-4 space-y-2 ${isRecent ? "bg-success/10 border-l-4 border-l-success" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{ticket.protocol}</p>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="text-sm font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.requesterName} -{" "}
                        {getDepartmentName(departments, ticket.departmentId)}
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <PriorityBadge priority={ticket.priority} />
                        <TicketSlaChip
                          createdAt={ticket.createdAt}
                          slaHours={ticket.slaHours}
                          closedAt={ticket.closedAt}
                          status={ticket.status}
                          slaDueAt={ticket.slaDueAt}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                            <Eye className="size-3.5" /> Detalhe
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void onAssign(ticket, currentUser?.id ?? "")}
                          disabled={busy}
                        >
                          <UserCheck className="size-3.5" /> Assumir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void submitStatusChange(ticket, "EM_ATENDIMENTO")}
                          disabled={busy}
                        >
                          <SquareTerminal className="size-3.5" /> Em atendimento
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setWaitingTargetTicket(ticket);
                            setWaitingReason(ticket.waitingRequesterMessage ?? "");
                          }}
                          disabled={busy}
                        >
                          <UserRoundSearch className="size-3.5" /> Aguardar resposta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void submitStatusChange(ticket, "RESOLVIDO")}
                          disabled={busy}
                        >
                          <ShieldX className="size-3.5" /> Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void openWhatsAppFromList(ticket)}
                          disabled={busy}
                        >
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1520px]">
                  <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-3">Numero OS</th>
                      <th className="text-left px-3 py-3">Titulo/resumo</th>
                      <th className="text-left px-3 py-3">Solicitante</th>
                      <th className="text-left px-3 py-3">Telefone</th>
                      <th className="text-left px-3 py-3">Setor</th>
                      <th className="text-left px-3 py-3">Filial</th>
                      <th className="text-left px-3 py-3">Categoria</th>
                      <th className="text-left px-3 py-3">Prioridade</th>
                      <th className="text-left px-3 py-3">Status</th>
                      <th className="text-left px-3 py-3">Responsavel</th>
                      <th className="text-left px-3 py-3">Abertura</th>
                      <th className="text-left px-3 py-3">SLA</th>
                      <th className="text-left px-3 py-3">Acoes rapidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((ticket) => {
                      const busy = busyIds[ticket.id] === true;
                      const isRecent = recentTicketIds.includes(ticket.id);
                      return (
                        <tr
                          key={ticket.id}
                          className={`border-t align-top transition ${
                            isRecent
                              ? "bg-success/10 border-l-4 border-l-success"
                              : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="px-3 py-3 font-medium">{ticket.protocol}</td>
                          <td className="px-3 py-3 max-w-[220px]">
                            <p className="font-medium">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {ticket.description}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-sm">{ticket.requesterName}</td>
                          <td className="px-3 py-3 text-sm">{ticket.requesterPhone}</td>
                          <td className="px-3 py-3 text-sm">
                            {getDepartmentName(departments, ticket.departmentId)}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {getBranchName(branches, ticket.branchId)}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {getCategoryName(categories, ticket.categoryId)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-2">
                              <PriorityBadge priority={ticket.priority} />
                              <select
                                className="h-8 rounded-md border bg-background px-2 text-xs"
                                value={ticket.priority}
                                onChange={(event) =>
                                  void onPriority(ticket, event.target.value as Ticket["priority"])
                                }
                                disabled={busy}
                              >
                                {PRIORITY_LEVELS.map((item) => (
                                  <option key={item} value={item}>
                                    {priorityLabel[item]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-2">
                              <StatusBadge status={ticket.status} />
                              <select
                                className="h-8 rounded-md border bg-background px-2 text-xs"
                                value={ticket.status}
                                onChange={(event) =>
                                  void onStatus(ticket, event.target.value as Ticket["status"])
                                }
                                disabled={busy}
                              >
                                {STATUS_FLOW.map((item) => (
                                  <option key={item} value={item}>
                                    {statusLabel[item]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm mb-2">
                              {getUserName(users, ticket.assigneeId)}
                            </div>
                            <select
                              className="h-8 rounded-md border bg-background px-2 text-xs"
                              value={ticket.assigneeId ?? ""}
                              onChange={(event) => void onAssign(ticket, event.target.value)}
                              disabled={busy}
                            >
                              <option value="">Sem responsavel</option>
                              {admins.map((admin) => (
                                <option key={admin.id} value={admin.id}>
                                  {admin.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {formatDateTime(ticket.createdAt)}
                          </td>
                          <td className="px-3 py-3">
                            <TicketSlaChip
                              createdAt={ticket.createdAt}
                              slaHours={ticket.slaHours}
                              closedAt={ticket.closedAt}
                              status={ticket.status}
                              slaDueAt={ticket.slaDueAt}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              <Button size="sm" variant="outline" asChild disabled={busy}>
                                <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                                  <Eye className="size-3.5" /> Ver
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild disabled={busy}>
                                <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                                  <SquarePen className="size-3.5" /> Editar
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void onAssign(ticket, currentUser?.id ?? "")}
                                disabled={busy}
                              >
                                <UserCheck className="size-3.5" /> Assumir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void submitStatusChange(ticket, "EM_ATENDIMENTO")}
                                disabled={busy}
                              >
                                <SquareTerminal className="size-3.5" /> Em atendimento
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setWaitingTargetTicket(ticket);
                                  setWaitingReason(ticket.waitingRequesterMessage ?? "");
                                }}
                                disabled={busy}
                              >
                                <UserRoundSearch className="size-3.5" /> Aguardar retorno
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void submitStatusChange(ticket, "RESOLVIDO")}
                                disabled={busy}
                              >
                                <ShieldX className="size-3.5" /> Resolver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void openWhatsAppFromList(ticket)}
                                disabled={busy}
                              >
                                <MessageCircle className="size-3.5" /> WhatsApp
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="border-t px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Exibindo {totalItems === 0 ? 0 : pageStart + 1} - {Math.min(pageEnd, totalItems)} de{" "}
            {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => updateSearch({ page: safePage - 1 }, false)}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Pagina {safePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => updateSearch({ page: safePage + 1 }, false)}
            >
              Proxima
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(waitingTargetTicket)}
        onOpenChange={(open) => !open && setWaitingTargetTicket(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O que voce precisa que o solicitante responda?</DialogTitle>
            <DialogDescription>
              Este texto e obrigatorio para mudar o status para "Aguardando resposta do
              solicitante".
            </DialogDescription>
          </DialogHeader>
          <Input
            value={waitingReason}
            onChange={(event) => setWaitingReason(event.target.value)}
            placeholder="Ex: Envie uma foto da mensagem de erro."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWaitingTargetTicket(null);
                setWaitingReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!waitingTargetTicket) return;
                const note = waitingReason.trim();
                if (!note) {
                  toast.error("Informe o que esta sendo aguardado do solicitante.");
                  return;
                }
                const target = waitingTargetTicket;
                setWaitingTargetTicket(null);
                setWaitingReason("");
                void submitStatusChange(target, "AGUARDANDO_USUARIO", note);
              }}
            >
              Salvar e alterar status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
