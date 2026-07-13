import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthUser } from "../interfaces/auth-user.interface";

const ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED = new Set([
  "/api/v1/auth/me",
  "/api/v1/auth/logout",
  "/api/v1/users/me/password",
]);

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!request.user) return true;

    const path = (request.originalUrl ?? request.url).split("?")[0];
    if (ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED.has(path)) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { mustChangePassword: true },
    });
    if (!user?.mustChangePassword) return true;

    await this.prisma.auditLog.create({
      data: {
        userId: request.user.sub,
        entity: "Auth",
        action: "PASSWORD_CHANGE_REQUIRED_ACCESS_DENIED",
        newValue: { path, method: request.method },
        ipAddress: request.ip,
      },
    });

    throw new ForbiddenException("Troque sua senha temporaria antes de continuar");
  }
}
