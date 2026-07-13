import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { ReportsService } from "./reports.service";
import { ReportsQueryDto } from "./dto/reports-query.dto";

@ApiTags("Reports")
@ApiBearerAuth()
@Roles(UserRole.TI_ADMIN)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("overview")
  @ApiOperation({ summary: "Relatorio completo (TI_ADMIN)" })
  overview(@Query() query: ReportsQueryDto) {
    return this.reportsService.getOverview(query);
  }

  @Get("by-period")
  @ApiOperation({ summary: "Chamados por periodo (TI_ADMIN)" })
  async byPeriod(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byPeriod;
  }

  @Get("by-department")
  @ApiOperation({ summary: "Chamados por setor (TI_ADMIN)" })
  async byDepartment(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byDepartment;
  }

  @Get("by-branch")
  @ApiOperation({ summary: "Chamados por filial/local (TI_ADMIN)" })
  async byBranch(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byBranch;
  }

  @Get("by-category")
  @ApiOperation({ summary: "Chamados por categoria (TI_ADMIN)" })
  async byCategory(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byCategory;
  }

  @Get("by-assignee")
  @ApiOperation({ summary: "Chamados por responsavel (TI_ADMIN)" })
  async byAssignee(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byAssignee;
  }

  @Get("by-priority")
  @ApiOperation({ summary: "Chamados por prioridade (TI_ADMIN)" })
  async byPriority(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byPriority;
  }

  @Get("by-status")
  @ApiOperation({ summary: "Chamados por status (TI_ADMIN)" })
  async byStatus(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.byStatus;
  }

  @Get("sla")
  @ApiOperation({ summary: "SLA cumprido vs vencido (TI_ADMIN)" })
  async sla(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.sla;
  }

  @Get("average-time")
  @ApiOperation({ summary: "Tempo medio de atendimento (TI_ADMIN)" })
  async averageTime(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return { avgResolutionMinutes: data.avgResolutionMinutes };
  }

  @Get("ratings")
  @ApiOperation({ summary: "Avaliacoes (TI_ADMIN)" })
  async ratings(@Query() query: ReportsQueryDto) {
    const data = await this.reportsService.getOverview(query);
    return data.ratings;
  }

  @Get("recurring-problems")
  @ApiOperation({ summary: "Problemas recorrentes (TI_ADMIN)" })
  recurringProblems(@Query() query: ReportsQueryDto) {
    return this.reportsService.getRecurringProblems(query);
  }
}
