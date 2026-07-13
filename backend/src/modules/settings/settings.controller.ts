import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@ApiTags("Settings")
@ApiBearerAuth()
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Consultar configuracoes globais" })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Atualizar configuracoes globais (TI_ADMIN)" })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(user, dto);
  }
}
