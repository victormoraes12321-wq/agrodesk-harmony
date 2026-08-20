import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, Min } from "class-validator";

export class UpdateSlaDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  slaHours?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  extendHours?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  slaDueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  reason?: string;
}
