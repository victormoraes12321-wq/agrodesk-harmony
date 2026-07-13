import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  name!: string;

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
  assetTypeId!: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  hostname?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}