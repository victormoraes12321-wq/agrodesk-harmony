import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { ActionNoteDto } from "../../common/dto/action-note.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { TicketsService } from "./tickets.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { ListTicketsQueryDto } from "./dto/list-tickets-query.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { AssignTicketDto } from "./dto/assign-ticket.dto";
import { UpdatePriorityDto } from "./dto/update-priority.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { UpdateTechnicalDto } from "./dto/update-technical.dto";
import { UpdateSlaDto } from "./dto/update-sla.dto";
import { RateTicketDto } from "./dto/rate-ticket.dto";
import { PrepareWhatsappMessageDto } from "./dto/prepare-whatsapp-message.dto";

@ApiTags("Tickets")
@ApiBearerAuth()
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: "Criar OS" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar OS (SOLICITANTE ve apenas as proprias)" })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListTicketsQueryDto) {
    return this.ticketsService.findAll(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar OS por ID com filtro de permissao" })
  findById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.ticketsService.findById(user, id);
  }

  @Patch(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Editar OS (TI_ADMIN)" })
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(user, id, dto);
  }

  @Patch(":id/assignee")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Definir responsavel (TI_ADMIN)" })
  assign(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AssignTicketDto) {
    return this.ticketsService.assign(user, id, dto);
  }

  @Patch(":id/priority")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Alterar prioridade real (TI_ADMIN)" })
  updatePriority(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePriorityDto,
  ) {
    return this.ticketsService.updatePriority(user, id, dto);
  }

  @Patch(":id/status")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Alterar status (TI_ADMIN)" })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.ticketsService.updateStatus(user, id, dto);
  }

  @Patch(":id/technical")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Registrar diagnostico/solucao/causa/tempo (TI_ADMIN)" })
  updateTechnical(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateTechnicalDto,
  ) {
    return this.ticketsService.updateTechnical(user, id, dto);
  }

  @Patch(":id/sla")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Alterar SLA manualmente (TI_ADMIN)" })
  updateSla(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateSlaDto) {
    return this.ticketsService.updateSla(user, id, dto);
  }

  @Post(":id/resolve")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Resolver OS (TI_ADMIN)" })
  resolve(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ActionNoteDto) {
    return this.ticketsService.resolve(user, id, dto.note);
  }

  @Post(":id/finalize")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Finalizar OS (TI_ADMIN)" })
  finalize(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ActionNoteDto) {
    return this.ticketsService.finalize(user, id, dto.note);
  }

  @Post(":id/reopen")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Reabrir OS (TI_ADMIN)" })
  reopen(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ActionNoteDto) {
    return this.ticketsService.reopen(user, id, dto.note);
  }

  @Post(":id/cancel")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Cancelar OS (TI_ADMIN)" })
  cancel(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ActionNoteDto) {
    return this.ticketsService.cancel(user, id, dto.note);
  }

  @Post(":id/whatsapp-prepared")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({
    summary: "Registrar auditoria de mensagem preparada para WhatsApp (TI_ADMIN)",
  })
  registerWhatsappPrepared(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: PrepareWhatsappMessageDto,
  ) {
    return this.ticketsService.registerWhatsappPrepared(user, id, dto);
  }

  @Post(":id/rating")
  @ApiOperation({ summary: "Avaliar OS finalizada (somente solicitante dono)" })
  rate(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: RateTicketDto) {
    return this.ticketsService.rate(user, id, dto);
  }
}
