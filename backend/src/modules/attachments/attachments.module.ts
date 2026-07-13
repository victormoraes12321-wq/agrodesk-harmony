import { Module } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import { AttachmentsController } from "./attachments.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [NotificationsModule, SettingsModule],
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
})
export class AttachmentsModule {}
