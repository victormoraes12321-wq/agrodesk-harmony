import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Plus, Save, Search, UserCog2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminOnly } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatBranchName } from "@/lib/helpdesk";
import { maskPhone } from "@/lib/format";
import { useApp } from "@/lib/store";
import { userSchema } from "@/lib/validation";
import type { User } from "@/types";

export const Route = createFileRoute("/app/usuarios")({
  head: () => ({ meta: [{ title: "Gestao de Usuarios | AgroDesk TI" }] }),
  component: UsersRoute,
});

type UserDraft = {
  id?: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  whatsapp: string;
  extension: string;
  departmentId: string;
  branchId: string;
  jobTitle: string;
  role: "SOLICITANTE" | "TI_ADMIN";
  active: boolean;
  notes: string;
  initialPassword: string;
  canReceiveTickets: boolean;
};

function blankDraft(): UserDraft {
  return {
    name: "",
    username: "",
    email: "",
    phone: "",
    whatsapp: "",
    extension: "",
    departmentId: "",
    branchId: "",
    jobTitle: "",
    role: "SOLICITANTE",
    active: true,
    notes: "",
    initialPassword: "",
    canReceiveTickets: false,
  };
}

function UsersRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <UsersPage />
    </AdminOnly>
  );
}

function UsersPage() {
  const { users, departments, branches, upsertUser, toggleUserActive, resetUserPassword } =
    useApp();
  const loading = usePageLoading(180);
  const wideTable = useMediaQuery("(min-width: 1536px)");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<UserDraft>(blankDraft());
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetDraft, setResetDraft] = useState("");
  const [resetSaving, setResetSaving] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalized = query.toLowerCase();
    return [...users]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((user) => {
        const textMatch =
          normalized.length === 0 ||
          user.name.toLowerCase().includes(normalized) ||
          (user.email ? user.email.toLowerCase().includes(normalized) : false) ||
          (user.username ? user.username.toLowerCase().includes(normalized) : false) ||
          user.phone.toLowerCase().includes(normalized);
        const roleMatch = roleFilter === "ALL" || user.role === roleFilter;
        const activeMatch =
          activeFilter === "ALL" ||
          (activeFilter === "ACTIVE" && user.active) ||
          (activeFilter === "INACTIVE" && !user.active);
        return textMatch && roleMatch && activeMatch;
      });
  }, [users, query, roleFilter, activeFilter]);

  const beginCreate = () => {
    setDraft({
      ...blankDraft(),
      departmentId: departments[0]?.id ?? "",
      branchId: branches[0]?.id ?? "",
    });
    setOpen(true);
  };

  const beginEdit = (user: User) => {
    setDraft({
      id: user.id,
      name: user.name,
      username: user.username || user.name,
      email: user.email ?? "",
      phone: user.phone,
      whatsapp: user.whatsapp ?? "",
      extension: user.extension ?? "",
      departmentId: user.departmentId,
      branchId: user.branchId,
      jobTitle: user.jobTitle,
      role: user.role,
      active: user.active,
      notes: user.notes ?? "",
      initialPassword: "",
      canReceiveTickets: user.canReceiveTickets,
    });
    setOpen(true);
  };

  const save = async () => {
    const validation = userSchema.safeParse({
      name: draft.name,
      username: draft.username,
      email: draft.email,
      phone: draft.phone,
      departmentId: draft.departmentId,
      role: draft.role,
      branchId: draft.branchId,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Preencha os campos obrigatorios");
      return;
    }
    if (!draft.id && draft.initialPassword.length < 8) {
      toast.error("Informe uma senha inicial com pelo menos 8 caracteres.");
      return;
    }

    const user: User = {
      id: draft.id ?? "",
      name: validation.data.name,
      username: validation.data.username,
      email: validation.data.email ? validation.data.email.trim() : "",
      phone: validation.data.phone,
      whatsapp: draft.whatsapp || undefined,
      extension: draft.extension || undefined,
      departmentId: validation.data.departmentId,
      branchId: validation.data.branchId,
      jobTitle: draft.jobTitle,
      role: validation.data.role,
      active: draft.active,
      mustChangePassword: draft.id
        ? (users.find((item) => item.id === draft.id)?.mustChangePassword ?? true)
        : true,
      canReceiveTickets: draft.role === "TI_ADMIN" && draft.canReceiveTickets,
      notes: draft.notes || undefined,
      avatarColor: validation.data.role === "TI_ADMIN" ? "#0ea5e9" : undefined,
    };

    setSaving(true);
    try {
      await upsertUser(user, draft.initialPassword || undefined);
      toast.success(draft.id ? "Usuario atualizado" : "Usuario criado");
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar o usuario.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const beginResetPassword = (user: User) => {
    setResetTarget(user);
    setResetDraft("");
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    if (resetDraft.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setResetSaving(true);
    try {
      await resetUserPassword(resetTarget.id, resetDraft);
      toast.success(`Senha redefinida para ${resetTarget.email}`);
      setResetTarget(null);
      setResetDraft("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel redefinir a senha.";
      toast.error(message);
    } finally {
      setResetSaving(false);
    }
  };

  if (loading) return <PageLoading cards={0} rows={7} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Usuarios"
        description="Controle usuarios SOLICITANTE e TI_ADMIN, com ativacao, inativacao e redefinicao segura de senha."
        actions={
          <Button onClick={beginCreate}>
            <Plus className="size-4" /> Novo usuario
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone"
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">Perfil: todos</option>
            <option value="SOLICITANTE">SOLICITANTE</option>
            <option value="TI_ADMIN">TI_ADMIN</option>
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
          >
            <option value="ALL">Status: todos</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border bg-card overflow-hidden shadow-[var(--shadow-card)]">
        {filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Nenhum usuario encontrado"
              description="Ajuste os filtros ou cadastre um novo usuario."
              compact
            />
          </div>
        ) : (
          <>
            {!wideTable ? (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <article key={user.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                          <UserRound className="size-4" />
                        </div>
                        <p className="font-medium truncate">{user.name}</p>
                      </div>
                      <Badge variant={user.active ? "default" : "outline"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <p className="text-sm">{user.phone}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={user.role === "TI_ADMIN" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {departments.find((item) => item.id === user.departmentId)?.name}
                      </span>
                      {user.role === "TI_ADMIN" ? (
                        <Badge variant={user.canReceiveTickets ? "default" : "outline"}>
                          {user.canReceiveTickets ? "Recebe OS" : "Somente acompanhamento"}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => beginEdit(user)}>
                        <UserCog2 className="size-3.5" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void toggleUserActive(user.id)}
                      >
                        {user.active ? "Inativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => beginResetPassword(user)}>
                        <KeyRound className="size-3.5" /> Senha
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">E-mail</th>
                      <th className="text-left px-4 py-3">Telefone</th>
                      <th className="text-left px-4 py-3">Setor</th>
                      <th className="text-left px-4 py-3">Filial/local</th>
                      <th className="text-left px-4 py-3">Cargo</th>
                      <th className="text-left px-4 py-3">Tipo usuario</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Operacao TI</th>
                      <th className="text-left px-4 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t align-top hover:bg-muted/20 transition">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.phone}</td>
                        <td className="px-4 py-3 text-sm">
                          {departments.find((item) => item.id === user.departmentId)?.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatBranchName(
                            branches.find((item) => item.id === user.branchId)?.name ??
                              "Nao informado",
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{user.jobTitle || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={user.role === "TI_ADMIN" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.active ? "default" : "outline"}>
                            {user.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {user.role === "TI_ADMIN" ? (
                            <Badge variant={user.canReceiveTickets ? "default" : "outline"}>
                              {user.canReceiveTickets ? "Recebe OS" : "Somente acompanhamento"}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => beginEdit(user)}>
                              <UserCog2 className="size-3.5" /> Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void toggleUserActive(user.id)}
                            >
                              {user.active ? "Inativar" : "Ativar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => beginResetPassword(user)}
                            >
                              <KeyRound className="size-3.5" /> Redefinir senha
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar usuario" : "Novo usuario"}</DialogTitle>
            <DialogDescription>Preencha os dados basicos do usuario.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Nome completo *</Label>
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex: Carlos Eduardo de Oliveira"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Nome de usuário (para login) *</Label>
              <Input
                value={draft.username}
                onChange={(event) => setDraft((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="Ex: carlos.oliveira"
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail (opcional)</Label>
              <Input
                value={draft.email}
                onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="carlos@empresa.com"
              />
            </div>
            <div className="space-y-1">
              <Label>Telefone *</Label>
              <Input
                value={draft.phone}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, phone: maskPhone(event.target.value) }))
                }
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <Input
                value={draft.whatsapp}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, whatsapp: maskPhone(event.target.value) }))
                }
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label>Ramal</Label>
              <Input
                value={draft.extension}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, extension: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Setor *</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.departmentId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, departmentId: event.target.value }))
                }
              >
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Filial/local *</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.branchId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, branchId: event.target.value }))
                }
              >
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatBranchName(item.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Cargo/funcao</Label>
              <Input
                value={draft.jobTitle}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, jobTitle: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de usuario</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.role}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, role: event.target.value as UserDraft["role"] }))
                }
              >
                <option value="SOLICITANTE">SOLICITANTE</option>
                <option value="TI_ADMIN">TI_ADMIN</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Observacao</Label>
              <Input
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            {draft.role === "TI_ADMIN" ? (
              <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border p-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.canReceiveTickets}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, canReceiveTickets: event.target.checked }))
                  }
                />
                <span>
                  <span className="block text-sm font-medium">
                    Pode receber OS como responsavel
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Desative para administradores que acompanham a operacao, mas nao executam
                    atendimentos.
                  </span>
                </span>
              </label>
            ) : null}
            {!draft.id ? (
              <div className="space-y-1 sm:col-span-2">
                <Label>Senha inicial *</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={draft.initialPassword}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, initialPassword: event.target.value }))
                  }
                  placeholder="Minimo de 6 caracteres"
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              <Save className="size-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(nextOpen) => !nextOpen && setResetTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha temporaria para {resetTarget?.name}. A alteracao sera registrada
              na auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Nova senha *</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={resetDraft}
              onChange={(event) => setResetDraft(event.target.value)}
              placeholder="Minimo de 6 caracteres"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void resetPassword()} disabled={resetSaving}>
              <KeyRound className="size-4" /> {resetSaving ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
