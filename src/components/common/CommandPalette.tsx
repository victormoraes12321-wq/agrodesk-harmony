import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  Search,
  PlusCircle,
  FileText,
  Layers,
  Laptop,
  BarChart3,
  Trash2,
  User,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { tickets, users, currentUser } = useApp();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const isAdmin = currentUser?.role === "TI_ADMIN";
  const query = search.trim().toLowerCase();

  // Filtro de chamados
  const matchedTickets = query
    ? tickets
        .filter(
          (t) =>
            t.protocol.toLowerCase().includes(query) ||
            t.title.toLowerCase().includes(query) ||
            t.requesterName.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query),
        )
        .slice(0, 5)
    : tickets.slice(0, 4);

  // Filtro de usuários
  const matchedUsers =
    isAdmin && query
      ? users
          .filter(
            (u) =>
              u.name.toLowerCase().includes(query) ||
              u.username?.toLowerCase().includes(query) ||
              u.email?.toLowerCase().includes(query) ||
              (u as any).jobTitle?.toLowerCase().includes(query) ||
              (u as any).position?.toLowerCase().includes(query),
          )
          .slice(0, 4)
      : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 max-w-2xl bg-card border shadow-2xl rounded-2xl">
        <Command
          className="w-full flex flex-col"
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-4 py-3 gap-3 bg-muted/30">
            <Search className="size-5 text-muted-foreground shrink-0" />
            <input
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              placeholder="Buscar chamados, patrimônios, usuários ou ações... (Ex: OS-2026, Notebook, Victor)"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
            {/* Ações Rápidas */}
            <div>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ações do Sistema
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => runCommand(() => navigate({ to: "/app/nova-os" as any }))}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                >
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <PlusCircle className="size-4" />
                  </div>
                  <span className="font-medium flex-1">Abrir Nova Ordem de Serviço</span>
                  <Badge variant="outline" className="text-[10px]">Atalho</Badge>
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => runCommand(() => navigate({ to: "/app/chamados" as any }))}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-info/10 text-info">
                        <FileText className="size-4" />
                      </div>
                      <span className="font-medium flex-1">Gerenciar Todas as Ordens de Serviço</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => runCommand(() => navigate({ to: "/app/kanban" as any }))}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Layers className="size-4" />
                      </div>
                      <span className="font-medium flex-1">Quadro Kanban de Atendimento</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => runCommand(() => navigate({ to: "/app/patrimonio" as any }))}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Laptop className="size-4" />
                      </div>
                      <span className="font-medium flex-1">Inventário de Patrimônio & Ativos TI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => runCommand(() => navigate({ to: "/app/relatorios" as any }))}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <BarChart3 className="size-4" />
                      </div>
                      <span className="font-medium flex-1">Relatórios & BI Executivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => runCommand(() => navigate({ to: "/app/lixeira" as any }))}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
                        <Trash2 className="size-4" />
                      </div>
                      <span className="font-medium flex-1">Lixeira & Recuperação de Registros</span>
                      <Badge variant="destructive" className="text-[10px]">Soft-delete</Badge>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Chamados Encontrados */}
            {matchedTickets.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ordens de Serviço ({matchedTickets.length})
                </div>
                <div className="space-y-1">
                  {matchedTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() =>
                        runCommand(() =>
                          navigate({
                            to: "/app/chamados/$id" as any,
                            params: { id: ticket.id },
                          }),
                        )
                      }
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="font-mono text-xs font-bold px-2 py-1 rounded bg-muted text-primary shrink-0">
                        {ticket.protocol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ticket.title || ticket.description}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Solicitante: {ticket.requesterName} • {ticket.status}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[11px] shrink-0">
                        {ticket.priority}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Usuários Encontrados */}
            {matchedUsers.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Usuários ({matchedUsers.length})
                </div>
                <div className="space-y-1">
                  {matchedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        runCommand(() =>
                          navigate({
                            to: "/app/usuarios" as any,
                          }),
                        )
                      }
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                        <User className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.name} ({user.username})</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email} • {(user as any).jobTitle || (user as any).position || "Sem cargo"}
                        </p>
                      </div>
                      <Badge variant={user.role === "TI_ADMIN" ? "default" : "secondary"} className="text-[10px]">
                        {user.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t px-4 py-2.5 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Ctrl</kbd>
              <span>+</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">K</kbd>
              <span>para abrir a qualquer momento</span>
            </div>
            <span>AgroDesk TI Harmony</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
