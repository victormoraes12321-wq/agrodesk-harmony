import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "node:path";
import { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { resolveUploadDir } from "../../infra/storage/storage.util";
import { AttachmentsService } from "./attachments.service";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";

const uploadDir = resolveUploadDir();
const UPLOAD_MAX_MB = Number(process.env.UPLOAD_MAX_MB ?? 10);
const UPLOAD_MAX_BYTES = Math.max(1, UPLOAD_MAX_MB) * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".dll",
  ".com",
  ".scr",
  ".vbs",
  ".pif",
  ".gadget",
  ".application",
]);

@ApiTags("Attachments")
@ApiBearerAuth()
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get("tickets/:ticketId/attachments")
  @ApiOperation({ summary: "Listar anexos da OS (SOLICITANTE nao ve internos)" })
  list(@CurrentUser() user: AuthUser, @Param("ticketId") ticketId: string) {
    return this.attachmentsService.list(user, ticketId);
  }

  @Post("tickets/:ticketId/attachments")
  @ApiOperation({ summary: "Upload de anexo na OS" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        internal: { type: "boolean" },
      },
      required: ["file"],
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${name}${ext}`);
        },
      }),
      limits: { fileSize: UPLOAD_MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (BLOCKED_EXTENSIONS.has(ext)) {
          cb(new BadRequestException("Arquivos executáveis não são permitidos por segurança.") as unknown as Error, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param("ticketId") ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.attachmentsService.upload(user, ticketId, file, {
      internal: String(dto.internal) === "true" || dto.internal === true,
    });
  }

  @Get("attachments/:id/download")
  @ApiOperation({ summary: "Download de anexo com controle de permissao" })
  async download(@CurrentUser() user: AuthUser, @Param("id") id: string, @Res() res: Response) {
    const attachment = await this.attachmentsService.getDownload(user, id);
    return res.download(attachment.path, attachment.originalName);
  }
}
