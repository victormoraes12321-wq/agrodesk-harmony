import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import type { StringValue } from "ms";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { LoginDto } from "./dto/login.dto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private buildPayload(id: string, email: string, role: UserRole): AuthUser {
    return { sub: id, email, role };
  }

  private async signTokens(payload: AuthUser): Promise<TokenPair> {
    const accessExpiresIn = (this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") ??
      "15m") as StringValue;
    const refreshExpiresIn = (this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ??
      "7d") as StringValue;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const decoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 86400000);
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async login(input: LoginDto, metadata?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        name: {
          equals: input.username.trim(),
          mode: "insensitive",
        },
      },
    });

    if (!user || !user.isActive) {
      await this.prisma.auditLog.create({
        data: {
          entity: "Auth",
          action: "LOGIN_FAILURE",
          newValue: { username: input.username },
          ipAddress: metadata?.ip,
          userAgent: metadata?.userAgent,
        },
      });
      throw new UnauthorizedException("Credenciais invalidas");
    }

    console.log("DEBUG LOGIN:", {
      username: input.username,
      passwordLength: input.password?.length,
      passwordValue: input.password,
      hashFromDb: user.passwordHash,
    });

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN_FAILURE",
          entity: "Auth",
          newValue: { username: user.name },
          ipAddress: metadata?.ip,
          userAgent: metadata?.userAgent,
        },
      });
      throw new UnauthorizedException("Credenciais invalidas");
    }

    const payload = this.buildPayload(user.id, user.email, user.role);
    const tokens = await this.signTokens(payload);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN_SUCCESS",
        entity: "Auth",
        ipAddress: metadata?.ip,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.isActive,
        phone: user.phone,
        whatsapp: user.whatsapp,
        extension: user.extension,
        position: user.position,
        notes: user.notes,
        departmentId: user.departmentId,
        branchId: user.branchId,
        mustChangePassword: user.mustChangePassword,
        canReceiveTickets: user.canReceiveTickets,
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) throw new BadRequestException("Refresh token obrigatorio");

    const payload = await this.jwtService
      .verifyAsync<AuthUser>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      })
      .catch(() => {
        throw new UnauthorizedException("Refresh token invalido");
      });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException("Usuario inativo");

    // Search for the token in ALL tokens (including revoked ones) to detect reuse
    const allTokens = await this.prisma.refreshToken.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    let validTokenId: string | null = null;
    let revokedTokenMatch: boolean = false;
    let isWithinGracePeriod: boolean = false;

    for (const token of allTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        if (token.revokedAt !== null) {
          // Allow a 30 seconds grace period for concurrent requests in multi-tab scenarios
          const gracePeriodMs = 30 * 1000;
          if (token.revokedAt.getTime() + gracePeriodMs > Date.now()) {
            isWithinGracePeriod = true;
          } else {
            revokedTokenMatch = true;
          }
        } else {
          validTokenId = token.id;
        }
        break;
      }
    }

    if (revokedTokenMatch) {
      throw new UnauthorizedException("Refresh token ja foi utilizado (token rotation detected)");
    }

    if (!validTokenId && !isWithinGracePeriod) {
      throw new UnauthorizedException("Refresh token nao reconhecido");
    }

    if (validTokenId) {
      await this.prisma.refreshToken.update({
        where: { id: validTokenId },
        data: { revokedAt: new Date() },
      });
    }

    const newPayload = this.buildPayload(user.id, user.email, user.role);
    const tokens = await this.signTokens(newPayload);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(refreshToken: string) {
    const savedTokens = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    for (const token of savedTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        await this.prisma.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }

    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Usuario nao encontrado");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.isActive,
      phone: user.phone,
      whatsapp: user.whatsapp,
      extension: user.extension,
      position: user.position,
      notes: user.notes,
      departmentId: user.departmentId,
      branchId: user.branchId,
      mustChangePassword: user.mustChangePassword,
      canReceiveTickets: user.canReceiveTickets,
    };
  }
}
