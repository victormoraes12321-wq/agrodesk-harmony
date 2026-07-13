import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketPriority } from "@prisma/client";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsEnum(TicketPriority)
  @IsOptional()
  defaultPriority?: TicketPriority;

  @ApiPropertyOptional({ default: 24 })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultSlaHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(50)
  @IsOptional()
  subcategories?: string[];
}
