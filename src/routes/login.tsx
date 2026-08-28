import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Laptop,
  Loader2,
  Lock,
  LogIn,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { loginSchema } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login | AgroDesk TI Harmony" }] }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Esqueci minha senha</h3>
              <p className="text-xs text-muted-foreground">Recuperação e suporte de acesso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1: Digitar usuário */}
          {step === "username" && (
            <form onSubmit={(e) => void handleSearch(e)} className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Digite seu <strong>nome de usuário</strong> corporativo. O sistema localizará seu cadastro
                e abrirá uma Ordem de Serviço prioritária para a equipe de TI.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-username">Nome de usuário</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="forgot-username"
                    type="text"
                    placeholder="Ex: victor.moraes"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="pl-10 h-11"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2 shadow-md" disabled={loading}>
                {loading ? (
                  <><Loader2 className="size-4 animate-spin" /> Buscando conta...</>
                ) : (
                  <>Localizar minha conta <ArrowRight className="size-4" /></>
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: Confirmar e criar OS */}
          {step === "confirm" && foundUser && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Conta identificada com sucesso!
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    Colaborador: <strong>{foundUser.name}</strong> ({foundUser.username})
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ao confirmar, o sistema gerará um chamado de <strong>Redefinição de Senha</strong>.
                Um técnico de TI entrará em contato para resetar seu acesso com segurança.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setStep("username")}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 h-11 font-semibold gap-1.5 shadow-md"
                  onClick={() => void handleCreateOS()}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Gerando OS...</>
                  ) : (
                    <>Confirmar e Abrir OS</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Sucesso */}
          {step === "done" && (
            <div className="space-y-4 text-center py-3">
              <div className="flex justify-center">
                <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                  <CheckCircle2 className="size-9" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg text-foreground">Ordem de Serviço Aberta!</h4>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  A equipe de TI já foi notificada. Seu chamado está na fila prioritária de atendimento.
                </p>
              </div>
              <Button className="w-full h-11 font-semibold" onClick={onClose}>
                Entendido, fechar
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
      toast.error(parsed.error.issues[0]?.message ?? "Dados de login inválidos.");
      return;
    }

    setSubmitting(true);
    const user = await login(parsed.data.username, parsed.data.password);
    setSubmitting(false);
    if (!user) return;

    toast.success(`Bem-vindo, ${user.name.split(" ")[0]}!`);
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

      <div className="min-h-screen grid lg:grid-cols-[1.25fr_1fr] bg-background">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* LADO ESQUERDO: BRANDING ENTERPRISE & HERO SHOWCASE                  */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0a2318] to-slate-950 p-12 xl:p-16 flex-col justify-between text-white select-none">
          {/* Efeitos de Iluminação e Grade de Fundo */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          <div className="absolute -top-32 -left-32 size-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 size-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Topo: Logo Proeminente e Status do Sistema */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/30 flex items-center justify-center shrink-0 ring-4 ring-white/10 transition-transform hover:scale-105">
                <img
                  src="/logo.png"
                  alt="AgroDesk TI Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                    AgroDesk TI
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    Harmony v2.4
                  </span>
                </div>
                <p className="text-xs font-medium text-emerald-200/80 mt-0.5">
                  Central Integrada de Suporte, Help Desk & Gestão de Ativos
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-sm">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistemas Online
            </div>
          </div>

          {/* Centro: Título Principal e Proposta de Valor */}
          <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white/90 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-4 text-emerald-400" />
              Tecnologia e Alta Disponibilidade no Campo e na Cidade
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] tracking-tight text-white">
              Gestão Inteligente de Suporte e Tecnologia para o{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-200">
                Agronegócio.
              </span>
            </h1>

            <p className="text-base text-white/80 leading-relaxed">
              Controle centralizado de ordens de serviço por setor e filial, monitoramento de SLA em tempo real, gestão completa de inventário e atendimento prioritário para suas unidades.
            </p>

            {/* Grid de Cards Interativos de Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Clock className="size-4" /> SLA em Horário Útil
                </div>
                <p className="text-xs text-white/70">
                  Cálculo automático em horário comercial com prazos assertivos por serviço.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Zap className="size-4" /> WebSockets ao Vivo
                </div>
                <p className="text-xs text-white/70">
                  Alertas instantâneos sonoros e visuais na abertura e atualização de chamados.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                  <Building2 className="size-4" /> Rede de Filiais & Setores
                </div>
                <p className="text-xs text-white/70">
                  Rastreabilidade e triagem por departamento, unidade física e patrimônio.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <ShieldCheck className="size-4" /> Segurança & Auditoria
                </div>
                <p className="text-xs text-white/70">
                  Histórico completo de alterações com soft-delete e recuperação de dados.
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé do Hero: Badges de Confiança */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>AgroDesk TI Harmony Platform</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> SLA Monitorado
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Criptografia Ponta a Ponta
              </span>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* LADO DIREITO: FORMULÁRIO DE LOGIN                                  */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          {/* Luz Ambiente Sutil de Fundo */}
          <div className="absolute top-10 right-10 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 size-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-md relative z-10 space-y-8">
            {/* Header Mobile com Logo */}
            <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-4">
              <div className="h-16 px-4 py-2 rounded-2xl bg-card border shadow-lg flex items-center justify-center">
                <img src="/logo.png" alt="AgroDesk TI Logo" className="h-12 w-auto object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">AgroDesk TI</h1>
                <p className="text-xs text-muted-foreground">Central de Help Desk e Suporte</p>
              </div>
            </div>

            {/* Box Principal de Login */}
            <div className="rounded-3xl border bg-card/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border-border/80 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  <Lock className="size-3.5" /> Portal de Acesso Corporativo
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Entrar no Sistema
                </h2>
                <p className="text-sm text-muted-foreground">
                  Informe seu usuário para acessar ordens de serviço e painéis.
                </p>
              </div>

              <form onSubmit={(event) => void submit(event)} className="space-y-4">
                {/* Campo Usuário */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nome de usuário
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ex: victor.moraes"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      className="pl-10 h-12 text-sm rounded-xl focus:ring-2 focus:ring-primary font-medium"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Senha de acesso
                    </Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary/80 font-semibold transition cursor-pointer"
                      onClick={() => setShowForgot(true)}
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      className="pl-10 pr-11 h-12 text-sm rounded-xl focus:ring-2 focus:ring-primary font-medium"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Botão Entrar */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-bold tracking-wide gap-2 shadow-lg shadow-primary/25 mt-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Autenticando...
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4" /> Acessar Minha Conta
                    </>
                  )}
                </Button>
              </form>

              {/* Box de Cadastro */}
              <div className="pt-4 border-t border-border/70 text-center">
                <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                  <p className="text-xs text-muted-foreground">Primeiro acesso na empresa?</p>
                  <Link
                    to="/cadastro"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition mt-1"
                  >
                    <UserPlus className="size-3.5" /> Criar cadastro para abrir chamados <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Rodapé Discreto */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>AgroDesk TI Harmony • Sistema de Gestão e Suporte</p>
              <p className="text-[11px] opacity-70">© 2026 Todos os direitos reservados</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
