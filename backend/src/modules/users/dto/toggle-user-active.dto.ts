import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class ToggleUserActiveDto {
  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}
