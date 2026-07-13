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