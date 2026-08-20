import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@ApiTags("Departments")
@ApiBearerAuth()
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Criar setor (TI_ADMIN)" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(user, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Listar setores" })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar setor por ID" })
  findById(@Param("id") id: string) {
    return this.departmentsService.findById(id);
  }

  @Patch(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Editar setor (TI_ADMIN)" })
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(user, id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Excluir setor (TI_ADMIN)" })
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.departmentsService.remove(user, id);
  }
}
