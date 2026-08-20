import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type TrashEntityType =
  | "USER"
  | "DEPARTMENT"
  | "BRANCH"
  | "CATEGORY"
  | "SUBCATEGORY"
  | "ASSET"
  | "ASSET_TYPE"
  | "SUPPLIER";

@Injectable()
export class TrashService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllTrash() {
    const [users, departments, branches, categories, subcategories, assets, assetTypes, suppliers] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, username: true, email: true, role: true, deletedAt: true },
        }),
        this.prisma.department.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, description: true, deletedAt: true },
        }),
        this.prisma.branch.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, address: true, deletedAt: true },
        }),
        this.prisma.category.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, defaultPriority: true, defaultSlaHours: true, deletedAt: true },
        }),
        this.prisma.subcategory.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, categoryId: true, deletedAt: true },
        }),
        this.prisma.asset.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, code: true, name: true, status: true, deletedAt: true },
        }),
        this.prisma.assetType.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, deletedAt: true },
        }),
        this.prisma.supplier.findMany({
          where: { deletedAt: { not: null } },
          select: { id: true, name: true, cnpj: true, deletedAt: true },
        }),
      ]);

    return {
      users: users.map((u) => ({ ...u, entityType: "USER" })),
      departments: departments.map((d) => ({ ...d, entityType: "DEPARTMENT" })),
      branches: branches.map((b) => ({ ...b, entityType: "BRANCH" })),
      categories: categories.map((c) => ({ ...c, entityType: "CATEGORY" })),
      subcategories: subcategories.map((s) => ({ ...s, entityType: "SUBCATEGORY" })),
      assets: assets.map((a) => ({ ...a, entityType: "ASSET" })),
      assetTypes: assetTypes.map((at) => ({ ...at, entityType: "ASSET_TYPE" })),
      suppliers: suppliers.map((sup) => ({ ...sup, entityType: "SUPPLIER" })),
      totalCount:
        users.length +
        departments.length +
        branches.length +
        categories.length +
        subcategories.length +
        assets.length +
        assetTypes.length +
        suppliers.length,
    };
  }

  async restoreItem(entityType: TrashEntityType, id: string) {
    switch (entityType) {
      case "USER":
        return this.prisma.user.update({ where: { id }, data: { deletedAt: null } });
      case "DEPARTMENT":
        return this.prisma.department.update({ where: { id }, data: { deletedAt: null } });
      case "BRANCH":
        return this.prisma.branch.update({ where: { id }, data: { deletedAt: null } });
      case "CATEGORY":
        return this.prisma.category.update({ where: { id }, data: { deletedAt: null } });
      case "SUBCATEGORY":
        return this.prisma.subcategory.update({ where: { id }, data: { deletedAt: null } });
      case "ASSET":
        return this.prisma.asset.update({ where: { id }, data: { deletedAt: null } });
      case "ASSET_TYPE":
        return this.prisma.assetType.update({ where: { id }, data: { deletedAt: null } });
      case "SUPPLIER":
        return this.prisma.supplier.update({ where: { id }, data: { deletedAt: null } });
      default:
        throw new BadRequestException(`Tipo de entidade inválido: ${entityType}`);
    }
  }

  async purgeItem(entityType: TrashEntityType, id: string) {
    try {
      switch (entityType) {
        case "USER":
          return await this.prisma.user.delete({ where: { id } });
        case "DEPARTMENT":
          return await this.prisma.department.delete({ where: { id } });
        case "BRANCH":
          return await this.prisma.branch.delete({ where: { id } });
        case "CATEGORY":
          return await this.prisma.category.delete({ where: { id } });
        case "SUBCATEGORY":
          return await this.prisma.subcategory.delete({ where: { id } });
        case "ASSET":
          return await this.prisma.asset.delete({ where: { id } });
        case "ASSET_TYPE":
          return await this.prisma.assetType.delete({ where: { id } });
        case "SUPPLIER":
          return await this.prisma.supplier.delete({ where: { id } });
        default:
          throw new BadRequestException(`Tipo de entidade inválido: ${entityType}`);
      }
    } catch (e) {
      throw new BadRequestException("Não foi possível excluir permanentemente. O item pode possuir dependências vinculadas.");
    }
  }
}
