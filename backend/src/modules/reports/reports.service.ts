import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ReportsQueryDto } from "./dto/reports-query.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: ReportsQueryDto): Prisma.TicketWhereInput {
    return {
      createdAt:
        query.startDate || query.endDate
          ? {
              gte: query.startDate ? new Date(query.startDate) : undefined,
              lte: query.endDate ? new Date(query.endDate) : undefined,
            }
          : undefined,
      departmentId: query.departmentId,
      branchId: query.branchId,
      categoryId: query.categoryId,
      assignedToId: query.assigneeUserId,
      realPriority: query.priority,
      status: query.status,
    };
  }

  private groupCount<T>(items: T[], getKey: (item: T) => string) {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = getKey(item);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, total]) => ({ key, total }));
  }

  private calculateOverviewData(
    tickets: Array<{
      createdAt: Date;
      closedAt: Date | null;
      resolvedAt: Date | null;
      slaDueAt: Date | null;
      status: string;
      timeSpentMinutes: number | null;
      realPriority: string;
      departmentId: string;
      branchId: string;
      categoryId: string | null;
      assignedToId: string | null;
    }>,
  ) {
    const byPeriod = this.groupCount(tickets, (ticket) =>
      ticket.createdAt.toISOString().slice(0, 10),
    );
    const byDepartment = this.groupCount(tickets, (ticket) => ticket.departmentId);
    const byBranch = this.groupCount(tickets, (ticket) => ticket.branchId);
    const byCategory = this.groupCount(tickets, (ticket) => ticket.categoryId ?? "NAO_INFORMADO");
    const byAssignee = this.groupCount(
      tickets,
      (ticket) => ticket.assignedToId ?? "SEM_RESPONSAVEL",
    );
    const byPriority = this.groupCount(tickets, (ticket) => ticket.realPriority);
    const byStatus = this.groupCount(tickets, (ticket) => ticket.status);

    const now = Date.now();
    let inSla = 0;
    let overdue = 0;

    for (const ticket of tickets) {
      const isCanceled =
        ticket.status === "CANCELED" ||
        ticket.status === "CANCELADO";
      if (isCanceled) {
        // Canceled tickets are not considered SLA breaches
        continue;
      }

      const isClosed = ticket.status === "CLOSED" || ticket.status === "FINALIZADO";
      const isResolved = ticket.status === "RESOLVED" || ticket.status === "RESOLVIDO";
      const isPaused =
        ticket.status === "WAITING_USER" ||
        ticket.status === "WAITING_PARTS_OR_THIRD_PARTY" ||
        ticket.status === "AGUARDANDO_USUARIO" ||
        ticket.status === "AGUARDANDO_PECA";

      const slaDueAtMs = ticket.slaDueAt
        ? ticket.slaDueAt.getTime()
        : ticket.createdAt.getTime() + 24 * 3600000;

      if (isClosed || isResolved) {
        const resolveRef =
          ticket.resolvedAt?.getTime() ?? ticket.closedAt?.getTime() ?? slaDueAtMs;
        if (resolveRef <= slaDueAtMs) {
          inSla++;
        } else {
          overdue++;
        }
      } else if (isPaused) {
        inSla++;
      } else {
        if (now <= slaDueAtMs) {
          inSla++;
        } else {
          overdue++;
        }
      }
    }

    const avgMinutes =
      tickets
        .filter((ticket) => typeof ticket.timeSpentMinutes === "number")
        .reduce((acc, cur) => acc + (cur.timeSpentMinutes ?? 0), 0) /
      Math.max(1, tickets.filter((ticket) => typeof ticket.timeSpentMinutes === "number").length);

    return {
      byPeriod,
      byDepartment,
      byBranch,
      byCategory,
      byAssignee,
      byPriority,
      byStatus,
      sla: { inSla, overdue },
      avgResolutionMinutes: Number.isFinite(avgMinutes) ? avgMinutes : 0,
    };
  }

  async getOverview(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const [tickets, ratings] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          resolvedAt: true,
          closedAt: true,
          slaDueAt: true,
          status: true,
          timeSpentMinutes: true,
          realPriority: true,
          departmentId: true,
          branchId: true,
          categoryId: true,
          assignedToId: true,
        },
      }),
      this.prisma.ticketRating.findMany({
        where: { ticket: where },
        select: { rating: true, comment: true, ticketId: true },
      }),
    ]);

    const grouped = this.calculateOverviewData(tickets);
    const avgRating =
      ratings.reduce((acc, cur) => acc + cur.rating, 0) / Math.max(1, ratings.length);

    return {
      totalTickets: tickets.length,
      ...grouped,
      ratings: {
        average: Number.isFinite(avgRating) ? avgRating : 0,
        total: ratings.length,
        items: ratings,
      },
    };
  }

  async getRecurringProblems(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const tickets = await this.prisma.ticket.findMany({
      where,
      select: { title: true, categoryId: true },
    });
    const grouped = this.groupCount(
      tickets,
      (ticket) => ticket.categoryId ?? (ticket.title ? ticket.title.slice(0, 24) : "SEM_TITULO"),
    );
    return grouped.sort((a, b) => b.total - a.total).slice(0, 20);
  }
}
