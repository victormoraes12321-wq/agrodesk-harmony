import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateTechnicalDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  solution?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  partsUsed?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  timeSpentMinutes?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resolutionSummary?: string;
}
