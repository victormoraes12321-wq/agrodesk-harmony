import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sprout,
  Tag,
  Ticket,
  UserCircle2,
  Users2,
  Package,
  Trash2,
} from "lucide-react";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Item {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminGroups: Array<{ title: string; items: Item[] }> = [
  {
    title: "Operacao",
    items: [
      { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/app/chamados", label: "Gestao de Chamados", icon: Ticket },
      { to: "/app/kanban", label: "Kanban", icon: KanbanSquare },
      { to: "/app/relatorios", label: "Relatorios", icon: BarChart3 },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { to: "/app/usuarios", label: "Usuarios", icon: Users2 },
      { to: "/app/setores", label: "Setores", icon: Building2 },
      { to: "/app/filiais", label: "Filiais/Locais", icon: MapPin },
      { to: "/app/categorias", label: "Categorias", icon: Tag },
    ],
  },
  {
    title: "Patrimonio",
    items: [
      { to: "/app/patrimonio/dashboard", label: "Dashboard Pat.", icon: LayoutDashboard },
      { to: "/app/patrimonio/ativos", label: "Ativos", icon: Package },
      { to: "/app/patrimonio/tipos", label: "Tipos de Ativos", icon: Tag },
      { to: "/app/patrimonio/fornecedores", label: "Fornecedores", icon: Building2 },
      { to: "/app/patrimonio/movimentacoes", label: "Movimentacoes", icon: KanbanSquare },
      { to: "/app/patrimonio/manutencoes", label: "Manutencoes", icon: Settings },
      { to: "/app/patrimonio/relatorios", label: "Relatorios Pat.", icon: BarChart3 },
    ],
  },
  {
    title: "Sistema",
    items: [
      { to: "/app/lixeira", label: "Lixeira / Recuperação", icon: Trash2 },
      { to: "/app/auditoria", label: "Auditoria", icon: ShieldCheck },
      { to: "/app/configuracoes", label: "Configuracoes", icon: Settings },
      { to: "/app/perfil", label: "Meu Perfil", icon: UserCircle2 },
    ],
  },
];

const requesterItems: Item[] = [
  { to: "/app/portal", label: "Portal", icon: LayoutDashboard },
  { to: "/app/nova-os", label: "Abrir nova OS", icon: PlusCircle },
  { to: "/app/meus-chamados", label: "Meus chamados", icon: Inbox },
  { to: "/app/perfil", label: "Meu perfil", icon: UserCircle2 },
];

export function AppSidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { currentUser, tickets } = useApp();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const admin = currentUser?.role === "TI_ADMIN";
  const unresolvedCount = tickets.filter((ticket) =>
    [
      "ABERTO",
      "EM_ANALISE",
      "EM_ATENDIMENTO",
      "AGUARDANDO_USUARIO",
      "AGUARDANDO_PECA",
      "REABERTO",
    ].includes(ticket.status),
  ).length;

  return (
    <aside
      className={cn(
        "flex flex-col w-64 xl:w-72 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        mobile ? "w-full" : "hidden lg:sticky lg:top-0 lg:flex lg:h-screen",
      )}
    >
      <Link
        to={admin ? "/app/dashboard" : "/app/portal"}
        onClick={onNavigate}
        className="px-5 py-4 flex items-center gap-3.5 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition cursor-pointer"
      >
        <div className="h-11 px-2.5 py-1 rounded-xl bg-white border border-border/80 shadow-xs flex items-center justify-center shrink-0">
          <img src="/Logo_Casa_do_Campo.png" alt="Casa do Campo" className="h-8 w-auto object-contain" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-sidebar-foreground">AgroDesk TI</div>
          <div className="text-[11px] text-sidebar-foreground/70">Central de Ticket e OS</div>
        </div>
      </Link>

      <div className="px-4 pt-4">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sidebar-foreground/60">
              Perfil ativo
            </p>
            <span className="rounded-full border border-sidebar-border px-2 py-0.5 text-[10px]">
              {admin ? "TI_ADMIN" : "SOLICITANTE"}
            </span>
          </div>
          <p className="font-medium text-xs mt-2 truncate">{currentUser?.name}</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-sidebar-primary/15 px-2 py-1 text-[11px]">
            <AlertTriangle className="size-3 text-sidebar-primary" />
            {unresolvedCount} OS em andamento
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {admin ? (
          adminGroups.map((group) => (
            <section key={group.title}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
                {group.title}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                          active
                            ? "bg-sidebar-primary/15 text-sidebar-primary-foreground border border-sidebar-primary/30"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className={cn("size-4", active && "text-sidebar-primary")} />
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        ) : (
          <section>
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
              Solicitacoes
            </div>
            <ul className="space-y-0.5">
              {requesterItems.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                        active
                          ? "bg-sidebar-primary/15 text-sidebar-primary-foreground border border-sidebar-primary/30"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className={cn("size-4", active && "text-sidebar-primary")} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl p-3 bg-sidebar-accent/55 border border-sidebar-border text-xs text-sidebar-foreground/75">
          <div className="font-medium text-sidebar-foreground">Ambiente interno</div>
          <div className="mt-1">Operacao conectada com atualizacao automatica de OS</div>
        </div>
      </div>
    </aside>
  );
}
