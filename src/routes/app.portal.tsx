import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Inbox,
  Lightbulb,
  PlusCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/tickets/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/page-loading";
import { usePageLoading } from "@/hooks/use-page-loading";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/portal")({
  head: () => ({ meta: [{ title: "Portal do Solicitante | AgroDesk TI" }] }),
  component: PortalPage,
});

function PortalPage() {
  const { currentUser, tickets } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const loading = usePageLoading();

  const mine = useMemo(() => {
    return tickets.filter((ticket) => ticket.requesterId === currentUser?.id);
  }, [tickets, currentUser]);

  const counts = useMemo(() => {
    return {
      opened: mine.filter((ticket) => ["ABERTO", "EM_ANALISE", "REABERTO"].includes(ticket.status))
        .length,
      inProgress: mine.filter((ticket) => ticket.status === "EM_ATENDIMENTO").length,
      waiting: mine.filter((ticket) =>
        ["AGUARDANDO_USUARIO", "AGUARDANDO_PECA"].includes(ticket.status),
      ).length,
      finished: mine.filter((ticket) => ["RESOLVIDO", "FINALIZADO"].includes(ticket.status)).length,
    };
  }, [mine]);

  const filtered = useMemo(() => {
    return mine.filter((ticket) => {
      const normalized = query.toLowerCase();
      const matchesText =
        normalized.length === 0 ||
        ticket.title.toLowerCase().includes(normalized) ||
        ticket.description.toLowerCase().includes(normalized) ||
        ticket.protocol.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [mine, query, statusFilter]);

  const summaryCards = [
    { label: "Meus abertos", value: counts.opened, icon: Inbox, tone: "bg-info/10 text-info" },
    {
      label: "Em atendimento",
      value: counts.inProgress,
      icon: Clock,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Aguardando retorno",
      value: counts.waiting,
      icon: AlertCircle,
      tone: "bg-warning/20 text-warning-foreground",
    },
    {
      label: "Concluidos",
      value: counts.finished,
      icon: CheckCircle2,
      tone: "bg-success/10 text-success",
    },
  ] as const;

  if (loading) return <PageLoading cards={4} rows={4} />;

  return (
    <div className="space-y-8">
      <section
        className="rounded-3xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden shadow-[var(--shadow-elegant)]"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(circle at 75% 20%, oklch(0.66 0.16 145 / 0.45), transparent 45%), radial-gradient(circle at 15% 75%, oklch(0.62 0.14 230 / 0.35), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/65">
              Portal do Solicitante
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mt-2">
              Ola, {currentUser?.name.split(" ")[0]}.
            </h1>
            <p className="text-white/75 mt-2 max-w-2xl">
              Abra uma nova OS em poucos passos e acompanhe o andamento com atualizacoes de status e
              comentarios da equipe de TI.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 px-6 bg-white text-secondary hover:bg-white/90">
            <Link to="/app/nova-os">
              <PlusCircle className="size-5" /> Abrir nova OS
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border bg-card p-3 sm:p-4 lg:p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition"
            >
              <div className={`size-10 rounded-xl grid place-items-center ${card.tone}`}>
                <Icon className="size-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-semibold mt-3 sm:mt-4 tabular-nums">
                {card.value}
              </p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border bg-card overflow-hidden shadow-[var(--shadow-card)]">
        <div className="p-5 border-b flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="flex-1">
            <h2 className="font-semibold">Meus chamados recentes</h2>
            <p className="text-xs text-muted-foreground">
              Busca rapida por titulo, descricao ou protocolo. Atualizacao automatica ativa.
            </p>
          </div>
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar chamado"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: "Todos" },
              { id: "ABERTO", label: "Abertos" },
              { id: "EM_ATENDIMENTO", label: "Em atendimento" },
              { id: "AGUARDANDO_USUARIO", label: "Aguardando voce" },
              { id: "FINALIZADO", label: "Finalizados" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`h-9 rounded-full border px-3 text-xs transition ${
                  statusFilter === item.id
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Nenhum chamado encontrado"
                description="Ajuste os filtros ou abra uma nova solicitacao."
                compact
                actionLabel="Abrir nova OS"
                onAction={() => {
                  navigate({ to: "/app/nova-os" });
                }}
              />
            </div>
          ) : (
            filtered
              .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
              .slice(0, 8)
              .map((ticket) => (
                <article
                  key={ticket.id}
                  className="flex items-start gap-4 p-4 hover:bg-muted/40 transition"
                >
                  <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0">
                    {ticket.protocol.split("-").pop()?.slice(-3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{ticket.title}</span>
                      <StatusBadge status={ticket.status} />
                      {ticket.status === "AGUARDANDO_USUARIO" && (
                        <span className="inline-flex items-center rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning-foreground">
                          TI aguardando resposta
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.protocol} - Atualizado {timeAgo(ticket.updatedAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                          Comentar
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                          Ver resposta da TI
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" asChild>
                    <Link to="/app/chamados/$id" params={{ id: ticket.id }}>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  </Button>
                </article>
              ))
          )}
        </div>
      </section>

      {/* Base de Conhecimento e Autoatendimento (FAQ) */}
      <PortalFaqSection onOpenTicket={(category) => navigate({ to: "/app/nova-os" })} />
    </div>
  );
}

const FAQ_ITEMS = [
  {
    id: "impressora",
    question: "Como configurar ou selecionar minha impressora padrão no Windows?",
    category: "Impressoras",
    answer:
      "1. No teclado, pressione a tecla Windows e digite 'Impressoras e Scanners'.\n2. Localize a impressora da sua sala/setor (ex: HP LaserJet Matriz ou EPSON).\n3. Clique sobre ela e selecione 'Definir como padrão'.\n4. Se a impressora não aparecer, verifique se o cabo de rede ou USB está conectado.",
  },
  {
    id: "senha",
    question: "Esqueci minha senha de login do computador ou e-mail. Como redefinir?",
    category: "Acesso e Contas",
    answer:
      "Na tela inicial de login do AgroDesk TI, clique no botão 'Esqueci minha senha' e informe seu nome de usuário. O sistema abrirá automaticamente uma OS de prioridade alta para a equipe de TI resetar sua senha com segurança.",
  },
  {
    id: "internet",
    question: "Meu computador perdeu a conexão com a internet ou rede da fazenda/filial.",
    category: "Rede e Internet",
    answer:
      "1. Verifique se o cabo azul de rede atrás do computador está com a luz piscando (verde/amarela).\n2. Reinicie o computador.\n3. Se outras pessoas do mesmo setor também estiverem sem sinal, pode ser instabilidade no roteador/switch principal da unidade.",
  },
  {
    id: "computador",
    question: "O computador não liga ou a tela fica toda preta com luz piscando.",
    category: "Computadores",
    answer:
      "1. Cheque se o cabo de energia e o botão do filtro de linha / nobreak estão ligados.\n2. Verifique se o cabo HDMI/VGA atrás do monitor não está solto.\n3. Mantenha o botão power pressionado por 10 segundos para forçar o desligamento completo e ligue novamente.",
  },
  {
    id: "email",
    question: "Como solicitar novo e-mail corporativo ou acesso a pastas compartilhadas?",
    category: "Acessos e Permissões",
    answer:
      "Abra um chamado pela opção 'Nova OS' escolhendo a categoria 'Acesso / E-mail'. Informe o nome completo do novo colaborador, cargo, setor e as pastas que ele precisará acessar.",
  },
];

function PortalFaqSection({ onOpenTicket }: { onOpenTicket: (category?: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState("");

  const filteredFaq = useMemo(() => {
    const term = faqSearch.toLowerCase().trim();
    if (!term) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
    );
  }, [faqSearch]);

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="rounded-3xl border bg-card p-6 lg:p-8 shadow-[var(--shadow-card)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Base de Conhecimento & Autoatendimento
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Soluções Rápidas
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consulte guias práticos para resolver dúvidas comuns antes de abrir um chamado.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Buscar dúvida ou tutorial..."
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredFaq.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            Nenhum tutorial encontrado para "{faqSearch}".{" "}
            <button
              onClick={() => onOpenTicket()}
              className="text-primary font-semibold underline ml-1"
            >
              Abrir um chamado com a TI
            </button>
          </div>
        ) : (
          filteredFaq.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen ? "bg-muted/15 border-primary/30 shadow-sm" : "bg-card hover:bg-muted/10"
                }`}
              >
                <div
                  onClick={() => toggleFaq(faq.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="size-4 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground leading-tight">
                        {faq.question}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {faq.category}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap border-t border-border/40 space-y-3 animate-in fade-in-50 duration-200">
                    <div className="p-3 bg-background rounded-xl border border-border/80">
                      {faq.answer}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Não conseguiu resolver com este guia?</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenTicket(faq.category)}
                        className="text-xs h-7 text-primary border-primary/30 hover:bg-primary/5"
                      >
                        Abrir Chamado para {faq.category}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
