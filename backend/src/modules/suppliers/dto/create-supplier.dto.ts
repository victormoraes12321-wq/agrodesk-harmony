import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name!: string;

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