import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";

@ApiTags("Comments")
@ApiBearerAuth()
@Controller("tickets/:ticketId/comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: "Listar comentarios de uma OS (SOLICITANTE nao ve internos)" })
  list(@CurrentUser() user: AuthUser, @Param("ticketId") ticketId: string) {
    return this.commentsService.list(user, ticketId);
  }

  @Post()
  @ApiOperation({ summary: "Criar comentario publico/interno em OS" })
  create(
    @CurrentUser() user: AuthUser,
    @Param("ticketId") ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user, ticketId, dto);
  }
}
