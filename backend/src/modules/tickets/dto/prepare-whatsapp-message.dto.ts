import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class PrepareWhatsappMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  message!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  phoneUsed!: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsOptional()
  statusAtMoment?: TicketStatus;
}
