import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { toJsonValue } from "../../common/utils/json-value.util";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { MemoryCache } from "../../common/utils/cache.util";

@Injectable()
export class BranchesService {
  private readonly cache = new MemoryCache<any[]>(300000); // 5 minutes TTL
  private readonly cacheKey = "branches_all";

  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthUser, dto: CreateBranchDto) {
    const created = await this.prisma.branch.create({
      data: {
        name: dto.name,
        address: dto.city ?? "",
        isActive: dto.active ?? true,
      },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Branch",
        entityId: created.id,
        action: "BRANCH_CREATE",
        newValue: toJsonValue(dto),
      },
    });
    return created;
  }

  async findAll() {
    const cached = this.cache.get(this.cacheKey);
    if (cached) return cached;

    const data = await this.prisma.branch.findMany({ orderBy: { name: "asc" } });
    this.cache.set(this.cacheKey, data);
    return data;
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException("Filial/local nao encontrada");
    return branch;
  }

  async update(actor: AuthUser, id: string, dto: UpdateBranchDto) {
    await this.findById(id);
    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        address: dto.city ?? undefined,
        isActive: dto.active ?? undefined,
      },
    });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Branch",
        entityId: id,
        action: "BRANCH_UPDATE",
        newValue: toJsonValue(dto),
      },
    });
    return updated;
  }

  async remove(actor: AuthUser, id: string) {
    await this.findById(id);
    await this.prisma.branch.delete({ where: { id } });
    this.cache.clear();
    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Branch",
        entityId: id,
        action: "BRANCH_DELETE",
      },
    });
    return { success: true };
  }
}
