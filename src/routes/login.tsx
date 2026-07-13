import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, LogIn, Sprout } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { loginSchema } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login | AgroDesk TI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
            <div className="size-12 rounded-2xl grid place-items-center bg-white/10 border border-white/20 backdrop-blur">
              <Sprout className="size-6" />
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
            <div className="size-11 rounded-xl grid place-items-center bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
              <Sprout className="size-5" />
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
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu nome de usuário"
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
                  onClick={() =>
                    toast.info("Recuperacao de senha", {
                      description: "Solicite a redefinicao para a equipe de TI.",
                    })
                  }
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={submitting}>
              <LogIn className="size-4" /> {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
