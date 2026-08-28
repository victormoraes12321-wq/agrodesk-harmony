import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  History,
  Laptop,
  MapPin,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Package,
  Paperclip,
  PenTool,
  Phone,
  Plus,
  PlusCircle,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  UploadCloud,
  User,
  UserCheck,
  UserCircle2,
  Wrench,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAsset, updateAsset, getAssets, type Asset } from "@/services/patrimonio-api";
import { downloadAttachmentFile } from "@/services/helpdesk-api";
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
import { Badge } from "@/components/ui/badge";
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
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppMessagePanel } from "@/components/tickets/WhatsAppMessagePanel";
import { TicketPrintDialog } from "@/components/tickets/TicketPrintDialog";
import { TicketSlaChip } from "@/features/tickets/TicketSlaChip";
import { TechnicalChecklist } from "@/components/tickets/TechnicalChecklist";
import { TicketSlaTimeline } from "@/components/tickets/TicketSlaTimeline";
import { TicketTimelineStepper } from "@/components/tickets/TicketTimelineStepper";
import { DigitalSignatureModal } from "@/components/tickets/DigitalSignatureModal";
import { soundEffects } from "@/lib/sound";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import { buildQuickDirectWhatsAppUrl } from "@/lib/whatsapp";
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

export const Route = createFileRoute("/app/chamados/$id")({
  validateSearch: () => ({}),
  head: () => ({ meta: [{ title: "Gerenciador de OS | AgroDesk TI" }] }),
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
            <CardDescription>Você não tem permissão para visualizar esta OS.</CardDescription>
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

// ─────────────────────────────────────────────────────────────────────────────
// Visão do Solicitante
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Visão do Solicitante
// ─────────────────────────────────────────────────────────────────────────────
function RequesterTicketView({ ticket }: { ticket: Ticket }) {
  const { departments, branches, categories, users, addComment, rateTicket, uploadAttachment, updateTicket } = useApp();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(ticket.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState(ticket.ratingComment ?? "");
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isReopening, setIsReopening] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicComments = ticket.comments.filter((entry) => !entry.internal);
  const isConcluded = ticket.status === "RESOLVIDO" || ticket.status === "FINALIZADO";
  const canRate = isConcluded;
  const isRated = Boolean(ticket.rating && ticket.rating > 0);

  const resolvedRefDate = ticket.closedAt || ticket.resolvedAt || ticket.updatedAt;
  const hoursSinceResolution = resolvedRefDate
    ? (Date.now() - new Date(resolvedRefDate).getTime()) / 3600000
    : 0;
  const canReopenDirectly = isConcluded && hoursSinceResolution <= 48;

  const assigneeName = getUserName(users, ticket.assigneeId);

  useEffect(() => {
    setRating(ticket.rating ?? 0);
    setRatingComment(ticket.ratingComment ?? "");
  }, [ticket.id, ticket.rating, ticket.ratingComment]);

  const handleAppendFiles = (newFilesList: FileList | File[] | null) => {
    if (!newFilesList || newFilesList.length === 0) return;
    const incoming = Array.from(newFilesList);

    setAttachmentFiles((prev) => {
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
        toast.info(`${duplicateCount} arquivo(s) duplicados foram ignorados.`);
      }
      if (nonDuplicates.length > 0) {
        toast.success(`${nonDuplicates.length} arquivo(s) selecionado(s).`);
      }

      return [...prev, ...nonDuplicates];
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setAttachmentFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const sendComment = async () => {
    const validation = commentSchema.safeParse({ content: comment });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Comentário inválido.");
      return;
    }

    try {
      await addComment(ticket.id, validation.data.content, false);
      setComment("");
      toast.success("Mensagem enviada para a equipe de TI.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível enviar comentário.";
      toast.error(message);
    }
  };

  const submitRating = async () => {
    if (!canRate) {
      toast.error("A avaliação fica disponível quando a OS estiver concluída ou finalizada.");
      return;
    }

    const validation = ratingSchema.safeParse({ rating });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    try {
      let finalComment = ratingComment.trim();
      if (selectedCompliments.length > 0) {
        const badgesStr = `[Destaques: ${selectedCompliments.join(", ")}]`;
        if (finalComment && !finalComment.includes("[Destaques:")) {
          finalComment = `${badgesStr}\n${finalComment}`;
        } else if (!finalComment) {
          finalComment = badgesStr;
        }
      }

      await rateTicket(ticket.id, validation.data.rating, finalComment);
      setIsRatingModalOpen(false);
      soundEffects.celebrate();
      toast.success("🎉 Avaliação registrada com sucesso! Muito obrigado pelo seu feedback.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível registrar avaliação.";
      toast.error(message);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error("Por favor, descreva o motivo da reabertura.");
      return;
    }
    setIsReopening(true);
    try {
      await updateTicket(ticket.id, { status: "REABERTO", internalNotes: reopenReason.trim() });
      setIsReopenModalOpen(false);
      setReopenReason("");
      toast.success("Ordem de Serviço reaberta com sucesso!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível reabrir a OS.";
      toast.error(message);
    } finally {
      setIsReopening(false);
    }
  };

  const submitAttachments = async () => {
    if (attachmentFiles.length === 0) {
      toast.error("Selecione pelo menos um arquivo para anexar.");
      return;
    }
    setIsUploadingAttachments(true);
    let successCount = 0;
    try {
      for (const file of attachmentFiles) {
        await uploadAttachment(ticket.id, file, false);
        successCount++;
      }
      setAttachmentFiles([]);
      toast.success(`${successCount} anexo(s) enviado(s) com sucesso.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar anexo.";
      toast.error(message);
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 fade-slide-up">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/app/meus-chamados"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar aos meus chamados
        </Link>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Printer className="size-3.5" /> Imprimir Comprovante
          </Button>
          <span className="font-mono text-xs text-muted-foreground">ID: {ticket.id}</span>
        </div>
      </div>

      {/* Banner de Solução Concluída e Destaque para Avaliação */}
      {isConcluded && (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-card p-6 shadow-lg space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/30 shadow-xs">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  Atendimento Concluído pelo Suporte de T.I.
                  <span className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {ticket.status === "FINALIZADO" ? "Finalizado" : "Resolvido"}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Atendido por <strong className="text-foreground">{assigneeName}</strong>. Confira a solução aplicada abaixo:
                </p>
              </div>
            </div>

            <div>
              {isRated ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRatingModalOpen(true)}
                  className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-2 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  Sua Nota: {ticket.rating}★ (Alterar)
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsRatingModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg hover:shadow-xl transition-all scale-105 hover:scale-110 cursor-pointer animate-pulse-soft"
                >
                  <Sparkles className="size-4 text-amber-300" />
                  ⭐ Avaliar Atendimento (Leva 10s)
                </Button>
              )}
            </div>
          </div>

          {ticket.solution ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-background/90 backdrop-blur p-4 space-y-1.5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Solução Técnica Aplicada:
              </span>
              <p className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                {ticket.solution}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/20 bg-background/60 p-3 text-xs text-muted-foreground">
              Atendimento concluído com sucesso pela equipe técnica.
            </div>
          )}

          {isRated && (
            <div className="rounded-2xl border bg-muted/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-muted-foreground">Sua Avaliação:</span>
                <div className="flex items-center text-amber-500 font-bold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < ticket.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                {ticket.ratingComment && (
                  <span className="text-foreground italic max-w-md truncate">
                    "{ticket.ratingComment}"
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ação de Reabertura ou Nova OS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-500/20">
            <div className="text-xs text-muted-foreground">
              {canReopenDirectly ? (
                <span>O problema voltou? Você pode reabrir esta OS em até 48 horas após a conclusão.</span>
              ) : (
                <span>O prazo de 48h para reabertura direta expirou. Caso precise, abra uma nova OS com referência a este chamado.</span>
              )}
            </div>

            {canReopenDirectly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReopenModalOpen(true)}
                className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
              >
                <RotateCcw className="size-3.5" /> Reabrir Chamado
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate({
                    to: "/app/nova-os",
                    search: {
                      ref: ticket.protocol,
                    } as any,
                  })
                }
                className="text-xs h-8 text-primary border-primary/30 hover:bg-primary/10 gap-1.5"
              >
                <PlusCircle className="size-3.5" /> Abrir Nova OS com Referência
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Linha do Tempo Visual */}
      <TicketTimelineStepper ticket={ticket} />

      {/* Hero Card */}
      <Card className="border shadow-[var(--shadow-card)] overflow-hidden bg-card">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-md shadow-sm">
                  {ticket.protocol}
                </span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.categoryId && (
                  <Badge variant="outline" className="bg-background/80">
                    {getCategoryName(categories, ticket.categoryId)}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-3 text-foreground">
                {ticket.title || "Ordem de Serviço"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Aberta em {formatDateTime(ticket.createdAt)} por {ticket.requesterName}
              </p>
            </div>

            <div className="bg-background/90 backdrop-blur rounded-2xl p-4 border shadow-sm flex flex-col items-end shrink-0">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Previsão de Atendimento
              </span>
              <TicketSlaChip
                createdAt={ticket.createdAt}
                slaHours={ticket.slaHours}
                closedAt={ticket.closedAt}
                status={ticket.status}
                slaDueAt={ticket.slaDueAt}
                showDetailed={true}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Alerta de Aguardando Usuário */}
          {ticket.status === "AGUARDANDO_USUARIO" && ticket.waitingRequesterMessage && (
            <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-5 animate-pulse-soft">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <AlertCircle className="size-5" /> A equipe de TI está aguardando seu retorno:
              </div>
              <p className="text-sm mt-2 text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                {ticket.waitingRequesterMessage}
              </p>
            </div>
          )}

          {/* Dados do Chamado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-muted/20 border text-sm">
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Setor</span>
              <span className="font-medium">{getDepartmentName(departments, ticket.departmentId)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Filial / Local</span>
              <span className="font-medium">{getBranchName(branches, ticket.branchId)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Equipamento / Patrimônio</span>
              <span className="font-medium">{ticket.equipment || ticket.assetTag || "-"}</span>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm tracking-wide text-foreground uppercase">
              Descrição Detalhada do Problema
            </h3>
            <div className="rounded-2xl border bg-background p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed shadow-sm">
              {ticket.description}
            </div>
          </div>

          {/* Anexos */}
          <div className="space-y-4 border-t pt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide text-foreground uppercase flex items-center gap-2">
                <Paperclip className="size-4 text-primary" /> Anexos e Documentos ({ticket.attachments.length})
              </h3>
              {attachmentFiles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachmentFiles([])}
                  className="text-xs h-7 text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3.5" /> Limpar seleção ({attachmentFiles.length})
                </Button>
              )}
            </div>

            {ticket.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum arquivo anexado nesta solicitação.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticket.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-xl border p-3 text-sm flex items-center justify-between gap-3 bg-muted/15 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(attachment.name)}
                      <div className="min-w-0">
                        <span className="truncate font-medium text-xs block text-foreground">{attachment.name}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">{attachment.sizeKb} KB</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-medium gap-1 shrink-0 cursor-pointer hover:bg-primary/10 hover:text-primary"
                      onClick={() => void downloadAttachmentFile(attachment.id, attachment.name)}
                    >
                      <Download className="size-3" /> Baixar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Multi-file selector dropzone */}
            <div className="space-y-2.5 pt-2">
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
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer select-none ${
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
                  disabled={isUploadingAttachments}
                  className="hidden"
                  onChange={(event) => {
                    handleAppendFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <UploadCloud className="size-4 text-primary" />
                    <span>Clique ou arraste arquivos para anexar</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span>Aceita todos os formatos (.OFX, .PDF, Imagens, XML, Planilhas)</span>
                </div>
              </div>

              {attachmentFiles.length > 0 && (
                <div className="rounded-xl border bg-card p-3 space-y-2 shadow-xs">
                  <div className="text-xs font-semibold text-muted-foreground px-1 flex items-center justify-between">
                    <span>Arquivos prontos para envio ({attachmentFiles.length}):</span>
                    <span>Total: {formatBytes(attachmentFiles.reduce((acc, f) => acc + f.size, 0))}</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {attachmentFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="rounded-lg border bg-muted/20 hover:bg-muted/40 p-2 text-xs flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(file.name)}
                          <span className="truncate font-medium">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({formatBytes(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          title="Remover arquivo"
                          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      disabled={isUploadingAttachments}
                      onClick={() => void submitAttachments()}
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <Paperclip className="size-3.5" />
                      {isUploadingAttachments ? "Enviando arquivos..." : `Enviar ${attachmentFiles.length} anexo(s)`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Comentários / Atendimento */}
      <Card className="shadow-[var(--shadow-card)] border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" /> Mensagens e Acompanhamento
          </CardTitle>
          <CardDescription>
            Converse diretamente com o técnico responsável pelo seu chamado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {publicComments.length === 0 ? (
              <EmptyState
                compact
                title="Nenhuma mensagem ainda"
                description="Envie uma mensagem abaixo se precisar adicionar informações ou dúvidas."
              />
            ) : (
              publicComments.map((entry) => (
                <div key={entry.id} className="rounded-2xl border p-4 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{entry.authorName}</span>
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label className="text-xs font-semibold">Adicionar Mensagem</Label>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Digite sua mensagem para o suporte de TI..."
              rows={3}
            />
            <Button onClick={() => void sendComment()}>
              <Send className="size-4" /> Enviar Mensagem
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Avaliação Convincente */}
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center sm:text-left">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-amber-500" /> Avalie o Atendimento de T.I.
            </DialogTitle>
            <DialogDescription>
              Sua opinião é fundamental para aprimorarmos continuamente o suporte aos colaboradores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Estrelas Interativas */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border space-y-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onMouseEnter={() => setHoverRating(score)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(score)}
                    className="p-1 rounded-xl transition-all transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`size-9 transition-colors ${
                        (hoverRating || rating) >= score
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "text-muted-foreground/30 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">
                {(() => {
                  const currentScore = hoverRating || rating;
                  if (currentScore === 1) return "1 estrela — Péssimo 😞";
                  if (currentScore === 2) return "2 estrelas — Ruim 😕";
                  if (currentScore === 3) return "3 estrelas — Regular 😐";
                  if (currentScore === 4) return "4 estrelas — Bom 🙂";
                  if (currentScore === 5) return "5 estrelas — Excelente! 🎉";
                  return "Clique nas estrelas para avaliar";
                })()}
              </span>
            </div>

            {/* Chips de Elogio Rápido */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                O que você mais gostou? (Opcional - Clique para selecionar)
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "🚀 Atendimento Rápido",
                  "👏 Muito Educado",
                  "💡 Resolveu de Primeira",
                  "🔧 Excelente Suporte Técnico",
                  "⚡ Solução Impecável",
                  "🤝 Ótima Comunicação",
                ].map((tag) => {
                  const isSelected = selectedCompliments.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedCompliments((prev) =>
                          isSelected ? prev.filter((t) => t !== tag) : [...prev, tag],
                        );
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs scale-102"
                          : "bg-background hover:bg-muted text-foreground border-border"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentário Adicional */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Comentário ou Sugestão (Opcional)</Label>
              <Textarea
                rows={3}
                placeholder="Deixe um elogio, observação ou sugestão para a equipe de TI..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void submitRating()}
              disabled={rating === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="size-4" /> Enviar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reabertura da OS (Janela de 48h) */}
      <Dialog open={isReopenModalOpen} onOpenChange={setIsReopenModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="size-5" /> Reabrir Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              Por favor, informe detalhadamente o que voltou a acontecer ou por que a solicitação precisa ser reaberta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Motivo da Reabertura *</Label>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Ex: O problema voltou a ocorrer logo após a finalização..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReopenModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReopen()}
              disabled={isReopening || !reopenReason.trim()}
            >
              {isReopening ? "Reabrindo..." : "Confirmar Reabertura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão da OS */}
      <TicketPrintDialog
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        ticket={ticket}
        departments={departments}
        branches={branches}
        categories={categories}
        assigneeName={assigneeName}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos auxiliares do Admin
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Visão TI_ADMIN com Hierarquia Vertical e Central de Ações Inferior
// ─────────────────────────────────────────────────────────────────────────────
function AdminTicketView({ ticket }: { ticket: Ticket }) {
  const {
    currentUser,
    users,
    departments,
    branches,
    categories,
    audit,
    addComment,
    updateTicket,
    extendTicketSla,
    uploadAttachment,
    registerWhatsappPrepared,
  } = useApp();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const admins = users.filter(
    (user) => user.role === "TI_ADMIN" && user.active && user.canReceiveTickets,
  );

  const queryClient = useQueryClient();
  const [publicComment, setPublicComment] = useState("");
  const [internalComment, setInternalComment] = useState("");
  const [adminAttachmentFiles, setAdminAttachmentFiles] = useState<File[]>([]);
  const [isAdminUploadingAttachments, setIsAdminUploadingAttachments] = useState(false);
  const [isAdminDragging, setIsAdminDragging] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdminAppendFiles = (newFilesList: FileList | File[] | null) => {
    if (!newFilesList || newFilesList.length === 0) return;
    const incoming = Array.from(newFilesList);

    setAdminAttachmentFiles((prev) => {
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
        toast.info(`${duplicateCount} arquivo(s) duplicados foram ignorados.`);
      }
      if (nonDuplicates.length > 0) {
        toast.success(`${nonDuplicates.length} arquivo(s) selecionado(s).`);
      }

      return [...prev, ...nonDuplicates];
    });
  };

  const handleAdminRemoveFile = (indexToRemove: number) => {
    setAdminAttachmentFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Modais de Controle e Transição de Status
  const [waitingReasonOpen, setWaitingReasonOpen] = useState(false);
  const [waitingReason, setWaitingReason] = useState("");
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [resolutionTargetStatus, setResolutionTargetStatus] = useState<"RESOLVIDO" | "FINALIZADO">("FINALIZADO");
  const [isWaitingPartsOpen, setIsWaitingPartsOpen] = useState(false);
  const [waitingPartsItem, setWaitingPartsItem] = useState("");
  const [waitingPartsForecast, setWaitingPartsForecast] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isExtendSlaOpen, setIsExtendSlaOpen] = useState(false);
  const [slaExtendHours, setSlaExtendHours] = useState<number>(24);
  const [slaExtendReason, setSlaExtendReason] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmationAction | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);

  const handleConfirmSignature = async (dataUrl: string, signerName: string, documentId?: string) => {
    const note = `✍️ Assinatura digital coletada confirmando o atendimento / entrega do equipamento.\n• Responsável pelo Recebimento: ${signerName}${documentId ? `\n• Documento / Matrícula: ${documentId}` : ""}`;
    await addComment(ticket.id, note, false);

    try {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], `Assinatura_${ticket.protocol}_${Date.now()}.png`, { type: mime });
      await uploadAttachment(ticket.id, file);
    } catch (e) {
      console.error("Erro ao converter assinatura para anexo:", e);
    }
  };

  // Troca de Periférico
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
      await updateAsset(activeReplacementComp.id, {
        parentId: undefined,
        status: "MANUTENCAO" as any,
      });

      await updateAsset(newAsset.id, {
        parentId: ticket.assetId!,
        status: "EM_USO" as any,
        branchId: ticket.branchId,
        departmentId: ticket.departmentId,
      });

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
    } catch {
      toast.error("Falha ao realizar a substituição do periférico.");
    }
  };

  // Formulário de Edição
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

  // Formulário Técnico
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

  const publicComments = ticket.comments.filter((entry) => !entry.internal);
  const internalComments = ticket.comments.filter((entry) => entry.internal);

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      setConfirmingAction(true);
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch {
      // Handled in callback
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
        "Preencha os campos obrigatórios: solicitante, telefone, setor, filial e descrição.",
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
      toast.success("Dados da OS atualizados e SLA recalculado com sucesso.");
      setIsEditModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar edição da OS.";
      toast.error(message);
    }
  };

  const saveTechnicalData = async () => {
    if (technical.timeSpentMinutes && Number.isNaN(Number(technical.timeSpentMinutes))) {
      toast.error("Tempo gasto deve ser um número válido em minutos.");
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
      toast.success("Dados técnicos salvos com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar dados técnicos.";
      toast.error(message);
    }
  };

  const handleExtendSla = async () => {
    if (!slaExtendHours || slaExtendHours <= 0) {
      toast.error("Informe a quantidade de horas para prorrogação.");
      return;
    }
    if (!slaExtendReason.trim()) {
      toast.error("Informe a justificativa/motivo para a prorrogação de prazo.");
      return;
    }

    try {
      await extendTicketSla(ticket.id, {
        extendHours: slaExtendHours,
        reason: slaExtendReason.trim(),
      });
      toast.success(`Prazo de SLA prorrogado com sucesso (+${slaExtendHours}h).`);
      setIsExtendSlaOpen(false);
      setSlaExtendReason("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao prorrogar prazo.";
      toast.error(message);
    }
  };

  const postPublic = async () => {
    const validation = commentSchema.safeParse({ content: publicComment });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Comentário inválido.");
      return;
    }

    try {
      await addComment(ticket.id, validation.data.content, false);
      setPublicComment("");
      toast.success("Comentário público enviado ao solicitante.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível enviar comentário.";
      toast.error(message);
    }
  };

  const postInternal = async () => {
    const validation = commentSchema.safeParse({ content: internalComment });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Comentário inválido.");
      return;
    }

    try {
      await addComment(ticket.id, validation.data.content, true);
      setInternalComment("");
      toast.success("Nota interna salva.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar nota interna.";
      toast.error(message);
    }
  };

  const submitAdminAttachments = async (internal: boolean) => {
    if (adminAttachmentFiles.length === 0) {
      toast.error("Selecione pelo menos um arquivo para anexar.");
      return;
    }
    setIsAdminUploadingAttachments(true);
    let successCount = 0;
    try {
      for (const file of adminAttachmentFiles) {
        await uploadAttachment(ticket.id, file, internal);
        successCount++;
      }
      setAdminAttachmentFiles([]);
      toast.success(
        internal
          ? `${successCount} anexo(s) interno(s) enviado(s).`
          : `${successCount} anexo(s) público(s) enviado(s).`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível anexar arquivo.";
      toast.error(message);
    } finally {
      setIsAdminUploadingAttachments(false);
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
      const message = error instanceof Error ? error.message : "Não foi possível alterar status.";
      toast.error(message);
      throw error;
    }
  };

  const queueStatusConfirmation = (nextStatus: Ticket["status"], statusNote?: string) => {
    setConfirmAction({
      title: "Confirmar alteração de status",
      description: `A OS ${ticket.protocol} será movida para ${statusLabel[nextStatus]}. Essa ação gera histórico e auditoria.`,
      confirmLabel: `Mover para ${statusLabel[nextStatus]}`,
      destructive: nextStatus === "CANCELADO",
      onConfirm: () => actionChangeStatus(nextStatus, statusNote),
    });
  };

  const queueStatusChange = (nextStatus: Ticket["status"]) => {
    if (nextStatus === ticket.status) return;

    if (nextStatus === "RESOLVIDO" || nextStatus === "FINALIZADO") {
      setResolutionTargetStatus(nextStatus);
      setIsResolutionModalOpen(true);
      return;
    }

    if (nextStatus === "AGUARDANDO_USUARIO") {
      setWaitingReason(ticket.waitingRequesterMessage ?? "");
      setWaitingReasonOpen(true);
      return;
    }

    if (nextStatus === "AGUARDANDO_PECA") {
      setWaitingPartsItem("");
      setWaitingPartsForecast("");
      setIsWaitingPartsOpen(true);
      return;
    }

    if (nextStatus === "CANCELADO") {
      setCancelReason("");
      setIsCancelModalOpen(true);
      return;
    }

    if (nextStatus === "REABERTO") {
      setReopenReason("");
      setIsReopenModalOpen(true);
      return;
    }

    if (nextStatus === "EM_ATENDIMENTO") {
      setConfirmAction({
        title: "Iniciar Atendimento Técnico",
        description: `Deseja mover a OS ${ticket.protocol} para "Em Atendimento"? O solicitante poderá acompanhar a evolução do atendimento.`,
        confirmLabel: "▶️ Iniciar Atendimento",
        destructive: false,
        onConfirm: () => actionChangeStatus("EM_ATENDIMENTO", "Atendimento técnico iniciado"),
      });
      return;
    }

    queueStatusConfirmation(nextStatus);
  };

  const confirmWaitingReason = () => {
    const note = waitingReason.trim();
    if (!note) {
      toast.error("Informe o que está sendo aguardado do solicitante.");
      return;
    }
    setWaitingReasonOpen(false);
    queueStatusConfirmation("AGUARDANDO_USUARIO", note);
  };

  const handleConfirmResolution = async () => {
    const solutionText = technical.solution.trim();
    if (!solutionText) {
      toast.error("Por favor, descreva a solução aplicada para concluir a OS.");
      return;
    }

    try {
      await updateTicket(
        ticket.id,
        {
          status: resolutionTargetStatus,
          solution: solutionText,
          diagnosis: technical.diagnosis.trim() || undefined,
          rootCause: technical.rootCause.trim() || undefined,
          partsUsed: technical.partsUsed.trim() || undefined,
          timeSpentMinutes: technical.timeSpentMinutes ? Number(technical.timeSpentMinutes) : undefined,
          resolutionSummary: technical.resolutionSummary.trim() || undefined,
          internalNotes: technical.internalNotes.trim() || undefined,
        },
        {
          statusAction: resolutionTargetStatus === "FINALIZADO" ? "FINALIZE" : "RESOLVE",
          statusNote: `✅ Solução: ${solutionText}`,
        },
      );

      await addComment(
        ticket.id,
        `🎉 Atendimento Concluído:\n• Solução Aplicada: ${solutionText}${technical.partsUsed ? `\n• Peças/Itens: ${technical.partsUsed}` : ""}`,
        false,
      );

      setIsResolutionModalOpen(false);
      toast.success(
        `Ordem de Serviço ${resolutionTargetStatus === "FINALIZADO" ? "finalizada" : "resolvida"} com sucesso!`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir a OS.";
      toast.error(message);
    }
  };

  const handleConfirmWaitingParts = async () => {
    const item = waitingPartsItem.trim();
    if (!item) {
      toast.error("Informe qual peça ou componente está sendo aguardado.");
      return;
    }

    const note = `📦 Aguardando Peça: ${item}${waitingPartsForecast.trim() ? ` (Previsão: ${waitingPartsForecast.trim()})` : ""}`;
    try {
      await updateTicket(
        ticket.id,
        { status: "AGUARDANDO_PECA" },
        { statusAction: "UPDATE", statusNote: note },
      );
      await addComment(ticket.id, note, false);
      setIsWaitingPartsOpen(false);
      toast.success("Status alterado para Aguardando Peça.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível alterar status.";
      toast.error(message);
    }
  };

  const handleConfirmCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error("Informe a justificativa do cancelamento.");
      return;
    }

    try {
      await updateTicket(
        ticket.id,
        { status: "CANCELADO" },
        { statusAction: "CANCEL", statusNote: `❌ Cancelado: ${reason}` },
      );
      await addComment(ticket.id, `❌ Chamado Cancelado:\nJustificativa: ${reason}`, false);
      setIsCancelModalOpen(false);
      toast.success("Ordem de Serviço cancelada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível cancelar a OS.";
      toast.error(message);
    }
  };

  const handleConfirmReopen = async () => {
    const reason = reopenReason.trim();
    if (!reason) {
      toast.error("Informe a justificativa da reabertura.");
      return;
    }

    try {
      await updateTicket(
        ticket.id,
        { status: "REABERTO" },
        { statusAction: "REOPEN", statusNote: `🔄 Reaberto: ${reason}` },
      );
      await addComment(ticket.id, `🔄 Chamado Reaberto:\nMotivo: ${reason}`, false);
      setIsReopenModalOpen(false);
      toast.success("Ordem de Serviço reaberta.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível reabrir a OS.";
      toast.error(message);
    }
  };

  const actionChangePriority = async (priority: Ticket["priority"]) => {
    try {
      await updateTicket(ticket.id, { priority });
      toast.success(`Prioridade alterada para ${priorityLabel[priority]}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível alterar prioridade.";
      toast.error(message);
    }
  };

  const actionChangeAssignee = async (assigneeId?: string) => {
    try {
      await updateTicket(ticket.id, { assigneeId });
      toast.success(
        assigneeId
          ? `Responsável definido: ${getUserName(users, assigneeId)}.`
          : "OS sem responsável definido.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível alterar responsável.";
      toast.error(message);
    }
  };

  const copyProtocol = () => {
    navigator.clipboard.writeText(ticket.protocol);
    toast.success("Protocolo copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 fade-slide-up">
      {/* Top Breadcrumb & Quick Info */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/app/chamados"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar para Gestão de OS
        </Link>
        <div className="flex items-center gap-2.5 flex-wrap">
          {ticket.requesterPhone && (
            <a
              href={buildQuickDirectWhatsAppUrl(ticket, { technicianName: currentUser?.name }) || `https://wa.me/55${ticket.requesterPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Conversar diretamente com o solicitante no WhatsApp"
            >
              <MessageCircle className="size-3.5" /> Chamar no WhatsApp
            </a>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Printer className="size-3.5" /> Imprimir OS
          </Button>
          <span className="text-xs text-muted-foreground font-mono">ID: {ticket.id}</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* HERO BANNER VERTICAL / OVERVIEW                                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <Card className="shadow-[var(--shadow-card)] border overflow-hidden bg-card">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Lado Esquerdo: Protocolo + Título + Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyProtocol}
                  title="Clique para copiar o protocolo"
                  className="group inline-flex items-center gap-1.5 font-mono text-sm font-bold bg-primary text-primary-foreground px-3 py-1 rounded-lg shadow-sm hover:opacity-90 transition active:scale-95"
                >
                  {ticket.protocol}
                  <Copy className="size-3.5 opacity-70 group-hover:opacity-100" />
                </button>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.categoryId && (
                  <Badge variant="outline" className="bg-background/80 font-medium">
                    {getCategoryName(categories, ticket.categoryId)}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {ticket.title || "Ordem de Serviço"}
              </h1>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="size-3.5" /> Solicitante: <strong>{ticket.requesterName}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {getDepartmentName(departments, ticket.departmentId)} - {getBranchName(branches, ticket.branchId)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserCheck className="size-3.5" /> Responsável:{" "}
                  <strong>{ticket.assigneeId ? getUserName(users, ticket.assigneeId) : "Não atribuído"}</strong>
                </span>
              </div>
            </div>

            {/* Lado Direito: SLA Countdown Vivo & Prorrogação Rápida */}
            <div className="bg-background/95 backdrop-blur rounded-2xl p-4 border shadow-sm flex flex-col items-start lg:items-end gap-2 shrink-0 min-w-[240px]">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Prazo de Atendimento (SLA)
              </span>
              <TicketSlaChip
                createdAt={ticket.createdAt}
                slaHours={ticket.slaHours}
                closedAt={ticket.closedAt}
                status={ticket.status}
                slaDueAt={ticket.slaDueAt}
                showDetailed={true}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold text-primary hover:text-primary gap-1 mt-1 w-full"
                onClick={() => setIsExtendSlaOpen(true)}
              >
                <Clock className="size-3.5" /> Prorrogar Prazo de SLA
              </Button>
            </div>
          </div>
        </div>

        {/* Barra Rápida de Atribuição e Prioridade Real */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/20 border-b text-sm">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Responsável Técnico</Label>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
              value={ticket.assigneeId ?? ""}
              onChange={(e) => void actionChangeAssignee(e.target.value || undefined)}
            >
              <option value="">-- Sem Responsável Atribuído --</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Prioridade Real (T.I.)</Label>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
              value={ticket.priority}
              onChange={(e) => void actionChangePriority(e.target.value as Ticket["priority"])}
            >
              {PRIORITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {priorityLabel[level]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Alterar Status Rápido</Label>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
              value={ticket.status}
              onChange={(e) => queueStatusChange(e.target.value as Ticket["status"])}
            >
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* CORPO VERTICAL DE SEÇÕES ESTRUTURADAS                                 */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      {/* Linha do Tempo Visual da OS */}
      <TicketTimelineStepper ticket={ticket} />

      {/* Alerta de Mensagem Aguardada */}
      {ticket.status === "AGUARDANDO_USUARIO" && ticket.waitingRequesterMessage && (
        <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <AlertCircle className="size-5" /> Aguardando Retorno do Solicitante:
          </div>
          <p className="text-sm mt-2 text-foreground font-medium whitespace-pre-wrap leading-relaxed">
            {ticket.waitingRequesterMessage}
          </p>
        </div>
      )}

      {/* CARD 1: Solicitante & Localização */}
      <Card className="shadow-[var(--shadow-card)] border bg-card hover-card-premium">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <User className="size-4 text-primary" /> 1. Dados do Solicitante e Localização
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-primary gap-1"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 className="size-3.5" /> Editar Dados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Nome Completo</span>
              <span className="font-semibold text-foreground">{ticket.requesterName}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Telefone / Contato</span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-medium">{ticket.requesterPhone || "-"}</span>
                {ticket.requesterPhone && (
                  <a
                    href={buildQuickDirectWhatsAppUrl(ticket, { technicianName: currentUser?.name }) || `https://wa.me/55${ticket.requesterPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all border border-emerald-500/30 cursor-pointer"
                    title="Abrir conversa direta no WhatsApp"
                  >
                    <MessageCircle className="size-3" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">E-mail</span>
              <span className="font-medium text-muted-foreground">{ticket.requesterEmail || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Setor</span>
              <span className="font-medium">{getDepartmentName(departments, ticket.departmentId)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Filial / Unidade</span>
              <span className="font-medium">{formatBranchName(getBranchName(branches, ticket.branchId))}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Melhor Horário para Atendimento</span>
              <span className="font-medium">{ticket.bestTime || "Horário comercial padrão"}</span>
            </div>
            {ticket.impact && (
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-xs text-muted-foreground block font-semibold">Impacto na Operação</span>
                <span className="font-medium text-foreground">{ticket.impact}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: Equipamento e Periféricos Vinculados */}
      <Card className="shadow-[var(--shadow-card)] border bg-card hover-card-premium">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <Laptop className="size-4 text-primary" /> 2. Equipamento e Periféricos Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {assetDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div>
                  <span className="text-xs text-muted-foreground block font-semibold">Patrimônio / Código</span>
                  <span className="font-mono font-bold text-primary text-base">{assetDetail.code}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-semibold">Nome do Equipamento</span>
                  <span className="font-bold text-foreground">{assetDetail.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-semibold">Hostname</span>
                  <span className="font-mono font-bold text-foreground">{assetDetail.hostname || "-"}</span>
                </div>
              </div>

              {/* Periféricos associados */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Periféricos Vinculados ao Equipamento
                </h4>
                {!assetDetail.components || assetDetail.components.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 rounded-lg border bg-muted/10">
                    Nenhum periférico (mouse, teclado, monitor, nobreak) vinculado a esta máquina.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {assetDetail.components.map((comp: any) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{comp.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{comp.code}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-semibold text-primary hover:text-primary shrink-0"
                          onClick={() => {
                            setActiveReplacementComp(comp);
                            setIsReplacingOpen(true);
                          }}
                        >
                          <RefreshCw className="size-3 mr-1" /> Trocar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block font-semibold">Equipamento Declarado</span>
                <span className="font-medium">{ticket.equipment || "Não informado"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-semibold">Código de Patrimônio</span>
                <span className="font-mono font-medium">{ticket.assetTag || "Não informado"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 3: Descrição e Evidências */}
      <Card className="shadow-[var(--shadow-card)] border bg-card hover-card-premium">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <FileText className="size-4 text-primary" /> 3. Descrição do Problema e Anexos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Relato do Solicitante
            </h4>
            <div className="rounded-2xl border bg-background p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed shadow-sm font-normal">
              {ticket.description}
            </div>
          </div>

          {ticket.additionalNotes && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Observações Adicionais
              </h4>
              <div className="rounded-xl border bg-muted/15 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.additionalNotes}
              </div>
            </div>
          )}

          {/* Anexos */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="size-3.5" /> Arquivos Anexados ({ticket.attachments.length})
              </h4>
              {adminAttachmentFiles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminAttachmentFiles([])}
                  className="text-xs h-7 text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3.5" /> Limpar seleção ({adminAttachmentFiles.length})
                </Button>
              )}
            </div>

            {ticket.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum anexo nesta OS.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="rounded-xl border p-3 text-xs flex items-center justify-between gap-3 bg-muted/15 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(att.name)}
                      <div className="min-w-0">
                        <span className="truncate font-semibold block text-foreground">{att.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">{att.sizeKb} KB</span>
                          {att.internal && (
                            <span className="text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">
                              Interno
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-medium gap-1 shrink-0 cursor-pointer hover:bg-primary/10 hover:text-primary"
                      onClick={() => void downloadAttachmentFile(att.id, att.name)}
                    >
                      <Download className="size-3" /> Baixar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Multi-file selector dropzone for Admin */}
            <div className="space-y-2.5 pt-2">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsAdminDragging(true);
                }}
                onDragLeave={() => setIsAdminDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsAdminDragging(false);
                  handleAdminAppendFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer select-none ${
                  isAdminDragging
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10"
                }`}
                onClick={() => adminFileInputRef.current?.click()}
              >
                <input
                  ref={adminFileInputRef}
                  type="file"
                  multiple
                  disabled={isAdminUploadingAttachments}
                  className="hidden"
                  onChange={(event) => {
                    handleAdminAppendFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <UploadCloud className="size-4 text-primary" />
                    <span>Clique ou arraste arquivos para anexar</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span>Aceita todos os formatos (.OFX, .PDF, Imagens, XML, Planilhas, etc.)</span>
                </div>
              </div>

              {adminAttachmentFiles.length > 0 && (
                <div className="rounded-xl border bg-card p-3 space-y-2 shadow-xs">
                  <div className="text-xs font-semibold text-muted-foreground px-1 flex items-center justify-between">
                    <span>Arquivos prontos para upload ({adminAttachmentFiles.length}):</span>
                    <span>Total: {formatBytes(adminAttachmentFiles.reduce((acc, f) => acc + f.size, 0))}</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {adminAttachmentFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="rounded-lg border bg-muted/20 hover:bg-muted/40 p-2 text-xs flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(file.name)}
                          <span className="truncate font-medium">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({formatBytes(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminRemoveFile(idx);
                          }}
                          title="Remover arquivo"
                          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAdminUploadingAttachments}
                      onClick={() => void submitAdminAttachments(false)}
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <Paperclip className="size-3.5" />
                      {isAdminUploadingAttachments ? "Enviando..." : `Enviar Público (${adminAttachmentFiles.length})`}
                    </Button>
                    <Button
                      size="sm"
                      disabled={isAdminUploadingAttachments}
                      onClick={() => void submitAdminAttachments(true)}
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <Shield className="size-3.5" />
                      {isAdminUploadingAttachments ? "Enviando..." : `Enviar Interno T.I. (${adminAttachmentFiles.length})`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: Área Técnica Interna e Solução */}
      <Card className="shadow-[var(--shadow-card)] border bg-card border-primary/20 hover-card-premium">
        <CardHeader className="pb-3 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
                <Wrench className="size-4 text-primary" /> 4. Diagnóstico Técnico e Resolução (Área da TI)
              </CardTitle>
              <CardDescription className="text-xs">
                Registre os dados técnicos para o histórico, relatórios e base de conhecimento.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => void saveTechnicalData()}>
              <CheckCircle2 className="size-4 mr-1.5" /> Salvar Dados Técnicos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Diagnóstico Técnico</Label>
              <Textarea
                rows={3}
                placeholder="Ex: Falha na fonte de alimentação de 500W devido a sobretensão na rede elétrica..."
                value={technical.diagnosis}
                onChange={(e) => updateTechnicalForm("diagnosis", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Causa Raiz do Problema</Label>
              <Textarea
                rows={3}
                placeholder="Ex: Desgaste natural de componentes / Instabilidade de energia no setor..."
                value={technical.rootCause}
                onChange={(e) => updateTechnicalForm("rootCause", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Solução Aplicada (Visível ao Solicitante no Encerramento)
            </Label>
            <Textarea
              rows={3}
              placeholder="Ex: Realizada substituição da fonte por uma nova de 600W 80 Plus e testado o funcionamento por 30 minutos com sucesso."
              value={technical.solution}
              onChange={(e) => updateTechnicalForm("solution", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Peças / Equipamentos Utilizados</Label>
              <Input
                placeholder="Ex: Fonte Corsair 600W, Cabo de Força"
                value={technical.partsUsed}
                onChange={(e) => updateTechnicalForm("partsUsed", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tempo Gasto (em Minutos)</Label>
              <Input
                type="number"
                placeholder="Ex: 45"
                value={technical.timeSpentMinutes}
                onChange={(e) => updateTechnicalForm("timeSpentMinutes", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Resumo para Relatório</Label>
              <Input
                placeholder="Ex: Troca de fonte concluída"
                value={technical.resolutionSummary}
                onChange={(e) => updateTechnicalForm("resolutionSummary", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Observações Internas (Privadas da TI)</Label>
            <Textarea
              rows={2}
              placeholder="Anotações para a equipe técnica sobre o atendimento..."
              value={technical.internalNotes}
              onChange={(e) => updateTechnicalForm("internalNotes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* CARD 4.5: Checklist Técnico Operacional e Timeline Visual de SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TechnicalChecklist
          categoryName={getCategoryName(categories, ticket.categoryId)}
          ticketId={ticket.id}
          onSaveChecklist={async (items, progressPercent) => {
            const summary = `📋 Checklist operacional atualizado (${progressPercent}%):\n${items.map((i) => `• [x] ${i}`).join("\n")}`;
            await addComment(ticket.id, summary, true);
          }}
        />
        <TicketSlaTimeline ticket={ticket} />
      </div>

      {/* CARD 5: Linha do Tempo e Comunicação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comentários Públicos e Internos */}
        <Card className="shadow-[var(--shadow-card)] border bg-card">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <MessageSquareText className="size-4 text-primary" /> Mensagens e Notas da OS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* Mensagens Públicas */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3.5" /> Comunicação com Solicitante
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {publicComments.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 border rounded-xl bg-muted/10">
                    Nenhuma mensagem pública registrada.
                  </p>
                ) : (
                  publicComments.map((c) => (
                    <div key={c.id} className="rounded-xl border p-3 bg-muted/15 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{c.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  className="text-xs"
                  placeholder="Mensagem para o solicitante..."
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void postPublic();
                  }}
                />
                <Button size="sm" onClick={() => void postPublic()}>
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Notas Internas da TI */}
            <div className="space-y-3 border-t pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" /> Notas Internas da Equipe de TI
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {internalComments.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 border rounded-xl bg-muted/10">
                    Nenhuma nota interna registrada.
                  </p>
                ) : (
                  internalComments.map((c) => (
                    <div key={c.id} className="rounded-xl border border-primary/20 p-3 bg-primary/5 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-primary">
                        <span>{c.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  className="text-xs"
                  placeholder="Anotação interna da TI..."
                  value={internalComment}
                  onChange={(e) => setInternalComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void postInternal();
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => void postInternal()}>
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Status e Auditoria */}
        <Card className="shadow-[var(--shadow-card)] border bg-card">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <History className="size-4 text-primary" /> Linha do Tempo e Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {ticket.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 border rounded-xl bg-muted/10">
                  Nenhuma alteração de status registrada até o momento.
                </p>
              ) : (
                ticket.statusHistory.map((item, index) => (
                  <div key={item.id} className="relative pl-6 pb-4 border-l last:border-l-0 border-primary/30 text-xs">
                    <div className="absolute -left-1.5 top-0 size-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground">
                        {statusLabel[item.status]}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">Por: {item.changedByName}</p>
                    {item.note && (
                      <p className="mt-1 text-foreground/90 bg-muted/20 p-2 rounded-lg border text-[11px] whitespace-pre-wrap">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel do WhatsApp */}
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

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* CENTRAL DE AÇÕES INFERIOR (BOTTOM ACTION HUB)                          */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-primary/30 bg-card/95 backdrop-blur shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-6 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Central de Ações e Fluxo de Atendimento
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Execute as ações operacionais da Ordem de Serviço com um clique.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              onClick={() => setIsSignatureModalOpen(true)}
            >
              <PenTool className="size-3.5" /> Assinatura Digital
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 className="size-3.5" /> Editar Dados da OS
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 text-primary"
              onClick={() => setIsExtendSlaOpen(true)}
            >
              <Clock className="size-3.5" /> Prorrogar Prazo (SLA)
            </Button>
          </div>
        </div>

        {/* Grade de Botões de Ação de Status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          <Button
            variant={ticket.status === "EM_ATENDIMENTO" ? "default" : "outline"}
            className={cn(
              "h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 transition-all",
              ticket.status === "EM_ATENDIMENTO" && "bg-blue-600 hover:bg-blue-700 shadow-md",
            )}
            onClick={() => queueStatusChange("EM_ATENDIMENTO")}
          >
            <span>▶️ Em Atendimento</span>
          </Button>

          <Button
            variant={ticket.status === "AGUARDANDO_USUARIO" ? "default" : "outline"}
            className={cn(
              "h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 transition-all",
              ticket.status === "AGUARDANDO_USUARIO" && "bg-amber-600 hover:bg-amber-700 shadow-md",
            )}
            onClick={() => queueStatusChange("AGUARDANDO_USUARIO")}
          >
            <span>⏸️ Aguardar Usuário</span>
          </Button>

          <Button
            variant={ticket.status === "AGUARDANDO_PECA" ? "default" : "outline"}
            className={cn(
              "h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 transition-all",
              ticket.status === "AGUARDANDO_PECA" && "bg-amber-600 hover:bg-amber-700 shadow-md",
            )}
            onClick={() => queueStatusChange("AGUARDANDO_PECA")}
          >
            <span>📦 Aguardar Peça</span>
          </Button>

          <Button
            variant={ticket.status === "RESOLVIDO" ? "default" : "outline"}
            className={cn(
              "h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 transition-all",
              ticket.status === "RESOLVIDO" && "bg-emerald-600 hover:bg-emerald-700 shadow-md",
            )}
            onClick={() => queueStatusChange("RESOLVIDO")}
          >
            <span>✅ Resolver OS</span>
          </Button>

          <Button
            variant={ticket.status === "FINALIZADO" ? "default" : "outline"}
            className={cn(
              "h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 transition-all",
              ticket.status === "FINALIZADO" && "bg-emerald-700 hover:bg-emerald-800 shadow-md",
            )}
            onClick={() => queueStatusChange("FINALIZADO")}
          >
            <span>🎉 Finalizar OS</span>
          </Button>

          <Button
            variant="outline"
            className="h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 hover:bg-muted"
            onClick={() => queueStatusChange("REABERTO")}
          >
            <span>🔄 Reabrir OS</span>
          </Button>

          <Button
            variant="outline"
            className="h-12 flex flex-col items-center justify-center text-xs font-bold gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            onClick={() => queueStatusChange("CANCELADO")}
          >
            <span>❌ Cancelar OS</span>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAIS                                                                */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      {/* Modal de Prorrogação de Prazo (SLA) */}
      <Dialog open={isExtendSlaOpen} onOpenChange={setIsExtendSlaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-5 text-primary" /> Prorrogar Prazo de Resolução (SLA)
            </DialogTitle>
            <DialogDescription>
              Aumente o tempo limite para conclusão desta OS devido a situações atípicas (ex: aguardo de peças ou aprovação).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Opções Rápidas de Extensão</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { hours: 24, label: "+24h (1d)" },
                  { hours: 48, label: "+48h (2d)" },
                  { hours: 72, label: "+72h (3d)" },
                  { hours: 168, label: "+7 dias" },
                ].map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setSlaExtendHours(item.hours)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-bold transition",
                      slaExtendHours === item.hours
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Quantidade de Horas a Adicionar</Label>
              <Input
                type="number"
                min={1}
                value={slaExtendHours}
                onChange={(e) => setSlaExtendHours(Number(e.target.value || 1))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Justificativa / Motivo da Prorrogação *</Label>
              <Textarea
                rows={3}
                placeholder="Ex: Aguardando entrega de nova placa de rede solicitada ao fornecedor..."
                value={slaExtendReason}
                onChange={(e) => setSlaExtendReason(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                A justificativa será gravada no histórico da OS e na auditoria do sistema.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendSlaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleExtendSla()}>Confirmar Prorrogação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição dos Dados da OS */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="size-5 text-primary" /> Editar Dados da Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              Ao alterar a categoria, o prazo de SLA é recalculado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">Título da OS</Label>
                <Input
                  value={ticketForm.title}
                  onChange={(e) => updateTicketForm("title", e.target.value)}
                  placeholder="Resumo do problema"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Nome do Solicitante *</Label>
                <Input
                  value={ticketForm.requesterName}
                  onChange={(e) => updateTicketForm("requesterName", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Telefone / WhatsApp *</Label>
                <Input
                  value={ticketForm.requesterPhone}
                  onChange={(e) => updateTicketForm("requesterPhone", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Setor *</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={ticketForm.departmentId}
                  onChange={(e) => updateTicketForm("departmentId", e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Filial / Local *</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={ticketForm.branchId}
                  onChange={(e) => updateTicketForm("branchId", e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {formatBranchName(b.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Categoria (Recalcula SLA)</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={ticketForm.categoryId}
                  onChange={(e) => {
                    updateTicketForm("categoryId", e.target.value);
                    updateTicketForm("subcategory", "");
                  }}
                >
                  <option value="">Sem Categoria (SLA Padrão 24h)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (SLA: {c.defaultSlaHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Subcategoria</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={ticketForm.subcategory}
                  onChange={(e) => updateTicketForm("subcategory", e.target.value)}
                  disabled={availableSubcategories.length === 0}
                >
                  <option value="">Selecione uma subcategoria...</option>
                  {availableSubcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Equipamento</Label>
                <Input
                  value={ticketForm.equipment}
                  onChange={(e) => updateTicketForm("equipment", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Patrimônio</Label>
                <Input
                  value={ticketForm.assetTag}
                  onChange={(e) => updateTicketForm("assetTag", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Descrição do Problema *</Label>
              <Textarea
                rows={4}
                value={ticketForm.description}
                onChange={(e) => updateTicketForm("description", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveTicketEdits()}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Aguardar Usuário */}
      <Dialog open={waitingReasonOpen} onOpenChange={setWaitingReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O que você precisa que o solicitante responda?</DialogTitle>
            <DialogDescription>
              Este texto é obrigatório para mover para "Aguardando resposta do solicitante". Ele
              ficará visível em destaque para o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Mensagem para o Solicitante</Label>
            <Textarea
              rows={4}
              value={waitingReason}
              onChange={(event) => setWaitingReason(event.target.value)}
              placeholder="Ex: Envie uma foto do erro ou confirme o melhor horário para acesso remoto."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaitingReasonOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmWaitingReason}>Salvar e Mover Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Obrigatório de Resolução / Finalização */}
      <Dialog open={isResolutionModalOpen} onOpenChange={setIsResolutionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              Conclusão da Ordem de Serviço ({resolutionTargetStatus === "FINALIZADO" ? "Finalizar OS" : "Resolver OS"})
            </DialogTitle>
            <DialogDescription>
              Descreva a solução técnica aplicada. Este texto é obrigatório e ficará visível em destaque para o solicitante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Solução Técnica Aplicada * (Visível ao Solicitante)
              </Label>
              <Textarea
                rows={4}
                required
                placeholder="Descreva detalhadamente o que foi feito para resolver o problema... Ex: Realizada substituição do cabo de rede defeituoso, configurado IP estático e testado acesso aos sistemas internos com sucesso."
                value={technical.solution}
                onChange={(e) => updateTechnicalForm("solution", e.target.value)}
                className="border-emerald-500/40 focus-visible:ring-emerald-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Causa Raiz do Problema</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: Desgaste natural do conector RJ-45 / Sobretensão na rede elétrica..."
                  value={technical.rootCause}
                  onChange={(e) => updateTechnicalForm("rootCause", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Diagnóstico Técnico</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: Conector quebrado causando perda intermitente de pacotes..."
                  value={technical.diagnosis}
                  onChange={(e) => updateTechnicalForm("diagnosis", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Peças Utilizadas</Label>
                <Input
                  placeholder="Ex: Cabo Patch Cord 2m"
                  value={technical.partsUsed}
                  onChange={(e) => updateTechnicalForm("partsUsed", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tempo Gasto (minutos)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  value={technical.timeSpentMinutes}
                  onChange={(e) => updateTechnicalForm("timeSpentMinutes", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Resumo para Relatórios</Label>
                <Input
                  placeholder="Ex: Troca de cabo concluída"
                  value={technical.resolutionSummary}
                  onChange={(e) => updateTechnicalForm("resolutionSummary", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Observações Internas (Privadas da equipe de TI)
              </Label>
              <Textarea
                rows={2}
                placeholder="Anotações técnicas adicionais sobre o atendimento..."
                value={technical.internalNotes}
                onChange={(e) => updateTechnicalForm("internalNotes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolutionModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirmResolution()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
            >
              <CheckCircle2 className="size-4" /> Confirmar e Concluir OS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Aguardar Peça */}
      <Dialog open={isWaitingPartsOpen} onOpenChange={setIsWaitingPartsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Package className="size-5 text-amber-500" /> Aguardando Peça ou Componente
            </DialogTitle>
            <DialogDescription>
              Informe qual componente está sendo aguardado para atualizar o histórico da OS e o solicitante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Peça ou Componente Aguardado *</Label>
              <Input
                required
                placeholder="Ex: Placa mãe LGA 1200, Fonte 500W, Teclado USB..."
                value={waitingPartsItem}
                onChange={(e) => setWaitingPartsItem(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Previsão Estimada de Chegada (Opcional)</Label>
              <Input
                placeholder="Ex: Amanhã às 14h / 3 dias úteis / Chegada prevista em 25/08"
                value={waitingPartsForecast}
                onChange={(e) => setWaitingPartsForecast(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWaitingPartsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirmWaitingParts()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Salvar e Mover para Aguardando Peça
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento de OS */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
              <XCircle className="size-5" /> Cancelar Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              Informe a justificativa do cancelamento. Esta ação é irreversível e fica registrada na auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold">Motivo do Cancelamento *</Label>
            <Textarea
              rows={3}
              required
              placeholder="Ex: Chamado aberto em duplicidade / Cancelado a pedido do solicitante..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmCancel()}
              className="font-bold"
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reabertura de OS */}
      <Dialog open={isReopenModalOpen} onOpenChange={setIsReopenModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-primary">
              <RefreshCw className="size-5" /> Reabrir Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              Informe a justificativa da reabertura para registro no histórico da OS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold">Justificativa da Reabertura *</Label>
            <Textarea
              rows={3}
              required
              placeholder="Ex: O equipamento voltou a apresentar instabilidade / Solicitante informou novo sintoma..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReopenModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirmReopen()} className="font-bold">
              Confirmar Reabertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação Genérica */}
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
              Selecione um item disponível em estoque para substituir "
              {activeReplacementComp?.name}" ({activeReplacementComp?.code}).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <Label>Equipamento Principal (PC)</Label>
              <Input value={assetDetail?.name || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-1">
              <Label>Item Substituído</Label>
              <Input
                value={
                  activeReplacementComp
                    ? `${activeReplacementComp.name} (${activeReplacementComp.code})`
                    : ""
                }
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-1">
              <Label>Novo Periférico (Em Estoque) *</Label>
              {!stockAssets || stockAssets.length === 0 ? (
                <div className="text-sm text-destructive border rounded-md p-3 bg-destructive/5">
                  Nenhum item do tipo "{activeReplacementComp?.assetType?.name || "periférico"}"
                  disponível em estoque.
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
                      {asset.code} - {asset.name}{" "}
                      {asset.serialNumber ? `(S/N: ${asset.serialNumber})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReplacingOpen(false);
                setActiveReplacementComp(null);
                setSelectedReplacementAssetId("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirmSwap()}
              disabled={!selectedReplacementAssetId}
            >
              Confirmar Troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DigitalSignatureModal
        open={isSignatureModalOpen}
        onOpenChange={setIsSignatureModalOpen}
        ticketProtocol={ticket.protocol}
        requesterName={ticket.requesterName}
        onConfirmSignature={handleConfirmSignature}
      />

      {/* Modal de Impressão da OS para o Técnico */}
      <TicketPrintDialog
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        ticket={ticket}
        departments={departments}
        branches={branches}
        categories={categories}
        assigneeName={ticket.assigneeId ? getUserName(users, ticket.assigneeId) : "Não atribuído"}
      />
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
          <AlertDialogTitle>{action?.title ?? "Confirmar ação"}</AlertDialogTitle>
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
