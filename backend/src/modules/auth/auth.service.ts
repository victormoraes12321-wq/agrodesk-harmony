import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import type { StringValue } from "ms";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

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

  private buildPayload(id: string, email: string | null, role: UserRole): AuthUser {
    return { sub: id, email: email ?? "", role };
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
    try {
      const identifier = input.username.trim();
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { name: { equals: identifier, mode: "insensitive" } },
          ],
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
          username: user.username || user.name,
          email: user.email ?? "",
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
    } catch (error) {
      console.error("ERRO NO LOGIN:", error);
      throw error;
    }
  }

  async register(dto: RegisterDto) {
    const usernameFormatted = dto.username.trim();
    const emailFormatted = dto.email?.trim() ? dto.email.trim().toLowerCase() : null;

    const existingUsername = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: usernameFormatted, mode: "insensitive" } },
          { name: { equals: usernameFormatted, mode: "insensitive" } },
        ],
      },
    });

    if (existingUsername) {
      throw new BadRequestException("Este nome de usuário já está cadastrado.");
    }

    if (emailFormatted) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: { equals: emailFormatted, mode: "insensitive" } },
      });
      if (existingEmail) {
        throw new BadRequestException("Este e-mail já está cadastrado por outro usuário.");
      }
    }

    const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) throw new BadRequestException("Setor/Departamento selecionado não encontrado.");

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new BadRequestException("Filial/Unidade selecionada não encontrada.");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        username: usernameFormatted,
        email: emailFormatted,
        passwordHash,
        role: UserRole.SOLICITANTE,
        departmentId: dto.departmentId,
        branchId: dto.branchId,
        phone: dto.phone ?? "",
        whatsapp: dto.whatsapp ?? "",
        extension: dto.extension ?? "",
        position: dto.jobTitle ?? "",
        notes: dto.notes ?? "",
        isActive: true,
        mustChangePassword: false,
        canReceiveTickets: false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        entity: "Auth",
        action: "SELF_REGISTER",
        newValue: { id: user.id, username: user.username, role: user.role },
      },
    });

    const payload = this.buildPayload(user.id, user.email, user.role);
    const tokens = await this.signTokens(payload);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || user.name,
        email: user.email ?? "",
        role: user.role,
        active: user.isActive,
        phone: user.phone,
        whatsapp: user.whatsapp,
        extension: user.extension,
        position: user.position,
        notes: user.notes,
        departmentId: user.departmentId,
        branchId: user.branchId,
        mustChangePassword: false,
        canReceiveTickets: false,
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
      username: user.username || user.name,
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

  /**
   * Verifica se o usuário existe e retorna dados básicos para confirmar identidade.
   * Endpoint público — não retorna senha nem dados sensíveis.
   */
  async forgotPasswordRequest(username: string) {
    const identifier = username.trim();
    if (!identifier) throw new BadRequestException("Nome de usuario obrigatorio");

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { name: { equals: identifier, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: { id: true, name: true, username: true, departmentId: true, branchId: true, phone: true },
    });

    if (!user) {
      throw new BadRequestException("Nenhum usuario ativo encontrado com esse nome.");
    }

    return {
      name: user.name,
      username: user.username ?? identifier,
    };
  }

  /**
   * Cria automaticamente uma OS de "Redefinição de Senha" para o usuário solicitante.
   * A OS é atribuída ao TI e o requester é o próprio usuário.
   */
  async forgotPasswordOs(username: string) {
    const identifier = username.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { name: { equals: identifier, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, name: true, username: true, phone: true, email: true,
        departmentId: true, branchId: true,
      },
    });

    if (!user) throw new BadRequestException("Usuario nao encontrado");

    // Usa o dept/branch do usuário — ou fallback para os primeiros disponíveis
    const departmentId = user.departmentId ?? (
      await this.prisma.department.findFirst({ select: { id: true } })
    )?.id;
    const branchId = user.branchId ?? (
      await this.prisma.branch.findFirst({ select: { id: true } })
    )?.id;

    if (!departmentId || !branchId) {
      throw new BadRequestException("Configuracao de setor/filial ausente. Contate o TI manualmente.");
    }

    // Categoria "Acesso / Senha" ou qualquer disponível
    const category = await this.prisma.category.findFirst({
      where: { name: { contains: "Acesso", mode: "insensitive" } },
      select: { id: true },
    }) ?? await this.prisma.category.findFirst({ select: { id: true } });

    // Protocolo auto-incrementado
    const year = new Date().getFullYear();
    const prefix = `OS-${year}-`;
    const latest = await this.prisma.ticket.findFirst({
      where: { protocolNumber: { startsWith: prefix } },
      orderBy: { protocolNumber: "desc" },
      select: { protocolNumber: true },
    });
    const current = (() => {
      if (!latest?.protocolNumber) return 0;
      const raw = latest.protocolNumber.replace(prefix, "");
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    })();
    const protocol = `OS-${year}-${String(current + 1).padStart(5, "0")}`;

    const now = new Date();
    const slaDueAt = new Date(now.getTime() + 8 * 3600000); // 8h para atendimento

    const ticket = await this.prisma.ticket.create({
      data: {
        protocolNumber: protocol,
        requesterId: user.id,
        requesterName: user.name,
        requesterPhone: user.phone ?? "",
        requesterEmail: user.email ?? "",
        departmentId,
        branchId,
        title: "Redefinição de Senha",
        description: `O usuário ${user.name} (${user.username ?? identifier}) solicitou redefinição de sua senha de acesso ao sistema AgroDesk TI via formulário de "Esqueci minha senha". Por favor, entrar em contato com o solicitante para concluir o processo de redefinição.`,
        categoryId: category?.id ?? undefined,
        status: "OPEN",
        realPriority: "HIGH",
        suggestedPriority: "HIGH",
        slaDueAt,
      },
      select: { id: true, protocolNumber: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        entity: "Auth",
        action: "FORGOT_PASSWORD_OS_CREATED",
        newValue: { protocol: ticket.protocolNumber, userId: user.id },
      },
    });

    return { protocol: ticket.protocolNumber };
  }
}
