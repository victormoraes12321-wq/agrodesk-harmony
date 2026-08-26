import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Info,
  Paperclip,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  UserCheck,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { maskPhone, priorityLabel, statusLabel } from "@/lib/format";
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
  "Como podemos falar com você?",
  "Onde está acontecendo?",
  "O que está acontecendo?",
  "Anexos e Documentos",
  "Revisão e envio",
] as const;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "heic"].includes(ext)) {
    return <FileImage className="size-4 text-blue-500 shrink-0" />;
  }
  if (["pdf"].includes(ext)) {
    return <FileText className="size-4 text-rose-500 shrink-0" />;
  }
  if (["xls", "xlsx", "csv", "ods", "ofx", "qif", "rem", "ret"].includes(ext)) {
    return <FileSpreadsheet className="size-4 text-emerald-500 shrink-0" />;
  }
  if (["xml", "json", "sql", "log", "txt", "html", "css", "ts", "js", "yaml", "yml"].includes(ext)) {
    return <FileCode className="size-4 text-amber-500 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
    return <FileArchive className="size-4 text-purple-500 shrink-0" />;
  }
  return <Paperclip className="size-4 text-primary shrink-0" />;
}

function NewTicketPage() {
  const { currentUser, users, departments, branches, categories, createTicket } = useApp();
  const loading = usePageLoading();
  const [step, setStep] = useState(1);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [createdProtocol, setCreatedProtocol] = useState<string | null>(null);
  const [createdStatus, setCreatedStatus] = useState<Ticket["status"] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAppendFiles = (newFilesList: FileList | File[] | null) => {
    if (!newFilesList || newFilesList.length === 0) return;
    const incoming = Array.from(newFilesList);

    setFiles((prev) => {
      const existingKeySet = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
      const nonDuplicates: File[] = [];
      let duplicateCount = 0;

      for (const f of incoming) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!existingKeySet.has(key)) {
          existingKeySet.add(key);
          nonDuplicates.push(f);
        } else {
          duplicateCount++;
        }
      }

      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} arquivo(s) já adicionado(s) foram ignorados.`);
      }
      if (nonDuplicates.length > 0) {
        toast.success(`${nonDuplicates.length} arquivo(s) adicionado(s).`);
      }

      return [...prev, ...nonDuplicates];
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => {
      const target = prev[indexToRemove];
      if (target) {
        toast.info(`Arquivo "${target.name}" removido.`);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    toast.info("Todos os anexos foram removidos.");
  };

  const [targetUserId, setTargetUserId] = useState<string>("");
  const [resolveImmediately, setResolveImmediately] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");

  const handleSelectTargetUser = (id: string) => {
    setTargetUserId(id);
    if (!id) {
      setForm((prev) => ({
        ...prev,
        requesterName: currentUser?.name ?? "",
        requesterPhone: currentUser?.phone ?? "",
        requesterEmail: currentUser?.email ?? "",
        departmentId: currentUser?.departmentId ?? departments[0]?.id ?? "",
        branchId: currentUser?.branchId ?? branches[0]?.id ?? "",
      }));
      return;
    }

    const selectedUser = users.find((u) => u.id === id);
    if (selectedUser) {
      setForm((prev) => ({
        ...prev,
        requesterName: selectedUser.name,
        requesterPhone: selectedUser.phone || selectedUser.whatsapp || "(00) 00000-0000",
        requesterEmail: selectedUser.email || "",
        departmentId: selectedUser.departmentId || prev.departmentId,
        branchId: selectedUser.branchId || prev.branchId,
      }));
      toast.info(`Dados de ${selectedUser.name} carregados para a Ordem de Serviço.`);
    }
  };

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
      return (
        form.categoryId.trim().length > 0 &&
        form.subcategoryId.trim().length > 0 &&
        form.description.trim().length >= 10
      );
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
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      description: form.description,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Preencha os campos obrigatorios.");
      return;
    }

    if (resolveImmediately && !resolutionNotes.trim()) {
      toast.error("Por favor, informe a descrição da solução / atendimento realizado.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket(
        {
          title: form.title,
          description: form.description,
          requesterId: targetUserId || currentUser.id,
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
          targetUserId: targetUserId || undefined,
          resolveImmediately: resolveImmediately || undefined,
          resolutionNotes: resolutionNotes || undefined,
        },
        files,
      );

      setCreatedTicketId(ticket.id);
      setCreatedProtocol(ticket.protocol);
      setCreatedStatus(ticket.status);
      toast.success(
        resolveImmediately
          ? `OS ${ticket.protocol} registrada e FINALIZADA na hora!`
          : "OS registrada com sucesso",
        { description: `Protocolo ${ticket.protocol}` },
      );
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
              {currentUser.role === "TI_ADMIN" && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 mb-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <UserCheck className="size-4" /> Abrir OS em Nome de Outro Usuário (Atendimento Presencial / Balcão)
                    </Label>
                  </div>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm font-medium"
                    value={targetUserId}
                    onChange={(e) => handleSelectTargetUser(e.target.value)}
                  >
                    <option value="">-- Em meu próprio nome ({currentUser.name}) --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.jobTitle ? `(${u.jobTitle})` : ""} - {departments.find((d) => d.id === u.departmentId)?.name ?? "Sem Setor"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Selecione o funcionário que veio conversar no suporte. Nome, telefone, setor e filial serão preenchidos automaticamente.
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {targetUserId
                  ? "Dados do solicitante selecionado (ajuste se necessário):"
                  : "Esses dados ja vieram do seu perfil. Se precisar, voce pode ajustar agora."}
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
                      setForm((prev) => ({ ...prev, requesterPhone: maskPhone(event.target.value) }))
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Categoria do Chamado *</span>
                    {selectedCategory && (
                      <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        ⏱️ SLA: {selectedCategory.defaultSlaHours}h úteis
                      </span>
                    )}
                  </Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary"
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        categoryId: event.target.value,
                        subcategoryId: "",
                      }))
                    }
                  >
                    <option value="">Selecione uma categoria (Obrigatório)...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} — ({category.defaultSlaHours}h úteis)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Subcategoria / Serviço Específico *</span>
                    {form.subcategoryId && (subcategories.find((s) => s.id === form.subcategoryId) as any)?.defaultSlaHours && (
                      <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ⏱️ SLA: {(subcategories.find((s) => s.id === form.subcategoryId) as any)?.defaultSlaHours}h úteis
                      </span>
                    )}
                  </Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-primary font-medium"
                    value={form.subcategoryId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, subcategoryId: event.target.value }))
                    }
                    disabled={subcategories.length === 0}
                  >
                    <option value="">
                      {form.categoryId
                        ? "Selecione o serviço ou problema específico..."
                        : "Selecione a categoria primeiro"}
                    </option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name} {(subcategory as any).defaultSlaHours ? `(${(subcategory as any).defaultSlaHours}h úteis)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCategory && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <Info className="size-4 shrink-0" />
                      {selectedCategory.name}
                    </span>
                    <span className="text-xs font-mono font-semibold text-primary bg-background px-2 py-0.5 rounded border shadow-2xs">
                      SLA Padrão: {selectedCategory.defaultSlaHours}h em horário comercial
                    </span>
                  </div>
                  {selectedCategory.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedCategory.description}
                    </p>
                  )}
                  {form.subcategoryId && (
                    <div className="pt-1.5 border-t border-primary/10 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        Serviço: <strong>{(subcategories.find((s) => s.id === form.subcategoryId) as any)?.name}</strong>
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Prazo estimado: {(subcategories.find((s) => s.id === form.subcategoryId) as any)?.defaultSlaHours ?? selectedCategory.defaultSlaHours}h úteis
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>O que está acontecendo? (Descrição Detalhada) *</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={5}
                  placeholder="Descreva o problema com detalhes. Ex: Impressora do caixa 2 não está puxando papel."
                />
              </div>

              <div className="space-y-2">
                <Label>Título / Resumo (opcional)</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Resumo curto da solicitação"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Paperclip className="size-4 text-primary" /> Anexos e Documentos (opcional)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Envie imagens, prints, PDFs, arquivos bancários (.OFX), planilhas, notas fiscais (.XML), relatórios ou qualquer documento de apoio.
                    </p>
                  </div>
                  {files.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllFiles}
                      className="text-xs h-7 text-muted-foreground hover:text-destructive gap-1"
                    >
                      <Trash2 className="size-3.5" /> Remover todos ({files.length})
                    </Button>
                  )}
                </div>

                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleAppendFiles(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer select-none ${
                    isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    disabled={submitting}
                    className="hidden"
                    onChange={(event) => {
                      handleAppendFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />

                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <UploadCloud className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Clique para selecionar ou arraste seus arquivos aqui
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aceita <strong>todos os formatos</strong> (.OFX, .PDF, .PNG, .JPG, .XLSX, .XML, .ZIP, etc.) até 10MB por arquivo.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs h-8 gap-1.5 pointer-events-none"
                    >
                      <Plus className="size-3.5" /> Selecionar Arquivos
                    </Button>
                  </div>
                </div>

                {/* Staged Files List */}
                {files.length > 0 && (
                  <div className="rounded-2xl border bg-card p-3 space-y-2 shadow-xs">
                    <div className="text-xs font-semibold text-muted-foreground px-1 flex items-center justify-between">
                      <span>Arquivos selecionados para envio ({files.length}):</span>
                      <span>Total: {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}</span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {files.map((file, idx) => (
                        <div
                          key={`${file.name}-${file.size}-${idx}`}
                          className="rounded-xl border bg-muted/20 hover:bg-muted/40 p-2.5 text-xs flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(file.name)}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx);
                            }}
                            title="Remover este arquivo"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4 bg-muted/20 space-y-4">
                <p className="text-sm font-medium">Detalhes complementares (opcionais)</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option value="">Automática pelo SLA da Categoria</option>
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica (Urgência Operacional)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      A prioridade real é definida pela equipe TI_ADMIN.
                    </p>
                  </div>
                </div>

                {selectedCategory && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs flex items-center justify-between animate-in fade-in duration-200">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Clock3 className="size-4 text-primary" /> Prazo estimado de atendimento para "{selectedCategory.name}":
                    </span>
                    <span className="font-bold text-primary bg-background px-2.5 py-1 rounded-md border shadow-xs">
                      {selectedCategory.defaultSlaHours}h ({selectedCategory.defaultSlaHours <= 8 ? "Mesmo dia útil" : `${Math.ceil(selectedCategory.defaultSlaHours / 24)} dia(s)`})
                    </span>
                  </div>
                )}

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
                  <div className="md:col-span-2 space-y-1.5 border-t pt-2 mt-1">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Paperclip className="size-4 text-primary" /> Anexos ({files.length}):
                    </p>
                    {files.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum arquivo anexado.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {files.map((file) => (
                          <span
                            key={file.name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-background text-xs font-medium text-foreground shadow-xs"
                          >
                            {getFileIcon(file.name)}
                            <span className="max-w-xs truncate">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({formatBytes(file.size)})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {currentUser.role === "TI_ADMIN" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="resolveImmediately"
                      checked={resolveImmediately}
                      onChange={(e) => setResolveImmediately(e.target.checked)}
                      className="size-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <Label
                      htmlFor="resolveImmediately"
                      className="font-semibold text-amber-700 dark:text-amber-400 cursor-pointer flex items-center gap-1.5 text-sm"
                    >
                      <Zap className="size-4 text-amber-500 fill-amber-500" /> Registrar e Finalizar Imediatamente (Atendimento Rápido / Resolvido na Hora)
                    </Label>
                  </div>

                  {resolveImmediately && (
                    <div className="space-y-2 pt-2 border-t border-amber-500/20">
                      <Label htmlFor="resolutionNotes" className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Descrição da Solução / Atendimento Realizado *
                      </Label>
                      <Textarea
                        id="resolutionNotes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows={3}
                        placeholder="Ex: Trocado toner da impressora / cabo de rede no balcão e testado com sucesso."
                        required
                      />
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        ⚡ Esta OS será cadastrada com o status <strong>RESOLVIDO</strong> e atribuída a você no histórico de chamados.
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                  className={`w-full sm:w-auto ${
                    resolveImmediately
                      ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md"
                      : ""
                  }`}
                  onClick={() => void onSubmit()}
                  disabled={submitting}
                >
                  {resolveImmediately ? (
                    <>
                      <Zap className="size-4 fill-white" />{" "}
                      {submitting ? "Finalizando OS..." : "⚡ Registrar e Finalizar OS na Hora"}
                    </>
                  ) : (
                    <>
                      <Send className="size-4" /> {submitting ? "Enviando..." : "Enviar OS"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
