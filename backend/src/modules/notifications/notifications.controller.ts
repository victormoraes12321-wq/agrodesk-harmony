import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Listar notificacoes do usuario autenticado" })
  mine(@CurrentUser() user: AuthUser) {
    return this.notificationsService.listMine(user.sub);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Marcar notificacao como lida" })
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Marcar todas como lidas" })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.sub);
  }
}
