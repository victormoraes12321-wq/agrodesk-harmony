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
    email: string;
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
      email: user.email,
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
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new BadRequestException("E-mail ja cadastrado");
    await this.ensureDepartmentAndBranch({
      departmentId: dto.departmentId,
      branchId: dto.branchId,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
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

    await this.logAudit(actor, "USER_CREATE", user.id, { email: user.email, role: user.role });
    return this.toPublicUser(user);
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
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

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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
    if (dto.name !== undefined) userData.name = dto.name;
    if (dto.email !== undefined) userData.email = dto.email.toLowerCase();
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
        phone: dto.phone ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        extension: dto.extension ?? undefined,
        position: dto.jobTitle ?? undefined,
        notes: dto.notes ?? undefined,
        departmentId: dto.departmentId ?? undefined,
        branchId: dto.branchId ?? undefined,
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

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? undefined,
        phone: dto.phone ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        extension: dto.extension ?? undefined,
        position: dto.jobTitle ?? undefined,
        notes: dto.notes ?? undefined,
        departmentId: dto.departmentId ?? undefined,
        branchId: dto.branchId ?? undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId,
        entity: "User",
        entityId: userId,
        action: "USER_UPDATE_ME",
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
