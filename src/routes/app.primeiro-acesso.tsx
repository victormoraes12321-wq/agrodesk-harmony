import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { KeyRound, LockKeyhole, Sprout } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/primeiro-acesso")({
  head: () => ({ meta: [{ title: "Definir nova senha | AgroDesk TI" }] }),
  component: FirstAccessPage,
});

function FirstAccessPage() {
  const { currentUser, changeMyPassword, logout } = useApp();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  if (!currentUser) return <Navigate to="/login" />;
  if (!currentUser.mustChangePassword) {
    return <Navigate to={currentUser.role === "TI_ADMIN" ? "/app/dashboard" : "/app/portal"} />;
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmation) {
      toast.error("A confirmacao da senha nao confere.");
      return;
    }

    setSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      await logout();
      toast.success("Senha definida com sucesso. Entre novamente com sua nova senha.");
      navigate({ to: "/login" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel alterar sua senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-4 py-8">
      <Card className="w-full max-w-lg shadow-[var(--shadow-card)]">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl grid place-items-center bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </div>
            <div>
              <p className="font-semibold">AgroDesk TI</p>
              <p className="text-xs text-muted-foreground">Protecao de primeiro acesso</p>
            </div>
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-5 text-primary" /> Defina sua nova senha
            </CardTitle>
            <CardDescription className="mt-2">
              Sua senha atual e temporaria. Para proteger sua conta, cadastre uma senha pessoal
              antes de acessar o sistema.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void save(event)}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha temporaria</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimo de 8 caracteres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirme a nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={saving}>
              <KeyRound className="size-4" /> {saving ? "Salvando..." : "Definir nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
