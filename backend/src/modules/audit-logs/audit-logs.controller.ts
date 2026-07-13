import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuditLogsService } from "./audit-logs.service";
import { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

@ApiTags("Audit Logs")
@ApiBearerAuth()
@Roles(UserRole.TI_ADMIN)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: "Listar trilha de auditoria (TI_ADMIN)" })
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsService.list(query);
  }
}
