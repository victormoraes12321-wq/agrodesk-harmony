import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, UserRole } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import {
  assertResourceOwnerOrAdmin,
  forbidWithAudit,
} from "../../common/security/access-control.util";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SettingsService } from "../settings/settings.service";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".dll",
  ".com",
  ".scr",
  ".vbs",
  ".pif",
  ".gadget",
  ".application",
]);

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
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

  private ensureUploadAllowed(file: Express.Multer.File, maxMb: number) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      throw new BadRequestException("Arquivos executáveis não são permitidos por segurança.");
    }

    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`Arquivo excede o limite configurado de ${maxMb}MB.`);
    }
  }

  private safeDeleteTempFile(file?: Express.Multer.File) {
    const filePath = file?.path;
    if (!filePath) return;
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // no-op: best effort cleanup only
    }
  }

  async list(actor: AuthUser, ticketId: string) {
    const ticket = await this.getTicketOrFail(ticketId);
    await this.ensureTicketOwnership(
      actor,
      ticketId,
      ticket.requesterId,
      "TICKET_ATTACHMENT_LIST_DENIED",
      "Sem permissao para visualizar anexos",
    );

    return this.prisma.ticketAttachment.findMany({
      where: {
        ticketId,
        isInternal: actor.role === UserRole.SOLICITANTE ? false : undefined,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async upload(
    actor: AuthUser,
    ticketId: string,
    file: Express.Multer.File,
    dto: CreateAttachmentDto,
  ) {
    if (!file) throw new BadRequestException("Arquivo obrigatorio");

    try {
      const ticket = await this.getTicketOrFail(ticketId);
      await this.ensureTicketOwnership(
        actor,
        ticketId,
        ticket.requesterId,
        "TICKET_ATTACHMENT_UPLOAD_DENIED",
        "Sem permissao para anexar arquivo nesta OS",
      );
      if (dto.internal && actor.role !== UserRole.TI_ADMIN) {
        await this.denyAccess(
          actor,
          ticketId,
          "TICKET_ATTACHMENT_INTERNAL_DENIED",
          "Somente TI_ADMIN pode anexar como interno",
          { internal: true },
        );
      }

      const settings = await this.settingsService.getSettings();
      this.ensureUploadAllowed(file, settings.uploadLimitMb);

      const attachment = await this.prisma.ticketAttachment.create({
        data: {
          ticketId,
          uploadedById: actor.sub,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          isInternal: dto.internal ?? false,
          path: file.path,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId: actor.sub,
          entity: "Ticket",
          entityId: ticketId,
          action: "TICKET_ATTACHMENT_UPLOAD",
          newValue: { originalName: file.originalname, internal: dto.internal ?? false },
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
          title: "Novo anexo interno",
          message: `${ticket.protocolNumber} recebeu anexo interno`,
          ticketId,
        });
      } else {
        const recipients = [ticket.requesterId, ticket.assignedToId].filter(
          (value): value is string => Boolean(value) && value !== actor.sub,
        );
        await this.notificationsService.notifyMany({
          userIds: recipients,
          title: "Novo anexo",
          message: `${ticket.protocolNumber} recebeu novo anexo`,
          ticketId,
        });
      }

      return attachment;
    } catch (error) {
      this.safeDeleteTempFile(file);
      throw error;
    }
  }

  async getDownload(actor: AuthUser, attachmentId: string) {
    const attachment = await this.prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });
    if (!attachment) throw new NotFoundException("Anexo nao encontrado");

    const ticket = attachment.ticket;
    if (actor.role === UserRole.SOLICITANTE) {
      await this.ensureTicketOwnership(
        actor,
        ticket.id,
        ticket.requesterId,
        "TICKET_ATTACHMENT_DOWNLOAD_DENIED",
        "Sem permissao para baixar este anexo",
      );
      if (attachment.isInternal) {
        await this.denyAccess(
          actor,
          ticket.id,
          "TICKET_ATTACHMENT_INTERNAL_DOWNLOAD_DENIED",
          "Sem permissao para baixar anexo interno",
        );
      }
    }

    if (!fs.existsSync(attachment.path)) {
      throw new NotFoundException("Arquivo nao encontrado no armazenamento");
    }

    return attachment;
  }
}
