import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultSlaHours?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  uploadLimitMb?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itContactName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  itContactEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itContactPhone?: string;
}
