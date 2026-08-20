import { PrismaClient, TicketPriority, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const departments = [
  "TI",
  "Gerência",
  "Financeiro",
  "Administrativo",
  "Recursos Humanos",
  "Comercial",
  "Vendas",
  "Operações",
  "Logística",
  "Estoque",
  "Expedição",
  "Faturamento",
  "Compras",
  "Manutenção",
  "Jurídico",
  "Diretoria",
  "Campo",
  "Loja",
];

const branches = [
  { name: "Loja 1 - Matriz", address: "Av. Principal, 1000 - Centro", description: "Unidade Matriz" },
  { name: "Loja 2 - Filial Centro", address: "Rua das Flores, 500 - Centro", description: "Filial 01" },
  { name: "Loja 3 - Filial Norte", address: "Av. Norte, 1200 - Zona Norte", description: "Filial 02" },
  { name: "Loja 4 - Filial Sul", address: "Rodovia BR 376, Km 10", description: "Filial 03" },
  { name: "Loja 5 - Filial Distribuição", address: "Distrito Industrial, Galpão 4", description: "Filial 04" },
];

const categories = [
  ["Computador / Notebook", TicketPriority.MEDIUM, 48, ["Não liga", "Lentidão", "Sem imagem", "Periféricos"]],
  ["Impressora", TicketPriority.MEDIUM, 48, ["Não imprime", "Atolamento de papel", "Troca de toner/tinta"]],
  ["Internet / Rede", TicketPriority.HIGH, 24, ["Lentidão na internet", "Oscilação", "Sem conexão Wi-Fi/Cabo"]],
  ["Sistema ERP", TicketPriority.HIGH, 168, ["Erros no sistema", "Faturamento", "Integração fiscal"]],
  ["Desenvolvimento / Programação", TicketPriority.HIGH, 360, ["Novos recursos", "Ajuste de código", "Melhoria de sistema"]],
  ["E-mail", TicketPriority.MEDIUM, 24, ["Bloqueio de caixa", "Não envia/recebe", "Configuração Outlook"]],
  ["Acesso / Senha", TicketPriority.MEDIUM, 12, ["Sem acesso ao sistema", "Reset de senha", "Permissão de perfil"]],
  ["Telefonia / Ramal", TicketPriority.MEDIUM, 24, ["Ramal sem áudio", "Linha muda", "Configuração de aparelho"]],
  ["Câmeras / Segurança", TicketPriority.HIGH, 48, ["Câmera offline", "Sem gravação DVR", "Acesso remoto"]],
  ["Balança", TicketPriority.HIGH, 24, ["Sem comunicação", "Peso incorreto", "Integração ERP"]],
  ["Equipamentos Operacionais", TicketPriority.HIGH, 72, ["Leitor código de barras", "Coletor de dados", "Nobreak/Estabilizador"]],
  ["Instalação de Software", TicketPriority.LOW, 72, ["Emissor Fiscal", "Pacote Office", "Softwares Utilitários"]],
  ["Manutenção Preventiva", TicketPriority.LOW, 120, ["Backup", "Limpeza interna", "Atualizações de segurança"]],
  ["Outro", TicketPriority.MEDIUM, 72, ["Outro problema não listado"]],
] as const;

async function main() {
  console.log("Iniciando cadastro de Setores e Filiais...");

  const deptMap = new Map<string, string>();
  for (const name of departments) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, description: `Setor de ${name}`, isActive: true },
    });
    deptMap.set(name, dept.id);
  }

  const branchMap = new Map<string, string>();
  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { name: b.name },
      update: { address: b.address, description: b.description, isActive: true },
      create: { name: b.name, address: b.address, description: b.description, isActive: true },
    });
    branchMap.set(b.name, branch.id);
  }

  for (const [name, defaultPriority, defaultSlaHours, subcats] of categories) {
    let cat = await prisma.category.findUnique({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name,
          description: `Atendimentos de ${name}`,
          defaultPriority,
          defaultSlaHours,
          isActive: true,
        },
      });
    }
    for (const sub of subcats) {
      const existingSub = await prisma.subcategory.findFirst({
        where: { categoryId: cat.id, name: sub },
      });
      if (!existingSub) {
        await prisma.subcategory.create({
          data: {
            categoryId: cat.id,
            name: sub,
            description: `${sub} - ${name}`,
            isActive: true,
          },
        });
      }
    }
  }

  // Ensure Victor user exists and has a default department and branch
  const passwordHash = await bcrypt.hash("12345678", 10);
  const tiDeptId = deptMap.get("TI") ?? null;
  const matrizBranchId = branchMap.get("Loja 1 - Matriz") ?? null;

  const victor = await prisma.user.findFirst({
    where: { OR: [{ username: "Victor" }, { name: "Victor" }, { email: "ti@casadocampo.vet.br" }] },
  });

  if (victor) {
    await prisma.user.update({
      where: { id: victor.id },
      data: {
        name: "Victor Moraes",
        username: "Victor",
        email: "ti@casadocampo.vet.br",
        passwordHash,
        mustChangePassword: true,
        departmentId: victor.departmentId || tiDeptId,
        branchId: victor.branchId || matrizBranchId,
        canReceiveTickets: true,
        isActive: true,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name: "Victor Moraes",
        username: "Victor",
        email: "ti@casadocampo.vet.br",
        passwordHash,
        role: UserRole.TI_ADMIN,
        phone: "(33) 98722-2606",
        whatsapp: "(33) 98722-2606",
        position: "Administrador TI",
        departmentId: tiDeptId,
        branchId: matrizBranchId,
        isActive: true,
        mustChangePassword: true,
        canReceiveTickets: true,
      },
    });
  }

  console.log("✅ Setores, Filiais, Categorias e Usuário Victor atualizados com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
