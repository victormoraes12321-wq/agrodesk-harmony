import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "victor" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "SuaSenhaPessoal" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
