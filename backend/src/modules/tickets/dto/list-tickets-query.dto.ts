import { ApiPropertyOptional } from "@nestjs/swagger";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListTicketsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assigneeUserId?: string;

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
}
