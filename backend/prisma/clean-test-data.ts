import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando limpeza de dados sintéticos de teste...");

  // 1. Delete test tickets (titles starting with "Carga", "E2E", or "Fluxo critico" or created by carga users)
  const testUserIds = (
    await prisma.user.findMany({
      where: { email: { contains: "carga.solicitante", mode: "insensitive" } },
      select: { id: true },
    })
  ).map((u) => u.id);

  const testTicketIds = (
    await prisma.ticket.findMany({
      where: {
        OR: [
          { title: { contains: "Carga", mode: "insensitive" } },
          { title: { contains: "E2E", mode: "insensitive" } },
          { title: { contains: "Fluxo critico", mode: "insensitive" } },
          { requesterId: { in: testUserIds } },
          { assignedToId: { in: testUserIds } },
        ],
      },
      select: { id: true },
    })
  ).map((t) => t.id);

  if (testTicketIds.length > 0) {
    await prisma.ticketAttachment.deleteMany({ where: { ticketId: { in: testTicketIds } } });
    await prisma.ticketComment.deleteMany({ where: { ticketId: { in: testTicketIds } } });
    await prisma.ticketStatusHistory.deleteMany({ where: { ticketId: { in: testTicketIds } } });
    await prisma.ticketRating.deleteMany({ where: { ticketId: { in: testTicketIds } } });
    await prisma.ticket.deleteMany({ where: { id: { in: testTicketIds } } });
  }

  if (testUserIds.length > 0) {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  }

  console.log("Limpeza de dados de teste concluída com sucesso.");
  console.log(`- Removidos ${testTicketIds.length} tickets sintéticos e seus anexos/históricos.`);
  console.log(`- Removidos ${testUserIds.length} usuários sintéticos de teste de carga.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
