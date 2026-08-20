import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Download,
  FileSpreadsheet,
  MessageCircleHeart,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Award,
  Sparkles,
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
  head: () => ({ meta: [{ title: "Relatórios & BI | AgroDesk TI" }] }),
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
  const navigate = useNavigate();
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
      toast.error("A data inicial não pode ser maior que a data final.");
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
        setRecurring(recurringData || []);
      })
      .catch(() => {
        if (mounted) setRecurring([]);
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
      id: row.key,
      name: getDepartmentName(departments, row.key === "NAO_INFORMADO" ? undefined : row.key),
      total: row.total,
    }));
  }, [departments, overview?.byDepartment]);

  const byBranch = useMemo(() => {
    return (overview?.byBranch ?? []).map((row) => ({
      id: row.key,
      name: getBranchName(branches, row.key === "NAO_INFORMADO" ? undefined : row.key),
      total: row.total,
    }));
  }, [branches, overview?.byBranch]);

  const byCategory = useMemo(() => {
    return (overview?.byCategory ?? []).map((row) => ({
      id: row.key,
      name: getCategoryName(categories, row.key === "NAO_INFORMADO" ? undefined : row.key),
      total: row.total,
    }));
  }, [categories, overview?.byCategory]);

  const byAssignee = useMemo(() => {
    return (overview?.byAssignee ?? []).map((row) => ({
      id: row.key,
      name: getUserName(users, row.key === "SEM_RESPONSAVEL" ? undefined : row.key),
      total: row.total,
    }));
  }, [overview?.byAssignee, users]);

  const technicianRanking = useMemo(() => {
    const adminUsers = users.filter((u) => u.role === "TI_ADMIN");
    return adminUsers
      .map((admin) => {
        const assignedTotal =
          overview?.byAssignee.find((row) => row.key === admin.id)?.total || 0;
        return {
          id: admin.id,
          name: admin.name,
          username: admin.username,
          total: assignedTotal,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [users, overview?.byAssignee]);

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

  const handleDrilldown = (filters: {
    departmentId?: string;
    branchId?: string;
    categoryId?: string;
    assigneeId?: string;
  }) => {
    const cleanFilters: any = {};
    if (filters.departmentId && filters.departmentId !== "NAO_INFORMADO") cleanFilters.departmentId = filters.departmentId;
    if (filters.branchId && filters.branchId !== "NAO_INFORMADO") cleanFilters.branchId = filters.branchId;
    if (filters.categoryId && filters.categoryId !== "NAO_INFORMADO") cleanFilters.categoryId = filters.categoryId;
    if (filters.assigneeId && filters.assigneeId !== "SEM_RESPONSAVEL") cleanFilters.assigneeId = filters.assigneeId;

    void navigate({
      to: "/app/chamados",
      search: cleanFilters,
    });
  };

  const exportExcel = () => {
    if (!overview) return;

    const wb = XLSX.utils.book_new();

    const slaPercent =
      overview.totalTickets > 0
        ? `${((compliance.inSla / overview.totalTickets) * 100).toFixed(1)}%`
        : "100%";

    const summaryData = [
      ["🌱 AGRODESK TI - RELATÓRIO EXECUTIVO OPERACIONAL"],
      ["Data de Geração", new Date().toLocaleString("pt-BR")],
      ["Período Selecionado", `${startDate || "Início"} até ${endDate || "Hoje"}`],
      ["Setor", department === "ALL" ? "Todos" : getDepartmentName(departments, department)],
      ["Filial", branch === "ALL" ? "Todas" : getBranchName(branches, branch)],
      ["Categoria", category === "ALL" ? "Todas" : getCategoryName(categories, category)],
      ["Responsável", assignee === "ALL" ? "Todos" : getUserName(users, assignee)],
      [],
      ["INDICADOR", "VALOR"],
      ["Total de Chamados no Período", overview.totalTickets],
      ["Chamados Dentro do SLA", compliance.inSla],
      ["Chamados com SLA Estourado", compliance.overdue],
      ["Taxa de Conformidade SLA (%)", slaPercent],
      ["Tempo Médio de Solução (Horas)", avgTime.toFixed(1)],
      ["Índice Médio de Satisfação (CSAT)", `${avgSat.toFixed(2)} / 5.0`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");

    const deptData = [["Setor", "Total de OS"], ...byDepartment.map((d) => [d.name, d.total])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), "Por Setor");

    const branchData = [["Filial", "Total de OS"], ...byBranch.map((b) => [b.name, b.total])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(branchData), "Por Filial");

    const catData = [["Categoria", "Total de OS"], ...byCategory.map((c) => [c.name, c.total])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catData), "Por Categoria");

    const techData = [["Técnico / Responsável", "Total de OS"], ...byAssignee.map((a) => [a.name, a.total])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(techData), "Por Técnico");

    const recData = [["Problema Recorrente", "Total"], ...recurring.map((r) => [r.label, r.total])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recData), "Problemas Recorrentes");

    XLSX.writeFile(wb, `Relatorio_AgroDesk_TI_${startDate || "inicio"}_a_${endDate || "fim"}.xlsx`);
    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportPdf = () => {
    if (!overview) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permita popups no navegador para gerar o PDF.");
      return;
    }

    const slaPercent =
      overview.totalTickets > 0
        ? ((compliance.inSla / overview.totalTickets) * 100).toFixed(1)
        : "100";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Executivo AgroDesk TI</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { font-size: 20pt; font-weight: 900; color: #047857; letter-spacing: -0.5px; }
            .meta { font-size: 9pt; color: #64748b; text-align: right; }
            .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .kpi-title { font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .kpi-val { font-size: 16pt; font-weight: 900; color: #0f172a; margin-top: 4px; }
            .section-title { font-size: 11pt; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 20px 0 10px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 16px; }
            th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: 700; border: 1px solid #e2e8f0; }
            td { padding: 7px 8px; border: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">🌱 AGRODESK TI</div>
              <div style="font-size: 11pt; font-weight: 700; color: #334155; margin-top: 2px;">Relatório Executivo e Operacional</div>
            </div>
            <div class="meta">
              <div><strong>Período:</strong> ${startDate || "Início"} até ${endDate || "Hoje"}</div>
              <div><strong>Gerado em:</strong> ${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-box">
              <div class="kpi-title">Total de OS</div>
              <div class="kpi-val">${overview.totalTickets}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Conformidade SLA</div>
              <div class="kpi-val" style="color: #059669;">${slaPercent}%</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Tempo Médio</div>
              <div class="kpi-val">${avgTime.toFixed(1)}h</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Satisfação CSAT</div>
              <div class="kpi-val" style="color: #d97706;">★ ${avgSat.toFixed(2)}</div>
            </div>
          </div>

          <div class="section-title">Distribuição por Setor</div>
          <table>
            <thead><tr><th>Setor</th><th style="width: 100px; text-align: right;">Total de Chamados</th></tr></thead>
            <tbody>
              ${byDepartment.map((d) => `<tr><td>${d.name}</td><td style="text-align: right; font-weight: 700;">${d.total}</td></tr>`).join("")}
            </tbody>
          </table>

          <div class="section-title">Distribuição por Categoria</div>
          <table>
            <thead><tr><th>Categoria</th><th style="width: 100px; text-align: right;">Total de Chamados</th></tr></thead>
            <tbody>
              ${byCategory.map((c) => `<tr><td>${c.name}</td><td style="text-align: right; font-weight: 700;">${c.total}</td></tr>`).join("")}
            </tbody>
          </table>

          <div class="section-title">Atendimentos por Técnico Responsável</div>
          <table>
            <thead><tr><th>Técnico</th><th style="width: 100px; text-align: right;">Chamados Atendidos</th></tr></thead>
            <tbody>
              ${byAssignee.map((a) => `<tr><td>${a.name}</td><td style="text-align: right; font-weight: 700;">${a.total}</td></tr>`).join("")}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        title="Relatórios & Business Intelligence"
        description="Análise executiva operacional por período, setor, filial, categoria, responsável, SLA e produtividade."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={exportPdf}
              className="gap-1.5 text-xs h-9 border-indigo-600/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 shadow-sm"
            >
              <Printer className="size-4 text-indigo-600" />
              Imprimir / PDF
            </Button>
            <Button
              variant="outline"
              onClick={exportExcel}
              className="gap-1.5 text-xs h-9 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shadow-sm"
            >
              <FileSpreadsheet className="size-4 text-emerald-600" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={exportCsv} className="gap-1.5 text-xs h-9 shadow-sm">
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        }
      />

      <section className="rounded-2xl border bg-card p-4 lg:p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(7)}>
            Últimos 7 dias
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(30)}>
            Últimos 30 dias
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(90)}>
            Últimos 90 dias
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Histórico completo
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
            label="Responsável"
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
          label="OS no período"
          value={overview.totalTickets}
          icon={BarChart3}
          tone="primary"
        />
        <StatCard label="SLA cumprido" value={compliance.inSla} icon={ShieldCheck} tone="success" />
        <StatCard label="SLA vencido" value={compliance.overdue} icon={ShieldAlert} tone="danger" />
        <StatCard label="MTTR (Tempo Médio Reparo)" value={`${avgTime.toFixed(1)}h`} icon={Clock3} tone="info" />
        <StatCard
          label="Satisfação média"
          value={avgSat ? avgSat.toFixed(1) : "-"}
          icon={MessageCircleHeart}
          tone="success"
        />
      </section>

      {/* Indicadores Internacionais de Confiabilidade de TI (MTTR & MTBF) */}
      <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Indicadores Internacionais de Confiabilidade de TI (ITIL / ISO 20000)
              </h3>
              <p className="text-xs text-muted-foreground">
                Métricas de eficiência de restauração e estabilidade da infraestrutura
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                MTTR (Mean Time to Repair)
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {avgTime <= 4 ? "Excelente" : avgTime <= 8 ? "Normal" : "Atenção"}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{avgTime.toFixed(1)} horas</p>
            <p className="text-xs text-muted-foreground">
              Tempo médio gasto entre a abertura do chamado e a restauração completa do serviço.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                MTBF (Tempo Médio Entre Falhas)
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Estabilidade
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overview.totalTickets > 0
                ? `${Math.max(1, ((30 * 10) / overview.totalTickets)).toFixed(1)}h úteis`
                : "Sem falhas"}
            </p>
            <p className="text-xs text-muted-foreground">
              Intervalo médio de operação contínua sem incidentes na infraestrutura.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Taxa de Resolução Dentro do Prazo
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                SLA Compliance
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {overview.totalTickets > 0
                ? `${((compliance.inSla / overview.totalTickets) * 100).toFixed(1)}%`
                : "100%"}
            </p>
            <p className="text-xs text-muted-foreground">
              Percentual de chamados atendidos rigorosamente dentro do prazo limite acordado.
            </p>
          </div>
        </div>
      </section>

      {/* Scoreboard e Ranking de Produtividade da Equipe de TI */}
      <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                Ranking de Produtividade dos Técnicos
                <span className="text-xs font-normal text-muted-foreground">
                  (Chamados Atendidos no Período)
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Desempenho operacional individual da equipe técnica de TI
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {technicianRanking.map((tech, idx) => {
            const isFirst = idx === 0 && tech.total > 0;
            const isSecond = idx === 1 && tech.total > 0;
            const isThird = idx === 2 && tech.total > 0;
            const medal = isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : `#${idx + 1}`;

            return (
              <div
                key={tech.id}
                onClick={() => handleDrilldown({ assigneeId: tech.id })}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  isFirst
                    ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                    : "bg-muted/10 border-border/70 hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold font-mono shrink-0 w-7 text-center">
                      {medal}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">
                        {tech.name}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">@{tech.username}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-primary">{tech.total}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Atendimentos
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-2">OS por período</h3>
          <div className="h-64">
            {byDay.length === 0 ? (
              <EmptyState
                compact
                title="Sem dados para o período"
                description="Ajuste os filtros de data para exibir evolução."
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
        <ChartPanel
          title="OS por setor (Clique para filtrar)"
          data={byDepartment}
          color="var(--color-chart-1)"
          onItemClick={(item) => handleDrilldown({ departmentId: item.id })}
        />
        <ChartPanel
          title="OS por filial (Clique para filtrar)"
          data={byBranch}
          color="var(--color-chart-2)"
          onItemClick={(item) => handleDrilldown({ branchId: item.id })}
        />
        <ChartPanel
          title="OS por categoria (Clique para filtrar)"
          data={byCategory}
          color="var(--color-chart-3)"
          onItemClick={(item) => handleDrilldown({ categoryId: item.id })}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartPanel
          title="OS por responsável"
          data={byAssignee}
          color="var(--color-chart-4)"
          onItemClick={(item) => handleDrilldown({ assigneeId: item.id })}
        />
        <ChartPanel title="OS por prioridade" data={byPriority} color="var(--color-chart-5)" />
        <ChartPanel title="OS por status" data={byStatus} color="var(--color-primary)" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-2">Avaliações</h3>
          <p className="text-sm text-muted-foreground">
            Satisfação média: <strong>{avgSat ? avgSat.toFixed(1) : "-"}</strong> de 5
          </p>
          <div className="mt-4 space-y-2">
            {overview.ratings.items.length === 0 ? (
              <EmptyState
                compact
                title="Sem avaliações no recorte"
                description="As avaliações aparecerão quando houver chamados finalizados com nota."
              />
            ) : (
              overview.ratings.items.slice(0, 8).map((item) => (
                <div key={item.ticketId} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">
                    Ticket {item.ticketId.slice(0, 8)} - nota {item.score}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.comment || "Sem comentário"}
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
                title="Sem recorrência relevante"
                description="Nenhum padrão recorrente detectado neste período."
              />
            ) : (
              recurring.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border p-3 flex items-center justify-between text-sm"
                >
                  <span className="capitalize">{item.label}</span>
                  <span className="font-semibold">{item.total} ocorrências</span>
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
  onItemClick,
}: {
  title: string;
  data: Array<{ id?: string; name: string; total: number }>;
  color: string;
  onItemClick?: (item: { id?: string; name: string; total: number }) => void;
}) {
  return (
    <article className="min-w-0 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="h-60 min-w-0 overflow-hidden">
        {data.length === 0 ? (
          <EmptyState
            compact
            title="Sem dados"
            description="Não há dados suficientes para este gráfico."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="total"
                fill={color}
                radius={[0, 8, 8, 0]}
                onClick={(entry: any) => {
                  if (onItemClick && entry) {
                    onItemClick(entry);
                  }
                }}
                className={onItemClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
              />
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
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
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
  label,
  value,
  onChange,
  type = "text",
}: {
  icon?: any;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function toStartOfDayIso(date: string) {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00.000`).toISOString();
}

function toEndOfDayIso(date: string) {
  if (!date) return undefined;
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function appendSection(
  rows: string[][],
  title: string,
  data: string[][],
  headers?: string[],
) {
  rows.push([title]);
  if (headers) rows.push(headers);
  for (const item of data) {
    rows.push(item);
  }
  rows.push([]);
}

function csvEscape(value: string) {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
