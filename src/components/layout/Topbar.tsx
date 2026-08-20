import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, PlusCircle, Search, Sun, Moon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Topbar({
  onToggleMobile,
  onSearchTrigger,
}: {
  onToggleMobile?: () => void;
  onSearchTrigger?: () => void;
}) {
  const {
    currentUser,
    notifications,
    logout,
    markAllRead,
    markNotificationRead,
    tickets,
    notificationSoundEnabled,
    setNotificationSoundEnabled,
  } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync internal theme state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const myNotifications = useMemo(
    () => notifications.filter((notification) => notification.userId === currentUser?.id),
    [notifications, currentUser],
  );
  const unread = myNotifications.filter((notification) => !notification.read).length;

  const onSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !query.trim()) return;

    const sourceTickets =
      currentUser?.role === "TI_ADMIN"
        ? tickets
        : tickets.filter((ticket) => ticket.requesterId === currentUser?.id);

    const found = sourceTickets.find((ticket) => {
      const normalized = query.toLowerCase();
      return (
        ticket.protocol.toLowerCase().includes(normalized) ||
        ticket.title.toLowerCase().includes(normalized) ||
        ticket.description.toLowerCase().includes(normalized) ||
        ticket.requesterName.toLowerCase().includes(normalized) ||
        ticket.requesterPhone.toLowerCase().includes(normalized)
      );
    });

    if (found) {
      navigate({ to: "/app/chamados/$id", params: { id: found.id }, search: {} as any });
      setQuery("");
      return;
    }
    toast.info("Nenhum chamado encontrado", {
      description: "Tente outro termo ou confira o numero do protocolo.",
    });
  };

  const initials = (currentUser?.name ?? "?")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="min-h-16 shrink-0 border-b bg-card/90 backdrop-blur-md sticky top-0 z-20 supports-[backdrop-filter]:bg-card/75">
      <div className="min-h-16 px-3 sm:px-4 lg:px-5 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleMobile}
          aria-label="Abrir menu lateral"
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative order-3 basis-full sm:order-none sm:basis-auto sm:flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chamado (ou Ctrl+K)..."
            className="pl-9 bg-muted/35 border-transparent focus-visible:bg-card focus-visible:border-input cursor-pointer"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={(e) => {
              if (onSearchTrigger) {
                e.target.blur();
                onSearchTrigger();
              }
            }}
            onClick={() => {
              if (onSearchTrigger) {
                onSearchTrigger();
              }
            }}
            onKeyDown={onSearch}
            aria-label="Busca global de chamados"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {currentUser && (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/app/nova-os">
                <PlusCircle className="size-4" /> Abrir OS
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema claro/escuro"
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="size-5 text-yellow-500 transition-colors" />
            ) : (
              <Moon className="size-5 text-slate-700 dark:text-slate-300 transition-colors" />
            )}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => unread > 0 && setTimeout(() => void markAllRead(), 1200)}
                aria-label="Abrir notificacoes"
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold grid place-items-center">
                    {unread}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1rem))] p-0">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Notificacoes</span>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => void markAllRead()}
                  type="button"
                >
                  Marcar como lidas
                </button>
              </div>
              <div className="px-4 py-2 border-b flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">Som para novas OS</p>
                  <p className="text-[11px] text-muted-foreground">
                    Opcional para operacao em tempo real.
                  </p>
                </div>
                <Switch
                  checked={notificationSoundEnabled}
                  onCheckedChange={(checked) => setNotificationSoundEnabled(Boolean(checked))}
                  aria-label="Ativar som para notificacoes"
                />
              </div>
              <div className="max-h-96 overflow-y-auto">
                {myNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Sem notificacoes no momento
                  </div>
                ) : (
                  myNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/45 transition",
                        !notification.read && "bg-primary/5",
                      )}
                      onClick={() => {
                        void markNotificationRead(notification.id);
                        if (notification.ticketId) {
                          navigate({
                            to: "/app/chamados/$id",
                            params: { id: notification.ticketId },
                            search: {} as any,
                          });
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 size-2 rounded-full shrink-0",
                            notification.type === "DANGER" && "bg-destructive",
                            notification.type === "WARNING" && "bg-warning",
                            notification.type === "SUCCESS" && "bg-success",
                            notification.type === "INFO" && "bg-info",
                          )}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{notification.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {timeAgo(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition border border-transparent hover:border-border"
                aria-label="Abrir menu do usuario"
              >
                <div
                  className="size-8 rounded-full grid place-items-center text-white text-xs font-semibold"
                  style={{
                    background:
                      currentUser?.avatarColor ??
                      "linear-gradient(135deg, oklch(0.52 0.13 145), oklch(0.66 0.16 145))",
                  }}
                >
                  {initials}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium leading-tight">{currentUser?.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {currentUser?.role === "TI_ADMIN" ? "TI Admin" : "Solicitante"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{currentUser?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/perfil">Meu perfil</Link>
              </DropdownMenuItem>
              {currentUser?.role === "SOLICITANTE" && (
                <DropdownMenuItem asChild>
                  <Link to="/app/meus-chamados">Meus chamados</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  void logout().finally(() => {
                    navigate({ to: "/login" });
                  });
                }}
              >
                <LogOut className="size-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
