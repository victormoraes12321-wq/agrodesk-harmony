import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { toJsonValue } from "../../common/utils/json-value.util";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { MemoryCache } from "../../common/utils/cache.util";

@Injectable()
export class DepartmentsService {
  private readonly cache = new MemoryCache<any[]>(300000); // 5 minutes TTL
  private readonly cacheKey = "departments_all";

  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthUser, dto: CreateDepartmentDto) {
    const created = await this.prisma.department.create({
      data: { name: dto.name, isActive: dto.active ?? true },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Department",
        entityId: created.id,
        action: "DEPARTMENT_CREATE",
        newValue: toJsonValue(dto),
      },
    });
    return created;
  }

  async findAll() {
    const cached = this.cache.get(this.cacheKey);
    if (cached) return cached;

    const data = await this.prisma.department.findMany({ orderBy: { name: "asc" } });
    this.cache.set(this.cacheKey, data);
    return data;
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException("Setor nao encontrado");
    return department;
  }

  async update(actor: AuthUser, id: string, dto: UpdateDepartmentDto) {
    await this.findById(id);
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        isActive: dto.active ?? undefined,
      },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Department",
        entityId: id,
        action: "DEPARTMENT_UPDATE",
        newValue: toJsonValue(dto),
      },
    });
    return updated;
  }

  async remove(actor: AuthUser, id: string) {
    await this.findById(id);
    await this.prisma.department.delete({ where: { id } });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Department",
        entityId: id,
        action: "DEPARTMENT_DELETE",
      },
    });
    return { success: true };
  }
}
