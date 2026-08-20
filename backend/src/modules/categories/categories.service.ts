import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { toJsonValue } from "../../common/utils/json-value.util";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";
import { UpdateSubcategoryDto } from "./dto/update-subcategory.dto";
import { MemoryCache } from "../../common/utils/cache.util";

@Injectable()
export class CategoriesService {
  private readonly cache = new MemoryCache<any[]>(300000); // 5 minutes TTL
  private readonly cacheKey = "categories_all";

  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthUser, dto: CreateCategoryDto) {
    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        defaultPriority: dto.defaultPriority ?? "MEDIUM",
        defaultSlaHours: dto.defaultSlaHours ?? 24,
        isActive: dto.active ?? true,
        subcategories: dto.subcategories?.length
          ? {
              createMany: {
                data: dto.subcategories.map((name) => ({ name, isActive: true })),
              },
            }
          : undefined,
      },
      include: { subcategories: true },
    });

    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Category",
        entityId: created.id,
        action: "CATEGORY_CREATE",
        newValue: toJsonValue(dto),
      },
    });

    return created;
  }

  async findAll() {
    const cached = this.cache.get(this.cacheKey);
    if (cached) return cached;

    const data = await this.prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        subcategories: {
          where: { deletedAt: null },
        },
      },
      orderBy: { name: "asc" },
    });
    this.cache.set(this.cacheKey, data);
    return data;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          where: { deletedAt: null },
        },
      },
    });
    if (!category) throw new NotFoundException("Categoria nao encontrada");
    return category;
  }

  async update(actor: AuthUser, id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        defaultPriority: dto.defaultPriority ?? undefined,
        defaultSlaHours: dto.defaultSlaHours ?? undefined,
        isActive: dto.active ?? undefined,
      },
      include: { subcategories: true },
    });

    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Category",
        entityId: id,
        action: "CATEGORY_UPDATE",
        newValue: toJsonValue(dto),
      },
    });

    return updated;
  }

  async remove(actor: AuthUser, id: string) {
    await this.findById(id);
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Category",
        entityId: id,
        action: "CATEGORY_SOFT_DELETE",
      },
    });
    return { success: true, message: "Categoria movida para a lixeira" };
  }

  async createSubcategory(actor: AuthUser, categoryId: string, dto: CreateSubcategoryDto) {
    await this.findById(categoryId);
    const created = await this.prisma.subcategory.create({
      data: {
        categoryId,
        name: dto.name,
        isActive: dto.active ?? true,
      },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Subcategory",
        entityId: created.id,
        action: "SUBCATEGORY_CREATE",
        newValue: toJsonValue(dto),
      },
    });
    return created;
  }

  async updateSubcategory(actor: AuthUser, id: string, dto: UpdateSubcategoryDto) {
    const existing = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Subcategoria nao encontrada");

    const updated = await this.prisma.subcategory.update({
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
        entity: "Subcategory",
        entityId: id,
        action: "SUBCATEGORY_UPDATE",
        newValue: toJsonValue(dto),
      },
    });
    return updated;
  }

  async removeSubcategory(actor: AuthUser, id: string) {
    const existing = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Subcategoria nao encontrada");

    await this.prisma.subcategory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Subcategory",
        entityId: id,
        action: "SUBCATEGORY_SOFT_DELETE",
      },
    });
    return { success: true, message: "Subcategoria movida para a lixeira" };
  }
}
