import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { toJsonValue } from "../../common/utils/json-value.util";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ToggleUserActiveDto } from "./dto/toggle-user-active.dto";
import { UpdateMyProfileDto } from "./dto/update-my-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AdminResetPasswordDto } from "./dto/admin-reset-password.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublicUser(user: {
    id: string;
    name: string;
    username?: string | null;
    email?: string | null;
    role: UserRole;
    phone: string;
    whatsapp: string | null;
    extension: string | null;
    position: string;
    notes: string | null;
    departmentId: string | null;
    branchId: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
    canReceiveTickets: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      username: user.username || user.name,
      email: user.email ?? "",
      role: user.role,
      phone: user.phone,
      whatsapp: user.whatsapp,
      extension: user.extension,
      position: user.position,
      notes: user.notes,
      departmentId: user.departmentId,
      branchId: user.branchId,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      canReceiveTickets: user.canReceiveTickets,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private stripPassword<T extends Record<string, unknown>>(value: T) {
    const { passwordHash, ...safe } = value;
    return safe;
  }

  private async ensureDepartmentAndBranch(input: {
    departmentId?: string | null;
    branchId?: string | null;
  }) {
    if (input.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: input.departmentId },
        select: { id: true },
      });
      if (!department) throw new BadRequestException("Setor invalido");
    }

    if (input.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: input.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException("Filial/local invalida");
    }
  }

  private async logAudit(
    user: AuthUser,
    action: string,
    entityId: string,
    afterJson?: unknown,
    beforeJson?: unknown,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId: user.sub,
        entity: "User",
        entityId,
        action,
        oldValue: toJsonValue(beforeJson),
        newValue: toJsonValue(afterJson),
      },
    });
  }

  async create(actor: AuthUser, dto: CreateUserDto) {
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
    if (existingUsername) throw new BadRequestException("Nome de usuário já cadastrado");

    if (emailFormatted) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: { equals: emailFormatted, mode: "insensitive" } },
      });
      if (existingEmail) throw new BadRequestException("E-mail já cadastrado por outro usuário");
    }

    await this.ensureDepartmentAndBranch({
      departmentId: dto.departmentId,
      branchId: dto.branchId,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        username: usernameFormatted,
        email: emailFormatted,
        passwordHash,
        role: dto.role ?? UserRole.SOLICITANTE,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        extension: dto.extension,
        position: dto.jobTitle ?? "",
        notes: dto.notes,
        departmentId: dto.departmentId,
        branchId: dto.branchId,
        isActive: dto.active ?? true,
        mustChangePassword: true,
        canReceiveTickets:
          (dto.role ?? UserRole.SOLICITANTE) === UserRole.TI_ADMIN
            ? (dto.canReceiveTickets ?? false)
            : false,
      },
    });

    await this.logAudit(actor, "USER_CREATE", user.id, { username: user.username, role: user.role });
    return this.toPublicUser(user);
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        extension: true,
        position: true,
        notes: true,
        departmentId: true,
        branchId: true,
        isActive: true,
        mustChangePassword: true,
        canReceiveTickets: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async remove(actor: AuthUser, id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Usuario nao encontrado");

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.logAudit(actor, "USER_SOFT_DELETE", id, { deletedAt: new Date() });
    return { success: true, message: "Usuario movido para a lixeira" };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        extension: true,
        position: true,
        notes: true,
        departmentId: true,
        branchId: true,
        isActive: true,
        mustChangePassword: true,
        canReceiveTickets: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException("Usuario nao encontrado");
    return user;
  }

  async update(actor: AuthUser, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Usuario nao encontrado");
    await this.ensureDepartmentAndBranch({
      departmentId: dto.departmentId,
      branchId: dto.branchId,
    });

    const userData: Record<string, unknown> = {};
    if (dto.name !== undefined) userData.name = dto.name.trim();

    if (dto.username !== undefined && dto.username.trim() !== "") {
      const usernameFormatted = dto.username.trim();
      const currentUsername = existing.username?.toLowerCase();
      if (usernameFormatted.toLowerCase() !== currentUsername) {
        const conflict = await this.prisma.user.findFirst({
          where: {
            id: { not: id },
            OR: [
              { username: { equals: usernameFormatted, mode: "insensitive" } },
              { name: { equals: usernameFormatted, mode: "insensitive" } },
            ],
          },
        });
        if (conflict) {
          throw new BadRequestException("Este nome de usuário já está em uso por outro usuário.");
        }
        userData.username = usernameFormatted;
      }
    }

    if (dto.email !== undefined) {
      const emailFormatted = dto.email && dto.email.trim() ? dto.email.trim().toLowerCase() : null;
      if (emailFormatted && emailFormatted !== existing.email?.toLowerCase()) {
        const conflict = await this.prisma.user.findFirst({
          where: {
            id: { not: id },
            email: { equals: emailFormatted, mode: "insensitive" },
          },
        });
        if (conflict) {
          throw new BadRequestException("Este e-mail já está em uso por outro usuário.");
        }
      }
      userData.email = emailFormatted;
    }
    if (dto.role !== undefined) userData.role = dto.role;
    if (dto.active !== undefined) userData.isActive = dto.active;
    if (dto.role === UserRole.SOLICITANTE) userData.canReceiveTickets = false;
    if (dto.canReceiveTickets !== undefined) {
      userData.canReceiveTickets =
        (dto.role ?? existing.role) === UserRole.TI_ADMIN ? dto.canReceiveTickets : false;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        whatsapp: dto.whatsapp !== undefined ? dto.whatsapp : undefined,
        extension: dto.extension !== undefined ? dto.extension : undefined,
        position: dto.jobTitle !== undefined ? dto.jobTitle : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        departmentId: dto.departmentId !== undefined ? dto.departmentId : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
      },
    });

    await this.logAudit(
      actor,
      "USER_UPDATE",
      id,
      dto,
      this.stripPassword(existing as unknown as Record<string, unknown>),
    );
    return this.toPublicUser(updated);
  }

  async setActive(actor: AuthUser, id: string, dto: ToggleUserActiveDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Usuario nao encontrado");

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.active },
    });

    await this.logAudit(
      actor,
      "USER_TOGGLE_ACTIVE",
      id,
      { isActive: dto.active },
      { isActive: existing.isActive },
    );
    return this.toPublicUser(updated);
  }

  async resetPassword(actor: AuthUser, id: string, dto: AdminResetPasswordDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Usuario nao encontrado");

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.logAudit(actor, "USER_RESET_PASSWORD", id, { resetByAdmin: true });
    return { success: true };
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException("Usuario nao encontrado");
    await this.ensureDepartmentAndBranch({
      departmentId: dto.departmentId,
      branchId: dto.branchId,
    });

    const userData: Record<string, unknown> = {};
    if (dto.name !== undefined) userData.name = dto.name.trim();

    if (dto.email !== undefined) {
      const emailFormatted = dto.email && dto.email.trim() ? dto.email.trim().toLowerCase() : null;
      if (emailFormatted && emailFormatted !== existing.email?.toLowerCase()) {
        const conflict = await this.prisma.user.findFirst({
          where: {
            id: { not: userId },
            email: { equals: emailFormatted, mode: "insensitive" },
          },
        });
        if (conflict) {
          throw new BadRequestException("Este e-mail já está em uso por outro usuário.");
        }
      }
      userData.email = emailFormatted;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        whatsapp: dto.whatsapp !== undefined ? dto.whatsapp : undefined,
        extension: dto.extension !== undefined ? dto.extension : undefined,
        position: dto.jobTitle !== undefined ? dto.jobTitle : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        departmentId: dto.departmentId !== undefined ? dto.departmentId : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId,
        entity: "User",
        entityId: userId,
        action: "USER_UPDATE_ME",
        newValue: toJsonValue(dto),
        oldValue: toJsonValue(this.stripPassword(existing as unknown as Record<string, unknown>)),
      },
    });

    return this.toPublicUser(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Usuario nao encontrado");

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException("Senha atual incorreta");

    const unchanged = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (unchanged) throw new BadRequestException("A nova senha deve ser diferente da senha atual");

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId,
        entity: "User",
        entityId: userId,
        action: "USER_CHANGE_PASSWORD",
      },
    });

    return { success: true };
  }
}
