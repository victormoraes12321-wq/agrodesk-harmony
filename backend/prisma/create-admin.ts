import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

type CliArgs = Record<string, string>;

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = value;
    index++;
  }
  return args;
}

function requiredArg(args: CliArgs, key: string) {
  const value = args[key];
  if (!value) {
    throw new Error(`Parametro obrigatorio ausente: --${key}`);
  }
  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    console.log(
      'Uso: npm run prisma:create-admin -- --name "Nome" --email "email@dominio.com" --password "Senha@123" --phone "(00) 99999-0000" --position "Cargo" [--department "Gerencia"] [--branch "Loja 1"] [--receive-tickets true]',
    );
    return;
  }

  const name = requiredArg(args, "name");
  const email = requiredArg(args, "email").toLowerCase();
  const password = requiredArg(args, "password");
  if (password.length < 8) {
    throw new Error("A senha temporaria precisa ter pelo menos 8 caracteres.");
  }
  const phone = requiredArg(args, "phone");
  const position = requiredArg(args, "position");
  const departmentName = args.department;
  const branchName = args.branch;
  const canReceiveTickets = args["receive-tickets"] === "true";

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let departmentId: string | null = null;
  if (departmentName) {
    const department = await prisma.department.findUnique({
      where: { name: departmentName },
      select: { id: true },
    });
    if (!department) {
      throw new Error(`Setor nao encontrado: ${departmentName}`);
    }
    departmentId = department.id;
  }

  let branchId: string | null = null;
  if (branchName) {
    const branch = await prisma.branch.findUnique({
      where: { name: branchName },
      select: { id: true },
    });
    if (!branch) {
      throw new Error(`Filial nao encontrada: ${branchName}`);
    }
    branchId = branch.id;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.TI_ADMIN,
      phone,
      position,
      departmentId,
      branchId,
      isActive: true,
      mustChangePassword: true,
      canReceiveTickets,
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.TI_ADMIN,
      phone,
      position,
      departmentId,
      branchId,
      isActive: true,
      mustChangePassword: true,
      canReceiveTickets,
    },
  });

  console.log(`Usuario TI_ADMIN pronto: ${user.email}`);
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
