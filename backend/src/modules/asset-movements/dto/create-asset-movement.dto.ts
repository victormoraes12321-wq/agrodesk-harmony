import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AssetMovementType } from '@prisma/client';

export class CreateAssetMovementDto {
  @IsString()
  assetId!: string;

  @IsEnum(AssetMovementType)
  type!: AssetMovementType;

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

  @IsString()
  @IsOptional()
  parentId?: string;
}