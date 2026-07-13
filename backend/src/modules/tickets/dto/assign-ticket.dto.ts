import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class AssignTicketDto {
  @ApiPropertyOptional({
    description: "ID do usuario TI responsavel. Envie nulo/omitido para remover atribuicao.",
  })
  @IsString()
  @IsOptional()
  assigneeUserId?: string | null;
}
