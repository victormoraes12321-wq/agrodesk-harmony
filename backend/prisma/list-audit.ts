import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("AUDIT_LOGS_START");
  console.log(JSON.stringify(logs, null, 2));
  console.log("AUDIT_LOGS_END");
}

main().catch(console.error).finally(() => prisma.$disconnect());
