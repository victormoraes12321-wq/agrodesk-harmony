import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class CreateAttachmentDto {
  @ApiPropertyOptional({ default: false })
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  @IsOptional()
  internal?: boolean;
}
