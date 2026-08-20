import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, HelpCircle, Loader2, LogIn, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { loginSchema } from "@/lib/validation";
import { listPublicDepartmentsApi, listPublicBranchesApi } from "@/services/helpdesk-api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login | AgroDesk TI" }] }),
  component: LoginPage,
});

// ─── Modal Esqueci Minha Senha ──────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"username" | "confirm" | "done">("username");
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<{ name: string; username: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      toast.error("Digite seu nome de usuário.");
      return;
    }

    setLoading(true);
    try {
      // Tenta fazer login falso para verificar se o usuário existe via endpoint público
      const res = await fetch("/api/v1/auth/forgot-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      if (res.ok) {
        const data = (await res.json()) as { name: string; username: string };
        setFoundUser(data);
        setStep("confirm");
      } else if (res.status === 404) {
        toast.error("Usuário não encontrado. Verifique o nome digitado.");
      } else {
        toast.error("Erro ao buscar usuário. Tente novamente.");
      }
    } catch {
      toast.error("Erro de conexão. Verifique se o servidor está disponível.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOS = async () => {
    if (!foundUser) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: foundUser.username }),
      });

      if (res.ok) {
        const data = (await res.json()) as { protocol: string };
        setStep("done");
        toast.success(`OS criada com sucesso! Protocolo: ${data.protocol}`);
      } else {
        toast.error("Não foi possível criar o chamado. Fale com a TI.");
      }
    } catch {
      toast.error("Erro ao criar chamado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" />
            <span className="font-semibold text-base">Esqueci minha senha</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          {/* STEP 1: Digitar usuário */}
          {step === "username" && (
            <form onSubmit={(e) => void handleSearch(e)} className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Digite seu <strong>nome de usuário</strong> abaixo. O sistema irá localizar sua conta
                e abrir um chamado de TI automaticamente para redefinição de senha.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-username">Nome de usuário</Label>
                <Input
                  id="forgot-username"
                  type="text"
                  placeholder="Ex: carolina.silva"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="size-4 animate-spin" /> Buscando...</>
                ) : (
                  "Localizar minha conta"
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: Confirmar e criar OS */}
          {step === "confirm" && foundUser && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  ✅ Conta encontrada!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Usuário: <strong>{foundUser.name}</strong> ({foundUser.username})
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Confirme para que o sistema abra um chamado automático de
                <strong> "Redefinição de Senha"</strong> para a equipe de TI. Um técnico
                entrará em contato com você para concluir o processo.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("username")}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button className="flex-1" onClick={() => void handleCreateOS()} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Criando OS...</>
                  ) : (
                    "Confirmar e abrir chamado"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Sucesso */}
          {step === "done" && (
            <div className="space-y-4 text-center py-2">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-base">Chamado aberto com sucesso!</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  A equipe de TI recebeu sua solicitação de redefinição de senha e entrará
                  em contato. Verifique o protocolo no seu portal quando tiver acesso.
                </p>
              </div>
              <Button className="w-full" onClick={onClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ─────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados de login invalidos.");
      return;
    }

    setSubmitting(true);
    const user = await login(parsed.data.username, parsed.data.password);
    setSubmitting(false);
    if (!user) return;

    toast.success(`Acesso liberado para ${user.name.split(" ")[0]}.`);
    navigate({
      to: user.mustChangePassword
        ? "/app/primeiro-acesso"
        : user.role === "TI_ADMIN"
          ? "/app/dashboard"
          : "/app/portal",
    });
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="min-h-screen grid lg:grid-cols-[1.2fr_1fr] bg-background">
        <section
          className="hidden lg:flex relative overflow-hidden"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 25%, oklch(0.68 0.16 145 / 0.55), transparent 42%), radial-gradient(circle at 80% 65%, oklch(0.62 0.14 230 / 0.45), transparent 48%)",
            }}
          />
          <div className="relative z-10 p-12 xl:p-16 flex flex-col text-white w-full">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl grid place-items-center bg-white/10 border border-white/20 backdrop-blur p-1.5 overflow-hidden shrink-0">
                <img src="/logo.png" alt="AgroDesk TI Logo" className="size-full object-contain" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">AgroDesk TI</div>
                <div className="text-xs text-white/70">Central de Help Desk e OS</div>
              </div>
            </div>

            <div className="mt-auto max-w-xl space-y-6">
              <h1 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
                Plataforma interna de suporte
                <br />
                para operacao do agronegocio.
              </h1>
              <p className="text-white/75">
                Controle chamados por setor e filial, acompanhe SLA e mantenha as unidades operando
                com previsibilidade.
              </p>
              <div className="space-y-3 pt-3">
                {[
                  "Atendimento centralizado por protocolo",
                  "Acompanhamento de SLA e prioridades",
                  "Rastreabilidade completa das alteracoes",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/85">
                    <CheckCircle2 className="size-4 text-white/75" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="size-11 rounded-xl grid place-items-center bg-card border shadow-[var(--shadow-card)] p-1 overflow-hidden shrink-0">
                <img src="/logo.png" alt="AgroDesk TI Logo" className="size-full object-contain" />
              </div>
              <div>
                <div className="font-semibold">AgroDesk TI</div>
                <div className="text-xs text-muted-foreground">Central de suporte</div>
              </div>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight">Entrar no sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use seu nome de usuário para acessar o portal de chamados.
            </p>

            <form onSubmit={(event) => void submit(event)} className="space-y-4 mt-8">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Seu nome de usuário (ex: Victor)"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setShowForgot(true)}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={submitting}>
                <LogIn className="size-4" /> {submitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center space-y-2">
              <p className="text-xs text-muted-foreground">Ainda não possui um usuário?</p>
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline transition"
              >
                <UserPlus className="size-4" /> Cadastre-se para abrir Ordens de Serviço
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
