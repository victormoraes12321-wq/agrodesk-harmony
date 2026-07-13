import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { AssetMaintenanceType } from '@prisma/client';

export class CreateAssetMaintenanceDto {
  @IsString()
  assetId!: string;

  @IsEnum(AssetMaintenanceType)
  type!: AssetMaintenanceType;

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
  description!: string;

  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;
}