import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { TicketPriority } from "@prisma/client";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateSlaPolicyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiProperty({ default: 24 })
  @IsInt()
  @Min(1)
  targetHours!: number;

  @ApiPropertyOptional({ default: 120 })
  @IsInt()
  @Min(1)
  @IsOptional()
  nearExpireThresholdMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
