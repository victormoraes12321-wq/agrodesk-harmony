const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src', 'modules');

const filesToGenerate = {
  // --- SUPPLIERS ---
  'suppliers/dto/create-supplier.dto.ts': `
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
  `,
  'suppliers/dto/update-supplier.dto.ts': `
import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
  `,
  'suppliers/suppliers.service.ts': `
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  create(createSupplierDto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: createSupplierDto });
  }

  findAll() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: updateSupplierDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.delete({ where: { id } });
  }
}
  `,
  'suppliers/suppliers.controller.ts': `
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TI_ADMIN)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
  `,

  // --- ASSET TYPES ---
  'asset-types/dto/create-asset-type.dto.ts': `
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAssetTypeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
  `,
  'asset-types/dto/update-asset-type.dto.ts': `
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetTypeDto } from './create-asset-type.dto';

export class UpdateAssetTypeDto extends PartialType(CreateAssetTypeDto) {}
  `,
  'asset-types/asset-types.service.ts': `
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';

@Injectable()
export class AssetTypesService {
  constructor(private prisma: PrismaService) {}

  create(createAssetTypeDto: CreateAssetTypeDto) {
    return this.prisma.assetType.create({ data: createAssetTypeDto });
  }

  findAll() {
    return this.prisma.assetType.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const assetType = await this.prisma.assetType.findUnique({ where: { id } });
    if (!assetType) throw new NotFoundException('AssetType not found');
    return assetType;
  }

  async update(id: string, updateAssetTypeDto: UpdateAssetTypeDto) {
    await this.findOne(id);
    return this.prisma.assetType.update({ where: { id }, data: updateAssetTypeDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.assetType.delete({ where: { id } });
  }
}
  `,
  'asset-types/asset-types.controller.ts': `
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AssetTypesService } from './asset-types.service';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('asset-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TI_ADMIN)
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Post()
  create(@Body() createAssetTypeDto: CreateAssetTypeDto) {
    return this.assetTypesService.create(createAssetTypeDto);
  }

  @Get()
  findAll() {
    return this.assetTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetTypeDto: UpdateAssetTypeDto) {
    return this.assetTypesService.update(id, updateAssetTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetTypesService.remove(id);
  }
}
  `,

  // --- ASSETS ---
  'assets/dto/create-asset.dto.ts': `
import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  assetTypeId: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
  `,
  'assets/dto/update-asset.dto.ts': `
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}
  `,
  'assets/assets.service.ts': `
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
    
    return \`ATV-\${nextNum.toString().padStart(6, '0')}\`;
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
    const where: any = {};
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
    // Realizar exclusão lógica mudando o status para BAIXADO ou deletar mesmo
    const deletedAsset = await this.prisma.asset.update({
      where: { id },
      data: { status: 'BAIXADO' }
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
    const total = await this.prisma.asset.count();
    const inUse = await this.prisma.asset.count({ where: { status: 'EM_USO' } });
    const inMaintenance = await this.prisma.asset.count({ where: { status: 'MANUTENCAO' } });
    const inStock = await this.prisma.asset.count({ where: { status: 'ESTOQUE' } });
    
    const valueAggregation = await this.prisma.asset.aggregate({
      _sum: {
        value: true
      }
    });
    
    const byType = await this.prisma.asset.groupBy({
      by: ['assetTypeId'],
      _count: {
        id: true,
      },
    });
    
    const types = await this.prisma.assetType.findMany();
    const typesMap = types.reduce((acc, curr) => ({...acc, [curr.id]: curr.name}), {});
    
    const byTypeData = byType.map(item => ({
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
  `,
  'assets/assets.controller.ts': `
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(UserRole.TI_ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createAssetDto: CreateAssetDto, @CurrentUser() user: any) {
    return this.assetsService.create(createAssetDto, user.userId);
  }

  @Get('dashboard')
  @Roles(UserRole.TI_ADMIN)
  @UseGuards(RolesGuard)
  getDashboardStats() {
    return this.assetsService.getDashboardStats();
  }

  @Get()
  @Roles(UserRole.TI_ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() filters: any) {
    return this.assetsService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.TI_ADMIN, UserRole.SOLICITANTE)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TI_ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto, @CurrentUser() user: any) {
    return this.assetsService.update(id, updateAssetDto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.TI_ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assetsService.remove(id, user.userId);
  }
}
  `,

  // --- ASSET MOVEMENTS ---
  'asset-movements/dto/create-asset-movement.dto.ts': `
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AssetMovementType } from '@prisma/client';

export class CreateAssetMovementDto {
  @IsString()
  assetId: string;

  @IsEnum(AssetMovementType)
  type: AssetMovementType;

  @IsString()
  @IsOptional()
  fromDepartmentId?: string;

  @IsString()
  @IsOptional()
  toDepartmentId?: string;

  @IsString()
  @IsOptional()
  fromBranchId?: string;

  @IsString()
  @IsOptional()
  toBranchId?: string;

  @IsString()
  @IsOptional()
  fromUserId?: string;

  @IsString()
  @IsOptional()
  toUserId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
  `,
  'asset-movements/dto/update-asset-movement.dto.ts': `
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetMovementDto } from './create-asset-movement.dto';

export class UpdateAssetMovementDto extends PartialType(CreateAssetMovementDto) {}
  `,
  'asset-movements/asset-movements.service.ts': `
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
    const movement = await this.prisma.assetMovement.create({
      data: {
        ...createAssetMovementDto,
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
    } else if (movement.type === 'EMPRESTIMO' || movement.type === 'TRANSFERENCIA') {
       updateData.status = 'EM_USO';
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.asset.update({
        where: { id: movement.assetId },
        data: updateData
      });
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
  `,
  'asset-movements/asset-movements.controller.ts': `
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AssetMovementsService } from './asset-movements.service';
import { CreateAssetMovementDto } from './dto/create-asset-movement.dto';
import { UpdateAssetMovementDto } from './dto/update-asset-movement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('asset-movements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TI_ADMIN)
export class AssetMovementsController {
  constructor(private readonly assetMovementsService: AssetMovementsService) {}

  @Post()
  create(@Body() createAssetMovementDto: CreateAssetMovementDto, @CurrentUser() user: any) {
    return this.assetMovementsService.create(createAssetMovementDto, user.userId);
  }

  @Get()
  findAll() {
    return this.assetMovementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetMovementsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetMovementDto: UpdateAssetMovementDto) {
    return this.assetMovementsService.update(id, updateAssetMovementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetMovementsService.remove(id);
  }
}
  `,

  // --- ASSET MAINTENANCES ---
  'asset-maintenances/dto/create-asset-maintenance.dto.ts': `
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { AssetMaintenanceType } from '@prisma/client';

export class CreateAssetMaintenanceDto {
  @IsString()
  assetId: string;

  @IsEnum(AssetMaintenanceType)
  type: AssetMaintenanceType;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  description: string;

  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;
}
  `,
  'asset-maintenances/dto/update-asset-maintenance.dto.ts': `
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetMaintenanceDto } from './create-asset-maintenance.dto';

export class UpdateAssetMaintenanceDto extends PartialType(CreateAssetMaintenanceDto) {}
  `,
  'asset-maintenances/asset-maintenances.service.ts': `
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetMaintenanceDto } from './dto/create-asset-maintenance.dto';
import { UpdateAssetMaintenanceDto } from './dto/update-asset-maintenance.dto';

@Injectable()
export class AssetMaintenancesService {
  constructor(private prisma: PrismaService) {}

  async create(createAssetMaintenanceDto: CreateAssetMaintenanceDto) {
    const maintenance = await this.prisma.assetMaintenance.create({
      data: createAssetMaintenanceDto
    });

    // Se for corretiva ou preventiva, pode querer mudar o status do ativo para MANUTENCAO,
    // mas isso pode ser manual via Asset update. Vamos manter simples.

    return maintenance;
  }

  findAll() {
    return this.prisma.assetMaintenance.findMany({
      include: { asset: true },
      orderBy: { date: 'desc' }
    });
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.assetMaintenance.findUnique({
      where: { id },
      include: { asset: true }
    });
    if (!maintenance) throw new NotFoundException('Maintenance not found');
    return maintenance;
  }

  update(id: string, updateAssetMaintenanceDto: UpdateAssetMaintenanceDto) {
    return this.prisma.assetMaintenance.update({
      where: { id },
      data: updateAssetMaintenanceDto
    });
  }

  remove(id: string) {
    return this.prisma.assetMaintenance.delete({ where: { id } });
  }
}
  `,
  'asset-maintenances/asset-maintenances.controller.ts': `
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AssetMaintenancesService } from './asset-maintenances.service';
import { CreateAssetMaintenanceDto } from './dto/create-asset-maintenance.dto';
import { UpdateAssetMaintenanceDto } from './dto/update-asset-maintenance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('asset-maintenances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TI_ADMIN)
export class AssetMaintenancesController {
  constructor(private readonly assetMaintenancesService: AssetMaintenancesService) {}

  @Post()
  create(@Body() createAssetMaintenanceDto: CreateAssetMaintenanceDto) {
    return this.assetMaintenancesService.create(createAssetMaintenanceDto);
  }

  @Get()
  findAll() {
    return this.assetMaintenancesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetMaintenancesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetMaintenanceDto: UpdateAssetMaintenanceDto) {
    return this.assetMaintenancesService.update(id, updateAssetMaintenanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetMaintenancesService.remove(id);
  }
}
  `,
};

for (const [relativePath, content] of Object.entries(filesToGenerate)) {
  const fullPath = path.join(modulesDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf-8');
}

console.log('Backend CRUDs generated successfully!');
