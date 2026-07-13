import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  internal?: boolean;
}
