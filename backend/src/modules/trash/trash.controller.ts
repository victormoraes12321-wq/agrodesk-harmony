import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TrashService, TrashEntityType } from "./trash.service";

@ApiTags("trash")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TI_ADMIN)
@Controller("trash")
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get()
  @ApiOperation({ summary: "Listar todos os itens da lixeira" })
  async listAllTrash() {
    return this.trashService.listAllTrash();
  }

  @Post("restore")
  @ApiOperation({ summary: "Restaurar um item da lixeira" })
  async restoreItem(@Body() body: { entityType: TrashEntityType; id: string }) {
    return this.trashService.restoreItem(body.entityType, body.id);
  }

  @Delete("purge")
  @ApiOperation({ summary: "Excluir permanentemente um item" })
  async purgeItem(@Body() body: { entityType: TrashEntityType; id: string }) {
    return this.trashService.purgeItem(body.entityType, body.id);
  }
}
