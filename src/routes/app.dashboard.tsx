import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Layers3,
  ListChecks,
  MessageCircleHeart,
  Siren,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { STATUS_FLOW } from "@/app/constants";
import { AdminOnly } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { StatCard } from "@/components/ui/stat-card";
import { TicketSlaChip } from "@/features/tickets/TicketSlaChip";
import {
  getDefaultTicketListSearch,
  toTicketListUrlSearch,
  type TicketListSearch,
} from "@/features/tickets/list-search";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatDateTime, statusLabel } from "@/lib/format";
import {
  avgRating,
  avgResolutionHours,
  getBranchName,
  getCategoryName,
  getDepartmentName,
  getUserName,
  isSlaOverdue,
} from "@/lib/helpdesk";
import { useApp } from "@/lib/store";
import {
  criticalCount,
  groupByKey,
  groupByStatus,
  monthlyResolved,
  slaCompliance,
} from "@/services/reporting";
import {
  getRecurringProblemsApi,
  getReportsOverviewApi,
  listSlaNearExpiryApi,
  listSlaOverdueApi,
  type ReportsOverview,
} from "@/services/helpdesk-api";
import type { Ticket } from "@/types";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Administrativo | AgroDesk TI" }] }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <DashboardPage />
    </AdminOnly>
  );
}

function DashboardPage() {
  const { tickets, categories, departments, branches, users } = useApp();
  const navigate = useNavigate();
  const loading = usePageLoading();
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [realOverdueTickets, setRealOverdueTickets] = useState<Ticket[]>([]);
  const [realNearExpiryTickets, setRealNearExpiryTickets] = useState<Ticket[]>([]);
  const [recurringProblems, setRecurringProblems] = useState<
    Array<{ label: string; total: number }>
  >([]);

  useEffect(() => {
    let mounted = true;
    let firstRun = true;

    const run = () => {
      if (firstRun) setAnalyticsLoading(true);
      Promise.all([
        getReportsOverviewApi({ period: "ALL" }),
        getRecurringProblemsApi({ period: "90D" }),
        listSlaOverdueApi(),
        listSlaNearExpiryApi(),
      ])
        .then(([overviewData, recurring, overdue, near]) => {
          if (!mounted) return;
          setOverview(overviewData);
          setRecurringProblems(recurring);
          setRealOverdueTickets(overdue);
          setRealNearExpiryTickets(near);
        })
        .catch(() => {
          if (!mounted) return;
          setOverview(null);
          setRecurringProblems([]);
          setRealOverdueTickets([]);
          setRealNearExpiryTickets([]);
        })
        .finally(() => {
          if (mounted && firstRun) {
            setAnalyticsLoading(false);
            firstRun = false;
          }
        });
    };

    run();
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      run();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const metrics = useMemo(() => {
    const open = tickets.filter((ticket) =>
      ["ABERTO", "EM_ANALISE", "REABERTO"].includes(ticket.status),
    ).length;
    const inProgress = tickets.filter((ticket) => ticket.status === "EM_ATENDIMENTO").length;
    const waiting = tickets.filter((ticket) => ticket.status === "AGUARDANDO_USUARIO").length;
    const critical = criticalCount(tickets);
    const overdue =
      realOverdueTickets.length || tickets.filter((ticket) => isSlaOverdue(ticket)).length;
    const resolvedThisMonth = monthlyResolved(tickets);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const finalizedToday = tickets.filter((ticket) => {
      if (ticket.status !== "FINALIZADO" || !ticket.closedAt) return false;
      return new Date(ticket.closedAt).getTime() >= todayStart.getTime();
    }).length;
    const avgTimeHours = overview
      ? overview.avgResolutionMinutes / 60
      : avgResolutionHours(tickets);
    const satisfaction = overview ? overview.ratings.average : avgRating(tickets);

    return {
      open,
      inProgress,
      waiting,
      critical,
      overdue,
      resolvedThisMonth,
      finalizedToday,
      avgTimeHours,
      satisfaction,
    };
  }, [overview, realOverdueTickets.length, tickets]);

  const fallbackStatus = useMemo(() => {
    return groupByStatus(tickets).map((item) => ({
      key: item.status,
      total: item.total,
    }));
  }, [tickets]);

  const byStatus = useMemo(() => {
    const source = overview?.byStatus.length ? overview.byStatus : fallbackStatus;
    return STATUS_FLOW.map((status) => ({
      name: statusLabel[status],
      total: source.find((row) => row.key === status)?.total ?? 0,
    }));
  }, [fallbackStatus, overview?.byStatus]);

  const fallbackByCategory = useMemo(() => {
    return groupByKey(tickets, "categoryId").map((item) => ({
      key: item.key === "Nao informado" ? "NAO_INFORMADO" : item.key,
      total: item.total,
    }));
  }, [tickets]);

  const byCategory = useMemo(() => {
    const source = overview?.byCategory.length ? overview.byCategory : fallbackByCategory;
    return source
      .map((row) => ({
        name: getCategoryName(categories, row.key === "NAO_INFORMADO" ? undefined : row.key),
        total: row.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [categories, fallbackByCategory, overview?.byCategory]);

  const fallbackByDepartment = useMemo(() => {
    return groupByKey(tickets, "departmentId").map((item) => ({
      key: item.key === "Nao informado" ? "NAO_INFORMADO" : item.key,
      total: item.total,
    }));
  }, [tickets]);

  const byDepartment = useMemo(() => {
    const source = overview?.byDepartment.length ? overview.byDepartment : fallbackByDepartment;
    return source
      .map((row) => ({
        name: getDepartmentName(departments, row.key === "NAO_INFORMADO" ? undefined : row.key),
        total: row.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [departments, fallbackByDepartment, overview?.byDepartment]);

  const fallbackByBranch = useMemo(() => {
    return groupByKey(tickets, "branchId").map((item) => ({
      key: item.key === "Nao informado" ? "NAO_INFORMADO" : item.key,
      total: item.total,
    }));
  }, [tickets]);

  const byBranch = useMemo(() => {
    const source = overview?.byBranch.length ? overview.byBranch : fallbackByBranch;
    return source
      .map((row) => ({
        name: getBranchName(branches, row.key === "NAO_INFORMADO" ? undefined : row.key),
        total: row.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [branches, fallbackByBranch, overview?.byBranch]);

  const fallbackByAssignee = useMemo(() => {
    return groupByKey(tickets, "assigneeId").map((item) => ({
      key: item.key === "Nao informado" ? "SEM_RESPONSAVEL" : item.key,
      total: item.total,
    }));
  }, [tickets]);

  const byAssignee = useMemo(() => {
    const source = overview?.byAssignee.length ? overview.byAssignee : fallbackByAssignee;
    return source
      .map((row) => ({
        id: row.key,
        name: getUserName(users, row.key === "SEM_RESPONSAVEL" ? undefined : row.key),
        total: row.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [fallbackByAssignee, overview?.byAssignee, users]);

  const compliance = useMemo(() => {
    if (overview) return overview.sla;
    return slaCompliance(tickets);
  }, [overview, tickets]);

  const slaChartData = useMemo(
    () => [
      { name: "Cumprido", total: compliance.inSla },
      { name: "Vencido", total: compliance.overdue },
    ],
    [compliance.inSla, compliance.overdue],
  );

  const criticalTickets = useMemo(() => {
    return tickets
      .filter((ticket) => ticket.priority === "CRITICA")
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 8);
  }, [tickets]);

  const overdueTickets = useMemo(() => {
    if (realOverdueTickets.length > 0) {
      return [...realOverdueTickets]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 8);
    }
    return tickets
      .filter((ticket) => isSlaOverdue(ticket))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);
  }, [realOverdueTickets, tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
  }, [tickets]);

  const topAssignees = useMemo(() => {
    return byAssignee.filter((row) => row.id !== "SEM_RESPONSAVEL").slice(0, 8);
  }, [byAssignee]);

  const mergedSlaAlerts = useMemo(() => {
    const combined = [...realOverdueTickets, ...realNearExpiryTickets];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    return unique.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
  }, [realNearExpiryTickets, realOverdueTickets]);

  if (loading || analyticsLoading) return <PageLoading cards={8} rows={8} />;

  const openTicketsWithFilters = (patch: Partial<TicketListSearch>) => {
    const next = {
      ...getDefaultTicketListSearch(),
      ...patch,
      page: 1,
    };
    void navigate({
      to: "/app/chamados",
      search: toTicketListUrlSearch(next) as any,
    });
  };

  return (
    <div className="space-y-6 fade-slide-up">
      <PageHeader
        title="Dashboard Administrativo"
        description="Indicadores em tempo real da operacao de TI com foco em SLA, produtividade e recorrencia de problemas."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="OS abertas"
          value={metrics.open}
          icon={Layers3}
          tone="info"
          onClick={() => openTicketsWithFilters({ quick: "OPEN" })}
        />
        <StatCard
          label="Em atendimento"
          value={metrics.inProgress}
          icon={Clock3}
          tone="primary"
          onClick={() => openTicketsWithFilters({ status: "EM_ATENDIMENTO" })}
        />
        <StatCard
          label="Aguardando usuario"
          value={metrics.waiting}
          icon={Timer}
          tone="warning"
          onClick={() => openTicketsWithFilters({ status: "AGUARDANDO_USUARIO" })}
        />
        <StatCard
          label="Criticas"
          value={metrics.critical}
          icon={Siren}
          tone="danger"
          onClick={() => openTicketsWithFilters({ priority: "CRITICA" })}
        />
        <StatCard
          label="Vencidas"
          value={metrics.overdue}
          icon={AlertTriangle}
          tone="danger"
          onClick={() => openTicketsWithFilters({ sla: "VENCIDO", sortBy: "sla", sortDir: "asc" })}
        />
        <StatCard
          label="Resolvidas no mes"
          value={metrics.resolvedThisMonth}
          icon={ListChecks}
          tone="success"
          onClick={() => openTicketsWithFilters({ status: "RESOLVIDO", period: "THIS_MONTH" })}
        />
        <StatCard
          label="Finalizadas hoje"
          value={metrics.finalizedToday}
          icon={CheckCircle2}
          tone="success"
          onClick={() => openTicketsWithFilters({ status: "FINALIZADO", period: "TODAY" })}
        />
        <StatCard
          label="Tempo medio de atendimento"
          value={`${metrics.avgTimeHours.toFixed(1)}h`}
          icon={BarChart3}
          tone="primary"
          onClick={() => openTicketsWithFilters({ sortBy: "sla", sortDir: "asc" })}
        />
        <StatCard
          label="Satisfacao media"
          value={metrics.satisfaction ? metrics.satisfaction.toFixed(1) : "-"}
          icon={MessageCircleHeart}
          tone="success"
          onClick={() => openTicketsWithFilters({ status: "FINALIZADO", period: "THIS_MONTH" })}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartBar title="OS por status" data={byStatus} color="var(--color-primary)" />
        <ChartBar title="OS por categoria" data={byCategory} color="var(--color-chart-2)" />
        <ChartBar title="OS por setor" data={byDepartment} color="var(--color-chart-3)" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartBar title="OS por filial" data={byBranch} color="var(--color-chart-4)" />
        <ChartBar
          title="OS por responsavel"
          data={byAssignee.map((item) => ({ name: item.name, total: item.total }))}
          color="var(--color-chart-5)"
        />
        <ChartSla title="SLA cumprido vs vencido" data={slaChartData} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">OS criticas</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Prioridade critica em acompanhamento.
          </p>
          <TicketList
            tickets={criticalTickets}
            emptyTitle="Sem OS criticas"
            emptyDescription="Nenhum chamado critico no momento."
          />
        </article>

        <article className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">OS vencidas</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Chamados que estouraram o prazo de SLA.
          </p>
          <TicketList
            tickets={overdueTickets}
            emptyTitle="Sem OS vencidas"
            emptyDescription="Nao existem chamados vencidos no momento."
          />
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">OS recentes</h3>
          <p className="text-xs text-muted-foreground mb-4">Ultimos chamados abertos no sistema.</p>
          <TicketList
            tickets={recentTickets}
            emptyTitle="Sem OS recentes"
            emptyDescription="Nao ha registros recentes para exibir."
          />
        </article>

        <article className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Responsaveis com mais OS</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Ranking por volume total de chamados atribuídos.
          </p>
          <div className="space-y-2">
            {topAssignees.length === 0 ? (
              <EmptyState
                compact
                title="Sem ranking"
                description="Atribua chamados para gerar ranking."
              />
            ) : (
              topAssignees.map((row, index) => (
                <div
                  key={`${row.id}-${index}`}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.total} OS</p>
                  </div>
                  <span className="text-sm font-semibold">#{index + 1}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Problemas recorrentes</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Padroes mais repetidos (endpoint real de recorrencia).
          </p>
          <div className="space-y-2">
            {recurringProblems.length === 0 ? (
              <EmptyState
                compact
                title="Sem recorrencia detectada"
                description="Nao houve padrao recorrente neste recorte."
              />
            ) : (
              recurringProblems.slice(0, 8).map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3 text-sm"
                >
                  <span className="capitalize">{item.label}</span>
                  <span className="font-semibold">{item.total}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Alertas de SLA</h3>
          <p className="text-xs text-muted-foreground mb-4">Proximos do vencimento e vencidos.</p>
          <div className="space-y-2">
            {mergedSlaAlerts.length === 0 ? (
              <EmptyState
                compact
                title="Sem alertas de SLA"
                description="Nenhum chamado em zona de alerta."
              />
            ) : (
              mergedSlaAlerts.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{ticket.protocol}</p>
                    <p className="text-sm text-muted-foreground">{ticket.title}</p>
                  </div>
                  <TicketSlaChip
                    createdAt={ticket.createdAt}
                    slaHours={ticket.slaHours}
                    closedAt={ticket.closedAt}
                  />
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function ChartBar({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ name: string; total: number }>;
  color: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="h-64 min-w-0 overflow-hidden">
        {data.length === 0 ? (
          <EmptyState
            compact
            title="Sem dados"
            description="Nao ha dados suficientes para montar este grafico."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill={color} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

function ChartSla({
  title,
  data,
}: {
  title: string;
  data: Array<{ name: string; total: number }>;
}) {
  const hasData = data.some((item) => item.total > 0);

  return (
    <article className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="h-64">
        {!hasData ? (
          <EmptyState
            compact
            title="Sem dados de SLA"
            description="Nao ha volume suficiente para o grafico de SLA."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="name" innerRadius={56} outerRadius={92}>
                <Cell fill="var(--color-success)" />
                <Cell fill="var(--color-destructive)" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

function TicketList({
  tickets,
  emptyTitle,
  emptyDescription,
}: {
  tickets: Ticket[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (tickets.length === 0) {
    return <EmptyState compact title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          to="/app/chamados/$id"
          params={{ id: ticket.id }}
          className="block rounded-xl border p-3 hover:bg-muted/10 transition cursor-pointer select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium font-mono text-xs text-primary">{ticket.protocol}</p>
              <p className="text-sm font-semibold mt-0.5">{ticket.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ticket.requesterName} - {formatDateTime(ticket.createdAt)}
              </p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="mt-2">
            <TicketSlaChip
              createdAt={ticket.createdAt}
              slaHours={ticket.slaHours}
              closedAt={ticket.closedAt}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
