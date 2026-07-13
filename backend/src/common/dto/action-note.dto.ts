import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ActionNoteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}
