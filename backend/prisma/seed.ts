import { PrismaClient, TicketPriority, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient();
const INITIAL_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD ?? "AgroDesk@2026";
const BCRYPT_ROUNDS = 10;

const departments = [
  "Administrativo",
  "Financeiro",
  "Vendas",
  "Estoque",
  "Expedicao",
  "Faturamento",
  "Compras",
  "Producao",
  "Loja",
  "Campo",
  "Gerencia",
  "Diretoria",
];

const branches = ["Loja 1", "Loja 2", "Loja 3", "Loja 4", "Loja 5"];

const categories = [
  ["Computador / Notebook", TicketPriority.MEDIUM, 24, ["Nao liga", "Lentidao", "Sem imagem"]],
  ["Impressora", TicketPriority.MEDIUM, 24, ["Nao imprime", "Atolamento", "Driver"]],
  ["Internet / Rede", TicketPriority.HIGH, 8, ["Lentidao", "Oscilacao", "Sem conexao"]],
  ["Sistema ERP", TicketPriority.HIGH, 8, ["Travamento", "Faturamento", "Integracao"]],
  ["E-mail", TicketPriority.MEDIUM, 12, ["Bloqueio", "Nao envia", "Nao recebe"]],
  ["Acesso / Senha", TicketPriority.MEDIUM, 6, ["Sem acesso", "Reset de senha", "Permissao"]],
  ["Telefonia / Ramal", TicketPriority.MEDIUM, 12, ["Sem audio", "Sem linha", "Config ramal"]],
  [
    "Cameras / Seguranca",
    TicketPriority.HIGH,
    16,
    ["Offline", "Sem gravacao", "Sem acesso remoto"],
  ],
  ["Balanca", TicketPriority.HIGH, 12, ["Sem comunicacao", "Sem leitura", "Integracao ERP"]],
  ["Equipamento Operacional", TicketPriority.HIGH, 16, ["Leitor", "Coletor", "Terminal"]],
  ["Instalacao de Software", TicketPriority.LOW, 48, ["Fiscal", "Office", "Utilitario"]],
  ["Manutencao Preventiva", TicketPriority.LOW, 72, ["Backup", "Checklist", "Atualizacao"]],
  [
    "Cadastro / Permissao",
    TicketPriority.MEDIUM,
    12,
    ["Novo cadastro", "Permissao modulo", "Inativacao"],
  ],
  ["Outro", TicketPriority.MEDIUM, 24, ["Especificar no campo adicional"]],
] as const;

const admins = [
  {
    name: "Marcelo",
    email: "marcelo.ti@agrodesk.com",
    phone: "(44) 99999-1002",
    position: "TI Admin",
    department: "Gerencia",
    branch: "Loja 2",
    canReceiveTickets: true,
  },
  {
    name: "Victor",
    email: "victor.ti@agrodesk.com",
    phone: "(44) 99999-1001",
    position: "TI Admin",
    department: "Gerencia",
    branch: "Loja 1",
    canReceiveTickets: true,
  },
  {
    name: "Gustavo",
    email: "gustavo@agrodesk.com",
    phone: "(44) 99999-1003",
    position: "Administrador de Loja",
    department: "Gerencia",
    branch: "Loja 3",
    canReceiveTickets: false,
  },
  {
    name: "Geraldo",
    email: "geraldo@agrodesk.com",
    phone: "(44) 99999-1004",
    position: "Administrador de Loja",
    department: "Gerencia",
    branch: "Loja 4",
    canReceiveTickets: false,
  },
] as const;

function clearUploadDirectory() {
  const backendRoot = path.resolve(process.cwd());
  const uploadRoot = path.resolve(backendRoot, process.env.UPLOAD_DIR ?? "uploads");
  const insideBackend =
    uploadRoot === backendRoot || uploadRoot.startsWith(`${backendRoot}${path.sep}`);
  if (!insideBackend || uploadRoot === backendRoot) {
    throw new Error(`UPLOAD_DIR inseguro para limpeza automatica: ${uploadRoot}`);
  }

  fs.rmSync(uploadRoot, { recursive: true, force: true });
  fs.mkdirSync(uploadRoot, { recursive: true });
}

async function clearDatabase() {
  await prisma.$transaction([
    prisma.ticketRating.deleteMany(),
    prisma.ticketStatusHistory.deleteMany(),
    prisma.ticketComment.deleteMany(),
    prisma.ticketAttachment.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.assetMovement.deleteMany(),
    prisma.assetMaintenance.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.user.deleteMany(),
    prisma.subcategory.deleteMany(),
    prisma.category.deleteMany(),
    prisma.department.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
}

async function main() {
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_ROUNDS);
  await clearDatabase();
  clearUploadDirectory();

  const departmentIds = new Map<string, string>();
  for (const name of departments) {
    const department = await prisma.department.create({
      data: { name, description: `Setor ${name}`, isActive: true },
    });
    departmentIds.set(name, department.id);
  }

  const branchIds = new Map<string, string>();
  for (const [index, name] of branches.entries()) {
    const branch = await prisma.branch.create({
      data: {
        name,
        address: `Endereco da ${name}`,
        description: `Filial ${index + 1}`,
        isActive: true,
      },
    });
    branchIds.set(name, branch.id);
  }

  for (const [name, defaultPriority, defaultSlaHours, subcategories] of categories) {
    await prisma.category.create({
      data: {
        name,
        description: `Atendimentos relacionados a ${name}`,
        defaultPriority,
        defaultSlaHours,
        isActive: true,
        subcategories: {
          create: subcategories.map((subcategory) => ({
            name: subcategory,
            description: `${subcategory} - ${name}`,
            isActive: true,
          })),
        },
      },
    });
  }

  for (const admin of admins) {
    const tempPassword = `${admin.name.toLowerCase()}123`;
    const userPasswordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
    await prisma.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        passwordHash: userPasswordHash,
        role: UserRole.TI_ADMIN,
        phone: admin.phone,
        whatsapp: admin.phone,
        position: admin.position,
        departmentId: departmentIds.get(admin.department),
        branchId: branchIds.get(admin.branch),
        isActive: true,
        mustChangePassword: true,
        canReceiveTickets: admin.canReceiveTickets,
      },
    });
  }

  await prisma.setting.create({
    data: {
      key: "global",
      description: "Configuracoes globais do AgroDesk TI",
      value: {
        companyName: "AgroDesk TI",
        logo: "AgroDesk TI",
        defaultSlaHours: 24,
        uploadLimitMb: 10,
        itContactName: "Equipe de TI",
        itContactEmail: "suporte.ti@agrodesk.com",
        itContactPhone: "",
      },
    },
  });

  console.log("Base AgroDesk TI preparada para producao.");
  console.log(`- Usuarios cadastrados: ${admins.length}`);
  console.log("- Tickets, comentarios, anexos, notificacoes e auditoria: zerados");
  console.log("- Marcelo e Victor: habilitados para receber OS");
  console.log("- Gustavo e Geraldo: acesso administrativo completo, sem atribuicao de OS");
  console.log("- Todos os usuarios devem trocar a senha temporaria no primeiro acesso");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
