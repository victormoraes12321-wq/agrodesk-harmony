import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../interfaces/auth-user.interface";

interface AccessDeniedInput {
  prisma: PrismaService;
  actor?: AuthUser | null;
  entity: string;
  entityId?: string;
  deniedAction: string;
  reason: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface OwnershipValidationInput extends Omit<AccessDeniedInput, "reason"> {
  ownerUserId?: string | null;
  reason?: string;
  adminRole?: UserRole;
}

async function writeDeniedAudit(input: AccessDeniedInput) {
  try {
    await input.prisma.auditLog.create({
      data: {
        userId: input.actor?.sub,
        action: "ACCESS_DENIED",
        entity: input.entity,
        entityId: input.entityId,
        newValue: {
          deniedAction: input.deniedAction,
          reason: input.reason,
          actorRole: input.actor?.role,
          ...input.details,
        },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch {
    // Nunca bloquear o fluxo de autorizacao por falha de escrita de auditoria.
  }
}

export async function forbidWithAudit(input: AccessDeniedInput): Promise<never> {
  await writeDeniedAudit(input);
  throw new ForbiddenException(input.reason);
}

export async function assertResourceOwnerOrAdmin(input: OwnershipValidationInput): Promise<void> {
  const adminRole = input.adminRole ?? UserRole.TI_ADMIN;
  if (input.actor?.role === adminRole) return;
  if (input.ownerUserId && input.ownerUserId === input.actor?.sub) return;

  await forbidWithAudit({
    ...input,
    reason: input.reason ?? "Sem permissao para acessar este recurso",
    details: {
      ownerUserId: input.ownerUserId,
      ...input.details,
    },
  });
}
