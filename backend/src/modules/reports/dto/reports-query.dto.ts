import { ApiPropertyOptional } from "@nestjs/swagger";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class ReportsQueryDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assigneeUserId?: string;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
