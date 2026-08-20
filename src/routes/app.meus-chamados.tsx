import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, Search, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/tickets/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { TicketEmptyState } from "@/features/tickets/TicketEmptyState";
import { TicketSlaChip } from "@/features/tickets/TicketSlaChip";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatDateTime } from "@/lib/format";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/meus-chamados")({
  head: () => ({ meta: [{ title: "Meus Chamados | AgroDesk TI" }] }),
  component: MyTicketsPage,
});

function MyTicketsPage() {
  const { currentUser, tickets, rateTicket } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const loading = usePageLoading();
  const currentUserId = currentUser?.id ?? "";

  const mine = useMemo(() => {
    return tickets
      .filter((ticket) => ticket.requesterId === currentUserId)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [tickets, currentUserId]);

  const unratedTickets = useMemo(() => {
    return mine.filter(
      (ticket) =>
        (ticket.status === "RESOLVIDO" || ticket.status === "FINALIZADO") &&
        (!ticket.rating || ticket.rating === 0),
    );
  }, [mine]);

  const filtered = useMemo(() => {
    return mine.filter((ticket) => {
      const normalized = query.toLowerCase();
      const textMatches =
        normalized.length === 0 ||
        ticket.protocol.toLowerCase().includes(normalized) ||
        ticket.title.toLowerCase().includes(normalized) ||
        ticket.description.toLowerCase().includes(normalized);
      const statusMatches = status === "ALL" || ticket.status === status;
      return textMatches && statusMatches;
    });
  }, [mine, query, status]);

  const giveQuickRate = async (ticketId: string, rating: number) => {
    try {
      await rateTicket(ticketId, rating);
      toast.success("Avaliacao registrada", {
        description: "Obrigado pelo retorno sobre o atendimento.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel registrar avaliacao.";
      toast.error(message);
    }
  };

  if (!currentUser) return <Navigate to="/login" />;
  if (loading) return <PageLoading cards={0} rows={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Chamados"
        description="Acompanhe seus chamados, filtre por status e avalie os atendimentos finalizados."
        actions={
          <Button asChild>
            <Link to="/app/nova-os">Abrir nova OS</Link>
          </Button>
        }
      />

      {/* Banner de Chamados Aguardando Avaliação */}
      {unratedTickets.length > 0 && (
        <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0 border border-amber-500/30 shadow-xs">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                Você tem {unratedTickets.length} chamado{unratedTickets.length > 1 ? "s" : ""} finalizado{unratedTickets.length > 1 ? "s" : ""} aguardando avaliação!
              </h3>
              <p className="text-xs text-muted-foreground">
                Sua avaliação é rápida (leva 10 segundos) e nos ajuda a aprimorar o suporte de T.I.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs shrink-0 shadow-md cursor-pointer animate-pulse-soft"
          >
            <Link to="/app/chamados/$id" params={{ id: unratedTickets[0].id }}>
              <Star className="size-4 fill-amber-200 text-amber-200" /> Avaliar {unratedTickets[0].protocol}
            </Link>
          </Button>
        </div>
      )}

      <section className="rounded-2xl border bg-card overflow-hidden shadow-[var(--shadow-card)]">
        <div className="p-4 border-b flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Buscar por protocolo, titulo ou descricao"
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">Todos status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANALISE">Em analise</option>
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="AGUARDANDO_USUARIO">Aguardando usuario</option>
            <option value="AGUARDANDO_PECA">Aguardando peca</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <TicketEmptyState
            title="Nenhum chamado encontrado"
            description="Nao ha resultados para os filtros aplicados."
            actionLabel="Abrir nova OS"
            onAction={() => {
              navigate({ to: "/app/nova-os" });
            }}
          />
        ) : (
          <>
            <div className="lg:hidden divide-y">
              {filtered.map((ticket) => (
                <div key={ticket.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{ticket.protocol}</p>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-sm font-medium">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <TicketSlaChip
                      createdAt={ticket.createdAt}
                      slaHours={ticket.slaHours}
                      closedAt={ticket.closedAt}
                      status={ticket.status}
                      slaDueAt={ticket.slaDueAt}
                    />
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                        Detalhe
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Protocolo</th>
                    <th className="text-left px-4 py-3">Resumo</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">SLA</th>
                    <th className="text-left px-4 py-3">Atualizado</th>
                    <th className="text-left px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <tr key={ticket.id} className="border-t align-top hover:bg-muted/20 transition">
                      <td className="px-4 py-3 font-medium">{ticket.protocol}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3">
                        <TicketSlaChip
                          createdAt={ticket.createdAt}
                          slaHours={ticket.slaHours}
                          closedAt={ticket.closedAt}
                          status={ticket.status}
                          slaDueAt={ticket.slaDueAt}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(ticket.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                              <MessageSquarePlus className="size-4" /> Ver detalhe
                            </Link>
                          </Button>
                          {["RESOLVIDO", "FINALIZADO"].includes(ticket.status) &&
                            !ticket.rating && (
                              <div className="flex items-center gap-1">
                                {[4, 5].map((score) => (
                                  <button
                                    key={score}
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                                    onClick={() => void giveQuickRate(ticket.id, score)}
                                  >
                                    <Star className="size-3.5" /> {score}
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
