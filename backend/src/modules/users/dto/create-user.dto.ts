import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: "O nome completo é obrigatório" })
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: "O nome de usuário é obrigatório" })
  username!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.SOLICITANTE })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  extension?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: "Permite atribuir OS ao usuario quando ele pertence a equipe operacional de TI",
  })
  @IsBoolean()
  @IsOptional()
  canReceiveTickets?: boolean;
}
