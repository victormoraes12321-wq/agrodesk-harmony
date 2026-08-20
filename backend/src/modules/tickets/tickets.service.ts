import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Prisma, TicketPriority, TicketStatus, UserRole, AssetStatus, AssetMaintenanceType } from "@prisma/client";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import {
  assertResourceOwnerOrAdmin,
  forbidWithAudit,
} from "../../common/security/access-control.util";
import { toJsonValue } from "../../common/utils/json-value.util";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SlaService } from "../sla/sla.service";
import { EventsGateway } from "../events/events.gateway";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { AssignTicketDto } from "./dto/assign-ticket.dto";
import { UpdatePriorityDto } from "./dto/update-priority.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { UpdateTechnicalDto } from "./dto/update-technical.dto";
import { UpdateSlaDto } from "./dto/update-sla.dto";
import { RateTicketDto } from "./dto/rate-ticket.dto";
import { ListTicketsQueryDto } from "./dto/list-tickets-query.dto";
import { PrepareWhatsappMessageDto } from "./dto/prepare-whatsapp-message.dto";

/**
 * Calcula a data de vencimento considerando apenas o expediente útil:
 * Segunda a Sexta, das 08:00 às 18:00 (10 horas úteis por dia).
 * Finais de semana e noites são pausados.
 */
export function calculateBusinessSlaDueAt(startDate: Date, slaHours: number): Date {
  const current = new Date(startDate);
  let remainingMinutes = Math.max(1, Math.round(slaHours * 60));

  while (remainingMinutes > 0) {
    const day = current.getDay(); // 0: Dom, 6: Sáb
    const hour = current.getHours();
    const minute = current.getMinutes();

    // Se for domingo -> move para segunda às 08:00
    if (day === 0) {
      current.setDate(current.getDate() + 1);
      current.setHours(8, 0, 0, 0);
      continue;
    }
    // Se for sábado -> move para segunda às 08:00
    if (day === 6) {
      current.setDate(current.getDate() + 2);
      current.setHours(8, 0, 0, 0);
      continue;
    }

    // Se for dia útil antes das 08:00 -> move para 08:00
    if (hour < 8) {
      current.setHours(8, 0, 0, 0);
      continue;
    }

    // Se for dia útil após as 18:00 -> move para o dia útil seguinte às 08:00
    if (hour >= 18) {
      current.setDate(current.getDate() + 1);
      current.setHours(8, 0, 0, 0);
      continue;
    }

    // Dentro do expediente útil (08:00 às 18:00)
    const minutesLeftToday = (18 - hour) * 60 - minute;

    if (remainingMinutes <= minutesLeftToday) {
      current.setMinutes(current.getMinutes() + remainingMinutes);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= minutesLeftToday;
      current.setDate(current.getDate() + 1);
      current.setHours(8, 0, 0, 0);
    }
  }

  return current;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly slaService: SlaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async generateProtocol(db: PrismaService | Prisma.TransactionClient = this.prisma) {
    const year = new Date().getFullYear();
    const prefix = `OS-${year}-`;
    const latest = await db.ticket.findFirst({
      where: { protocolNumber: { startsWith: prefix } },
      // The protocol carries a zero-padded sequence, so lexical sort is stable.
      orderBy: { protocolNumber: "desc" },
      select: { protocolNumber: true },
    });

    const current = (() => {
      if (!latest?.protocolNumber) return 0;
      const raw = latest.protocolNumber.replace(prefix, "");
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    })();

    return `OS-${year}-${String(current + 1).padStart(5, "0")}`;
  }

  private async adminsExcept(userId?: string) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.TI_ADMIN,
        isActive: true,
        canReceiveTickets: true,
        id: userId ? { not: userId } : undefined,
      },
      select: { id: true },
    });
    return admins.map((item) => item.id);
  }

  private async logAudit(input: {
    userId?: string;
    entityId?: string;
    action: string;
    beforeJson?: unknown;
    afterJson?: unknown;
    field?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        entity: "Ticket",
        entityId: input.entityId,
        action: input.action,
        oldValue: toJsonValue(input.beforeJson),
        newValue: toJsonValue(input.afterJson),
      },
    });
  }

  private async denyAccess(
    actor: AuthUser,
    ticketId: string | undefined,
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

  private buildDueAt(baseDate: Date, hours: number) {
    return calculateBusinessSlaDueAt(baseDate, hours);
  }

  async create(actor: AuthUser, dto: CreateTicketDto) {
    const [department, branch] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: dto.departmentId } }),
      this.prisma.branch.findUnique({ where: { id: dto.branchId } }),
    ]);
    if (!department) throw new BadRequestException("Setor invalido");
    if (!branch) throw new BadRequestException("Filial/local invalida");

    const category = dto.categoryId
      ? await this.prisma.category.findUnique({ where: { id: dto.categoryId } })
      : null;
    if (dto.categoryId && !category) throw new BadRequestException("Categoria invalida");

    if (dto.subcategoryId) {
      const subcategory = await this.prisma.subcategory.findUnique({
        where: { id: dto.subcategoryId },
      });
      if (!subcategory) throw new BadRequestException("Subcategoria invalida");
      if (dto.categoryId && subcategory.categoryId !== dto.categoryId) {
        throw new BadRequestException("Subcategoria nao pertence a categoria informada");
      }
    }

    const normalizedDescription = dto.description.trim();
    const normalizedTitle = dto.title?.trim() || null;

    const duplicateWindowStart = new Date(Date.now() - 60 * 1000);
    const maybeDuplicate = await this.prisma.ticket.findFirst({
      where: {
        requesterId: actor.sub,
        departmentId: dto.departmentId,
        branchId: dto.branchId,
        description: normalizedDescription,
        title: normalizedTitle,
        createdAt: { gte: duplicateWindowStart },
        status: {
          in: [
            TicketStatus.OPEN,
            TicketStatus.ANALYSIS,
            TicketStatus.IN_PROGRESS,
            TicketStatus.WAITING_USER,
            TicketStatus.WAITING_PARTS_OR_THIRD_PARTY,
            TicketStatus.REOPENED,
          ],
        },
      },
      select: {
        id: true,
        protocolNumber: true,
      },
    });

    if (maybeDuplicate) {
      throw new BadRequestException(
        `Ja existe uma OS semelhante aberta agora (${maybeDuplicate.protocolNumber}). Aguarde alguns segundos antes de reenviar.`,
      );
    }

    const realPriority =
      actor.role === UserRole.TI_ADMIN && dto.realPriority
        ? dto.realPriority
        : (category?.defaultPriority ?? TicketPriority.MEDIUM);

    const sla = await this.slaService.calculateSla(dto.categoryId, realPriority);
    const finalSlaHours = dto.customSlaHours && dto.customSlaHours > 0 ? dto.customSlaHours : sla.slaHours;
    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const protocolLockKey = 20260601;
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${protocolLockKey})`);
      const protocol = await this.generateProtocol(tx);

      let resolvedAssetId = dto.assetId;
      if (!resolvedAssetId && dto.assetTag && dto.assetTag.trim() !== "") {
        const cleanedTag = dto.assetTag.trim();
        const asset = await tx.asset.findFirst({
          where: {
            OR: [
              { code: { equals: cleanedTag, mode: "insensitive" } },
              { hostname: { equals: cleanedTag, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
        if (asset) {
          resolvedAssetId = asset.id;
        }
      }

      const isProxyCreation = actor.role === UserRole.TI_ADMIN && Boolean(dto.targetUserId);
      const effectiveRequesterId = isProxyCreation ? (dto.targetUserId as string) : actor.sub;
      const isInstantResolve = actor.role === UserRole.TI_ADMIN && Boolean(dto.resolveImmediately);
      const initialStatus = isInstantResolve ? TicketStatus.RESOLVED : TicketStatus.OPEN;

      const ticketData: any = {
        protocolNumber: protocol,
        requesterId: effectiveRequesterId,
        requesterName: dto.requesterName,
        requesterPhone: dto.requesterPhone,
        requesterEmail: dto.requesterEmail?.trim() || actor.email,
        departmentId: dto.departmentId,
        branchId: dto.branchId,
        title: normalizedTitle,
        description: normalizedDescription,
        categoryId: dto.categoryId && dto.categoryId.trim() !== "" ? dto.categoryId : undefined,
        subcategoryId: dto.subcategoryId && dto.subcategoryId.trim() !== "" ? dto.subcategoryId : undefined,
        assetId: resolvedAssetId,
        suggestedPriority: dto.suggestedPriority,
        realPriority,
        equipmentName: dto.equipmentName,
        assetTag: dto.assetTag,
        preferredServiceTime: dto.preferredServiceTime,
        impactDescription: dto.impactDescription,
        additionalNotes: dto.additionalNotes,
        slaDueAt: this.buildDueAt(now, finalSlaHours),
        status: initialStatus,
        assignedToId: isInstantResolve ? actor.sub : undefined,
        resolvedAt: isInstantResolve ? now : undefined,
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: TicketStatus.OPEN,
              changedById: actor.sub,
              note: isProxyCreation
                ? "Solicitacao registrada pelo suporte TI em nome do usuario"
                : "Solicitacao registrada",
            },
            ...(isInstantResolve
              ? [
                  {
                    fromStatus: TicketStatus.OPEN,
                    toStatus: TicketStatus.RESOLVED,
                    changedById: actor.sub,
                    note: dto.resolutionNotes
                      ? `Atendimento Rapido: ${dto.resolutionNotes}`
                      : "Atendimento rapido finalizado na hora pelo suporte",
                  },
                ]
              : []),
          ],
        },
      };

      if (isInstantResolve && dto.resolutionNotes) {
        ticketData.comments = {
          create: {
            userId: actor.sub,
            content: `⚡ Solução (Atendimento Rápido): ${dto.resolutionNotes}`,
            isInternal: false,
          },
        };
      }

      return tx.ticket.create({
        data: ticketData,
        include: {
          department: true,
          branch: true,
          category: true,
          subcategory: true,
          asset: true,
        },
      });
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: created.id,
      action: "TICKET_CREATE",
      afterJson: { protocolNumber: created.protocolNumber },
    });

    const admins = await this.adminsExcept(actor.sub);
    await this.notificationsService.notifyMany({
      userIds: admins,
      type: NotificationType.TICKET_CREATED,
      title: "Nova OS",
      message: `${created.protocolNumber} aberta por ${created.requesterName}`,
      ticketId: created.id,
    });

    this.eventsGateway.emitTicketCreated(created);

    return created;
  }

  async findAll(actor: AuthUser, query: ListTicketsQueryDto) {
    const where: Prisma.TicketWhereInput = {
      requesterId: actor.role === UserRole.SOLICITANTE ? actor.sub : undefined,
      status: query.status,
      realPriority: query.priority,
      assignedToId: query.assigneeUserId,
      departmentId: query.departmentId,
      branchId: query.branchId,
      categoryId: query.categoryId,
      OR: query.search
        ? [
            { protocolNumber: { contains: query.search, mode: "insensitive" } },
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { requesterName: { contains: query.search, mode: "insensitive" } },
            { requesterPhone: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    };

    return this.prisma.ticket.findMany({
      where,
      include: {
        department: true,
        branch: true,
        category: true,
        subcategory: true,
        asset: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private sanitizeForRequester(
    ticket: Prisma.TicketGetPayload<{
      include: {
        comments: {
          include: { user: { select: { id: true; name: true; email: true; role: true } } };
        };
        attachments: true;
        statusHistory: true;
        rating: true;
        department: true;
        branch: true;
        category: true,
        subcategory: true,
        asset: true,
        assignedTo: { select: { id: true; name: true; email: true } };
      };
    }>,
  ) {
    const {
      diagnosis,
      rootCause,
      usedParts,
      timeSpentMinutes,
      internalNotes,
      realPriority,
      assignedToId,
      assignedTo,
      statusHistory,
      ...safeTicket
    } = ticket;

    return {
      ...safeTicket,
      comments: ticket.comments.filter((entry) => !entry.isInternal),
      attachments: ticket.attachments.filter((entry) => !entry.isInternal),
      statusHistory: [],
    };
  }

  async findById(actor: AuthUser, id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: { orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        rating: true,
        department: true,
        branch: true,
        category: true,
        subcategory: true,
        asset: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) throw new NotFoundException("OS nao encontrada");

    await this.ensureTicketOwnership(
      actor,
      id,
      ticket.requesterId,
      "TICKET_VIEW_DENIED",
      "Sem permissao para visualizar esta OS",
    );

    if (actor.role === UserRole.SOLICITANTE) return this.sanitizeForRequester(ticket);
    return ticket;
  }

  async update(actor: AuthUser, id: string, dto: UpdateTicketDto) {
    const existing = await this.prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("OS nao encontrada");
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(actor, id, "TICKET_UPDATE_DENIED", "Apenas TI_ADMIN pode editar OS");
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { id: true },
      });
      if (!department) throw new BadRequestException("Setor invalido");
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException("Filial/local invalida");
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!category) throw new BadRequestException("Categoria invalida");
    }

    if (dto.subcategoryId) {
      const subcategory = await this.prisma.subcategory.findUnique({
        where: { id: dto.subcategoryId },
        select: { id: true, categoryId: true },
      });

      if (!subcategory) throw new BadRequestException("Subcategoria invalida");

      const effectiveCategoryId = dto.categoryId ?? existing.categoryId;
      if (effectiveCategoryId && subcategory.categoryId !== effectiveCategoryId) {
        throw new BadRequestException("Subcategoria nao pertence a categoria informada");
      }
    }

    let resolvedAssetId: string | null | undefined = dto.assetId;
    if (dto.assetTag !== undefined) {
      if (dto.assetTag && dto.assetTag.trim() !== "") {
        const cleanedTag = dto.assetTag.trim();
        const asset = await this.prisma.asset.findFirst({
          where: {
            OR: [
              { code: { equals: cleanedTag, mode: "insensitive" } },
              { hostname: { equals: cleanedTag, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
        if (asset) {
          resolvedAssetId = asset.id;
        } else {
          resolvedAssetId = null;
        }
      } else {
        resolvedAssetId = null;
      }
    }

    let recalculatedSlaDueAt: Date | undefined = undefined;
    if (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId) {
      if (dto.categoryId && dto.categoryId.trim() !== "") {
        const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
        if (cat) {
          const slaHours = cat.defaultSlaHours || 24;
          recalculatedSlaDueAt = this.buildDueAt(existing.createdAt, slaHours);
        }
      } else {
        recalculatedSlaDueAt = this.buildDueAt(existing.createdAt, 24);
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        requesterName: dto.requesterName ?? undefined,
        requesterPhone: dto.requesterPhone ?? undefined,
        requesterEmail: dto.requesterEmail ?? undefined,
        departmentId: dto.departmentId ?? undefined,
        branchId: dto.branchId ?? undefined,
        description: dto.description ?? undefined,
        title: dto.title ?? undefined,
        categoryId: dto.categoryId !== undefined ? (dto.categoryId || null) : undefined,
        subcategoryId: dto.subcategoryId !== undefined ? (dto.subcategoryId || null) : undefined,
        assetId: resolvedAssetId !== undefined ? resolvedAssetId : undefined,
        suggestedPriority: dto.suggestedPriority ?? undefined,
        equipmentName: dto.equipmentName ?? undefined,
        assetTag: dto.assetTag ?? undefined,
        preferredServiceTime: dto.preferredServiceTime ?? undefined,
        impactDescription: dto.impactDescription ?? undefined,
        additionalNotes: dto.additionalNotes ?? undefined,
        slaDueAt: recalculatedSlaDueAt ?? undefined,
      },
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: "TICKET_UPDATE",
      beforeJson: existing,
      afterJson: dto,
    });

    return updated;
  }

  async assign(actor: AuthUser, id: string, dto: AssignTicketDto) {
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(
        actor,
        id,
        "TICKET_ASSIGN_DENIED",
        "Apenas TI_ADMIN pode definir responsavel",
      );
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    const assigneeId = dto.assigneeUserId ?? null;

    if (!ticket) throw new NotFoundException("OS nao encontrada");

    if (assigneeId) {
      const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
      if (
        !assignee ||
        assignee.role !== UserRole.TI_ADMIN ||
        !assignee.isActive ||
        !assignee.canReceiveTickets
      ) {
        throw new BadRequestException("Usuario nao pode receber OS como responsavel");
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { assignedToId: assigneeId },
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: "TICKET_ASSIGN",
      field: "assignedToId",
      beforeJson: { assignedToId: ticket.assignedToId },
      afterJson: { assignedToId: assigneeId },
    });

    if (assigneeId) {
      await this.notificationsService.notifyUser({
        userId: assigneeId,
        type: NotificationType.TICKET_ASSIGNED,
        title: "OS atribuida",
        message: `${ticket.protocolNumber} foi atribuida para voce`,
        ticketId: id,
      });
    }

    this.eventsGateway.emitTicketUpdated(updated);

    return updated;
  }

  async updatePriority(actor: AuthUser, id: string, dto: UpdatePriorityDto) {
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(
        actor,
        id,
        "TICKET_PRIORITY_DENIED",
        "Apenas TI_ADMIN pode alterar prioridade",
      );
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");

    const sla = await this.slaService.calculateSla(
      ticket.categoryId ?? undefined,
      dto.realPriority,
    );
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        realPriority: dto.realPriority,
        slaDueAt: this.buildDueAt(ticket.createdAt, sla.slaHours),
      },
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: "TICKET_PRIORITY_UPDATE",
      field: "realPriority",
      beforeJson: { realPriority: ticket.realPriority },
      afterJson: { realPriority: dto.realPriority },
    });

    this.eventsGateway.emitTicketUpdated(updated);

    return updated;
  }

  async updateStatus(actor: AuthUser, id: string, dto: UpdateStatusDto, forcedAction?: string) {
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(
        actor,
        id,
        "TICKET_STATUS_DENIED",
        "Apenas TI_ADMIN pode alterar status",
      );
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");
    const normalizedNote = dto.note?.trim();
    if (dto.status === TicketStatus.WAITING_USER && !normalizedNote) {
      throw new BadRequestException(
        "Informe o que esta sendo aguardado do solicitante para mover para este status",
      );
    }

    const data: Prisma.TicketUpdateInput = { status: dto.status };
    if (dto.status === TicketStatus.WAITING_USER) {
      data.waitingRequesterMessage = normalizedNote;
    } else if (ticket.waitingRequesterMessage) {
      data.waitingRequesterMessage = null;
    }
    if (dto.status === TicketStatus.RESOLVED && !ticket.resolvedAt) data.resolvedAt = new Date();
    if (dto.status === TicketStatus.CLOSED && !ticket.closedAt) {
      data.closedAt = new Date();
    }
    if (dto.status === TicketStatus.CANCELED && !ticket.canceledAt) {
      data.canceledAt = new Date();
      if (!ticket.closedAt) data.closedAt = new Date();
    }
    if (dto.status === TicketStatus.REOPENED) {
      const rawDate = ticket.closedAt ?? ticket.resolvedAt;
      if (rawDate) {
        const refDate = new Date(rawDate);
        const hoursPassed = (Date.now() - refDate.getTime()) / 3600000;
        if (hoursPassed > 48) {
          throw new BadRequestException(
            "O prazo de 48 horas para reabertura direta expirou. Por favor, abra uma nova Ordem de Serviço com referência a este chamado.",
          );
        }
      }
      data.closedAt = null;
      data.resolvedAt = null;
      data.reopenedAt = new Date();
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        statusHistory: {
          create: {
            fromStatus: ticket.status,
            toStatus: dto.status,
            changedById: actor.sub,
            note: normalizedNote,
          },
        },
        comments:
          dto.status === TicketStatus.WAITING_USER && normalizedNote
            ? {
                create: {
                  userId: actor.sub,
                  content: `Aguardando retorno do solicitante: ${normalizedNote}`,
                  isInternal: false,
                },
              }
            : undefined,
      },
    });

    if (updated.assetId) {
      const assetId = updated.assetId;
      try {
        if (
          dto.status === TicketStatus.ANALYSIS ||
          dto.status === TicketStatus.IN_PROGRESS ||
          dto.status === TicketStatus.REOPENED
        ) {
          await this.prisma.asset.update({
            where: { id: assetId },
            data: { status: AssetStatus.MANUTENCAO }
          });
        } else if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
          await this.prisma.asset.update({
            where: { id: assetId },
            data: { status: AssetStatus.EM_USO }
          });

          // Log maintenance automatically
          const exists = await this.prisma.assetMaintenance.findFirst({
            where: {
              assetId,
              description: { startsWith: `OS ${updated.protocolNumber}` }
            }
          });
          if (!exists) {
            const maintenanceDesc = `OS ${updated.protocolNumber} - ${updated.title || 'Manutenção Corretiva'}\n` +
              `Diagnóstico: ${updated.diagnosis || 'Não especificado'}\n` +
              `Solução: ${updated.solution || 'Não especificada'}\n` +
              `Causa Raiz: ${updated.rootCause || 'Não especificada'}\n` +
              `Peças Utilizadas: ${updated.usedParts || 'Nenhuma'}\n` +
              `Tempo Gasto: ${updated.timeSpentMinutes ? `${updated.timeSpentMinutes} minutos` : 'Não informado'}`;

            await this.prisma.assetMaintenance.create({
              data: {
                assetId,
                type: AssetMaintenanceType.CORRETIVA,
                description: maintenanceDesc,
                provider: 'Suporte TI AgroDesk',
                cost: 0.00,
                date: new Date()
              }
            });
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar status do ativo ou criar manutenção:", err);
      }
    }

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: forcedAction ?? "TICKET_STATUS_UPDATE",
      field: "status",
      beforeJson: { status: ticket.status },
      afterJson: { status: dto.status },
    });

    const recipients = [ticket.requesterId, ticket.assignedToId].filter(
      (value): value is string => Boolean(value) && value !== actor.sub,
    );
    await this.notificationsService.notifyMany({
      userIds: recipients,
      type: NotificationType.STATUS_CHANGED,
      title: "Status alterado",
      message: `${ticket.protocolNumber} agora esta ${dto.status}`,
      ticketId: id,
    });

    if (
      (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) &&
      ticket.requesterId &&
      ticket.requesterId !== actor.sub
    ) {
      await this.notificationsService.notifyUser({
        userId: ticket.requesterId,
        type: NotificationType.TICKET_RESOLVED,
        title: "Sua OS foi concluída!",
        message: `A OS ${ticket.protocolNumber} foi concluída pelo suporte de T.I. Confira a solução aplicada e avalie o atendimento!`,
        ticketId: id,
      });
    }

    this.eventsGateway.emitTicketUpdated(updated);

    return updated;
  }

  async updateTechnical(actor: AuthUser, id: string, dto: UpdateTechnicalDto) {
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(
        actor,
        id,
        "TICKET_TECHNICAL_DENIED",
        "Apenas TI_ADMIN pode registrar dados tecnicos",
      );
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        diagnosis: dto.diagnosis ?? undefined,
        solution: dto.solution ?? undefined,
        rootCause: dto.rootCause ?? undefined,
        usedParts: dto.partsUsed ?? undefined,
        timeSpentMinutes: dto.timeSpentMinutes ?? undefined,
        internalNotes: dto.internalNotes ?? undefined,
      },
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: "TICKET_TECHNICAL_UPDATE",
      afterJson: {
        diagnosis: dto.diagnosis,
        solution: dto.solution,
        rootCause: dto.rootCause,
        usedParts: dto.partsUsed,
        timeSpentMinutes: dto.timeSpentMinutes,
      },
    });

    this.eventsGateway.emitTicketUpdated(updated);

    return updated;
  }

  async updateSla(actor: AuthUser, id: string, dto: UpdateSlaDto) {
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(actor, id, "TICKET_SLA_DENIED", "Apenas TI_ADMIN pode alterar SLA");
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");

    let nextSlaDueAt: Date | null = null;
    let extensionLogNote = "";

    if (dto.extendHours && dto.extendHours > 0) {
      const baseTime = ticket.slaDueAt && ticket.slaDueAt.getTime() > Date.now()
        ? ticket.slaDueAt.getTime()
        : Date.now();
      nextSlaDueAt = new Date(baseTime + dto.extendHours * 3600000);
      extensionLogNote = `Prazo de SLA prorrogado em +${dto.extendHours}h.${dto.reason ? ` Motivo: ${dto.reason.trim()}` : ""}`;
    } else if (dto.slaDueAt) {
      nextSlaDueAt = new Date(dto.slaDueAt);
      extensionLogNote = `Prazo de SLA redefinido para ${nextSlaDueAt.toLocaleDateString("pt-BR")} ${nextSlaDueAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.${dto.reason ? ` Motivo: ${dto.reason.trim()}` : ""}`;
    } else if (dto.slaHours && dto.slaHours > 0) {
      nextSlaDueAt = this.buildDueAt(ticket.createdAt, dto.slaHours);
      extensionLogNote = `Prazo de SLA ajustado para ${dto.slaHours} horas.${dto.reason ? ` Motivo: ${dto.reason.trim()}` : ""}`;
    } else {
      nextSlaDueAt = ticket.slaDueAt;
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        slaDueAt: nextSlaDueAt,
        comments: extensionLogNote
          ? {
              create: {
                userId: actor.sub,
                content: `⏱️ ${extensionLogNote}`,
                isInternal: false,
              },
            }
          : undefined,
      },
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: "TICKET_SLA_UPDATE",
      beforeJson: { slaDueAt: ticket.slaDueAt },
      afterJson: { slaDueAt: nextSlaDueAt, reason: dto.reason, extendHours: dto.extendHours },
    });

    this.eventsGateway.emitTicketUpdated(updated);

    return updated;
  }

  async resolve(actor: AuthUser, id: string, note?: string) {
    return this.updateStatus(actor, id, { status: TicketStatus.RESOLVED, note }, "TICKET_RESOLVE");
  }

  async finalize(actor: AuthUser, id: string, note?: string) {
    return this.updateStatus(actor, id, { status: TicketStatus.CLOSED, note }, "TICKET_FINALIZE");
  }

  async reopen(actor: AuthUser, id: string, note?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");
    if (actor.role !== UserRole.TI_ADMIN && ticket.requesterId !== actor.sub) {
      await this.denyAccess(actor, id, "TICKET_REOPEN_DENIED", "Apenas solicitante ou TI_ADMIN pode reabrir");
    }
    const rawDate = ticket.closedAt ?? ticket.resolvedAt;
    if (rawDate) {
      const refDate = new Date(rawDate);
      const hoursPassed = (Date.now() - refDate.getTime()) / 3600000;
      if (hoursPassed > 48) {
        throw new BadRequestException(
          "O prazo de 48 horas para reabertura direta expirou. Por favor, abra uma nova Ordem de Serviço com referência a este chamado.",
        );
      }
    }
    return this.updateStatus(actor, id, { status: TicketStatus.REOPENED, note }, "TICKET_REOPEN");
  }

  async cancel(actor: AuthUser, id: string, note?: string) {
    return this.updateStatus(actor, id, { status: TicketStatus.CANCELED, note }, "TICKET_CANCEL");
  }

  async registerWhatsappPrepared(actor: AuthUser, id: string, dto: PrepareWhatsappMessageDto) {
    if (actor.role !== UserRole.TI_ADMIN) {
      await this.denyAccess(
        actor,
        id,
        "TICKET_WHATSAPP_PREPARED_DENIED",
        "Apenas TI_ADMIN pode preparar mensagem de WhatsApp",
      );
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        protocolNumber: true,
        status: true,
        requesterPhone: true,
      },
    });
    if (!ticket) throw new NotFoundException("OS nao encontrada");

    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        action: "TICKET_WHATSAPP_PREPARED",
        entity: "Ticket",
        entityId: id,
        newValue: {
          protocolNumber: ticket.protocolNumber,
          statusAtMoment: dto.statusAtMoment ?? ticket.status,
          phoneUsed: dto.phoneUsed,
          message: dto.message,
          note: "Mensagem preparada para WhatsApp (sem confirmacao de envio).",
        },
      },
    });

    return { success: true };
  }

  async rate(actor: AuthUser, id: string, dto: RateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("OS nao encontrada");
    await this.ensureTicketOwnership(
      actor,
      id,
      ticket.requesterId,
      "TICKET_RATING_DENIED",
      "Apenas o solicitante pode avaliar",
    );
    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException("Avaliacao permitida apenas para OS resolvida/finalizada");
    }

    const rating = await this.prisma.ticketRating.upsert({
      where: { ticketId: id },
      create: {
        ticketId: id,
        userId: actor.sub,
        rating: dto.score,
        comment: dto.comment,
      },
      update: {
        rating: dto.score,
        comment: dto.comment,
      },
    });

    await this.logAudit({
      userId: actor.sub,
      entityId: id,
      action: "TICKET_RATING",
      afterJson: dto,
    });

    const admins = await this.adminsExcept(actor.sub);
    await this.notificationsService.notifyMany({
      userIds: admins,
      type: NotificationType.STATUS_CHANGED,
      title: "Nova avaliacao",
      message: `${ticket.protocolNumber} recebeu nota ${dto.score}`,
      ticketId: id,
    });

    return rating;
  }
}
