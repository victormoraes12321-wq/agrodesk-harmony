import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
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