import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Download,
  MessageCircleHeart,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PRIORITY_LEVELS, STATUS_FLOW } from "@/app/constants";
import { AdminOnly } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { StatCard } from "@/components/ui/stat-card";
import { usePageLoading } from "@/hooks/use-page-loading";
import { statusLabel } from "@/lib/format";
import { getBranchName, getCategoryName, getDepartmentName, getUserName } from "@/lib/helpdesk";
import { useApp } from "@/lib/store";
import { getRecurringProblemsApi } from "@/services/helpdesk-api";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatorios | AgroDesk TI" }] }),
  component: ReportsRoute,
});

function ReportsRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <ReportsPage />
    </AdminOnly>
  );
}

function ReportsPage() {
  const { departments, branches, categories, users, refreshReports, reportsOverview } = useApp();
  const loading = usePageLoading(180);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [recurring, setRecurring] = useState<Array<{ label: string; total: number }>>([]);

  const [startDate, setStartDate] = useState(() => toDateInput(daysAgo(30)));
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [department, setDepartment] = useState("ALL");
  const [branch, setBranch] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [priority, setPriority] = useState<"ALL" | (typeof PRIORITY_LEVELS)[number]>("ALL");
  const [status, setStatus] = useState<"ALL" | (typeof STATUS_FLOW)[number]>("ALL");

  useEffect(() => {
    let mounted = true;

    if (startDate && endDate && startDate > endDate) {
      toast.error("A data inicial nao pode ser maior que a data final.");
      setReportsLoading(false);
      return () => {
        mounted = false;
      };
    }

    setReportsLoading(true);
    const query = {
      startDate: toStartOfDayIso(startDate),
      endDate: toEndOfDayIso(endDate),
      departmentId: department,
      branchId: branch,
      categoryId: category,
      assigneeId: assignee,
      priority,
      status,
    } as const;

    Promise.all([refreshReports(query), getRecurringProblemsApi(query)])
      .then(([, recurringData]) => {
        if (!mounted) return;
        setRecurring(recurringData);
      })
      .finally(() => {
        if (mounted) setReportsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [
    assignee,
    branch,
    category,
    department,
    endDate,
    priority,
    refreshReports,
    startDate,
    status,
  ]);

  const overview = reportsOverview;

  const compliance = useMemo(() => overview?.sla ?? { inSla: 0, overdue: 0 }, [overview]);
  const avgTime = useMemo(() => (overview?.avgResolutionMinutes ?? 0) / 60, [overview]);
  const avgSat = useMemo(() => overview?.ratings.average ?? 0, [overview]);

  const byDepartment = useMemo(() => {
    return (overview?.byDepartment ?? []).map((row) => ({
      name: getDepartmentName(departments, row.key === "NAO_INFORMADO" ? undefined : row.key),
      total: row.total,
    }));
  }, [departments, overview?.byDepartment]);

  const byBranch = useMemo(() => {
    return (overview?.byBranch ?? []).map((row) => ({
      name: getBranchName(branches, row.key === "NAO_INFORMADO" ? undefined : row.key),
      total: row.total,
    }));
  }, [branches, overview?.byBranch]);

  const byCategory = useMemo(() => {
    return (overview?.byCategory ?? []).map((row) => ({
      name: getCategoryName(categories, row.key === "NAO_INFORMADO" ? undefined : row.key),
      total: row.total,
    }));
  }, [categories, overview?.byCategory]);

  const byAssignee = useMemo(() => {
    return (overview?.byAssignee ?? []).map((row) => ({
      name: getUserName(users, row.key === "SEM_RESPONSAVEL" ? undefined : row.key),
      total: row.total,
    }));
  }, [overview?.byAssignee, users]);

  const byPriority = useMemo(() => {
    return PRIORITY_LEVELS.map((item) => ({
      name: item,
      total: overview?.byPriority.find((row) => row.key === item)?.total ?? 0,
    }));
  }, [overview?.byPriority]);

  const byStatus = useMemo(() => {
    return STATUS_FLOW.map((item) => ({
      name: statusLabel[item],
      total: overview?.byStatus.find((row) => row.key === item)?.total ?? 0,
    }));
  }, [overview?.byStatus]);

  const byDay = useMemo(() => {
    return (overview?.byPeriod ?? []).map((row) => ({
      day: row.key,
      total: row.total,
    }));
  }, [overview?.byPeriod]);

  const applyQuickRange = (days: number) => {
    setStartDate(toDateInput(daysAgo(days)));
    setEndDate(toDateInput(new Date()));
  };

  const exportCsv = () => {
    if (!overview) return;

    const rows: string[][] = [];
    rows.push(["Relatorio AgroDesk TI"]);
    rows.push(["Gerado em", new Date().toLocaleString("pt-BR")]);
    rows.push(["Data inicial", startDate || "-"]);
    rows.push(["Data final", endDate || "-"]);
    rows.push([
      "Setor",
      department === "ALL" ? "Todos" : getDepartmentName(departments, department),
    ]);
    rows.push(["Filial", branch === "ALL" ? "Todas" : getBranchName(branches, branch)]);
    rows.push(["Categoria", category === "ALL" ? "Todas" : getCategoryName(categories, category)]);
    rows.push(["Responsavel", assignee === "ALL" ? "Todos" : getUserName(users, assignee)]);
    rows.push(["Prioridade", priority === "ALL" ? "Todas" : priority]);
    rows.push(["Status", status === "ALL" ? "Todos" : statusLabel[status]]);
    rows.push([]);
    rows.push(["Indicador", "Valor"]);
    rows.push(["OS no periodo", String(overview.totalTickets)]);
    rows.push(["SLA cumprido", String(compliance.inSla)]);
    rows.push(["SLA vencido", String(compliance.overdue)]);
    rows.push(["Tempo medio (h)", avgTime.toFixed(2)]);
    rows.push(["Satisfacao media", avgSat.toFixed(2)]);
    rows.push([]);

    appendSection(
      rows,
      "OS por periodo",
      byDay.map((item) => [item.day, String(item.total)]),
    );
    appendSection(
      rows,
      "OS por setor",
      byDepartment.map((item) => [item.name, String(item.total)]),
    );
    appendSection(
      rows,
      "OS por filial",
      byBranch.map((item) => [item.name, String(item.total)]),
    );
    appendSection(
      rows,
      "OS por categoria",
      byCategory.map((item) => [item.name, String(item.total)]),
    );
    appendSection(
      rows,
      "OS por responsavel",
      byAssignee.map((item) => [item.name, String(item.total)]),
    );
    appendSection(
      rows,
      "OS por prioridade",
      byPriority.map((item) => [item.name, String(item.total)]),
    );
    appendSection(
      rows,
      "OS por status",
      byStatus.map((item) => [item.name, String(item.total)]),
    );
    appendSection(
      rows,
      "Problemas recorrentes",
      recurring.map((item) => [item.label, String(item.total)]),
    );
    appendSection(
      rows,
      "Avaliacoes",
      overview.ratings.items.map((item) => [
        item.ticketId.slice(0, 8),
        String(item.score),
        item.comment ?? "",
      ]),
      ["Ticket", "Nota", "Comentario"],
    );

    const csv = rows.map((line) => line.map(csvEscape).join(";")).join("\n");
    const filename = `agrodesk-relatorio-${startDate || "inicio"}-${endDate || "fim"}.csv`;
    downloadCsv(filename, csv);
    toast.success("CSV exportado com sucesso.");
  };

  if (loading || reportsLoading || !overview) return <PageLoading cards={5} rows={7} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatorios"
        description="Analise operacional por periodo, setor, filial, categoria, responsavel, prioridade, status, SLA e avaliacao."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Exportar CSV
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card p-4 lg:p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(7)}>
            Ultimos 7 dias
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(30)}>
            Ultimos 30 dias
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(90)}>
            Ultimos 90 dias
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Historico completo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-3">
          <FieldInput
            icon={CalendarDays}
            label="Data inicial"
            value={startDate}
            type="date"
            onChange={setStartDate}
          />
          <FieldInput
            icon={CalendarDays}
            label="Data final"
            value={endDate}
            type="date"
            onChange={setEndDate}
          />

          <FieldSelect
            label="Setor"
            value={department}
            onChange={setDepartment}
            options={[
              { value: "ALL", label: "Todos" },
              ...departments.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />

          <FieldSelect
            label="Filial"
            value={branch}
            onChange={setBranch}
            options={[
              { value: "ALL", label: "Todas" },
              ...branches.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />

          <FieldSelect
            label="Categoria"
            value={category}
            onChange={setCategory}
            options={[
              { value: "ALL", label: "Todas" },
              ...categories.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />

          <FieldSelect
            label="Responsavel"
            value={assignee}
            onChange={setAssignee}
            options={[
              { value: "ALL", label: "Todos" },
              ...users
                .filter((item) => item.role === "TI_ADMIN")
                .map((item) => ({ value: item.id, label: item.name })),
            ]}
          />

          <FieldSelect
            label="Prioridade"
            value={priority}
            onChange={(value) => setPriority(value as "ALL" | (typeof PRIORITY_LEVELS)[number])}
            options={[
              { value: "ALL", label: "Todas" },
              ...PRIORITY_LEVELS.map((item) => ({ value: item, label: item })),
            ]}
          />

          <FieldSelect
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as "ALL" | (typeof STATUS_FLOW)[number])}
            options={[
              { value: "ALL", label: "Todos" },
              ...STATUS_FLOW.map((item) => ({ value: item, label: statusLabel[item] })),
            ]}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="OS no periodo"
          value={overview.totalTickets}
          icon={BarChart3}
          tone="primary"
        />
        <StatCard label="SLA cumprido" value={compliance.inSla} icon={ShieldCheck} tone="success" />
        <StatCard label="SLA vencido" value={compliance.overdue} icon={ShieldAlert} tone="danger" />
        <StatCard label="Tempo medio" value={`${avgTime.toFixed(1)}h`} icon={Clock3} tone="info" />
        <StatCard
          label="Satisfacao media"
          value={avgSat ? avgSat.toFixed(1) : "-"}
          icon={MessageCircleHeart}
          tone="success"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-2">OS por periodo</h3>
          <div className="h-64">
            {byDay.length === 0 ? (
              <EmptyState
                compact
                title="Sem dados para o periodo"
                description="Ajuste os filtros de data para exibir evolucao."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-2">SLA cumprido vs vencido</h3>
          <div className="h-64">
            {overview.totalTickets === 0 ? (
              <EmptyState
                compact
                title="Sem dados de SLA"
                description="Sem chamados para calcular SLA no recorte aplicado."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Cumprido", value: compliance.inSla },
                      { name: "Vencido", value: compliance.overdue },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                  >
                    <Cell fill="var(--color-success)" />
                    <Cell fill="var(--color-destructive)" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartPanel title="OS por setor" data={byDepartment} color="var(--color-chart-1)" />
        <ChartPanel title="OS por filial" data={byBranch} color="var(--color-chart-2)" />
        <ChartPanel title="OS por categoria" data={byCategory} color="var(--color-chart-3)" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartPanel title="OS por responsavel" data={byAssignee} color="var(--color-chart-4)" />
        <ChartPanel title="OS por prioridade" data={byPriority} color="var(--color-chart-5)" />
        <ChartPanel title="OS por status" data={byStatus} color="var(--color-primary)" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-2">Avaliacoes</h3>
          <p className="text-sm text-muted-foreground">
            Satisfacao media: <strong>{avgSat ? avgSat.toFixed(1) : "-"}</strong> de 5
          </p>
          <div className="mt-4 space-y-2">
            {overview.ratings.items.length === 0 ? (
              <EmptyState
                compact
                title="Sem avaliacoes no recorte"
                description="As avaliacoes aparecerao quando houver chamados finalizados com nota."
              />
            ) : (
              overview.ratings.items.slice(0, 8).map((item) => (
                <div key={item.ticketId} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">
                    Ticket {item.ticketId.slice(0, 8)} - nota {item.score}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.comment || "Sem comentario"}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-2">Problemas recorrentes</h3>
          <div className="space-y-2">
            {recurring.length === 0 ? (
              <EmptyState
                compact
                title="Sem recorrencia relevante"
                description="Nenhum padrao recorrente detectado neste periodo."
              />
            ) : (
              recurring.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border p-3 flex items-center justify-between text-sm"
                >
                  <span className="capitalize">{item.label}</span>
                  <span className="font-semibold">{item.total} ocorrencias</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function ChartPanel({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ name: string; total: number }>;
  color: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="h-60 min-w-0 overflow-hidden">
        {data.length === 0 ? (
          <EmptyState
            compact
            title="Sem dados"
            description="Nao ha dados suficientes para este grafico."
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

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldInput({
  icon: Icon,
  label,
  value,
  type,
  onChange,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  type: "date";
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={type}
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function toDateInput(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toStartOfDayIso(value: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function toEndOfDayIso(value: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function csvEscape(value: string): string {
  const normalized = value ?? "";
  if (normalized.includes(";") || normalized.includes("\n") || normalized.includes('"')) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function appendSection(
  rows: string[][],
  title: string,
  data: string[][],
  headers: string[] = ["Item", "Total"],
) {
  rows.push([]);
  rows.push([title]);
  rows.push(headers);
  data.forEach((row) => rows.push(row));
}

function downloadCsv(filename: string, content: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
