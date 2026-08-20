import { createFileRoute, Navigate, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/lib/store";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getAssets } from "@/services/patrimonio-api";
import { Search, FileText, Laptop, ArrowRightLeft, Activity, Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSocketEvents } from "@/hooks/use-socket";
import { CommandPalette } from "@/components/common/CommandPalette";

const ADMIN_ONLY_ROUTES = new Set([
  "/app/dashboard",
  "/app/chamados",
  "/app/kanban",
  "/app/relatorios",
  "/app/usuarios",
  "/app/setores",
  "/app/filiais",
  "/app/categorias",
  "/app/auditoria",
  "/app/configuracoes",
  "/app/lixeira",
]);

const REQUESTER_ONLY_ROUTES = new Set(["/app/portal", "/app/meus-chamados"]);

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { currentUser, loading, tickets } = useApp();
  useSocketEvents();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  
  // Spotlight Search & FAB & Theme states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  // Sync theme on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") || "light";
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch assets for search
  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: () => getAssets(),
    enabled: Boolean(currentUser && currentUser.role === "TI_ADMIN"),
  });

  // Filter Spotlight results
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return tickets
      .filter((t) => t.protocol.toLowerCase().includes(q) || t.title.toLowerCase().includes(q))
      .slice(0, 5);
  }, [tickets, searchQuery]);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (assets || [])
      .filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.hostname && a.hostname.toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [assets, searchQuery]);

  const filteredActions = useMemo(() => {
    const actions = [
      { name: "Abrir Novo Chamado (OS)", path: "/app/nova-os", icon: FileText },
      { name: "Ver Quadro Kanban de Chamados", path: "/app/kanban", icon: Activity },
      { name: "Ver Inventário de Ativos", path: "/app/patrimonio/ativos", icon: Laptop },
      { name: "Registrar Movimentação de Ativo", path: "/app/patrimonio/movimentacoes", icon: ArrowRightLeft },
    ];
    if (!searchQuery.trim()) return actions;
    const q = searchQuery.toLowerCase();
    return actions.filter((a) => a.name.toLowerCase().includes(q));
  }, [searchQuery]);

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" />;
  
  if (currentUser.mustChangePassword && pathname !== "/app/primeiro-acesso") {
    return <Navigate to="/app/primeiro-acesso" />;
  }
  if (!currentUser.mustChangePassword && pathname === "/app/primeiro-acesso") {
    return <Navigate to={currentUser.role === "TI_ADMIN" ? "/app/dashboard" : "/app/portal"} />;
  }
  if (pathname === "/app/primeiro-acesso") return <Outlet />;
  
  if (currentUser.role !== "TI_ADMIN" && (ADMIN_ONLY_ROUTES.has(pathname) || pathname.startsWith("/app/patrimonio"))) {
    return <Navigate to="/app/portal" />;
  }
  if (currentUser.role === "TI_ADMIN" && REQUESTER_ONLY_ROUTES.has(pathname)) {
    return <Navigate to="/app/dashboard" />;
  }

  const navigateTo = (path: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate({ to: path });
  };

  return (
    <div className="flex min-h-screen w-full bg-background transition-colors duration-150">
      <AppSidebar />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border"
        >
          <AppSidebar mobile onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleMobile={() => setOpen(true)} onSearchTrigger={() => setSearchOpen(true)} />
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-5 xl:p-6 max-w-[1800px] mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <CommandPalette />

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {fabOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <button
              onClick={() => {
                setFabOpen(false);
                navigate({ to: "/app/nova-os" });
              }}
              className="flex items-center gap-2 bg-card hover:bg-muted text-card-foreground border px-3 py-2 rounded-lg text-xs font-semibold shadow-lg transition"
            >
              <FileText className="size-4 text-primary" /> Novo Chamado
            </button>
            {currentUser.role === "TI_ADMIN" && (
              <>
                <button
                  onClick={() => {
                    setFabOpen(false);
                    navigate({ to: "/app/patrimonio/ativos", search: { new: "true" } as any }).then(() => {
                      // fallback dispatch in case router query doesn't trigger effect
                      window.dispatchEvent(new CustomEvent("trigger-new-asset"));
                    });
                  }}
                  className="flex items-center gap-2 bg-card hover:bg-muted text-card-foreground border px-3 py-2 rounded-lg text-xs font-semibold shadow-lg transition"
                >
                  <Laptop className="size-4 text-primary" /> Novo Ativo
                </button>
                <button
                  onClick={() => {
                    setFabOpen(false);
                    navigate({ to: "/app/patrimonio/movimentacoes", search: { new: "true" } as any }).then(() => {
                      window.dispatchEvent(new CustomEvent("trigger-new-movement"));
                    });
                  }}
                  className="flex items-center gap-2 bg-card hover:bg-muted text-card-foreground border px-3 py-2 rounded-lg text-xs font-semibold shadow-lg transition"
                >
                  <ArrowRightLeft className="size-4 text-primary" /> Nova Movimentação
                </button>
              </>
            )}
          </div>
        )}
        <button
          onClick={() => setFabOpen((prev) => !prev)}
          className={`size-12 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-xl flex items-center justify-center transition-transform duration-200 ${
            fabOpen ? "rotate-45" : ""
          }`}
          aria-label="Ações rápidas"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* Spotlight Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={(o) => { setSearchOpen(o); if (!o) setSearchQuery(""); }}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border bg-card shadow-2xl rounded-2xl gap-0">
          <div className="flex items-center border-b px-4 py-3 bg-muted/20">
            <Search className="size-5 text-muted-foreground mr-3" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite para buscar chamado, ativo ou ação..."
              className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none text-base h-auto"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-2">
            {searchQuery.trim().length === 0 && (
              <div className="p-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ações Rápidas</div>
            )}
            
            {/* Actions group */}
            {filteredActions.length > 0 && (
              <div className="space-y-0.5">
                {filteredActions.map((act) => {
                  const IconComp = act.icon;
                  return (
                    <button
                      key={act.name}
                      onClick={() => navigateTo(act.path)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/65 transition text-sm font-medium"
                    >
                      <IconComp className="size-4 text-primary shrink-0" />
                      <span>{act.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tickets results */}
            {filteredTickets.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="px-3 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Chamados (OS)</div>
                {filteredTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigateTo(`/app/chamados/${t.id}`)}
                    className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/65 transition text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{t.title}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary shrink-0">{t.protocol}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Assets results */}
            {filteredAssets.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="px-3 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ativos Patrimoniais</div>
                {filteredAssets.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigateTo("/app/patrimonio/ativos")}
                    className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/65 transition text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Laptop className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{a.name}</span>
                      {a.hostname && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">
                          {a.hostname}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-primary shrink-0">{a.code}</span>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim().length > 0 &&
              filteredTickets.length === 0 &&
              filteredAssets.length === 0 &&
              filteredActions.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado para "{searchQuery}"
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
