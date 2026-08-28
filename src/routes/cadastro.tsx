import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { maskPhone } from "@/lib/format";
import { registerFormSchema } from "@/lib/validation";
import { listPublicBranchesApi, listPublicDepartmentsApi } from "@/services/helpdesk-api";
import type { Branch, Department } from "@/types";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar Conta | AgroDesk TI" }] }),
  component: RegistrationPage,
});

function RegistrationPage() {
  const { register } = useApp();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [extension, setExtension] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadLookupData() {
      try {
        const [depts, brs] = await Promise.all([
          listPublicDepartmentsApi().catch(() => []),
          listPublicBranchesApi().catch(() => []),
        ]);
        if (mounted) {
          setDepartments(depts);
          setBranches(brs);
          if (depts.length > 0) setDepartmentId(depts[0].id);
          if (brs.length > 0) setBranchId(brs[0].id);
        }
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    void loadLookupData();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = registerFormSchema.safeParse({
      name,
      username,
      email,
      password,
      confirmPassword,
      departmentId,
      branchId,
      phone,
      whatsapp,
      extension,
      jobTitle,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os dados informados.");
      return;
    }

    setSubmitting(true);
    const user = await register({
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email,
      password: parsed.data.password,
      departmentId: parsed.data.departmentId,
      branchId: parsed.data.branchId,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      extension: parsed.data.extension,
      jobTitle: parsed.data.jobTitle,
    });
    setSubmitting(false);

    if (!user) return;

    toast.success(`Conta criada com sucesso! Bem-vindo(a), ${user.name.split(" ")[0]}.`);
    navigate({ to: "/app/portal" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, oklch(0.68 0.16 145 / 0.35), transparent 40%), radial-gradient(circle at 85% 80%, oklch(0.62 0.14 230 / 0.3), transparent 45%)",
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="flex items-center justify-center gap-4 mb-6 text-center">
          <div className="h-20 px-6 py-3 rounded-2xl bg-white border shadow-lg flex items-center justify-center shrink-0">
            <img src="/Logo_Casa_do_Campo.png" alt="Casa do Campo Logo" className="h-14 w-auto object-contain" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-black tracking-tight text-foreground">AgroDesk TI</div>
            <div className="text-xs text-muted-foreground font-medium">Central Integrada de Suporte & OS</div>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-card)] border border-border/80">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <UserPlus className="size-6 text-primary" /> Cadastro de Solicitante
              </CardTitle>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <ArrowLeft className="size-3.5" /> Voltar ao Login
              </Link>
            </div>
            <CardDescription>
              Preencha o formulário completo para criar seu usuário e abrir chamados diretamente no portal de suporte.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={(event) => void submit(event)} className="space-y-6">
              {/* Secao 1: Dados de Acesso */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b pb-1">
                  1. Dados Pessoais e Acesso
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="username">Nome de usuário (usado para entrar no sistema) *</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ex: carlos.oliveira"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Este nome de usuário será utilizado para fazer login no AgroDesk TI.
                    </p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ex: carlos.oliveira@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirme a senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secao 2: Setor e Unidade */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b pb-1">
                  2. Unidade e Setor de Trabalho
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Setor / Departamento *</Label>
                    {loadingData ? (
                      <Input disabled value="Carregando setores..." />
                    ) : (
                      <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Filial / Unidade *</Label>
                    {loadingData ? (
                      <Input disabled value="Carregando filiais..." />
                    ) : (
                      <Select value={branchId} onValueChange={setBranchId}>
                        <SelectTrigger id="branch">
                          <SelectValue placeholder="Selecione a filial" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((br) => (
                            <SelectItem key={br.id} value={br.id}>
                              {br.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* Secao 3: Contatos Adicionais (Opcionais) */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b pb-1">
                  3. Informações de Contato (Opcional)
                </h3>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="(00) 00000-0000"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extension">Ramal</Label>
                    <Input
                      id="extension"
                      placeholder="Ex: 204"
                      value={extension}
                      onChange={(e) => setExtension(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-3">
                    <Label htmlFor="jobTitle">Cargo / Função</Label>
                    <Input
                      id="jobTitle"
                      placeholder="Ex: Analista de Compras, Balconista, Gerente..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Permissão de Acesso:</span> Seu usuário será criado com a permissão de <strong className="text-primary">SOLICITANTE</strong>. Você poderá abrir chamados, anexar arquivos e acompanhar o status das suas Ordens de Serviço.
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <Link
                  to="/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition order-2 sm:order-1"
                >
                  Já possui conta? <strong className="text-primary hover:underline">Faça login aqui</strong>
                </Link>

                <Button type="submit" className="w-full sm:w-auto h-11 px-8 order-1 sm:order-2" disabled={submitting || loadingData}>
                  <UserPlus className="size-4" /> {submitting ? "Criando conta..." : "Criar conta e Acessar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
