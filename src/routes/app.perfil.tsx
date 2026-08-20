import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import { usePageLoading } from "@/hooks/use-page-loading";
import { formatBranchName } from "@/lib/helpdesk";
import { maskPhone } from "@/lib/format";
import { useApp } from "@/lib/store";
import { profileSchema } from "@/lib/validation";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil | AgroDesk TI" }] }),
  component: ProfilePage,
});

type ProfileForm = {
  name: string;
  phone: string;
  whatsapp: string;
  extension: string;
  email: string;
  departmentId: string;
  branchId: string;
  jobTitle: string;
  notes: string;
};

function ProfilePage() {
  const { currentUser, departments, branches, updateProfile, changeMyPassword } = useApp();
  const loading = usePageLoading(160);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const initialValues = useMemo<ProfileForm>(
    () => ({
      name: currentUser?.name ?? "",
      phone: currentUser?.phone ?? "",
      whatsapp: currentUser?.whatsapp ?? "",
      extension: currentUser?.extension ?? "",
      email: currentUser?.email ?? "",
      departmentId: currentUser?.departmentId ?? "",
      branchId: currentUser?.branchId ?? "",
      jobTitle: currentUser?.jobTitle ?? "",
      notes: currentUser?.notes ?? "",
    }),
    [currentUser],
  );

  const [form, setForm] = useState<ProfileForm>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  if (!currentUser) return <Navigate to="/login" />;
  if (loading) return <PageLoading cards={0} rows={5} />;

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = profileSchema.safeParse({
      name: form.name.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      extension: form.extension.trim(),
      email: form.email.trim(),
      departmentId: form.departmentId,
      branchId: form.branchId,
      jobTitle: form.jobTitle.trim(),
      notes: form.notes.trim(),
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Dados invalidos.");
      return;
    }

    try {
      await updateProfile({
        name: validation.data.name,
        phone: validation.data.phone,
        whatsapp: validation.data.whatsapp,
        extension: validation.data.extension,
        email: validation.data.email,
        departmentId: validation.data.departmentId,
        branchId: validation.data.branchId,
        jobTitle: validation.data.jobTitle,
        notes: validation.data.notes,
      });
      toast.success("Perfil atualizado com sucesso");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel atualizar o perfil.";
      toast.error(message);
    }
  };

  const onChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword) {
      toast.error("Informe sua senha atual.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação de senha não confere com a nova senha.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao alterar a senha.";
      toast.error(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const defaultDepartment = departments.find((item) => item.id === form.departmentId)?.name ?? "-";
  const defaultBranch = formatBranchName(
    branches.find((item) => item.id === form.branchId)?.name ?? "-",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Dados"
        description="Mantenha seus dados atualizados. Eles preenchem automaticamente a abertura de OS."
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="size-5 text-primary" /> Perfil do usuario
            </CardTitle>
            <CardDescription>
              Campos basicos para atendimento rapido da equipe de TI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => void onSave(event)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário (Login)</Label>
                <Input
                  id="username"
                  value={currentUser.username || currentUser.name}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: maskPhone(event.target.value) }))}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, whatsapp: maskPhone(event.target.value) }))
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="extension">Ramal</Label>
                <Input
                  id="extension"
                  value={form.extension}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, extension: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="seuemail@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Setor padrao</Label>
                <select
                  id="department"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.departmentId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, departmentId: event.target.value }))
                  }
                  required
                >
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Filial/local padrao</Label>
                <select
                  id="branch"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.branchId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, branchId: event.target.value }))
                  }
                  required
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {formatBranchName(branch.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job">Cargo/funcao</Label>
                <Input
                  id="job"
                  value={form.jobTitle}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, jobTitle: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observacao (opcional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Informacoes importantes para atendimento"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex justify-end">
                <Button type="submit" className="min-w-44">
                  <Save className="size-4" /> Salvar dados
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" /> Resumo para abertura de OS
            </CardTitle>
            <CardDescription>
              Esses dados preenchem automaticamente os campos obrigatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Nome do solicitante</p>
              <p className="font-medium">{form.name || "-"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{form.phone || "-"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Setor padrao</p>
              <p className="font-medium">{defaultDepartment}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Filial/local padrao</p>
              <p className="font-medium">{defaultBranch}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="font-medium">{form.email || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Alterar Senha */}
      <Card className="shadow-[var(--shadow-card)] max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-5 text-primary" /> Alterar Minha Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha de acesso ao AgroDesk TI com segurança.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void onChangePassword(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={passwordSaving} className="min-w-44">
                <Save className="size-4" /> {passwordSaving ? "Salvando..." : "Alterar senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
