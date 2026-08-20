import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Informe o nome de usuário."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(3, "Informe seu nome completo."),
    username: z.string().trim().min(3, "Informe um nome de usuário para login."),
    email: z.string().trim().optional(),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
    departmentId: z.string().trim().min(1, "Selecione seu setor/departamento."),
    branchId: z.string().trim().min(1, "Selecione sua filial/unidade."),
    phone: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    extension: z.string().trim().optional(),
    jobTitle: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  phone: z.string().trim().min(6, "Informe um telefone valido."),
  whatsapp: z.string().trim().optional(),
  extension: z.string().trim().optional(),
  email: z.string().trim().optional(),
  departmentId: z.string().trim().min(1, "Selecione o setor."),
  branchId: z.string().trim().min(1, "Selecione a filial/local."),
  jobTitle: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const newTicketSchema = z.object({
  requesterName: z.string().trim().min(3, "Nome do solicitante obrigatorio."),
  requesterPhone: z.string().trim().min(6, "Telefone obrigatorio."),
  departmentId: z.string().trim().min(1, "Setor obrigatorio."),
  branchId: z.string().trim().min(1, "Filial/local obrigatorio."),
  categoryId: z.string().trim().min(1, "Selecione a categoria do chamado."),
  subcategoryId: z.string().trim().min(1, "Selecione a subcategoria do chamado."),
  description: z.string().trim().min(10, "Descreva o problema com mais detalhes (mínimo 10 caracteres)."),
  requesterEmail: z.string().trim().optional(),
});

export const userSchema = z.object({
  name: z.string().trim().min(3, "Nome completo obrigatorio."),
  username: z.string().trim().min(3, "Nome de usuário obrigatorio."),
  email: z.string().trim().optional(),
  phone: z.string().trim().min(6, "Telefone obrigatorio."),
  departmentId: z.string().trim().min(1, "Setor obrigatorio."),
  branchId: z.string().trim().min(1, "Filial/local obrigatorio."),
  role: z.enum(["SOLICITANTE", "TI_ADMIN"]),
});

export const settingsSchema = z.object({
  companyName: z.string().trim().min(2, "Nome da empresa obrigatorio."),
  logoText: z.string().trim().min(2, "Logo textual obrigatoria."),
  defaultSlaHours: z.number().min(1, "SLA padrao deve ser maior que zero."),
  uploadLimitMb: z.number().min(1, "Limite de upload deve ser maior que zero."),
  itContactEmail: z.string().trim().email("E-mail da TI invalido."),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Comentario nao pode estar vazio."),
});

export const ratingSchema = z.object({
  rating: z.number().min(1, "Selecione uma nota.").max(5, "Nota maxima e 5."),
});
