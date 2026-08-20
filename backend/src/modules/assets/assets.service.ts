import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService
  ) {}

  async generateAssetCode(): Promise<string> {
    const lastAsset = await this.prisma.asset.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });
    
    let nextNum = 1;
    if (lastAsset && lastAsset.code && lastAsset.code.startsWith('ATV-')) {
      const numPart = parseInt(lastAsset.code.replace('ATV-', ''), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }
    
    return `ATV-${nextNum.toString().padStart(6, '0')}`;
  }

  async create(createAssetDto: CreateAssetDto, userId: string) {
    const code = await this.generateAssetCode();
    
    const asset = await this.prisma.asset.create({
      data: {
        ...createAssetDto,
        code,
      },
    });

    await this.auditLogsService.createLog({
      action: 'CREATE',
      entity: 'Asset',
      entityId: asset.id,
      newValue: asset,
      userId: userId,
    });

    return asset;
  }

  findAll(filters?: any) {
    const where: any = { deletedAt: null };
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.assetTypeId) where.assetTypeId = filters.assetTypeId;
      if (filters.departmentId) where.departmentId = filters.departmentId;
      if (filters.branchId) where.branchId = filters.branchId;
      if (filters.supplierId) where.supplierId = filters.supplierId;
      if (filters.userId) where.userId = filters.userId;
    }

    return this.prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        department: true,
        branch: true,
        supplier: true,
        user: true,
        parent: true,
        components: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        assetType: true,
        department: true,
        branch: true,
        supplier: true,
        user: true,
        parent: true,
        components: true,
        movements: {
          include: { fromUser: true, toUser: true, fromDepartment: true, toDepartment: true, registeredBy: true },
          orderBy: { date: 'desc' }
        },
        maintenances: {
          orderBy: { date: 'desc' }
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
    const oldAsset = await this.findOne(id);
    
    const updatedAsset = await this.prisma.asset.update({
      where: { id },
      data: updateAssetDto,
    });

    // Propagate location changes to components if this is a parent asset
    const parentLocationFields: any = {};
    if (updateAssetDto.branchId !== undefined) parentLocationFields.branchId = updateAssetDto.branchId;
    if (updateAssetDto.departmentId !== undefined) parentLocationFields.departmentId = updateAssetDto.departmentId;
    if (updateAssetDto.userId !== undefined) parentLocationFields.userId = updateAssetDto.userId;

    if (Object.keys(parentLocationFields).length > 0) {
      await this.prisma.asset.updateMany({
        where: { parentId: id },
        data: parentLocationFields,
      });
    }

    await this.auditLogsService.createLog({
      action: 'UPDATE',
      entity: 'Asset',
      entityId: id,
      oldValue: oldAsset,
      newValue: updatedAsset,
      userId: userId,
    });

    return updatedAsset;
  }

  async remove(id: string, userId: string) {
    const oldAsset = await this.findOne(id);
    const deletedAsset = await this.prisma.asset.update({
      where: { id },
      data: { status: 'BAIXADO', deletedAt: new Date() }
    });

    await this.auditLogsService.createLog({
      action: 'DELETE',
      entity: 'Asset',
      entityId: id,
      oldValue: oldAsset,
      userId: userId,
    });

    return deletedAsset;
  }
  
  async getDashboardStats() {
    const total = await this.prisma.asset.count({ where: { deletedAt: null } });
    const inUse = await this.prisma.asset.count({ where: { status: 'EM_USO', deletedAt: null } });
    const inMaintenance = await this.prisma.asset.count({ where: { status: 'MANUTENCAO', deletedAt: null } });
    const inStock = await this.prisma.asset.count({ where: { status: 'ESTOQUE', deletedAt: null } });
    
    const valueAggregation = await this.prisma.asset.aggregate({
      where: { deletedAt: null },
      _sum: {
        value: true
      }
    });
    
    const byType = await this.prisma.asset.groupBy({
      by: ['assetTypeId'],
      where: { deletedAt: null },
      _count: {
        id: true,
      },
    });
    
    const types = await this.prisma.assetType.findMany();
    const typesMap = types.reduce((acc: Record<string, string>, curr: any) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {});
    
    const byTypeData = byType.map((item: any) => ({
      name: typesMap[item.assetTypeId] || 'Desconhecido',
      value: item._count.id
    }));

    return {
      total,
      inUse,
      inMaintenance,
      inStock,
      totalValue: valueAggregation._sum.value || 0,
      byTypeData
    };
  }
}