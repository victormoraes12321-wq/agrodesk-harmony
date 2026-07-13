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