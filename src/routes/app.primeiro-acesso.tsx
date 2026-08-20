import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
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

function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

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
            <div className="size-11 rounded-xl grid place-items-center bg-card border shadow-sm p-1 overflow-hidden shrink-0">
              <img src="/logo.png" alt="AgroDesk TI Logo" className="size-full object-contain" />
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
            <PasswordInput
              id="current-password"
              label="Senha temporaria"
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <PasswordInput
              id="new-password"
              label="Nova senha"
              autoComplete="new-password"
              placeholder="Minimo de 8 caracteres"
              value={newPassword}
              onChange={setNewPassword}
            />
            <PasswordInput
              id="confirm-password"
              label="Confirme a nova senha"
              autoComplete="new-password"
              value={confirmation}
              onChange={setConfirmation}
            />
            <Button type="submit" className="w-full h-11" disabled={saving}>
              <KeyRound className="size-4" /> {saving ? "Salvando..." : "Definir nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
