import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
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