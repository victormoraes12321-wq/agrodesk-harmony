import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, HardDriveDownload, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PRIORITY_LEVELS, STATUS_FLOW } from "@/app/constants";
import { AdminOnly } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import { usePageLoading } from "@/hooks/use-page-loading";
import { priorityLabel, statusLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import { settingsSchema } from "@/lib/validation";
import type { GlobalSettings, TicketPriority, TicketStatus } from "@/types";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configuracoes Globais | AgroDesk TI" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <SettingsPage />
    </AdminOnly>
  );
}

function SettingsPage() {
  const { settings, updateSettings } = useApp();
  const loading = usePageLoading(180);
  const [draft, setDraft] = useState<GlobalSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const togglePriority = (priority: TicketPriority) => {
    setDraft((prev) => {
      const exists = prev.priorities.includes(priority);
      return {
        ...prev,
        priorities: exists
          ? prev.priorities.filter((item) => item !== priority)
          : [...prev.priorities, priority],
      };
    });
  };

  const toggleStatus = (status: TicketStatus) => {
    setDraft((prev) => {
      const exists = prev.statuses.includes(status);
      return {
        ...prev,
        statuses: exists
          ? prev.statuses.filter((item) => item !== status)
          : [...prev.statuses, status],
      };
    });
  };

  const save = async () => {
    const validation = settingsSchema.safeParse({
      companyName: draft.companyName,
      logoText: draft.logoText,
      defaultSlaHours: draft.defaultSlaHours,
      uploadLimitMb: draft.uploadLimitMb,
      itContactEmail: draft.itContactEmail,
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Preencha os campos obrigatorios.");
      return;
    }

    try {
      await updateSettings(draft);
      toast.success("Configuracoes salvas");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar configuracoes.";
      toast.error(message);
    }
  };

  if (loading) return <PageLoading cards={0} rows={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracoes Globais"
        description="Definicoes gerais da plataforma: empresa, SLA, status, limites de upload e contatos da equipe de TI."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Identidade e operacao</CardTitle>
            <CardDescription>Dados base da empresa e parametros centrais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Nome da empresa</Label>
              <Input
                value={draft.companyName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, companyName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Logo (texto)</Label>
              <Input
                value={draft.logoText}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, logoText: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>SLA padrao (horas)</Label>
                <Input
                  type="number"
                  value={draft.defaultSlaHours}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      defaultSlaHours: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Limite upload (MB)</Label>
                <Input
                  type="number"
                  value={draft.uploadLimitMb}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      uploadLimitMb: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Aparencia visual</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.appearancePreset}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    appearancePreset: event.target.value as GlobalSettings["appearancePreset"],
                  }))
                }
              >
                <option value="agro">Agro</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Contato da TI</CardTitle>
            <CardDescription>Informacoes exibidas para solicitantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Nome contato TI</Label>
              <Input
                value={draft.itContactName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, itContactName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail TI</Label>
              <Input
                value={draft.itContactEmail}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, itContactEmail: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Telefone TI</Label>
              <Input
                value={draft.itContactPhone}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, itContactPhone: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Mensagem de backup/exportacao</Label>
              <Textarea
                value={draft.backupMessage}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, backupMessage: event.target.value }))
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Prioridades ativas</CardTitle>
            <CardDescription>
              Defina quais niveis estao habilitados para classificacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRIORITY_LEVELS.map((priority) => {
              const active = draft.priorities.includes(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => togglePriority(priority)}
                  className={`h-10 rounded-md border px-3 text-sm text-left transition ${
                    active
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-background hover:bg-muted/40"
                  }`}
                >
                  {priorityLabel[priority]}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Status ativos</CardTitle>
            <CardDescription>
              Controle os estados disponiveis no fluxo de atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {STATUS_FLOW.map((status) => {
              const active = draft.statuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={`h-10 rounded-md border px-3 text-sm text-left transition ${
                    active
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-background hover:bg-muted/40"
                  }`}
                >
                  {statusLabel[status]}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <section className="rounded-2xl border bg-card p-3 sm:p-4 grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3 sticky bottom-3 shadow-[var(--shadow-card)]">
        <Button onClick={() => void save()} className="w-full sm:w-auto">
          <Save className="size-4" /> Salvar configuracoes
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" asChild>
          <Link to="/app/relatorios">
            <Download className="size-4" /> Exportar CSV em relatorios
          </Link>
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="outline"
          onClick={() =>
            toast.info("Execute o backup do PostgreSQL no servidor conforme BACKUP_RESTORE.md.")
          }
        >
          <HardDriveDownload className="size-4" /> Orientacoes de backup
        </Button>
      </section>
    </div>
  );
}
