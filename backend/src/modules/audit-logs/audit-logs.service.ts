import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListAuditLogsQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      entity: query.entity,
      action: query.action,
      userId: query.actorUserId,
      entityId: query.entityId,
      createdAt:
        query.startDate || query.endDate
          ? {
              gte: query.startDate ? new Date(query.startDate) : undefined,
              lte: query.endDate ? new Date(query.endDate) : undefined,
            }
          : undefined,
    };

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async createLog(data: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        oldValue: data.oldValue ?? undefined,
        newValue: data.newValue ?? undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
