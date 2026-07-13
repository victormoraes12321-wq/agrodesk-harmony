import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}
