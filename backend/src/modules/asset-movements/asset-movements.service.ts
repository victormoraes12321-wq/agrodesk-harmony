import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateAssetMovementDto } from './dto/create-asset-movement.dto';
import { UpdateAssetMovementDto } from './dto/update-asset-movement.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AssetMovementsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService
  ) {}

  async create(createAssetMovementDto: CreateAssetMovementDto, userId: string) {
    const { parentId, ...movementData } = createAssetMovementDto;

    const movement = await this.prisma.assetMovement.create({
      data: {
        ...movementData,
        registeredById: userId
      }
    });

    // Update asset based on movement
    const updateData: any = {};
    if (movement.toDepartmentId) updateData.departmentId = movement.toDepartmentId;
    if (movement.toBranchId) updateData.branchId = movement.toBranchId;
    if (movement.toUserId) updateData.userId = movement.toUserId;
    
    if (movement.type === 'DEVOLUCAO') {
       updateData.userId = null;
       updateData.status = 'ESTOQUE';
       updateData.parentId = null; // Unlink parent if returned to stock!
    } else if (movement.type === 'EMPRESTIMO' || movement.type === 'TRANSFERENCIA') {
       updateData.status = 'EM_USO';
       if (parentId !== undefined) {
         updateData.parentId = parentId || null;
       }
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.asset.update({
        where: { id: movement.assetId },
        data: updateData
      });

      // Also propagate location/custodian changes to components!
      const componentUpdateData: any = {};
      if (updateData.branchId !== undefined) componentUpdateData.branchId = updateData.branchId;
      if (updateData.departmentId !== undefined) componentUpdateData.departmentId = updateData.departmentId;
      if (updateData.userId !== undefined) componentUpdateData.userId = updateData.userId;
      
      // For DEVOLUCAO, also unlink parent from all components!
      if (movement.type === 'DEVOLUCAO') {
        componentUpdateData.parentId = null;
      }

      if (Object.keys(componentUpdateData).length > 0) {
        await this.prisma.asset.updateMany({
          where: { parentId: movement.assetId },
          data: componentUpdateData
        });
      }
    }

    await this.auditLogsService.createLog({
      action: 'CREATE',
      entity: 'AssetMovement',
      entityId: movement.id,
      newValue: movement,
      userId: userId,
    });

    return movement;
  }

  findAll() {
    return this.prisma.assetMovement.findMany({
      include: {
        asset: true,
        fromDepartment: true,
        toDepartment: true,
        fromBranch: true,
        toBranch: true,
        fromUser: true,
        toUser: true,
        registeredBy: true
      },
      orderBy: { date: 'desc' }
    });
  }

  async findOne(id: string) {
    const movement = await this.prisma.assetMovement.findUnique({
      where: { id },
      include: {
        asset: true,
        fromDepartment: true,
        toDepartment: true,
        fromBranch: true,
        toBranch: true,
        fromUser: true,
        toUser: true,
        registeredBy: true
      }
    });
    if (!movement) throw new NotFoundException('Movement not found');
    return movement;
  }

  update(id: string, updateAssetMovementDto: UpdateAssetMovementDto) {
    return this.prisma.assetMovement.update({
      where: { id },
      data: updateAssetMovementDto
    });
  }

  remove(id: string) {
    return this.prisma.assetMovement.delete({ where: { id } });
  }
}