import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthUser } from "../interfaces/auth-user.interface";
import { forbidWithAudit } from "../security/access-control.util";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    const routeId = `${request.method} ${request.originalUrl ?? request.url}`;
    const userAgent = Array.isArray(request.headers["user-agent"])
      ? request.headers["user-agent"][0]
      : request.headers["user-agent"];
    if (!user) {
      await forbidWithAudit({
        prisma: this.prisma,
        actor: null,
        entity: "Route",
        entityId: routeId,
        deniedAction: "ROUTE_ROLE_CHECK",
        reason: "Usuario nao autenticado",
        details: { requiredRoles },
        ipAddress: request.ip,
        userAgent,
      });
      return false;
    }

    if (!requiredRoles.includes(user.role)) {
      await forbidWithAudit({
        prisma: this.prisma,
        actor: user,
        entity: "Route",
        entityId: routeId,
        deniedAction: "ROUTE_ROLE_CHECK",
        reason: "Sem permissao para este recurso",
        details: {
          requiredRoles,
          currentRole: user.role,
        },
        ipAddress: request.ip,
        userAgent,
      });
      return false;
    }

    return true;
  }
}
