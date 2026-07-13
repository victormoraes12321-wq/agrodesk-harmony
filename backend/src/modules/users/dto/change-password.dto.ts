import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  newPassword!: string;
}
