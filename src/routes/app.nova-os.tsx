import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock3, FileImage, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getAssets } from "@/services/patrimonio-api";

import { PRIORITY_LEVELS } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import { usePageLoading } from "@/hooks/use-page-loading";
import { priorityLabel, statusLabel } from "@/lib/format";
import { formatBranchName } from "@/lib/helpdesk";
import { useApp } from "@/lib/store";
import { newTicketSchema } from "@/lib/validation";
import type { Ticket } from "@/types";

export const Route = createFileRoute("/app/nova-os")({
  head: () => ({ meta: [{ title: "Nova OS | AgroDesk TI" }] }),
  component: NewTicketPage,
});

type FormData = {
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  departmentId: string;
  branchId: string;
  title: string;
  categoryId: string;
  subcategoryId: string;
  suggestedPriority: "" | "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  equipment: string;
  assetTag: string;
  bestTime: string;
  impact: string;
  description: string;
  additionalNotes: string;
  assetId: string;
};

const STEP_TITLES = [
  "Como podemos falar com voce?",
  "Onde esta acontecendo?",
  "O que esta acontecendo?",
  "Tem print ou imagem?",
  "Revisao e envio",
] as const;

function NewTicketPage() {
  const { currentUser, departments, branches, categories, createTicket } = useApp();
  const loading = usePageLoading();
  const [step, setStep] = useState(1);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [createdProtocol, setCreatedProtocol] = useState<string | null>(null);
  const [createdStatus, setCreatedStatus] = useState<Ticket["status"] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const initialData = useMemo<FormData>(
    () => ({
      requesterName: currentUser?.name ?? "",
      requesterPhone: currentUser?.phone ?? "",
      requesterEmail: currentUser?.email ?? "",
      departmentId: currentUser?.departmentId ?? departments[0]?.id ?? "",
      branchId: currentUser?.branchId ?? branches[0]?.id ?? "",
      title: "",
      categoryId: "",
      subcategoryId: "",
      suggestedPriority: "",
      equipment: "",
      assetTag: "",
      bestTime: "",
      impact: "",
      description: "",
      additionalNotes: "",
      assetId: "",
    }),
    [currentUser, departments, branches],
  );

  const [form, setForm] = useState<FormData>(initialData);
  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];
  const { data: assets } = useQuery({ queryKey: ["assets"], queryFn: () => getAssets() });

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  if (!currentUser) return <Navigate to="/login" />;

  const canContinue = () => {
    if (step === 1) {
      return form.requesterName.trim().length > 2 && form.requesterPhone.trim().length > 5;
    }

    if (step === 2) {
      return form.departmentId.length > 0 && form.branchId.length > 0;
    }

    if (step === 3) {
      return form.description.trim().length >= 10;
    }

    return true;
  };

  const onSubmit = async () => {
    if (submitting) return;

    const validation = newTicketSchema.safeParse({
      requesterName: form.requesterName,
      requesterPhone: form.requesterPhone,
      requesterEmail: form.requesterEmail,
      departmentId: form.departmentId,
      branchId: form.branchId,
      description: form.description,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Preencha os campos obrigatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket(
        {
          title: form.title,
          description: form.description,
          requesterId: currentUser.id,
          requesterName: form.requesterName,
          requesterPhone: form.requesterPhone,
          requesterEmail: form.requesterEmail,
          departmentId: form.departmentId,
          branchId: form.branchId,
          categoryId: form.categoryId || undefined,
          subcategoryId: form.subcategoryId || undefined,
          suggestedPriority: form.suggestedPriority || undefined,
          equipment: form.equipment || undefined,
          assetTag: form.assetTag || undefined,
          assetId: form.assetId || undefined,
          bestTime: form.bestTime || undefined,
          impact: form.impact || undefined,
          additionalNotes: form.additionalNotes || undefined,
        },
        files,
      );

      setCreatedTicketId(ticket.id);
      setCreatedProtocol(ticket.protocol);
      setCreatedStatus(ticket.status);
      toast.success("OS registrada com sucesso", { description: `Protocolo ${ticket.protocol}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel abrir a OS.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading cards={0} rows={7} />;

  if (createdTicketId && createdProtocol && createdStatus) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-success/30 shadow-[var(--shadow-card)]">
          <CardContent className="p-8 text-center">
            <div className="size-14 rounded-2xl bg-success/10 text-success grid place-items-center mx-auto">
              <CheckCircle2 className="size-7" />
            </div>
            <h1 className="text-2xl font-semibold mt-5">OS enviada com sucesso</h1>
            <p className="text-sm text-muted-foreground mt-2">Seu protocolo de atendimento:</p>
            <p className="text-3xl font-semibold tracking-tight mt-1">{createdProtocol}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <Circle className="size-3 fill-current" />
              Status inicial: <strong>{statusLabel[createdStatus]}</strong>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/app/chamados/$id" params={{ id: createdTicketId }}>
                  Acompanhar OS
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/meus-chamados">Ir para meus chamados</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abertura de OS"
        description="Abra sua solicitacao em etapas simples. Obrigatorio apenas: nome, telefone, setor, filial/local e descricao do problema."
      />

      <Card className="shadow-[var(--shadow-card)] border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Modo rapido de abertura</p>
            <p className="text-xs text-muted-foreground">
              Preencha os campos essenciais e conclua em menos de 1 minuto.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
            <Clock3 className="size-3.5" /> Tempo medio: 45s
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border bg-card p-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / STEP_TITLES.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STEP_TITLES.map((title, index) => {
            const stepNumber = index + 1;
            const active = step === stepNumber;
            const done = step > stepNumber;
            return (
              <div key={title} className="rounded-xl border px-3 py-2 bg-background min-w-52">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`size-5 rounded-full grid place-items-center font-medium ${
                      done
                        ? "bg-success text-white"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stepNumber}
                  </span>
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>
                    {title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>{STEP_TITLES[step - 1]}</CardTitle>
          <CardDescription>
            Etapa {step} de {STEP_TITLES.length}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Esses dados ja vieram do seu perfil. Se precisar, voce pode ajustar agora.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do solicitante *</Label>
                  <Input
                    value={form.requesterName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, requesterName: event.target.value }))
                    }
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input
                    value={form.requesterPhone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, requesterPhone: event.target.value }))
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-mail (opcional)</Label>
                <Input
                  type="email"
                  value={form.requesterEmail}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, requesterEmail: event.target.value }))
                  }
                  placeholder="seuemail@empresa.com"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Selecione onde esta acontecendo para a equipe de TI chegar no lugar certo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Setor *</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.departmentId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, departmentId: event.target.value }))
                    }
                  >
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Filial/local *</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.branchId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, branchId: event.target.value }))
                    }
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {formatBranchName(branch.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>O que esta acontecendo? *</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={6}
                  placeholder="Descreva o problema de forma simples. Ex: impressora nao imprime no caixa 2."
                />
              </div>

              <div className="space-y-2">
                <Label>Titulo (opcional)</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Resumo curto do chamado"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label>Tem print ou imagem? (opcional)</Label>
                <Input
                  type="file"
                  multiple
                  disabled={submitting}
                  onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                />
                {files.length > 0 && (
                  <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                    {files.map((file) => (
                      <div key={file.name} className="text-sm flex items-center gap-2">
                        <FileImage className="size-4 text-muted-foreground" />
                        {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4 bg-muted/20 space-y-4">
                <p className="text-sm font-medium">Detalhes opcionais</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          categoryId: event.target.value,
                          subcategoryId: "",
                        }))
                      }
                    >
                      <option value="">Nao informado</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subcategoria</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.subcategoryId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, subcategoryId: event.target.value }))
                      }
                      disabled={subcategories.length === 0}
                    >
                      <option value="">Nao informado</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade sugerida</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.suggestedPriority}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          suggestedPriority: event.target.value as FormData["suggestedPriority"],
                        }))
                      }
                    >
                      <option value="">Nao informado</option>
                      {PRIORITY_LEVELS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priorityLabel[priority]}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      A prioridade real e definida pela equipe TI_ADMIN.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Equipamento (opcional)</Label>
                    <Input
                      value={form.equipment}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, equipment: event.target.value }))
                      }
                      placeholder="Ex: Notebook Dell"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ativo Patrimonial (opcional)</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.assetId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, assetId: event.target.value }))
                      }
                    >
                      <option value="">Nao selecionar</option>
                      {assets?.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.code} - {asset.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Vincule ao inventario da empresa.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Patrimonio/numero de serie</Label>
                  <Input
                    value={form.assetTag}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, assetTag: event.target.value }))
                    }
                    placeholder="Ex: PAT-00982"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Melhor horario</Label>
                    <Input
                      value={form.bestTime}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, bestTime: event.target.value }))
                      }
                      placeholder="Ex: 08:00 as 11:00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Impacto no trabalho</Label>
                    <Input
                      value={form.impact}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, impact: event.target.value }))
                      }
                      placeholder="Ex: nao consigo emitir nota"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observacoes adicionais</Label>
                  <Textarea
                    value={form.additionalNotes}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, additionalNotes: event.target.value }))
                    }
                    placeholder="Alguma informacao extra que ajude no atendimento"
                  />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-2xl border p-4 bg-muted/20">
                <h3 className="font-medium">Revisao da solicitacao</h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p>
                    <strong>Solicitante:</strong> {form.requesterName}
                  </p>
                  <p>
                    <strong>Telefone:</strong> {form.requesterPhone}
                  </p>
                  <p>
                    <strong>Setor:</strong>{" "}
                    {departments.find((item) => item.id === form.departmentId)?.name}
                  </p>
                  <p>
                    <strong>Filial/local:</strong>{" "}
                    {formatBranchName(
                      branches.find((item) => item.id === form.branchId)?.name ?? "Nao informado",
                    )}
                  </p>
                  <p>
                    <strong>Categoria:</strong>{" "}
                    {categories.find((item) => item.id === form.categoryId)?.name ??
                      "Nao informado"}
                  </p>
                  <p>
                    <strong>Prioridade sugerida:</strong>{" "}
                    {form.suggestedPriority
                      ? priorityLabel[form.suggestedPriority]
                      : "Nao informado"}
                  </p>
                  <p className="md:col-span-2">
                    <strong>Descricao:</strong> {form.description}
                  </p>
                  {form.additionalNotes && (
                    <p className="md:col-span-2">
                      <strong>Observacoes:</strong> {form.additionalNotes}
                    </p>
                  )}
                  <p className="md:col-span-2">
                    <strong>Anexos:</strong>{" "}
                    {files.length > 0 ? `${files.length} arquivo(s)` : "Nenhum"}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Responsavel, prioridade real, diagnostico e status administrativo sao definidos
                apenas pela equipe TI_ADMIN.
              </p>
            </div>
          )}

          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-between gap-2 sm:gap-3 sticky bottom-0 bg-card pb-1">
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              disabled={step === 1 || submitting}
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            >
              <ArrowLeft className="size-4" /> Voltar
            </Button>

            <div className="grid grid-cols-1 sm:flex gap-2">
              {step === 4 && (
                <Button
                  className="w-full sm:w-auto"
                  variant="ghost"
                  onClick={() => setStep(5)}
                  disabled={submitting}
                >
                  Pular opcionais
                </Button>
              )}

              {step < STEP_TITLES.length ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={!canContinue() || submitting}
                  onClick={() => setStep((prev) => Math.min(STEP_TITLES.length, prev + 1))}
                >
                  Proxima etapa <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void onSubmit()}
                  disabled={submitting}
                >
                  <Send className="size-4" /> {submitting ? "Enviando..." : "Enviar OS"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
