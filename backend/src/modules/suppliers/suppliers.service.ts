import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
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