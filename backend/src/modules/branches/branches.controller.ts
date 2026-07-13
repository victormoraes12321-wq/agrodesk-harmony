import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { BranchesService } from "./branches.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";

@ApiTags("Branches")
@ApiBearerAuth()
@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Criar filial/local (TI_ADMIN)" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar filiais/locais" })
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar filial/local por ID" })
  findById(@Param("id") id: string) {
    return this.branchesService.findById(id);
  }

  @Patch(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Editar filial/local (TI_ADMIN)" })
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(user, id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Excluir filial/local (TI_ADMIN)" })
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.branchesService.remove(user, id);
  }
}
