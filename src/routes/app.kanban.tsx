import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightLeft, Layers3 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { KANBAN_COLUMNS, STATUS_FLOW } from "@/app/constants";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePageLoading } from "@/hooks/use-page-loading";
import { getDepartmentName, getUserName } from "@/lib/helpdesk";
import { useApp } from "@/lib/store";
import { statusLabel } from "@/lib/format";
import type { Department, Ticket, User } from "@/types";

export const Route = createFileRoute("/app/kanban")({
  head: () => ({ meta: [{ title: "Kanban de Atendimento | AgroDesk TI" }] }),
  component: KanbanRoute,
});

function KanbanRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <KanbanPage />
    </AdminOnly>
  );
}

function KanbanPage() {
  const { tickets, departments, users, updateTicket } = useApp();
  const loading = usePageLoading(180);
  const desktopBoard = useMediaQuery("(min-width: 1024px)");
  const [waitingTicketId, setWaitingTicketId] = useState<string | null>(null);
  const [waitingReason, setWaitingReason] = useState("");
  const [activeColumnId, setActiveColumnId] =
    useState<(typeof KANBAN_COLUMNS)[number]["id"]>("ABERTO");

  const grouped = useMemo(() => {
    return KANBAN_COLUMNS.map((column) => ({
      ...column,
      tickets: tickets
        .filter((ticket) =>
          column.id === "ABERTO"
            ? ticket.status === "ABERTO" || ticket.status === "REABERTO"
            : ticket.status === column.id,
        )
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    }));
  }, [tickets]);

  const submitMove = async (
    ticketId: string,
    status: (typeof STATUS_FLOW)[number],
    statusNote?: string,
  ) => {
    const statusAction =
      status === "RESOLVIDO"
        ? "RESOLVE"
        : status === "FINALIZADO"
          ? "FINALIZE"
          : status === "REABERTO"
            ? "REOPEN"
            : status === "CANCELADO"
              ? "CANCEL"
              : "UPDATE";

    try {
      await updateTicket(ticketId, { status }, { statusAction, statusNote });
      toast.success(`Chamado movido para ${statusLabel[status]}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel mover o chamado.";
      toast.error(message);
    }
  };

  const moveTo = async (ticketId: string, status: (typeof STATUS_FLOW)[number]) => {
    if (status === "AGUARDANDO_USUARIO") {
      const ticket = tickets.find((item) => item.id === ticketId);
      setWaitingReason(ticket?.waitingRequesterMessage ?? "");
      setWaitingTicketId(ticketId);
      return;
    }
    await submitMove(ticketId, status);
  };

  const totalInBoard = grouped.reduce((acc, column) => acc + column.tickets.length, 0);

  if (loading) return <PageLoading cards={0} rows={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban de Atendimento"
        description="Painel visual por etapa operacional para a equipe TI_ADMIN."
      />

      <section className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1">
            <Layers3 className="size-4 text-primary" />
            {totalInBoard} OS no quadro
          </span>
          <span className="text-muted-foreground">
            Chamados reabertos sao agrupados na coluna <strong>Aberto</strong>.
          </span>
        </div>
      </section>

      {!desktopBoard ? (
        <section className="rounded-2xl border bg-card p-3 shadow-[var(--shadow-card)]">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="kanban-stage">
            Etapa exibida
          </label>
          <select
            id="kanban-stage"
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={activeColumnId}
            onChange={(event) =>
              setActiveColumnId(event.target.value as (typeof KANBAN_COLUMNS)[number]["id"])
            }
          >
            {grouped.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title} ({column.tickets.length})
              </option>
            ))}
          </select>
          <div className="mt-3">
            {grouped
              .filter((column) => column.id === activeColumnId)
              .map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  departments={departments}
                  users={users}
                  onMove={moveTo}
                  compact
                />
              ))}
          </div>
        </section>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="grid grid-cols-8 gap-4 min-w-[1840px]">
            {grouped.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                departments={departments}
                users={users}
                onMove={moveTo}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(waitingTicketId)}
        onOpenChange={(open) => !open && setWaitingTicketId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O que voce precisa que o solicitante responda?</DialogTitle>
            <DialogDescription>
              Esta informacao e obrigatoria para mudar para \"Aguardando resposta do solicitante\".
            </DialogDescription>
          </DialogHeader>
          <Input
            value={waitingReason}
            onChange={(event) => setWaitingReason(event.target.value)}
            placeholder="Ex: Envie foto da mensagem de erro."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWaitingTicketId(null);
                setWaitingReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!waitingTicketId) return;
                const note = waitingReason.trim();
                if (!note) {
                  toast.error("Informe o que esta sendo aguardado do solicitante.");
                  return;
                }
                const target = waitingTicketId;
                setWaitingTicketId(null);
                setWaitingReason("");
                void submitMove(target, "AGUARDANDO_USUARIO", note);
              }}
            >
              Salvar e mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KanbanColumn({
  column,
  departments,
  users,
  onMove,
  compact = false,
}: {
  column: (typeof KANBAN_COLUMNS)[number] & { tickets: Ticket[] };
  departments: Department[];
  users: User[];
  onMove: (ticketId: string, status: (typeof STATUS_FLOW)[number]) => Promise<void>;
  compact?: boolean;
}) {
  const visibleTickets = column.tickets.slice(0, compact ? 30 : 40);
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const ticketId = e.dataTransfer.getData("text/plain");
    if (ticketId) {
      const targetStatus = column.id as (typeof STATUS_FLOW)[number];
      void onMove(ticketId, targetStatus);
    }
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border flex flex-col shadow-[var(--shadow-card)] transition-all duration-200 ${
        isOver
          ? "border-dashed border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.01]"
          : "bg-card border-border"
      } ${compact ? "min-h-[360px]" : "min-h-[540px]"}`}
    >
      <header className="p-3 border-b bg-muted/35 rounded-t-2xl sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{column.title}</h2>
          <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
            {column.tickets.length}
          </span>
        </div>
      </header>

      <div className="p-3 space-y-3 flex-1 flex flex-col min-h-0">
        {column.tickets.length === 0 && (
          <EmptyState
            compact
            title="Sem OS nesta etapa"
            description="Arraste uma OS aqui para mover."
          />
        )}

        {visibleTickets.map((ticket) => (
          <article
            key={ticket.id}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", ticket.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className="rounded-xl border bg-background p-3 shadow-[var(--shadow-card)] space-y-2 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors duration-150"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-mono">{ticket.protocol}</p>
                <h3 className="text-sm font-medium line-clamp-2">{ticket.title}</h3>
              </div>
              <PriorityBadge priority={ticket.priority} className="shrink-0" />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
            <p className="text-xs">
              <strong>Solicitante:</strong> {ticket.requesterName}
            </p>
            <p className="text-xs">
              <strong>Setor:</strong> {getDepartmentName(departments, ticket.departmentId)}
            </p>
            <p className="text-xs">
              <strong>Responsavel:</strong> {getUserName(users, ticket.assigneeId)}
            </p>
            <TicketSlaChip
              createdAt={ticket.createdAt}
              slaHours={ticket.slaHours}
              closedAt={ticket.closedAt}
              className="w-fit"
            />

            <select
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={ticket.status}
              onChange={(event) =>
                void onMove(ticket.id, event.target.value as (typeof STATUS_FLOW)[number])
              }
            >
              {STATUS_FLOW.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs pt-1">
              <StatusBadge status={ticket.status} />
              <Link
                className="inline-flex items-center gap-1 text-primary hover:underline"
                to="/app/chamados/$id"
                params={{ id: ticket.id }}
              >
                <ArrowRightLeft className="size-3.5" /> Abrir
              </Link>
            </div>
          </article>
        ))}
        {column.tickets.length > visibleTickets.length && (
          <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground mt-auto">
            Exibindo {visibleTickets.length} de {column.tickets.length} OS. Use a Gestao de Chamados
            para consultar a lista completa.
          </div>
        )}
      </div>
    </section>
  );
}
