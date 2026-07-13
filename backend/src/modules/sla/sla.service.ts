import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, TicketPriority, TicketStatus } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { SettingsService } from "../settings/settings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateSlaPolicyDto } from "./dto/create-sla-policy.dto";
import { UpdateSlaPolicyDto } from "./dto/update-sla-policy.dto";

@Injectable()
export class SlaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async calculateSla(categoryId?: string, priority?: TicketPriority) {
    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (category && category.defaultSlaHours) {
        return { slaHours: category.defaultSlaHours, nearExpireThresholdMinutes: 120 };
      }
    }

    if (priority) {
      const settings = await this.settingsService.getSettings();
      const defaultSla = settings.defaultSlaHours;
      return { slaHours: defaultSla, nearExpireThresholdMinutes: 120 };
    }

    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (category) {
        return { slaHours: category.defaultSlaHours, nearExpireThresholdMinutes: 120 };
      }
    }

    const settings = await this.settingsService.getSettings();
    return { slaHours: settings.defaultSlaHours, nearExpireThresholdMinutes: 120 };
  }

  findPolicies() {
    throw new BadRequestException("Politicas SLA nao estao disponiveis no momento");
  }

  async createPolicy(actor: AuthUser, dto: CreateSlaPolicyDto) {
    throw new BadRequestException("Politicas SLA nao estao disponiveis no momento");
  }

  async updatePolicy(actor: AuthUser, id: string, dto: UpdateSlaPolicyDto) {
    throw new BadRequestException("Politicas SLA nao estao disponiveis no momento");
  }

  async removePolicy(actor: AuthUser, id: string) {
    throw new BadRequestException("Politicas SLA nao estao disponiveis no momento");
  }

  findOverdue() {
    return this.prisma.ticket.findMany({
      where: {
        status: { notIn: [TicketStatus.CLOSED, TicketStatus.CANCELED] },
        slaDueAt: { lt: new Date() },
      },
      orderBy: { slaDueAt: "asc" },
    });
  }

  findNearExpiry(minutes = 120) {
    const now = new Date();
    const until = new Date(Date.now() + minutes * 60000);
    return this.prisma.ticket.findMany({
      where: {
        status: { notIn: [TicketStatus.CLOSED, TicketStatus.CANCELED] },
        slaDueAt: { gte: now, lte: until },
      },
      orderBy: { slaDueAt: "asc" },
    });
  }

  async scanAndNotify(minutes = 120) {
    const [overdue, near] = await Promise.all([this.findOverdue(), this.findNearExpiry(minutes)]);

    for (const ticket of near) {
      const recipients = [ticket.requesterId, ticket.assignedToId].filter(
        (value): value is string => Boolean(value),
      );
      await this.notificationsService.notifyMany({
        userIds: recipients,
        type: NotificationType.SLA_WARNING,
        title: "SLA proximo de vencer",
        message: `${ticket.protocolNumber} esta proximo do vencimento de SLA`,
        ticketId: ticket.id,
      });
    }

    for (const ticket of overdue) {
      const recipients = [ticket.requesterId, ticket.assignedToId].filter(
        (value): value is string => Boolean(value),
      );
      await this.notificationsService.notifyMany({
        userIds: recipients,
        type: NotificationType.SLA_EXPIRED,
        title: "SLA vencido",
        message: `${ticket.protocolNumber} esta com SLA vencido`,
        ticketId: ticket.id,
      });
    }

    return { nearCount: near.length, overdueCount: overdue.length };
  }
}
