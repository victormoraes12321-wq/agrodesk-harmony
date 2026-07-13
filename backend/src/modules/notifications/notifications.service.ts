import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  notifyUser(input: {
    userId: string;
    type?: NotificationType;
    title: string;
    message: string;
    ticketId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? NotificationType.STATUS_CHANGED,
        title: input.title,
        message: input.message,
        ticketId: input.ticketId,
      },
    });
  }

  notifyMany(input: {
    userIds: string[];
    type?: NotificationType;
    title: string;
    message: string;
    ticketId?: string;
  }) {
    if (input.userIds.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.notification.createMany({
      data: input.userIds.map((userId) => ({
        userId,
        type: input.type ?? NotificationType.STATUS_CHANGED,
        title: input.title,
        message: input.message,
        ticketId: input.ticketId,
      })),
    });
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
