import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "João da Silva" })
  @IsString()
  @IsNotEmpty({ message: "O nome completo é obrigatório" })
  name!: string;

  @ApiProperty({ example: "joao.silva" })
  @IsString()
  @IsNotEmpty({ message: "O nome de usuário é obrigatório" })
  username!: string;

  @ApiProperty({ example: "joao.silva@agrodesk.com", required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: "SuaSenhaSegura123", minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: "A senha é obrigatória" })
  @MinLength(8, { message: "A senha deve conter no mínimo 8 caracteres" })
  password!: string;

  @ApiProperty({ example: "department_id_here" })
  @IsString()
  @IsNotEmpty({ message: "O setor é obrigatório" })
  departmentId!: string;

  @ApiProperty({ example: "branch_id_here" })
  @IsString()
  @IsNotEmpty({ message: "A filial é obrigatória" })
  branchId!: string;

  @ApiProperty({ required: false, example: "(44) 99999-9999" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: "(44) 99999-9999" })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ required: false, example: "102" })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiProperty({ required: false, example: "Assistente Administrativo" })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
