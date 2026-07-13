import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const assetTypes = await prisma.assetType.findMany();
  const departments = await prisma.department.findMany();
  const branches = await prisma.branch.findMany();

  console.log("DB_INFO_START");
  console.log("AssetTypes:", JSON.stringify(assetTypes, null, 2));
  console.log("Departments:", JSON.stringify(departments, null, 2));
  console.log("Branches:", JSON.stringify(branches, null, 2));
  console.log("DB_INFO_END");
}

main().catch(console.error).finally(() => prisma.$disconnect());
