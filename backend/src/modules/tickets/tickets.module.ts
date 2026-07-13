import { Module } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { TicketsController } from "./tickets.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { SlaModule } from "../sla/sla.module";

@Module({
  imports: [NotificationsModule, SlaModule],
  providers: [TicketsService],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
