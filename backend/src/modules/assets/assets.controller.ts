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