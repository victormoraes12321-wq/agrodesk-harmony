import { Body, Controller, Get, Ip, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Login com e-mail e senha" })
  login(@Body() dto: LoginDto, @Ip() ip: string, @Req() req: Request) {
    const agentHeader = req.headers["user-agent"];
    const userAgent = Array.isArray(agentHeader) ? agentHeader[0] : agentHeader;
    return this.authService.login(dto, { ip, userAgent });
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Cadastro publico de novos solicitantes" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Renova token de acesso" })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @ApiOperation({ summary: "Revoga refresh token" })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retorna dados do usuario autenticado" })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.sub);
  }

  /**
   * Busca usuario pelo nome para confirmar identidade.
   * Endpoint publico — nao retorna dados sensiveis.
   */
  @Public()
  @Post("forgot-password-request")
  @ApiOperation({ summary: "Verifica usuario para redefinicao de senha" })
  forgotPasswordRequest(@Body() body: { username: string }) {
    return this.authService.forgotPasswordRequest(body.username);
  }

  /**
   * Cria OS automatica de redefinicao de senha.
   * Endpoint publico — apenas valida que o usuario existe e esta ativo.
   */
  @Public()
  @Post("forgot-password-os")
  @ApiOperation({ summary: "Cria OS automatica de redefinicao de senha" })
  forgotPasswordOs(@Body() body: { username: string }) {
    return this.authService.forgotPasswordOs(body.username);
  }
}
