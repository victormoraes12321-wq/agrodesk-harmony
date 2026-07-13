import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actorUserId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
