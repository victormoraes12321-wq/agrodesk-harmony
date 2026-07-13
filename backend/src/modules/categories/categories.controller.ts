import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";
import { UpdateSubcategoryDto } from "./dto/update-subcategory.dto";

@ApiTags("Categories")
@ApiBearerAuth()
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Criar categoria (TI_ADMIN)" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar categorias" })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar categoria por ID" })
  findById(@Param("id") id: string) {
    return this.categoriesService.findById(id);
  }

  @Patch(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Editar categoria (TI_ADMIN)" })
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user, id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Excluir categoria (TI_ADMIN)" })
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.categoriesService.remove(user, id);
  }

  @Post(":id/subcategories")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Criar subcategoria (TI_ADMIN)" })
  createSubcategory(
    @CurrentUser() user: AuthUser,
    @Param("id") categoryId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.categoriesService.createSubcategory(user, categoryId, dto);
  }

  @Patch("subcategories/:id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Editar subcategoria (TI_ADMIN)" })
  updateSubcategory(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.categoriesService.updateSubcategory(user, id, dto);
  }

  @Delete("subcategories/:id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Excluir subcategoria (TI_ADMIN)" })
  removeSubcategory(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.categoriesService.removeSubcategory(user, id);
  }
}
