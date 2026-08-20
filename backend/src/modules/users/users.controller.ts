import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ToggleUserActiveDto } from "./dto/toggle-user-active.dto";
import { UpdateMyProfileDto } from "./dto/update-my-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AdminResetPasswordDto } from "./dto/admin-reset-password.dto";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Criar usuario (TI_ADMIN)" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @Get()
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Listar usuarios (TI_ADMIN)" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Buscar usuario por ID (TI_ADMIN)" })
  findById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Patch(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Editar usuario (TI_ADMIN)" })
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user, id, dto);
  }

  @Patch(":id/active")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Ativar/Inativar usuario (TI_ADMIN)" })
  setActive(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ToggleUserActiveDto,
  ) {
    return this.usersService.setActive(user, id, dto);
  }

  @Patch(":id/reset-password")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Redefinir senha de usuario (TI_ADMIN)" })
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.resetPassword(user, id, dto);
  }

  @Patch("me/profile")
  @ApiOperation({ summary: "Editar meus dados basicos" })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Patch("me/password")
  @ApiOperation({ summary: "Alterar minha senha" })
  changeMyPassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto);
  }

  @Delete(":id")
  @Roles(UserRole.TI_ADMIN)
  @ApiOperation({ summary: "Excluir/Mover para lixeira (TI_ADMIN)" })
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.usersService.remove(user, id);
  }
}
