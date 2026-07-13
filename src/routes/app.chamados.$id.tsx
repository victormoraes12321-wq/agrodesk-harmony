import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  FileText,
  MessageCircle,
  MessageSquareText,
  Package,
  Paperclip,
  Send,
  Shield,
  Star,
  UserCircle2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAsset, updateAsset, getAssets, type Asset } from "@/services/patrimonio-api";
import { toast } from "sonner";

import { PRIORITY_LEVELS, STATUS_FLOW } from "@/app/constants";
import { PriorityBadge, StatusBadge } from "@/components/tickets/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppMessagePanel } from "@/components/tickets/WhatsAppMessagePanel";
import { TicketSlaChip } from "@/features/tickets/TicketSlaChip";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import {
  canViewTicket,
  formatBranchName,
  getBranchName,
  getCategoryName,
  getDepartmentName,
  getUserName,
} from "@/lib/helpdesk";
import { useApp } from "@/lib/store";
import { commentSchema, ratingSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

export const Route = createFileRoute("/app/chamados/$id")({
  head: () => ({ meta: [{ title: "Detalhe da OS | AgroDesk TI" }] }),
  component: TicketDetailRoute,
});

function TicketDetailRoute() {
  const { id } = Route.useParams();
  const app = useApp();
  const { currentUser, tickets, refreshTicketDetails, loading: appLoading } = app;
  const loading = usePageLoading(180);
  const [fetching, setFetching] = useState(true);
  const ticket = tickets.find((item) => item.id === id);

  useEffect(() => {
    let mounted = true;
    setFetching(true);
    void refreshTicketDetails(id).finally(() => {
      if (mounted) setFetching(false);
    });
    return () => {
      mounted = false;
    };
  }, [id, refreshTicketDetails]);

  if (!currentUser) return <Navigate to="/login" />;
  if (loading || appLoading || fetching) return <PageLoading cards={0} rows={6} />;
  if (!ticket)
    return (
      <Navigate to={currentUser.role === "TI_ADMIN" ? "/app/chamados" : "/app/meus-chamados"} />
    );

  if (!canViewTicket(currentUser, ticket)) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Card className="max-w-md w-full text-center shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
            <CardDescription>Voce nao tem permissao para visualizar esta OS.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/app/meus-chamados">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return currentUser.role === "TI_ADMIN" ? (
    <AdminTicketView ticket={ticket} />
  ) : (
    <RequesterTicketView ticket={ticket} />
  );
}

function RequesterTicketView({ ticket }: { ticket: Ticket }) {
  const { departments, branches, categories, addComment, rateTicket, uploadAttachment } = useApp();
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(ticket.rating ?? 0);
  const [ratingComment, setRatingComment] = useState(ticket.ratingComment ?? "");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const publicComments = ticket.comments.filter((entry) => !entry.internal);
  const canRate = ticket.status === "FINALIZADO";

  useEffect(() => {
    setRating(ticket.rating ?? 0);
    setRatingComment(ticket.ratingComment ?? "");
  }, [ticket.id, ticket.rating, ticket.ratingComment]);

  const sendComment = async () => {
    const validation = commentSchema.safeParse({ content: comment });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Comentario invalido.");
      return;
    }

    try {
      await addComment(ticket.id, validation.data.content, false);
      setComment("");
      toast.success("Comentario enviado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel enviar comentario.";
      toast.error(message);
    }
  };

  const submitRating = async () => {
    if (!canRate) {
      toast.error("A avaliacao fica disponivel quando a OS estiver finalizada.");
      return;
    }

    const validation = ratingSchema.safeParse({ rating });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Selecione uma nota.");
      return;
    }
    try {
      await rateTicket(ticket.id, validation.data.rating, ratingComment);
      toast.success("Avaliacao registrada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel registrar avaliacao.";
      toast.error(message);
    }
  };

  const submitAttachment = async () => {
    if (!attachmentFile) {
      toast.error("Selecione um arquivo para anexar.");
      return;
    }
    try {
      await uploadAttachment(ticket.id, attachmentFile, false);
      setAttachmentFile(null);
      toast.success("Anexo enviado com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel enviar anexo.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Detalhe da OS ${ticket.protocol}`}
        description="Visao do solicitante com acompanhamento simples, comentarios publicos e anexos."
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>{ticket.title}</CardTitle>
              <StatusBadge status={ticket.status} />
            </div>
            <CardDescription>Protocolo {ticket.protocol}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <FieldInfo label="Protocolo" value={ticket.protocol} />
              <FieldInfo label="Status" value={statusLabel[ticket.status]} />
              <FieldInfo label="Data de abertura" value={formatDateTime(ticket.createdAt)} />
              <FieldInfo
                label="Setor"
                value={getDepartmentName(departments, ticket.departmentId)}
              />
              <FieldInfo label="Filial/local" value={getBranchName(branches, ticket.branchId)} />
              {ticket.categoryId ? (
                <FieldInfo
                  label="Categoria"
                  value={getCategoryName(categories, ticket.categoryId)}
                />
              ) : null}
            </div>

            <section className="rounded-xl border bg-muted/20 p-4">
              <h3 className="font-medium mb-2">Descricao do problema</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </section>

            {ticket.status === "AGUARDANDO_USUARIO" && ticket.waitingRequesterMessage && (
              <section className="rounded-xl border border-warning/35 bg-warning/10 p-4">
                <h3 className="font-medium">O que a T.I. esta aguardando de voce</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{ticket.waitingRequesterMessage}</p>
              </section>
            )}

            {ticket.solution && (
              <section className="rounded-xl border border-success/30 bg-success/5 p-4">
                <h3 className="font-medium text-success">Resposta/solucao</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{ticket.solution}</p>
              </section>
            )}

            <section>
              <h3 className="font-medium mb-2">Anexos</h3>
              {ticket.attachments.length === 0 ? (
                <EmptyState
                  compact
                  title="Sem anexos"
                  description="Nenhum arquivo foi anexado neste chamado."
                  icon={FileText}
                />
              ) : (
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="rounded-lg border p-3 text-sm flex items-center justify-between gap-3"
                    >
                      <span className="truncate">{attachment.name}</span>
                      <span className="text-muted-foreground">{attachment.sizeKb} KB</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 space-y-2">
                <Input
                  type="file"
                  onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
                />
                <Button size="sm" variant="outline" onClick={() => void submitAttachment()}>
                  <Paperclip className="size-4" /> Anexar arquivo
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Avaliacao do atendimento</CardTitle>
            <CardDescription>Disponivel quando o chamado estiver finalizado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.rating ? (
              <p className="text-sm">
                Nota registrada: <strong>{ticket.rating}/5</strong>
              </p>
            ) : null}

            {canRate ? (
              <div className="rounded-xl border p-3">
                <p className="text-sm font-medium mb-2">Avalie o atendimento</p>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRating(score)}
                      className={`size-8 rounded-md border grid place-items-center transition ${
                        rating >= score
                          ? "bg-warning/25 text-warning-foreground border-warning/40"
                          : "bg-background hover:bg-muted/40"
                      }`}
                      aria-label={`Avaliar com nota ${score}`}
                    >
                      <Star className="size-4" />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  placeholder="Comentario opcional"
                  rows={3}
                />
                <Button className="mt-2 w-full" onClick={() => void submitRating()}>
                  Enviar avaliacao
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Status atual: {statusLabel[ticket.status]}. A avaliacao sera habilitada quando a OS
                for finalizada.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="size-4" /> Comentarios publicos
            </CardTitle>
            <CardDescription>Converse com a equipe de TI no proprio chamado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {publicComments.length === 0 ? (
              <EmptyState
                compact
                title="Sem comentarios publicos"
                description="Escreva a primeira mensagem para este chamado."
              />
            ) : (
              publicComments.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3">
                  <p className="text-sm font-medium">{entry.authorName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))
            )}

            <div className="space-y-2 pt-2">
              <Label>Novo comentario</Label>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Escreva uma mensagem para a equipe"
              />
              <Button onClick={() => void sendComment()}>
                <Send className="size-4" /> Comentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type TicketEditForm = {
  title: string;
  requesterName: string;
  requesterPhone: string;
  departmentId: string;
  branchId: string;
  categoryId: string;
  subcategory: string;
  suggestedPriority: "" | Ticket["priority"];
  description: string;
  equipment: string;
  assetTag: string;
  bestTime: string;
  impact: string;
  additionalNotes: string;
};

type TicketTechnicalForm = {
  diagnosis: string;
  rootCause: string;
  solution: string;
  partsUsed: string;
  timeSpentMinutes: string;
  internalNotes: string;
  resolutionSummary: string;
};

type ConfirmationAction = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
};

function AdminTicketView({ ticket }: { ticket: Ticket }) {
  const {
    users,
    departments,
    branches,
    categories,
    audit,
    addComment,
    updateTicket,
    uploadAttachment,
    registerWhatsappPrepared,
  } = useApp();
  const admins = users.filter(
    (user) => user.role === "TI_ADMIN" && user.active && user.canReceiveTickets,
  );

  const [publicComment, setPublicComment] = useState("");
  const queryClient = useQueryClient();
  const [activeReplacementComp, setActiveReplacementComp] = useState<Asset | null>(null);
  const [isReplacingOpen, setIsReplacingOpen] = useState(false);
  const [selectedReplacementAssetId, setSelectedReplacementAssetId] = useState<string>("");

  const { data: assetDetail, refetch: refetchAsset } = useQuery({
    queryKey: ["ticket-asset", ticket.assetId],
    queryFn: () => getAsset(ticket.assetId!).then((res) => res),
    enabled: !!ticket.assetId,
  });

  const { data: stockAssets } = useQuery({
    queryKey: ["replacement-stock", activeReplacementComp?.assetTypeId],
    queryFn: () =>
      getAssets({
        status: "ESTOQUE",
        assetTypeId: activeReplacementComp?.assetTypeId,
      }).then((res) => res),
    enabled: !!activeReplacementComp,
  });

  const handleConfirmSwap = async () => {
    if (!activeReplacementComp || !selectedReplacementAssetId) {
      toast.error("Selecione um periférico de substituição.");
      return;
    }

    const newAsset = stockAssets?.find((a) => a.id === selectedReplacementAssetId);
    if (!newAsset) {
      toast.error("Periférico de substituição não encontrado.");
      return;
    }

    try {
      // 1. Desvincular periférico antigo
      await updateAsset(activeReplacementComp.id, {
        parentId: null,
        status: "MANUTENCAO" as any,
      });

      // 2. Vincular periférico novo
      await updateAsset(newAsset.id, {
        parentId: ticket.assetId!,
        status: "EM_USO" as any,
        branchId: ticket.branchId,
        departmentId: ticket.departmentId,
      });

      // 3. Registrar comentário interno na OS
      await addComment(
        ticket.id,
        `Troca de periférico realizada:\n• Retirado: ${activeReplacementComp.name} (${activeReplacementComp.code})\n• Instalado: ${newAsset.name} (${newAsset.code})`,
        true,
      );

      toast.success("Troca de periférico realizada com sucesso!");
      setIsReplacingOpen(false);
      setActiveReplacementComp(null);
      setSelectedReplacementAssetId("");

      void queryClient.invalidateQueries({ queryKey: ["ticket-asset", ticket.assetId] });
      void refetchAsset();
    } catch (error) {
      toast.error("Falha ao realizar a substituição do periférico.");
    }
  };
  const [internalComment, setInternalComment] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [waitingReasonOpen, setWaitingReasonOpen] = useState(false);
  const [waitingReason, setWaitingReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmationAction | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [ticketForm, setTicketForm] = useState<TicketEditForm>({
    title: ticket.title ?? "",
    requesterName: ticket.requesterName ?? "",
    requesterPhone: ticket.requesterPhone ?? "",
    departmentId: ticket.departmentId ?? "",
    branchId: ticket.branchId ?? "",
    categoryId: ticket.categoryId ?? "",
    subcategory: ticket.subcategory ?? "",
    suggestedPriority: ticket.suggestedPriority ?? "",
    description: ticket.description ?? "",
    equipment: ticket.equipment ?? "",
    assetTag: ticket.assetTag ?? "",
    bestTime: ticket.bestTime ?? "",
    impact: ticket.impact ?? "",
    additionalNotes: ticket.additionalNotes ?? "",
  });
  const [technical, setTechnical] = useState<TicketTechnicalForm>({
    diagnosis: ticket.diagnosis ?? "",
    rootCause: ticket.rootCause ?? "",
    solution: ticket.solution ?? "",
    partsUsed: ticket.partsUsed ?? "",
    timeSpentMinutes: String(ticket.timeSpentMinutes ?? ""),
    internalNotes: ticket.internalNotes ?? "",
    resolutionSummary: ticket.resolutionSummary ?? "",
  });

  useEffect(() => {
    setTicketForm({
      title: ticket.title ?? "",
      requesterName: ticket.requesterName ?? "",
      requesterPhone: ticket.requesterPhone ?? "",
      departmentId: ticket.departmentId ?? "",
      branchId: ticket.branchId ?? "",
      categoryId: ticket.categoryId ?? "",
      subcategory: ticket.subcategory ?? "",
      suggestedPriority: ticket.suggestedPriority ?? "",
      description: ticket.description ?? "",
      equipment: ticket.equipment ?? "",
      assetTag: ticket.assetTag ?? "",
      bestTime: ticket.bestTime ?? "",
      impact: ticket.impact ?? "",
      additionalNotes: ticket.additionalNotes ?? "",
    });
    setTechnical({
      diagnosis: ticket.diagnosis ?? "",
      rootCause: ticket.rootCause ?? "",
      solution: ticket.solution ?? "",
      partsUsed: ticket.partsUsed ?? "",
      timeSpentMinutes: String(ticket.timeSpentMinutes ?? ""),
      internalNotes: ticket.internalNotes ?? "",
      resolutionSummary: ticket.resolutionSummary ?? "",
    });
    setWaitingReason(ticket.waitingRequesterMessage ?? "");
  }, [ticket]);

  const auditRows = useMemo(() => {
    return audit.filter((row) => row.entityId === ticket.id).slice(0, 12);
  }, [audit, ticket.id]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === ticketForm.categoryId),
    [categories, ticketForm.categoryId],
  );
  const availableSubcategories = selectedCategory?.subcategories ?? [];
  const displayedSubcategoryLabel = useMemo(() => {
    if (!ticket.subcategory) return "-";
    const category = categories.find((item) => item.id === ticket.categoryId);
    const subcategory = category?.subcategories?.find((item) => item.id === ticket.subcategory);
    return subcategory?.name ?? ticket.subcategory;
  }, [categories, ticket.categoryId, ticket.subcategory]);

  const publicComments = ticket.comments.filter((entry) => !entry.internal);
  const internalComments = ticket.comments.filter((entry) => entry.internal);

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      setConfirmingAction(true);
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch {
      // Errors are already handled inside each action.
    } finally {
      setConfirmingAction(false);
    }
  };

  const updateTicketForm = <K extends keyof TicketEditForm>(key: K, value: TicketEditForm[K]) => {
    setTicketForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTechnicalForm = <K extends keyof TicketTechnicalForm>(
    key: K,
    value: TicketTechnicalForm[K],
  ) => {
    setTechnical((prev) => ({ ...prev, [key]: value }));
  };

  const saveTicketEdits = async () => {
    if (
      !ticketForm.requesterName.trim() ||
      !ticketForm.requesterPhone.trim() ||
      !ticketForm.departmentId ||
      !ticketForm.branchId ||
      !ticketForm.description.trim()
    ) {
      toast.error(
        "Preencha os campos obrigatorios: solicitante, telefone, setor, filial/local e descricao.",
      );
      return;
    }

    try {
      await updateTicket(ticket.id, {
        title: ticketForm.title.trim(),
        requesterName: ticketForm.requesterName.trim(),
        requesterPhone: ticketForm.requesterPhone.trim(),
        departmentId: ticketForm.departmentId,
        branchId: ticketForm.branchId,
        categoryId: ticketForm.categoryId || undefined,
        subcategory: ticketForm.subcategory.trim() || undefined,
        suggestedPriority: ticketForm.suggestedPriority || undefined,
        description: ticketForm.description.trim(),
        equipment: ticketForm.equipment.trim() || undefined,
        assetTag: ticketForm.assetTag.trim() || undefined,
        bestTime: ticketForm.bestTime.trim() || undefined,
        impact: ticketForm.impact.trim() || undefined,
        additionalNotes: ticketForm.additionalNotes.trim() || undefined,
      });
      toast.success("Dados da OS atualizados.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar edicao da OS.";
      toast.error(message);
      throw error;
    }
  };

  const saveTechnicalData = async () => {
    if (technical.timeSpentMinutes && Number.isNaN(Number(technical.timeSpentMinutes))) {
      toast.error("Tempo gasto deve ser um numero em minutos.");
      return;
    }

    try {
      await updateTicket(ticket.id, {
        diagnosis: technical.diagnosis,
        rootCause: technical.rootCause,
        solution: technical.solution,
        partsUsed: technical.partsUsed,
        timeSpentMinutes: technical.timeSpentMinutes
          ? Number(technical.timeSpentMinutes)
          : undefined,
        internalNotes: technical.internalNotes,
        resolutionSummary: technical.resolutionSummary,
      });
      toast.success("Dados tecnicos atualizados.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar dados tecnicos.";
      toast.error(message);
      throw error;
    }
  };

  const postPublic = async () => {
    const validation = commentSchema.safeParse({ content: publicComment });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Comentario invalido.");
      return;
    }

    try {
      await addComment(ticket.id, validation.data.content, false);
      setPublicComment("");
      toast.success("Comentario publico enviado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel enviar comentario publico.";
      toast.error(message);
    }
  };

  const postInternal = async () => {
    const validation = commentSchema.safeParse({ content: internalComment });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Comentario invalido.");
      return;
    }

    try {
      await addComment(ticket.id, validation.data.content, true);
      setInternalComment("");
      toast.success("Comentario interno salvo.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar comentario interno.";
      toast.error(message);
    }
  };

  const submitAttachment = async (internal: boolean) => {
    if (!attachmentFile) {
      toast.error("Selecione um arquivo para anexar.");
      return;
    }
    try {
      await uploadAttachment(ticket.id, attachmentFile, internal);
      setAttachmentFile(null);
      toast.success(internal ? "Anexo interno enviado." : "Anexo publico enviado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel anexar arquivo.";
      toast.error(message);
    }
  };

  const resolveStatusAction = (status: Ticket["status"]) => {
    if (status === "RESOLVIDO") return "RESOLVE";
    if (status === "FINALIZADO") return "FINALIZE";
    if (status === "REABERTO") return "REOPEN";
    if (status === "CANCELADO") return "CANCEL";
    return "UPDATE";
  };

  const actionChangeStatus = async (status: Ticket["status"], statusNote?: string) => {
    try {
      await updateTicket(
        ticket.id,
        { status },
        { statusAction: resolveStatusAction(status), statusNote },
      );
      toast.success(`Status alterado para ${statusLabel[status]}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel alterar status.";
      toast.error(message);
      throw error;
    }
  };

  const actionChangePriority = async (priority: Ticket["priority"]) => {
    try {
      await updateTicket(ticket.id, { priority });
      toast.success(`Prioridade alterada para ${priorityLabel[priority]}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel alterar prioridade.";
      toast.error(message);
      throw error;
    }
  };

  const actionChangeAssignee = async (assigneeId?: string) => {
    try {
      await updateTicket(ticket.id, { assigneeId });
      toast.success(
        assigneeId
          ? `Responsavel definido: ${getUserName(users, assigneeId)}.`
          : "OS ficou sem responsavel definido.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel alterar responsavel.";
      toast.error(message);
      throw error;
    }
  };

  const queueStatusConfirmation = (nextStatus: Ticket["status"], statusNote?: string) => {
    setConfirmAction({
      title: "Confirmar alteracao de status",
      description: `A OS ${ticket.protocol} sera movida para ${statusLabel[nextStatus]}. Essa acao gera historico e auditoria.`,
      confirmLabel: "Confirmar status",
      destructive: nextStatus === "CANCELADO",
      onConfirm: () => actionChangeStatus(nextStatus, statusNote),
    });
  };

  const queueStatusChange = (nextStatus: Ticket["status"]) => {
    if (nextStatus === ticket.status) return;
    if (nextStatus === "AGUARDANDO_USUARIO") {
      setWaitingReason(ticket.waitingRequesterMessage ?? "");
      setWaitingReasonOpen(true);
      return;
    }
    queueStatusConfirmation(nextStatus);
  };

  const confirmWaitingReason = () => {
    const note = waitingReason.trim();
    if (!note) {
      toast.error("Informe o que esta sendo aguardado do solicitante.");
      return;
    }
    setWaitingReasonOpen(false);
    queueStatusConfirmation("AGUARDANDO_USUARIO", note);
  };

  const queuePriorityChange = (nextPriority: Ticket["priority"]) => {
    if (nextPriority === ticket.priority) return;
    setConfirmAction({
      title: "Confirmar alteracao de prioridade",
      description: `A prioridade real da OS ${ticket.protocol} sera alterada para ${priorityLabel[nextPriority]}.`,
      confirmLabel: "Confirmar prioridade",
      onConfirm: () => actionChangePriority(nextPriority),
    });
  };

  const queueAssigneeChange = (nextAssigneeId: string) => {
    const normalized = nextAssigneeId || undefined;
    if (normalized === ticket.assigneeId) return;
    const targetName = normalized ? getUserName(users, normalized) : "Sem responsavel";

    setConfirmAction({
      title: "Confirmar definicao de responsavel",
      description: `A OS ${ticket.protocol} sera atribuida para ${targetName}.`,
      confirmLabel: "Confirmar responsavel",
      onConfirm: () => actionChangeAssignee(normalized),
    });
  };

  const queueSaveTicketEdits = () => {
    setConfirmAction({
      title: "Confirmar edicao da OS",
      description:
        "As alteracoes de dados da OS serao salvas e registradas no historico de atendimento e na auditoria.",
      confirmLabel: "Salvar edicao",
      onConfirm: saveTicketEdits,
    });
  };

  const queueSaveTechnical = () => {
    setConfirmAction({
      title: "Confirmar dados tecnicos",
      description:
        "Diagnostico, causa raiz, solucao, observacoes internas e tempo gasto serao atualizados com auditoria.",
      confirmLabel: "Salvar dados tecnicos",
      onConfirm: saveTechnicalData,
    });
  };

  const hasCategory = ticketForm.categoryId.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`OS ${ticket.protocol}`}
        description="Visao TI_ADMIN com controle completo, area interna tecnica e rastreabilidade."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => queueStatusChange("RESOLVIDO")}>
              Resolver
            </Button>
            <Button variant="outline" onClick={() => queueStatusChange("FINALIZADO")}>
              Finalizar
            </Button>
            <Button variant="outline" onClick={() => queueStatusChange("REABERTO")}>
              Reabrir
            </Button>
            <Button variant="outline" onClick={() => queueStatusChange("CANCELADO")}>
              Cancelar
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>{ticket.title}</CardTitle>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <CardDescription>
              {ticket.requesterName} ({ticket.requesterPhone}) - {formatDateTime(ticket.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldSelect
                label="Status"
                value={ticket.status}
                onChange={(value) => queueStatusChange(value as Ticket["status"])}
                options={STATUS_FLOW.map((item) => ({ value: item, label: statusLabel[item] }))}
              />
              <FieldSelect
                label="Prioridade real"
                value={ticket.priority}
                onChange={(value) => queuePriorityChange(value as Ticket["priority"])}
                options={PRIORITY_LEVELS.map((item) => ({
                  value: item,
                  label: priorityLabel[item],
                }))}
              />
              <FieldSelect
                label="Responsavel"
                value={ticket.assigneeId ?? ""}
                onChange={(value) => queueAssigneeChange(value)}
                options={[
                  { value: "", label: "Sem responsavel" },
                  ...admins.map((admin) => ({ value: admin.id, label: admin.name })),
                ]}
              />
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <h3 className="font-medium">Visao operacional completa</h3>
              <p className="text-xs text-muted-foreground">
                Toda alteracao relevante gera historico de status e audit log automaticamente.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <FieldInfo label="Protocolo" value={ticket.protocol} />
                <FieldInfo label="SLA" value={`${ticket.slaHours} horas`} />
                <FieldInfo
                  label="Prioridade sugerida"
                  value={
                    ticket.suggestedPriority
                      ? priorityLabel[ticket.suggestedPriority]
                      : "Nao informada"
                  }
                />
                <FieldInfo label="Solicitante" value={ticket.requesterName} />
                <FieldInfo label="Telefone" value={ticket.requesterPhone} />
                <FieldInfo label="E-mail" value={ticket.requesterEmail} />
                <FieldInfo
                  label="Setor"
                  value={getDepartmentName(departments, ticket.departmentId)}
                />
                <FieldInfo label="Filial/local" value={getBranchName(branches, ticket.branchId)} />
                <FieldInfo
                  label="Categoria"
                  value={getCategoryName(categories, ticket.categoryId)}
                />
                <FieldInfo label="Subcategoria" value={displayedSubcategoryLabel} />
                <FieldInfo label="Equipamento" value={ticket.equipment || "-"} />
                <FieldInfo label="Patrimonio" value={ticket.assetTag || "-"} />
                <FieldInfo label="Responsavel" value={getUserName(users, ticket.assigneeId)} />
                <FieldInfo label="Impacto" value={ticket.impact || "-"} />
                <FieldInfo
                  label="Aguardando retorno"
                  value={ticket.waitingRequesterMessage || "-"}
                />
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-3">
              <h3 className="font-medium">Editar OS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Titulo</Label>
                  <Input
                    value={ticketForm.title}
                    onChange={(event) => updateTicketForm("title", event.target.value)}
                    placeholder="Resumo curto da OS"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prioridade sugerida</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={ticketForm.suggestedPriority}
                    onChange={(event) =>
                      updateTicketForm(
                        "suggestedPriority",
                        event.target.value as TicketEditForm["suggestedPriority"],
                      )
                    }
                  >
                    <option value="">Nao informada</option>
                    {PRIORITY_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {priorityLabel[item]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Nome do solicitante</Label>
                  <Input
                    value={ticketForm.requesterName}
                    onChange={(event) => updateTicketForm("requesterName", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={ticketForm.requesterPhone}
                    onChange={(event) => updateTicketForm("requesterPhone", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Setor</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={ticketForm.departmentId}
                    onChange={(event) => updateTicketForm("departmentId", event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Filial/local</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={ticketForm.branchId}
                    onChange={(event) => updateTicketForm("branchId", event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {formatBranchName(branch.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={ticketForm.categoryId}
                    onChange={(event) => {
                      updateTicketForm("categoryId", event.target.value);
                      updateTicketForm("subcategory", "");
                    }}
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Subcategoria</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={ticketForm.subcategory}
                    onChange={(event) => updateTicketForm("subcategory", event.target.value)}
                    disabled={!hasCategory || availableSubcategories.length === 0}
                  >
                    <option value="">
                      {hasCategory ? "Sem subcategoria" : "Defina uma categoria antes"}
                    </option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Equipamento</Label>
                  <Input
                    value={ticketForm.equipment}
                    onChange={(event) => updateTicketForm("equipment", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Patrimonio</Label>
                  <Input
                    value={ticketForm.assetTag}
                    onChange={(event) => updateTicketForm("assetTag", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Melhor horario</Label>
                  <Input
                    value={ticketForm.bestTime}
                    onChange={(event) => updateTicketForm("bestTime", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Impacto</Label>
                  <Input
                    value={ticketForm.impact}
                    onChange={(event) => updateTicketForm("impact", event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descricao</Label>
                <Textarea
                  rows={4}
                  value={ticketForm.description}
                  onChange={(event) => updateTicketForm("description", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Observacoes adicionais</Label>
                <Textarea
                  rows={3}
                  value={ticketForm.additionalNotes}
                  onChange={(event) => updateTicketForm("additionalNotes", event.target.value)}
                  placeholder="Campo opcional"
                />
              </div>
              <Button onClick={queueSaveTicketEdits}>
                <CheckCircle2 className="size-4" /> Salvar edicao da OS
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CircleDashed className="size-4" /> SLA e acoes rapidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TicketSlaChip
              createdAt={ticket.createdAt}
              slaHours={ticket.slaHours}
              closedAt={ticket.closedAt}
            />
            <p className="text-sm text-muted-foreground">Tempo alvo: {ticket.slaHours} horas</p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => queueStatusChange("EM_ATENDIMENTO")}
            >
              Marcar em atendimento
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => queueStatusChange("AGUARDANDO_USUARIO")}
            >
              Aguardando usuario
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => queueStatusChange("AGUARDANDO_PECA")}
            >
              Aguardando peca/terceiro
            </Button>
          </CardContent>
        </Card>

        {assetDetail && (
          <Card className="shadow-[var(--shadow-card)] hover-card-premium fade-slide-up bg-card border border-border">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="size-4 text-primary animate-pulse" />
                Equipamento Relacionado
              </CardTitle>
              <CardDescription className="text-xs">
                Informações do ativo e periféricos associados.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {assetDetail.code}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {assetDetail.assetType?.name}
                  </span>
                </div>
                <h4 className="font-semibold text-sm mt-1">{assetDetail.name}</h4>
                {assetDetail.hostname && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Hostname: <span className="font-bold text-primary">{assetDetail.hostname}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Setor: <span className="font-medium text-foreground">{assetDetail.department?.name || 'Não informado'}</span>
                </p>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Periféricos Instalados
                </h5>
                {!assetDetail.components || assetDetail.components.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum periférico vinculado.</p>
                ) : (
                  <div className="space-y-2">
                    {assetDetail.components.map((comp: any) => (
                      <div key={comp.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{comp.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{comp.code}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-primary hover:text-primary-glow font-semibold"
                          onClick={() => {
                            setActiveReplacementComp(comp);
                            setIsReplacingOpen(true);
                          }}
                        >
                          Trocar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <WhatsAppMessagePanel
          ticket={ticket}
          assigneeName={getUserName(users, ticket.assigneeId)}
          departmentName={getDepartmentName(departments, ticket.departmentId)}
          branchName={getBranchName(branches, ticket.branchId)}
          categoryName={getCategoryName(categories, ticket.categoryId)}
          onPrepared={async (input) => {
            await registerWhatsappPrepared({
              ticketId: ticket.id,
              message: input.message,
              phoneUsed: input.phoneUsed,
              statusAtMoment: input.statusAtMoment,
            });
          }}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4" /> Area tecnica interna
            </CardTitle>
            <CardDescription>
              Diagnostico, causa raiz, solucao, pecas/equipamentos, tempo gasto e observacoes
              internas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Diagnostico</Label>
              <Textarea
                value={technical.diagnosis}
                onChange={(event) => updateTechnicalForm("diagnosis", event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Causa raiz</Label>
              <Textarea
                value={technical.rootCause}
                onChange={(event) => updateTechnicalForm("rootCause", event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Solucao aplicada</Label>
              <Textarea
                value={technical.solution}
                onChange={(event) => updateTechnicalForm("solution", event.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pecas/equipamentos usados</Label>
                <Input
                  value={technical.partsUsed}
                  onChange={(event) => updateTechnicalForm("partsUsed", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tempo gasto (min)</Label>
                <Input
                  value={technical.timeSpentMinutes}
                  onChange={(event) => updateTechnicalForm("timeSpentMinutes", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observacoes internas</Label>
              <Textarea
                value={technical.internalNotes}
                onChange={(event) => updateTechnicalForm("internalNotes", event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Resumo de encerramento</Label>
              <Textarea
                value={technical.resolutionSummary}
                onChange={(event) => updateTechnicalForm("resolutionSummary", event.target.value)}
                rows={2}
              />
            </div>
            <Button onClick={queueSaveTechnical}>
              <CheckCircle2 className="size-4" /> Salvar dados tecnicos
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Comentarios e anexos</CardTitle>
            <CardDescription>
              Publico para o solicitante. Interno apenas para TI_ADMIN.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <MessageSquareText className="size-4" /> Comentarios publicos
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {publicComments.length === 0 ? (
                  <EmptyState
                    compact
                    title="Sem comentarios publicos"
                    description="Nenhuma mensagem publica registrada."
                  />
                ) : (
                  publicComments.map((entry) => (
                    <div key={entry.id} className="rounded-xl border p-2 text-sm">
                      <p className="font-medium">{entry.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))
                )}
              </div>
              <Textarea
                className="mt-2"
                value={publicComment}
                onChange={(event) => setPublicComment(event.target.value)}
                placeholder="Novo comentario publico"
                rows={2}
              />
              <Button className="mt-2" size="sm" onClick={() => void postPublic()}>
                <Send className="size-4" /> Comentar publicamente
              </Button>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Shield className="size-4" /> Comentarios internos
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {internalComments.length === 0 ? (
                  <EmptyState
                    compact
                    title="Sem comentarios internos"
                    description="Nenhum registro interno nesta OS."
                  />
                ) : (
                  internalComments.map((entry) => (
                    <div key={entry.id} className="rounded-xl border p-2 text-sm bg-muted/35">
                      <p className="font-medium">{entry.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))
                )}
              </div>
              <Textarea
                className="mt-2"
                value={internalComment}
                onChange={(event) => setInternalComment(event.target.value)}
                placeholder="Novo comentario interno"
                rows={2}
              />
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                onClick={() => void postInternal()}
              >
                <Send className="size-4" /> Comentar internamente
              </Button>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Anexos</h3>
              {ticket.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem anexos.</p>
              ) : (
                <div className="space-y-1 text-sm">
                  {ticket.attachments.map((attachment) => (
                    <p key={attachment.id}>
                      {attachment.name} ({attachment.sizeKb} KB)
                      {attachment.internal ? " - interno" : " - publico"}
                    </p>
                  ))}
                </div>
              )}
              <div className="space-y-2 mt-2">
                <Input
                  type="file"
                  onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void submitAttachment(false)}>
                    <Paperclip className="size-4" /> Anexo publico
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void submitAttachment(true)}>
                    <Shield className="size-4" /> Anexo interno
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="size-4" /> Historico de status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticket.statusHistory.length === 0 ? (
                <EmptyState
                  compact
                  title="Sem historico"
                  description="Ainda nao houve alteracoes de status nesta OS."
                />
              ) : (
                ticket.statusHistory.map((entry) => (
                  <div key={entry.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{statusLabel[entry.status]}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.changedByName} - {formatDateTime(entry.createdAt)}
                    </p>
                    {entry.note && <p className="text-sm mt-1">{entry.note}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Auditoria resumida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditRows.length === 0 ? (
                <EmptyState
                  compact
                  title="Sem registros de auditoria"
                  description="Nao houve alteracoes administrativas registradas."
                />
              ) : (
                auditRows.map((row) => (
                  <div key={row.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">
                      {row.userName} alterou {row.field}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                    <p className="text-xs mt-1">Antes: {row.before}</p>
                    <p className="text-xs">Depois: {row.after}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={waitingReasonOpen} onOpenChange={setWaitingReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O que voce precisa que o solicitante responda?</DialogTitle>
            <DialogDescription>
              Este texto e obrigatorio para mudar a OS para \"Aguardando resposta do solicitante\".
              Ele sera salvo no historico e usado na comunicacao.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Mensagem aguardada</Label>
            <Textarea
              rows={4}
              value={waitingReason}
              onChange={(event) => setWaitingReason(event.target.value)}
              placeholder="Ex: Envie uma foto da mensagem de erro para seguirmos com o atendimento."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaitingReasonOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmWaitingReason}>Salvar e continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        action={confirmAction}
        loading={confirmingAction}
        onOpenChange={(open) => {
          if (!open && !confirmingAction) setConfirmAction(null);
        }}
        onConfirm={() => void runConfirmedAction()}
      />

      {/* Modal de Substituição de Periférico */}
      <Dialog open={isReplacingOpen} onOpenChange={setIsReplacingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Substituir Periférico</DialogTitle>
            <DialogDescription>
              Selecione um periférico disponível em estoque para substituir o componente "{activeReplacementComp?.name}" ({activeReplacementComp?.code}).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <Label>Equipamento de Destino (PC)</Label>
              <Input value={assetDetail?.name || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-1">
              <Label>Componente Atual (Substituído)</Label>
              <Input value={activeReplacementComp ? `${activeReplacementComp.name} (${activeReplacementComp.code})` : ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-1">
              <Label>Novo Periférico (Em Estoque) *</Label>
              {!stockAssets || stockAssets.length === 0 ? (
                <div className="text-sm text-destructive border rounded-md p-3 bg-destructive/5">
                  Nenhum item do tipo "{activeReplacementComp?.assetType?.name || 'periférico'}" disponível em estoque (status ESTOQUE). Cadastre novos ativos no estoque primeiro.
                </div>
              ) : (
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={selectedReplacementAssetId}
                  onChange={(e) => setSelectedReplacementAssetId(e.target.value)}
                >
                  <option value="">Selecione um ativo em estoque...</option>
                  {stockAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.code} - {asset.name} {asset.serialNumber ? `(S/N: ${asset.serialNumber})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsReplacingOpen(false);
              setActiveReplacementComp(null);
              setSelectedReplacementAssetId("");
            }}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirmSwap()}
              disabled={!selectedReplacementAssetId}
            >
              Confirmar Substituição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmActionDialog({
  action,
  loading,
  onOpenChange,
  onConfirm,
}: {
  action: ConfirmationAction | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{action?.title ?? "Confirmar acao"}</AlertDialogTitle>
          <AlertDialogDescription>{action?.description ?? ""}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            className={
              action?.destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {loading ? "Processando..." : (action?.confirmLabel ?? "Confirmar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FieldInfo({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
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
      <Label>{label}</Label>
      <select
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
