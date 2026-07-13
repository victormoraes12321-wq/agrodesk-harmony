import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { SlaService } from "./sla.service";
import { CreateSlaPolicyDto } from "./dto/create-sla-policy.dto";
import { UpdateSlaPolicyDto } from "./dto/update-sla-policy.dto";

@ApiTags("SLA")
@ApiBearerAuth()
@Roles(UserRole.TI_ADMIN)
@Controller("sla")
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get("policies")
  @ApiOperation({ summary: "Listar politicas de SLA (TI_ADMIN)" })
  findPolicies() {
    return this.slaService.findPolicies();
  }

  @Post("policies")
  @ApiOperation({ summary: "Criar politica de SLA (TI_ADMIN)" })
  createPolicy(@CurrentUser() user: AuthUser, @Body() dto: CreateSlaPolicyDto) {
    return this.slaService.createPolicy(user, dto);
  }

  @Patch("policies/:id")
  @ApiOperation({ summary: "Atualizar politica de SLA (TI_ADMIN)" })
  updatePolicy(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateSlaPolicyDto,
  ) {
    return this.slaService.updatePolicy(user, id, dto);
  }

  @Delete("policies/:id")
  @ApiOperation({ summary: "Excluir politica de SLA (TI_ADMIN)" })
  removePolicy(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.slaService.removePolicy(user, id);
  }

  @Get("overdue")
  @ApiOperation({ summary: "Listar OS com SLA vencido (TI_ADMIN)" })
  overdue() {
    return this.slaService.findOverdue();
  }

  @Get("near-expiry")
  @ApiOperation({ summary: "Listar OS proximas do vencimento SLA (TI_ADMIN)" })
  nearExpiry(@Query("minutes") minutes?: string) {
    const value = minutes ? Number(minutes) : 120;
    return this.slaService.findNearExpiry(Number.isFinite(value) ? value : 120);
  }

  @Post("scan-notifications")
  @ApiOperation({ summary: "Dispara notificacoes de SLA proximo/vencido (TI_ADMIN)" })
  scanNotifications(@Query("minutes") minutes?: string) {
    const value = minutes ? Number(minutes) : 120;
    return this.slaService.scanAndNotify(Number.isFinite(value) ? value : 120);
  }
}
