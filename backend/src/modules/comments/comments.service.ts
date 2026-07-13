import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, UserRole } from "@prisma/client";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import {
  assertResourceOwnerOrAdmin,
  forbidWithAudit,
} from "../../common/security/access-control.util";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getTicketOrFail(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");
    return ticket;
  }

  private async denyAccess(
    actor: AuthUser,
    ticketId: string,
    deniedAction: string,
    reason: string,
    details?: Record<string, unknown>,
  ): Promise<never> {
    return forbidWithAudit({
      prisma: this.prisma,
      actor,
      entity: "Ticket",
      entityId: ticketId,
      deniedAction,
      reason,
      details,
    });
  }

  private async ensureTicketOwnership(
    actor: AuthUser,
    ticketId: string,
    ownerUserId: string,
    deniedAction: string,
    reason: string,
  ) {
    await assertResourceOwnerOrAdmin({
      prisma: this.prisma,
      actor,
      entity: "Ticket",
      entityId: ticketId,
      ownerUserId,
      deniedAction,
      reason,
    });
  }

  async list(actor: AuthUser, ticketId: string) {
    const ticket = await this.getTicketOrFail(ticketId);
    await this.ensureTicketOwnership(
      actor,
      ticketId,
      ticket.requesterId,
      "TICKET_COMMENT_LIST_DENIED",
      "Sem permissao para visualizar comentarios",
    );

    return this.prisma.ticketComment.findMany({
      where: {
        ticketId,
        isInternal: actor.role === UserRole.SOLICITANTE ? false : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(actor: AuthUser, ticketId: string, dto: CreateCommentDto) {
    const ticket = await this.getTicketOrFail(ticketId);

    await this.ensureTicketOwnership(
      actor,
      ticketId,
      ticket.requesterId,
      "TICKET_COMMENT_CREATE_DENIED",
      "Sem permissao para comentar nesta OS",
    );

    if (dto.internal && actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(
        actor,
        ticketId,
        "TICKET_INTERNAL_COMMENT_DENIED",
        "Somente TI_ADMIN pode criar comentario interno",
        { internal: true },
      );
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        userId: actor.sub,
        content: dto.content,
        isInternal: dto.internal ?? false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Ticket",
        entityId: ticketId,
        action: dto.internal ? "TICKET_INTERNAL_COMMENT" : "TICKET_PUBLIC_COMMENT",
      },
    });

    if (dto.internal) {
      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.TI_ADMIN, isActive: true, id: { not: actor.sub } },
        select: { id: true },
      });
      await this.notificationsService.notifyMany({
        userIds: admins.map((item) => item.id),
        type: NotificationType.COMMENT_ADDED,
        title: "Comentario interno",
        message: `${ticket.protocolNumber} recebeu comentario interno`,
        ticketId,
      });
    } else {
      const recipients = [ticket.requesterId, ticket.assignedToId].filter(
        (value): value is string => Boolean(value) && value !== actor.sub,
      );
      await this.notificationsService.notifyMany({
        userIds: recipients,
        type: NotificationType.COMMENT_ADDED,
        title: "Novo comentario",
        message: `${ticket.protocolNumber} recebeu novo comentario`,
        ticketId,
      });
    }

    return comment;
  }
}
