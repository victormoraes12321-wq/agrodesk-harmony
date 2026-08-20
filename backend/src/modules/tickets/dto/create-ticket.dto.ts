import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketPriority } from "@prisma/client";
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  requesterName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  requesterPhone!: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  requesterEmail?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  suggestedPriority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  realPriority?: TicketPriority;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  customSlaHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  equipmentName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assetTag?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredServiceTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  impactDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  additionalNotes?: string;

  @ApiPropertyOptional({ description: "ID do usuário solicitante (quando aberto por TI_ADMIN em nome de outro)" })
  @IsString()
  @IsOptional()
  targetUserId?: string;

  @ApiPropertyOptional({ description: "Se true, encerra o chamado imediatamente como Atendimento Rápido" })
  @IsOptional()
  resolveImmediately?: boolean;

  @ApiPropertyOptional({ description: "Nota ou solução aplicada no Atendimento Rápido" })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
