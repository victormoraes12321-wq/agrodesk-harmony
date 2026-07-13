import { Module } from "@nestjs/common";
import { SlaService } from "./sla.service";
import { SlaController } from "./sla.controller";
import { SettingsModule } from "../settings/settings.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [SettingsModule, NotificationsModule],
  providers: [SlaService],
  controllers: [SlaController],
  exports: [SlaService],
})
export class SlaModule {}
